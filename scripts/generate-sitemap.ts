import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { rubricalConfig } from "../rubrica.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SITE_URL = (process.env.SITE_URL || rubricalConfig.siteUrl).replace(/\/+$/, "");
const TODAY = new Date().toISOString().split("T")[0];

const BLOG_DATA_PATH = join(__dirname, "..", "public", "data", "blog.json");
const PORTFOLIO_DATA_PATH = join(__dirname, "..", "public", "data", "portfolio.json");
const OUTPUT_PATH = join(__dirname, "..", "public", "sitemap.xml");

interface StaticRoute {
  path: string;
  changefreq: string;
  priority: string;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/",          changefreq: "daily",   priority: "1.0" },
  { path: "/sobre",     changefreq: "weekly",  priority: "0.9" },
  { path: "/curriculo", changefreq: "weekly",  priority: "0.9" },
  { path: "/portfolio", changefreq: "weekly",  priority: "0.9" },
  { path: "/blog",      changefreq: "daily",   priority: "0.8" },
];

function url(loc: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap(): void {
  console.log("[Sitemap] Starting generation...");

  if (!existsSync(BLOG_DATA_PATH)) {
    throw new Error(`[Sitemap] Blog data not found at ${BLOG_DATA_PATH}`);
  }
  if (!existsSync(PORTFOLIO_DATA_PATH)) {
    throw new Error(`[Sitemap] Portfolio data not found at ${PORTFOLIO_DATA_PATH}`);
  }

  const blogPosts: Array<{ slug: string; status: string }> = JSON.parse(
    readFileSync(BLOG_DATA_PATH, "utf-8")
  );
  const projects: Array<{ slug?: string }> = JSON.parse(
    readFileSync(PORTFOLIO_DATA_PATH, "utf-8")
  );

  const publishedPosts = blogPosts.filter((p) => p.status === "published");
  const sluggedProjects = projects.filter((p) => p.slug);

  console.log(`[Sitemap] ${publishedPosts.length} blog posts, ${sluggedProjects.length} portfolio case studies`);

  const urls: string[] = [
    ...STATIC_ROUTES.map((r) => url(r.path, r.changefreq, r.priority)),
    ...publishedPosts.map((p) => url(`/blog/${p.slug}`, "monthly", "0.7")),
    ...sluggedProjects.map((p) => url(`/portfolio/${p.slug}`, "monthly", "0.6")),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`[Sitemap] Successfully generated at ${OUTPUT_PATH} (${urls.length} URLs)`);
}

generateSitemap();
