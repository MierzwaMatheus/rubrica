/** Paridade com a v1: capa padrão de post, ícones e manifest, theme-color, RSS e analytics. */
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell } from "../src/components";
import { buildHead } from "../src/seo/head";
import type { SiteSnapshot } from "../src/data/source";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const fixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/pessoal", import.meta.url));

async function built(edit: (s: SiteSnapshot) => void = () => {}) {
  const snapshot = await fixtureSource(fixtures).load();
  edit(snapshot);
  return buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
}

const headOf = (s: Awaited<ReturnType<typeof built>>, url: string, options?: Parameters<typeof buildHead>[3]) => {
  const route = s.routes.find((r) => r.url === url)!;
  return buildHead(route, s.settings, s.context(route.locale, route.url, route.alternates), options);
};

describe("capa padrão de post", () => {
  it("post sem capa recebe a das configurações (marcada) e ela vira o og:image; com capa, fica a dele", async () => {
    const s = await built((snap) => (snap.site.defaultPostCover = { url: "/img/capa-padrao.png", width: 1200, height: 630, alt: { "pt-BR": "Marca" } }));
    const route = s.routes.find((r) => r.url === "/blog/so-portugues");
    if (route?.type !== "post") throw new Error("rota ausente");
    expect(route.post.cover).toEqual({ src: "/img/capa-padrao.png", alt: "Marca", width: 1200, height: 630 });
    expect(route.post.defaultCover).toBe(true);
    expect(headOf(s, "/blog/so-portugues").find((t) => t.attrs?.property === "og:image")?.attrs?.content).toBe("https://demo.userubrica.dev/img/capa-padrao.png");

    const own = s.routes.find((r) => r.url === "/blog/pesquisa-com-usuarios");
    if (own?.type !== "post") throw new Error("rota ausente");
    expect(own.post.cover?.src).not.toBe("/img/capa-padrao.png");
    expect(own.post.defaultCover).toBeUndefined();

    // Os blocos de lista recebem os itens já com a capa padrão.
    const home = s.routes.find((r) => r.url === "/");
    if (home?.type !== "page") throw new Error("rota ausente");
    const items = home.page.blocks.find((b) => b.type === "posts-recentes")!.items as { slug: string; cover?: { src: string } }[];
    expect(items.find((p) => p.slug === "so-portugues")?.cover?.src).toBe("/img/capa-padrao.png");
  });

  it("sem capa padrão, post sem capa continua sem capa", async () => {
    const route = (await built()).routes.find((r) => r.url === "/blog/so-portugues");
    if (route?.type !== "post") throw new Error("rota ausente");
    expect(route.post.cover).toBeUndefined();
  });
});

import { manifestIcons, siteHeadTags, themeColors, webManifest, MANIFEST_PATH } from "../src/seo/site-head";
import { rssFeeds, rssXml } from "../src/seo/rss";
import { analyticsScriptUrl, resolveAnalytics } from "../src/seo/analytics";
import { renderHeadTags } from "../src/seo/head";

