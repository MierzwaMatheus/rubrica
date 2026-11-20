/**
 * "Cara do cliente" no editor de projeto: valores iniciais, relatório de contraste por
 * modo e os problemas que impedem salvar. Puro: a regra de contraste é a do núcleo
 * (`validateBrand`, em theme/brand.ts), a mesma que o render e o backend aplicam.
 */
import { HEX_COLOR } from "../../blocks/fields";
import type { CaseBrand, CaseBrandColors } from "../../content/types";
import { BRAND_MIN_ACCENT_CONTRAST, BRAND_MIN_TEXT_CONTRAST, validateBrand, type BrandIssue, type BrandMode } from "../../theme/brand";
import { contrastRatio } from "../../theme/schemes";

export const DEFAULT_LIGHT: CaseBrandColors = { background: "#ffffff", foreground: "#1a1a1a", accent: "#2563eb" };
export const DEFAULT_DARK: CaseBrandColors = { background: "#111111", foreground: "#f5f5f5", accent: "#60a5fa" };

/** Marca nova, ligada, com cores neutras que já passam no contraste. */
export function defaultBrand(): CaseBrand {
  return { enabled: true, light: { ...DEFAULT_LIGHT } };
}

export interface ModeReport {
  mode: BrandMode;
  /** Contraste texto/fundo e destaque/fundo (`undefined` se alguma cor não é válida). */
  text?: number;
  accent?: number;
  textOk: boolean;
  accentOk: boolean;
}

/** Contraste de um modo, com a conta que o selo mostra. */
export function modeReport(mode: BrandMode, colors: CaseBrandColors): ModeReport {
  const valid = [colors.background, colors.foreground, colors.accent].every((c) => typeof c === "string" && HEX_COLOR.test(c));
  if (!valid) return { mode, textOk: false, accentOk: false };
  const text = contrastRatio(colors.foreground, colors.background);
  const accent = contrastRatio(colors.accent, colors.background);
  return { mode, text, accent, textOk: text >= BRAND_MIN_TEXT_CONTRAST, accentOk: accent >= BRAND_MIN_ACCENT_CONTRAST };
}

/**
 * Problemas que a pessoa precisa resolver antes de salvar. Marca desligada (`enabled: false`)
 * guarda as cores sem aplicar: não bloqueia, para dar para desligar uma marca em ajuste.
 */
export function brandProblems(brand: CaseBrand | undefined): BrandIssue[] {
  if (!brand || brand.enabled === false) return [];
  return validateBrand(brand);
}

/** Problemas de um campo (`light.foreground`, `dark.accent`, `fontDisplay`). */
export function issuesAt(issues: readonly BrandIssue[], mode: BrandMode, path: string): BrandIssue[] {
  return issues.filter((i) => i.path === path && (path === "fontDisplay" || i.mode === mode));
}

/** Marca como o formulário guarda: sem `dark` vazio e com o nome da fonte aparado. */
export function cleanBrand(brand: CaseBrand | undefined): CaseBrand | undefined {
  if (!brand) return undefined;
  const out: CaseBrand = { light: brand.light };
  if (brand.enabled !== undefined) out.enabled = brand.enabled;
  if (brand.dark) out.dark = brand.dark;
  const font = brand.fontDisplay?.trim();
  if (font) out.fontDisplay = font;
  return out;
}

/** Famílias populares do Google Fonts, sugeridas no campo da fonte (qualquer nome do Google vale). */
export const FONT_SUGGESTIONS = ["Playfair Display", "Montserrat", "Poppins", "Space Grotesk", "DM Serif Display", "Bebas Neue", "Fraunces", "Syne", "Raleway", "Libre Baskerville"];
