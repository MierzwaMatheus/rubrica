/**
 * Itens das coleções resolvidos no idioma, como os temas recebem.
 * Item sem o texto principal traduzido não existe no idioma (decisão 28).
 */
import { pick, localizedPath } from "../i18n";
import type { ResolvedImage, ResolvedLink } from "../blocks/fields";
import type {
  CollectionName,
  CollectionQuery,
  PricePeriod,
  RawCollections,
  SiteKind,
  RawPlan,
  RawPost,
  RawProject,
  ResumeKind,
  SeoFields,
} from "../content/types";
import { resolveImage, resolveLink, resolveText, type ResolveOptions } from "./resolve";
import { readingMinutes } from "./text";

export interface ResolvedSeo {
  title?: string;
  description?: string;
  image?: ResolvedImage;
  noindex?: boolean;
}

export interface PostItem {
  id: string;
  slug: string;
  url: string;
  title: string;
  excerpt?: string;
  content: string;
  /** Capa do post; sem capa própria, a capa padrão das configurações (`defaultCover`). */
  cover?: ResolvedImage;
  /** A capa é a padrão do site, não a do post (o tema pode desenhá-la de outro jeito). */
  defaultCover?: true;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  author?: string;
  /** Marcado como destaque no painel (o tema pode dar mais peso ao post). */
  featured: boolean;
  seo: ResolvedSeo;
}

export interface CaseSectionItem {
  title: string;
  body: string;
  image?: ResolvedImage;
}

/** Um número do case no idioma; `icon` é o nome do Lucide que o conteúdo deu. */
export interface CaseMetricItem {
  value: string;
  label: string;
  icon?: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  url: string;
  title: string;
  summary?: string;
  content?: string;
  sections: CaseSectionItem[];
  cover?: ResolvedImage;
  gallery: ResolvedImage[];
  client?: string;
  year?: number;
  role?: string;
  /** Categoria do projeto no idioma (uma só; para agrupar ou filtrar o portfólio). */
  category?: string;
  links: ResolvedLink[];
  /**
   * Número de destaque do case (card); só existe com o rótulo no idioma. Sem o campo
   * próprio, é o primeiro de `metrics`.
   */
  metric?: { value: string; label: string };
  /** Números do case ("Resultados em números"), os que têm rótulo no idioma. */
  metrics: CaseMetricItem[];
  tags: string[];
  featured: boolean;
  seo: ResolvedSeo;
}

export interface ServiceItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  priceLabel?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: ResolvedImage;
  /** Etiquetas do depoimento (a categoria da v1 vem como a primeira), quando há. */
  tags?: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ResumeItem {
  id: string;
  kind: ResumeKind;
  title: string;
  organization?: string;
  location?: string;
  start?: string;
  end?: string;
  description?: string;
  /** Grupo no idioma (ex.: as competências de "Front-end"), para o tema agrupar. */
  group?: string;
}

export interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  image?: ResolvedImage;
  tags: string[];
  /** Tamanho no mosaico (colunas x linhas), quando o item define. */
  span?: "1x1" | "1x2" | "2x1" | "2x2";
}

export interface PlanItem {
  id: string;
  name: string;
  description?: string;
  /** Preço formatado no idioma ("R$ 490/mês") ou o rótulo livre ("Sob consulta"). */
  price?: string;
  priceCents?: number;
  currency?: string;
  period?: PricePeriod;
  features: string[];
  highlighted: boolean;
  cta?: ResolvedLink;
}

export interface TeamItem {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photo?: ResolvedImage;
  links: ResolvedLink[];
}

export interface CollectionItems {
  posts: PostItem;
  projects: ProjectItem;
  services: ServiceItem;
  testimonials: TestimonialItem;
  faq: FaqItem;
  resume: ResumeItem;
  routine: RoutineItem;
  plans: PlanItem;
  team: TeamItem;
}

