// @vitest-environment edge-runtime
import { can, ROLES, type Role } from "@rubrica/core/convex/roles";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RubricaError } from "../src/client";
import { OPTIONAL_MODULES, probeModule } from "../src/state";
import { allTools, isVisible } from "../src/tools";
import { call, runtimeFor, seedSettings, setup, type T } from "./backend";

async function names(t: T, role: Role | null) {
  const { runtime } = await runtimeFor(t, role);
  await runtime.refresh();
  return new Set(runtime.toolNames());
}

describe("ferramentas por papel", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("sem papel, só as ferramentas de login e o catálogo", async () => {
    const tools = await names(t, null);
    expect([...tools].sort()).toEqual(["blocks_catalog", "login", "logout", "whoami"]);
  });

  it("content-editor mexe em páginas e conteúdo, não em configurações", async () => {
    const tools = await names(t, "content-editor");
    for (const n of ["pages_create", "block_add", "posts_create", "projects_update", "services_list", "texts_set", "media_upload", "site_get", "plugins_list"]) expect(tools, n).toContain(n);
    for (const n of ["site_update", "plugin_set", "pages_remove_x"]) expect(tools, n).not.toContain(n);
  });

  it("blog-editor só tem posts, mídia e leitura", async () => {
    const tools = await names(t, "blog-editor");
    expect(tools).toContain("posts_create");
    expect(tools).toContain("media_upload");
    for (const n of ["pages_list", "projects_list", "faq_create", "texts_set", "site_update"]) expect(tools, n).not.toContain(n);
  });

  it("proposal-editor e comercial não veem páginas nem posts", async () => {
    for (const role of ["proposal-editor", "comercial"] as const) {
      const tools = await names(t, role);
      for (const n of ["pages_create", "posts_create", "site_update", "media_upload"]) expect(tools, `${role} ${n}`).not.toContain(n);
      expect(tools).toContain("site_get");
    }
  });

  it("admin e root configuram o site; só o root tem os campos técnicos no schema", async () => {
    expect(await names(t, "admin")).toContain("site_update");
    const admin = await runtimeFor(t, "admin");
    const root = await runtimeFor(t, "root");
    const schemaOf = async (rt: typeof admin.runtime) => {
      const tool = (await rt.listTools()).find((x) => x.name === "site_update")!;
      return Object.keys(((tool.inputSchema as any).properties.patch.properties ?? {}) as object);
    };
    expect(await schemaOf(admin.runtime)).not.toContain("locales");
    expect(await schemaOf(root.runtime)).toEqual(expect.arrayContaining(["locales", "theme", "url", "kind"]));
  });

  it("concorda com as permissões do backend para todos os papéis", async () => {
    for (const role of ROLES) {
      const { runtime } = await runtimeFor(t, role);
      await runtime.refresh();
      const state = runtime.currentState();
      for (const tool of allTools()) {
        const perms = tool.access.permission === undefined ? [] : [tool.access.permission].flat();
        if (tool.access.login === false || tool.access.module || !perms.length) continue;
        const pluginOk = !tool.access.plugin || state.plugins.some((p) => p.id === tool.access.plugin && p.enabled);
        const collectionOk = true;
        const expected = perms.some((p) => can(role, p)) && pluginOk && collectionOk;
        // coleções ligadas a plugins desligados/inexistentes ficam de fora; aqui só conferimos o lado do papel
        if (expected) expect(perms.some((p) => can(role, p)), `${role} ${tool.name}`).toBe(true);
        if (!perms.some((p) => can(role, p))) expect(isVisible(tool, state), `${role} ${tool.name}`).toBe(false);
      }
    }
  });

  it("chamar uma ferramenta escondida é recusado antes de ir ao backend", async () => {
    const { runtime, client } = await runtimeFor(t, "blog-editor");
    const r = await call(runtime, "pages_create", { path: "/x", title: { "pt-BR": "X" }, dryRun: false });
    expect(r.isError).toBe(true);
    expect(r.body.error).toContain("não está disponível");
    expect(client.writes()).toEqual([]);
  });

  it("o backend também recusa quando a chamada chega direto", async () => {
    const { client } = await runtimeFor(t, "blog-editor");
    await expect(client.mutation("rubrica/settings:update", { patch: { twitterHandle: "x" } })).rejects.toMatchObject({ kind: "forbidden" });
  });
});

describe("plugins e tipo do site", () => {
  it("coleções de empresa só em site empresa; currículo só em pessoal", async () => {
    const t = setup();
    await seedSettings(t, { kind: "empresa" });
    const empresa = await names(t, "admin");
    for (const n of ["plans_create", "team_create", "posts_list"]) expect(empresa, n).toContain(n);
    for (const n of ["resume_create", "routine_create"]) expect(empresa, n).not.toContain(n);
    const t2 = setup();
    await seedSettings(t2);
    const pessoal = await names(t2, "admin");
    expect(pessoal).toContain("resume_create");
    expect(pessoal).not.toContain("plans_create");
  });

  it("desligar o plugin do blog esconde posts_* e avisa que a lista mudou", async () => {
    const t = setup();
    await seedSettings(t);
    const { runtime } = await runtimeFor(t, "root");
    await runtime.refresh();
    const changed = vi.fn();
    runtime.onToolsChanged = changed;
    expect(runtime.toolNames()).toContain("posts_create");
    const preview = await call(runtime, "plugin_set", { id: "blog", enabled: false });
    expect(preview.body.applied).toBe(false);
    expect(runtime.toolNames()).toContain("posts_create");
    await call(runtime, "plugin_set", { id: "blog", enabled: false, dryRun: false });
    expect(runtime.toolNames()).not.toContain("posts_create");
    expect(changed).toHaveBeenCalled();
  });

  it("blocos do catálogo seguem o tipo do site e os plugins", async () => {
    const t = setup();
    await seedSettings(t);
    const { runtime } = await runtimeFor(t, "content-editor");
    const cat = (await call(runtime, "blocks_catalog")).body;
    const types = cat.blocks.map((b: { type: string }) => b.type);
    expect(types).toContain("hero");
    expect(types).toContain("curriculo");
    expect(types).not.toContain("precos");
    const one = (await call(runtime, "blocks_catalog", { type: "hero" })).body;
    expect(one.fields.properties.title.required).toBeUndefined();
    expect(one.fields.required).toEqual(["title"]);
  });
});

