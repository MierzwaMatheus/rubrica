/**
 * Fontes do site (RFC v2: "tratamento de fontes do próprio Astro", no lugar do
 * `fetch-fonts` da v1). O núcleo só decide QUAIS famílias entram; o download do Google
 * Fonts no build, o `@font-face` local e as fontes de reserva ficam com a Fonts API do
 * Astro. O navegador nunca fala com fonts.googleapis.com.
 *
 * Famílias: `appearance.fontSans`/`fontMono` do site, senão as do tema (`theme.fonts`).
 * Além delas, as fontes de conteúdo (`planContentFonts`): a fonte de título do cliente
 * (`project.brand.fontDisplay`) e as dos blocos `tipografia`, cada uma na sua variável
 * (`fontVarFor`), carregadas só nas páginas que as usam.
 */
import type { Appearance, BlockInstance, PageRecord, RawProject } from "../content/types";
import type { ThemeFonts } from "./contract";

export type FontSlot = "sans" | "mono" | "display";

/** Variável CSS que a Fonts API do Astro preenche com a família (e as de reserva). */
export const FONT_FACE_VARS: Record<FontSlot, string> = { sans: "--rbf-sans", mono: "--rbf-mono", display: "--rbf-display" };
/** Token do tema que passa a apontar para a família carregada. */
export const FONT_TOKENS: Record<FontSlot, string> = { sans: "--rb-font-sans", mono: "--rb-font-mono", display: "--rb-font-display" };

/** Pesos que a família tem de fato no Google Fonts (pedir um que não existe falha o build). */
const WEIGHTS: Record<string, number[]> = {
  Inter: [300, 400, 500, 600, 700],
  "Chakra Petch": [300, 400, 500, 600, 700],
  "Playfair Display": [400, 500, 600, 700, 800],
  "Space Grotesk": [300, 400, 500, 600, 700],
  "DM Sans": [300, 400, 500, 600, 700],
  "Bodoni Moda": [400, 500, 600, 700, 800],
  "IBM Plex Serif": [300, 400, 500, 600, 700],
  Manrope: [300, 400, 500, 600, 700, 800],
  Archivo: [300, 400, 500, 600, 700, 800],
  "Instrument Sans": [400, 500, 600, 700],
  "IBM Plex Sans": [300, 400, 500, 600, 700],
  Fraunces: [300, 400, 500, 600, 700, 800],
  "Source Serif 4": [300, 400, 600, 700],
  "Bricolage Grotesque": [300, 400, 500, 600, 700, 800],
  "JetBrains Mono": [300, 400, 500, 600, 700],
  "Fira Code": [300, 400, 500, 600, 700],
  "Space Mono": [400, 700],
  "IBM Plex Mono": [300, 400, 500, 600, 700],
  Caveat: [400, 500, 600, 700],
};

/** Famílias conhecidas com serifa ou monoespaçadas (o resto é tratado como sem serifa). */
const SERIF = new Set(["Playfair Display", "Bodoni Moda", "IBM Plex Serif", "Fraunces", "Source Serif 4"]);
const MONO = new Set(["JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono"]);
/** Letra à mão: a reserva precisa ser cursiva, senão a troca muda a altura dos títulos. */
const HANDWRITING = new Set(["Caveat"]);

/**
 * Fontes de reserva da família, terminando na genérica do desenho dela (não do papel): a
 * Fonts API do Astro gera a reserva com métricas ajustadas (`size-adjust`) a partir da
 * genérica final, então uma monoespaçada no papel de texto (brutalist) precisa de reserva
 * monoespaçada, e uma serifada, de reserva serifada, para o texto não pular ao trocar.
 */
export function fontFallbacks(family: string): string[] {
  if (MONO.has(family) || /\b(mono|code)\b/i.test(family)) return ["ui-monospace", "monospace"];
  if (SERIF.has(family) || (/serif/i.test(family) && !/sans/i.test(family))) return ["ui-serif", "serif"];
  if (HANDWRITING.has(family)) return ["cursive"];
  return ["system-ui", "sans-serif"];
}

/** Famílias do Google Fonts sem itálico: pedir o estilo falharia o download. */
const NO_ITALIC = new Set(["Manrope", "Space Grotesk", "Bricolage Grotesque"]);

/** A família tem itálico no Google Fonts? (Desconhecida: supõe que sim.) */
export function hasItalic(family: string): boolean {
  return !NO_ITALIC.has(family);
}

export type FontStyle = "normal" | "italic";

/** Famílias com pesos conhecidos (as que o painel e o CLI oferecem). */
export const KNOWN_FONTS = Object.keys(WEIGHTS);

/**
 * Fontes a pré-carregar: a do texto (400) e, se o tema tem fonte de destaque própria, a de
 * destaque no peso mais forte até 700 (é a dos títulos acima da dobra: sem ela, a troca
 * desloca o layout). Devolve os pesos aceitos por variável CSS, para o filtro do `<Font>`.
 *
 * Fonte variável do Google é um arquivo só para todos os pesos, e o Astro registra o
 * pré-carregamento dele no primeiro peso pedido: por isso o primeiro peso da família entra
 * junto. Numa fonte estática, isso pode pré-carregar um arquivo a mais.
 */
