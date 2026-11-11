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
  /**
   * Categoria do projeto ("Produto", "Site institucional"), por idioma. Uma só por projeto:
   * o tema pode agrupar ou filtrar o portfólio por ela. As etiquetas continuam em `tags`.
   */
  category?: Localized<string>;
  links?: RawLink[];
  /** Número de destaque mostrado no card do case. */
  metric?: { value: string; label: Localized<string> };
  /**
   * Números do case ("Resultados em números"), em ordem, com ícone opcional (nome do Lucide,
   * como `Bot` ou `shield-check`). Sem `metric`, o primeiro é o número do card.
   */
  metrics?: CaseMetric[];
  seo?: SeoFields;
  updatedAt?: number;
}

export interface CaseMetric {
  value: string;
  label: Localized<string>;
  icon?: string;
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

/**
 * Tipos de item do currículo. `soft-skill` são as competências comportamentais (liderança,
 * comunicação) e `volunteer`, o trabalho voluntário: o tema os mostra à parte.
 */
export type ResumeKind = "experience" | "volunteer" | "education" | "skill" | "soft-skill" | "certification" | "language";

export interface RawResumeItem extends Base {
  kind: ResumeKind;
  title: Localized<string>;
  organization?: string;
  location?: Localized<string>;
  /** "AAAA-MM". */
  start?: string;
  end?: string;
  description?: Localized<string>;
  /**
   * Grupo do item no currículo, por idioma: agrupa as competências ("IA", "Front-end",
   * "Ferramentas"), como o `group` das skills da v1. Vale para qualquer tipo.
   */
  group?: Localized<string>;
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
  /** Telefone e WhatsApp públicos (aparecem na casca, ex.: sidebar do tema padrão). */
  phone?: string;
  whatsapp?: string;
  photo?: RawImage;
}

/** Textura por cima da página inteira (como na v1): grão de filme, papel ou scanlines. */
export type Texture = "none" | "grain" | "paper" | "scanlines";

export const TEXTURES: readonly Texture[] = ["none", "grain", "paper", "scanlines"];

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
  /** Textura da página. Sem ela, vale a do tema (`texture`); `none` desliga. */
  texture?: Texture;
}

/**
 * WhatsApp do site inteiro: o botão flutuante (opcional) e o endereço `whatsapp:` dos
 * campos de link, que vira `https://wa.me/<número>?text=<mensagem no idioma>`.
 */
export interface WhatsAppSettings {
  /** Formato internacional, só dígitos (DDI, DDD e número): `5511999999999`. O backend normaliza. */
  number: string;
  /** Mensagem que já vem escrita na conversa, por idioma. Sem tradução no idioma, abre sem mensagem. */
  message?: Localized<string>;
  /** Mostra o botão flutuante em todas as páginas do site (menos as do app: proposta, checkout). */
  floating: boolean;
  /** Texto visível do botão flutuante, por idioma. Sem ele, só o ícone (com nome acessível padrão). */
  label?: Localized<string>;
}

export type AnnouncementTone = "info" | "destaque";

export const ANNOUNCEMENT_TONES: readonly AnnouncementTone[] = ["info", "destaque"];

/**
 * Faixa de aviso no topo de todas as páginas (menos as do app). O período é avaliado no
 * BUILD: o aviso entra ou sai do ar na primeira publicação depois da data.
 */
export interface Announcement {
  enabled: boolean;
  /** Sem texto no idioma, a faixa não aparece nele (decisão 28). */
  text: Localized<string>;
  /** Link depois do texto. Sem rótulo no idioma, a faixa aparece sem ele. */
  link?: RawLink;
  /** `info` (padrão): discreta, nas cores de superfície. `destaque`: na cor de destaque. */
  tone?: AnnouncementTone;
  /** Início e fim: `AAAA-MM-DD` (o dia inteiro, em UTC) ou data e hora ISO com fuso (`2026-12-01T09:00-03:00`). */
  startsAt?: string;
  endsAt?: string;
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
  /**
   * Logo do site (lockup com o nome). O tema decide onde mostrar; sem logo, mostra o nome.
   * `dark` é a versão para fundo escuro, quando difere.
   */
  logo?: RawImage & { dark?: RawImage };
  twitterHandle?: string;
  /** Favicon, ícone da tela inicial e ícones do manifest. Todos opcionais. */
  icons?: SiteIcons;
  /**
   * Cor da barra do navegador (`theme-color`) e do manifest, por modo de cor (`#0a0a0a`).
   * Sem ela, vale o fundo do esquema de cor do site naquele modo.
   */
  themeColor?: { light?: string; dark?: string };
  /** Feed RSS do blog (`/rss.xml`). Sem título ou descrição, valem os do site. */
  rss?: { title?: Localized<string>; description?: Localized<string> };
  /** Capa (e imagem de compartilhamento) dos posts que não têm capa própria. */
  defaultPostCover?: RawImage;
  /**
   * Analytics (plugin `analytics`, Umami). Sem os dois campos, valem as variáveis
   * `PUBLIC_UMAMI_SCRIPT_URL` e `PUBLIC_UMAMI_WEBSITE_ID` do build.
   */
  analytics?: { scriptUrl?: string; websiteId?: string };
  /** WhatsApp do site: botão flutuante e links `whatsapp:`. */
  whatsapp?: WhatsAppSettings;
  /** Faixa de aviso no topo das páginas. */
  announcement?: Announcement;
}

/** Ícones do site no `<head>` e no `manifest.webmanifest`. */
export interface SiteIcons {
  /** Favicon vetorial (SVG). */
  svg?: RawImage;
  /** Favicon em PNG ou ICO, para navegadores sem SVG (32×32 ou 48×48). */
  favicon?: RawImage;
  /** Ícone da tela inicial do iPhone e do iPad (`apple-touch-icon`, PNG 180×180). */
  apple?: RawImage;
  /** Ícones do manifest (PNG 192×192 e 512×512). */
  icon192?: RawImage;
  icon512?: RawImage;
  /** Ícone "maskable" do Android (PNG 512×512, com margem de segurança). */
  maskable?: RawImage;
}

/** Textos de interface (menu, "ler mais", formulários, 404): chave → texto por idioma. */
export type UiTexts = Record<string, Localized<string>>;

export type { Locale };
