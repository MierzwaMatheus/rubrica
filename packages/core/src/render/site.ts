/**
 * Do snapshot do conteúdo às rotas do site: cada página, post e case em cada idioma
 * em que existe, com as props prontas para o tema. O Astro (getStaticPaths) e os
 * testes de tema consomem isto.
 */
import { localizedPath, pick, pickWithFallback, translatedLocales, type Locale } from "../i18n";
import type { BlockDefinition } from "../blocks/define";
import type { CollectionName, PageRecord, SiteSettings } from "../content/types";
import type { SiteSnapshot } from "../data/source";
import { enabledPlugins, type PluginDefinition } from "../plugins/contract";
import { resolveVariant, type Alternate, type RenderContext, type ResolvedSite, type ShellCollections, type ThemeDefinition } from "../theme/contract";
import { queryCollection, resolvePaths, resolvePost, resolveProject, resolveSeo, type CollectionPaths, type PostItem, type ProjectItem, type ResolvedSeo } from "./collections";
import { resolveFields, resolveHref, resolveImage, type ResolveOptions } from "./resolve";
import { defaultUiText } from "../i18n/ui-texts";

export interface ResolvedBlock {
  id: string;
  type: string;
  variant: string;
  fields: Record<string, unknown>;
  items: unknown[];
  headingLevel: 1 | 2;
  index: number;
  /** Quantos blocos visíveis a página tem. */
  total: number;
  interactive: boolean;
}

export interface ResolvedPage {
  id: string;
  path: string;
  title: string;
  seo: ResolvedSeo;
  blocks: ResolvedBlock[];
  /** O primeiro bloco não leva o h1: o núcleo põe um h1 (visualmente oculto) com o título. */
  needsHiddenH1: boolean;
}

interface RouteBase {
  /** Caminho com o prefixo do idioma. */
  url: string;
  locale: Locale;
  alternates: Alternate[];
  /** Data da última mudança, para o sitemap (AAAA-MM-DD). */
  lastmod?: string;
}

export type SiteRoute =
  | (RouteBase & { type: "page"; page: ResolvedPage })
  | (RouteBase & { type: "post"; post: PostItem; related: PostItem[] })
  | (RouteBase & { type: "case"; project: ProjectItem; related: ProjectItem[] });

export interface BuildInput {
  snapshot: SiteSnapshot;
  theme: ThemeDefinition;
  blocks: readonly BlockDefinition[];
  plugins: PluginDefinition[];
}

export interface BuiltSite {
  settings: SiteSettings;
  routes: SiteRoute[];
  plugins: Set<string>;
  paths: CollectionPaths;
  /** Contexto de renderização da rota (ou da 404 de um idioma). */
  context(locale: Locale, url: string, alternates?: Alternate[]): RenderContext;
  /** Projetos e posts do idioma, resumidos para a casca (`ShellProps.collections`). */
  collections(locale: Locale): ShellCollections;
}

function languageLabel(locale: Locale): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch {
    return locale;
  }
}