export function fontPreloads(plan: FontPlan): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const weightsOf = (cssVariable: string, wanted: number) => {
    const first = plan.fonts.find((f) => f.cssVariable === cssVariable)?.weights[0];
    return [...new Set([wanted, ...(first !== undefined ? [first] : [])])].map(String);
  };
  const sans = plan.assign["--rb-font-sans"];
  if (sans) out.set(sans, weightsOf(sans, 400));
  const display = plan.assign["--rb-font-display"];
  if (display && display !== sans) {
    const font = plan.fonts.find((f) => f.cssVariable === display);
    const weight = font ? [...font.weights].filter((w) => w <= 700).pop() ?? font.weights[0]! : 700;
    out.set(display, weightsOf(display, weight));
  }
  return out;
}

export function fontWeights(family: string): number[] {
  return WEIGHTS[family] ?? [400, 700];
}

/** Só letras, números, espaço, ponto, hífen e sublinhado: o nome vai para config e CSS. */
export function isSafeFamily(name: unknown): name is string {
  return typeof name === "string" && name.length <= 64 && /^[\p{L}\p{N} ._-]+$/u.test(name.trim()) && name.trim().length > 0;
}

export interface PlannedFont {
  name: string;
  cssVariable: string;
  weights: number[];
  /** Estilos a baixar: sempre `normal`; `italic` quando o tema pede para o papel. */
  styles: FontStyle[];
  /** Genérica de reserva (a Fonts API gera fallbacks com métricas parecidas). */
  fallbacks: string[];
}

export interface FontPlan {
  /** Famílias a baixar, sem repetição. */
  fonts: PlannedFont[];
  /** Token do tema → variável da fonte carregada. */
  assign: Partial<Record<string, string>>;
  /**
   * Fontes de conteúdo (fonte do cliente nos cases, blocos `tipografia`), cada uma na
   * variável de `fontVarFor`. Baixadas no build como as outras, mas o `<head>` só as declara
   * nas páginas que as usam (`routeFontVars`).
   */
  content?: PlannedFont[];
}

/** Decide as famílias do site: o que o site escolheu vence o que o tema traz. */
export function planFonts(appearance: Pick<Appearance, "fontSans" | "fontMono"> | undefined, themeFonts: ThemeFonts | undefined): FontPlan {
  const italicSlots = new Set(Array.isArray(themeFonts?.italic) ? themeFonts.italic : []);
  const wanted: Partial<Record<FontSlot, string>> = {
    sans: [appearance?.fontSans, themeFonts?.sans].find(isSafeFamily)?.trim(),
    mono: [appearance?.fontMono, themeFonts?.mono].find(isSafeFamily)?.trim(),
    display: isSafeFamily(themeFonts?.display) ? themeFonts.display.trim() : undefined,
  };
  const fonts: PlannedFont[] = [];
  const byName = new Map<string, PlannedFont>();
  const assign: Record<string, string> = {};
  for (const slot of ["sans", "mono", "display"] as const) {
    const name = wanted[slot];
    if (!name) continue;
    let font = byName.get(name);
    if (!font) {
      font = {
        name,
        cssVariable: FONT_FACE_VARS[slot],
        weights: fontWeights(name),
        styles: ["normal"],
        fallbacks: slot === "mono" ? ["ui-monospace", "monospace"] : fontFallbacks(name),
      };
      byName.set(name, font);
      fonts.push(font);
    }
    if (italicSlots.has(slot) && hasItalic(name) && !font.styles.includes("italic")) font.styles.push("italic");
    assign[FONT_TOKENS[slot]] = font.cssVariable;
  }
  return { fonts, assign };
}

// ── Fontes de conteúdo ──────────────────────────────────────────────────────

/**
 * Variável CSS de uma família de conteúdo: `--rbf-f-<slug>` ("Big Shoulders Display" →
 * `--rbf-f-big-shoulders-display`). A Fonts API do Astro a preenche com a família e as
 * reservas; sem a fonte (família inexistente, download que falhou), ela fica indefinida.
 *
 * Contrato com os componentes: quem desenha uma família de conteúdo usa
 * `font-family: var(<fontVarFor(family)>, <reserva>)`, por exemplo o bloco `tipografia`
 * com `var(--rbf-f-fraunces, var(--rb-font-sans))`. Indefinida a variável, vale a reserva
 * (e o componente pode cair na amostra em imagem).
 */
export function fontVarFor(family: string): string {
  const slug = family
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `--rbf-f-${slug || "x"}`;
}

/**
 * Variável da fonte de título do cliente dentro do case (`brandCss`): aponta para a
 * `fontVarFor` da família, no escopo `[data-rb-brand]`.
 */
export const BRAND_FONT_VAR = "--rbf-brand";

