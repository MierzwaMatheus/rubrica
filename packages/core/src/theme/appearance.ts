/**
 * Aparência do site no <head>: esquema de cor, fontes e tokens do painel, na ordem
 * tokens do tema < esquema escolhido < `appearance.tokens` (RFC v2, esquemas de cor).
 *
 * A ordem não depende da posição das folhas de estilo: o esquema usa `:root[data-scheme]`
 * e os tokens do painel `:root[data-theme-id][data-color-mode][lang]`, ambos mais
 * específicos que o `:root` do tema e do base.css.
 */
import { TEXTURES, type SiteSettings, type Texture } from "../content/types";
import type { ThemeDefinition } from "./contract";
import { FONT_TOKENS, planFonts, type FontPlan } from "./fonts";
import { getScheme, schemeCss } from "./schemes";

export interface AppearanceHead {
  /** Valor de `data-scheme` na raiz (ausente: sem esquema). */
  scheme?: string;
  /** Valor de `data-texture` na raiz (ausente: sem textura). */
  texture?: Exclude<Texture, "none">;
  /** CSS inline do <head> (pode ser vazio). */
  css: string;
  fonts: FontPlan;
}

const TOKEN_NAME = /^[a-z0-9-]+$/i;
const unsafeValue = (v: string) => /[;{}<>]/.test(v);

/** Textura do site: a escolhida na aparência, senão a do tema; `none` ou desconhecida, nenhuma. */
export function resolveTexture(appearance: Pick<SiteSettings["appearance"], "texture">, theme: Pick<ThemeDefinition, "texture">): Exclude<Texture, "none"> | undefined {
  const texture = appearance.texture ?? theme.texture;
  return texture && texture !== "none" && TEXTURES.includes(texture) ? texture : undefined;
}

export function appearanceHead(settings: Pick<SiteSettings, "appearance">, theme: Pick<ThemeDefinition, "scheme" | "fonts" | "texture">, plan?: FontPlan): AppearanceHead {
  const { appearance } = settings;
  const requested = appearance.scheme ?? theme.scheme;
  const scheme = getScheme(requested);
  if (requested && !scheme) console.warn(`[rubrica] esquema de cor desconhecido: "${requested}" (ignorado)`);

  // `plan` é o que o build decidiu (e pediu ao Astro); sem ele, calcula pelo tema.
  const fonts = plan ?? planFonts(appearance, theme.fonts);
  const fontDeclarations = Object.entries(fonts.assign).map(([token, variable]) => `${token}:var(${variable})`);

  const tokens = Object.entries(appearance.tokens ?? {})
    .filter(([k, v]) => TOKEN_NAME.test(k) && typeof v === "string" && !unsafeValue(v))
    .map(([k, v]) => `--${k}:${v}`);

  const css: string[] = [];
  if (scheme) css.push(schemeCss(scheme));
  // Fontes e tokens do painel no mesmo bloco, nesta ordem: o painel vence o resto.
  const overrides = [...fontDeclarations, ...tokens];
  if (overrides.length) css.push(`:root[data-theme-id][data-color-mode][lang]{${overrides.join(";")}}`);
  const texture = resolveTexture(appearance, theme);
  return { scheme: scheme?.id, ...(texture && { texture }), css: css.join("\n"), fonts };
}

export { FONT_TOKENS };
