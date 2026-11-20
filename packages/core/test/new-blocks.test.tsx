/** Blocos novos do catálogo. */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite, onlyInDialog, type BuiltSite } from "../src/render/site";
import { CORE_BLOCKS, comparativoPlanos, incorporacao, linhaDoTempo, video } from "../src/blocks/catalog";
import { antesDepois, imagens, paleta, tipografia, variacoesMarca } from "../src/blocks/catalog/marca";
import { validateBlock } from "../src/blocks/define";
import { preparePageBlocks } from "../src/convex/lib/blocks";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme, resolveVariant, type BlockProps } from "../src/theme/contract";
import { DEFAULT_BLOCKS, DefaultShell, VideoFrame } from "../src/components";
import { parseVideoUrl } from "../src/blocks/media";
import VideoIsland from "../src/islands/video";
import ComparadorIsland from "../src/islands/comparador";
import ImagensIsland from "../src/islands/imagens";
import { contrastGrade, fontStack, fontVar, hexToRgb, parseWeights } from "../src/components/blocks/marca";
import { videoChapters } from "../src/components/blocks/media";
import { islandNameFor } from "../src/islands";
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

describe("contato só na janela", () => {
  it("só na janela: com a janela do tema, nada na página; sem ela, o bloco fica; o catálogo aceita os assuntos", async () => {
    const { block, ctx } = await fixtureBlock("pessoal", "/", "contato");
    const fields = { ...block.fields, presentation: "dialog" };
    const island = createElement("i", { id: "ilha" });
    const withDialog = { ...ctx, site: { ...ctx.site, contactDialog: "rb-contato-janela" } };
    expect(render("contato", { ctx: withDialog, ...block, fields, island })).toBe("");
    expect(onlyInDialog({ type: "contato", fields }, withDialog)).toBe(true);
    expect(onlyInDialog({ type: "contato", fields: { ...fields, mode: "channels" } }, withDialog)).toBe(false);
    // Tema sem janela: o bloco segue na página, com título e formulário.
    const html = render("contato", { ctx: { ...ctx, site: { ...ctx.site, contactDialog: undefined } }, ...block, fields, island });
    expect(html).toContain("<h2");
    expect(html).toContain('<i id="ilha">');
    expect(onlyInDialog({ type: "contato", fields }, { site: {} })).toBe(false);
    const def = CORE_BLOCKS.find((b) => b.type === "contato")!;
    const raw = {
      presentation: "dialog",
      eyebrow: { "pt-BR": "portfolio / contato" },
      flows: [{ id: "project", emoji: "💼", label: { "pt-BR": "Tenho um projeto" }, steps: [{ kind: "choice", key: "projectType", title: { "pt-BR": "Tipo?" }, options: { "pt-BR": "A\nB" } }, { kind: "contact", askPhone: true }] }],
    };
    expect(validateBlock(def, { fields: raw })).toEqual([]);
  });
});

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

describe("linha do tempo", () => {
  it("lista ordenada, um h3 por marco, data antes do título", async () => {
    const { block, ctx } = await fixtureBlock("pessoal", "/sobre", "linha-do-tempo");
    const html = render("linha-do-tempo", { ctx, ...block });
    expect(html).toContain('<ol class="rb-timeline">');
    expect((html.match(/<li /g) ?? []).length).toBe(4);
    expect((html.match(/<h3/g) ?? []).length).toBe(4);
    expect(html.indexOf("2017")).toBeLessThan(html.indexOf("Primeiro projeto"));
    expect(html).toContain('alt="Quadro de pesquisa com post-its"');
  });

  it("variação horizontal herdada do núcleo em tema que não declara", async () => {
    const { block, ctx } = await fixtureBlock("empresa", "/quem-somos", "linha-do-tempo");
    expect(block.variant).toBe("horizontal");
    expect(render("linha-do-tempo", { ctx, ...block })).toContain("rb-timeline--horizontal");
    expect(resolveVariant(theme, "linha-do-tempo", undefined)).toBe("vertical");
    expect(resolveVariant(theme, "linha-do-tempo", "inexistente")).toBe("vertical");
  });

  it("marco sem título no idioma não aparece", async () => {
    const ctx = (await load("pessoal")).context("pt-BR", "/");
    const html = render("linha-do-tempo", { ctx, fields: { items: [{ date: "2020", title: "A" }, { date: "2021" }] } as never });
    expect((html.match(/<li /g) ?? []).length).toBe(1);
    expect(linhaDoTempo.fields.items.required).toBe(true);
  });
});

