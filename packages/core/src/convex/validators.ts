/**
 * Validadores do Convex que espelham o modelo de conteúdo de `content/types.ts`.
 * Usados no schema e nos argumentos das funções.
 */
import { v, type Infer } from "convex/values";
import type { CollectionName } from "../content/types";
import type { Role } from "./lib/roles";

/** Texto traduzível: idioma (BCP 47) → texto (decisão 26). */
export const vLocalized = v.record(v.string(), v.string());

export const vRole = v.union(
  v.literal("root"),
  v.literal("admin"),
  v.literal("content-editor"),
  v.literal("blog-editor"),
  v.literal("proposal-editor"),
  v.literal("comercial"),
);

/** Imagem guardada no conteúdo. `url` é refeita a partir do `storageId` no snapshot. */
export const vImage = v.object({
  url: v.string(),
  storageId: v.optional(v.id("_storage")),
  alt: v.optional(vLocalized),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
});

/** Logo do site: imagem com versão opcional para fundo escuro. */
export const vLogo = v.object({ ...vImage.fields, dark: v.optional(vImage) });

export const vLink = v.object({ label: vLocalized, href: v.string() });

export const vSeo = v.object({
  title: v.optional(vLocalized),
  description: v.optional(vLocalized),
  image: v.optional(vImage),
  noindex: v.optional(v.boolean()),
});

export const vCollectionName = v.union(
  v.literal("posts"),
  v.literal("projects"),
  v.literal("services"),
  v.literal("testimonials"),
  v.literal("faq"),
  v.literal("resume"),
  v.literal("routine"),
  v.literal("plans"),
  v.literal("team"),
);

export const vCollectionQuery = v.object({
  collection: vCollectionName,
  ids: v.optional(v.array(v.string())),
  featured: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
  limit: v.optional(v.number()),
  sort: v.optional(v.union(v.literal("recent"), v.literal("order"))),
});

/** Bloco da página. Os campos são conferidos com `validateBlock` ao gravar. */
export const vBlock = v.object({
  id: v.string(),
  type: v.string(),
  variant: v.optional(v.string()),
  visible: v.boolean(),
  fields: v.record(v.string(), v.any()),
  source: v.optional(vCollectionQuery),
});

// ── Configurações do site ───────────────────────────────────────────────────

export const vSiteKind = v.union(v.literal("pessoal"), v.literal("empresa"));

export const vLocaleConfig = v.object({
  locales: v.array(v.string()),
  default: v.string(),
  prefixes: v.optional(v.record(v.string(), v.string())),
});

export const vAppearance = v.object({
  colorMode: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
  colorToggle: v.boolean(),
  /** Esquema de cor (id de `SCHEMES`, `theme/schemes.ts`). Sem ele, vale o do tema. */
  scheme: v.optional(v.string()),
  tokens: v.optional(v.record(v.string(), v.string())),
  fontSans: v.optional(v.string()),
  fontMono: v.optional(v.string()),
  /** Textura da página; sem ela, a do tema. */
  texture: v.optional(v.union(v.literal("none"), v.literal("grain"), v.literal("paper"), v.literal("scanlines"))),
});

export const vNavItem = v.object({ label: vLocalized, href: v.string() });
export const vSocialLink = v.object({ network: v.string(), url: v.string() });

export const vPerson = v.object({
  name: v.string(),
  jobTitle: v.optional(vLocalized),
  email: v.optional(v.string()),
  photo: v.optional(vImage),
});

export const vOrganization = v.object({
  legalName: v.optional(v.string()),
  taxId: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  whatsapp: v.optional(v.string()),
  address: v.optional(
    v.object({
      street: v.optional(v.string()),
      locality: v.optional(v.string()),
      region: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
    }),
  ),
  openingHours: v.optional(v.array(v.object({ days: v.string(), opens: v.string(), closes: v.string() }))),
  mapUrl: v.optional(v.string()),
  schemaType: v.optional(v.string()),
});

/** WhatsApp do site (`WhatsAppSettings`). O número é normalizado para só dígitos ao gravar. */
export const vWhatsApp = v.object({
  number: v.string(),
  message: v.optional(vLocalized),
  floating: v.boolean(),
  label: v.optional(vLocalized),
});

/** Faixa de aviso (`Announcement`). As datas são conferidas ao gravar. */
export const vAnnouncement = v.object({
  enabled: v.boolean(),
  text: vLocalized,
  link: v.optional(vLink),
  tone: v.optional(v.union(v.literal("info"), v.literal("destaque"))),
  startsAt: v.optional(v.string()),
  endsAt: v.optional(v.string()),
});

