// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { BASE_SETTINGS, internal, setup } from "./_setup";
import { blockIds, localizeRecipeValue, navigationFromPages, pagesFromRecipe, pickRecipeText } from "../../src/convex/lib/seed";
import { pruneByValidator } from "../../src/convex/seed";
import { vSiteSettings } from "../../src/convex/validators";
import { CORE_RECIPES } from "../../src/theme/recipes";
import type { Recipe } from "../../src/theme/contract";

const locales = { locales: ["pt-BR", "en"], default: "pt-BR" };

describe("receita → páginas (puro)", () => {
  it("escolhe o texto do idioma exato ou da mesma língua", () => {
    const tr = { "pt-BR": "Olá", en: "Hi", es: "Hola" };
    expect(pickRecipeText(tr, "pt-BR")).toBe("Olá");
    expect(pickRecipeText(tr, "en-US")).toBe("Hi");
    expect(pickRecipeText(tr, "pt")).toBe("Olá");
    expect(pickRecipeText(tr, "fr")).toBeUndefined();
  });

  it("converte os textos em qualquer nível e deixa o resto como está", () => {
    const value = { title: { "pt-BR": "A", en: "B", es: "C" }, items: [{ value: "8+", label: { "pt-BR": "anos", en: "years", es: "años" } }], anchor: "contato", n: 3 };
    expect(localizeRecipeValue(value, ["pt-BR"])).toEqual({ title: { "pt-BR": "A" }, items: [{ value: "8+", label: { "pt-BR": "anos" } }], anchor: "contato", n: 3 });
  });

  it("dá ids estáveis aos blocos, numerando os repetidos", () => {
    expect(blockIds([{ type: "texto" }, { type: "hero" }, { type: "texto" }])).toEqual(["texto", "hero", "texto-2"]);
  });

  it("monta as páginas da receita do núcleo nos idiomas do site", () => {
    const pages = pagesFromRecipe(CORE_RECIPES.pessoal, { locales });
    expect(pages.map((p) => p.path)).toEqual(CORE_RECIPES.pessoal.map((p) => p.path));
    const home = pages[0]!;
    expect(home.title).toEqual({ "pt-BR": "Início", en: "Home" });
    expect(home.blocks[0]).toMatchObject({ id: "hero", type: "hero", visible: true });
    expect(Object.keys((home.blocks[0]!.fields.title as object))).toEqual(["pt-BR", "en"]);
  });

  it("tira os blocos não aceitos e as páginas que ficam vazias", () => {
    const pages = pagesFromRecipe(CORE_RECIPES.pessoal, { locales, allowBlock: (t) => t !== "curriculo" && t !== "cases" });
    expect(pages.some((p) => p.path === "/curriculo")).toBe(false);
    expect(pages.some((p) => p.path === "/portfolio")).toBe(false);
    expect(pages[0]!.blocks.some((b) => b.type === "cases")).toBe(false);
  });

  it("pula página sem título em nenhum idioma do site", () => {
    const recipe: Recipe = [{ path: "/so-es", title: { es: "Solo" }, blocks: [{ type: "texto", fields: { body: { es: "x" } } }] }];
    expect(pagesFromRecipe(recipe, { locales })).toEqual([]);
  });

  it("monta o menu sem a política de privacidade", () => {
    const nav = navigationFromPages(pagesFromRecipe(CORE_RECIPES.pessoal, { locales }));
    expect(nav.map((n) => n.href)).not.toContain("/privacidade");
    expect(nav[0]).toEqual({ label: { "pt-BR": "Início", en: "Home" }, href: "/" });
  });

  it("descarta campos que o validador não conhece", () => {
    const pruned = pruneByValidator(vSiteSettings, { ...BASE_SETTINGS, extra: 1, appearance: { ...BASE_SETTINGS.appearance, scheme: "neon" } }) as Record<string, unknown>;
    expect(pruned.extra).toBeUndefined();
    expect(pruned.appearance).toEqual(BASE_SETTINGS.appearance);
    expect(pruned.name).toEqual(BASE_SETTINGS.name);
  });
});