export interface CollectionPaths {
  posts: string;
  projects: string;
}

/** Caminhos do tipo pessoal (as URLs da v1). */
export const DEFAULT_PATHS: CollectionPaths = { posts: "/blog", projects: "/portfolio" };

/**
 * Base padrão das páginas de detalhe por tipo de site: o detalhe segue o caminho da listagem
 * que a receita do tipo cria (`/portfolio` no pessoal, `/cases` na empresa). `settings.paths` vence.
 */
export function defaultPathsFor(kind: SiteKind | undefined): CollectionPaths {
  return kind === "empresa" ? { posts: "/blog", projects: "/cases" } : DEFAULT_PATHS;
}

/** Bases efetivas: o que o site configurou, senão o padrão do tipo. */
export function resolvePaths(kind: SiteKind | undefined, configured?: { posts?: string; projects?: string }): CollectionPaths {
  return { ...defaultPathsFor(kind), ...(configured?.posts && { posts: configured.posts }), ...(configured?.projects && { projects: configured.projects }) };
}

function iso(ms: number | undefined): string | undefined {
  return ms === undefined ? undefined : new Date(ms).toISOString();
}

export function resolveSeo(seo: SeoFields | undefined, opts: ResolveOptions): ResolvedSeo {
  const out: ResolvedSeo = {};
  const title = pick(seo?.title, opts.locale);
  const description = pick(seo?.description, opts.locale);
  const image = resolveImage(seo?.image, opts);
  if (title) out.title = title;
  if (description) out.description = description;
  if (image) out.image = image;
  if (seo?.noindex) out.noindex = true;
  return out;
}

const PERIOD_SUFFIX: Record<string, Partial<Record<PricePeriod, string>>> = {
  pt: { month: "/mês", year: "/ano", hour: "/hora", project: "/projeto" },
  en: { month: "/mo", year: "/yr", hour: "/hr", project: "/project" },
  es: { month: "/mes", year: "/año", hour: "/hora", project: "/proyecto" },
};

export function formatPrice(plan: RawPlan, opts: ResolveOptions): string | undefined {
  if (plan.priceCents === undefined) return pick(plan.priceLabel, opts.locale);
  const amount = new Intl.NumberFormat(opts.locale, {
    style: "currency",
    currency: plan.currency ?? "BRL",
    minimumFractionDigits: plan.priceCents % 100 === 0 ? 0 : 2,
  }).format(plan.priceCents / 100);
  const lang = opts.locale.split("-")[0]!.toLowerCase();
  const suffix = plan.period ? (PERIOD_SUFFIX[lang] ?? PERIOD_SUFFIX.en!)[plan.period] ?? "" : "";
  return `${amount}${suffix}`;
}

function links(raw: { label: Record<string, string | undefined>; href: string }[] | undefined, opts: ResolveOptions): ResolvedLink[] {
  return (raw ?? []).map((l) => resolveLink(l, opts)).filter((l): l is ResolvedLink => l !== undefined);
}

function images(raw: RawProject["gallery"], opts: ResolveOptions): ResolvedImage[] {
  return (raw ?? []).map((i) => resolveImage(i, opts)).filter((i): i is ResolvedImage => i !== undefined);
}

export function detailUrl(base: string, slug: string, opts: ResolveOptions): string {
  return localizedPath(`${base.replace(/\/+$/, "")}/${slug}`, opts.locale, opts.locales);
}

