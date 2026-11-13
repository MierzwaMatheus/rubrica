// @vitest-environment edge-runtime
/**
 * Propostas e modelos de contrato (port dos testes da v1 em tests/convex/proposals.test.ts
 * e contractTemplates.test.ts, agora rodando as funções de verdade no convex-test).
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { Id } from "../../../src/convex/server";
import { as, seedSettings, setup, type T } from "../_setup";
import { DEFAULT_CONTRACT_TEMPLATE } from "../../../src/convex/commerce/lib/defaultContract";
import { ACCEPTANCE, PROPOSAL, api, internal, notifications, post } from "./_commerce";

type Client = Awaited<ReturnType<typeof as>>;

let t: T;
let root: Client;

beforeEach(async () => {
  t = setup();
  await seedSettings(t);
  root = await as(t, "root");
});

async function createProposal(extra: Record<string, unknown> = {}) {
  const id = await root.mutation(api.rubrica.proposals.create, { ...PROPOSAL, ...extra } as never);
  const doc = await t.run((ctx) => ctx.db.get(id));
  return { id, slug: doc!.slug, doc: doc! };
}

async function openSession(slug: string, password: string) {
  const res = await post(t, "/api/proposal/session", { slug, password });
  return { status: res.status, body: (await res.json()) as { token?: string; error?: string } };
}

describe("propostas: criação e edição", () => {
  it("cria na versão 1, sem aceite, com validade de 10 dias e slug gerado", async () => {
    const before = Date.now();
    const { doc } = await createProposal();
    expect(doc.version).toBe(1);
    expect(doc.isAccepted).toBe(false);
    expect(doc.expiresAt).toBeGreaterThanOrEqual(before + 10 * 24 * 60 * 60 * 1000 - 5000);
    expect(doc.slug).toMatch(/^cliente-exemplo-[a-z0-9]{8}$/);
    expect(doc.title).toEqual({ "pt-BR": "Site institucional", en: "Company website" });
  });

  it("guarda só o hash da senha e o painel não a recebe", async () => {
    const { id, doc } = await createProposal({ password: "segredo1" });
    expect(doc.password).toMatch(/^pbkdf2:/);
    const fromPanel = await root.query(api.rubrica.proposals.get, { id });
    expect(fromPanel).not.toHaveProperty("password");
    expect(fromPanel).toMatchObject({ hasPassword: true });
  });

  it("recusa slug repetido, título vazio e desconto inválido", async () => {
    await createProposal({ slug: "proposta-x" });
    await expect(createProposal({ slug: "proposta-x" })).rejects.toThrow(/já está em uso/);
    await expect(createProposal({ title: { "pt-BR": " " } })).rejects.toThrow(/title/);
    await expect(createProposal({ originalValue: 4000 })).rejects.toThrow(/Valor original/);
  });

  it("guarda preços, valor original e brindes; sem preço nenhum, não guarda os preços", async () => {
    const { doc } = await createProposal({ scopePrices: [3000, 1000], originalValue: 6000, giftIndexes: [1] });
    expect(doc).toMatchObject({ scopePrices: [3000, 1000], originalValue: 6000, giftIndexes: [1] });
    const { doc: noPrices } = await createProposal({ scopePrices: [null, null] });
    expect(noPrices.scopePrices).toBeUndefined();
  });

  it("cada edição sobe a versão e guarda a anterior no histórico", async () => {
    const { id } = await createProposal();
    await root.mutation(api.rubrica.proposals.update, { id, patch: { investmentValue: 4500 } });
    await root.mutation(api.rubrica.proposals.update, { id, patch: { clientName: "Outro" } });
    const doc = await root.query(api.rubrica.proposals.get, { id });
    expect(doc).toMatchObject({ version: 3, investmentValue: 4500, clientName: "Outro" });
    const versions = await root.query(api.rubrica.proposals.versions, { id });
    expect(versions.map((v) => [v.version, v.content.investmentValue, v.content.clientName])).toEqual([
      [2, 4500, "Cliente Exemplo"],
      [1, 5000, "Cliente Exemplo"],
    ]);
  });

  it("update valida o desconto contra o que já está salvo e apaga campos com unset", async () => {
    const { id } = await createProposal({ scopePrices: [3000, 1000], originalValue: 6000, giftIndexes: [1] });
    await expect(root.mutation(api.rubrica.proposals.update, { id, patch: { investmentValue: 6500 } })).rejects.toThrow(/Valor original/);
    await expect(root.mutation(api.rubrica.proposals.update, { id, unset: ["originalValue"] })).rejects.toThrow(/brinde/);
    await root.mutation(api.rubrica.proposals.update, { id, unset: ["originalValue", "giftIndexes", "scopePrices"] });
    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc).toMatchObject({ version: 2 });
    expect(doc!.originalValue).toBeUndefined();
    expect(doc!.scopePrices).toBeUndefined();
  });

  it("lixeira: proposal-editor não apaga; comercial apaga; root restaura e apaga de vez", async () => {
    const { id } = await createProposal();
    const editor = await as(t, "proposal-editor");
    await expect(editor.mutation(api.rubrica.proposals.remove, { id })).rejects.toThrow(/Sem permissão/);
    const comercial = await as(t, "comercial");
    await comercial.mutation(api.rubrica.proposals.remove, { id });
    expect((await t.run((ctx) => ctx.db.get(id)))!.deletedAt).toBeTypeOf("number");
    await expect(comercial.mutation(api.rubrica.proposals.restore, { id })).rejects.toThrow(/Sem permissão/);
    await root.mutation(api.rubrica.proposals.restore, { id });
    await root.mutation(api.rubrica.proposals.removePermanently, { id });
    expect(await t.run((ctx) => ctx.db.get(id))).toBeNull();
  });

  it("plugin desligado: o painel recusa e a página pública não acha", async () => {
    const { slug } = await createProposal();
    await seedSettings(t, { plugins: { proposals: false } });
    await expect(root.mutation(api.rubrica.proposals.create, PROPOSAL as never)).rejects.toThrow(/plugin "proposals" está desligado/);
    expect(await t.query(api.rubrica.proposals.getPublic, { slug })).toBeNull();
  });
});

describe("propostas: página pública, senha e sessão", () => {
  it("sem senha: devolve o conteúdo, o contrato do modelo padrão e quem contrata", async () => {
    await root.mutation(api.rubrica.contractTemplates.create, { name: "Padrão", content: "Contrato de {{client_name}}" });
    const { slug } = await createProposal();
    const pub = await t.query(api.rubrica.proposals.getPublic, { slug });
    expect(pub).toMatchObject({ locked: false, requiresPassword: false, isExpired: false, isAccepted: false, contract: "Contrato de {{client_name}}" });
    expect(pub).toMatchObject({ contractor: { name: { "pt-BR": "Ana Souza", en: "Ana Souza" } } });
    expect(pub).not.toHaveProperty("password");
  });

  it("com senha e sem sessão: só o estado, sem o conteúdo (na v1 o conteúdo ia junto)", async () => {
    const { slug } = await createProposal({ password: "segredo1" });
    const pub = await t.query(api.rubrica.proposals.getPublic, { slug, token: "token-falso" });
    expect(pub).toEqual({ slug, locked: true, requiresPassword: true, hasValidSession: false, isExpired: false, isAccepted: false, expiresAt: expect.any(Number) });
  });

  it("senha errada: 401; certa: token de 64 caracteres que abre a proposta", async () => {
    const { slug } = await createProposal({ password: "segredo1" });
    expect(await openSession(slug, "errada")).toMatchObject({ status: 401, body: { error: "INVALID_PASSWORD" } });
    const ok = await openSession(slug, "segredo1");
    expect(ok.status).toBe(200);
    expect(ok.body.token).toMatch(/^[0-9a-f]{64}$/);
    const pub = await t.query(api.rubrica.proposals.getPublic, { slug, token: ok.body.token });
    expect(pub).toMatchObject({ locked: false, hasValidSession: true, clientName: "Cliente Exemplo" });
    expect(await t.query(api.rubrica.proposals.checkSession, { token: ok.body.token! })).toMatchObject({ slug });
    // O banco guarda só o hash do token.
    const sessions = await t.run((ctx) => ctx.db.query("proposalSessions").collect());
    expect(sessions[0]!.tokenHash).not.toBe(ok.body.token);
    expect(sessions[0]!.ipAddress).toBe("203.0.113.7");
  });

  it("bloqueia depois de 5 senhas erradas, mesmo com a certa (a contagem não é desfeita)", async () => {
    const { slug } = await createProposal({ password: "segredo1" });
    for (let i = 0; i < 5; i++) expect((await openSession(slug, "errada")).status).toBe(401);
    expect(await openSession(slug, "segredo1")).toMatchObject({ status: 429, body: { error: "TOO_MANY_ATTEMPTS" } });
    // Outro IP não é afetado.
    const other = await post(t, "/api/proposal/session", { slug, password: "segredo1" }, { "x-forwarded-for": "198.51.100.1" });
    expect(other.status).toBe(200);
  });

  it("trocar a senha derruba as sessões; sessão vencida não vale", async () => {
    const { id, slug } = await createProposal({ password: "segredo1" });
    const { body } = await openSession(slug, "segredo1");
    await root.mutation(api.rubrica.proposals.resetPassword, { id, newPassword: "outra-senha" });
    expect(await t.query(api.rubrica.proposals.checkSession, { token: body.token! })).toBeNull();
    const again = await openSession(slug, "outra-senha");
    await t.run(async (ctx) => {
      for (const s of await ctx.db.query("proposalSessions").collect()) await ctx.db.patch(s._id, { expiresAt: Date.now() - 1 });
    });
    expect(await t.query(api.rubrica.proposals.getPublic, { slug, token: again.body.token })).toMatchObject({ locked: true });
    expect(await t.mutation(internal.rubrica.proposals.cleanupExpiredSessions, {})).toEqual({ deleted: 1 });
  });

  it("CORS: responde só às origens do site", async () => {
    const ok = await t.fetch("/api/proposal/session", { method: "OPTIONS", headers: { Origin: "https://exemplo.dev" } });
    expect(ok.status).toBe(204);
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://exemplo.dev");
    const www = await t.fetch("/api/proposal/session", { method: "OPTIONS", headers: { Origin: "https://www.exemplo.dev" } });
    expect(www.status).toBe(204);
    const bad = await t.fetch("/api/proposal/session", { method: "OPTIONS", headers: { Origin: "https://malicioso.dev" } });
    expect(bad.status).toBe(403);
  });
});

describe("propostas: aceite eletrônico", () => {
  async function accept(slug: string, extra: Record<string, unknown> = {}) {
    const res = await post(t, "/api/proposal/accept", { slug, ...ACCEPTANCE, locale: "pt-BR", ...extra });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  }

  it("registra o aceite com o conteúdo do banco, hash SHA-256, IP do servidor e congela o contrato", async () => {
    const templateId = await root.mutation(api.rubrica.contractTemplates.create, { name: "Padrão", content: "Contrato v1" });
    const { id, slug } = await createProposal({ scopePrices: [3000, 1000], originalValue: 6000, giftIndexes: [1] });
    const res = await accept(slug, { ipAddress: "1.1.1.1", clientRole: "Sócia" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ contentHash: expect.stringMatching(/^[0-9a-f]{64}$/), ipAddress: "203.0.113.7" });

    const acceptance = await root.query(api.rubrica.proposals.getAcceptance, { id });
    expect(acceptance).toMatchObject({ clientEmail: "maria@exemplo.dev", ipAddress: "203.0.113.7", userAgent: "vitest", proposalVersion: 1, clientRole: "Sócia", locale: "pt-BR" });
    const snapshot = JSON.parse(acceptance!.contentSnapshot);
    expect(snapshot.proposal).toMatchObject({ investmentValue: 5000, scopePrices: [3000, 1000], originalValue: 6000, giftIndexes: [1], contract: "Contrato v1" });
    expect(snapshot.acceptance).toMatchObject({ clientName: "Maria Exemplo", clientEmail: "maria@exemplo.dev" });

    // Editar o modelo depois do aceite não muda o contrato aceito.
    await root.mutation(api.rubrica.contractTemplates.update, { id: templateId, content: "Contrato v2" });
    expect(await t.query(api.rubrica.proposals.getPublic, { slug })).toMatchObject({ isAccepted: true, contract: "Contrato v1" });

    // O registro de atividades não guarda e-mail nem IP do cliente.
    const log = await t.run((ctx) => ctx.db.query("auditLog").collect());
    const entry = log.find((l) => l.eventType === "proposal.accepted")!;
    expect(JSON.stringify(entry)).not.toMatch(/maria|203\.0\.113/i);
    expect((await notifications(t)).some((m) => m.includes("Proposta aceita"))).toBe(true);
  });

  it("recusa aceite repetido, vencido, sem proposta ou com e-mail inválido; aceita não se edita", async () => {
    const { id, slug } = await createProposal();
    expect(await accept("nao-existe")).toMatchObject({ status: 400, body: { error: "NOT_FOUND" } });
    expect(await accept(slug, { clientEmail: "sem-arroba" })).toMatchObject({ status: 400, body: { error: "INVALID_INPUT" } });
    expect((await accept(slug)).status).toBe(200);
    expect(await accept(slug)).toMatchObject({ status: 400, body: { error: "ALREADY_ACCEPTED" } });
    await expect(root.mutation(api.rubrica.proposals.update, { id, patch: { investmentValue: 1 } })).rejects.toThrow(/aceita não pode ser alterada/);
    await expect(root.mutation(api.rubrica.proposals.remove, { id })).rejects.toThrow(/aceita não pode ser apagada/);

    const expired = await createProposal({ expiresAt: Date.now() - 1000 });
    expect(await accept(expired.slug)).toMatchObject({ status: 400, body: { error: "EXPIRED" } });
  });

  it("com senha: exige sessão válida; depois do aceite a sessão serve para baixar o aceite", async () => {
    const { slug } = await createProposal({ password: "segredo1" });
    expect(await accept(slug)).toMatchObject({ status: 400, body: { error: "SESSION_REQUIRED" } });
    await expect(t.mutation(api.rubrica.proposals.generateSignatureUploadUrl, { slug })).rejects.toThrow(/senha/);
    const { body } = await openSession(slug, "segredo1");
    expect(await t.mutation(api.rubrica.proposals.generateSignatureUploadUrl, { slug, token: body.token })).toMatch(/^https?:/);
    expect((await accept(slug, { token: body.token })).status).toBe(200);
    const mine = await t.query(api.rubrica.proposals.getAcceptanceByToken, { slug, token: body.token! });
    expect(mine).toMatchObject({ clientName: "Maria Exemplo", signatureUrl: null });
    expect(mine).not.toHaveProperty("sessionId");
    expect(await t.query(api.rubrica.proposals.getAcceptanceByToken, { slug, token: "outro" })).toBeNull();
  });

  it("assinatura: aceita imagem pequena do storage e recusa outro tipo de arquivo", async () => {
    const { slug } = await createProposal();
    const pdf = await t.run((ctx) => ctx.storage.store(new Blob(["%PDF"], { type: "application/pdf" })));
    expect(await accept(slug, { signatureStorageId: pdf })).toMatchObject({ status: 400, body: { error: "INVALID_INPUT" } });
    const png = await t.run((ctx) => ctx.storage.store(new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })));
    expect((await accept(slug, { signatureStorageId: png })).status).toBe(200);
  });

  it("limita os aceites por IP (3 por hora), contando também os que falharam", async () => {
    const { slug } = await createProposal();
    for (let i = 0; i < 3; i++) expect((await accept(slug, { clientEmail: "x" })).status).toBe(400);
    expect(await accept(slug)).toMatchObject({ status: 429, body: { error: "TOO_MANY_ATTEMPTS" } });
  });
});

describe("modelos de contrato", () => {
  it("o primeiro vira padrão; marcar outro desmarca os demais", async () => {
    const a = await root.mutation(api.rubrica.contractTemplates.create, { name: "A", content: "a" });
    const b = await root.mutation(api.rubrica.contractTemplates.create, { name: "B", content: "b" });
    expect((await root.query(api.rubrica.contractTemplates.getDefault, {}))!._id).toBe(a);
    await root.mutation(api.rubrica.contractTemplates.setDefault, { id: b });
    const list = await root.query(api.rubrica.contractTemplates.list, {});
    expect(list.map((t) => [t.name, t.isDefault])).toEqual([
      ["B", true],
      ["A", false],
    ]);
    const c = await root.mutation(api.rubrica.contractTemplates.create, { name: "C", content: "c", isDefault: true });
    expect((await root.query(api.rubrica.contractTemplates.list, {})).filter((x) => x.isDefault).map((x) => x._id)).toEqual([c]);
  });

  it("a proposta usa o modelo escolhido; apagado, cai no padrão", async () => {
    await root.mutation(api.rubrica.contractTemplates.create, { name: "Padrão", content: "padrão" });
    const special = await root.mutation(api.rubrica.contractTemplates.create, { name: "Especial", content: "especial" });
    const { slug } = await createProposal({ templateId: special });
    expect(await t.query(api.rubrica.proposals.getPublic, { slug })).toMatchObject({ contract: "especial" });
    await root.mutation(api.rubrica.contractTemplates.remove, { id: special });
    expect(await t.query(api.rubrica.proposals.getPublic, { slug })).toMatchObject({ contract: "padrão" });
  });

  it("seedDefault cria o modelo da v1 só quando não há nenhum", async () => {
    const id = (await t.mutation(internal.rubrica.contractTemplates.seedDefault, {})) as Id<"contractTemplates">;
    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc).toMatchObject({ isDefault: true });
    expect(doc!.content).toContain("{{client_name}}");
    expect(await t.mutation(internal.rubrica.contractTemplates.seedDefault, {})).toBeNull();
  });

  it("plugin desligado: lista vazia e a proposta usa o contrato padrão", async () => {
    await root.mutation(api.rubrica.contractTemplates.create, { name: "A", content: "a" });
    const { slug } = await createProposal();
    await seedSettings(t, { plugins: { "contract-templates": false } });
    expect(await root.query(api.rubrica.contractTemplates.list, {})).toEqual([]);
    await expect(root.mutation(api.rubrica.contractTemplates.create, { name: "B", content: "b" })).rejects.toThrow(/desligado/);
    expect(await t.query(api.rubrica.proposals.getPublic, { slug })).toMatchObject({ contract: DEFAULT_CONTRACT_TEMPLATE });
  });
});
