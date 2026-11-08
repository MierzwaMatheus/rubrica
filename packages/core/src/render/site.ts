/**
 * Do snapshot do conteúdo às rotas do site: cada página, post e case em cada idioma
 * em que existe, com as props prontas para o tema. O Astro (getStaticPaths) e os
 * testes de tema consomem isto.
 */
import { localizedPath, pick, pickWithFallback, translatedLocales, type Locale } from "../i18n";
import type { BlockDefinition } from "../blocks/define";
import type { CollectionName, CollectionQuery, PageRecord, SiteSettings } from "../content/types";
import type { SiteSnapshot } from "../data/source";
import { enabledPlugins, type PluginDefinition } from "../plugins/contract";
import { resolveVariant, type Alternate, type RenderContext, type ResolvedSite, type ShellCollections, type ThemeDefinition } from "../theme/contract";
import { queryCollection, resolvePaths, resolvePost, resolveProject, resolveSeo, type CollectionPaths, type PostItem, type ProjectItem, type ResolvedSeo } from "./collections";
import { resolveFields, resolveHref, resolveImage, resolveLink, type ResolveOptions } from "./resolve";
import { defaultUiText } from "../i18n/ui-texts";
import { announcementActive, siteWhatsAppNumber, whatsAppMessage, whatsAppUrl } from "./sitewide";

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
  /** Instante do build (epoch ms), para o período da faixa de aviso. Padrão: agora. */
  now?: number;
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

/** Id da janela de contato (`ResolvedSite.contactDialog`). */
export const CONTACT_DIALOG_ID = "rb-contato-janela";

/**
 * O bloco `contato` que a janela de contato usa no idioma: o da home, senão o da primeira
 * página que tiver um, senão um bloco padrão (assistente em etapas). Assim a janela existe
 * mesmo num site sem seção de contato: os botões que apontam para o contato a abrem.
 */
export function contactBlock(routes: readonly SiteRoute[], locale: Locale): ResolvedBlock {
  const pages = routes.filter((r): r is Extract<SiteRoute, { type: "page" }> => r.type === "page" && r.locale === locale);
  const home = pages.find((r) => r.page.path === "/");
  for (const r of home ? [home, ...pages] : pages) {
    const block = r.page.blocks.find((b) => b.type === "contato" && b.interactive);
    if (block) return block;
  }
  return { id: CONTACT_DIALOG_ID, type: "contato", variant: "default", fields: { mode: "wizard" }, items: [], headingLevel: 2, index: 0, total: 1, interactive: true };
}

