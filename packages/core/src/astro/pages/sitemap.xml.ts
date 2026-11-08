import type { APIRoute } from "astro";
import { loadSite } from "../runtime";
import { sitemapXml } from "../../seo/sitemap";

export const GET: APIRoute = async () => {
  const site = await loadSite();
  return new Response(sitemapXml(site.settings.url, site.routes), { headers: { "content-type": "application/xml; charset=utf-8" } });
};
