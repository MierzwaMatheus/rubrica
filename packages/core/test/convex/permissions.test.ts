// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { ROLES, type Role } from "../../src/convex/lib/roles";
import { api, as, seedSettings, setup, type T } from "./_setup";

type Client = Awaited<ReturnType<typeof as>>;

async function allowed(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (e) {
    if (/Sem permissão|Não autenticado|só a agência/.test((e as Error).message)) return false;
    throw e;
  }
}

const hero = { id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "Oi" } } };

/** Ação → papéis que podem. */
const MATRIX: Record<string, { roles: Role[]; run: (c: Client, i: number) => Promise<unknown> }> = {
  "pages.create": { roles: ["root", "admin", "content-editor"], run: (c, i) => c.mutation(api.rubrica.pages.create, { path: `/p${i}`, title: { "pt-BR": "P" }, blocks: [hero] }) },
  "pages.list": { roles: ["root", "admin", "content-editor"], run: (c) => c.query(api.rubrica.pages.list, {}) },
  "posts.create": {
    roles: ["root", "admin", "content-editor", "blog-editor"],
    run: (c) => c.mutation(api.rubrica.posts.create, { title: { "pt-BR": "Post" }, content: { "pt-BR": "<p>x</p>" } }),
  },
  "projects.create": { roles: ["root", "admin", "content-editor"], run: (c) => c.mutation(api.rubrica.projects.create, { title: { "pt-BR": "Case" } }) },
  "services.create": { roles: ["root", "admin", "content-editor"], run: (c) => c.mutation(api.rubrica.services.create, { title: { "pt-BR": "Design" } }) },
  "faq.create": { roles: ["root", "admin", "content-editor"], run: (c) => c.mutation(api.rubrica.faq.create, { question: { "pt-BR": "?" }, answer: { "pt-BR": "!" } }) },
  "texts.set": { roles: ["root", "admin", "content-editor"], run: (c) => c.mutation(api.rubrica.texts.set, { key: "nav.home", value: { "pt-BR": "Casa" } }) },
  "media.generateUploadUrl": { roles: ["root", "admin", "content-editor", "blog-editor"], run: (c) => c.mutation(api.rubrica.media.generateUploadUrl, {}) },
  "settings.get": { roles: [...ROLES], run: (c) => c.query(api.rubrica.settings.get, {}) },
  "settings.update (aparência)": {
    roles: ["root", "admin"],
    run: (c) => c.mutation(api.rubrica.settings.update, { patch: { appearance: { colorMode: "light", colorToggle: false } } }),
  },
  "settings.update (tema)": { roles: ["root"], run: (c) => c.mutation(api.rubrica.settings.update, { patch: { theme: "cyberpunk" } }) },
  "settings.setPlugin": { roles: ["root", "admin"], run: (c) => c.mutation(api.rubrica.settings.setPlugin, { id: "translation", enabled: true }) },
  "users.list": { roles: ["root"], run: (c) => c.query(api.rubrica.users.list, {}) },
  "audit.recent": { roles: ["root"], run: (c) => c.query(api.rubrica.audit.recent, {}) },
};

describe("permissões por papel", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  for (const [action, { roles, run }] of Object.entries(MATRIX)) {
    it(action, async () => {
      const result: Record<string, boolean> = {};
      let i = 0;
      for (const role of ROLES) result[role] = await allowed(async () => run(await as(t, role), i++));
      expect(result).toEqual(Object.fromEntries(ROLES.map((r) => [r, roles.includes(r)])));
    });
  }

  it("planos: conteúdo e comercial (site empresa)", async () => {
    await seedSettings(t, { kind: "empresa" });
    const result: Record<string, boolean> = {};
    for (const role of ROLES) {
      const c = await as(t, role);
      result[role] = await allowed(() => c.mutation(api.rubrica.plans.create, { name: { "pt-BR": "Básico" }, features: [{ "pt-BR": "Site" }] }));
    }
    expect(result).toEqual({ root: true, admin: true, "content-editor": true, "blog-editor": false, "proposal-editor": false, comercial: true });
  });

  it("sem login nada passa, menos o snapshot e as consultas de login", async () => {
    await expect(t.query(api.rubrica.pages.list, {})).rejects.toThrow(/Não autenticado/);
    await expect(t.mutation(api.rubrica.posts.create, { title: { en: "x" }, content: { en: "x" } })).rejects.toThrow(/Não autenticado/);
    await expect(t.query(api.rubrica.site.snapshot, {})).resolves.toBeTruthy();
    await expect(t.query(api.rubrica.users.me, {})).resolves.toBeNull();
    await expect(t.query(api.rubrica.users.isSetupRequired, {})).resolves.toBe(true);
  });

  it("usuário logado sem papel não tem acesso", async () => {
    const c = await as(t, null);
    await expect(c.query(api.rubrica.settings.get, {})).rejects.toThrow(/Sem permissão/);
    expect(await c.query(api.rubrica.users.me, {})).toMatchObject({ role: null });
  });

  it("lixeira: restaurar e apagar de vez só root", async () => {
    const editor = await as(t, "content-editor");
    const id = await editor.mutation(api.rubrica.services.create, { title: { "pt-BR": "S" } });
    await editor.mutation(api.rubrica.services.remove, { id });
    await expect(editor.mutation(api.rubrica.services.restore, { id })).rejects.toThrow(/Sem permissão/);
    await expect(editor.mutation(api.rubrica.services.removePermanently, { id })).rejects.toThrow(/Sem permissão/);
    const root = await as(t, "root");
    await root.mutation(api.rubrica.services.restore, { id });
    await root.mutation(api.rubrica.services.removePermanently, { id });
    expect(await root.query(api.rubrica.services.get, { id })).toBeNull();
  });
});