export function buildSite(input: BuildInput): BuiltSite {
  const { snapshot, theme } = input;
  const settings = snapshot.site;
  const cfg = settings.locales;
  const plugins = enabledPlugins(input.plugins, settings.kind, settings.plugins);
  const paths: CollectionPaths = resolvePaths(settings.kind, settings.paths);
  const blockDefs = new Map(input.blocks.map((b) => [b.type, b]));
  const whatsappNumber = siteWhatsAppNumber(settings);
  // Janela de contato: o tema pede e o plugin de contato está ligado (não depende de um bloco).
  const contactDialog = theme.contactDialog && plugins.has("contact-wizard") ? CONTACT_DIALOG_ID : undefined;
  const opts = (locale: Locale): ResolveOptions => {
    const message = whatsAppMessage(settings, locale);
    return {
      locale,
      locales: cfg,
      ...(settings.defaultPostCover?.url && { defaultPostCover: settings.defaultPostCover }),
      ...(whatsappNumber && { whatsapp: { number: whatsappNumber, ...(message && { message }) } }),
      ...(contactDialog && { contactDialog }),
    };
  };
  // O período do aviso vale no instante do build: muda só na próxima publicação.
  const announcementOn = announcementActive(settings.announcement, input.now ?? Date.now());

  const kindAllows = (def: BlockDefinition | undefined): def is BlockDefinition =>
    !!def && (def.category === "comum" || def.category === settings.kind);

  const collectionOn = (c: CollectionName) => {
    const owner = input.plugins.find((p) => p.collections?.includes(c));
    return !owner || plugins.has(owner.id);
  };

  /** Bloco cujo plugin (ou o dono da coleção que ele lista) está desligado. */
  const blockOff = (def: BlockDefinition, query: CollectionQuery | undefined) =>
    (!!def.plugin && !plugins.has(def.plugin)) || (!!query && !collectionOn(query.collection));

  const blockAllowed = (def: BlockDefinition | undefined, query?: CollectionQuery): def is BlockDefinition =>
    kindAllows(def) && !blockOff(def, query);

  const norm = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path) || "/";

  /** Caminhos de página que só existem com o plugin dono ligado: plugins desligados do tipo. */
  const offPaths = new Set<string>();
  for (const p of input.plugins) {
    if (plugins.has(p.id)) continue;
    for (const path of p.pages ?? []) offPaths.add(norm(path));
    if (p.collections?.includes("posts")) offPaths.add(norm(paths.posts));
    if (p.collections?.includes("projects")) offPaths.add(norm(paths.projects));
  }

  /**
   * A página perde a razão de existir quando é a listagem de um plugin desligado ou quando
   * todos os seus blocos visíveis eram de plugins desligados. Com sobra (um bloco de outro
   * plugin ou conteúdo comum), a página fica e só o bloco some.
   */
  function pageOff(page: PageRecord): boolean {
    if (page.path === "/") return false;
    if (offPaths.has(norm(page.path))) return true;
    const visible = page.blocks.filter((b) => b.visible && kindAllows(blockDefs.get(b.type)));
    if (!visible.length) return false;
    return visible.every((b) => {
      const def = blockDefs.get(b.type)!;
      return blockOff(def, b.source ?? def.source?.default);
    });
  }

  function resolvePage(page: PageRecord, locale: Locale): ResolvedPage | undefined {
    const title = pick(page.title, locale);
    if (!title) return undefined;
    const o = opts(locale);
    const prepared = page.blocks
      .filter((b) => b.visible)
      .flatMap((b) => {
        const def = blockDefs.get(b.type);
        const query = b.source ?? def?.source?.default;
        if (!blockAllowed(def, query)) return [];
        const items = query ? queryCollection(query, snapshot.collections[query.collection] as never[], o, paths) : [];
        const fields = resolveFields(def.fields, b.fields, o);
        const interactive = !!def.interactive && (def.islandWhen?.(fields, plugins) ?? true);
        return [{ b, def, query, items, fields, interactive }];
      });
    // Bloco de coleção sem itens não vira título solto: some (um convite interativo, como o de
    // depoimento, é conteúdo). Se sobrasse página vazia, os blocos ficam e o tema mostra o vazio padrão.
    const withContent = prepared.filter((x) => !x.query || x.items.length > 0 || x.interactive);
    const visible = withContent.length ? withContent : prepared;
    const firstIsHero = visible[0]?.b.type === "hero";
    const blocks = visible.map(({ b, def, items, fields, interactive }, index): ResolvedBlock => ({
      id: b.id,
      type: b.type,
      variant: resolveVariant(theme, b.type, b.variant),
      fields,
      items,
      headingLevel: index === 0 && firstIsHero ? 1 : 2,
      index,
      total: visible.length,
      interactive,
    }));
    return { id: page.id, path: page.path, title, seo: resolveSeo(page.seo, o), blocks, needsHiddenH1: !firstIsHero };
  }

  /** Caminhos que não viram página por causa de plugin desligado (o menu não aponta para eles). */
  const hiddenPaths = new Set(offPaths);
  for (const page of snapshot.pages) if (pageOff(page)) hiddenPaths.add(norm(page.path));

  const alternatesFor = (available: Locale[], urlFor: (l: Locale) => string, current: Locale): Alternate[] =>
    available.map((l) => ({ locale: l, href: urlFor(l), label: languageLabel(l), current: l === current }));

  const routes: SiteRoute[] = [];

  for (const page of snapshot.pages) {
    if (!page.published || pageOff(page)) continue;
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
        if (n.href.startsWith("/") && hiddenPaths.has(norm(n.href.split(/[?#]/)[0]!))) return undefined;
        const { href } = resolveHref(n.href, o);
        if (!href) return undefined;
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
    if (whatsappNumber && settings.whatsapp) {
      const message = whatsAppMessage(settings, locale);
      const label = pick(settings.whatsapp.label, locale);
      site.whatsapp = { number: whatsappNumber, href: whatsAppUrl(whatsappNumber, message), floating: settings.whatsapp.floating, ...(label && { label }) };
    }
    if (contactDialog) site.contactDialog = contactDialog;
    if (announcementOn && settings.announcement) {
      // Sem texto no idioma, a faixa não existe nele (decisão 28): nada de cair no principal.
      const text = pick(settings.announcement.text, locale);
      if (text) {
        const link = resolveLink(settings.announcement.link, o);
        site.announcement = { text, tone: settings.announcement.tone ?? "info", ...(link && { link }) };
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