/** Campos do `SiteSettings` (documento único da tabela `siteSettings`). */
export const siteSettingsFields = {
  kind: vSiteKind,
  name: vLocalized,
  description: vLocalized,
  url: v.string(),
  locales: vLocaleConfig,
  theme: v.string(),
  appearance: vAppearance,
  navigation: v.array(vNavItem),
  social: v.array(vSocialLink),
  person: v.optional(vPerson),
  organization: v.optional(vOrganization),
  plugins: v.record(v.string(), v.boolean()),
  paths: v.optional(v.object({ posts: v.optional(v.string()), projects: v.optional(v.string()) })),
  ogImage: v.optional(vImage),
  logo: v.optional(vLogo),
  twitterHandle: v.optional(v.string()),
  icons: v.optional(
    v.object({
      svg: v.optional(vImage),
      favicon: v.optional(vImage),
      apple: v.optional(vImage),
      icon192: v.optional(vImage),
      icon512: v.optional(vImage),
      maskable: v.optional(vImage),
    }),
  ),
  themeColor: v.optional(v.object({ light: v.optional(v.string()), dark: v.optional(v.string()) })),
  rss: v.optional(v.object({ title: v.optional(vLocalized), description: v.optional(vLocalized) })),
  defaultPostCover: v.optional(vImage),
  analytics: v.optional(v.object({ scriptUrl: v.optional(v.string()), websiteId: v.optional(v.string()) })),
  whatsapp: v.optional(vWhatsApp),
  announcement: v.optional(vAnnouncement),
};
export const vSiteSettings = v.object(siteSettingsFields);

// ── Coleções: campos de conteúdo (o que o painel envia) ─────────────────────

/** Comuns a todo item de coleção. */
export const itemFields = {
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
};

/** Sem o `slug`, que tem regra própria (estável, gerado na criação). */
export const postFields = {
  ...itemFields,
  title: vLocalized,
  excerpt: v.optional(vLocalized),
  /** HTML, sanitizado ao salvar. */
  content: vLocalized,
  cover: v.optional(vImage),
  seo: v.optional(vSeo),
  author: v.optional(v.string()),
};

export const vCaseSection = v.object({ title: vLocalized, body: vLocalized, image: v.optional(vImage) });

/** Número de destaque do case ("~50", "3x"), mostrado no card. */
export const vMetric = v.object({ value: v.string(), label: vLocalized });

export const projectFields = {
  ...itemFields,
  title: vLocalized,
  summary: v.optional(vLocalized),
  content: v.optional(vLocalized),
  sections: v.optional(v.array(vCaseSection)),
  cover: v.optional(vImage),
  gallery: v.optional(v.array(vImage)),
  client: v.optional(v.string()),
  year: v.optional(v.number()),
  role: v.optional(vLocalized),
  /** Categoria do projeto (uma por projeto), por idioma. */
  category: v.optional(vLocalized),
  links: v.optional(v.array(vLink)),
  metric: v.optional(vMetric),
  seo: v.optional(vSeo),
};

export const serviceFields = {
  ...itemFields,
  title: vLocalized,
  description: v.optional(vLocalized),
  icon: v.optional(v.string()),
  priceLabel: v.optional(vLocalized),
};

export const testimonialFields = {
  ...itemFields,
  quote: vLocalized,
  author: v.string(),
  role: v.optional(vLocalized),
  company: v.optional(v.string()),
  avatar: v.optional(vImage),
};

export const faqFields = {
  ...itemFields,
  question: vLocalized,
  answer: vLocalized,
};

export const vResumeKind = v.union(
  v.literal("experience"),
  v.literal("education"),
  v.literal("skill"),
  v.literal("certification"),
  v.literal("language"),
);

export const resumeItemFields = {
  ...itemFields,
  kind: vResumeKind,
  title: vLocalized,
  organization: v.optional(v.string()),
  location: v.optional(vLocalized),
  start: v.optional(v.string()),
  end: v.optional(v.string()),
  description: v.optional(vLocalized),
  /** Grupo do item (agrupa as competências), por idioma. */
  group: v.optional(vLocalized),
};

export const routineFields = {
  ...itemFields,
  title: vLocalized,
  description: v.optional(vLocalized),
  image: v.optional(vImage),
};

export const vPricePeriod = v.union(v.literal("month"), v.literal("year"), v.literal("once"), v.literal("hour"), v.literal("project"));

export const planFields = {
  ...itemFields,
  name: vLocalized,
  description: v.optional(vLocalized),
  priceCents: v.optional(v.number()),
  currency: v.optional(v.string()),
  period: v.optional(vPricePeriod),
  priceLabel: v.optional(vLocalized),
  features: v.array(vLocalized),
  highlighted: v.optional(v.boolean()),
  cta: v.optional(vLink),
};

export const teamMemberFields = {
  ...itemFields,
  name: v.string(),
  role: vLocalized,
  bio: v.optional(vLocalized),
  photo: v.optional(vImage),
  links: v.optional(v.array(vLink)),
};

/** Controle de publicação e lixeira, de todo item de coleção. */
export const lifecycleFields = {
  published: v.boolean(),
  createdAt: v.number(),
  createdBy: v.optional(v.id("users")),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
  deletedAt: v.optional(v.number()),
  deletedBy: v.optional(v.id("users")),
};

export type SiteSettingsValue = Infer<typeof vSiteSettings>;
export type ImageValue = Infer<typeof vImage>;
export type BlockValue = Infer<typeof vBlock>;

// Os validadores precisam acompanhar as listas do núcleo: erro de tipo aqui se divergirem.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _rolesMatch: Same<Infer<typeof vRole>, Role> = true;
const _collectionsMatch: Same<Infer<typeof vCollectionName>, CollectionName> = true;
void _rolesMatch;
void _collectionsMatch;
