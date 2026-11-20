/** O motor de blocos no corpo do case: contexto `case`, rota do case e formato antigo. */
import { describe, expect, it } from "vitest";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell } from "../src/components";
import { fileURLToPath } from "node:url";
import { emptyCollections, fixtureSource, type SiteSnapshot } from "../src/data/source";
import { resolveBlocks, type BlockEnv } from "../src/render/blocks";
import { resolvePaths } from "../src/render/collections";
import { buildSite, type SiteRoute } from "../src/render/site";
import { sectionsToBlocks } from "../src/content/legacy";
import type { BlockInstance, RawProject, SiteSettings } from "../src/content/types";

const theme = defineTheme({
  id: "teste",
  label: "Teste",
  contract: "^1",
  tokens: {},
  Shell: DefaultShell,
  variants: { texto: [{ value: "simples", label: "Simples" }, { value: "destaque", label: "Destaque" }] },
});

const locales = { locales: ["pt-BR", "en"], default: "pt-BR" };

const env = (locale = "pt-BR"): BlockEnv => ({
  kind: "pessoal",
  theme,
  definitions: new Map(CORE_BLOCKS.map((b) => [b.type, b])),
  plugins: new Set(["portfolio", "blog"]),
  pluginDefs: CORE_PLUGINS,
  collections: emptyCollections(),
  paths: resolvePaths("pessoal"),
  options: { locale, locales },
});

const block = (id: string, type: string, fields: Record<string, unknown>, extra: Partial<BlockInstance> = {}): BlockInstance => ({ id, type, visible: true, fields, ...extra });

describe("resolveBlocks no contexto case", () => {
  const body = [
    block("abre", "hero", { title: { "pt-BR": "Olá" } }),
    block("t1", "texto", { title: { "pt-BR": "Contexto" }, body: { "pt-BR": "<p>Era assim.</p>" } }, { variant: "destaque" }),
    block("c", "contato", { title: { "pt-BR": "Fale" } }),
    block("t2", "texto", { body: { "pt-BR": "<p>Ficou assim.</p>" } }, { variant: "nao-existe" }),
  ];

  it("recusa os blocos só de página (hero, contato) e começa no h2", () => {
    const { blocks, firstIsHero } = resolveBlocks(body, env(), { context: "case" });
    expect(blocks.map((b) => b.id)).toEqual(["t1", "t2"]);
    expect(blocks.every((b) => b.headingLevel === 2)).toBe(true);
    expect(firstIsHero).toBe(false);
    expect(blocks.map((b) => [b.index, b.total])).toEqual([[0, 2], [1, 2]]);
  });

  it("variação do tema: a escolhida, ou a primeira quando a escolhida não existe", () => {
    const { blocks } = resolveBlocks(body, env(), { context: "case" });
    expect(blocks.map((b) => b.variant)).toEqual(["destaque", "simples"]);
  });

  it("na página o mesmo corpo mantém o hero com o h1", () => {
    const { blocks, firstIsHero } = resolveBlocks(body, env(), { context: "page" });
    expect(firstIsHero).toBe(true);
    expect(blocks[0]).toMatchObject({ id: "abre", headingLevel: 1 });
    expect(blocks.map((b) => b.type)).toContain("contato");
  });

  it("no case, bloco sem tradução no idioma some (como as seções antigas)", () => {
    const { blocks } = resolveBlocks(body, env("en"), { context: "case" });
    expect(blocks).toEqual([]);
  });

  it("bloco invisível e de plugin desligado não entram", () => {
    const list = [
      block("x", "texto", { body: { "pt-BR": "<p>a</p>" } }, { visible: false }),
      block("p", "posts-recentes", { title: { "pt-BR": "Posts" } }),
      block("v", "video", { url: "https://youtu.be/dQw4w9WgXcQ" }),
    ];
    expect(resolveBlocks(list, { ...env(), plugins: new Set(["portfolio"]) }, { context: "case" }).blocks.map((b) => b.id)).toEqual(["v"]);
  });
});

const fixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/pessoal", import.meta.url));
const settings: SiteSettings = { ...(await fixtureSource(fixtures).load()).site, locales };

