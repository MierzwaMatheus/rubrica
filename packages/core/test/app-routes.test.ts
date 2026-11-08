import { describe, expect, it } from "vitest";
import { definePlugin } from "../src/plugins/contract";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { appRewrites, appRoutes, appShellFor, appShells, fillPath, matchPath } from "../src/plugins/app-routes";

const plugins = [
  definePlugin({
    id: "a",
    label: "A",
    description: "",
    kinds: ["pessoal"],
    defaultEnabled: {},
    routes: [
      { path: "/curriculo", kind: "public" },
      { path: "/coisa/:id", kind: "app", island: "coisa" },
    ],
  }),
  definePlugin({ id: "b", label: "B", description: "", kinds: ["pessoal"], defaultEnabled: {}, routes: [{ path: "/outra/:x/fim", kind: "app", island: "outra" }] }),
];

describe("rotas do app", () => {
  it("lê as rotas `app` do registro (genérico), só dos plugins ligados quando pedido", () => {
    expect(appRoutes(plugins).map((r) => r.island)).toEqual(["coisa", "outra"]);
    expect(appRoutes(plugins, new Set(["b"]))).toEqual([{ plugin: "b", path: "/outra/:x/fim", island: "outra" }]);
  });

  it("propostas e pagamentos declaram as quatro páginas públicas", () => {
    expect(appRoutes(CORE_PLUGINS).map((r) => [r.plugin, r.path, r.island])).toEqual([
      ["proposals", "/proposta/:slug", "proposta"],
      ["proposals", "/proposta/:slug/aceitar", "proposta-aceite"],
      ["payments", "/checkout/:uniqueLink", "checkout"],
      ["payments", "/payment-success/:uniqueLink", "pagamento-concluido"],
    ]);
  });

  it("gera uma página por rota e idioma, com o prefixo do idioma", () => {
    const shells = appShells(appRoutes(plugins), ["pt-BR", "en"], (l) => (l === "pt-BR" ? "" : "en"));
    expect(shells.map((s) => [s.pattern, s.shell, s.locale])).toEqual([
      ["/coisa/:id", "/_rubrica/app/coisa", "pt-BR"],
      ["/outra/:x/fim", "/_rubrica/app/outra", "pt-BR"],
      ["/en/coisa/:id", "/_rubrica/app/en/coisa", "en"],
      ["/en/outra/:x/fim", "/_rubrica/app/en/outra", "en"],
    ]);
    expect(appShellFor(shells, "/en/coisa/42")?.shell).toBe("/_rubrica/app/en/coisa");
    expect(appShellFor(shells, "/coisa/42/")?.shell).toBe("/_rubrica/app/coisa");
    expect(appShellFor(shells, "/fr/coisa/42")).toBeUndefined();
    expect(appShellFor(shells, "/coisa")).toBeUndefined();
  });

  it("casa e preenche parâmetros", () => {
    expect(matchPath("/proposta/:slug/aceitar", "/proposta/acme-x1/aceitar")).toEqual({ slug: "acme-x1" });
    expect(matchPath("/proposta/:slug", "/proposta/a%20b")).toEqual({ slug: "a b" });
    expect(matchPath("/proposta/:slug", "/proposta/a/aceitar")).toBeNull();
    expect(matchPath("/proposta/:slug", "/checkout/a")).toBeNull();
    expect(matchPath("/proposta/:slug", "/proposta/%E0%A4%A")).toBeNull();
    expect(fillPath("/en/proposta/:slug/aceitar", { slug: "a b" })).toBe("/en/proposta/a%20b/aceitar");
  });

  it("reescritas da hospedagem: idioma principal e `/:locale`, sem sobreposição entre elas", () => {
    const rewrites = appRewrites(CORE_PLUGINS);
    expect(rewrites).toContainEqual({ from: "/proposta/:slug", to: "/_rubrica/app/proposta" });
    expect(rewrites).toContainEqual({ from: "/:locale/proposta/:slug/aceitar", to: "/_rubrica/app/:locale/proposta-aceite" });
    expect(rewrites).toContainEqual({ from: "/:locale/checkout/:uniqueLink", to: "/_rubrica/app/:locale/checkout" });
    // Primeira regra que casa vence (Netlify): cada caminho público casa com uma só.
    const samples = ["/proposta/x", "/proposta/x/aceitar", "/en/proposta/x", "/en/proposta/x/aceitar", "/checkout/x", "/es/payment-success/x"];
    for (const path of samples) expect(rewrites.filter((r) => matchPath(r.from, path))).toHaveLength(1);
    // As próprias páginas geradas não são reescritas.
    for (const shell of ["/_rubrica/app/proposta", "/_rubrica/app/en/proposta-aceite"]) expect(rewrites.filter((r) => matchPath(r.from, shell))).toHaveLength(0);
  });
});
