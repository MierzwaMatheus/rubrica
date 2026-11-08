// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { call, runtimeFor, seedSettings, setup, type T } from "./backend";

const PASSWORD = "segredo-forte-123";

const proposal = (extra: Record<string, unknown> = {}) => ({
  clientName: "Acme Ltda",
  title: { "pt-BR": "Site novo", en: "New site" },
  objective: { "pt-BR": "Refazer o site", en: "Rebuild the site" },
  scope: [{ "pt-BR": "Design", en: "Design" }, { "pt-BR": "Desenvolvimento", en: "Development" }],
  timeline: [{ step: { "pt-BR": "Design", en: "Design" }, period: { "pt-BR": "2 semanas", en: "2 weeks" } }],
  deliveryDate: "6 semanas após o aceite",
  investmentValue: 9000,
  paymentMethods: [{ "pt-BR": "Pix", en: "Pix" }],
  conditions: [{ "pt-BR": "50% na entrada", en: "50% upfront" }],
  rescissionPolicy: { "pt-BR": "Multa de 10%", en: "10% fee" },
  ...extra,
});

describe("propostas pelo MCP", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("comercial e proposal-editor enxergam as quatro ferramentas; blog-editor e content-editor não", async () => {
    for (const role of ["comercial", "proposal-editor", "admin", "root"] as const) {
      const { runtime } = await runtimeFor(t, role);
      await runtime.refresh();
      for (const n of ["proposals_list", "proposals_get", "proposals_create", "proposals_update"]) expect(runtime.toolNames(), `${role} ${n}`).toContain(n);
    }
    for (const role of ["blog-editor", "content-editor"] as const) {
      const { runtime } = await runtimeFor(t, role);
      await runtime.refresh();
      expect(runtime.toolNames().filter((n) => n.startsWith("proposals_")), role).toEqual([]);
    }
  });

  it("some com o plugin desligado", async () => {
    await seedSettings(t, { plugins: { proposals: false } });
    const { runtime } = await runtimeFor(t, "comercial");
    await runtime.refresh();
    expect(runtime.toolNames().filter((n) => n.startsWith("proposals_"))).toEqual([]);
    const r = await call(runtime, "proposals_list");
    expect(r.isError).toBe(true);
  });

  it("criar mostra a prévia primeiro, sem gravar nem mostrar a senha", async () => {
    const { runtime, client } = await runtimeFor(t, "comercial");
    const preview = await call(runtime, "proposals_create", proposal({ password: PASSWORD }));
    expect(preview.body).toMatchObject({ applied: false, dryRun: true });
    expect(client.writes()).toEqual([]);
    expect(JSON.stringify(preview.body)).not.toContain(PASSWORD);
    expect(preview.body.changes.some((c: { path: string }) => c.path === "password")).toBe(true);
  });

  it("cria com senha: vai ao backend, que guarda o hash; nada devolve a senha", async () => {
    const { runtime, client } = await runtimeFor(t, "proposal-editor");
    const done = await call(runtime, "proposals_create", proposal({ password: PASSWORD, slug: "acme-site", expiresAt: "2099-12-31", dryRun: false }));
    expect(done.body.applied).toBe(true);
    expect(done.body.result).toMatchObject({ slug: "acme-site", hasPassword: true, url: "https://exemplo.dev/proposta/acme-site" });
    expect(JSON.stringify(done.body)).not.toContain(PASSWORD);
    // O argumento chegou ao backend (que faz o hash), e só lá.
    expect(client.writes().find((c) => c.path === "rubrica/proposals:create")!.args.password).toBe(PASSWORD);
    const stored = await t.run(async (ctx) => (await ctx.db.query("proposals").first())!);
    expect(stored.password).toMatch(/^pbkdf2:/);
    const got = await call(runtime, "proposals_get", { slug: "acme-site" });
    expect(got.body).toMatchObject({ clientName: "Acme Ltda", hasPassword: true, status: "pending", version: 1 });
    expect(got.body.password).toBeUndefined();
    expect(JSON.stringify(got.body)).not.toContain("pbkdf2");
    const list = await call(runtime, "proposals_list");
    expect(list.body.items[0]).toMatchObject({ clientName: "Acme Ltda", title: "Site novo", hasPassword: true });
    expect(JSON.stringify(list.body)).not.toContain("pbkdf2");
  });

  it("sem senha avisa que o link fica aberto; slug sai do cliente", async () => {
    const { runtime } = await runtimeFor(t, "comercial");
    const preview = await call(runtime, "proposals_create", proposal());
    expect(preview.body.warnings.join(" ")).toContain("Sem senha");
    const done = await call(runtime, "proposals_create", proposal({ dryRun: false }));
    expect(done.body.result.slug).toMatch(/^acme-ltda-/);
  });

  it("valida com mensagens legíveis, sem chamar o backend", async () => {
    const { runtime, client } = await runtimeFor(t, "comercial");
    const missing = await call(runtime, "proposals_create", { clientName: "X", dryRun: false });
    expect(missing.isError).toBe(true);
    expect(missing.body.problems.map((p: { message: string }) => p.message).join(" ")).toContain("campo obrigatório");
    const short = await call(runtime, "proposals_create", proposal({ password: "123", dryRun: false }));
    expect(short.isError).toBe(true);
    const discount = await call(runtime, "proposals_create", proposal({ originalValue: 5000, dryRun: false }));
    expect(discount.body.problems).toEqual([{ path: "originalValue", message: "Valor original precisa ser maior que o valor do projeto" }]);
    const emptyTitle = await call(runtime, "proposals_create", proposal({ title: { "pt-BR": "  " }, dryRun: false }));
    expect(emptyTitle.body.problems[0]).toMatchObject({ path: "title" });
    const date = await call(runtime, "proposals_create", proposal({ expiresAt: "amanhã", dryRun: false }));
    expect(date.isError).toBe(true);
    expect(client.writes()).toEqual([]);
  });

  it("atualiza: mescla por idioma, sobe a versão e guarda a anterior", async () => {
    const { runtime } = await runtimeFor(t, "comercial");
    const id = (await call(runtime, "proposals_create", proposal({ dryRun: false }))).body.result.id as string;
    const preview = await call(runtime, "proposals_update", { id, patch: { title: { en: "Brand new site" }, investmentValue: 8000 } });
    expect(preview.body.changes).toEqual(
      expect.arrayContaining([
        { path: "title.en", op: "change", locale: "en", before: "New site", after: "Brand new site" },
        { path: "investmentValue", op: "change", before: 9000, after: 8000 },
      ]),
    );
    expect(preview.body.warnings.join(" ")).toContain("versão 2");
    await call(runtime, "proposals_update", { id, patch: { title: { en: "Brand new site" }, investmentValue: 8000 }, dryRun: false });
    const got = (await call(runtime, "proposals_get", { id })).body;
    expect(got).toMatchObject({ version: 2, investmentValue: 8000, title: { "pt-BR": "Site novo", en: "Brand new site" } });
    expect(await t.run((ctx) => ctx.db.query("proposalVersions").collect())).toHaveLength(1);
  });

  it("desconto: unset de originalValue e regra dos brindes", async () => {
    const { runtime } = await runtimeFor(t, "comercial");
    const id = (await call(runtime, "proposals_create", proposal({ investmentValue: 6000, originalValue: 10000, scopePrices: [4000, 6000], giftIndexes: [0], dryRun: false }))).body.result.id as string;
    const bad = await call(runtime, "proposals_update", { id, unset: ["originalValue"], dryRun: false });
    expect(bad.isError).toBe(true);
    expect(bad.body.problems[0].message).toContain("brinde");
    const ok = await call(runtime, "proposals_update", { id, unset: ["giftIndexes", "originalValue"], dryRun: false });
    expect(ok.body.applied).toBe(true);
    expect((await call(runtime, "proposals_get", { id })).body.originalValue).toBeUndefined();
  });

  it("troca e tira a senha sem versionar; sem vazar", async () => {
    const { runtime } = await runtimeFor(t, "comercial");
    const id = (await call(runtime, "proposals_create", proposal({ dryRun: false }))).body.result.id as string;
    const preview = await call(runtime, "proposals_update", { id, password: PASSWORD });
    expect(JSON.stringify(preview.body)).not.toContain(PASSWORD);
    const set = await call(runtime, "proposals_update", { id, password: PASSWORD, dryRun: false });
    expect(set.body.result).toMatchObject({ version: 1, hasPassword: true });
    expect(JSON.stringify(set.body)).not.toContain(PASSWORD);
    const removed = await call(runtime, "proposals_update", { id, removePassword: true, dryRun: false });
    expect(removed.body.result).toMatchObject({ hasPassword: false });
    expect((await call(runtime, "proposals_update", { id, password: PASSWORD, removePassword: true })).isError).toBe(true);
  });

  it("proposta aceita não muda", async () => {
    const { runtime } = await runtimeFor(t, "comercial");
    const id = (await call(runtime, "proposals_create", proposal({ dryRun: false }))).body.result.id as string;
    await t.run(async (ctx) => {
      const doc = (await ctx.db.query("proposals").first())!;
      await ctx.db.patch(doc._id, { isAccepted: true, acceptedAt: Date.now() });
    });
    const r = await call(runtime, "proposals_update", { id, patch: { investmentValue: 1 }, dryRun: false });
    expect(r.isError).toBe(true);
    expect(r.body.error ?? JSON.stringify(r.body)).toContain("aceita");
    expect((await call(runtime, "proposals_list", { filter: "accepted" })).body.items[0]).toMatchObject({ status: "accepted" });
  });

  it("o backend é a fonte da verdade: papel sem permissão é recusado mesmo chamando direto", async () => {
    const { client } = await runtimeFor(t, "blog-editor");
    await expect(client.query("rubrica/proposals:list", {})).rejects.toThrow();
  });
});
