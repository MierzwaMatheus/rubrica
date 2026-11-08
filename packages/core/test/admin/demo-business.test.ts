import { describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../../src/data/source";
import { createDemoStore, DEMO_CREDENTIALS } from "../../src/admin/data/demo";
import { api } from "../../src/admin/data/api";

const fixtures = (kind: string) => fileURLToPath(new URL(`../../../../apps/demo/fixtures/${kind}`, import.meta.url));

async function store(kind = "pessoal", login: [string, string] = [DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password]) {
  const s = createDemoStore({ snapshot: await fixtureSource(fixtures(kind)).load() });
  s.signIn(...login);
  return s;
}

type Doc = Record<string, unknown> & { _id: string };

describe("demonstração: coleções", () => {
  it("cria post como rascunho com slug do título, sem mexer nele ao editar o título", async () => {
    const s = await store();
    const posts = api.collection("posts");
    const id = s.mutate(posts.create, { title: { "pt-BR": "Meu Primeiro Post!" }, content: { "pt-BR": "<p>Oi</p>" } }) as string;
    let doc = s.query(posts.get, { id }) as Doc;
    expect(doc).toMatchObject({ slug: "meu-primeiro-post", published: false });
    expect(doc.publishedAt).toBeUndefined();
    s.mutate(posts.update, { id, patch: { title: { "pt-BR": "Título novo" } } });
    expect((s.query(posts.get, { id }) as Doc).slug).toBe("meu-primeiro-post");
    s.mutate(posts.publish, { id });
    doc = s.query(posts.get, { id }) as Doc;
    const first = doc.publishedAt;
    expect(typeof first).toBe("number");
    s.mutate(posts.unpublish, { id });
    s.mutate(posts.publish, { id });
    expect((s.query(posts.get, { id }) as Doc).publishedAt).toBe(first);
    // Só aparece no site publicado.
    const ids = (s.query(api.site.snapshot, {}) as { collections: { posts: { id: string }[] } }).collections.posts.map((p) => p.id);
    expect(ids).toContain(id);
  });

  it("recusa slug repetido ou inválido e título vazio; apaga campo com unset", async () => {
    const s = await store();
    const posts = api.collection("posts");
    const a = s.mutate(posts.create, { title: { "pt-BR": "A" }, content: {}, slug: "post-a" }) as string;
    const b = s.mutate(posts.create, { title: { "pt-BR": "B" }, content: {}, excerpt: { "pt-BR": "x" } }) as string;
    expect(() => s.mutate(posts.update, { id: b, patch: { slug: "post-a" } })).toThrow(/já está em uso/);
    expect(() => s.mutate(posts.update, { id: b, patch: { slug: "Post B" } })).toThrow(/Slug inválido/);
    expect(() => s.mutate(posts.create, { title: { "pt-BR": " " }, content: {} })).toThrow(/pelo menos um idioma/);
    s.mutate(posts.update, { id: b, patch: {}, unset: ["excerpt"] });
    expect((s.query(posts.get, { id: b }) as Doc).excerpt).toBeUndefined();
    expect(() => s.mutate(posts.update, { id: b, patch: {}, unset: ["title"] })).toThrow(/não pode ser apagado/);
    expect(a).not.toBe(b);
  });

  it("lixeira: some da lista, só root restaura; reordena", async () => {
    const s = await store();
    const faq = api.collection("faq");
    const list = () => (s.query(faq.list, {}) as Doc[]).map((d) => d._id);
    const [first, second] = list();
    s.mutate(faq.reorder, { ids: [second!, first!] });
    expect(list().slice(0, 2)).toEqual([second, first]);
    s.mutate(faq.remove, { id: first! });
    expect(list()).not.toContain(first);
    expect((s.query(faq.list, { includeDeleted: true }) as Doc[]).map((d) => d._id)).toContain(first);
    s.mutate(faq.restore, { id: first! });
    expect(list()).toContain(first);
    s.signOut();
    s.signIn("editora@rubrica.dev", "Editora2026!x");
    expect(() => s.mutate(faq.restore, { id: first! })).toThrow(/Sem permissão/);
  });

  it("editor do blog não mexe em projetos", async () => {
    const s = await store();
    s.mutate(api.users.setRole, { userId: "u-editor", role: "blog-editor" });
    s.signOut();
    s.signIn("editora@rubrica.dev", "Editora2026!x");
    expect(() => s.query(api.collection("projects").list, {})).toThrow(/Sem permissão/);
    expect(s.query(api.collection("posts").list, {})).toBeTruthy();
  });

  it("projeto guarda a métrica", async () => {
    const s = await store();
    const projects = api.collection("projects");
    const id = s.mutate(projects.create, { title: { "pt-BR": "Case" }, metric: { value: "~50", label: { "pt-BR": "skills" } } }) as string;
    expect((s.query(projects.get, { id }) as Doc).metric).toEqual({ value: "~50", label: { "pt-BR": "skills" } });
  });
});

describe("demonstração: depoimentos enviados, contatos e publicação", () => {
  it("aprovar cria o depoimento publicado; recusar apaga o envio", async () => {
    const s = await store();
    const pending = () => s.query(api.testimonialIntake.list, { status: "pending" }) as Doc[];
    const [one, two] = pending();
    const before = (s.query(api.collection("testimonials").list, {}) as Doc[]).length;
    const newId = s.mutate(api.testimonialIntake.approve, { id: one!._id, quote: "Texto revisado", role: "Diretora" }) as string;
    const created = s.query(api.collection("testimonials").get, { id: newId }) as Doc;
    expect(created).toMatchObject({ author: one!.name, published: true, quote: { "pt-BR": "Texto revisado" } });
    expect((s.query(api.collection("testimonials").list, {}) as Doc[]).length).toBe(before + 1);
    expect(() => s.mutate(api.testimonialIntake.approve, { id: one!._id })).toThrow(/já foi aprovado/);
    s.mutate(api.testimonialIntake.reject, { id: two!._id });
    expect(pending()).toHaveLength(0);
  });

  it("contatos: contador de novos, ler, arquivar e tentar de novo", async () => {
    const s = await store();
    const count = () => s.query(api.contacts.unreadCount, {}) as number;
    expect(count()).toBe(2);
    const list = s.query(api.contacts.list, { status: "new" }) as Doc[];
    s.mutate(api.contacts.markRead, { id: list[0]!._id });
    expect(count()).toBe(1);
    s.mutate(api.contacts.archive, { id: list[1]!._id });
    expect(count()).toBe(0);
    const failed = s.query(api.contacts.failedDeliveries, {}) as Doc[];
    expect(failed).toHaveLength(1);
    s.mutate(api.contacts.retryDelivery, { id: failed[0]!._id });
    expect(s.query(api.contacts.failedDeliveries, {})).toHaveLength(0);
    expect(() => s.mutate(api.contacts.setDestinations, { telegram: false, email: { enabled: true, to: [] }, webhook: { enabled: false } })).toThrow(/destinatário/);
  });

  it("publicar: pendente depois de uma mudança, publicando e depois publicado", async () => {
    vi.useFakeTimers();
    try {
      const s = await store();
      const status = () => (s.query(api.publish.status, {}) as { status: string; pendingChanges: number }).status;
      expect(status()).toBe("published");
      s.mutate(api.collection("faq").create, { question: { "pt-BR": "?" }, answer: { "pt-BR": "!" } });
      expect(status()).toBe("pending");
      expect((s.query(api.publish.status, {}) as { pendingChanges: number }).pendingChanges).toBe(1);
      // No mesmo milissegundo a mudança ainda conta como pendente (melhor sobrar que faltar).
      vi.advanceTimersByTime(10);
      expect(s.act(api.publish.trigger, {})).toMatchObject({ ok: true });
      expect(status()).toBe("publishing");
      vi.advanceTimersByTime(3000);
      expect(status()).toBe("published");
      expect(s.act(api.publish.trigger, {})).toMatchObject({ skipped: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it("quem não pode publicar não dispara; o registro de atividades é do root", async () => {
    const s = await store();
    s.mutate(api.collection("faq").create, { question: { "pt-BR": "?" }, answer: { "pt-BR": "!" } });
    const log = s.query(api.audit.recent, {}) as Doc[];
    expect(log[0]).toMatchObject({ eventType: "admin.create", targetType: "faq", actorEmail: DEMO_CREDENTIALS.email });
    s.signOut();
    s.signIn("editora@rubrica.dev", "Editora2026!x");
    expect(() => s.act(api.publish.trigger, { force: true })).toThrow(/Sem permissão/);
    expect(() => s.query(api.audit.recent, {})).toThrow(/Sem permissão/);
  });
});

describe("demonstração: LGPD, propostas e planos", () => {
  it("exporta e exclui por e-mail, só com a confirmação igual", async () => {
    const s = await store();
    const exported = s.query(api.privacy.exportData, { email: "Marina@exemplo.com.br" }) as { total: number; sources: { id: string; records: unknown[] }[] };
    expect(exported.total).toBe(1);
    expect(() => s.mutate(api.privacy.erase, { email: "marina@exemplo.com.br", confirm: "outro@exemplo.com" })).toThrow(/confirmação não confere/);
    expect(s.mutate(api.privacy.erase, { email: "marina@exemplo.com.br", confirm: "MARINA@exemplo.com.br" })).toMatchObject({ total: 1 });
    expect((s.query(api.privacy.exportData, { email: "marina@exemplo.com.br" }) as { total: number }).total).toBe(0);
  });

  it("gera a política: sobrescrever só com overwrite; a versão sobe", async () => {
    const s = await store();
    const status = () => s.query(api.privacy.policyStatus, {}) as { exists: boolean; version: number };
    expect(status().exists).toBe(true);
    expect(() => s.mutate(api.privacy.generatePolicy, {})).toThrow(/overwrite/);
    const v = status().version;
    s.mutate(api.privacy.generatePolicy, { overwrite: true });
    expect(status().version).toBe(v + 1);
  });

  it("proposta: cada edição guarda a versão anterior; aceita não muda; desconto inválido recusado", async () => {
    const s = await store();
    const list = s.query(api.proposals.list, {}) as Doc[];
    const open = list.find((p) => !p.isAccepted && p.slug === "clinica-viva-k3m9x2ab")!;
    expect(open).toMatchObject({ version: 2, hasPassword: true });
    expect("password" in open).toBe(false);
    s.mutate(api.proposals.update, { id: open._id, patch: { investmentValue: 8000 } });
    const versions = s.query(api.proposals.versions, { id: open._id }) as { version: number }[];
    expect(versions.map((v) => v.version)).toEqual([2, 1]);
    expect(() => s.mutate(api.proposals.update, { id: open._id, patch: { originalValue: 7000 } })).toThrow(/maior que o valor/);
    const accepted = list.find((p) => p.isAccepted)!;
    expect(() => s.mutate(api.proposals.update, { id: accepted._id, patch: { investmentValue: 1 } })).toThrow(/aceita/);
    expect(s.query(api.proposals.getAcceptance, { id: accepted._id })).toMatchObject({ clientName: "Marcos Lima" });
    s.mutate(api.proposals.resetPassword, { id: open._id });
    expect((s.query(api.proposals.get, { id: open._id }) as Doc).hasPassword).toBe(false);
  });

  it("link de pagamento do plano: só com preço em reais e pagamento único", async () => {
    const s = await store("empresa");
    const plans = api.collection("plans");
    const [monthly] = s.query(plans.list, {}) as Doc[];
    expect(() => s.mutate(api.checkouts.linkPlan, { planId: monthly!._id })).toThrow(/pagamento único/);
    const id = s.mutate(plans.create, { name: { "pt-BR": "Projeto" }, features: [], priceCents: 150000, currency: "BRL", period: "project" }) as string;
    const res = s.mutate(api.checkouts.linkPlan, { planId: id }) as { href: string };
    expect(res.href).toMatch(/^\/checkout\//);
    expect((s.query(plans.get, { id }) as Doc).cta).toMatchObject({ href: res.href });
    expect((s.query(api.checkouts.listLinks, {}) as Doc[])[0]).toMatchObject({ planId: id, active: true });
    s.mutate(api.checkouts.unlinkPlan, { planId: id });
    expect((s.query(plans.get, { id }) as Doc).cta).toBeUndefined();
  });

  it("modelos de contrato: o padrão é único; currículos com IA exigem root", async () => {
    const s = await store();
    const [def, other] = s.query(api.contractTemplates.list, {}) as Doc[];
    expect(def!.isDefault).toBe(true);
    s.mutate(api.contractTemplates.setDefault, { id: other!._id });
    expect((s.query(api.contractTemplates.list, {}) as Doc[]).filter((t) => t.isDefault)).toHaveLength(1);
    const made = s.act(api.aiResumes.generate, { title: "Vaga X", locale: "pt-BR", jobDescription: "Procuramos designer." }) as { id: string };
    expect((s.query(api.aiResumes.list, {}) as Doc[]).map((r) => r._id)).toContain(made.id);
    expect(() => s.act(api.aiResumes.generate, { title: "Vaga", locale: "pt-BR", jobDescription: " " })).toThrow(/descrição da vaga/);
  });
});
