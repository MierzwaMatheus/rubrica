/**
 * <head> de cada página: título, descrição, canonical, hreflang, Open Graph,
 * Twitter e JSON-LD. É do núcleo, não do tema (RFC v2: "Temas e o contrato").
 */
import { localizedPath } from "../i18n";
import type { RenderContext } from "../theme/contract";
import type { SiteRoute } from "../render/site";
import type { FaqItem } from "../render/collections";
import { stripHtml, truncate } from "../render/text";
import type { SiteSettings } from "../content/types";
import { resolveImage } from "../render/resolve";
import { siteHeadTags, type SiteHeadOptions } from "./site-head";

export interface HeadTag {
  tag: "title" | "meta" | "link" | "script";
  attrs?: Record<string, string>;
  content?: string;
}

const absolute = (site: string, path: string) => (/^https?:\/\//.test(path) ? path : `${site}${path.startsWith("/") ? "" : "/"}${path}`);

function ogLocale(locale: string): string {
  const [lang, region] = locale.split("-");
  const regions: Record<string, string> = { pt: "BR", en: "US", es: "ES", fr: "FR", de: "DE", it: "IT" };
  return `${lang!.toLowerCase()}_${(region ?? regions[lang!.toLowerCase()] ?? lang!).toUpperCase()}`;
}

/** JSON dentro de <script>: sem "</script>" nem "<!--". */
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function identityJsonLd(settings: SiteSettings, ctx: RenderContext): Record<string, unknown> {
  const site = ctx.site;
  const sameAs = site.social.map((s) => s.url);
  if (settings.kind === "pessoal" && site.person) {
    return {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.person.name,
      ...(site.person.jobTitle && { jobTitle: site.person.jobTitle }),
      ...(site.person.photo && { image: absolute(site.url, site.person.photo.src) }),
      url: site.url,
      ...(sameAs.length && { sameAs }),
    };
  }
  const org = site.organization;
  return {
    "@type": org?.schemaType ?? "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    ...(org?.legalName && { legalName: org.legalName }),
    ...(org?.taxId && { taxID: org.taxId }),
    ...(org?.email && { email: org.email }),
    ...(org?.phone && { telephone: org.phone }),
    ...(org?.address && {
      address: {
        "@type": "PostalAddress",
        ...(org.address.street && { streetAddress: org.address.street }),
        ...(org.address.locality && { addressLocality: org.address.locality }),
        ...(org.address.region && { addressRegion: org.address.region }),
        ...(org.address.postalCode && { postalCode: org.address.postalCode }),
        ...(org.address.country && { addressCountry: org.address.country }),
      },
    }),
    ...(org?.openingHours?.length && {
      openingHoursSpecification: org.openingHours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    }),
    ...(sameAs.length && { sameAs }),
  };
}

/** Página de uma rota do app (proposta, checkout): fora do sitemap e com noindex. */
export interface AppHeadRoute {
  type: "app";
  url: string;
  locale: string;
  title: string;
}

export type HeadRoute = SiteRoute | { type: "notFound"; url: string; locale: string } | AppHeadRoute;

export function buildHead(
  route: HeadRoute,
  settings: SiteSettings,
  ctx: RenderContext,
  options: SiteHeadOptions = {},
): HeadTag[] {
  const site = ctx.site;
  const tags: HeadTag[] = [];
  const meta = (attrs: Record<string, string>) => tags.push({ tag: "meta", attrs });

  let title: string;
  let description = site.description ?? "";
  let image = resolveImage(settings.ogImage, { locale: ctx.locale, locales: ctx.locales });
  let noindex = false;
  let ogType = "website";
  const jsonLd: Record<string, unknown>[] = [];

  if (route.type === "notFound") {
    title = `${ctx.t("notFound.title")} | ${site.name}`;
    noindex = true;
  } else if (route.type === "app") {
    title = `${route.title} | ${site.name}`;
    noindex = true;
  } else if (route.type === "page") {
    const { page } = route;
    const isHome = page.path === "/";
    title = page.seo.title ?? (isHome ? site.name : `${page.title} | ${site.name}`);
    description = page.seo.description ?? description;
    image = page.seo.image ?? image;
    noindex = !!page.seo.noindex;
    if (isHome) {
      jsonLd.push({ "@type": "WebSite", "@id": `${site.url}/#website`, name: site.name, url: site.url, inLanguage: ctx.locale });
      jsonLd.push(identityJsonLd(settings, ctx));
    }
    const faqItems = page.blocks.filter((b) => b.type === "faq").flatMap((b) => b.items as FaqItem[]);
    if (faqItems.length) {
      jsonLd.push({
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answer) } })),
      });
    }
  } else if (route.type === "post") {
    const { post } = route;
    title = post.seo.title ?? `${post.title} | ${site.name}`;
    description = post.seo.description ?? post.excerpt ?? truncate(stripHtml(post.content), 160);
    image = post.seo.image ?? post.cover ?? image;
    ogType = "article";
    jsonLd.push({
      "@type": "BlogPosting",
      headline: post.title,
      description,
      datePublished: post.publishedAt,
      ...(post.updatedAt && { dateModified: post.updatedAt }),
      ...(image && { image: absolute(site.url, image.src) }),
      inLanguage: ctx.locale,
      mainEntityOfPage: absolute(site.url, route.url),
      author: settings.kind === "pessoal" && site.person ? { "@id": `${site.url}/#person` } : { "@id": `${site.url}/#organization` },
      ...(post.tags.length && { keywords: post.tags.join(", ") }),
    });
  } else {
    const { project } = route;
    title = project.seo.title ?? `${project.title} | ${site.name}`;
    description = project.seo.description ?? project.summary ?? description;
    image = project.seo.image ?? project.cover ?? image;
    ogType = "article";
    jsonLd.push({
      "@type": "CreativeWork",
      name: project.title,
      ...(description && { description }),
      ...(image && { image: absolute(site.url, image.src) }),
      url: absolute(site.url, route.url),
      inLanguage: ctx.locale,
    });
  }

  tags.push({ tag: "title", content: title });
  if (description) meta({ name: "description", content: description });
  if (noindex) meta({ name: "robots", content: route.type === "app" ? "noindex, nofollow" : "noindex" });

  if ("alternates" in route && !noindex) {
    tags.push({ tag: "link", attrs: { rel: "canonical", href: absolute(site.url, route.url) } });
    if (route.alternates.length > 1) {
      for (const alt of route.alternates) {
        tags.push({ tag: "link", attrs: { rel: "alternate", hreflang: alt.locale, href: absolute(site.url, alt.href) } });
      }
      const principal = route.alternates.find((a) => a.locale === ctx.locales.default);
      if (principal) tags.push({ tag: "link", attrs: { rel: "alternate", hreflang: "x-default", href: absolute(site.url, principal.href) } });
    }
  }

  const url = absolute(site.url, "alternates" in route ? route.url : localizedPath("/", ctx.locale, ctx.locales));
  meta({ property: "og:type", content: ogType });
  meta({ property: "og:title", content: title });
  if (description) meta({ property: "og:description", content: description });
  meta({ property: "og:url", content: url });
  meta({ property: "og:site_name", content: site.name });
  meta({ property: "og:locale", content: ogLocale(ctx.locale) });
  if ("alternates" in route) {
    for (const alt of route.alternates) if (!alt.current) meta({ property: "og:locale:alternate", content: ogLocale(alt.locale) });
  }
  if (image) {
    meta({ property: "og:image", content: absolute(site.url, image.src) });
    if (image.alt) meta({ property: "og:image:alt", content: image.alt });
  }
  meta({ name: "twitter:card", content: image ? "summary_large_image" : "summary" });
  if (settings.twitterHandle) meta({ name: "twitter:site", content: `@${settings.twitterHandle.replace(/^@/, "")}` });

  tags.push(...siteHeadTags(settings, ctx, options));

  if (jsonLd.length) {
    tags.push({
      tag: "script",
      attrs: { type: "application/ld+json" },
      content: safeJson(jsonLd.length === 1 ? { "@context": "https://schema.org", ...jsonLd[0] } : { "@context": "https://schema.org", "@graph": jsonLd }),
    });
  }
  return tags;
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeText(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderHeadTags(tags: HeadTag[]): string {
  return tags
    .map(({ tag, attrs = {}, content }) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
        .join("");
      if (tag === "meta" || tag === "link") return `<${tag}${a}>`;
      // JSON-LD já vem escapado por safeJson; título é texto.
      return `<${tag}${a}>${tag === "script" ? (content ?? "") : escapeText(content ?? "")}</${tag}>`;
    })
    .join("\n");
}
