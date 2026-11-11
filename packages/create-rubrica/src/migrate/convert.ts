/**
 * Conversão dos dados da v1 para a v2 (RFC v2: "Migração da v1", passo 2). Função pura:
 * recebe as tabelas de um export do Convex da v1 e devolve as tabelas da v2, mais um
 * relatório do que foi convertido, do que ficou pendente e do que não tem destino.
 *
 * - Traduções `ptBR`/`enUS` viram mapa por idioma: `pt-BR` (principal, sem prefixo) e
 *   `en` (prefixo `/en`, as mesmas URLs da v1).
 * - As páginas fixas (home, sobre, currículo, portfólio, blog, depoimentos) são montadas
 *   pela receita do tema equivalente ao layout (decisão 24) e preenchidas com o
 *   `homeContent`, o `contactInfo` e os textos de seção do `siteTexts` (decisão 25). O
 *   resto do `siteTexts` que foi personalizado vira texto de interface. Os arquivos de
 *   tradução do projeto (`src/i18n/translations/*.ts`) são o segundo padrão dos textos,
 *   entre o `siteTexts` e o texto do template.
 * - Ids dos documentos de tabelas 1:1 (usuários, posts, projetos…) são mantidos, para as
 *   referências (autor, papel, imagem) continuarem valendo depois do import.
 */
import { defaultUiText, isWhatsAppNumber, normalizeWhatsAppNumber, validateBlock, type Locale, type Recipe, type RecipeBlock } from "@rubrica/core";
import { blockIds, isLocalizedValue, localizeRecipeValue, navigationFromPages } from "@rubrica/core/seed";
import { CORE_PLUGINS, V1_PLUGIN_RENAMES } from "@rubrica/core/plugins";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { SCHEMES } from "../v1/themes/schemes.js";
import V1_TEXTS_JSON from "./v1-texts.json";
import { BUSINESS_TABLES, convertBusiness } from "./business.js";

type Doc = Record<string, any>;
type Loc = Record<string, string>;

/** Textos padrão da última v1 (pt-BR e en-US), chave achatada → texto. */
export const V1_TEXTS = V1_TEXTS_JSON as Record<string, { pt: string; en?: string }>;

export const PT = "pt-BR";
export const EN = "en";
export const LOCALES = { locales: [PT, EN], default: PT };

/** Plugins da v1 e o padrão de cada um no registro da v1.13 (sem chave no homeContent, vale o padrão). */
export const V1_PLUGIN_DEFAULTS: Record<string, boolean> = {
  "contact-wizard": true,
  proposals: true,
  payments: true,
  blog: true,
  portfolio: true,
  resume: true,
  about: true,
  "ai-resumes": false,
  "audit-log": true,
  "media-manager": true,
  i18n: true,
  playground: false,
  testimonials: true,
  "testimonials-intake": true,
  "contract-templates": true,
};

/** v1 → v2 nas tabelas 1:1 (os ids continuam). */
export const TABLE_MAP: Record<string, string> = {
  users: "users",
  authAccounts: "authAccounts",
  userRoles: "userRoles",
  posts: "posts",
  projects: "projects",
  services: "services",
  testimonials: "testimonials",
  aboutFaq: "faq",
  aboutDailyRoutine: "routine",
  resumeItems: "resumeItems",
  imageMetadata: "media",
  auditLog: "auditLog",
};

/**
 * Tabelas de negócio (contatos, depoimentos enviados, comercial): convertidas em
 * `business.ts`. O que não tem destino na v2 vai como estava para um arquivo à parte.
 */
export { BUSINESS_TABLES };

/** Tabelas que não vão para a v2, e por quê. */
export const DROPPED_TABLES: Record<string, string> = {
  authSessions: "sessões de login: todo mundo entra de novo",
  authRefreshTokens: "sessões de login: todo mundo entra de novo",
  authVerificationCodes: "códigos temporários de login",
  authVerifiers: "códigos temporários de login",
  authRateLimits: "limites de tentativa de login (zerados)",
  rateLimitAttempts: "limites de envio (zerados)",
  playgroundAuditLog: "o playground saiu da v2 (decisão 32)",
  deployStatus: "o estado da publicação é refeito pelo núcleo",
  imageFolders: "as pastas viraram o caminho de cada imagem (media.folder)",
  homeContent: "convertido em blocos das páginas e plugins",
  siteConfig: "convertido nas configurações do site",
  siteTexts: "convertido em campos dos blocos e textos de interface",
  contactInfo: "convertido nas configurações do site (pessoa, redes)",
};

/** Tabelas da v2 construídas pela conversão (sem id de origem). */
export const BUILT_TABLES = ["pages", "siteSettings", "uiTexts"];

export interface V1RubricaJson {
  version?: string;
  layout?: string;
  theme?: string;
  fontSans?: string;
  fontMono?: string;
  colorMode?: "dark" | "light" | "system";
  colorModeToggle?: boolean;
  /** Textura escolhida na v1 (grão, papel, scanlines ou nenhuma). */
  texture?: string;
  plugins?: Record<string, boolean>;
  identity?: Partial<Record<"siteName" | "siteUrl" | "siteDescription" | "authorName" | "authorEmail" | "twitterHandle" | "lang", string>>;
}

export interface ConvertInput {
  tables: Record<string, Doc[]>;
  /** Documentos de `_storage` do export (com o `internalId` que aparece nas URLs antigas). */
  storage?: Doc[];
  /** `rubrica.json` da v1 (layout, esquema, fontes, identidade). */
  v1: V1RubricaJson;
  /** Tema da v2 (id) que o site vai usar. */
  theme: string;
  /** Receita do tema para o tipo pessoal (decisão 24). */
  recipe: Recipe;
  /** Agora (para datas de criação das páginas). Padrão: Date.now(). */
  now?: number;
  /**
   * Textos dos arquivos de tradução do projeto v1 (`src/i18n/translations/*.ts`), chave
   * achatada → texto. Segundo padrão: depois do `siteTexts`, antes do texto do template.
   */
  projectTexts?: Record<string, { pt?: string; en?: string }>;
}

export interface PageReport {
  path: string;
  blocks: string[];
  /** Blocos da receita que saíram (sem conteúdo na v1, ou plugin desligado). */
  dropped: { type: string; reason: string }[];
}

export interface MigrationReport {
  tables: { v2: string; from: string; count: number }[];
  pages: PageReport[];
  texts: {
    sectionKeys: number;
    /** Chaves dos arquivos de tradução do projeto que diferem do template da v1. */
    projectKeys?: number;
    ui: { v1: string; v2: string }[];
    unmapped: { key: string; pt: string }[];
  };
  plugins: { v1: string; v2: string | null; enabled: boolean }[];
  /** Documentos sem destino na v2, guardados como estavam (pendentes-v1.zip). */
  pending: { table: string; count: number; reason: string }[];
  dropped: { table: string; count: number; reason: string }[];
  unknownTables: { table: string; count: number }[];
  warnings: string[];
}

export interface ConvertResult {
  /** Tabelas da v2, prontas para o import. */
  tables: Record<string, Doc[]>;
  /** Tabela da v1 de onde veio cada tabela 1:1 da v2 (para manter o número da tabela). */
  sources: Record<string, string>;
  /** Documentos da v1 sem destino na v2, como estavam (por tabela). */
  pending: Record<string, Doc[]>;
  report: MigrationReport;
}

// ── Ajudantes ───────────────────────────────────────────────────────────────

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);

/** `{ ptBR, enUS }` (+ valor base em pt) → `{ "pt-BR", en }`, sem idiomas vazios. */
export function loc(base?: unknown, translations?: unknown): Loc {
  const tr = (translations && typeof translations === "object" ? translations : {}) as Record<string, unknown>;
  const out: Loc = {};
  const pt = str(base) ?? str(tr.ptBR);
  const en = str(tr.enUS);
  if (pt) out[PT] = pt;
  if (en) out[EN] = en;
  return out;
}

/**
 * Título de SEO como a v1 mostrava (componente SEO da v1): "<título> | <nome do site>",
 * a menos que já contenha o nome. Na v2, um `seo.title` preenchido sai como está, então o
 * sufixo vem para o dado.
 */
