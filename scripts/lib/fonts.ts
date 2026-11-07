/**
 * Fontes do Google servidas pelo próprio site. O link do Google Fonts no <head> bloqueava a
 * renderização (CSS de outro domínio, mais o domínio das fontes). No build:
 * - scripts/fetch-fonts.ts baixa o CSS e os arquivos para public/fonts (com cache entre builds);
 * - o plugin selfHostedFonts (vite.config.ts) troca o link pelo CSS embutido e faz preload da
 *   fonte principal.
 * Se o download falhar, o link do Google continua como estava.
 */
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "vite";

/** Link do Google Fonts (o CLI grava no index.html; pode ocupar várias linhas). */
export const GOOGLE_FONTS_LINK = /<link\b[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"[^>]*\/?>/gs;
/** preconnect para os domínios do Google Fonts, que deixam de ser usados. */
const GOOGLE_PRECONNECT = /\s*<link\b[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*\/?>/g;

export const FONTS_DIR = "fonts";
export const FONTS_CSS = "fonts.css";

export function googleFontUrls(html: string): string[] {
  return [...html.matchAll(GOOGLE_FONTS_LINK)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** Nome local de um arquivo de fonte: hash da URL (a URL do Google muda quando a fonte muda). */
export function localFontName(url: string): string {
  const ext = url.match(/\.(woff2|woff|ttf)(?:\?|$)/)?.[1] ?? "woff2";
  return `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${ext}`;
}

/** URLs dos arquivos de fonte citados no CSS do Google. */
export function fontFileUrls(css: string): string[] {
  return [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
}

/** CSS do Google com as URLs trocadas pelos arquivos locais. */
export function localizeFontCss(css: string): string {
  return css.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (_m, url: string) => `url(/${FONTS_DIR}/${localFontName(url)})`);
}

/**
 * Arquivo a pré-carregar: o do subconjunto latino (o que cobre o português) no peso 400, ou o
 * primeiro latino que existir.
 */
export function preloadFont(localCss: string): string | undefined {
  const blocks = [...localCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const latin = blocks.filter((b) => /unicode-range:[^;]*U\+0000-00FF/i.test(b));
  const pick = latin.find((b) => /font-weight:\s*400\b/.test(b)) ?? latin[0];
  return pick?.match(/url\((\/fonts\/[^)]+)\)/)?.[1];
}

/** Troca o link do Google pelo CSS local embutido (e o preload), se o fetch-fonts gerou o CSS. */
export function inlineLocalFonts(html: string, localCss: string): string {
  if (!localCss.trim()) return html;
  const preload = preloadFont(localCss);
  let replaced = false;
  const out = html
    .replace(GOOGLE_PRECONNECT, "")
    .replace(GOOGLE_FONTS_LINK, () => {
      if (replaced) return "";
      replaced = true;
      const tags = [
        preload ? `<link rel="preload" href="${preload}" as="font" type="font/woff2" crossorigin />` : "",
        `<style data-fonts>${localCss.replace(/\s+/g, " ").trim()}</style>`,
      ];
      return tags.filter(Boolean).join("\n    ");
    });
  return replaced ? out : html;
}

/** Plugin do Vite (só no build): usa public/fonts/fonts.css no lugar do Google Fonts. */
export function selfHostedFonts(root: string): Plugin {
  return {
    name: "rubrica-self-hosted-fonts",
    apply: "build",
    transformIndexHtml(html) {
      const cssPath = join(root, "public", FONTS_DIR, FONTS_CSS);
      if (!existsSync(cssPath)) return html;
      return inlineLocalFonts(html, readFileSync(cssPath, "utf-8"));
    },
  };
}