describe("comparativo de planos", () => {
  it("tabela com legenda, cabeçalhos de coluna e de linha, valores legíveis e botão com o nome do plano", async () => {
    const { block, ctx } = await fixtureBlock("empresa", "/precos", "comparativo-planos");
    expect(block.items).toHaveLength(3);
    const html = render("comparativo-planos", { ctx, ...block });
    expect(html).toContain('<caption id="precos-comparativo-caption" class="rb-compare__caption">O que cada plano inclui</caption>');
    expect(html).toContain('role="region" aria-labelledby="precos-comparativo-caption" tabindex="0"');
    expect((html.match(/scope="col"/g) ?? []).length).toBe(4);
    expect((html.match(/scope="row"/g) ?? []).length).toBe(7);
    expect(html).toContain("Essencial");
    expect(html).toContain("Mais escolhido");
    expect(html).toContain('<span class="rb-sr-only">Incluso</span>');
    expect(html).toContain('<span class="rb-sr-only">Não incluso</span>');
    expect(html).toContain("até 15");
    expect(html).toContain('<span class="rb-sr-only">: Profissional</span>');
    expect(html).toContain("rb-compare__col--highlighted");
    expect(html).toContain("--rb-compare-cols:3");
    expect(html).toContain("Deslize a tabela");
  });

  it("valor faltando vira traço com texto para leitor de tela; sem legenda, o título vai só para leitor de tela", async () => {
    const { block, ctx } = await fixtureBlock("empresa", "/precos", "comparativo-planos");
    const rows = [{ label: "Extra", cells: [{ value: "sim" }] }];
    const html = render("comparativo-planos", { ctx, ...block, fields: { title: "Compare", rows } as never });
    expect((html.match(/Não informado/g) ?? []).length).toBe(2);
    expect(html).toContain('class="rb-sr-only">Compare</caption>');
  });

  it("lê os planos da coleção e some com o plugin de preços desligado", async () => {
    expect(comparativoPlanos.plugin).toBe("pricing");
    expect(comparativoPlanos.source?.collections).toEqual(["plans"]);
    const site = await load("empresa", ["pricing"]);
    const blocks = site.routes.flatMap((r) => (r.type === "page" ? r.page.blocks.map((b) => b.type) : []));
    expect(blocks).not.toContain("comparativo-planos");
  });

  it("texto obrigatório quando a célula é do tipo texto", () => {
    const rows = [{ label: { "pt-BR": "Páginas" }, cells: [{ value: "texto" }, { value: "sim" }] }];
    expect(validateBlock(comparativoPlanos, { fields: { rows } })).toEqual([{ path: "rows.0.cells.0.text", message: expect.stringContaining("obrigatório") }]);
    rows[0]!.cells[0] = { value: "texto", text: { "pt-BR": "até 5" } } as never;
    expect(validateBlock(comparativoPlanos, { fields: { rows } })).toEqual([]);
  });

  it("sem planos ou sem recursos, nada", async () => {
    const ctx = (await load("empresa")).context("pt-BR", "/");
    expect(render("comparativo-planos", { ctx, fields: { rows: [{ label: "x" }] } as never })).toBe("");
  });
});

// ── Blocos de marca (contrato 1.4) ──────────────────────────────────────────

const ctxPt = async () => (await load("pessoal")).context("pt-BR", "/");
const image = (src: string, alt = "") => ({ src, alt, width: 800, height: 600 });

