import type { APIRoute } from "astro";
import { loadSite } from "../runtime";
import { robotsTxt } from "../../seo/sitemap";
import { localePrefix } from "../../i18n";

export const GET: APIRoute = async () => {
  const site = await loadSite();
  const cfg = site.settings.locales;
  const prefixes = cfg.locales.filter((l) => l !== cfg.default).map((l) => localePrefix(l, cfg));
  return new Response(robotsTxt(site.settings.url, prefixes), { headers: { "content-type": "text/plain; charset=utf-8" } });
};
