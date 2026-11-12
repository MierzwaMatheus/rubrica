import { describe, expect, it } from "vitest";
import { buildMenu } from "../../src/admin/routes";
import { activeGroup, isCurrentPath, readOpenGroups, resolveOpenGroups, sidebarLayout, SIDEBAR_STORAGE_KEY, writeOpenGroups } from "../../src/admin/lib/sidebar";
import { enabledPlugins } from "../../src/plugins/contract";
import { CORE_PLUGINS } from "../../src/plugins/registry";

const menu = (role: "root" | "blog-editor" | "comercial", configured: Record<string, boolean> = {}) =>
  buildMenu({ role, kind: "pessoal", enabled: enabledPlugins(CORE_PLUGINS, "pessoal", configured), plugins: CORE_PLUGINS });

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
};

describe("grupos do menu lateral", () => {
  it("deixa o Início fora dos grupos e mantém a ordem dos grupos", () => {
    const { pinned, sections } = sidebarLayout(menu("root"));
    expect(pinned.map((i) => i.label)).toEqual(["Início"]);
    expect(sections.map((s) => s.group)).toEqual(["Site", "Conteúdo", "Comercial", "Administração"]);
    expect(sections.flatMap((s) => s.items).some((i) => i.path === "/admin")).toBe(false);
  });

  it("some com o grupo vazio (papel ou plugin)", () => {
    const blog = sidebarLayout(menu("blog-editor"));
    expect(blog.sections.map((s) => s.group)).toEqual(["Site", "Conteúdo"]);
    const sales = sidebarLayout(menu("comercial", { "contact-wizard": false, proposals: false, payments: false }));
    expect(sales.sections.map((s) => s.group)).not.toContain("Comercial");
    // Um grupo que só tinha o Início também some.
    expect(sidebarLayout([{ group: "Site", items: [menu("root")[0]!.items[0]!] }]).sections).toEqual([]);
  });

  it("acha o grupo da tela aberta, inclusive numa subtela", () => {
    const { sections } = sidebarLayout(menu("root"));
    expect(activeGroup(sections, "/admin/blog")).toBe("Conteúdo");
    expect(activeGroup(sections, "/admin/paginas/editar")).toBe("Site");
    expect(activeGroup(sections, "/admin/propostas")).toBe("Comercial");
    expect(activeGroup(sections, "/admin")).toBeUndefined();
    expect(activeGroup(sections, "/admin/conta")).toBeUndefined();
    expect(isCurrentPath("/admin", "/admin/blog")).toBe(false);
    expect(isCurrentPath("/admin/paginas", "/admin/paginas-x")).toBe(false);
  });

  it("abre o grupo da tela aberta por cima do que foi guardado", () => {
    expect(resolveOpenGroups({}, undefined)).toEqual({});
    expect(resolveOpenGroups({ Conteúdo: false, Site: true }, "Conteúdo")).toEqual({ Conteúdo: true, Site: true });
  });

  it("guarda e lê o estado, tolerando valor estragado e armazenamento indisponível", () => {
    const storage = memory();
    writeOpenGroups({ Site: true, Comercial: false }, storage);
    expect(readOpenGroups(storage)).toEqual({ Site: true, Comercial: false });
    expect(readOpenGroups(memory({ [SIDEBAR_STORAGE_KEY]: "{nada" }))).toEqual({});
    expect(readOpenGroups(memory({ [SIDEBAR_STORAGE_KEY]: "[1]" }))).toEqual({});
    expect(readOpenGroups(memory({ [SIDEBAR_STORAGE_KEY]: '{"Site":"sim","Conteúdo":true}' }))).toEqual({ Conteúdo: true });
    const broken = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
    expect(readOpenGroups(broken)).toEqual({});
    expect(() => writeOpenGroups({ Site: true }, broken)).not.toThrow();
  });
});