describe("antes e depois", () => {
  const fields = { before: image("/a.svg", "Logo antigo"), after: image("/b.svg", "Marca nova") };

  it("sem JavaScript: duas figuras com os rótulos padrão, na ordem antes → depois, e a legenda", async () => {
    const ctx = await ctxPt();
    const html = render("antes-depois", { ctx, fields: { ...fields, caption: "De 2009 a 2026", presentation: "lado-a-lado" } });
    expect(html).toContain("rb-before-after__figure--before");
    expect(html.indexOf("Antes")).toBeLessThan(html.indexOf("Depois"));
    expect(html.indexOf('alt="Logo antigo"')).toBeLessThan(html.indexOf('alt="Marca nova"'));
    expect(html).toContain('<figcaption class="rb-before-after__caption">De 2009 a 2026</figcaption>');
    expect(render("antes-depois", { ctx, fields: { ...fields, beforeLabel: "2009", afterLabel: "2026" } })).toContain(">2026</figcaption>");
  });

  it("sem uma das imagens, nada; a validação exige as duas", async () => {
    expect(render("antes-depois", { ctx: await ctxPt(), fields: { before: fields.before } })).toBe("");
    expect(validateBlock(antesDepois, { fields: {} }).map((e) => e.path).sort()).toEqual(["after", "before"]);
  });

  it("o comparador é ilha só nessa apresentação; antes de hidratar, a ilha mostra o mesmo par", async () => {
    expect(antesDepois.islandWhen!({ presentation: "comparador" }, new Set())).toBe(true);
    expect(antesDepois.islandWhen!({ presentation: "lado-a-lado" }, new Set())).toBe(false);
    expect(islandNameFor("antes-depois")).toBe("comparador");
    expect(CORE_ISLANDS.comparador).toBeDefined();
    expect(uiKeysWithPrefix(ISLAND_META.comparador!.textPrefixes)).toEqual(expect.arrayContaining(["beforeAfter.before", "beforeAfter.after", "beforeAfter.slider"]));
    const island = createElement("i", { "data-island": "1" });
    expect(render("antes-depois", { ctx: await ctxPt(), fields, island })).toContain('data-island="1"');
    const html = renderToStaticMarkup(createElement(ComparadorIsland, { fields, texts: { "beforeAfter.before": "Antes", "beforeAfter.after": "Depois" } }));
    expect(html).toContain("rb-before-after__pair");
    expect(html).not.toContain('type="range"');
  });
});

describe("paleta", () => {
  it("amostras com nome, HEX, RGB, papel e uso; texto sobre a amostra com o maior contraste", async () => {
    const ctx = await ctxPt();
    const colors = [
      { name: "Crosta", hex: "#A4471A", role: "Principal", usage: "Títulos" },
      { name: "Farinha", hex: "#f7efe1" },
    ];
    const html = render("paleta", { ctx, fields: { title: "Cores", colors, showContrast: true } });
    expect((html.match(/<h3/g) ?? []).length).toBe(2);
    expect(html).toContain("--swatch:#a4471a;color:#ffffff");
    expect(html).toContain("--swatch:#f7efe1;color:#000000");
    expect(html).toContain("#A4471A");
    expect(html).toContain("164 71 26");
    expect(html).toContain("Principal");
    expect(html).toContain("Títulos");
    expect(html).toContain("Contraste com branco");
    expect(html).toContain("6,0:1");
    expect(html).toContain('data-grade="aaa"');
    expect(html).toContain('data-grade="fail"');
  });

  it("sem showContrast, sem a lista de contraste; cor inválida some; lista vazia, nada", async () => {
    const ctx = await ctxPt();
    const html = render("paleta", { ctx, fields: { colors: [{ name: "A", hex: "#000000" }, { name: "B", hex: "red" }], showContrast: false } });
    expect(html).not.toContain("rb-palette__contrast");
    expect((html.match(/rb-palette__swatch/g) ?? []).length).toBe(1);
    expect(render("paleta", { ctx, fields: { colors: [] } })).toBe("");
    expect(validateBlock(paleta, { fields: {} })[0]!.path).toBe("colors");
  });

  it("níveis WCAG e RGB", () => {
    expect([7, 4.5, 3, 2.9].map(contrastGrade)).toEqual(["aaa", "aa", "large", "fail"]);
    expect(hexToRgb("#ffffff")).toBe("255 255 255");
  });
});

