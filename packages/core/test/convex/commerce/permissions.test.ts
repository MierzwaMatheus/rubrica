// @vitest-environment edge-runtime
/** Permissões do comercial por papel (decisão 18) e dados pessoais (LGPD). */
import { beforeEach, describe, expect, it } from "vitest";
import { ROLES, type Role } from "../../../src/convex/lib/roles";
import type { Id } from "../../../src/convex/server";
import { as, seedSettings, setup, type T } from "../_setup";
import { ACCEPTANCE, PROPOSAL, api, internal, post } from "./_commerce";

type Client = Awaited<ReturnType<typeof as>>;

async function allowed(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (e) {
    if (/Sem permissão|Não autenticado/.test((e as Error).message)) return false;
    throw e;
  }
}

const CHECKOUT = { customerName: "A", customerEmail: "a@exemplo.dev", customerCpfCnpj: "12345678900", value: 100, dueDate: "2099-01-01" };

const SALES: Role[] = ["root", "admin", "comercial"];
const PROPOSALS: Role[] = [...SALES, "proposal-editor"];

/** Ação → papéis que podem (site pessoal, plugins no padrão). */
const MATRIX: Record<string, { roles: Role[]; run: (c: Client) => Promise<unknown> }> = {
  "proposals.list": { roles: PROPOSALS, run: (c) => c.query(api.rubrica.proposals.list, {}) },
  "proposals.create": { roles: PROPOSALS, run: (c) => c.mutation(api.rubrica.proposals.create, PROPOSAL as never) },
  "contractTemplates.list (escolher modelo)": { roles: PROPOSALS, run: (c) => c.query(api.rubrica.contractTemplates.list, {}) },
  "contractTemplates.create": { roles: SALES, run: (c) => c.mutation(api.rubrica.contractTemplates.create, { name: "M", content: "c" }) },
  "checkouts.list": { roles: SALES, run: (c) => c.query(api.rubrica.checkouts.list, {}) },
  "checkouts.create": { roles: SALES, run: (c) => c.mutation(api.rubrica.checkouts.create, CHECKOUT) },
  "checkouts.listLinks": { roles: SALES, run: (c) => c.query(api.rubrica.checkouts.listLinks, {}) },
};

describe("permissões do comercial", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  for (const [action, { roles, run }] of Object.entries(MATRIX)) {
    it(action, async () => {
      const result: Record<string, boolean> = {};
      for (const role of ROLES) result[role] = await allowed(async () => run(await as(t, role)));
      expect(result).toEqual(Object.fromEntries(ROLES.map((r) => [r, roles.includes(r)])));
    });
  }

  it("proposal-editor não chega a checkout nenhum, nem pelas ações do Asaas nem ligando plano", async () => {
    await seedSettings(t, { kind: "empresa" });
    const editor = await as(t, "proposal-editor");
    const root = await as(t, "root");
    const planId = (await root.mutation(api.rubrica.plans.create, { name: { "pt-BR": "P" }, features: [], priceCents: 10000 })) as Id<"plans">;
    await expect(editor.mutation(api.rubrica.checkouts.linkPlan, { planId })).rejects.toThrow(/Sem permissão/);
    await expect(editor.action(api.rubrica.asaas.listCustomers, {})).rejects.toThrow(/Sem permissão/);
    const id = await root.mutation(api.rubrica.checkouts.create, CHECKOUT);
    await expect(editor.query(api.rubrica.checkouts.get, { id })).rejects.toThrow(/Sem permissão/);
    await expect(editor.mutation(api.rubrica.checkouts.remove, { id })).rejects.toThrow(/Sem permissão/);
  });

  it("currículo com IA: só root", async () => {
    await seedSettings(t, { plugins: { "ai-resumes": true } });
    const result: Record<string, boolean> = {};
    for (const role of ROLES) result[role] = await allowed(async () => (await as(t, role)).query(api.rubrica.aiResumes.list, {}));
    expect(result).toEqual(Object.fromEntries(ROLES.map((r) => [r, r === "root"])));
  });

  it("sem login: só as funções públicas da proposta e do checkout", async () => {
    await expect(t.query(api.rubrica.proposals.list, {})).rejects.toThrow(/Não autenticado/);
    await expect(t.query(api.rubrica.checkouts.list, {})).rejects.toThrow(/Não autenticado/);
    await expect(t.query(api.rubrica.contractTemplates.list, {})).rejects.toThrow(/Não autenticado/);
    expect(await t.query(api.rubrica.proposals.getPublic, { slug: "x" })).toBeNull();
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: "x" })).toBeNull();
  });
});

