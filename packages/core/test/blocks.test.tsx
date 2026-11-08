import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { fixtureSource } from "../src/data/source";
import { buildSite, type BuiltSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { validateBlock } from "../src/blocks/define";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme, type BlockProps } from "../src/theme/contract";
import { DEFAULT_BLOCKS, DefaultShell } from "../src/components";
import { DEFAULT_UI_TEXTS } from "../src/i18n/ui-texts";
import { CORE_RECIPES, recipeFor } from "../src/theme/recipes";
import { buildResumeHtml } from "../src/islands/curriculo-pdf";
import { islandNameFor, CORE_ISLANDS, ISLAND_META } from "../src/islands";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const demo = (kind: string) => fileURLToPath(new URL(`../../../apps/demo/fixtures/${kind}`, import.meta.url));

async function load(kind: "pessoal" | "empresa"): Promise<BuiltSite> {
  return buildSite({ snapshot: await fixtureSource(demo(kind)).load(), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
}

const ISLAND = createElement("i", { "data-island": "1" });
const MARK = 'data-island="1"';

function render(type: string, props: Partial<BlockProps> & Pick<BlockProps, "ctx">): string {
  const Block = DEFAULT_BLOCKS[type]!;
  return renderToStaticMarkup(
    createElement(Block, { id: "x", variant: "default", fields: {}, items: [], headingLevel: 2, index: 1, total: 3, ...props } as BlockProps),
  );
}

describe("blocos padrão", () => {
  it("há componente padrão para os 19 blocos do catálogo", () => {
    expect(CORE_BLOCKS).toHaveLength(19);
    for (const b of CORE_BLOCKS) expect(DEFAULT_BLOCKS[b.type], b.type).toBeTypeOf("function");
  });

  it("não quebram com campos e itens vazios (inclusive com ilha)", async () => {
    const ctx = (await load("empresa")).context("pt-BR", "/");
    for (const b of CORE_BLOCKS) {
      expect(() => render(b.type, { ctx }), b.type).not.toThrow();
      expect(() => render(b.type, { ctx, island: ISLAND, fields: { showDownload: true, allowSubmission: true } }), b.type).not.toThrow();
    }
  });

  it("cases: mostra a métrica do projeto só quando existe", async () => {
    const ctx = (await load("pessoal")).context("pt-BR", "/");
    const project = (metric?: { value: string; label: string }) => ({
      id: "p1", slug: "p", url: "/portfolio/p", title: "Case", sections: [], gallery: [], links: [], tags: [], featured: false, seo: {}, ...(metric ? { metric } : {}),
    });
    const withMetric = render("cases", { ctx, items: [project({ value: "~50", label: "skills em produção" })] as never });
    expect(withMetric).toContain("rb-card__metric");
    expect(withMetric).toContain("<strong>~50</strong> skills em produção");
    expect(render("cases", { ctx, items: [project()] as never })).not.toContain("rb-card__metric");
  });

  it("título da seção no nível pedido, e itens em h3", async () => {
    const site = await load("empresa");
    const ctx = site.context("pt-BR", "/");
    for (const route of site.routes) {
      if (route.type !== "page") continue;
      for (const b of route.page.blocks) {
        const html = render(b.type, { ctx, ...b } as never);
        if (b.type === "hero") {
          expect(html, b.type).toContain("<h1");
          continue;
        }
        expect((html.match(/<h1/g) ?? []).length, b.type).toBe(0);
        expect((html.match(/<h2/g) ?? []).length, `${route.url} ${b.type}`).toBeLessThanOrEqual(1);
        if (b.fields.title) expect(html, b.type).toMatch(/<h2[^>]*>/);
      }
    }
  });

  it("nenhum texto de interface em português quando o idioma é inglês", async () => {
    const ptOnly = Object.values(DEFAULT_UI_TEXTS)
      .map((v) => v.pt!)
      .filter((pt) => pt && pt.length >= 10 && !pt.includes("{") && !Object.values(DEFAULT_UI_TEXTS).some((o) => o.en === pt));
    for (const kind of ["pessoal", "empresa"] as const) {
      const site = await load(kind);
      for (const route of site.routes.filter((r) => r.locale === "en" && r.type === "page")) {
        if (route.type !== "page") continue;
        const ctx = site.context("en", route.url, route.alternates);
        for (const b of route.page.blocks) {
          // com ilha e todos os campos ligados, para exercitar o máximo de texto de interface
          const html = render(b.type, { ctx, ...b, island: b.interactive ? ISLAND : undefined } as never);
          for (const pt of ptOnly) expect(html, `${kind} ${route.url} ${b.type}: "${pt}"`).not.toContain(pt);
        }
      }
    }
  });

  it("a mesma regra vale para os textos de interface em espanhol", async () => {
    const site = await load("empresa");
    for (const route of site.routes.filter((r) => r.locale === "es" && r.type === "page")) {
      if (route.type !== "page") continue;
      const ctx = site.context("es", route.url, route.alternates);
      for (const b of route.page.blocks) {
        const html = render(b.type, { ctx, ...b } as never);
        expect(html, `${route.url} ${b.type}`).not.toContain("Ler mais");
        expect(html, `${route.url} ${b.type}`).not.toContain("Nada por aqui");
      }
    }
  });

  it("só os blocos interativos montam ilha, e só quando o recurso está ligado", async () => {
    const interactiveTypes = new Set(CORE_BLOCKS.filter((b) => b.interactive).map((b) => b.type));
    expect([...interactiveTypes].sort()).toEqual(["contato", "curriculo", "depoimentos", "video"]);
    for (const kind of ["pessoal", "empresa"] as const) {
      const site = await load(kind);
      for (const route of site.routes) {
        if (route.type !== "page") continue;
        for (const b of route.page.blocks) {
          if (b.interactive) expect(interactiveTypes.has(b.type), b.type).toBe(true);
          const html = render(b.type, { ctx: site.context(route.locale, route.url), ...b, island: b.interactive ? ISLAND : undefined } as never);
          expect(html.includes(MARK), `${kind} ${route.url} ${b.type}`).toBe(b.interactive);
        }
      }
    }
    // bloco estático nunca renderiza a ilha, mesmo que ela seja passada
    const ctx = (await load("pessoal")).context("pt-BR", "/");
    for (const type of ["hero", "texto", "numeros", "cases", "faq", "precos", "equipe"]) {
      expect(render(type, { ctx, island: ISLAND }), type).not.toContain(MARK);
    }
  });

  it("empresa: ilha de depoimento só com o plugin de envio ligado; contato só com o assistente", async () => {
    const site = await load("empresa");
    const flags = site.routes.flatMap((r) => (r.type === "page" ? r.page.blocks.filter((b) => b.interactive).map((b) => b.type) : []));
    expect(new Set(flags)).toEqual(new Set(["contato", "video"]));
  });

  it("FAQ sem JavaScript (details) e filtro de etiquetas sem ilha", async () => {
    const site = await load("pessoal");
    const ctx = site.context("pt-BR", "/blog");
    const faq = site.routes.flatMap((r) => (r.type === "page" ? r.page.blocks : [])).find((b) => b.type === "faq")!;
    const html = render("faq", { ctx, ...faq } as never);
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    const blog = site.routes.find((r) => r.url === "/blog" && r.type === "page");
    if (blog?.type !== "page") throw new Error();
    const posts = render("posts-recentes", { ctx, ...blog.page.blocks[0]! } as never);
    expect(posts).toContain('type="radio"');
    expect(posts).toContain("rb-filter");
    expect(posts).toContain('data-tags="t');
  });

  it("imagens trazem alt do conteúdo e dimensões", async () => {
    const site = await load("empresa");
    const home = site.routes.find((r) => r.url === "/" && r.type === "page");
    if (home?.type !== "page") throw new Error();
    const logos = home.page.blocks.find((b) => b.type === "logos-clientes")!;
    const html = render("logos-clientes", { ctx: site.context("pt-BR", "/"), ...logos } as never);
    expect(html).toContain('alt="Cliente 1"');
    expect(html).toMatch(/width="160"/);
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe("receitas padrão", () => {
  it("cobrem as páginas pedidas, nos três idiomas", () => {
    expect(CORE_RECIPES.pessoal.map((p) => p.path)).toEqual(["/", "/sobre", "/curriculo", "/portfolio", "/blog", "/depoimentos", "/privacidade"]);
    expect(CORE_RECIPES.empresa.map((p) => p.path)).toEqual(["/", "/quem-somos", "/servicos", "/precos", "/cases", "/blog", "/contato", "/privacidade"]);
    for (const page of [...CORE_RECIPES.pessoal, ...CORE_RECIPES.empresa]) {
      expect(Object.keys(page.title).sort()).toEqual(["en", "es", "pt-BR"]);
    }
  });

  it("todo bloco da receita é válido no catálogo", () => {
    const defs = new Map(CORE_BLOCKS.map((b) => [b.type, b]));
    for (const kind of ["pessoal", "empresa"] as const) {
      for (const page of CORE_RECIPES[kind]) {
        for (const b of page.blocks) {
          const def = defs.get(b.type);
          expect(def, `${kind} ${page.path} ${b.type}`).toBeDefined();
          expect(def!.category === "comum" || def!.category === kind, `${b.type} em ${kind}`).toBe(true);
          expect(validateBlock(def!, { fields: b.fields ?? {}, ...(b.source ? { source: b.source } : {}) }), `${kind} ${page.path} ${b.type}`).toEqual([]);
        }
      }
    }
  });

  it("tema sem receita usa a do núcleo; com receita, a dele", () => {
    expect(recipeFor(theme, "empresa")).toBe(CORE_RECIPES.empresa);
    const own = [{ path: "/", title: { "pt-BR": "x" }, blocks: [] }];
    expect(recipeFor({ recipes: { pessoal: own } }, "pessoal")).toBe(own);
  });

  it("as fixtures usam os mesmos blocos da receita", async () => {
    const site = await load("empresa");
    for (const page of CORE_RECIPES.empresa) {
      const route = site.routes.find((r) => r.url === page.path && r.type === "page");
      if (route?.type !== "page") continue; // /blog não existe em es, mas existe em pt-BR
      // Blocos opcionais que a demo mostra além da receita.
      const extras = new Set(["logos-clientes", "video", "incorporacao", "linha-do-tempo", "comparativo-planos"]);
      const types = route.page.blocks.map((b) => b.type).filter((t) => !extras.has(t));
      expect(types, page.path).toEqual(page.blocks.map((b) => b.type));
    }
  });
});

describe("fixtures", () => {
  it("empresa: 3 idiomas, com conteúdo sem tradução em es", async () => {
    const site = await load("empresa");
    expect(site.settings.kind).toBe("empresa");
    expect(site.settings.locales.locales).toEqual(["pt-BR", "en", "es"]);
    const urls = site.routes.map((r) => r.url);
    expect(urls).toContain("/blog");
    expect(urls).toContain("/en/blog");
    expect(urls).not.toContain("/es/blog");
    expect(urls).toContain("/blog/acessibilidade-basica");
    expect(urls).not.toContain("/es/blog/acessibilidade-basica");
  });

  it("pessoal exercita todos os blocos pessoais e comuns, menos os de empresa", async () => {
    const site = await load("pessoal");
    const used = new Set(site.routes.flatMap((r) => (r.type === "page" ? r.page.blocks.map((b) => b.type) : [])));
    const expected = CORE_BLOCKS.filter((b) => b.category !== "empresa").map((b) => b.type);
    for (const t of expected) expect(used.has(t), t).toBe(true);
  });

  it("empresa exercita todos os blocos comuns e de empresa", async () => {
    const site = await load("empresa");
    const used = new Set(site.routes.flatMap((r) => (r.type === "page" ? r.page.blocks.map((b) => b.type) : [])));
    const expected = CORE_BLOCKS.filter((b) => b.category !== "pessoal" && b.type !== "galeria").map((b) => b.type);
    for (const t of expected) expect(used.has(t), t).toBe(true);
  });
});

describe("ilhas", () => {
  it("cada bloco interativo tem ilha registrada", () => {
    for (const type of ["contato", "curriculo", "depoimentos", "video"]) {
      const name = islandNameFor(type);
      expect(CORE_ISLANDS[name], name).toBeDefined();
      expect(ISLAND_META[name], name).toBeDefined();
    }
  });

  it("o PDF do currículo escapa HTML e agrupa por seção", () => {
    const html = buildResumeHtml({
      name: "Ana <b>",
      contact: ["ana@exemplo.dev"],
      locale: "pt-BR",
      labels: { experience: "Experiência", education: "Formação", skill: "Competências", certification: "Certificações", language: "Idiomas", present: "atual" },
      items: [
        { id: "1", kind: "experience", title: "Designer", organization: "Acme & Cia", start: "2021-03", description: "- A\n- B" },
        { id: "2", kind: "skill", title: "Figma" },
      ],
    });
    expect(html).toContain("Ana &lt;b&gt;");
    expect(html).toContain("Acme &amp; Cia");
    expect(html).toContain("2021-03 – atual");
    expect(html).toContain("<li>A</li>");
    expect(html).toContain("Competências");
    expect(html).not.toContain("Formação");
  });
});

describe("estilos", () => {
  const css = readFileSync(fileURLToPath(new URL("../src/styles/base.css", import.meta.url)), "utf-8");
  const blocks = readFileSync(fileURLToPath(new URL("../src/styles/blocks.css", import.meta.url)), "utf-8");

  it("blocks.css usa só tokens: nenhuma cor fixa", () => {
    expect(blocks).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(blocks).not.toMatch(/\brgba?\(/);
  });

  it("todo token --rb usado nos blocos está definido no base.css", () => {
    const used = new Set([...blocks.matchAll(/var\((--rb-[a-z-]+)/g)].map((m) => m[1]!));
    for (const token of used) expect(css, token).toContain(`${token}:`);
  });

  // Contraste AA (4.5:1) dos pares de texto dos tokens padrão, nos dois modos.
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };
  const tokens = (block: string) => Object.fromEntries([...block.matchAll(/(--rb-[a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]));
  const dark = tokens(css.slice(css.indexOf(":root {"), css.indexOf("\n[data-color-mode=\"light\"] {")));
  const light = tokens(css.slice(css.indexOf("\n[data-color-mode=\"light\"] {"), css.indexOf("@media (prefers-color-scheme")));

  for (const [mode, t] of [["escuro", dark], ["claro", light]] as const) {
    it(`contraste AA no modo ${mode}`, () => {
      for (const bg of ["--rb-bg", "--rb-surface"]) {
        for (const fg of ["--rb-fg", "--rb-muted", "--rb-accent", "--rb-danger", "--rb-success"]) {
          expect(ratio(t[fg]!, t[bg]!), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(ratio(t["--rb-accent-fg"]!, t["--rb-accent"]!), "texto do botão").toBeGreaterThanOrEqual(4.5);
    });
  }
});
