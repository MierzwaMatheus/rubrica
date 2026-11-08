/**
 * Fontes do site (RFC v2: "tratamento de fontes do próprio Astro", no lugar do
 * `fetch-fonts` da v1). O núcleo só decide QUAIS famílias entram; o download do Google
 * Fonts no build, o `@font-face` local e as fontes de reserva ficam com a Fonts API do
 * Astro. O navegador nunca fala com fonts.googleapis.com.
 *
 * Famílias: `appearance.fontSans`/`fontMono` do site, senão as do tema (`theme.fonts`).
 */
import type { Appearance } from "../content/types";
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
 * desloca o layout).
 */
export function fontPreloads(plan: FontPlan): Map<string, string> {
  const out = new Map<string, string>();
  const sans = plan.assign["--rb-font-sans"];
  if (sans) out.set(sans, "400");
  const display = plan.assign["--rb-font-display"];
  if (display && display !== sans) {
    const font = plan.fonts.find((f) => f.cssVariable === display);
    const weight = font ? [...font.weights].filter((w) => w <= 700).pop() ?? font.weights[0] : 700;
    out.set(display, String(weight));
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