describe("rubrica/seed (backend)", () => {
  it("status de um banco vazio", async () => {
    const t = setup();
    expect(await t.query(internal.rubrica.seed.status, {})).toEqual({ configured: false, kind: null, theme: null, pages: 0, hasRoot: false });
  });

  it("grava as configurações e monta as páginas pela receita do núcleo", async () => {
    const t = setup();
    const result = await t.mutation(internal.rubrica.seed.apply, { settings: { ...BASE_SETTINGS, navigation: [] } });
    expect(result.pagesSkipped).toBe(0);
    expect(result.pagesCreated).toBe(CORE_RECIPES.pessoal.length);
    const pages = await t.run((ctx) => ctx.db.query("pages").collect());
    const home = pages.find((p) => p.path === "/")!;
    expect(home.system).toBe(true);
    expect(home.published).toBe(true);
    expect(home.blocks.map((b) => b.type)).toEqual(CORE_RECIPES.pessoal[0]!.blocks.map((b) => b.type));
    const settings = await t.run((ctx) => ctx.db.query("siteSettings").first());
    expect(settings?.navigation[0]).toEqual({ label: { "pt-BR": "Início", en: "Home" }, href: "/" });
    expect((await t.query(internal.rubrica.seed.status, {})).configured).toBe(true);
  });

  it("usa a receita enviada pelo CLI e respeita os plugins desligados", async () => {
    const t = setup();
    const recipe: Recipe = [
      { path: "/", title: { "pt-BR": "Início" }, blocks: [{ type: "hero", fields: { title: { "pt-BR": "Oi" } } }, { type: "posts-recentes" }] },
    ];
    await t.mutation(internal.rubrica.seed.apply, { settings: { ...BASE_SETTINGS, plugins: { blog: false } }, recipe });
    const pages = await t.run((ctx) => ctx.db.query("pages").collect());
    expect(pages).toHaveLength(1);
    expect(pages[0]!.blocks.map((b) => b.type)).toEqual(["hero"]);
    // menu enviado nas configurações é mantido
    const settings = await t.run((ctx) => ctx.db.query("siteSettings").first());
    expect(settings?.navigation).toEqual(BASE_SETTINGS.navigation);
  });

  it("não sobrescreve sem pedir e não duplica páginas", async () => {
    const t = setup();
    await t.mutation(internal.rubrica.seed.apply, { settings: BASE_SETTINGS });
    await expect(t.mutation(internal.rubrica.seed.apply, { settings: BASE_SETTINGS })).rejects.toThrow(/já tem configurações/);
    const again = await t.mutation(internal.rubrica.seed.apply, { settings: BASE_SETTINGS, overwrite: true });
    expect(again.pagesCreated).toBe(0);
    expect(again.pagesSkipped).toBe(CORE_RECIPES.pessoal.length);
  });

  it("aceita campos novos de outra versão sem quebrar", async () => {
    const t = setup();
    await t.mutation(internal.rubrica.seed.apply, { settings: { ...BASE_SETTINGS, futuro: true, appearance: { ...BASE_SETTINGS.appearance, scheme: "neon" } } });
    const settings = await t.run((ctx) => ctx.db.query("siteSettings").first());
    expect(settings?.appearance).toEqual(BASE_SETTINGS.appearance);
  });

  it("patchSettings muda parte das configurações e valida", async () => {
    const t = setup();
    await expect(t.mutation(internal.rubrica.seed.patchSettings, { patch: { theme: "x" } })).rejects.toThrow(/ainda não foi configurado/);
    await t.mutation(internal.rubrica.seed.apply, { settings: BASE_SETTINGS });
    await t.mutation(internal.rubrica.seed.patchSettings, { patch: { theme: "cyberpunk", name: { "pt-BR": "Novo" } } });
    const settings = await t.run((ctx) => ctx.db.query("siteSettings").first());
    expect(settings?.theme).toBe("cyberpunk");
    expect(settings?.name).toEqual({ "pt-BR": "Novo" });
    await expect(t.mutation(internal.rubrica.seed.patchSettings, { patch: { url: "sem-protocolo" } })).rejects.toThrow(/URL do site inválida/);
  });
});
