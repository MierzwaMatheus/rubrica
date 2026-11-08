/**
 * Feed RSS do blog (paridade com `scripts/generate-rss-feed.ts` da v1): `/rss.xml` no
 * idioma principal e `/<prefixo>/rss.xml` nos outros, cada um só com os posts que
 * existem naquele idioma (decisão 28). Um idioma sem post não tem feed, menos o
 * principal (o `/rss.xml` existe sempre que o blog está ligado).
 *
 * Título e descrição: `SiteSettings.rss`, senão o nome e a descrição do site.
 */
import { localizedPath, pick, pickWithFallback, type Locale } from "../i18n";
import type { BuiltSite } from "../render/site";
import type { PostItem } from "../render/collections";
import { stripHtml, truncate } from "../render/text";

export interface RssFeed {
  locale: Locale;
  /** Caminho do feed, com o prefixo do idioma. */
  path: string;
  title: string;
  description: string;
  /** Home do idioma (absoluta). */
  link: string;
  posts: PostItem[];
}

const absolute = (site: string, path: string) => (/^https?:\/\//.test(path) ? path : `${site}${path.startsWith("/") ? "" : "/"}${path}`);

const xml = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Caracteres de controle não cabem em XML 1.0.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/** HTML dentro de CDATA: "]]>" fecharia o bloco antes da hora. */
const cdata = (html: string) => `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** Caminho do feed de um idioma: `/rss.xml` no principal, `/<prefixo>/rss.xml` nos outros. */
export function rssPath(locale: Locale, site: Pick<BuiltSite, "settings">): string {
  return localizedPath("/rss.xml", locale, site.settings.locales);
}

/** Feeds do site: vazio com o blog desligado. */
export function rssFeeds(site: Pick<BuiltSite, "settings" | "routes" | "plugins">): RssFeed[] {
  if (!site.plugins.has("blog")) return [];
  const { settings } = site;
  const cfg = settings.locales;
  const base = settings.url.replace(/\/+$/, "");
  const feeds: RssFeed[] = [];
  for (const locale of cfg.locales) {
    const posts = site.routes
      .flatMap((r) => (r.type === "post" && r.locale === locale ? [r.post] : []))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (!posts.length && locale !== cfg.default) continue;
    const name = pickWithFallback(settings.name, locale, cfg) ?? "";
    feeds.push({
      locale,
      path: rssPath(locale, site),
      title: pick(settings.rss?.title, locale) ?? name,
      description: pick(settings.rss?.description, locale) ?? pickWithFallback(settings.description, locale, cfg) ?? name,
      link: absolute(base, localizedPath("/", locale, cfg)),
      posts,
    });
  }
  return feeds;
}

const rfc822 = (iso: string) => new Date(iso).toUTCString();

/** XML do feed (RSS 2.0 com `content:encoded`, `dc:creator` e `media:content`). */
export function rssXml(feed: RssFeed, site: Pick<BuiltSite, "settings">): string {
  const { settings } = site;
  const base = settings.url.replace(/\/+$/, "");
  const author = settings.person?.name ?? pickWithFallback(settings.name, feed.locale, settings.locales) ?? "";
  // Data do feed: a do post mais recente (o mesmo conteúdo gera o mesmo arquivo).
  const latest = feed.posts.map((p) => p.updatedAt ?? p.publishedAt).sort().at(-1);
  const items = feed.posts.map((post) => {
    const url = absolute(base, post.url);
    const description = post.excerpt ?? truncate(stripHtml(post.content), 300);
    const lines = [
      `<title>${xml(post.title)}</title>`,
      `<link>${xml(url)}</link>`,
      `<guid isPermaLink="true">${xml(url)}</guid>`,
      `<description>${xml(description)}</description>`,
      `<content:encoded>${cdata(post.content)}</content:encoded>`,
      `<pubDate>${rfc822(post.publishedAt)}</pubDate>`,
      ...(author ? [`<dc:creator>${xml(author)}</dc:creator>`] : []),
      ...post.tags.map((t) => `<category>${xml(t)}</category>`),
      ...(post.cover ? [`<media:content url="${xml(absolute(base, post.cover.src))}" medium="image"/>`] : []),
    ];
    return `    <item>\n      ${lines.join("\n      ")}\n    </item>`;
  });
  const channel = [
    `<title>${xml(feed.title)}</title>`,
    `<link>${xml(feed.link)}</link>`,
    `<description>${xml(feed.description)}</description>`,
    `<language>${xml(feed.locale)}</language>`,
    ...(latest ? [`<lastBuildDate>${rfc822(latest)}</lastBuildDate>`] : []),
    `<atom:link href="${xml(absolute(base, feed.path))}" rel="self" type="application/rss+xml"/>`,
  ];
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">`,
    `  <channel>`,
    `    ${channel.join("\n    ")}`,
    ...items,
    `  </channel>`,
    `</rss>`,
    ``,
  ].join("\n");
}
