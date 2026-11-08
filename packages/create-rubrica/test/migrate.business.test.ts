import { describe, expect, it } from "vitest";
import { CORE_RECIPES } from "@rubrica/core";
import { convertV1 } from "../src/migrate/convert";
import { convertBusiness, convertContact, proposalContent, V1_BLOCK_ID, V1_CONSENT } from "../src/migrate/business";
import { schemaErrors, V2_TABLES } from "./convex-validate";
import { IDS, V1_RUBRICA_JSON, v1Export } from "./fixtures/v1-export";

const NOW = 1_800_000_000_000;
const input = () => v1Export();
const run = () => {
  const snap = input();
  return { snap, r: convertV1({ tables: snap.tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW }) };
};
const v1 = (snap: ReturnType<typeof input>, table: string, i = 0) => snap.tables[table]![i]!;

describe("dados de negócio da v1 → v2", () => {
  const { snap, r } = run();

  it("todo documento convertido vale no schema da v2 (o import recusaria)", () => {
    const tables = Object.keys(r.tables).filter((t) => V2_TABLES.includes(t));
    expect(tables).toEqual(expect.arrayContaining(["contactRequests", "testimonialSubmissions", "proposals", "proposalVersions", "proposalAcceptances", "contractTemplates", "checkouts", "aiResumes"]));
    for (const t of tables) expect(schemaErrors(t, r.tables[t]!), t).toEqual([]);
  });

  it("os ids e o número da tabela da v1 continuam (aiGeneratedResumes → aiResumes)", () => {
    expect(r.sources).toMatchObject({ proposals: "proposals", proposalAcceptances: "proposalAcceptances", checkouts: "checkouts", aiResumes: "aiGeneratedResumes", contactRequests: "contactRequests" });
    expect(r.tables.proposals!.map((p) => p._id)).toEqual(snap.tables.proposals!.map((p) => p._id));
    expect(r.tables.aiResumes![0]!._id).toBe(v1(snap, "aiGeneratedResumes")._id);
  });

  it("contatos: e-mail normalizado, respostas em detalhes, mensagem livre, consentimento anterior à v2, sem IP", () => {
    const [projeto, vaga] = r.tables.contactRequests!;
    expect(r.tables.contactRequests).toHaveLength(2);
    expect(projeto).toMatchObject({
      name: "Fulano",
      email: "fulano@exemplo.dev",
      phone: "+55 11 90000-0001",
      message: "Quero um app de agenda.",
      details: { tipo: "project", projectType: "webapp", budget: "medium", empresa: "Fulano Ltda", linkedin: "https://linkedin.com/in/fulano", origem: "case: App de agendamento" },
      status: "new",
      blockId: V1_BLOCK_ID,
      consent: { acceptedAt: v1(snap, "contactRequests").createdAt, ...V1_CONSENT },
    });
    expect(JSON.stringify(r.tables.contactRequests)).not.toContain("203.0.113.8");
    // "contatado" não existe na v2: vira lido, e a situação da v1 fica nos detalhes.
    expect(vaga).toMatchObject({ status: "read", message: "contractType: pj\nmodality: remote", details: { situacaoV1: "contacted", notas: "Respondi por e-mail." } });
    expect(r.report.dropped).toContainEqual({ table: "contactRequests", count: 1, reason: expect.stringMatching(/lixeira/) });
    expect(r.report.warnings.join(" ")).toMatch(/consentimento marcado como anterior à v2/);
    expect(r.report.warnings.join(" ")).toMatch(/cron de retenção/);
  });

  it("depoimentos enviados: publicado vira aprovado com o item; aprovado sem item volta para a fila; recusado sai; vídeo fica pendente", () => {
    const subs = r.tables.testimonialSubmissions!;
    expect(subs.map((s) => [s.name, s.status, s.testimonialId])).toEqual([
      ["Carlos", "approved", snap.tables.testimonials![0]!._id],
      ["Marta", "pending", undefined],
    ]);
    expect(subs[1]).toMatchObject({ email: "marta@exemplo.dev", quote: "Recomendo.", company: "Loja M", consent: V1_CONSENT_WITH(v1(snap, "testimonialSubmissions", 1).createdAt) });
    expect(r.pending.testimonialSubmissions!.map((s) => s.name)).toEqual(["Vídeo"]);
    expect(r.report.pending).toContainEqual({ table: "testimonialSubmissions", count: 1, reason: expect.stringMatching(/vídeo/) });
    expect(r.report.dropped).toContainEqual({ table: "testimonialSubmissions", count: 1, reason: expect.stringMatching(/recusados/) });
    expect(r.report.warnings.join(" ")).toMatch(/voltam para a fila/);
    expect(r.report.warnings.join(" ")).toMatch(/foto de 1 envio/);
  });

  it("propostas: traduções viram mapa por idioma, senha e contrato congelado ficam, autor vira createdBy", () => {
    const [aberta, aceita] = r.tables.proposals!;
    expect(aberta).toMatchObject({
      slug: "padaria-pao-bom",
      title: { "pt-BR": "Identidade visual", en: "Visual identity" },
      scope: [{ "pt-BR": "Logo", en: "Logo" }, { "pt-BR": "Cardápio", en: "Menu" }],
      timeline: [{ step: { "pt-BR": "Pesquisa" }, period: { "pt-BR": "1 semana" } }],
      paymentMethods: [{ "pt-BR": "PIX" }, { "pt-BR": "Boleto" }],
      conditions: [{ "pt-BR": "50% na entrada", en: "50% upfront" }],
      rescissionPolicy: {},
      scopePrices: [3000, 1000],
      originalValue: 4500,
      password: "pbkdf2:00aa:11bb",
      templateId: v1(snap, "contractTemplates")._id,
      createdBy: IDS.ana,
      version: 2,
    });
    expect(aberta).not.toHaveProperty("userId");
    expect(aberta).not.toHaveProperty("titleTranslations");
    expect(aceita).toMatchObject({ isAccepted: true, acceptedAt: v1(snap, "proposals", 1).acceptedAt, templateSnapshot: "Contrato congelado." });
  });

  it("versões: o conteúdo antigo sobre a proposta; a ilegível fica pendente", () => {
    expect(r.tables.proposalVersions).toHaveLength(1);
    const [ver] = r.tables.proposalVersions!;
    expect(ver).toMatchObject({ proposalId: v1(snap, "proposals")._id, version: 1, createdBy: IDS.ana });
    expect(ver!.content).toMatchObject({ title: { "pt-BR": "Identidade" }, investmentValue: 3500, scope: [{ "pt-BR": "Logo" }], clientName: "Padaria Pão Bom" });
    expect(r.pending.proposalVersions).toHaveLength(1);
  });

  it("sessões saem; o aceite vai idêntico (hash e prova), só sem a sessão", () => {
    expect(r.tables.proposalSessions).toBeUndefined();
    expect(r.report.dropped).toContainEqual({ table: "proposalSessions", count: 1, reason: expect.stringMatching(/expiram/) });
    const original = v1(snap, "proposalAcceptances");
    const [aceite] = r.tables.proposalAcceptances!;
    const { sessionId, ...rest } = original;
    expect(sessionId).toBeDefined();
    expect(aceite).toEqual(rest);
    expect(aceite!.contentHash).toBe(original.contentHash);
    expect(aceite!.contentSnapshot).toBe(original.contentSnapshot);
  });

  it("modelos de contrato: um padrão só, o editado por último", () => {
    expect(r.tables.contractTemplates!.map((t) => [t.name, t.isDefault])).toEqual([
      ["Contrato padrão", true],
      ["Contrato antigo", false],
    ]);
    expect(r.report.warnings.join(" ")).toMatch(/2 padrões/);
  });

  it("checkouts: estado e ids do Asaas preservados; pago continua pago; aviso do webhook para o aberto", () => {
    expect(r.tables.checkouts).toEqual(snap.tables.checkouts);
    expect(r.tables.checkouts!.map((c) => c.status)).toEqual(["paid", "payment_selected"]);
    expect(r.tables.checkouts![0]).toMatchObject({ asaasChargeId: "pay_000001", paidChargeId: "pay_000001", paidValue: 20000 });
    expect(r.report.warnings.join(" ")).toMatch(/1 com cobrança aberta.*\/webhooks\/asaas/);
  });

  it("currículos com IA: idioma da v1 → do site (en-US → en)", () => {
    expect(r.tables.aiResumes![0]).toMatchObject({ locale: "en", fitScore: 82, cvData: { name: "Bruna Lima" }, createdBy: IDS.ana });
  });

  it("relatório: as tabelas de negócio aparecem com a origem", () => {
    expect(r.report.tables).toEqual(expect.arrayContaining([{ v2: "aiResumes", from: "aiGeneratedResumes", count: 1 }, { v2: "proposals", from: "proposals", count: 2 }]));
  });
});

