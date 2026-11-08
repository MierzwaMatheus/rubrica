import type { APIRoute, GetStaticPaths } from "astro";
import { loadSite } from "../runtime";
import { rssFeeds, rssXml, type RssFeed } from "../../seo/rss";

/** Feeds dos outros idiomas (`/<prefixo>/rss.xml`), só dos que têm post traduzido. */
export const getStaticPaths = (async () => {
  const site = await loadSite();
  return rssFeeds(site)
    .filter((f) => f.locale !== site.settings.locales.default)
    .map((feed) => ({ params: { prefix: feed.path.split("/")[1]! }, props: { feed } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const site = await loadSite();
  return new Response(rssXml((props as { feed: RssFeed }).feed, site), { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
};
