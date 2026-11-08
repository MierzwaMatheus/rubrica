/** sitemap.xml e robots.txt a partir das rotas do site. */
import type { SiteRoute } from "../render/site";

const xmlEscape = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(siteUrl: string, routes: SiteRoute[]): string {
  const base = siteUrl.replace(/\/+$/, "");
  const indexable = routes.filter((r) => !(r.type === "page" && r.page.seo.noindex) && !(r.type === "post" && r.post.seo.noindex) && !(r.type === "case" && r.project.seo.noindex));
  const urls = indexable.map((r) => {
    const alternates =
      r.alternates.length > 1
        ? r.alternates.map((a) => `\n    <xhtml:link rel="alternate" hreflang="${xmlEscape(a.locale)}" href="${xmlEscape(base + a.href)}"/>`).join("")
        : "";
    return `  <url>\n    <loc>${xmlEscape(base + r.url)}</loc>${r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ""}${alternates}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

/** Rotas do app ficam fora dos buscadores. */
export const ROBOTS_DISALLOW = ["/admin", "/login", "/proposta/", "/checkout/", "/payment-success/"];

export function robotsTxt(siteUrl: string, prefixes: string[] = []): string {
  const disallow = [...ROBOTS_DISALLOW, ...prefixes.flatMap((p) => ROBOTS_DISALLOW.filter((d) => d.endsWith("/")).map((d) => `/${p}${d}`))];
  return ["User-agent: *", "Allow: /", ...disallow.map((p) => `Disallow: ${p}`), "", `Sitemap: ${siteUrl.replace(/\/+$/, "")}/sitemap.xml`, ""].join("\n");
}