function day(ms: number | undefined): string | undefined {
  return ms ? new Date(ms).toISOString().slice(0, 10) : undefined;
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Texto de interface do tema: idioma exato, idioma base, inglês. */
function themeText(theme: ThemeDefinition, key: string, locale: Locale): string | undefined {
  const entry = theme.texts?.[key];
  if (!entry) return undefined;
  return entry[locale] ?? entry[locale.split("-")[0]!.toLowerCase()] ?? entry.en;
}

/** A home publicada tem algum hero visível com "Mostrar disponibilidade"? */
export function homeShowsAvailability(pages: readonly PageRecord[]): boolean {
  const home = pages.find((p) => p.published && p.path === "/");
  return !!home?.blocks.some((b) => b.visible && b.type === "hero" && b.fields.showAvailability === true);
}

export function buildSite(input: BuildInput): BuiltSite {
  const { snapshot, theme } = input;
  const settings = snapshot.site;
  const cfg = settings.locales;
  const plugins = enabledPlugins(input.plugins, settings.kind, settings.plugins);
  const paths: CollectionPaths = resolvePaths(settings.kind, settings.paths);
  const blockDefs = new Map(input.blocks.map((b) => [b.type, b]));
  const opts = (locale: Locale): ResolveOptions => ({ locale, locales: cfg, ...(settings.defaultPostCover?.url && { defaultPostCover: settings.defaultPostCover }) });

  const blockAllowed = (def: BlockDefinition | undefined): def is BlockDefinition =>
    !!def && (def.category === "comum" || def.category === settings.kind) && (!def.plugin || plugins.has(def.plugin));

  const collectionOn = (c: CollectionName) => {
    const owner = input.plugins.find((p) => p.collections?.includes(c));
    return !owner || plugins.has(owner.id);
  };

  function resolvePage(page: PageRecord, locale: Locale): ResolvedPage | undefined {
    const title = pick(page.title, locale);
    if (!title) return undefined;
    const o = opts(locale);
    const visible = page.blocks.filter((b) => b.visible && blockAllowed(blockDefs.get(b.type)));
    const firstIsHero = visible[0]?.type === "hero";
    const blocks = visible.map((b, index): ResolvedBlock => {
      const def = blockDefs.get(b.type)!;
      const query = b.source ?? def.source?.default;
      const items = query && collectionOn(query.collection) ? queryCollection(query, snapshot.collections[query.collection] as never[], o, paths) : [];
      const fields = resolveFields(def.fields, b.fields, o);
      return {
        id: b.id,
        type: b.type,
        variant: resolveVariant(theme, b.type, b.variant),
        fields,
        items,
        headingLevel: index === 0 && firstIsHero ? 1 : 2,
        index,
        total: visible.length,
        interactive: !!def.interactive && (def.islandWhen?.(fields, plugins) ?? true),
      };
    });
    return { id: page.id, path: page.path, title, seo: resolveSeo(page.seo, o), blocks, needsHiddenH1: !firstIsHero };
  }

  const alternatesFor = (available: Locale[], urlFor: (l: Locale) => string, current: Locale): Alternate[] =>
    available.map((l) => ({ locale: l, href: urlFor(l), label: languageLabel(l), current: l === current }));

  const routes: SiteRoute[] = [];

  for (const page of snapshot.pages) {
    if (!page.published) continue;
    const available = translatedLocales(page.title, cfg);
    for (const locale of available) {
      const resolved = resolvePage(page, locale);
      if (!resolved) continue;
      const url = localizedPath(page.path, locale, cfg);
      const r: SiteRoute = {
        type: "page",
        url,
        locale,
        page: resolved,
        alternates: alternatesFor(available, (l) => localizedPath(page.path, l, cfg), locale),
      };
      const lm = day(page.updatedAt);
      if (lm) r.lastmod = lm;
      routes.push(r);
    }
  }

  if (plugins.has("blog")) {
    for (const raw of snapshot.collections.posts) {
      const byLocale = new Map(cfg.locales.map((l) => [l, resolvePost(raw, opts(l), paths)] as const));
      const available = cfg.locales.filter((l) => byLocale.get(l));
      for (const locale of available) {
        const post = byLocale.get(locale)!;
        const related = queryCollection({ collection: "posts", sort: "recent" }, snapshot.collections.posts, opts(locale), paths)
          .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
          .slice(0, 3);
        const r: SiteRoute = {
          type: "post",
          url: post.url,
          locale,
          post,
          related,
          alternates: alternatesFor(available, (l) => byLocale.get(l)!.url, locale),
        };
        const lm = day(raw.updatedAt ?? raw.publishedAt);
        if (lm) r.lastmod = lm;
        routes.push(r);
      }
    }
  }

  if (plugins.has("portfolio")) {
    for (const raw of snapshot.collections.projects) {
      const byLocale = new Map(cfg.locales.map((l) => [l, resolveProject(raw, opts(l), paths)] as const));
      const available = cfg.locales.filter((l) => byLocale.get(l));
      for (const locale of available) {
        const project = byLocale.get(locale)!;
        const related = queryCollection({ collection: "projects", sort: "order" }, snapshot.collections.projects, opts(locale), paths)
          .filter((p) => p.id !== project.id)
          .slice(0, 3);
        const r: SiteRoute = {
          type: "case",
          url: project.url,
          locale,
          project,
          related,
          alternates: alternatesFor(available, (l) => byLocale.get(l)!.url, locale),
        };
        const lm = day(raw.updatedAt);
        if (lm) r.lastmod = lm;
        routes.push(r);
      }
    }
  }

  // Idiomas com post: só esses (e o principal) têm feed RSS próprio (seo/rss.ts).
  const postLocales = new Set(routes.flatMap((r) => (r.type === "post" ? [r.locale] : [])));
  const availability = homeShowsAvailability(snapshot.pages);

  const seen = new Set<string>();
  for (const r of routes) {
    if (seen.has(r.url)) throw new Error(`[rubrica] duas páginas no mesmo endereço: ${r.url}`);
    seen.add(r.url);
  }

  function context(locale: Locale, url: string, alternates: Alternate[] = []): RenderContext {
    const o = opts(locale);
    const t = (key: string, vars?: Record<string, string | number>) => {
      const text = pickWithFallback(snapshot.texts[key], locale, cfg) ?? themeText(theme, key, locale) ?? defaultUiText(key, locale, settings.kind) ?? key;
      return interpolate(text, vars);
    };
    const navigation = settings.navigation
      .map((n) => {
        const label = pick(n.label, locale);
        if (!label) return undefined;
        const { href } = resolveHref(n.href, o);
        const current = href === url || (href !== localizedPath("/", locale, cfg) && url.startsWith(`${href}/`));
        return { label, href, current };
      })
      .filter((n): n is NonNullable<typeof n> => !!n);

    const site: ResolvedSite = {
      kind: settings.kind,
      name: pickWithFallback(settings.name, locale, cfg) ?? "",
      url: settings.url.replace(/\/+$/, ""),
      navigation,
      social: settings.social,
      plugins: Object.fromEntries([...plugins].map((p) => [p, true])),
      colorMode: settings.appearance.colorMode,
      colorToggle: settings.appearance.colorToggle,
      availability,
    };
    const description = pickWithFallback(settings.description, locale, cfg);
    if (description) site.description = description;
    if (settings.organization) site.organization = settings.organization;
    if (settings.logo) {
      const logo = resolveImage(settings.logo, o);
      if (logo) {
        const resolved: NonNullable<ResolvedSite["logo"]> = { ...logo, alt: logo.alt || site.name };
        const dark = resolveImage(settings.logo.dark, o);
        if (dark) resolved.dark = { ...dark, alt: dark.alt || site.name };
        site.logo = resolved;
      }
    }
    if (settings.person) {
      const person: NonNullable<ResolvedSite["person"]> = { name: settings.person.name };
      const jobTitle = pickWithFallback(settings.person.jobTitle, locale, cfg);
      const photo = resolveImage(settings.person.photo, o);
      if (jobTitle) person.jobTitle = jobTitle;
      if (settings.person.email) person.email = settings.person.email;
      if (settings.person.phone) person.phone = settings.person.phone;
      if (settings.person.whatsapp) person.whatsapp = settings.person.whatsapp;
      if (photo) person.photo = photo;
      site.person = person;
    }

    const dateFormats: Record<string, Intl.DateTimeFormatOptions> = {
      long: { day: "numeric", month: "long", year: "numeric" },
      short: { day: "2-digit", month: "2-digit", year: "numeric" },
      month: { month: "short", year: "numeric" },
    };

    return {
      locale,
      locales: cfg,
      site,
      path: url,
      alternates,
      t,
      href: (path: string) => resolveHref(path, o).href,
      feeds: plugins.has("blog") ? { rss: localizedPath("/rss.xml", postLocales.has(locale) ? locale : cfg.default, cfg) } : {},
      formatDate: (iso, style = "long") => new Intl.DateTimeFormat(locale, { ...dateFormats[style], timeZone: "UTC" }).format(new Date(iso)),
    };
  }

  const summaries = new Map<Locale, ShellCollections>();
  function collections(locale: Locale): ShellCollections {
    let summary = summaries.get(locale);
    if (summary) return summary;
    const o = opts(locale);
    const projects = plugins.has("portfolio") ? queryCollection({ collection: "projects", sort: "order" }, snapshot.collections.projects, o, paths) : [];
    const posts = plugins.has("blog") ? queryCollection({ collection: "posts", sort: "recent" }, snapshot.collections.posts, o, paths) : [];
    summary = {
      projects: projects.map((p) => ({ id: p.id, title: p.title, url: p.url, ...(p.category && { category: p.category }), tags: p.tags, featured: p.featured })),
      posts: posts.map((p) => ({ id: p.id, title: p.title, url: p.url, publishedAt: p.publishedAt, tags: p.tags, featured: p.featured })),
    };
    summaries.set(locale, summary);
    return summary;
  }

  return { settings, routes, plugins, paths, context, collections };
}