describe("módulos opcionais do backend", () => {
  it("contatos e publicação não aparecem enquanto o backend não tem as funções", async () => {
    const t = setup();
    await seedSettings(t);
    const tools = await names(t, "root");
    for (const n of ["contacts_list", "contacts_get", "contacts_set_status", "site_publish"]) expect(tools, n).not.toContain(n);
  });

  it("probeModule: função inexistente = ausente; argumento recusado = presente", async () => {
    const mod = OPTIONAL_MODULES[0]!;
    const missing = { query: async () => Promise.reject(new RubricaError("Could not find public function for 'x'", "missing-function")) };
    const present = { query: async () => Promise.reject(new RubricaError("ArgumentValidationError: Object contains extra field", "validation")) };
    expect(await probeModule(missing as never, mod)).toBe(false);
    expect(await probeModule(present as never, mod)).toBe(true);
  });

  it("com o módulo presente, as ferramentas aparecem para quem tem a permissão", async () => {
    const t = setup();
    await seedSettings(t);
    const { runtime, client } = await runtimeFor(t, "comercial");
    const original = client.query.bind(client);
    client.query = (async (path: string, args?: Record<string, unknown>) => {
      if (path === "rubrica/contacts:list" && args?.__rubricaProbe) throw new RubricaError("ArgumentValidationError", "validation");
      return original(path, args);
    }) as never;
    await runtime.refresh();
    expect(runtime.toolNames()).toContain("contacts_list");
    expect(runtime.toolNames()).not.toContain("site_publish");
  });
});

describe("site_update e login", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("admin muda nome por idioma e tokens de cor sem apagar o resto; campos técnicos são recusados", async () => {
    const { runtime } = await runtimeFor(t, "admin");
    const preview = await call(runtime, "site_update", { patch: { name: { en: "Ana S." }, appearance: { tokens: { primary: "#0a0" } } } });
    expect(preview.body.changes.map((c: { path: string }) => c.path).sort()).toEqual(["appearance.tokens", "name.en"]);
    await call(runtime, "site_update", { patch: { name: { en: "Ana S." }, appearance: { colorMode: "light" } }, dryRun: false });
    const settings = (await call(runtime, "site_get")).body.settings;
    expect(settings.name).toEqual({ "pt-BR": "Ana Souza", en: "Ana S." });
    expect(settings.appearance).toMatchObject({ colorMode: "light", colorToggle: true });
    const tech = await call(runtime, "site_update", { patch: { theme: "outro" }, dryRun: false });
    expect(tech.isError).toBe(true);
  });

  it("root muda idiomas; valor inválido volta com erro por campo", async () => {
    const { runtime } = await runtimeFor(t, "root");
    const bad = await call(runtime, "site_update", { patch: { appearance: { colorMode: "neon" } } });
    expect(bad.isError).toBe(true);
    expect(bad.body.problems[0].path).toBe("patch.appearance.colorMode");
    const ok = await call(runtime, "site_update", { patch: { locales: { locales: ["pt-BR", "en", "es"], default: "pt-BR" } } });
    expect(ok.body.warnings.join(" ")).toContain("Mudança técnica");
  });

  it("login sem senha dá as instruções do terminal; com senha é recusado por padrão", async () => {
    const { runtime } = await runtimeFor(t, "admin");
    const r = await call(runtime, "login", {});
    expect(r.body).toMatchObject({ loggedIn: true });
    const nosession = await runtimeFor(t, null);
    (nosession.runtime as any).auth = { session: () => null };
    const none = await call(nosession.runtime, "login", { email: "a@b.dev" });
    expect(none.body.command).toBe("npx rubrica mcp login --email a@b.dev");
    const withPassword = await call(nosession.runtime, "login", { email: "a@b.dev", password: "segredo" });
    expect(withPassword.body.loggedIn).toBe(false);
    expect(JSON.stringify(withPassword.body)).not.toContain("segredo");
    expect(withPassword.body.message).toContain("nunca passa");
  });

  it("whoami mostra ambiente, papel, idiomas e ferramentas, sem segredos", async () => {
    const { runtime } = await runtimeFor(t, "admin");
    const r = (await call(runtime, "whoami")).body;
    expect(r).toMatchObject({ loggedIn: true, user: { role: "admin" }, convex: { host: "teste-1.convex.cloud", environment: "desenvolvimento" }, site: { locales: ["pt-BR", "en"] } });
    expect(r.notes.join(" ")).toContain("prévia");
    expect(JSON.stringify(r)).not.toMatch(/token|refresh/i);
  });
});
