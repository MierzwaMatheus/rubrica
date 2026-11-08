// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, as, seedSettings, setup, type T } from "./_setup";

const SITE = "https://exemplo.dev";

function post(t: T, path: string, body: Record<string, unknown>, ip = "203.0.113.7") {
  return t.fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Origin: SITE, "X-Forwarded-For": ip }, body: JSON.stringify(body) });
}

const contato = (email: string, page = "/contato") => ({ name: "Maria", email, message: "Oi", consent: true, locale: "pt-BR", blockId: "c1", page });
const depoimento = (email: string) => ({ name: "Maria", email, quote: "Ótimo", consent: true, locale: "pt-BR", blockId: "d1", page: "/" });

let t: T;
beforeEach(async () => {
  t = setup();
  await seedSettings(t, {
    organization: { legalName: "Ana Souza Design LTDA", taxId: "12.345.678/0001-90", email: "privacidade@exemplo.dev" },
    locales: { locales: ["pt-BR", "en", "es"], default: "pt-BR" },
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("exportação e exclusão (LGPD)", () => {
  it("exporta e apaga tudo do titular, inclusive o depoimento publicado, sem tocar nos outros", async () => {
    await post(t, "/rubrica/contato", contato("maria@cliente.com"));
    await post(t, "/rubrica/contato", contato("maria@cliente.com", "/en/contact"), "203.0.113.8");
    await post(t, "/rubrica/contato", contato("outra@cliente.com"), "203.0.113.9");
    await post(t, "/rubrica/depoimento", depoimento("maria@cliente.com"));
    const admin = await as(t, "admin");
    const [sub] = await admin.query(api.rubrica.testimonialIntake.list, {});
    const testimonialId = await admin.mutation(api.rubrica.testimonialIntake.approve, { id: sub!._id });

    const data = await admin.query(api.rubrica.privacy.exportData, { email: " Maria@Cliente.com" });
    expect(data.email).toBe("maria@cliente.com");
    const byId = Object.fromEntries(data.sources.map((s) => [s.id, s.records]));
    expect(byId.contactRequests).toHaveLength(2);
    expect(byId.testimonialSubmissions).toHaveLength(1);
    expect((byId.testimonialSubmissions![0] as { published: { _id: string } }).published._id).toBe(testimonialId);
    expect(data.total).toBe(3);

    await expect(admin.mutation(api.rubrica.privacy.erase, { email: "maria@cliente.com", confirm: "outra@cliente.com" })).rejects.toThrow(/confirmação/);
    const result = await admin.mutation(api.rubrica.privacy.erase, { email: "maria@cliente.com", confirm: "MARIA@cliente.com" });
    expect(result).toEqual({ total: 4, bySource: { contactRequests: 2, testimonialSubmissions: 2, proposals: 0, checkouts: 0 } });
    expect((await admin.query(api.rubrica.privacy.exportData, { email: "maria@cliente.com" })).total).toBe(0);
    expect(await admin.query(api.rubrica.testimonials.get, { id: testimonialId })).toBeNull();
    expect(await admin.query(api.rubrica.contacts.list, {})).toHaveLength(1);

    const log = await t.run((ctx) => ctx.db.query("auditLog").collect());
    const erasure = log.find((l) => l.eventType === "lgpd.erasure_executed");
    expect(erasure).toBeDefined();
    expect(JSON.stringify(log)).not.toContain("maria@cliente.com");
  });

  it("só root e admin", async () => {
    for (const role of ["comercial", "content-editor"] as const) {
      const c = await as(t, role);
      await expect(c.query(api.rubrica.privacy.exportData, { email: "a@b.com" })).rejects.toThrow(/Sem permissão/);
      await expect(c.mutation(api.rubrica.privacy.erase, { email: "a@b.com", confirm: "a@b.com" })).rejects.toThrow(/Sem permissão/);
    }
    const root = await as(t, "root");
    await expect(root.query(api.rubrica.privacy.exportData, { email: "sem-arroba" })).rejects.toThrow(/E-mail inválido/);
  });
});

describe("política de privacidade", () => {
  it("gera o texto em pt, en e es com a empresa, os plugins e os destinos ligados", async () => {
    vi.stubEnv("RUBRICA_CONTACT_RETENTION_DAYS", "365");
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.contacts.setDestinations, { telegram: true, email: { enabled: true, to: ["a@exemplo.dev"] }, webhook: { enabled: false } });
    const draft = await admin.query(api.rubrica.privacy.policyDraft, {});
    expect(draft.title).toEqual({ "pt-BR": "Política de privacidade", en: "Privacy policy", es: "Política de privacidad" });
    expect(draft.blocks.every((b) => b.type === "texto")).toBe(true);
    const text = (locale: string) => draft.blocks.map((b) => (b.fields.body as Record<string, string>)[locale]).join("\n");
    const pt = text("pt-BR");
    expect(pt).toContain("Ana Souza Design LTDA");
    expect(pt).toContain("12.345.678/0001-90");
    expect(pt).toContain("mailto:privacidade@exemplo.dev");
    expect(pt).toContain("Pedidos de contato");
    expect(pt).toContain("Telegram");
    expect(pt).toContain("Resend");
    expect(pt).toContain("365 dias");
    expect(pt).toContain("Asaas"); // plugin payments ligado por padrão
    expect(pt).not.toContain("CRM");
    expect(text("en")).toContain("We do not sell");
    expect(text("es")).toContain("No vendemos");
  });

  it("sem o plugin, a fonte sai da política", async () => {
    const root = await as(t, "root");
    await root.mutation(api.rubrica.settings.setPlugin, { id: "payments", enabled: false });
    await root.mutation(api.rubrica.settings.setPlugin, { id: "testimonials-intake", enabled: false });
    const draft = await root.query(api.rubrica.privacy.policyDraft, {});
    const pt = draft.blocks.map((b) => (b.fields.body as Record<string, string>)["pt-BR"]).join("\n");
    expect(pt).not.toContain("Asaas");
    expect(pt).not.toContain("Depoimentos enviados");
  });

  it("grava /privacidade editável; cada mudança sobe a versão, que vai no consentimento", async () => {
    const admin = await as(t, "admin");
    const first = await admin.mutation(api.rubrica.privacy.generatePolicy, { publish: true });
    expect(first.version).toBe(1);
    await expect(admin.mutation(api.rubrica.privacy.generatePolicy, {})).rejects.toThrow(/já existe/);
    let status = await admin.query(api.rubrica.privacy.policyStatus, {});
    expect(status).toMatchObject({ exists: true, published: true, version: 1, path: "/privacidade" });

    await post(t, "/rubrica/contato", contato("a@cliente.com"));
    // Edição pelo editor de páginas, sem passar pela geração.
    await admin.mutation(api.rubrica.pages.setBlockVisible, { id: first.pageId, blockId: "privacidade-cookies", visible: false });
    status = await admin.query(api.rubrica.privacy.policyStatus, {});
    expect(status.version).toBe(2);
    await post(t, "/rubrica/contato", contato("b@cliente.com"), "203.0.113.50");
    const versions = (await admin.query(api.rubrica.contacts.list, {})).map((c) => [c.email, c.consent.policyVersion]);
    expect(Object.fromEntries(versions)).toEqual({ "a@cliente.com": 1, "b@cliente.com": 2 });

    const again = await admin.mutation(api.rubrica.privacy.generatePolicy, { overwrite: true });
    expect(again.version).toBe(3);
    expect(again.pageId).toBe(first.pageId);
    // Página de sistema: editável, não apagável.
    await expect(admin.mutation(api.rubrica.pages.remove, { id: first.pageId })).rejects.toThrow(/sistema/);
  });
});
