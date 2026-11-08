/**
 * Modelo de conteúdo da v2 (RFC: "Conteúdo: coleções e blocos").
 *
 * Tudo aqui é o formato "cru", como sai do backend (ou dos fixtures): textos são
 * `Localized`. A resolução por idioma fica em `render/`.
 */
import type { Locale, LocaleConfig, Localized } from "../i18n";
import type { RawImage, RawLink } from "../blocks/fields";

export type SiteKind = "pessoal" | "empresa";

// ── Páginas e blocos ────────────────────────────────────────────────────────

export const COLLECTIONS = [
  "posts",
  "projects",
  "services",
  "testimonials",
  "faq",
  "resume",
  "routine",
  "plans",
  "team",
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

/** O que um bloco que lista itens mostra de uma coleção. */
export interface CollectionQuery {
  collection: CollectionName;
  /** Itens escolhidos à mão, nessa ordem. Ignora os filtros abaixo. */
  ids?: string[];
  featured?: boolean;
  tags?: string[];
  limit?: number;
  /** `recent`: mais novos primeiro. `order`: ordem definida no painel. Padrão: `order`. */
  sort?: "recent" | "order";
}

export interface BlockInstance {
  /** Estável entre edições (âncora, chave no React, referência no MCP). */
  id: string;
  type: string;
  /** Variação declarada pelo tema (decisão 23). Ausente ou desconhecida = padrão. */
  variant?: string;
  visible: boolean;
  fields: Record<string, unknown>;
  source?: CollectionQuery;
}

export interface SeoFields {
  title?: Localized<string>;
  description?: Localized<string>;
  image?: RawImage;
  noindex?: boolean;
}

export interface PageRecord {
  id: string;
  /** Caminho sem idioma: "/" (home), "/sobre", "/precos". */
  path: string;
  /** Página de um ponto de partida (home, sobre…): pode ser editada, não apagada. */
  system?: boolean;
  /** Existe nos idiomas em que o título está traduzido (decisão 28). */
  title: Localized<string>;
  seo?: SeoFields;
  blocks: BlockInstance[];
  published: boolean;
  updatedAt: number;
}

// ── Coleções (formato cru) ──────────────────────────────────────────────────

interface Base {
  id: string;
  /** Posição definida no painel (`sort: "order"`). */
  order?: number;
  featured?: boolean;
  tags?: string[];
}

export interface RawPost extends Base {
  slug: string;
  title: Localized<string>;
  excerpt?: Localized<string>;
  /** HTML sanitizado no backend ao salvar. */
  content: Localized<string>;
  cover?: RawImage;
  seo?: SeoFields;
  /** Epoch ms. Só posts publicados chegam ao site. */
  publishedAt: number;
  updatedAt?: number;
  author?: string;
}

export interface CaseSection {
  title: Localized<string>;
  body: Localized<string>;
  image?: RawImage;
}

export interface RawProject extends Base {
  slug: string;
  title: Localized<string>;
  summary?: Localized<string>;
  /** HTML longo do case, quando não usa seções. */
  content?: Localized<string>;
  sections?: CaseSection[];
  cover?: RawImage;
  gallery?: RawImage[];
  client?: string;
  year?: number;
  role?: Localized<string>;
  links?: RawLink[];
  seo?: SeoFields;
  updatedAt?: number;
}

export interface RawService extends Base {
  title: Localized<string>;
  description?: Localized<string>;
  icon?: string;
  priceLabel?: Localized<string>;
}

export interface RawTestimonial extends Base {
  quote: Localized<string>;
  author: string;
  role?: Localized<string>;
  company?: string;
  avatar?: RawImage;
}

export interface RawFaq extends Base {
  question: Localized<string>;
  answer: Localized<string>;
}

export type ResumeKind = "experience" | "education" | "skill" | "certification" | "language";

export interface RawResumeItem extends Base {
  kind: ResumeKind;
  title: Localized<string>;
  organization?: string;
  location?: Localized<string>;
  /** "AAAA-MM". */
  start?: string;
  end?: string;
  description?: Localized<string>;
}

export interface RawRoutineItem extends Base {
  title: Localized<string>;
  description?: Localized<string>;
  image?: RawImage;
}

export type PricePeriod = "month" | "year" | "once" | "hour" | "project";

export interface RawPlan extends Base {
  name: Localized<string>;
  description?: Localized<string>;
  /** Em centavos. Ausente = "sob consulta" (usa `priceLabel`). */
  priceCents?: number;
  currency?: string;
  period?: PricePeriod;
  priceLabel?: Localized<string>;
  features: Localized<string>[];
  highlighted?: boolean;
  cta?: RawLink;
}

export interface RawTeamMember extends Base {
  name: string;
  role: Localized<string>;
  bio?: Localized<string>;
  photo?: RawImage;
  links?: RawLink[];
}

export interface RawCollections {
  posts: RawPost;
  projects: RawProject;
  services: RawService;
  testimonials: RawTestimonial;
  faq: RawFaq;
  resume: RawResumeItem;
  routine: RawRoutineItem;
  plans: RawPlan;
  team: RawTeamMember;
}

// ── Site ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: Localized<string>;
  href: string;
}

export interface SocialLink {
  network: string;
  url: string;
}

/** Dados da empresa (linha empresa): rodapé, contato e JSON-LD Organization/LocalBusiness. */
export interface Organization {
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: {
    street?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  /** Ex.: [{ days: "Mo-Fr", opens: "09:00", closes: "18:00" }] (formato schema.org). */
  openingHours?: { days: string; opens: string; closes: string }[];
  mapUrl?: string;
  /** Tipo schema.org: "Organization", "LocalBusiness", "ProfessionalService"… */
  schemaType?: string;
}

/** Dono do site (linha pessoal): JSON-LD Person, autor dos posts. */
export interface Person {
  name: string;
  jobTitle?: Localized<string>;
  email?: string;
  photo?: RawImage;
}

export interface Appearance {
  colorMode: "dark" | "light" | "system";
  colorToggle: boolean;
  /**
   * Esquema de cor (`theme/schemes.ts`): id de um dos esquemas do núcleo. Vale sobre os
   * tokens do tema e sob `tokens`. Sem ele, vale o `scheme` do tema (se houver).
   */
  scheme?: string;
  /** Tokens do tema sobrescritos no painel (nome do token → valor CSS). */
  tokens?: Record<string, string>;
  /** Família do Google Fonts para o texto (baixada no build e servida localmente). */
  fontSans?: string;
  /** Família do Google Fonts para código e detalhes em monoespaçada. */
  fontMono?: string;
}

export interface SiteSettings {
  kind: SiteKind;
  name: Localized<string>;
  description: Localized<string>;
  /** URL pública sem barra no final. */
  url: string;
  locales: LocaleConfig;
  theme: string;
  appearance: Appearance;
  navigation: NavItem[];
  social: SocialLink[];
  person?: Person;
  organization?: Organization;
  /** Plugins ligados (id → ligado). */
  plugins: Record<string, boolean>;
  /** Base das páginas de detalhe. Padrão: posts em `/blog`, projetos em `/portfolio` (URLs da v1). */
  paths?: { posts?: string; projects?: string };
  /** Imagem padrão de compartilhamento. */
  ogImage?: RawImage;
  twitterHandle?: string;
}

/** Textos de interface (menu, "ler mais", formulários, 404): chave → texto por idioma. */
export type UiTexts = Record<string, Localized<string>>;

export type { Locale };
