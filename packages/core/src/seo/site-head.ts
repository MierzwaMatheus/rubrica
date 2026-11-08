/**
 * Partes do `<head>` que valem para o site inteiro e vêm das configurações (paridade com
 * o `index.html` da v1): favicon, `apple-touch-icon`, `manifest.webmanifest`,
 * `theme-color` por modo de cor, o feed RSS do idioma e o script de analytics.
 */
import { pickWithFallback } from "../i18n";
import type { SiteSettings } from "../content/types";
import type { RawImage } from "../blocks/fields";
import type { RenderContext, ThemeDefinition } from "../theme/contract";
import { getScheme } from "../theme/schemes";
import { ANALYTICS_ATTR, isCssColor, type AnalyticsConfig } from "./analytics";
import type { HeadTag } from "./head";

export const MANIFEST_PATH = "/manifest.webmanifest";

export interface SiteHeadOptions {
  /** Tema ativo: o esquema dele dá a cor da barra quando o site não define. */
  theme?: Pick<ThemeDefinition, "scheme">;
  /** Feeds RSS existentes (um por idioma com posts). */
  feeds?: { locale: string; href: string; title: string }[];
  /** Analytics resolvido (plugin ligado e configurado). */
  analytics?: AnalyticsConfig;
}

/** Cor da barra do navegador por modo: a das configurações, senão o fundo do esquema. */
export function themeColors(settings: Pick<SiteSettings, "themeColor" | "appearance">, theme?: Pick<ThemeDefinition, "scheme">): { light?: string; dark?: string } {
  const scheme = getScheme(settings.appearance.scheme ?? theme?.scheme);
  const pick = (mode: "light" | "dark") => {
    const own = settings.themeColor?.[mode]?.trim();
    return isCssColor(own) ? own : scheme?.[mode].bg;
  };
  const out: { light?: string; dark?: string } = {};
  const light = pick("light");
  const dark = pick("dark");
  if (light) out.light = light;
  if (dark) out.dark = dark;
  return out;
}

/** Cor única (manifest, ou site com modo fixo): a do modo do site; "automático" usa a do escuro. */
export function primaryThemeColor(settings: Pick<SiteSettings, "themeColor" | "appearance">, theme?: Pick<ThemeDefinition, "scheme">): string | undefined {
  const colors = themeColors(settings, theme);
  return settings.appearance.colorMode === "light" ? (colors.light ?? colors.dark) : (colors.dark ?? colors.light);
}

const EXT_TYPES: Record<string, string> = { svg: "image/svg+xml", png: "image/png", ico: "image/x-icon", webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg" };

/** Tipo pela extensão do endereço (URL do storage do Convex não tem: fica sem). */
function imageType(url: string): string | undefined {
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase();
  return ext ? EXT_TYPES[ext] : undefined;
}

const sizes = (img: RawImage) => (img.width && img.height ? `${img.width}x${img.height}` : undefined);

export interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

/** Ícones do manifest: o SVG (qualquer tamanho), os PNG de 192 e 512 e o maskable. */
export function manifestIcons(settings: Pick<SiteSettings, "icons">): ManifestIcon[] {
  const icons = settings.icons ?? {};
  const out: ManifestIcon[] = [];
  const add = (img: RawImage | undefined, fallbackSizes: string, extra: Partial<ManifestIcon> = {}) => {
    if (!img?.url) return;
    const type = extra.type ?? imageType(img.url);
    out.push({ src: img.url, sizes: sizes(img) ?? fallbackSizes, ...(type && { type }), ...(extra.purpose && { purpose: extra.purpose }) });
  };
  add(icons.svg, "any", { type: "image/svg+xml" });
  add(icons.icon192, "192x192");
  add(icons.icon512, "512x512");
  add(icons.maskable, "512x512", { purpose: "maskable" });
  return out;
}

/** `manifest.webmanifest` gerado das configurações (nome, cores e ícones). */
export function webManifest(settings: SiteSettings, theme?: Pick<ThemeDefinition, "scheme">): Record<string, unknown> {
  const cfg = settings.locales;
  const name = pickWithFallback(settings.name, cfg.default, cfg) ?? "";
  const description = pickWithFallback(settings.description, cfg.default, cfg);
  const color = primaryThemeColor(settings, theme);
  return {
    name,
    short_name: name,
    ...(description && { description }),
    lang: cfg.default,
    start_url: "/",
    scope: "/",
    display: "standalone",
    ...(color && { theme_color: color, background_color: color }),
    icons: manifestIcons(settings),
  };
}

/** Tags do `<head>` comuns a todas as páginas do site. */
export function siteHeadTags(settings: SiteSettings, ctx: RenderContext, options: SiteHeadOptions = {}): HeadTag[] {
  const tags: HeadTag[] = [];
  const link = (attrs: Record<string, string>) => tags.push({ tag: "link", attrs });
  const icons = settings.icons ?? {};

  if (icons.favicon?.url) {
    const type = imageType(icons.favicon.url);
    const s = sizes(icons.favicon);
    link({ rel: "icon", href: icons.favicon.url, ...(type && { type }), ...(s && { sizes: s }) });
  }
  if (icons.svg?.url) link({ rel: "icon", type: "image/svg+xml", href: icons.svg.url });
  if (icons.apple?.url) link({ rel: "apple-touch-icon", href: icons.apple.url, sizes: sizes(icons.apple) ?? "180x180" });
  if (manifestIcons(settings).length) link({ rel: "manifest", href: MANIFEST_PATH });

  const colors = themeColors(settings, options.theme);
  if (settings.appearance.colorMode === "system" && colors.light && colors.dark && colors.light !== colors.dark) {
    tags.push({ tag: "meta", attrs: { name: "theme-color", media: "(prefers-color-scheme: light)", content: colors.light } });
    tags.push({ tag: "meta", attrs: { name: "theme-color", media: "(prefers-color-scheme: dark)", content: colors.dark } });
  } else {
    const color = primaryThemeColor(settings, options.theme);
    if (color) tags.push({ tag: "meta", attrs: { name: "theme-color", content: color } });
  }

  const feed = options.feeds?.find((f) => f.locale === ctx.locale);
  if (feed) link({ rel: "alternate", type: "application/rss+xml", title: feed.title, href: feed.href });

  if (options.analytics) {
    tags.push({ tag: "script", attrs: { defer: "", src: options.analytics.src, "data-website-id": options.analytics.websiteId, [ANALYTICS_ATTR]: "" } });
  }
  return tags;
}
