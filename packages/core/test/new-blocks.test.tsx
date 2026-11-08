/** Blocos novos do catálogo. */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite, type BuiltSite } from "../src/render/site";
import { CORE_BLOCKS, incorporacao, video } from "../src/blocks/catalog";
import { validateBlock } from "../src/blocks/define";
import { preparePageBlocks } from "../src/convex/lib/blocks";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme, type BlockProps } from "../src/theme/contract";
import { DEFAULT_BLOCKS, DefaultShell, VideoFrame } from "../src/components";
import { parseVideoUrl } from "../src/blocks/media";
import VideoIsland from "../src/islands/video";
import { CORE_ISLANDS, ISLAND_META } from "../src/islands";
import { uiKeysWithPrefix } from "../src/i18n/ui-texts";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const demo = (kind: string) => fileURLToPath(new URL(`../../../apps/demo/fixtures/${kind}`, import.meta.url));
const load = async (kind: "pessoal" | "empresa", off: string[] = []): Promise<BuiltSite> => {
  const snapshot = await fixtureSource(demo(kind)).load();
  const plugins = { ...snapshot.site.plugins, ...Object.fromEntries(off.map((p) => [p, false])) };
  return buildSite({ snapshot: { ...snapshot, site: { ...snapshot.site, plugins } }, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
};

function render(type: string, props: Partial<BlockProps> & Pick<BlockProps, "ctx">): string {
  return renderToStaticMarkup(createElement(DEFAULT_BLOCKS[type]!, { id: "x", variant: "default", fields: {}, items: [], headingLevel: 2, index: 1, total: 3, ...props } as BlockProps));
}

/** Bloco da fixture, já resolvido como o site resolve. */
async function fixtureBlock(kind: "pessoal" | "empresa", url: string, type: string) {
  const site = await load(kind);
  const route = site.routes.find((r) => r.type === "page" && r.url === url);
  if (route?.type !== "page") throw new Error(`sem página ${url}`);
  const block = route.page.blocks.find((b) => b.type === type)!;
  return { site, block, ctx: site.context(route.locale, route.url, route.alternates) };
}

const yt = "https://www.youtube.com/watch?v=M7lc1UVf-VE";

describe("vídeo", () => {
  it("sem JavaScript, a miniatura do YouTube é um link para o vídeo no provedor; nada de iframe", async () => {
    const { block, ctx } = await fixtureBlock("pessoal", "/sobre", "video");
    const html = render("video", { ctx, ...block });
    expect(html).toContain('href="https://www.youtube.com/watch?v=M7lc1UVf-VE"');
    expect(html).toContain('src="https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("Assistir no YouTube");
    expect(html).toContain("(abre em nova aba)");
    expect(html).toContain("<figcaption");
    expect(html).not.toContain("<iframe");
    expect(html).toMatch(/<h2[^>]*>Como eu trabalho/);
  });

  it("com a ilha, o bloco a usa no lugar do link; Vimeo usa a miniatura do campo", async () => {
    const { block, ctx } = await fixtureBlock("empresa", "/quem-somos", "video");
    expect(block.interactive).toBe(true);
    const island = createElement("i", { "data-island": "1" });
    expect(render("video", { ctx, ...block, island })).toContain('data-island="1"');
    const html = render("video", { ctx, ...block });
    expect(html).toContain('href="https://vimeo.com/76979871"');
    expect(html).toContain('src="/img/routine-3.svg"');
  });

  it("Vimeo sem miniatura: só o botão de play, sem imagem", async () => {
    const ctx = (await load("pessoal")).context("pt-BR", "/");
    const html = render("video", { ctx, fields: { url: "https://vimeo.com/76979871" } });
    expect(html).not.toContain("<img");
    expect(html).toContain("rb-video__play");
  });

  it("endereço inválido: o bloco não aparece e a validação recusa (backend e MCP usam validateBlock)", async () => {
    const ctx = (await load("pessoal")).context("pt-BR", "/");
    expect(render("video", { ctx, fields: { title: "x", url: "https://example.com/v.mp4" } })).toBe("");
    expect(validateBlock(video, { fields: { url: "https://example.com/v.mp4" } })).toEqual([{ path: "url", message: expect.stringContaining("YouTube ou do Vimeo") }]);
    expect(validateBlock(video, { fields: { url: yt } })).toEqual([]);
    expect(() => preparePageBlocks([{ id: "v", type: "video", visible: true, fields: { url: "javascript:alert(1)" } }], { blocks: CORE_BLOCKS, kind: "pessoal", enabledPlugins: new Set() })).toThrow(/Endereço do vídeo/);
  });

  it("a ilha só monta com endereço válido e recebe os textos de vídeo", () => {
    expect(video.islandWhen!({ url: yt }, new Set())).toBe(true);
    expect(video.islandWhen!({ url: "x" }, new Set())).toBe(false);
    expect(CORE_ISLANDS.video).toBeDefined();
    const keys = uiKeysWithPrefix(ISLAND_META.video!.textPrefixes);
    expect(keys).toEqual(expect.arrayContaining(["video.play", "video.watchOn", "video.player", "common.external"]));
  });

  it("antes de hidratar, a ilha mostra o mesmo link que o bloco estático", () => {
    const html = renderToStaticMarkup(createElement(VideoIsland, { fields: { url: yt, title: "Palestra" }, texts: { "video.watchOn": "Assistir no {provider}" } }));
    expect(html).toContain('href="https://www.youtube.com/watch?v=M7lc1UVf-VE"');
    expect(html).not.toContain("<iframe");
  });

  it("player: youtube-nocookie, já tocando, com título, sandbox, allow e referrer", () => {
    const t = (k: string, v?: Record<string, string | number>) => (k === "video.player" ? `Vídeo: ${v?.title}` : k);
    const html = renderToStaticMarkup(createElement(VideoFrame, { video: parseVideoUrl(yt)!, name: "Palestra", ratio: "16-9", mode: "player", t }));
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&amp;rel=0"');
    expect(html).toContain('title="Vídeo: Palestra"');
    expect(html).toContain('sandbox="allow-scripts allow-same-origin');
    expect(html).toMatch(/referrerpolicy="strict-origin-when-cross-origin"/i);
    expect(html).toMatch(/allowfullscreen=""/i);
    const button = renderToStaticMarkup(createElement(VideoFrame, { video: parseVideoUrl(yt)!, name: "Palestra", ratio: "16-9", mode: "button", t }));
    expect(button).toContain('<button type="button"');
    expect(button).toContain("video.play");
  });
});

describe("incorporação", () => {
  it("iframe só do provedor permitido, preguiçoso, com título acessível, sandbox e referrer", async () => {
    const { block, ctx } = await fixtureBlock("empresa", "/contato", "incorporacao");
    const html = render("incorporacao", { ctx, ...block });
    expect(html).toContain('src="https://calendly.com/meridiano-demo/conversa-inicial"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('title="Agenda do Estúdio Meridiano para marcar uma conversa"');
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-forms');
    expect(html).toMatch(/referrerpolicy="strict-origin-when-cross-origin"/i);
    expect(html).toContain('height="700"');
    expect(html).toContain("Abrir no Calendly");
  });

  it("endereço fora da lista: some no site e é recusado na gravação", async () => {
    const ctx = (await load("empresa")).context("pt-BR", "/");
    const fields = { title: { "pt-BR": "x" }, url: "https://example.com/form", frameTitle: { "pt-BR": "Formulário" } };
    expect(render("incorporacao", { ctx, fields: { title: "x", url: fields.url, frameTitle: "Formulário" } })).toBe("");
    expect(validateBlock(incorporacao, { fields })[0]!.message).toContain("Calendly");
    expect(validateBlock(incorporacao, { fields: { ...fields, frameTitle: undefined } })[0]!.path).toBe("frameTitle");
  });

  it("altura padrão do provedor e link opcional", async () => {
    const ctx = (await load("empresa")).context("pt-BR", "/");
    const html = render("incorporacao", { ctx, fields: { url: "https://tally.so/embed/wA1bCd", frameTitle: "Formulário", showLink: false } });
    expect(html).toContain('height="600"');
    expect(html).not.toContain("rb-embed__link");
  });
});
