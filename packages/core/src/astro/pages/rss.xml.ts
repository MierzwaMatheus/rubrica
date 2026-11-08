import type { APIRoute } from "astro";
import { loadSite } from "../runtime";
import { rssFeeds, rssXml } from "../../seo/rss";

/** Feed do idioma principal (`/rss.xml`). Só injetado com o blog ligado. */
export const GET: APIRoute = async () => {
  const site = await loadSite();
  const feed = rssFeeds(site).find((f) => f.locale === site.settings.locales.default)!;
  return new Response(rssXml(feed, site), { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
};