describe("dados pessoais (LGPD)", () => {
  it("exporta e anonimiza aceites, sessões e checkouts pelo e-mail, mantendo o hash do aceite", async () => {
    const t = setup();
    await seedSettings(t);
    const root = await as(t, "root");
    const proposalId = await root.mutation(api.rubrica.proposals.create, { ...PROPOSAL, password: "segredo1" } as never);
    const slug = (await t.run((ctx) => ctx.db.get(proposalId)))!.slug;
    const { token } = (await (await post(t, "/api/proposal/session", { slug, password: "segredo1" })).json()) as { token: string };
    const signature = await t.run((ctx) => ctx.storage.store(new Blob([new Uint8Array([1])], { type: "image/png" })));
    const accepted = (await (await post(t, "/api/proposal/accept", { slug, token, ...ACCEPTANCE, signatureStorageId: signature })).json()) as { contentHash: string };
    await root.mutation(api.rubrica.checkouts.create, { ...CHECKOUT, customerEmail: "maria@exemplo.dev", customerName: "Maria" });
    await root.mutation(api.rubrica.checkouts.create, { ...CHECKOUT, customerEmail: "outra@exemplo.dev" });

    const exported = await t.query(internal.rubrica.commerce.exportPersonalData, { email: " MARIA@exemplo.dev " });
    expect(Object.keys(exported).sort()).toEqual(["checkouts", "proposals"]);
    expect(exported.proposals).toHaveLength(1);
    expect(exported.proposals![0]).toMatchObject({ clientName: "Maria Exemplo", signatureUrl: expect.any(String), proposal: { slug }, session: { ipAddress: "203.0.113.7" } });
    expect(exported.proposals![0]).not.toHaveProperty("signatureStorageId");
    expect(JSON.stringify(exported)).not.toMatch(/tokenHash/);
    expect(exported.checkouts!.map((c) => c.customerName)).toEqual(["Maria"]);

    expect(await t.mutation(internal.rubrica.commerce.erasePersonalData, { email: "maria@exemplo.dev" })).toEqual({ anonymized: 2, bySource: { proposals: 1, checkouts: 1 } });
    const acceptance = (await t.run((ctx) => ctx.db.query("proposalAcceptances").first()))!;
    expect(acceptance).toMatchObject({ clientName: "[ANONIMIZADO]", clientDocument: "[ANONIMIZADO]", ipAddress: "0.0.0.0", contentHash: accepted.contentHash });
    expect(acceptance.signatureStorageId).toBeUndefined();
    expect(acceptance.contentSnapshot).not.toContain("Maria");
    expect(await t.run((ctx) => ctx.storage.get(signature))).toBeNull();
    const session = (await t.run((ctx) => ctx.db.query("proposalSessions").first()))!;
    expect(session.ipAddress).toBe("0.0.0.0");
    const checkouts = await t.run((ctx) => ctx.db.query("checkouts").collect());
    expect(checkouts.map((c) => c.customerName).sort()).toEqual(["A", "[ANONIMIZADO]"]);
    expect(await t.query(internal.rubrica.commerce.exportPersonalData, { email: "maria@exemplo.dev" })).toEqual({ proposals: [], checkouts: [] });
  });
});
