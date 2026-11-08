import type { APIRoute } from "astro";
import { activeTheme, loadSite } from "../runtime";
import { webManifest } from "../../seo/site-head";

/** Manifest do site (nome, cores e ícones das configurações). */
export const GET: APIRoute = async () => {
  const site = await loadSite();
  return new Response(JSON.stringify(webManifest(site.settings, activeTheme), null, 2), { headers: { "content-type": "application/manifest+json; charset=utf-8" } });
};