/** Pesos de um texto livre ("400, 700", "300 600"): só 100 a 900, de cem em cem. */
export function parseWeights(text: unknown): number[] {
  if (typeof text !== "string") return [];
  const out = new Set<number>();
  for (const part of text.split(/[\s,;/]+/)) {
    const n = Number(part);
    if (Number.isInteger(n) && n >= 100 && n <= 900 && n % 100 === 0) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/** Uma família de conteúdo e os pesos pedidos (vazio: os padrões da família). */
export interface ContentFontUse {
  family: string;
  weights: number[];
}

/** Famílias dos blocos `tipografia` visíveis (campos crus ou já resolvidos: `family` não é traduzível). */
export function fontsInBlocks(blocks: readonly Pick<BlockInstance, "type" | "fields">[]): ContentFontUse[] {
  const out: ContentFontUse[] = [];
  for (const b of blocks) {
    if (b.type !== "tipografia" || ("visible" in b && b.visible === false)) continue;
    const list = Array.isArray(b.fields?.fonts) ? (b.fields.fonts as Record<string, unknown>[]) : [];
    for (const f of list) {
      if (typeof f?.family === "string" && f.family.trim()) out.push({ family: f.family.trim(), weights: parseWeights(f.weights) });
    }
  }
  return out;
}

/**
 * Variáveis das fontes de conteúdo que uma página usa (os blocos dela e, no case, a fonte
 * do cliente), entre as que o build planejou: o `<head>` só declara essas.
 */
export function routeFontVars(plan: FontPlan, blocks: readonly Pick<BlockInstance, "type" | "fields">[], brandFont?: string): string[] {
  const planned = new Set((plan.content ?? []).map((f) => f.cssVariable));
  const vars = [...fontsInBlocks(blocks).map((u) => u.family), ...(brandFont ? [brandFont] : [])].map(fontVarFor);
  return [...new Set(vars)].filter((v) => planned.has(v));
}

/** Pesos a baixar: os pedidos que a família tem (conhecida) ou os pedidos; senão os padrões. */
function contentWeights(family: string, wanted: number[]): number[] {
  const known = WEIGHTS[family];
  if (!wanted.length) return known ?? [400, 700];
  if (!known) return wanted;
  const valid = wanted.filter((w) => known.includes(w));
  return valid.length ? valid : known;
}

export interface ContentFontsResult {
  fonts: PlannedFont[];
  /** Avisos (família com nome inválido, pesos ignorados): o build segue. */
  warnings: string[];
}

/**
 * Fontes de conteúdo do snapshot: a fonte de título do cliente de cada projeto (marca
 * ligada) e as famílias dos blocos `tipografia` de páginas e cases. Cada família vira uma
 * entrada com a sua variável (`fontVarFor`) e os pesos somados de todos os usos.
 *
 * Família com nome inválido é ignorada com aviso. Família ou peso que o Google não tem
 * não quebra o build: a Fonts API do Astro avisa e segue, a variável fica indefinida e o
 * componente cai na reserva.
 */
export function planContentFonts(content: { pages: readonly Pick<PageRecord, "blocks">[]; projects: readonly Pick<RawProject, "blocks" | "brand">[] }): ContentFontsResult {
  const warnings: string[] = [];
  const uses: ContentFontUse[] = [];
  for (const page of content.pages) uses.push(...fontsInBlocks(page.blocks));
  for (const project of content.projects) {
    uses.push(...fontsInBlocks(project.blocks ?? []));
    const brand = project.brand;
    if (brand && brand.enabled !== false && brand.fontDisplay?.trim()) uses.push({ family: brand.fontDisplay.trim(), weights: [] });
  }
  const byVar = new Map<string, { family: string; weights: Set<number>; defaults: boolean }>();
  for (const use of uses) {
    if (!isSafeFamily(use.family)) {
      warnings.push(`fonte "${use.family}" ignorada: o nome da família só pode ter letras, números, espaço, ponto, hífen e sublinhado.`);
      continue;
    }
    const cssVariable = fontVarFor(use.family);
    let entry = byVar.get(cssVariable);
    if (!entry) byVar.set(cssVariable, (entry = { family: use.family, weights: new Set(), defaults: false }));
    if (use.weights.length) use.weights.forEach((w) => entry!.weights.add(w));
    else entry.defaults = true;
  }
  const fonts: PlannedFont[] = [];
  for (const [cssVariable, { family, weights, defaults }] of byVar) {
    const wanted = [...weights].sort((a, b) => a - b);
    const chosen = new Set(contentWeights(family, wanted));
    if (defaults) contentWeights(family, []).forEach((w) => chosen.add(w));
    const known = WEIGHTS[family];
    const dropped = known ? wanted.filter((w) => !known.includes(w)) : [];
    if (dropped.length) warnings.push(`fonte "${family}": pesos ${dropped.join(", ")} não existem nela e ficaram de fora.`);
    fonts.push({ name: family, cssVariable, weights: [...chosen].sort((a, b) => a - b), styles: ["normal"], fallbacks: fontFallbacks(family) });
  }
  return { fonts, warnings };
}