export function v1FullTitle(title: Loc, siteTitle: string | undefined): Loc {
  if (!siteTitle) return title;
  const out: Loc = {};
  for (const [l, t] of Object.entries(title)) if (t) out[l] = t.includes(siteTitle) ? t : `${t} | ${siteTitle}`;
  return out;
}

/** Texto que a v1 guardava sem tradução (siteConfig) e mostrava igual nos dois idiomas. */
export function sameInBoth(value: Loc): Loc {
  const v = value[PT] ?? value[EN];
  return v ? { [PT]: v, [EN]: value[EN] ?? v } : value;
}

/**
 * Menu como o da v1: Início, Currículo, Portfólio, Sobre e Blog, nessa ordem (a sidebar da
 * v1). As outras páginas (depoimentos, privacidade) existem, mas não estavam no menu.
 */
const V1_NAV_ORDER = ["/", "/curriculo", "/portfolio", "/sobre", "/blog"];
export function v1Navigation(items: Doc[]): Doc[] {
  return V1_NAV_ORDER.map((href) => items.find((n) => n.href === href)).filter((n): n is Doc => !!n);
}

/** Valor que pode ser texto ou `{ ptBR, enUS }` (homeContent). */
function locAny(value: unknown): Loc {
  if (typeof value === "string") return loc(value);
  if (value && typeof value === "object") return loc((value as Doc).ptBR, value);
  return {};
}

const hasText = (l: Loc) => Object.keys(l).length > 0;

function mapLoc(l: Loc, fn: (s: string) => string): Loc {
  return Object.fromEntries(Object.entries(l).map(([k, v]) => [k, fn(v)]));
}

/** Texto puro → HTML em parágrafos (o que já é HTML fica como está). */
export function toHtml(text: string): string {
  if (/<(p|h[1-6]|ul|ol|div|blockquote)[\s>]/i.test(text)) return text;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const compact = <T extends Doc>(doc: T): T => Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined && !(typeof v === "object" && v !== null && !Array.isArray(v) && Object.keys(v).length === 0))) as T;

const meta = (d: Doc) => ({ _id: d._id, _creationTime: d._creationTime });

const lifecycle = (d: Doc, published = true) => ({
  published,
  createdAt: typeof d.createdAt === "number" ? d.createdAt : (d._creationTime ?? 0),
  updatedAt: d.updatedAt,
  deletedAt: d.deletedAt,
  deletedBy: d.deletedBy,
});

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

const MONTHS: Record<string, string> = {
  jan: "01", fev: "02", feb: "02", mar: "03", abr: "04", apr: "04", mai: "05", may: "05", jun: "06",
  jul: "07", ago: "08", aug: "08", set: "09", sep: "09", out: "10", oct: "10", nov: "11", dez: "12", dec: "12",
};
const PRESENT = /atual|presente|present|hoje|now|current|o momento|em andamento/i;

/** "jan/2020 – atual", "03/2019 - 12/2021", "2018 - 2020" → { start, end } no formato da v2. */
export function parsePeriod(period: string): { start?: string; end?: string; ok: boolean } {
  // "2015-2017": anos colados ao hífen, sem espaço.
  const years = /^(\d{4})\s*-\s*(\d{4})$/.exec(period.trim());
  const parts = years
    ? [years[1]!, years[2]!]
    : period.split(/\s+(?:-|–|—|a|até|to)\s+|\s*[–—]\s*|\s+-\s+/i).map((p) => p.trim()).filter(Boolean);
  const one = (p: string): string | undefined => {
    const numeric = /^(\d{1,2})[/.-](\d{4})$/.exec(p);
    if (numeric) return `${numeric[2]}-${numeric[1]!.padStart(2, "0")}`;
    // "Jan 2025", "jan/2025", "janeiro de 2025", "Jan-2025".
    const named = /^([a-zç]{3})[a-zç]*\.?[\s/de-]*(\d{4})$/i.exec(p.normalize("NFD").replace(/[̀-ͯ]/g, ""));
    if (named && MONTHS[named[1]!.toLowerCase()]) return `${named[2]}-${MONTHS[named[1]!.toLowerCase()]}`;
    const year = /^(\d{4})$/.exec(p);
    return year ? year[1] : undefined;
  };
  if (parts.length === 0) return { ok: false };
  const start = one(parts[0]!);
  if (!start) return { ok: false };
  if (parts.length === 1) return { start, ok: true };
  if (PRESENT.test(parts[1]!)) return { start, ok: true };
  const end = one(parts[1]!);
  return end ? { start, end, ok: true } : { ok: false };
}

// ── Conversão ───────────────────────────────────────────────────────────────

class Ctx {
  warnings: string[] = [];
  media = new Map<string, Doc>();
  folders = new Map<string, string>();
  siteTexts = new Map<string, Doc>();
  home = new Map<string, unknown>();
  config = new Map<string, unknown>();
  contact: Doc | undefined;

  /** `internalId` (o UUID das URLs `/api/storage/<uuid>` da v1) → id do arquivo, que o import mantém. */
  storageByUrlId = new Map<string, string>();

  constructor(
    readonly tables: Record<string, Doc[]>,
    readonly projectTexts: Record<string, { pt?: string; en?: string }> = {},
    storage: Doc[] = [],
  ) {
    for (const f of storage) if (typeof f.internalId === "string" && typeof f._id === "string") this.storageByUrlId.set(f.internalId, f._id);
    for (const f of tables.imageFolders ?? []) this.folders.set(f._id, f.path);
    for (const m of tables.imageMetadata ?? []) this.media.set(m._id, m);
    for (const t of tables.siteTexts ?? []) this.siteTexts.set(t.key, t);
    for (const h of tables.homeContent ?? []) this.home.set(h.key, h.value);
    for (const c of tables.siteConfig ?? []) this.config.set(c.key, c.value);
    this.contact = (tables.contactInfo ?? [])[0];
  }

  /** O `site_title` da v1, que o componente SEO punha no fim dos títulos. */
  get siteTitle(): string | undefined {
    return str(this.config.get("site_title"));
  }

  /** Imagem da biblioteca da v1 (id do imageMetadata), ou só a URL. */
  /** Arquivo do export a partir de uma URL do storage da v1 (que deixa de existir com o banco velho). */
  storageIdFromUrl(url?: string): string | undefined {
    const m = /\/api\/storage\/([0-9a-f-]{36})/i.exec(str(url) ?? "");
    return m ? this.storageByUrlId.get(m[1]!.toLowerCase()) : undefined;
  }

  image(imageId?: string, url?: string): Doc | undefined {
    const m = imageId ? this.media.get(imageId) : undefined;
    if (!m && !str(url)) return undefined;
    // Sem metadado, mas a URL é do storage da v1: aponta para o arquivo importado.
    const fromUrl = m?.storageId ? undefined : this.storageIdFromUrl(url);
    return compact({
      url: fromUrl ? "" : (str(url) ?? ""),
      storageId: m?.storageId ?? fromUrl,
      alt: m?.altText ? loc(m.altText) : undefined,
      width: m?.width,
      height: m?.height,
    });
  }

  /**
   * Texto de seção ou de interface: o do site (siteTexts), senão o dos arquivos de
   * tradução do projeto, senão o padrão da v1. Sem os espaços de enfeite.
   */
  t(key: string): Loc {
    const row = this.siteTexts.get(key);
    const file = this.projectTexts[key];
    const def = V1_TEXTS[key];
    const pt = str(row?.ptBR) ?? str(file?.pt) ?? def?.pt;
    const en = str(row?.enUS) ?? str(file?.en) ?? def?.en;
    return mapLoc(compact({ [PT]: pt, [EN]: en }) as Loc, (s) => s.trim());
  }

  /** O arquivo de tradução do projeto mudou o texto do template? (Só chaves que o template tem.) */
  fileCustomized(key: string): boolean {
    const file = this.projectTexts[key];
    const def = V1_TEXTS[key];
    if (!file || !def) return false;
    return (str(file.pt) !== undefined && file.pt !== def.pt) || (str(file.en) !== undefined && file.en !== def.en);
  }

