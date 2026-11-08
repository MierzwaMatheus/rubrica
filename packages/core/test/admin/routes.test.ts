import { describe, expect, it } from "vitest";
import { adminScreens, buildMenu, screenAccess, staticAdminPaths } from "../../src/admin/routes";
import { CORE_PLUGINS } from "../../src/plugins/registry";
import { enabledPlugins } from "../../src/plugins/contract";

const ctx = (role: Parameters<typeof screenAccess>[1]["role"], kind: "pessoal" | "empresa" = "pessoal", configured: Record<string, boolean> = {}) => ({
  role,
  kind,
  enabled: enabledPlugins(CORE_PLUGINS, kind, configured),
  plugins: CORE_PLUGINS,
});

describe("telas e menu do painel", () => {
  it("junta as telas do núcleo e as dos plugins, sem repetir caminho", () => {
    const paths = adminScreens(CORE_PLUGINS).map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual(expect.arrayContaining(["/admin", "/admin/paginas", "/admin/usuarios", "/admin/blog", "/admin/planos"]));
    expect(adminScreens(CORE_PLUGINS).find((s) => s.path === "/admin/midia")?.core).toBe(true);
  });

  it("gera os caminhos estáticos do build (o /admin como índice)", () => {
    const paths = staticAdminPaths(CORE_PLUGINS);
    expect(paths).toContain(undefined);
    expect(paths).toContain("paginas/editar");
    expect(paths).toContain("propostas");
  });

  it("filtra o menu pelo papel", () => {
    const items = (role: Parameters<typeof screenAccess>[1]["role"]) => buildMenu(ctx(role)).flatMap((g) => g.items.map((i) => i.label));
    expect(items("root")).toEqual(expect.arrayContaining(["Páginas", "Usuários", "Plugins", "Atividades"]));
    expect(items("blog-editor")).toEqual(["Início", "Mídia", "Blog"]);
    expect(items("comercial")).toEqual(expect.arrayContaining(["Contatos", "Propostas", "Pagamentos"]));
    expect(items("comercial")).not.toContain("Páginas");
    expect(items("admin")).not.toContain("Usuários");
    // Subtelas não aparecem no menu.
    expect(items("root")).not.toContain("Editar página");
  });

  it("filtra pelo tipo do site e pelos plugins ligados", () => {
    const labels = (kind: "pessoal" | "empresa", configured = {}) => buildMenu(ctx("root", kind, configured)).flatMap((g) => g.items.map((i) => i.label));
    expect(labels("pessoal")).toContain("Currículo");
    expect(labels("pessoal")).not.toContain("Planos");
    expect(labels("empresa")).toContain("Planos");
    expect(labels("empresa")).not.toContain("Currículo");
    expect(labels("pessoal", { blog: false })).not.toContain("Blog");
    // Dependência desligada desliga quem depende dela.
    expect(labels("pessoal", { proposals: false })).not.toContain("Contratos");
  });

  it("rota sem permissão ou de plugin desligado vira aviso", () => {
    expect(screenAccess("/admin/usuarios", ctx("admin")).status).toBe("forbidden");
    expect(screenAccess("/admin/usuarios/", ctx("root")).status).toBe("ok");
    expect(screenAccess("/admin/blog", ctx("root", "pessoal", { blog: false }))).toMatchObject({ status: "plugin-off", plugin: { id: "blog" } });
    expect(screenAccess("/admin/planos", ctx("root", "pessoal")).status).toBe("plugin-off");
    expect(screenAccess("/admin/nada", ctx("root")).status).toBe("not-found");
    expect(screenAccess("/admin", ctx(null)).status).toBe("forbidden");
  });

  it("agrupa: coleções em Conteúdo, vendas em Comercial", () => {
    const groups = Object.fromEntries(buildMenu(ctx("root")).map((g) => [g.group, g.items.map((i) => i.label)]));
    expect(groups["Conteúdo"]).toEqual(expect.arrayContaining(["Blog", "Projetos", "Depoimentos"]));
    expect(groups["Comercial"]).toEqual(expect.arrayContaining(["Contatos", "Propostas"]));
    expect(groups["Site"]?.[0]).toBe("Início");
  });
});