const legacy: RawProject = {
  id: "antigo",
  slug: "antigo",
  title: { "pt-BR": "Antigo", en: "Old" },
  content: { "pt-BR": "<p>Resumo longo.</p>" },
  sections: [
    { title: { "pt-BR": "Problema", en: "Problem" }, body: { "pt-BR": "<p>O problema.</p>", en: "<p>The problem.</p>" } },
    { title: { "pt-BR": "Solução" }, body: { "pt-BR": "<p>A solução.</p>" }, image: { url: "/s.png", alt: { "pt-BR": "Tela" } } },
  ],
};

function snapshot(projects: RawProject[]): SiteSnapshot {
  return { site: settings, pages: [], collections: { ...emptyCollections(), projects }, texts: {} };
}

function caseRoute(projects: RawProject[], url: string): Extract<SiteRoute, { type: "case" }> {
  const site = buildSite({ snapshot: snapshot(projects), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
  const r = site.routes.find((x) => x.url === url);
  if (r?.type !== "case") throw new Error(url);
  return r;
}

describe("rota do case", () => {
  it("projeto no formato antigo vira blocos texto, com o content primeiro", () => {
    const r = caseRoute([legacy], "/portfolio/antigo");
    expect(r.blocks.map((b) => [b.id, b.type, b.headingLevel])).toEqual([
      ["conteudo", "texto", 2],
      ["secao-1", "texto", 2],
      ["secao-2", "texto", 2],
    ]);
    expect(r.blocks[2]!.fields).toMatchObject({ title: "Solução", body: "<p>A solução.</p>", image: { src: "/s.png", alt: "Tela" } });
    expect(r.project.hasCase).toBe(true);
    // As seções continuam em `project.sections` para temas que ainda as leem.
    expect(r.project.sections).toHaveLength(2);
  });

  it("um projeto antigo renderiza igual ao mesmo projeto migrado", () => {
    const migrated: RawProject = { ...legacy, blocks: sectionsToBlocks(legacy) };
    for (const [locale, url] of [["pt-BR", "/portfolio/antigo"], ["en", "/en/portfolio/antigo"]] as const) {
      const a = caseRoute([legacy], url);
      const b = caseRoute([migrated], url);
      expect(a.blocks, locale).toEqual(b.blocks);
    }
    // Em inglês só a seção traduzida entra.
    expect(caseRoute([legacy], "/en/portfolio/antigo").blocks.map((b) => b.id)).toEqual(["secao-1"]);
  });

  it("blocos próprios do case vencem content e seções; hero do corpo é recusado", () => {
    const own: RawProject = {
      ...legacy,
      blocks: [block("h", "hero", { title: { "pt-BR": "x" } }), block("p", "paleta", { colors: [{ name: { "pt-BR": "Vinho" }, hex: "#7A1F2B" }] })],
    };
    const r = caseRoute([own], "/portfolio/antigo");
    expect(r.blocks.map((b) => b.type)).toEqual(["paleta"]);
    expect(r.blocks[0]!.headingLevel).toBe(2);
  });

  it("marca válida e ligada vai na rota; desligada ou inválida, não", () => {
    const light = { background: "#FFFFFF", foreground: "#111111", accent: "#7a1f2b" };
    expect(caseRoute([{ ...legacy, brand: { light } }], "/portfolio/antigo").brand?.light.background).toBe("#ffffff");
    expect(caseRoute([{ ...legacy, brand: { light, enabled: false } }], "/portfolio/antigo").brand).toBeUndefined();
    expect(caseRoute([{ ...legacy, brand: { light: { ...light, foreground: "#eeeeee" } } }], "/portfolio/antigo").brand).toBeUndefined();
  });

  it("próximo case usa hasCase: projeto só com blocos conta, projeto sem corpo não", () => {
    const a: RawProject = { id: "a", slug: "a", title: { "pt-BR": "A" }, order: 1, blocks: [block("t", "texto", { body: { "pt-BR": "<p>a</p>" } })] } as RawProject;
    const b: RawProject = { id: "b", slug: "b", title: { "pt-BR": "B" }, order: 2 } as RawProject;
    const c: RawProject = { ...legacy, order: 3 } as RawProject;
    const r = caseRoute([a, b, c], "/portfolio/a");
    expect(r.next?.id).toBe("antigo");
    expect(caseRoute([a, b, c], "/portfolio/antigo").next?.id).toBe("a");
  });
});