describe("casos de borda", () => {
  it("a conferência do schema pega campo faltando, campo a mais e tipo errado", () => {
    const errors = schemaErrors("aiResumes", [{ _id: "x", title: 1, locale: "en", jobDescription: "", fitScore: 1, fitComment: "", strengths: [], weaknesses: [], cvData: null, createdAt: 0, userId: "u" }]);
    expect(errors.join(" ")).toMatch(/title: esperava texto/);
    expect(errors.join(" ")).toMatch(/createdBy: obrigatório/);
    expect(errors.join(" ")).toMatch(/userId: campo fora do schema/);
  });

  it("sem tabelas de negócio na v1, não cria tabela vazia", () => {
    const b = convertBusiness({}, NOW);
    expect(b.tables).toEqual({});
    expect(b.report).toEqual({ tables: [], dropped: [], pending: [], warnings: [] });
  });

  it("contato sem respostas: mensagem vazia, status desconhecido vira novo", () => {
    const c = convertContact({ _id: "c1", _creationTime: 5, type: "networking", status: "estranho", answers: null, contactInfo: { name: " Ana ", email: "A@B.C" } });
    expect(c).toMatchObject({ name: "Ana", email: "a@b.c", message: "", status: "new", createdAt: 5, consent: { acceptedAt: 5 } });
  });

  it("proposta mínima continua válida no schema", () => {
    const p = proposalContent({ clientName: "X", title: "T", objective: "", scope: [], timeline: [], deliveryDate: "", investmentValue: 0, paymentMethods: [], conditions: [], rescissionPolicy: "" });
    expect(schemaErrors("proposalVersions", [{ proposalId: "p", version: 1, content: p, createdAt: 0 }])).toEqual([]);
  });
});

function V1_CONSENT_WITH(acceptedAt: number) {
  return { acceptedAt, ...V1_CONSENT };
}
