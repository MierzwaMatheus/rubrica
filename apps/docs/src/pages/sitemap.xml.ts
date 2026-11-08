import type { APIRoute } from "astro";
import { DOCS } from "../lib/docsContent";
import { sitemapPages, sitemapXml } from "../lib/seo";

export const GET: APIRoute = ({ site }) =>
  new Response(sitemapXml(site!, sitemapPages(DOCS.map((d) => d.slug))), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
