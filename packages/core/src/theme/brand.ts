/**
 * "Case com a cara do cliente": as cores da marca do cliente, conferidas por contraste
 * (WCAG) e aplicadas só dentro do case por variáveis CSS com escopo `[data-rb-brand]`.
 * Cabeçalho e rodapé continuam com o tema do site.
 */
import type { CaseBrand, CaseBrandColors } from "../content/types";
import { HEX_COLOR } from "../blocks/fields";
import { contrastRatio, mixColors } from "./schemes";
import { BRAND_FONT_VAR, fontVarFor } from "./fonts";

/** Mínimos de contraste: texto normal (AA) e elementos de interface/texto grande. */
export const BRAND_MIN_TEXT_CONTRAST = 4.5;
export const BRAND_MIN_ACCENT_CONTRAST = 3;

export type BrandMode = "light" | "dark";

export interface BrandIssue {
  mode: BrandMode;
  /** Campo com o problema: `background`, `foreground`, `accent` ou `fontDisplay`. */
  path: string;
  message: string;
}

/** Cores de um modo já prontas para o CSS (com o texto sobre o destaque calculado). */
export interface ResolvedBrandColors extends CaseBrandColors {
  /** Branco ou preto, o que der mais contraste sobre `accent`. */
  accentForeground: string;
}

/** Marca do cliente pronta para o tema (o que `CaseTemplateProps.brand` recebe). */
export interface ResolvedBrand {
  light: ResolvedBrandColors;
  dark: ResolvedBrandColors;
  fontDisplay?: string;
}

/** Texto sobre o destaque: branco ou preto, o de maior contraste. */
export function accentForeground(accent: string): string {
  return contrastRatio(accent, "#ffffff") >= contrastRatio(accent, "#000000") ? "#ffffff" : "#000000";
}

function checkMode(colors: CaseBrandColors | undefined, mode: BrandMode, issues: BrandIssue[], contrast: boolean): void {
  if (!colors) {
    if (mode === "light") issues.push({ mode, path: "light", message: "cores do modo claro: obrigatórias" });
    return;
  }
  let valid = true;
  for (const key of ["background", "foreground", "accent"] as const) {
    if (typeof colors[key] !== "string" || !HEX_COLOR.test(colors[key])) {
      issues.push({ mode, path: key, message: `${key}: cor em hexadecimal, como #7a1f2b` });
      valid = false;
    }
  }
  if (!valid || !contrast) return;
  const text = contrastRatio(colors.foreground, colors.background);
  if (text < BRAND_MIN_TEXT_CONTRAST) {
    issues.push({ mode, path: "foreground", message: `texto sobre o fundo com contraste ${text.toFixed(2)}:1 (mínimo ${BRAND_MIN_TEXT_CONTRAST}:1)` });
  }
  const accent = contrastRatio(colors.accent, colors.background);
  if (accent < BRAND_MIN_ACCENT_CONTRAST) {
    issues.push({ mode, path: "accent", message: `destaque sobre o fundo com contraste ${accent.toFixed(2)}:1 (mínimo ${BRAND_MIN_ACCENT_CONTRAST}:1)` });
  }
}

/**
 * Problemas da marca (formato e contraste, nos dois modos). Lista vazia = pode salvar.
 * Marca desligada (`enabled: false`) guarda as cores sem aplicar: só o formato é conferido,
 * para dar para desligar uma marca em ajuste.
 */
export function validateBrand(brand: CaseBrand): BrandIssue[] {
  const issues: BrandIssue[] = [];
  const contrast = brand.enabled !== false;
  checkMode(brand.light, "light", issues, contrast);
  if (brand.dark) checkMode(brand.dark, "dark", issues, contrast);
  if (brand.fontDisplay !== undefined && !/^[A-Za-z0-9 ]{1,60}$/.test(brand.fontDisplay.trim())) {
    issues.push({ mode: "light", path: "fontDisplay", message: "fonte: o nome da família no Google Fonts (letras, números e espaços)" });
  }
  return issues;
}

function resolveColors(c: CaseBrandColors): ResolvedBrandColors {
  const lower = (h: string) => h.toLowerCase();
  const accent = lower(c.accent);
  return { background: lower(c.background), foreground: lower(c.foreground), accent, accentForeground: accentForeground(accent) };
}