export function resolvePost(raw: RawPost, opts: ResolveOptions, paths: CollectionPaths = DEFAULT_PATHS): PostItem | undefined {
  const title = pick(raw.title, opts.locale);
  const content = pick(raw.content, opts.locale);
  if (!title || !content) return undefined;
  const item: PostItem = {
    id: raw.id,
    slug: raw.slug,
    url: detailUrl(paths.posts, raw.slug, opts),
    title,
    content,
    tags: raw.tags ?? [],
    publishedAt: iso(raw.publishedAt)!,
    readingMinutes: readingMinutes(content),
    featured: raw.featured ?? false,
    seo: resolveSeo(raw.seo, opts),
  };
  const excerpt = pick(raw.excerpt, opts.locale);
  const own = resolveImage(raw.cover, opts);
  const cover = own ?? resolveImage(opts.defaultPostCover, opts);
  if (excerpt) item.excerpt = excerpt;
  if (cover) item.cover = cover;
  if (cover && !own) item.defaultCover = true;
  if (raw.updatedAt) item.updatedAt = iso(raw.updatedAt)!;
  if (raw.author) item.author = raw.author;
  return item;
}

export function resolveProject(raw: RawProject, opts: ResolveOptions, paths: CollectionPaths = DEFAULT_PATHS): ProjectItem | undefined {
  const title = pick(raw.title, opts.locale);
  if (!title) return undefined;
  const sections = (raw.sections ?? [])
    .map((s) => {
      const t = pick(s.title, opts.locale);
      const b = pick(s.body, opts.locale);
      if (!t || !b) return undefined;
      const sec: CaseSectionItem = { title: t, body: b };
      const image = resolveImage(s.image, opts);
      if (image) sec.image = image;
      return sec;
    })
    .filter((s): s is CaseSectionItem => s !== undefined);
  const item: ProjectItem = {
    id: raw.id,
    slug: raw.slug,
    url: detailUrl(paths.projects, raw.slug, opts),
    title,
    sections,
    gallery: images(raw.gallery, opts),
    links: links(raw.links, opts),
    metrics: caseMetrics(raw.metrics, opts),
    tags: raw.tags ?? [],
    featured: raw.featured ?? false,
    seo: resolveSeo(raw.seo, opts),
  };
  const summary = pick(raw.summary, opts.locale);
  const content = pick(raw.content, opts.locale);
  const cover = resolveImage(raw.cover, opts);
  const role = pick(raw.role, opts.locale);
  const category = pick(raw.category, opts.locale);
  if (summary) item.summary = summary;
  if (category) item.category = category;
  if (content) item.content = content;
  if (cover) item.cover = cover;
  if (role) item.role = role;
  if (raw.client) item.client = raw.client;
  if (raw.year) item.year = raw.year;
  const metricLabel = raw.metric ? pick(raw.metric.label, opts.locale) : undefined;
  if (raw.metric?.value && metricLabel) item.metric = { value: raw.metric.value, label: metricLabel };
  else if (item.metrics[0]) item.metric = { value: item.metrics[0].value, label: item.metrics[0].label };
  return item;
}

function caseMetrics(raw: RawProject["metrics"], opts: ResolveOptions): CaseMetricItem[] {
  return (raw ?? []).flatMap((m) => {
    const label = pick(m.label, opts.locale);
    if (!m.value || !label) return [];
    return [m.icon ? { value: m.value, label, icon: m.icon } : { value: m.value, label }];
  });
}

type Resolver<C extends CollectionName> = (raw: RawCollections[C], opts: ResolveOptions, paths: CollectionPaths) => CollectionItems[C] | undefined;

function compact<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as (keyof T)[]) if (obj[key] === undefined) delete obj[key];
  return obj;
}

