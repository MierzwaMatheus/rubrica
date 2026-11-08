/**
 * Sitemap e robots.txt do site público. Entram as páginas indexáveis nos dois idiomas
 * (início, novidades e cada doc), com os hreflang de cada uma. Ficam de fora a entrevista
 * de voz (noindex), os redirecionamentos (/docs) e os previews do combinador.
 */
import { HTML_LANG, LANGS, route, type PageRef } from "../i18n/routes";
import { docUrl } from "./docs";

/** Páginas que vão para o sitemap, cada uma com o endereço em cada idioma. */
export function sitemapPages(docSlugs: string[]): PageRef[] {
  return ["home", "changelog", ...docSlugs.map((slug) => ({ pt: docUrl(slug, "pt"), en: docUrl(slug, "en") }))];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function sitemapXml(site: URL, pages: PageRef[]): string {
  const abs = (path: string) => esc(new URL(path, site).href);
  const urls = pages.flatMap((page) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${abs(route(page, l))}"/>`),
        `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(route(page, "pt"))}"/>`,
      ];
      return `<url><loc>${abs(route(page, lang))}</loc>${alternates.join("")}</url>`;
    }),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function robotsTxt(site: URL): string {
  return ["User-agent: *", "Disallow: /previews/", "", `Sitemap: ${new URL("/sitemap.xml", site).href}`, ""].join("\n");
}