  /** O texto foi personalizado no painel ou no arquivo de tradução (diferente do padrão da v1)? */
  customized(key: string): boolean {
    const row = this.siteTexts.get(key);
    if (!row) return this.fileCustomized(key);
    const def = V1_TEXTS[key];
    if (!def) return true;
    return (row.ptBR ?? "") !== def.pt || (str(row.enUS) !== undefined && row.enUS !== def.en) || this.fileCustomized(key);
  }

  /** Chaves com texto do site: as do banco e as que o projeto mudou nos arquivos. */
  textKeys(): string[] {
    return [...new Set([...this.siteTexts.keys(), ...Object.keys(this.projectTexts).filter((k) => this.fileCustomized(k))])];
  }
}

function convertPosts(ctx: Ctx, docs: Doc[]): Doc[] {
  return docs.map((d) =>
    compact({
      ...meta(d),
      slug: d.slug,
      title: loc(d.title, d.titleTranslations),
      excerpt: loc(d.subtitle, d.subtitleTranslations),
      content: loc(d.content, d.contentTranslations),
      cover: ctx.image(d.imageId, d.imageUrl),
      seo: compact({
        title: v1FullTitle(loc(d.seoTitle, d.seoTitleTranslations), ctx.siteTitle),
        description: loc(d.seoDescription, d.seoDescriptionTranslations),
        image: ctx.image(d.ogImageId, d.ogImageUrl),
      }),
      tags: d.tags?.length ? d.tags : undefined,
      featured: d.featured === true ? true : undefined,
      publishedAt: d.publishedAt,
      authorId: d.authorId,
      ...lifecycle(d, d.status === "published"),
    }),
  );
}

const CASE_SECTIONS: { field: string; key: string }[] = [
  { field: "context", key: "portfolio.before" },
  { field: "problem", key: "portfolio.problem" },
  { field: "solution", key: "portfolio.solution" },
  { field: "decisions", key: "portfolio.decisions" },
  { field: "results", key: "portfolio.results" },
  { field: "learnings", key: "portfolio.learnings" },
];

function convertProjects(ctx: Ctx, docs: Doc[]): Doc[] {
  const slugs = new Set<string>();
  return docs.map((d) => {
    let slug = str(d.slug) ?? slugify(d.title ?? "projeto");
    if (!str(d.slug)) ctx.warnings.push(`Projeto "${d.title}" não tinha slug na v1: ganhou /portfolio/${slug}.`);
    for (let n = 2; slugs.has(slug); n++) slug = `${str(d.slug) ?? slugify(d.title)}-${n}`;
    slugs.add(slug);

    const cs = d.caseStudy as Doc | undefined;
    const csEn = (d.caseStudyTranslations as Doc | undefined)?.enUS as Doc | undefined;
    const sections: Doc[] = [];
    if (cs) {
      for (const s of CASE_SECTIONS) {
        const body = mapLoc(loc(cs[s.field], { enUS: csEn?.[s.field] }), toHtml);
        if (hasText(body)) sections.push({ title: ctx.t(s.key), body });
      }
      if (cs.metrics?.length) {
        const list = (metrics: Doc[]) => `<ul>${metrics.map((m) => `<li><strong>${m.value}</strong> ${m.label}</li>`).join("")}</ul>`;
        const body: Loc = { [PT]: list(cs.metrics) };
        if (csEn?.metrics?.length) body[EN] = list(csEn.metrics);
        sections.push({ title: ctx.t("portfolio.metrics"), body });
      }
      if (cs.testimonial?.text) {
        const t = cs.testimonial as Doc;
        const quote = (text: string, role?: string) => `<blockquote><p>${text}</p><footer>${t.author}${role ? `, ${role}` : ""}</footer></blockquote>`;
        const original = t.lang === "en-US" ? EN : PT;
        const other = original === PT ? EN : PT;
        const translated = (original === PT ? csEn : (d.caseStudyTranslations as Doc | undefined)?.ptBR)?.testimonial as Doc | undefined;
        const body: Loc = { [original]: quote(t.text, t.role) };
        if (translated?.text) body[other] = quote(translated.text, translated.role ?? t.role);
        sections.push({ title: ctx.t("portfolio.testimonial"), body });
      }
    }
    const images = (d.imageIds as string[] | undefined ?? []).map((id) => ctx.image(id)).filter(Boolean) as Doc[];
    const external = (d.externalImageUrls as string[] | undefined ?? []).map((url) => ({ url }));
    const [cover, ...gallery] = [...images, ...external];
    const links: Doc[] = [];
    if (str(d.demoLink)) links.push({ label: ctx.t("portfolio.liveDemo"), href: d.demoLink });
    if (str(d.githubLink)) links.push({ label: ctx.t("portfolio.code"), href: d.githubLink });
    // A categoria vai para o campo próprio (não repete como etiqueta, como na v1).
    const tags = [...new Set((d.tags ?? []) as string[])];
    return compact({
      ...meta(d),
      slug,
      title: loc(d.title, d.titleTranslations),
      summary: loc(d.description, d.descriptionTranslations),
      content: mapLoc(loc(d.longDescription, d.longDescriptionTranslations), toHtml),
      sections: sections.length ? sections : undefined,
      cover,
      gallery: gallery.length ? gallery : undefined,
      role: cs ? loc(cs.role, { enUS: csEn?.role }) : undefined,
      // A categoria da v1 vai para o campo próprio e continua nas etiquetas (filtros já feitos).
      category: str(d.category) ? loc(d.category, d.categoryTranslations) : undefined,
      links: links.length ? links : undefined,
      tags: tags.length ? tags : undefined,
      // Na v1, a home mostrava os projetos com case e slug (selectFeaturedCases).
      featured: cs && str(d.slug) ? true : undefined,
      order: d.orderIndex,
      ...lifecycle(d),
    });
  });
}

function convertResume(ctx: Ctx, docs: Doc[]): Doc[] {
  return docs.map((d) => {
    const c = (d.content ?? {}) as Doc;
    const tr = (d.contentTranslations ?? {}) as Doc;
    const en = (tr.enUS ?? {}) as Doc;
    const base = { ...meta(d), order: d.orderIndex, ...lifecycle(d) };
    const period = (p?: string) => {
      if (!str(p)) return {};
      const parsed = parsePeriod(p!);
      if (!parsed.ok) ctx.warnings.push(`Currículo: não entendi o período "${p}" de "${c.role ?? c.degree ?? c.text}"; preencha início e fim no painel.`);
      return compact({ start: parsed.start, end: parsed.end });
    };
    switch (d.type) {
      case "experience":
        return compact({ ...base, kind: "experience", title: loc(c.role, { enUS: en.role }), organization: str(c.company), description: mapLoc(loc(c.description, { enUS: en.description }), (s) => s), ...period(c.period) });
      case "education":
        return compact({ ...base, kind: "education", title: loc(c.degree, { enUS: en.degree }), organization: str(c.institution), description: loc(c.description, { enUS: en.description }), ...period(c.period) });
      case "skill":
        // O grupo da v1 vai para o campo próprio e continua na etiqueta.
        return compact({ ...base, kind: "skill", title: loc(c.name, { enUS: en.name }), description: loc(c.level, { enUS: en.level }), group: str(c.group) ? loc(c.group, { enUS: en.group }) : undefined, tags: str(c.group) ? [c.group] : undefined });
      case "soft_skill":
        return compact({ ...base, kind: "soft-skill", title: loc(c.text, tr) });
      case "course":
        return compact({ ...base, kind: "certification", title: loc(c.text, tr) });
      case "language":
        return compact({ ...base, kind: "language", title: loc(c.name, tr.enUS ? { enUS: typeof tr.enUS === "string" ? tr.enUS : tr.enUS.name } : undefined), description: str(c.level) ? loc(c.level) : undefined });
      case "volunteer":
        if (str(c.text)) return compact({ ...base, kind: "volunteer", title: loc(c.text, tr) });
        return compact({ ...base, kind: "volunteer", title: loc(c.role, { enUS: en.role }), organization: str(c.company), description: loc(c.description, { enUS: en.description }), ...period(c.period) });
      default:
        ctx.warnings.push(`Currículo: item do tipo desconhecido "${d.type}" ficou de fora.`);
        return null;
    }
  }).filter(Boolean) as Doc[];
}