describe("ícones, manifest e theme-color", () => {
  it("favicon PNG antes do SVG, apple-touch-icon e manifest só com ícone de manifest", async () => {
    const s = await built((snap) => {
      snap.site.icons = {
        favicon: { url: "/favicon-32.png", width: 32, height: 32 },
        svg: { url: "https://x.convex.cloud/api/storage/abc" },
        apple: { url: "/apple.png" },
        icon192: { url: "/icon-192.png" },
        maskable: { url: "/maskable.png", width: 512, height: 512 },
      };
    });
    const links = headOf(s, "/").filter((t) => t.tag === "link" && /icon|manifest/.test(t.attrs!.rel!)).map((t) => t.attrs);
    expect(links).toEqual([
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", type: "image/svg+xml", href: "https://x.convex.cloud/api/storage/abc" },
      { rel: "apple-touch-icon", href: "/apple.png", sizes: "180x180" },
      { rel: "manifest", href: MANIFEST_PATH },
    ]);
    expect(manifestIcons(s.settings)).toEqual([
      { src: "https://x.convex.cloud/api/storage/abc", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ]);
    // Só favicon: sem manifest.
    const only = await built((snap) => (snap.site.icons = { favicon: { url: "/favicon.ico" } }));
    expect(headOf(only, "/").some((t) => t.attrs?.rel === "manifest")).toBe(false);
    expect(headOf(only, "/").find((t) => t.attrs?.rel === "icon")?.attrs).toEqual({ rel: "icon", href: "/favicon.ico", type: "image/x-icon" });
  });

  it("theme-color: a das configurações, senão o fundo do esquema; por modo no automático", async () => {
    const theme = { scheme: "neon" };
    const dark = await built((snap) => (snap.site.appearance = { ...snap.site.appearance, colorMode: "dark", scheme: undefined }));
    expect(themeColors(dark.settings, theme)).toEqual({ light: "#F7F7F8", dark: "#141414" });
    expect(headOf(dark, "/", { theme }).filter((t) => t.attrs?.name === "theme-color").map((t) => t.attrs)).toEqual([{ name: "theme-color", content: "#141414" }]);

    const system = await built((snap) => {
      snap.site.appearance = { ...snap.site.appearance, colorMode: "system" };
      snap.site.themeColor = { light: "#ffffff", dark: "nao-e-cor" };
    });
    expect(headOf(system, "/", { theme }).filter((t) => t.attrs?.name === "theme-color").map((t) => t.attrs)).toEqual([
      { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#ffffff" },
      { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#141414" },
    ]);
  });

  it("manifest com nome, idioma, cores e ícones", async () => {
    const s = await built((snap) => {
      snap.site.appearance = { ...snap.site.appearance, colorMode: "light" };
      snap.site.themeColor = { light: "#fafafa" };
      snap.site.icons = { icon512: { url: "/icon-512.png" } };
    });
    expect(webManifest(s.settings, { scheme: "neon" })).toMatchObject({
      name: "Ana Souza",
      lang: "pt-BR",
      start_url: "/",
      display: "standalone",
      theme_color: "#fafafa",
      background_color: "#fafafa",
      icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
  });
});

describe("RSS", () => {
  it("um feed por idioma com post traduzido; o principal sempre; título e descrição configuráveis", async () => {
    const s = await built((snap) => (snap.site.rss = { title: { "pt-BR": "Blog da Ana", en: "Ana's blog" }, description: { en: "Notes" } }));
    const feeds = rssFeeds(s);
    expect(feeds.map((f) => [f.locale, f.path, f.title])).toEqual([
      ["pt-BR", "/rss.xml", "Blog da Ana"],
      ["en", "/en/rss.xml", "Ana's blog"],
    ]);
    expect(feeds[1]!.posts.map((p) => p.slug)).toEqual(["pesquisa-com-usuarios"]);
    expect(feeds[1]!.description).toBe("Notes");
    expect(feeds[0]!.posts.length).toBe(3);
    // Mais novo primeiro.
    const dates = feeds[0]!.posts.map((p) => p.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("XML válido, com itens absolutos, CDATA protegido e caracteres escapados", async () => {
    const s = await built((snap) => {
      const post = snap.collections.posts.find((p) => p.slug === "so-portugues")!;
      post.title = { "pt-BR": "A & B <c>" };
      post.content = { "pt-BR": "<p>fim ]]> do bloco</p>" };
    });
    const feed = rssFeeds(s)[0]!;
    const out = rssXml(feed, s);
    expect(out).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
    expect(out).toContain("<title>A &amp; B &lt;c&gt;</title>");
    expect(out).toContain("<link>https://demo.userubrica.dev/blog/so-portugues</link>");
    expect(out).toContain('<atom:link href="https://demo.userubrica.dev/rss.xml" rel="self" type="application/rss+xml"/>');
    expect(out).toContain("<![CDATA[<p>fim ]]]]><![CDATA[> do bloco</p>]]>");
    expect(out).toContain("<language>pt-BR</language>");
    // O mesmo conteúdo gera o mesmo feed.
    expect(rssXml(feed, s)).toBe(out);
  });

  it("<head> leva o alternate do feed do idioma; sem feed no idioma, nada", async () => {
    const s = await built();
    const feeds = rssFeeds(s).map((f) => ({ locale: f.locale, href: `https://demo.userubrica.dev${f.path}`, title: f.title }));
    const pt = headOf(s, "/", { feeds }).find((t) => t.attrs?.type === "application/rss+xml");
    expect(pt?.attrs).toEqual({ rel: "alternate", type: "application/rss+xml", title: "Ana Souza", href: "https://demo.userubrica.dev/rss.xml" });
    expect(headOf(s, "/en", { feeds }).find((t) => t.attrs?.type === "application/rss+xml")?.attrs?.href).toBe("https://demo.userubrica.dev/en/rss.xml");
    expect(headOf(s, "/en", { feeds: feeds.slice(0, 1) }).some((t) => t.attrs?.type === "application/rss+xml")).toBe(false);
  });

  it("blog desligado: sem feed", async () => {
    expect(rssFeeds(await built((snap) => (snap.site.plugins = { ...snap.site.plugins, blog: false })))).toEqual([]);
  });
});

describe("analytics (Umami)", () => {
  it("só https; configurações vencem as variáveis; nomes da v1 aceitos", () => {
    expect(analyticsScriptUrl("http://x.com/s.js")).toBeUndefined();
    expect(analyticsScriptUrl("javascript:alert(1)")).toBeUndefined();
    expect(analyticsScriptUrl(" https://cloud.umami.is/script.js ")).toBe("https://cloud.umami.is/script.js");
    expect(resolveAnalytics({}, {})).toBeUndefined();
    expect(resolveAnalytics({ analytics: { scriptUrl: "https://a.com/s.js" } }, {})).toBeUndefined();
    expect(resolveAnalytics({ analytics: { scriptUrl: "https://a.com/s.js", websiteId: "id-1" } }, { PUBLIC_UMAMI_WEBSITE_ID: "outro" })).toEqual({
      src: "https://a.com/s.js",
      websiteId: "id-1",
      origin: "https://a.com",
    });
    expect(resolveAnalytics({}, { PUBLIC_UMAMI_SCRIPT_URL: "https://u.example/script.js", PUBLIC_UMAMI_WEBSITE_ID: "abc" })?.origin).toBe("https://u.example");
    expect(resolveAnalytics({}, { VITE_ANALYTICS_ENDPOINT: "https://stats.x.dev/", VITE_ANALYTICS_WEBSITE_ID: "abc" })?.src).toBe("https://stats.x.dev/umami");
    expect(resolveAnalytics({}, { PUBLIC_UMAMI_SCRIPT_URL: "https://u.example/s.js", PUBLIC_UMAMI_WEBSITE_ID: 'a"><script>' })).toBeUndefined();
  });

  it("script defer marcado no <head> só quando configurado", async () => {
    const s = await built();
    const analytics = resolveAnalytics({}, { PUBLIC_UMAMI_SCRIPT_URL: "https://cloud.umami.is/script.js", PUBLIC_UMAMI_WEBSITE_ID: "abc-123" })!;
    const html = renderHeadTags(headOf(s, "/", { analytics }));
    expect(html).toContain('<script defer="" src="https://cloud.umami.is/script.js" data-website-id="abc-123" data-rb-analytics=""></script>');
    expect(renderHeadTags(headOf(s, "/"))).not.toContain("data-rb-analytics");
    const route = s.routes.find((r) => r.url === "/")!;
    expect(siteHeadTags(s.settings, s.context(route.locale, route.url)).some((t) => t.tag === "script")).toBe(false);
  });
});
