import { writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { rubricalConfig } from "../rubrica.config";
import { listPublicRoutes } from "./lib/publicRoutes";
import { localizedPath } from "../src/i18n/localePath";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = (process.env.SITE_URL || rubricalConfig.siteUrl).replace(/\/+$/, "");
const TODAY = new Date().toISOString().split("T")[0];

const DATA_DIR = join(__dirname, "..", "public", "data");
const OUTPUT_PATH = join(__dirname, "..", "public", "sitemap.xml");
const ROBOTS_PATH = join(__dirname, "..", "public", "robots.txt");

/** Rotas do app (painel, login, propostas, checkout): não são conteúdo para buscadores. */
export const ROBOTS_DISALLOW = ["/admin", "/login", "/playground", "/proposta/", "/checkout/", "/payment-success/", "/en/proposta/", "/en/checkout/", "/en/payment-success/"];

export function robotsTxt(siteUrl: string): string {
  return ["User-agent: *", "Allow: /", ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`), "", `Sitemap: ${siteUrl}/sitemap.xml`, ""].join("\n");
}

/** Cada página entra duas vezes (pt-BR e inglês), cada uma apontando para as duas versões. */
function urlEntries(path: string, changefreq: string, priority: string, lastmod: string): string[] {
  const pt = `${SITE_URL}${localizedPath(path, "pt-BR")}`;
  const en = `${SITE_URL}${localizedPath(path, "en-US")}`;
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="pt-BR" href="${pt}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${pt}"/>`,
  ].join("\n");
  return [pt, en].map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`,
  );
}

function generateSitemap(): void {
  console.log("[Sitemap] Starting generation...");

  for (const file of ["blog.json", "portfolio.json"]) {
    if (!existsSync(join(DATA_DIR, file))) {
      throw new Error(`[Sitemap] ${file} not found in ${DATA_DIR}`);
    }
  }

  const routes = listPublicRoutes(DATA_DIR);
  const urls = routes.flatMap((r) => urlEntries(r.path, r.changefreq, r.priority, r.lastmod ?? TODAY));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`[Sitemap] Successfully generated at ${OUTPUT_PATH} (${urls.length} URLs)`);
  writeFileSync(ROBOTS_PATH, robotsTxt(SITE_URL), "utf-8");
  console.log(`[Sitemap] robots.txt em ${ROBOTS_PATH}`);
}

// Só roda como script (os testes importam robotsTxt).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) generateSitemap();