/** Estado efetivo dos plugins da v1 e o equivalente na v2. */
function convertPlugins(ctx: Ctx): { record: Record<string, boolean>; report: MigrationReport["plugins"] } {
  const v2Ids = new Set(CORE_PLUGINS.filter((p) => p.kinds.includes("pessoal")).map((p) => p.id));
  const record: Record<string, boolean> = {};
  const report: MigrationReport["plugins"] = [];
  const ids = new Set([...Object.keys(V1_PLUGIN_DEFAULTS), ...[...ctx.home.keys()].filter((k) => /^plugin:.+:enabled$/.test(k)).map((k) => k.slice(7, -8))]);
  for (const id of ids) {
    const key = `plugin:${id}:enabled`;
    let enabled = ctx.home.has(key) ? ctx.home.get(key) !== false : (V1_PLUGIN_DEFAULTS[id] ?? false);
    if (id === "contact-wizard" && ctx.home.get("contact_wizard_enabled") === false) enabled = false;
    const v2 = id in V1_PLUGIN_RENAMES ? V1_PLUGIN_RENAMES[id]! : id;
    const target = v2 && v2Ids.has(v2) ? v2 : null;
    if (target) record[target] = enabled;
    report.push({ v1: id, v2: target, enabled });
  }
  return { record, report };
}

function hexOf(value: unknown): string | undefined {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : undefined;
}

/**
 * O "WhatsApp" do contactInfo da v1 (campo `phone`, que a sidebar abria no wa.me) vira o
 * WhatsApp do site, sem o botão flutuante (a v1 não tinha). Só com "Mostrar" ligado.
 * Número sem DDI com cara de brasileiro (10 ou 11 dígitos) ganha o 55.
 */
function convertWhatsApp(ctx: Ctx): Doc | undefined {
  const contact = ctx.contact;
  const raw = str(contact?.phone);
  if (!raw || !contact?.showPhone) return undefined;
  let number = normalizeWhatsAppNumber(raw);
  if (!raw.trim().startsWith("+") && /^[1-9]\d{9,10}$/.test(number)) {
    number = `55${number}`;
    ctx.warnings.push(`WhatsApp "${raw}" sem DDI: foi gravado como +${number}. Confira em Configurações → WhatsApp.`);
  }
  if (!isWhatsAppNumber(number)) {
    ctx.warnings.push(`WhatsApp "${raw}" da v1 não está no formato internacional e ficou de fora: preencha em Configurações → WhatsApp.`);
    return undefined;
  }
  return { number, floating: false };
}

function convertSettings(ctx: Ctx, input: ConvertInput, plugins: Record<string, boolean>): Doc {
  const c = (k: string) => str(ctx.config.get(k));
  const id = input.v1.identity ?? {};
  const contact = ctx.contact;
  const scheme = SCHEMES.find((s) => s.id === input.v1.theme);
  // Cores mudadas no painel ("Aparência") que diferem do esquema: viram tokens.
  const tokens: Record<string, string> = {};
  const pairs: [string, string, "bg" | "text" | "primary"][] = [
    ["theme_background", "rb-bg", "bg"],
    ["theme_foreground", "rb-fg", "text"],
    ["theme_primary", "rb-accent", "primary"],
  ];
  for (const [key, token, role] of pairs) {
    const hex = hexOf(ctx.config.get(key));
    if (!hex) continue;
    const fromScheme = scheme && [scheme.light[role], scheme.dark[role]].map((v) => v.toLowerCase()).includes(hex);
    if (!fromScheme) tokens[token] = hex;
  }
  if (ctx.config.get("theme_colors_per_mode") === true) ctx.warnings.push("As cores separadas por modo (claro/escuro) do painel da v1 não foram convertidas: ajuste em Aparência.");
  // A ordem da sidebar da v1: GitHub, LinkedIn, Behance.
  const social = [
    ["github", contact?.githubUrl],
    ["linkedin", contact?.linkedinUrl],
    ["behance", contact?.behanceUrl],
  ]
    .filter(([, url]) => str(url))
    .map(([network, url]) => ({ network, url }));
  const url = (c("site_url") ?? id.siteUrl ?? "").replace(/\/+$/, "");
  const ogStorage = str(ctx.config.get("og_image_storage_id"));
  return compact({
    kind: "pessoal",
    name: loc(c("site_name") ?? c("site_title") ?? id.siteName),
    description: loc(c("site_description") ?? id.siteDescription),
    url: url && !/^https?:\/\//.test(url) ? `https://${url}` : url,
    locales: LOCALES,
    theme: input.theme,
    appearance: compact({
      colorMode: input.v1.colorMode ?? "dark",
      colorToggle: input.v1.colorModeToggle ?? false,
      scheme: input.v1.theme,
      tokens: Object.keys(tokens).length ? tokens : undefined,
      fontSans: c("theme_font_sans") ?? input.v1.fontSans,
      fontMono: c("theme_font_mono") ?? input.v1.fontMono,
      // A textura da v1 passa como está (inclusive "none", que desliga a do tema).
      texture: ["none", "grain", "paper", "scanlines"].includes(input.v1.texture ?? "") ? input.v1.texture : undefined,
    }),
    navigation: [],
    // As URLs da v1 (/blog, /portfolio) ficam fixas, mesmo que o padrão do tipo mude.
    paths: { posts: "/blog", projects: "/portfolio" },
    social,
    person: contact || id.authorName
      ? compact({
          name: str(contact?.name) ?? id.authorName ?? "",
          jobTitle: contact ? loc(contact.role, contact.roleTranslations) : undefined,
          email: contact?.showEmail ? str(contact.email) : undefined,
          photo: contact?.avatarStorageId ? { url: "", storageId: contact.avatarStorageId } : ctx.image(undefined, str(contact?.avatarUrl)),
          // A sidebar da v1 mostrava o telefone (com o ícone do WhatsApp) quando "mostrar" estava ligado.
          whatsapp: contact?.showPhone ? str(contact.phone) : undefined,
        })
      : undefined,
    plugins,
    ogImage: ogStorage || c("og_image_url") ? compact({ url: c("og_image_url") ?? "", storageId: ogStorage }) : undefined,
    twitterHandle: c("twitter_handle") ?? id.twitterHandle,
    whatsapp: convertWhatsApp(ctx),
  });
}

/** Campos de cada bloco das páginas fixas, a partir da v1. `null`: o bloco sai (sem conteúdo). */
type Filler = (ctx: Ctx, plugins: Record<string, boolean>, recipe?: RecipeBlock[]) => Doc | null;

const link = (label: Loc, href: string) => (hasText(label) ? { label, href } : undefined);