/** Marca pronta para o render; desligada ou inválida → undefined (o case usa o tema). */
export function resolveBrand(brand: CaseBrand | undefined): ResolvedBrand | undefined {
  if (!brand || brand.enabled === false || validateBrand(brand).length > 0) return undefined; // desligada: só guarda
  const light = resolveColors(brand.light);
  const out: ResolvedBrand = { light, dark: brand.dark ? resolveColors(brand.dark) : light };
  const font = brand.fontDisplay?.trim();
  if (font) out.fontDisplay = font;
  return out;
}

/** Superfícies e linhas: o fundo puxado um pouco para o texto (como os esquemas). */
const SURFACE_MIX = 0.04;
const SUBTLE_MIX = 0.08;
const BORDER_MIX = 0.2;

/**
 * Texto secundário: o texto puxado para o fundo o quanto der sem cair de 4.5:1 sobre o fundo
 * e sobre a superfície (no limite, o próprio texto). Sem isso, o `--rb-muted` do tema
 * (pensado para o fundo dele) ficaria ilegível sobre o fundo do cliente.
 */
function mutedFor(c: ResolvedBrandColors, surface: string): string {
  for (let t = 0.45; t > 0; t -= 0.05) {
    const muted = mixColors(c.foreground, c.background, t);
    if (contrastRatio(muted, c.background) >= BRAND_MIN_TEXT_CONTRAST && contrastRatio(muted, surface) >= BRAND_MIN_TEXT_CONTRAST) return muted;
  }
  return c.foreground;
}

function declarations(c: ResolvedBrandColors, font?: string): string {
  const surface = mixColors(c.background, c.foreground, SURFACE_MIX);
  const light = contrastRatio(c.background, "#000000") > contrastRatio(c.background, "#ffffff");
  const decls = [
    `--rb-bg:${c.background}`,
    `--rb-fg:${c.foreground}`,
    `--rb-fg-strong:${c.foreground}`,
    `--rb-muted:${mutedFor(c, surface)}`,
    `--rb-surface:${surface}`,
    `--rb-subtle:${mixColors(c.background, c.foreground, SUBTLE_MIX)}`,
    `--rb-border:${mixColors(c.background, c.foreground, BORDER_MIX)}`,
    `--rb-accent:${c.accent}`,
    `--rb-accent-fg:${c.accentForeground}`,
    // A segunda cor do tema pode virar texto ou botão: no case, ela segue o destaque do cliente.
    `--rb-accent-2:${c.accent}`,
    `--rb-accent-2-fg:${c.accentForeground}`,
    `color-scheme:${light ? "light" : "dark"}`,
  ];
  // A família vem da Fonts API do Astro, na variável da família (`fontVarFor`, planejada no
  // build por `planContentFonts`). `--rbf-brand` aponta para ela só dentro do case: sem a
  // fonte (família inexistente, download que falhou), a variável fica indefinida e os
  // títulos caem na fonte do texto do tema.
  if (font) decls.push(`${BRAND_FONT_VAR}:var(${fontVarFor(font)})`, `--rb-font-display:var(${BRAND_FONT_VAR}, var(--rb-font-sans))`);
  return decls.join(";");
}

/**
 * CSS da marca com escopo no wrapper do case (`[data-rb-brand]`), por modo, no mesmo
 * padrão do `schemeCss`: escuro por padrão, claro com `data-color-mode="light"` ou, em
 * "system", com `prefers-color-scheme: light`. Os seletores levam `:root[data-scheme]`
 * para vencer, por especificidade, os tokens do tema e do esquema.
 */
export function brandCss(brand: ResolvedBrand): string {
  const dark = declarations(brand.dark, brand.fontDisplay);
  const light = declarations(brand.light, brand.fontDisplay);
  const scope = "[data-rb-brand]";
  return [
    `:root ${scope},:root[data-scheme] ${scope}{${dark}}`,
    `:root[data-color-mode="light"] ${scope},:root[data-scheme][data-color-mode="light"] ${scope}{${light}}`,
    `@media (prefers-color-scheme:light){:root[data-color-mode="system"] ${scope},:root[data-scheme][data-color-mode="system"] ${scope}{${light}}}`,
  ].join("\n");
}