describe("tipografia", () => {
  it("cada família na própria fonte, com papel, pesos e a amostra (ou o alfabeto)", async () => {
    const ctx = await ctxPt();
    const fonts = [{ family: "Space Grotesk", role: "Títulos", weights: "700, 400, 950", sample: "Peça sob medida" }, { family: "Fraunces" }];
    const html = render("tipografia", { ctx, fields: { fonts } });
    expect(html).toContain('--type-font:var(--rbf-f-space-grotesk, &quot;Space Grotesk&quot;, var(--rb-font-sans))');
    expect(html).toContain("Peça sob medida");
    expect(html).toContain("Aa Bb Cc");
    expect(html).toContain("font-weight:400");
    expect(html).toContain("font-weight:700");
    expect(html).not.toContain("950");
    expect(html.indexOf(">400<")).toBeLessThan(html.indexOf(">700<"));
  });

  it("com a amostra em imagem, mostra a imagem no lugar do texto", async () => {
    const html = render("tipografia", { ctx: await ctxPt(), fields: { fonts: [{ family: "Fonte Própria", specimen: image("/f.png", "Amostra") }] } });
    expect(html).toContain('alt="Amostra"');
    expect(html).not.toContain("rb-type__sample");
    expect(validateBlock(tipografia, { fields: {} })[0]!.path).toBe("fonts");
  });

  it("regras da variável e dos pesos", () => {
    expect(fontVar("Big Shoulders Display")).toBe("--rbf-f-big-shoulders-display");
    expect(fontVar("Fonte Ação")).toBe("--rbf-f-fonte-acao");
    expect(fontStack('Bad"Name')).toBe('var(--rbf-f-bad-name, "BadName", var(--rb-font-sans))');
    expect(parseWeights(undefined)).toEqual([400, 700]);
    expect(parseWeights("800, 300, 300, 450")).toEqual([300, 800]);
  });
});

describe("variações de marca", () => {
  it("grade com colunas, a cor do item como fundo da prancha e o rótulo fora dela", async () => {
    const ctx = await ctxPt();
    const items = [
      { image: image("/l.svg", "Logo"), label: "Principal", background: "#A4471A", note: "Uso preferencial" },
      { image: image("/m.svg", "Logo mono") },
    ];
    const html = render("variacoes-marca", { ctx, fields: { items, columns: "4" } });
    expect(html).toContain('data-columns="4"');
    expect(html).toContain("--tile-bg:#a4471a");
    expect((html.match(/--tile-bg/g) ?? []).length).toBe(1);
    // rótulo e observação depois (fora) da prancha
    expect(html).toMatch(/rb-brand-grid__tile[^]*<\/div><figcaption class="rb-brand-grid__caption"><span class="rb-brand-grid__label">Principal/);
    expect(render("variacoes-marca", { ctx, fields: { items, columns: "9" } })).toContain('data-columns="3"');
    expect(validateBlock(variacoesMarca, { fields: {} })[0]!.path).toBe("items");
  });
});

