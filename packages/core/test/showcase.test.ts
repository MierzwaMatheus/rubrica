/** Vitrine da bateria: páginas geradas a partir do tema, com campos válidos. */
import { describe, expect, it } from "vitest";
import { validateBlock } from "../src/blocks/define";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { emptyCollections, type DataSource } from "../src/data/source";
import { SHOWCASE_EMPTY_TAG, SHOWCASE_PREFIX, showcaseBlocks, showcasePages, withShowcase } from "../src/data/showcase";
import { CORE_RECIPES } from "../src/theme/recipes";
import type { SiteSettings } from "../src/content/types";
import type { Recipe } from "../src/theme/contract";

const defs = new Map(CORE_BLOCKS.map((b) => [b.type, b]));
const site = (kind: "pessoal" | "empresa"): Pick<SiteSettings, "kind" | "locales" | "plugins"> => ({
  kind,
  locales: { locales: ["pt-BR", "en"], default: "pt-BR" },
  plugins: {},
});

describe("showcasePages", () => {
  it("uma página por bloco do tipo de site, só no idioma principal, com campos válidos", () => {
    const pages = showcasePages({ theme: {}, blocks: CORE_BLOCKS, site: site("pessoal") });
    const blockPages = pages.filter((p) => !p.path.startsWith(`${SHOWCASE_PREFIX}/receita`));
    const types = blockPages.map((p) => p.path.slice(SHOWCASE_PREFIX.length + 1));
    expect(types).toContain("hero");
    expect(types).toContain("curriculo");
    expect(types).not.toContain("precos");
    for (const page of pages) expect(Object.keys(page.title)).toEqual(["pt-BR"]);
    const errors = pages.flatMap((p) => p.blocks.flatMap((b) => validateBlock(defs.get(b.type)!, b).map((e) => `${p.path}#${b.id} ${e.path}: ${e.message}`)));
    expect(errors).toEqual([]);
    const ids = pages.flatMap((p) => p.blocks.map((b) => `${p.path}#${b.id}`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("os blocos de empresa entram no site de empresa", () => {
    const types = showcasePages({ theme: {}, blocks: CORE_BLOCKS, site: site("empresa") }).map((p) => p.path);
    expect(types).toEqual(expect.arrayContaining(["/vitrine/precos", "/vitrine/equipe", "/vitrine/localizacao", "/vitrine/logos-clientes"]));
    expect(types).not.toContain("/vitrine/curriculo");
  });

  it("cada variação declarada ganha instâncias cheia, curta, por opção de seleção e vazia", () => {
    const theme = { variants: { contato: [{ value: "a", label: "A" }, { value: "b", label: "B" }] } };
    const blocks = showcaseBlocks(defs.get("contato")!, theme, ["pt-BR"]);
    // 3 opções de formato → 3 instâncias por variação; sem coleção, sem instância vazia.
    expect(blocks.map((b) => `${b.variant}:${b.fields.mode}`)).toEqual(["a:wizard", "a:form", "a:channels", "b:wizard", "b:form", "b:channels"]);
    const cheio = blocks[0]!.fields;
    const curto = blocks[1]!.fields;
    expect(cheio.anchor).toBe("v-contato-a-1");
    expect(curto.anchor).toBeUndefined();
    expect((cheio.title as Record<string, string>)["pt-BR"]!.length).toBeGreaterThan(100);
    expect((curto.title as Record<string, string>)["pt-BR"]).toBe("Título curto");
  });

  it("listas cheias no máximo, imagem só na cheia e instância vazia nos blocos com coleção", () => {
    const hero = showcaseBlocks(defs.get("hero")!, {}, ["pt-BR"]);
    expect(hero[0]!.variant).toBeUndefined();
    expect(hero[0]!.fields.image).toBeDefined();
    expect(hero[1]!.fields.image).toBeUndefined();
    expect((hero[0]!.fields.tags as unknown[]).length).toBe(8);
    const cases = showcaseBlocks(defs.get("cases")!, { variants: { cases: [{ value: "grade", label: "Grade" }] } }, ["pt-BR"]);
    expect(cases.map((b) => b.source)).toEqual([
      { collection: "projects", sort: "order" },
      { collection: "projects", featured: true, limit: 3, sort: "order" },
      { collection: "projects", tags: [SHOWCASE_EMPTY_TAG] },
    ]);
  });

  it("acrescenta as páginas da receita do tema com o prefixo da vitrine", () => {
    const recipe: Recipe = [
      { path: "/", title: { "pt-BR": "Início", en: "Home" }, blocks: [{ type: "hero", fields: { title: { "pt-BR": "Oi", en: "Hi" } } }] },
      { path: "/precos", title: { "pt-BR": "Preços" }, blocks: [{ type: "precos" }] },
    ];
    const pages = showcasePages({ theme: { recipes: { pessoal: recipe } }, blocks: CORE_BLOCKS, site: site("pessoal") });
    const recipePages = pages.filter((p) => p.path.startsWith("/vitrine/receita"));
    // `precos` é de empresa: a página sem bloco aceito fica de fora.
    expect(recipePages.map((p) => [p.path, p.title])).toEqual([["/vitrine/receita", { "pt-BR": "Receita: Início" }]]);
    // Sem receita do tema, vale a do núcleo.
    const core = showcasePages({ theme: {}, blocks: CORE_BLOCKS, site: site("empresa") }).filter((p) => p.path.startsWith("/vitrine/receita"));
    expect(core.length).toBe(CORE_RECIPES.empresa.length);
  });

  it("withShowcase soma as páginas às do conteúdo", async () => {
    const base: DataSource = {
      load: async () => ({ site: { ...site("pessoal") } as SiteSettings, pages: [], collections: emptyCollections(), texts: {} }),
    };
    const snapshot = await withShowcase(base, {}, CORE_BLOCKS).load();
    expect(snapshot.pages.length).toBeGreaterThan(10);
    expect(snapshot.pages.every((p) => p.path.startsWith(SHOWCASE_PREFIX))).toBe(true);
  });
});