const RESOLVERS: { [C in CollectionName]: Resolver<C> } = {
  posts: resolvePost,
  projects: resolveProject,
  services: (raw, opts) => {
    const title = pick(raw.title, opts.locale);
    if (!title) return undefined;
    return compact({
      id: raw.id,
      title,
      description: pick(raw.description, opts.locale),
      icon: raw.icon,
      priceLabel: pick(raw.priceLabel, opts.locale),
    });
  },
  testimonials: (raw, opts) => {
    const quote = pick(raw.quote, opts.locale);
    if (!quote) return undefined;
    return compact({
      id: raw.id,
      quote,
      author: raw.author,
      role: pick(raw.role, opts.locale),
      company: raw.company,
      avatar: resolveImage(raw.avatar, opts),
      tags: raw.tags?.length ? raw.tags : undefined,
    });
  },
  faq: (raw, opts) => {
    const question = pick(raw.question, opts.locale);
    const answer = pick(raw.answer, opts.locale);
    if (!question || !answer) return undefined;
    return { id: raw.id, question, answer };
  },
  resume: (raw, opts) => {
    const title = pick(raw.title, opts.locale);
    if (!title) return undefined;
    return compact({
      id: raw.id,
      kind: raw.kind,
      title,
      organization: raw.organization,
      location: pick(raw.location, opts.locale),
      start: raw.start,
      end: raw.end,
      description: pick(raw.description, opts.locale),
      group: pick(raw.group, opts.locale),
    });
  },
  routine: (raw, opts) => {
    const title = pick(raw.title, opts.locale);
    if (!title) return undefined;
    return compact({
      id: raw.id,
      title,
      description: pick(raw.description, opts.locale),
      image: resolveImage(raw.image, opts),
      tags: raw.tags ?? [],
      span: raw.span,
    });
  },
  plans: (raw, opts) => {
    const name = pick(raw.name, opts.locale);
    if (!name) return undefined;
    return compact({
      id: raw.id,
      name,
      description: pick(raw.description, opts.locale),
      price: formatPrice(raw, opts),
      priceCents: raw.priceCents,
      currency: raw.currency,
      period: raw.period,
      features: raw.features.map((f) => pick(f, opts.locale)).filter((f): f is string => !!f),
      highlighted: raw.highlighted ?? false,
      cta: resolveLink(raw.cta, opts),
    });
  },
  team: (raw, opts) => {
    const role = pick(raw.role, opts.locale);
    if (!role) return undefined;
    return compact({
      id: raw.id,
      name: raw.name,
      role,
      bio: resolveText(raw.bio, opts),
      photo: resolveImage(raw.photo, opts),
      links: links(raw.links, opts),
    });
  },
};

export function resolveItem<C extends CollectionName>(
  collection: C,
  raw: RawCollections[C],
  opts: ResolveOptions,
  paths: CollectionPaths = DEFAULT_PATHS,
): CollectionItems[C] | undefined {
  return (RESOLVERS[collection] as Resolver<C>)(raw, opts, paths);
}

/** Aplica a consulta do bloco (escolha manual, filtros, ordem, quantidade) e resolve no idioma. */
export function queryCollection<C extends CollectionName>(
  query: CollectionQuery & { collection: C },
  items: RawCollections[C][],
  opts: ResolveOptions,
  paths: CollectionPaths = DEFAULT_PATHS,
): CollectionItems[C][] {
  let list: RawCollections[C][];
  if (query.ids?.length) {
    const byId = new Map(items.map((i) => [i.id, i]));
    list = query.ids.map((id) => byId.get(id)).filter((i): i is RawCollections[C] => i !== undefined);
  } else {
    const byTags = items.filter((i) => !query.tags?.length || query.tags.some((t) => i.tags?.includes(t)));
    list = query.featured ? byTags.filter((i) => i.featured) : byTags;
    // "Só os destaques" sem nenhum destaque cadastrado: cai para a lista toda (ordem e limite do bloco).
    if (query.featured && !list.length) list = byTags;
    const recent = (i: RawCollections[C]): number => {
      const r = i as { publishedAt?: number; updatedAt?: number };
      return r.publishedAt ?? r.updatedAt ?? 0;
    };
    list = [...list].sort((a, b) =>
      query.sort === "recent" ? recent(b) - recent(a) : (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  }
  const resolved = list.map((i) => resolveItem(query.collection, i, opts, paths)).filter((i): i is CollectionItems[C] => i !== undefined);
  return query.limit ? resolved.slice(0, query.limit) : resolved;
}