describe("imagens", () => {
  const items = [{ image: image("/anima.gif", "Animação"), caption: "Abertura" }, { image: image("/b.png", "Tela") }];

  it("grade e mosaico sem ilha; o GIF vai como está, com legenda", async () => {
    const ctx = await ctxPt();
    for (const layout of ["grade", "mosaico"]) {
      const html = render("imagens", { ctx, fields: { items, layout }, island: createElement("i", { "data-island": "1" }) });
      expect(html).toContain(`data-layout="${layout}"`);
      expect(html).toContain('src="/anima.gif"');
      expect(html).toContain('<figcaption class="rb-images__caption">Abertura</figcaption>');
      expect(html).not.toContain('data-island="1"');
    }
    expect(imagens.islandWhen!({ layout: "grade" }, new Set())).toBe(false);
    expect(validateBlock(imagens, { fields: {} })[0]!.path).toBe("items");
  });

  it("carrossel: sem JavaScript, faixa rolável com foco; com a ilha, o carrossel com legendas e a imagem inteira", async () => {
    const ctx = await ctxPt();
    const html = render("imagens", { ctx, fields: { title: "Aplicações", items, layout: "carrossel" } });
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Aplicações"');
    expect(imagens.islandWhen!({ layout: "carrossel" }, new Set())).toBe(true);
    expect(render("imagens", { ctx, fields: { items, layout: "carrossel" }, island: createElement("i", { "data-island": "1" }) })).toContain('data-island="1"');
    expect(uiKeysWithPrefix(ISLAND_META.imagens!.textPrefixes)).toEqual(expect.arrayContaining(["gallery.expand", "gallery.prev", "gallery.next"]));
    const island = renderToStaticMarkup(createElement(ImagensIsland, { fields: { title: "Aplicações", items }, texts: {} }));
    expect(island).toContain('data-fit="contain"');
    expect(island).toContain('aria-label="Aplicações"');
    expect(island).toContain('<p class="rb-carousel__caption">Abertura</p>');
    expect(island).toContain('src="/anima.gif"');
  });
});

describe("capítulos do vídeo", () => {
  const chapters = [
    { start: "2:15", label: "Resultados" },
    { start: "0:00", label: "Abertura" },
    { start: "1:02:30", label: "Perguntas" },
    { start: "x", label: "Inválido" },
  ];

  it("só os válidos, na ordem do tempo", () => {
    expect(videoChapters(chapters).map((c) => [c.start, c.seconds])).toEqual([["0:00", 0], ["2:15", 135], ["1:02:30", 3750]]);
    expect(videoChapters(undefined)).toEqual([]);
  });

  it("sem JavaScript: lista com tempo e nome, link para o provedor no tempo (YouTube t=, Vimeo #t=)", async () => {
    const ctx = await ctxPt();
    const html = render("video", { ctx, fields: { url: yt, chapters } });
    expect(html).toContain('<nav class="rb-video__chapters" aria-label="Capítulos">');
    expect(html).toContain('href="https://www.youtube.com/watch?v=M7lc1UVf-VE&amp;t=135s"');
    expect(html).toContain('href="https://www.youtube.com/watch?v=M7lc1UVf-VE"');
    expect(html).toContain('aria-label="Ir para 2:15: Resultados (abre em nova aba)"');
    expect(html).not.toContain("Inválido");
    expect(html).toContain("data-chapters");
    const vimeo = render("video", { ctx, fields: { url: "https://vimeo.com/76979871", chapters } });
    expect(vimeo).toContain('href="https://vimeo.com/76979871#t=135s"');
    expect(render("video", { ctx, fields: { url: yt } })).not.toContain("rb-video__chapters");
  });

  it("a ilha mostra os capítulos (links antes de hidratar) e o player começa no tempo do capítulo", () => {
    const html = renderToStaticMarkup(createElement(VideoIsland, { fields: { url: yt, chapters }, texts: { "video.chapters": "Capítulos", "video.chapterAt": "Ir para {time}: {label}" } }));
    expect(html).toContain("rb-video__chapterLink");
    expect(html).toContain("t=135s");
    const t = (k: string) => k;
    const player = renderToStaticMarkup(createElement(VideoFrame, { video: { ...parseVideoUrl(yt)!, start: 135 }, name: "x", ratio: "16-9", mode: "player", t }));
    expect(player).toContain("start=135");
    const vimeo = renderToStaticMarkup(createElement(VideoFrame, { video: { ...parseVideoUrl("https://vimeo.com/76979871")!, start: 135 }, name: "x", ratio: "16-9", mode: "player", t }));
    expect(vimeo).toContain("#t=135s");
  });
});