/** O "sobre" da home em HTML, com os números de resultado em negrito (a home e o Sobre da v1 destacavam). */
const ABOUT_TEXT = (ctx: Ctx) =>
  mapLoc(locAny(ctx.home.get("about_text")), (text) =>
    /<(p|h[1-6]|ul|ol|div|blockquote)[\s>]/i.test(text)
      ? text
      : text
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${highlightNumbersHtml(p).replace(/\n/g, "<br>")}</p>`)
          .join(""),
  );

// Número seguido de uma unidade de resultado ("50 skills", "3 horas"), como o highlightNumbers
// da v1 (src/utils/homeContent.ts): anos e versões soltas não entram, porque não têm unidade.
const RESULT_UNITS = [
  "skills", "automações", "áreas", "chamados", "horas", "minutos", "meses", "anos", "iniciativas", "pessoas", "times", "sistemas", "projetos",
  "automations", "areas", "tickets", "hours", "minutes", "months", "years", "initiatives", "people", "teams", "systems", "projects",
];
const NUMBER_WITH_UNIT = new RegExp(`(?<![\\p{L}\\d.])~?\\d+(?:[.,]\\d+)*\\+?\\s(?:${RESULT_UNITS.join("|")})(?![\\p{L}])`, "gu");

/** Escapa o texto e põe os números com unidade em <strong>, como a v1 destacava. */
export function highlightNumbersHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = "";
  let last = 0;
  for (const m of text.matchAll(NUMBER_WITH_UNIT)) {
    out += escape(text.slice(last, m.index)) + `<strong>${escape(m[0])}</strong>`;
    last = m.index! + m[0].length;
  }
  return out + escape(text.slice(last));
}

/** Resumo do currículo da v1: o primeiro parágrafo do "sobre" da home, com os números em negrito. */
const RESUME_SUMMARY = (ctx: Ctx): Loc =>
  mapLoc(locAny(ctx.home.get("about_text")), (text) => {
    const first = text.split(/\n\s*\n/).map((p) => p.trim()).find(Boolean);
    return first ? `<p>${highlightNumbersHtml(first)}</p>` : "";
  });

/** A receita da página abre com um cabeçalho (hero)? */
const hasHeader = (recipe?: RecipeBlock[]) => recipe?.[0]?.type === "hero";
/** Cabeçalho de página com o título e o apoio da v1 (`<prefixo>.title` e `.subtitle`). */
const header = (ctx: Ctx, prefix: string): Doc => compact({ title: ctx.t(`${prefix}.title`), subtitle: hasText(ctx.t(`${prefix}.subtitle`)) ? ctx.t(`${prefix}.subtitle`) : undefined });

/** Números da home (home_metrics): a v1 mostrava os mesmos na home e no currículo. */
const HOME_METRICS: Filler = (ctx) => {
  const metrics = (ctx.home.get("home_metrics") as Doc[] | undefined) ?? [];
  if (!metrics.length) return null;
  return { items: metrics.slice(0, 8).map((m) => ({ value: String(m.value), label: loc(m.label, m.labelTranslations) })) };
};

/** Por página e tipo de bloco (com a ocorrência quando o tipo repete na página). */
export const SECTION_FILLERS: Record<string, Record<string, Filler | Filler[]>> = {
  "/": {
    hero: (ctx, plugins) => {
      const tags = (ctx.home.get("hero_tags") as Doc[] | undefined)?.filter((t) => str(t.label)).map((t) => ({ label: loc(t.label) }));
      const availability = ctx.home.get("availability_status") as Doc | undefined;
      const title = ctx.t("home.hero.headline");
      return compact({
        // O selo da v1 é o texto home.greeting ("whoami"), não o cargo (que aparece abaixo).
        eyebrow: ctx.t("home.greeting"),
        title: hasText(title) ? title : loc(ctx.home.get("hero_title")),
        subtitle: ctx.t("home.hero.description"),
        primaryCta: plugins.portfolio !== false ? link(ctx.t("home.hero.ctaCases"), "#cases") : undefined,
        secondaryCta: plugins["contact-wizard"] !== false ? link(ctx.t("home.hero.ctaContact"), "#contato") : undefined,
        tags: tags?.length ? tags.slice(0, 8) : undefined,
        showAvailability: availability?.available === true,
      });
    },
    numeros: HOME_METRICS,
    cases: (ctx) => compact({ anchor: "cases", title: ctx.t("home.cases.title"), cta: link(ctx.t("home.cases.viewAll"), "/portfolio") }),
    texto: (ctx) => {
      const body = ABOUT_TEXT(ctx);
      return hasText(body) ? { title: ctx.t("home.about.title"), body } : null;
    },
    servicos: (ctx) => ({ title: ctx.t("home.skills.title") }),
    // "Ver todos os depoimentos" levava à página de depoimentos (que existe com o plugin ligado).
    depoimentos: (ctx, plugins) =>
      compact({ title: ctx.t("home.testimonials.title"), allowSubmission: plugins["testimonials-intake"] !== false, cta: hasText(ctx.t("testimonials.viewAll")) ? link(ctx.t("testimonials.viewAll"), "/depoimentos") : undefined }),
    cta: (ctx, plugins) =>
      compact({
        title: ctx.t("home.cta.title"),
        body: ctx.t("home.cta.subtitle"),
        primary: link(ctx.t("home.cta.project"), "#contato"),
        secondary: plugins["contact-wizard"] !== false ? link(ctx.t("home.cta.job"), "#contato") : undefined,
      }),
    contato: (ctx, plugins) =>
      plugins["contact-wizard"] === false
        ? { anchor: "contato", title: ctx.t("sidebar.contact"), mode: "channels", showChannels: true }
        : contactWizardFields(ctx),
    "posts-recentes": (ctx) => compact({ title: ctx.t("blog.title"), cta: link(ctx.t("blog.title"), "/blog") }),
  },
  "/sobre": {
    texto: [
      (ctx) => {
        const body = ABOUT_TEXT(ctx);
        return hasText(body) ? { title: ctx.t("about.professional.title"), body } : null;
      },
      (ctx) => {
        const body = mapLoc(ctx.t("about.aboutMe.text"), toHtml);
        return hasText(body) ? { title: ctx.t("about.aboutMe.title"), body } : null;
      },
    ],
    "lista-itens": (ctx) => {
      const items = ((ctx.home.get("work_principles") as Doc[] | undefined) ?? []).filter((p) => str(p.title));
      if (!items.length) return null;
      return { title: ctx.t("about.principles.title"), numbered: false, items: items.slice(0, 12).map((p) => compact({ title: loc(p.title, p.titleTranslations), body: loc(p.description, p.descriptionTranslations) })) };
    },
    galeria: (ctx) => ({ title: ctx.t("about.dailyRoutine.title") }),
    faq: (ctx) => ({ title: ctx.t("about.faq.title") }),
  },
  // A página da v1: título e apoio, o resumo (1º parágrafo do "sobre"), os números e o PDF no
  // topo, depois o currículo. Numa receita sem o cabeçalho (hero), o título fica no currículo.
  "/curriculo": {
    hero: (ctx) => header(ctx, "resume"),
    texto: (ctx) => {
      const body = RESUME_SUMMARY(ctx);
      return hasText(body) ? { body } : null;
    },
    numeros: HOME_METRICS,
    curriculo: (ctx, _plugins, recipe) => (hasHeader(recipe) ? { showDownload: true } : { title: ctx.t("resume.title"), intro: ctx.t("resume.subtitle"), showDownload: true }),
  },
  // Páginas de lista: com um cabeçalho (hero) na receita, o título e o apoio da v1 vão para ele.
  "/portfolio": {
    hero: (ctx) => header(ctx, "portfolio"),
    cases: (ctx, _p, recipe) => (hasHeader(recipe) ? {} : { title: ctx.t("portfolio.title"), intro: ctx.t("portfolio.subtitle") }),
  },
  "/blog": {
    hero: (ctx) => header(ctx, "blog"),
    "posts-recentes": (ctx, _p, recipe) => (hasHeader(recipe) ? { showTagFilter: true } : { title: ctx.t("blog.title"), intro: ctx.t("blog.subtitle"), showTagFilter: true }),
  },
  "/depoimentos": {
    hero: (ctx) => header(ctx, "testimonials"),
    depoimentos: (ctx, plugins, recipe) =>
      compact({ ...(hasHeader(recipe) ? {} : { title: ctx.t("testimonials.title"), intro: ctx.t("testimonials.subtitle") }), allowSubmission: plugins["testimonials-intake"] !== false }),
  },
};

/** Título e SEO de cada página fixa. */
const PAGE_META: Record<string, (ctx: Ctx) => { title: Loc; seo?: Doc }> = {
  // O título e a descrição da home ficavam no siteConfig, sem tradução: valiam nos dois idiomas.
  "/": (ctx) => ({ title: ctx.t("navigation.home"), seo: compact({ title: sameInBoth(loc(ctx.config.get("seo_home_title"))), description: sameInBoth(loc(ctx.config.get("seo_home_description"))) }) }),
  "/sobre": (ctx) => ({ title: ctx.t("navigation.about"), seo: compact({ title: v1FullTitle(ctx.t("seo.aboutTitle"), ctx.siteTitle), description: ctx.t("seo.aboutDescription") }) }),
  "/curriculo": (ctx) => ({ title: ctx.t("navigation.resume"), seo: compact({ title: v1FullTitle(ctx.t("seo.resumeTitle"), ctx.siteTitle), description: ctx.t("seo.resumeDescription") }) }),
  "/portfolio": (ctx) => ({ title: ctx.t("navigation.portfolio"), seo: compact({ title: v1FullTitle(ctx.t("seo.portfolioTitle"), ctx.siteTitle), description: ctx.t("seo.portfolioDescription") }) }),
  "/blog": (ctx) => ({ title: ctx.t("navigation.blog"), seo: compact({ title: v1FullTitle(ctx.t("seo.blogTitle"), ctx.siteTitle), description: ctx.t("seo.blogDescription") }) }),
  "/depoimentos": (ctx) => ({ title: ctx.t("testimonials.title"), seo: compact({ description: ctx.t("seo.testimonialsDescription") }) }),
};

/** Chaves de seção usadas pelos blocos (vão para os campos, não para "Textos"). */
export const SECTION_KEYS = new Set([
  "home.hero.headline", "home.hero.description", "home.hero.ctaCases", "home.hero.ctaContact", "home.cases.title", "home.cases.viewAll",
  "home.about.title", "home.skills.title", "home.testimonials.title", "home.cta.title", "home.cta.subtitle", "home.cta.project", "home.cta.job",
  "sidebar.contact", "blog.title", "blog.subtitle", "about.professional.title", "about.aboutMe.title", "about.aboutMe.text", "about.principles.title",
  "about.dailyRoutine.title", "about.faq.title", "resume.title", "resume.subtitle", "portfolio.title", "portfolio.subtitle", "testimonials.title",
  "testimonials.subtitle", "testimonials.viewAll", "home.greeting", "navigation.home", "navigation.about", "navigation.resume", "navigation.portfolio", "navigation.blog",
  "seo.aboutTitle", "seo.aboutDescription", "seo.resumeTitle", "seo.resumeDescription", "seo.portfolioTitle", "seo.portfolioDescription",
  "seo.blogTitle", "seo.blogDescription", "seo.testimonialsDescription", "portfolio.before", "portfolio.problem", "portfolio.solution",
  "portfolio.decisions", "portfolio.results", "portfolio.learnings", "portfolio.metrics", "portfolio.testimonial", "portfolio.liveDemo", "portfolio.code",
]);

/** Textos de interface da v1 → chave da v2 (só os personalizados vão; os outros usam o padrão da v2). */
export const UI_TEXT_MAP: Record<string, string> = {
  "blog.readMore": "common.readMore",
  "common.back": "common.back",
  // O botão do envio de depoimento é o da ilha (`testimonialForm.open`).
  "testimonials.leaveTestimonial": "testimonialForm.open",
  "testimonials.empty": "common.empty",
  "resume.experience": "resume.experience",
  "resume.education": "resume.education",
  "resume.skills": "resume.skill",
  "resume.courses": "resume.certification",
  "resume.languages": "resume.language",
  "resume.downloadCV": "resume.download",
  "resume.softSkills": "resume.soft-skill",
  "resume.volunteer": "resume.volunteer",
  "resume.showOlder": "resume.showOlder",
  "resume.hideOlder": "resume.hideOlder",
  "contactWizard.trigger": "sidebar.talk",
  "sidebar.downloadCV": "sidebar.downloadCV",
  "portfolio.screenshots": "case.gallery",
  "home.cases.read": "case.view",
  "blog.filterByTags": "blog.filter",
  "sidebar.language": "nav.language",
  "sidebar.menu": "nav.menu",
  "contactWizard.contact.name": "form.name",
  "contactWizard.contact.email": "form.email",
  "contactWizard.contact.phone": "form.phone",
  "contactWizard.successTitle": "contactForm.success",
  "contactWizard.successBody": "contactForm.successBody",
  "contactWizard.rateLimited": "form.rateLimited",
  "contactWizard.back": "form.back",
  "notFound.cta": "notFound.home",
  "notFound.label": "notFound.label",
  "notFound.errorCode": "notFound.code",
  "portfolio.myRole": "case.role",
  "home.availability.label": "hero.available",
};

/**
 * Rótulos da v1 que vêm mesmo sem personalização ("Habilidades", "Baixar CV (PDF)", "Fale
 * comigo"), quando diferem do padrão da v2: o site migrado fica com as palavras da v1.
 */
const V1_LABELS = [
  "resume.experience", "resume.education", "resume.skills", "resume.softSkills", "resume.courses", "resume.languages",
  "resume.volunteer", "resume.downloadCV", "resume.showOlder", "resume.hideOlder",
  "contactWizard.trigger", "sidebar.downloadCV", "testimonials.leaveTestimonial", "portfolio.screenshots", "blog.filterByTags",
  "notFound.cta",
];

/** Ajuste do texto da v1 ao formato da chave da v2 (a v2 mostra a contagem no próprio texto). */
const UI_TEXT_ADAPT: Record<string, (s: string) => string> = {
  "resume.showOlder": (s) => (s.includes("{count}") ? s : `${s} ({count})`),
};

/**
 * Depoimentos da home: o bloco mostra os destacados (`featured`, o "mostrar na home" da
 * v1). Se nenhum estava marcado na v1, a home mostrava todos: o bloco ganha uma fonte
 * sem o filtro, senão ficaria vazio.
 */
function homeTestimonialsSource(ctx: Ctx, path: string, block: RecipeBlock): { source?: RecipeBlock["source"] } {
  if (path !== "/" || block.type !== "depoimentos" || block.source) return {};
  const list = (ctx.tables.testimonials ?? []).filter((d) => d.deletedAt === undefined);
  if (!list.length || list.some((d) => d.showOnHome === true)) return {};
  const { featured: _featured, ...all } = CORE_BLOCKS.find((b) => b.type === "depoimentos")?.source?.default ?? { collection: "testimonials" as const, sort: "order" as const };
  void _featured;
  return { source: all as RecipeBlock["source"] };
}

function buildPages(ctx: Ctx, input: ConvertInput, plugins: Record<string, boolean>, report: MigrationReport): Doc[] {
  const allowed = (type: string) => {
    const def = CORE_BLOCKS.find((b) => b.type === type);
    if (!def) return "bloco desconhecido no núcleo";
    if (def.category === "empresa") return "bloco da linha empresa";
    if (def.plugin && plugins[def.plugin] === false) return `plugin ${def.plugin} desligado na v1`;
    return null;
  };
  const now = input.now ?? Date.now();
  const pages: Doc[] = [];
  for (const page of input.recipe) {
    const fillers = SECTION_FILLERS[page.path];
    const seen = new Map<string, number>();
    const kept: RecipeBlock[] = [];
    const dropped: PageReport["dropped"] = [];
    for (const block of page.blocks) {
      const n = seen.get(block.type) ?? 0;
      seen.set(block.type, n + 1);
      const reason = allowed(block.type);
      if (reason) {
        dropped.push({ type: block.type, reason });
        continue;
      }
      const filler = fillers?.[block.type];
      const fill = Array.isArray(filler) ? filler[n] : n === 0 ? filler : undefined;
      if (!fillers) {
        // Página que a v1 não tinha (ex.: privacidade): fica com o texto da receita.
        kept.push({ ...block, fields: localizeRecipeValue(block.fields ?? {}, LOCALES.locales) as Doc });
        continue;
      }
      if (!fill) {
        dropped.push({ type: block.type, reason: "a v1 não tinha esta seção nesta página" });
        continue;
      }
      const fields = fill(ctx, plugins, page.blocks);
      if (!fields) {
        dropped.push({ type: block.type, reason: "sem conteúdo na v1" });
        continue;
      }
      // Campos estruturais da receita (variação, booleanos) ficam; textos de exemplo, não.
      const structural = Object.fromEntries(Object.entries(block.fields ?? {}).filter(([, v]) => typeof v === "boolean" || (typeof v === "string" && !isLocalizedValue(v))));
      kept.push({ ...block, fields: { ...structural, ...fields }, ...homeTestimonialsSource(ctx, page.path, block) });
    }
    // Confere cada bloco com o contrato (campos obrigatórios, tamanhos): o import não passa pelas mutations.
    for (let i = kept.length - 1; i >= 0; i--) {
      const block = kept[i]!;
      const def = CORE_BLOCKS.find((b) => b.type === block.type)!;
      const errors = validateBlock(def, { id: "x", fields: block.fields ?? {}, ...(block.source && { source: block.source }) });
      if (errors.length) {
        dropped.push({ type: block.type, reason: `campos inválidos: ${errors.map((e) => `${e.path} ${e.message}`).join("; ")}` });
        kept.splice(i, 1);
      }
    }
    if (!kept.length) {
      report.pages.push({ path: page.path, blocks: [], dropped });
      continue;
    }
    const metaFor = PAGE_META[page.path];
    const m = metaFor ? metaFor(ctx) : { title: localizeRecipeValue(page.title, LOCALES.locales) as Loc };
    const title = hasText(m.title) ? m.title : (localizeRecipeValue(page.title, LOCALES.locales) as Loc);
    const ids = blockIds(kept);
    pages.push(
      compact({
        path: page.path,
        title,
        seo: m.seo && Object.keys(m.seo).length ? m.seo : undefined,
        // `fields` é obrigatório no schema, mesmo vazio: fica fora do compact (que tira objetos vazios).
        // A receita do tema pode trazer o bloco escondido (ex.: o contato da home num tema com a janela de contato).
        blocks: kept.map((b, i) => ({ ...compact({ id: ids[i], type: b.type, variant: b.variant, visible: b.visible !== false, source: b.source }), fields: b.fields ?? {} })),
        published: true,
        system: true,
        createdAt: now,
        updatedAt: now,
      }),
    );
    report.pages.push({ path: page.path, blocks: kept.map((b) => b.type), dropped });
  }
  return pages;
}

// ── Assistente de contato da v1 ─────────────────────────────────────────────

type V1Step = { kind: "choice" | "text" | "textarea" | "contact"; key?: string; n?: number; options?: string[]; placeholders?: string[]; askPhone?: boolean; askLinkedin?: boolean; askCompany?: boolean };

/**
 * Os quatro fluxos do ContactWizard da v1 (fixos no código; os textos vêm de
 * `contactWizard.*`). As chaves das respostas são as da v1, as mesmas dos contatos
 * migrados. O texto livre do networking era `topic`, que na v2 é o assunto: vira `subject`.
 */
const V1_WIZARD_FLOWS: { id: string; emoji: string; steps: V1Step[] }[] = [
  {
    id: "project",
    emoji: "💼",
    steps: [
      { kind: "choice", key: "projectType", n: 1, options: ["webapp", "mobile", "landing", "system", "consulting", "other"] },
      { kind: "choice", key: "timeline", n: 2, options: ["urgent", "short", "medium", "flexible"] },
      { kind: "choice", key: "budget", n: 3, options: ["small", "medium", "large", "enterprise", "unknown"] },
      { kind: "textarea", key: "description", n: 4, placeholders: ["placeholder"] },
      { kind: "contact", askPhone: true, askLinkedin: true },
    ],
  },
  {
    id: "job",
    emoji: "🧑‍💼",
    steps: [
      { kind: "choice", key: "contractType", n: 1, options: ["clt", "pj", "freelance"] },
      { kind: "choice", key: "modality", n: 2, options: ["remote", "hybrid", "onsite"] },
      { kind: "choice", key: "area", n: 3, options: ["frontend", "fullstack", "techlead"] },
      { kind: "text", key: "jobCompany,jobRole", n: 4, placeholders: ["companyPlaceholder", "rolePlaceholder"] },
      { kind: "contact", askLinkedin: true },
    ],
  },
  {
    id: "networking",
    emoji: "🤝",
    steps: [
      { kind: "choice", key: "howFound", n: 1, options: ["blog", "linkedin", "referral", "portfolio"] },
      { kind: "textarea", key: "subject", n: 2, placeholders: ["placeholder"] },
      { kind: "contact", askLinkedin: true },
    ],
  },
  {
    id: "feedback",
    emoji: "💬",
    steps: [
      { kind: "choice", key: "about", n: 1, options: ["post", "project", "general"] },
      { kind: "textarea", key: "message", n: 2, placeholders: ["placeholder"] },
      { kind: "contact" },
    ],
  },
];

/** Linhas por idioma (uma por texto); a que falta num idioma usa o português, para as linhas não desalinharem. */
function locLines(texts: Loc[]): Loc {
  const out: Loc = {};
  for (const locale of [PT, EN]) {
    const lines = texts.map((t) => t[locale] ?? t[PT] ?? "").filter(Boolean);
    if (lines.length) out[locale] = lines.join("\n");
  }
  return out;
}

/** Opções de uma etapa de escolha: as do template e as que o site acrescentou (siteTexts ou arquivo). */
function wizardOptions(ctx: Ctx, prefix: string, defaults: string[]): Loc {
  const extra = [...ctx.siteTexts.keys(), ...Object.keys(ctx.projectTexts)]
    .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes("."))
    .map((k) => k.slice(prefix.length));
  const ids = [...new Set([...defaults, ...extra])];
  return locLines(ids.map((id) => ctx.t(`${prefix}${id}`)).filter(hasText));
}

/**
 * Bloco de contato do assistente da v1: numa janela (a v1 abria o assistente num modal, sem
 * seção de contato na página), com o caminho "portfolio / contato", o título e o apoio do
 * assistente e os quatro fluxos como assuntos.
 */
function contactWizardFields(ctx: Ctx): Doc {
  const flows = V1_WIZARD_FLOWS.map((flow) => ({
    id: flow.id,
    emoji: flow.emoji,
    label: ctx.t(`contactWizard.flows.${flow.id}.label`),
    steps: flow.steps.map((step) => {
      if (step.kind === "contact") {
        return compact({ kind: "contact", title: ctx.t("contactWizard.contact.title"), askPhone: step.askPhone, askLinkedin: step.askLinkedin, askCompany: step.askCompany });
      }
      const base = `contactWizard.${flow.id}.step${step.n}`;
      const placeholder = step.placeholders ? locLines(step.placeholders.map((p) => ctx.t(`${base}.${p}`)).filter(hasText)) : {};
      return compact({
        kind: step.kind,
        key: step.key,
        title: ctx.t(`${base}.title`),
        options: step.options ? wizardOptions(ctx, `${base}.options.`, step.options) : undefined,
        placeholder: hasText(placeholder) ? placeholder : undefined,
      });
    }),
  }));
  return compact({
    anchor: "contato",
    presentation: "dialog",
    eyebrow: { [PT]: "portfolio / contato", [EN]: "portfolio / contato" },
    title: ctx.t("contactWizard.title"),
    intro: ctx.t("contactWizard.subtitle"),
    mode: "wizard",
    showChannels: false,
    flows,
  });
}

/**
 * Textos de interface do assistente da v1 que a janela usa ("Passo 1 de 6", "Próximo",
 * o resumo, o sucesso). Vão sempre que o assistente está ligado, mesmo sem personalização:
 * são o texto que o site mostrava, diferente do padrão da v2 ("Etapa", "Continuar").
 */
function wizardUiTexts(ctx: Ctx): { v1: string; v2: string; value: Loc }[] {
  const step = ctx.t("contactWizard.step");
  const of = ctx.t("contactWizard.of");
  const stepOf: Loc = {};
  for (const locale of [PT, EN]) if (step[locale] && of[locale]) stepOf[locale] = `${step[locale]} {current} ${of[locale]} {total}`;
  const pairs: [string, string][] = [
    ["contactWizard.next", "form.next"],
    ["contactWizard.back", "form.back"],
    ["contactWizard.submit", "form.send"],
    ["contactWizard.submitting", "form.sending"],
    ["contactWizard.successTitle", "contactForm.success"],
    ["contactWizard.successBody", "contactForm.successBody"],
    ["contactWizard.summary.title", "contactForm.summary"],
    ["contactWizard.summary.type", "contactForm.summaryTopic"],
    ["contactWizard.summary.contact", "contactForm.summaryContact"],
    ["common.close", "contactForm.close"],
  ];
  return [{ v1: "contactWizard.step + contactWizard.of", v2: "form.step", value: stepOf }, ...pairs.map(([v1, v2]) => ({ v1, v2, value: ctx.t(v1) }))].filter((p) => hasText(p.value));
}

function buildUiTexts(ctx: Ctx, report: MigrationReport, now: number, plugins: Record<string, boolean> = {}): Doc[] {
  const out: Doc[] = [];
  const availability = ctx.home.get("availability_status") as Doc | undefined;
  const fromHome = availability?.label ? locAny(availability.label) : {};
  if (hasText(fromHome)) {
    out.push({ key: "hero.available", value: fromHome, updatedAt: now });
    report.texts.ui.push({ v1: "homeContent.availability_status", v2: "hero.available" });
  }
  for (const key of ctx.textKeys()) {
    if (!ctx.customized(key)) continue;
    if (SECTION_KEYS.has(key)) continue;
    const v2 = UI_TEXT_MAP[key];
    if (v2) {
      if (out.some((t) => t.key === v2)) continue;
      out.push({ key: v2, value: adaptText(key, ctx.t(key)), updatedAt: now });
      report.texts.ui.push({ v1: key, v2 });
    } else if (!key.startsWith("admin.")) {
      report.texts.unmapped.push({ key, pt: String(ctx.siteTexts.get(key)?.ptBR ?? ctx.projectTexts[key]?.pt ?? "").slice(0, 120) });
    }
  }
  for (const key of V1_LABELS) {
    const v2 = UI_TEXT_MAP[key]!;
    if (out.some((t) => t.key === v2)) continue;
    const value = adaptText(key, ctx.t(key));
    if (!hasText(value)) continue;
    if (Object.entries(value).every(([locale, text]) => text === defaultUiText(v2, locale as Locale))) continue;
    out.push({ key: v2, value, updatedAt: now });
    report.texts.ui.push({ v1: key, v2 });
  }
  if (plugins["contact-wizard"] !== false) {
    for (const { v1, v2, value } of wizardUiTexts(ctx)) {
      if (out.some((t) => t.key === v2)) continue;
      out.push({ key: v2, value, updatedAt: now });
      report.texts.ui.push({ v1, v2 });
    }
  }
  return out;
}

function adaptText(key: string, value: Loc): Loc {
  const adapt = UI_TEXT_ADAPT[key];
  return adapt ? mapLoc(value, adapt) : value;
}

export function convertV1(input: ConvertInput): ConvertResult {
  const t = input.tables;
  const ctx = new Ctx(t, input.projectTexts, input.storage);
  const report: MigrationReport = { tables: [], pages: [], texts: { sectionKeys: 0, ui: [], unmapped: [] }, plugins: [], pending: [], dropped: [], unknownTables: [], warnings: ctx.warnings };
  const now = input.now ?? Date.now();
  const out: Record<string, Doc[]> = {};
  const sources: Record<string, string> = {};
  const put = (v2: string, from: string, docs: Doc[]) => {
    out[v2] = docs;
    if (from) sources[v2] = from;
    report.tables.push({ v2, from: from || "(montada)", count: docs.length });
  };

  put("users", "users", (t.users ?? []).map((d) => ({ ...d })));
  put("authAccounts", "authAccounts", (t.authAccounts ?? []).map((d) => ({ ...d })));
  put("userRoles", "userRoles", (t.userRoles ?? []).map((d) => ({ ...d })));
  put("posts", "posts", convertPosts(ctx, t.posts ?? []));
  put("projects", "projects", convertProjects(ctx, t.projects ?? []));
  put("services", "services", (t.services ?? []).map((d) => compact({ ...meta(d), title: loc(d.title, d.titleTranslations), description: loc(d.description, d.descriptionTranslations), order: d.orderIndex, ...lifecycle(d) })));
  put(
    "testimonials",
    "testimonials",
    (t.testimonials ?? []).map((d) =>
      compact({ ...meta(d), quote: loc(d.text, d.textTranslations), author: d.name, role: loc(d.role, d.roleTranslations), avatar: ctx.image(d.imageId, d.imageUrl), featured: d.showOnHome === true ? true : undefined, tags: str(d.category) ? [d.category] : undefined, order: d.orderIndex, ...lifecycle(d) }),
    ),
  );
  put("faq", "aboutFaq", (t.aboutFaq ?? []).map((d) => compact({ ...meta(d), question: loc(d.question, d.questionTranslations), answer: mapLoc(loc(d.answer, d.answerTranslations), (s) => s), order: d.displayOrder, ...lifecycle(d) })));
  const routine = t.aboutDailyRoutine ?? [];
  // O tamanho no mosaico da v1 (`spanSize`, ou `span_size` em exports antigos) vira o `span` do item.
  const span = (d: Doc) => {
    const s = str(d.spanSize) || str(d.span_size);
    return s === "1x2" || s === "2x1" || s === "2x2" ? s : undefined;
  };
  put("routine", "aboutDailyRoutine", routine.map((d) => compact({ ...meta(d), title: loc(d.description, d.descriptionTranslations), image: ctx.image(d.imageId, d.imageUrl), span: span(d), order: d.displayOrder, ...lifecycle(d) })));
  put("resumeItems", "resumeItems", convertResume(ctx, t.resumeItems ?? []));
  put(
    "media",
    "imageMetadata",
    (t.imageMetadata ?? []).map((d) =>
      compact({ ...meta(d), storageId: d.storageId, name: d.displayName, folder: (d.folderId && ctx.folders.get(d.folderId)) || "/", alt: d.altText ? loc(d.altText) : undefined, width: d.width, height: d.height, size: d.fileSize, contentType: d.mimeType, createdAt: d.createdAt ?? d._creationTime, createdBy: d.createdBy, updatedAt: d.updatedAt }),
    ),
  );
  put("auditLog", "auditLog", (t.auditLog ?? []).map((d) => ({ ...d })));

  const plugins = convertPlugins(ctx);
  report.plugins = plugins.report;
  const settings = convertSettings(ctx, input, plugins.record);
  const pages = buildPages(ctx, input, plugins.record, report);
  settings.navigation = v1Navigation(navigationFromPages(pages as never) as Doc[]);
  put("siteSettings", "", [compact({ ...settings, updatedAt: now })]);
  put("pages", "", pages);
  put("uiTexts", "", buildUiTexts(ctx, report, now, plugins.record));
  report.texts.sectionKeys = [...ctx.siteTexts.keys()].filter((k) => SECTION_KEYS.has(k)).length;
  if (input.projectTexts) report.texts.projectKeys = Object.keys(input.projectTexts).filter((k) => ctx.fileCustomized(k)).length;

  const business = convertBusiness(t, now);
  for (const row of business.report.tables) put(row.v2, row.from, business.tables[row.v2]!);
  report.dropped.push(...business.report.dropped);
  report.pending.push(...business.report.pending);
  ctx.warnings.push(...business.report.warnings);
  const pending = business.pending;

  const known = new Set<string>([...Object.keys(TABLE_MAP), ...BUSINESS_TABLES, ...Object.keys(DROPPED_TABLES)]);
  for (const [table, docs] of Object.entries(t)) {
    if (table.startsWith("_")) continue;
    if (table in DROPPED_TABLES) report.dropped.push({ table, count: docs.length, reason: DROPPED_TABLES[table]! });
    else if (!known.has(table)) report.unknownTables.push({ table, count: docs.length });
  }
  for (const u of report.unknownTables) ctx.warnings.push(`Tabela própria do projeto na v1 (${u.table}, ${u.count} documentos): não convertida. Leve-a para o convex/ do projeto v2 (schema e funções) e importe à parte.`);
  return { tables: out, sources, pending, report };
}
