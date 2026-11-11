/**
 * Como cada coleção aparece no painel: campos do formulário (mesmo schema de campos dos
 * blocos, então a validação, as abas por idioma e o "traduzir" vêm de graça), o que a
 * lista mostra e o que o formulário guarda em formato diferente do banco (galeria,
 * itens de plano, métrica). Puro: testável sem React.
 */
import { field, type FieldMap } from "../../blocks/fields";
import type { CollectionName } from "../../content/types";
import type { Localized } from "../../i18n";
import type { Values } from "../editor/model";
import { PERIOD_LABELS, textIn } from "../lib/format";

type Doc = Record<string, unknown>;

export interface CollectionConfig {
  name: CollectionName;
  /** Caminho da tela no painel. */
  base: string;
  /** Título da tela ("Blog") e nomes do item ("post", "posts"). */
  title: string;
  singular: string;
  plural: string;
  /** Gênero para os textos ("Novo post", "Nova pergunta"). */
  feminine?: boolean;
  description: string;
  /** Campos do formulário (formato do formulário, ver `toForm`). */
  fields: FieldMap;
  /** Campos do banco que o formulário controla (formato do documento). */
  docKeys: string[];
  /** Obrigatórios no banco: nunca vão para `unset`. */
  required: string[];
  slug?: boolean;
  seo?: boolean;
  tags?: boolean;
  featured?: boolean;
  /** Ordem manual (setas). Posts ordenam por data de publicação. */
  reorderable: boolean;
  defaultPublished: boolean;
  /** Onde o campo de capa/foto está (miniatura da lista). */
  imageKey?: string;
  /** Nome do item na lista. */
  label(doc: Doc, locale: string, fallback: string): string;
  /** Linha de apoio na lista. */
  subtitle?(doc: Doc, locale: string, fallback: string): string | undefined;
  /** Documento → formulário (campos que mudam de formato). */
  toForm?(doc: Doc): Values;
  /** Formulário → documento. */
  fromForm?(form: Values): Values;
  /** Texto do estado vazio. */
  empty: string;
  /** O que dizer ao mandar para a lixeira. */
  trashNote: string;
}

const L = (value: unknown): Localized<string> | undefined => (value && typeof value === "object" ? (value as Localized<string>) : undefined);

// ── Campos ──────────────────────────────────────────────────────────────────

const linksField = field.list({
  label: "Links",
  itemLabel: "Link",
  of: {
    label: field.text({ label: "Texto do link", required: true, maxLength: 60 }),
    href: field.text({ label: "Endereço", required: true, localized: false, help: "https://… ou /caminho" }),
  },
});

const POST_FIELDS: FieldMap = {
  title: field.text({ label: "Título", required: true, maxLength: 140 }),
  excerpt: field.text({ label: "Resumo", multiline: true, maxLength: 300, help: "Aparece na lista de posts e, sem descrição de SEO, no Google." }),
  cover: field.image({ label: "Capa" }),
  content: field.richText({ label: "Texto do post", required: true }),
  author: field.text({ label: "Autor", localized: false, help: "Vazio usa o nome do site." }),
};

const PROJECT_FIELDS: FieldMap = {
  title: field.text({ label: "Título", required: true, maxLength: 140 }),
  summary: field.text({ label: "Resumo", multiline: true, maxLength: 300, help: "Aparece no card do case." }),
  cover: field.image({ label: "Capa" }),
  client: field.text({ label: "Cliente", localized: false }),
  year: field.number({ label: "Ano", integer: true, min: 1990, max: 2100 }),
  role: field.text({ label: "Seu papel", maxLength: 100, help: "Ex.: Design e front-end." }),
  category: field.text({ label: "Categoria", maxLength: 60, help: "Uma por projeto (ex.: Produto, Site institucional). Alguns temas agrupam o portfólio por ela." }),
  metricValue: field.text({ label: "Número de destaque", localized: false, maxLength: 12, help: "Aparece no card do case. Ex.: ~50, 3x, 98%." }),
  metricLabel: field.text({ label: "O que o número mede", maxLength: 60, help: "Ex.: skills em produção. Sem os dois, o card não mostra o número." }),
  content: field.richText({ label: "Texto do case", help: "Use quando o case é um texto corrido. Com seções, deixe vazio." }),
  sections: field.list({
    label: "Seções do case",
    itemLabel: "Seção",
    help: "Contexto, decisões, resultado… Cada uma aparece em ordem na página do case.",
    of: {
      title: field.text({ label: "Título da seção", required: true, maxLength: 100 }),
      body: field.richText({ label: "Texto", required: true }),
      image: field.image({ label: "Imagem da seção" }),
    },
  }),
  metrics: field.list({
    label: "Resultados em números",
    itemLabel: "Número",
    help: "Os números do case, em ordem. Sem número de destaque, o primeiro aparece no card.",
    of: {
      value: field.text({ label: "Número", required: true, localized: false, maxLength: 40, help: "Ex.: ~50, 3x, 98%." }),
      label: field.text({ label: "O que o número mede", required: true, maxLength: 100 }),
      icon: field.text({ label: "Ícone", localized: false, maxLength: 40, help: "Nome de um ícone do Lucide (ex.: Bot, shield-check). Alguns temas mostram." }),
    },
  }),
  gallery: field.list({ label: "Galeria", itemLabel: "Imagem", of: { image: field.image({ label: "Imagem", required: true }) } }),
  links: linksField,
};

const SERVICE_FIELDS: FieldMap = {
  title: field.text({ label: "Nome do serviço", required: true, maxLength: 100 }),
  description: field.text({ label: "Descrição", multiline: true, maxLength: 400 }),
  icon: field.text({ label: "Ícone", localized: false, maxLength: 40, help: "Nome do ícone que o tema entender (ex.: code, palette)." }),
  priceLabel: field.text({ label: "Preço (texto livre)", maxLength: 60, help: "Ex.: A partir de R$ 500." }),
};

const TESTIMONIAL_FIELDS: FieldMap = {
  quote: field.text({ label: "Depoimento", required: true, multiline: true, maxLength: 600 }),
  author: field.text({ label: "Quem disse", required: true, localized: false, maxLength: 80 }),
  role: field.text({ label: "Cargo", maxLength: 80 }),
  company: field.text({ label: "Empresa", localized: false, maxLength: 80 }),
  avatar: field.image({ label: "Foto" }),
};

const FAQ_FIELDS: FieldMap = {
  question: field.text({ label: "Pergunta", required: true, maxLength: 200 }),
  answer: field.text({ label: "Resposta", required: true, multiline: true, maxLength: 1500 }),
};

export const RESUME_KINDS = {
  experience: "Experiência",
  volunteer: "Voluntariado",
  education: "Formação",
  skill: "Competência",
  "soft-skill": "Competência comportamental",
  certification: "Certificação",
  language: "Idioma",
} as const;

const RESUME_FIELDS: FieldMap = {
  kind: field.select({ label: "Tipo", required: true, options: Object.entries(RESUME_KINDS).map(([value, label]) => ({ value, label })), default: "experience" }),
  title: field.text({ label: "Título", required: true, maxLength: 120, help: "Cargo, curso, competência…" }),
  organization: field.text({ label: "Organização", localized: false, maxLength: 120 }),
  location: field.text({ label: "Local", maxLength: 80 }),
  start: field.text({ label: "Início", localized: false, maxLength: 7, help: "AAAA-MM (ex.: 2021-03)." }),
  end: field.text({ label: "Fim", localized: false, maxLength: 7, help: "AAAA-MM. Vazio = até hoje." }),
  // Texto rico: experiências longas, com listas e destaques (como na v1).
  description: field.richText({ label: "Descrição" }),
  group: field.text({ label: "Grupo", maxLength: 60, help: "Agrupa as competências no currículo (ex.: Front-end, IA, Ferramentas). Opcional." }),
};

const ROUTINE_FIELDS: FieldMap = {
  title: field.text({ label: "Título", required: true, maxLength: 100 }),
  description: field.text({ label: "Legenda", multiline: true, maxLength: 300 }),
  image: field.image({ label: "Imagem" }),
  span: field.select({
    label: "Tamanho no mosaico",
    help: "Colunas x linhas, nos temas que mostram o dia a dia em mosaico. Sem escolha, 1x1.",
    options: [
      { value: "1x1", label: "1x1 (normal)" },
      { value: "1x2", label: "1x2 (alta)" },
      { value: "2x1", label: "2x1 (larga)" },
      { value: "2x2", label: "2x2 (grande)" },
    ],
  }),
};

const PLAN_FIELDS: FieldMap = {
  name: field.text({ label: "Nome do plano", required: true, maxLength: 60 }),
  description: field.text({ label: "Descrição", multiline: true, maxLength: 300 }),
  period: field.select({
    label: "Cobrança",
    options: Object.entries(PERIOD_LABELS).map(([value, label]) => ({ value, label })),
    help: "Link de pagamento só para pagamento único ou por projeto.",
  }),
  priceLabel: field.text({ label: "Texto no lugar do preço", maxLength: 60, help: "Para planos sem preço fixo (ex.: Sob consulta). Vale quando não há valor." }),
  features: field.list({ label: "O que está incluído", itemLabel: "Item", of: { text: field.text({ label: "Item", required: true, maxLength: 120 }) } }),
  highlighted: field.boolean({ label: "Destacar este plano", default: false }),
  cta: field.link({ label: "Botão do plano", help: "Contato, página ou link de pagamento (veja abaixo)." }),
};

const TEAM_FIELDS: FieldMap = {
  name: field.text({ label: "Nome", required: true, localized: false, maxLength: 80 }),
  role: field.text({ label: "Cargo", required: true, maxLength: 80 }),
  bio: field.text({ label: "Apresentação", multiline: true, maxLength: 500 }),
  photo: field.image({ label: "Foto" }),
  links: linksField,
};

// ── Conversões documento ↔ formulário ───────────────────────────────────────

function dropEmpty(values: Values): Values {
  const out: Values = {};
  for (const [k, v] of Object.entries(values)) if (v !== undefined) out[k] = v;
  return out;
}

function projectToForm(doc: Doc): Values {
  const { gallery, metric, ...rest } = doc as Doc & { gallery?: unknown[]; metric?: { value?: string; label?: Localized<string> } };
  return dropEmpty({
    ...rest,
    gallery: gallery?.map((image) => ({ image })),
    metricValue: metric?.value,
    metricLabel: metric?.label,
  });
}

function projectFromForm(form: Values): Values {
  const { gallery, metricValue, metricLabel, ...rest } = form as Values & { gallery?: { image: unknown }[]; metricValue?: string; metricLabel?: Localized<string> };
  const hasLabel = !!metricLabel && Object.values(metricLabel).some((s) => s?.trim());
  return dropEmpty({
    ...rest,
    gallery: gallery?.length ? gallery.map((g) => g.image) : undefined,
    metric: metricValue?.trim() && hasLabel ? { value: metricValue.trim(), label: metricLabel } : undefined,
  });
}

function planToForm(doc: Doc): Values {
  const { features, ...rest } = doc as Doc & { features?: Localized<string>[] };
  return dropEmpty({ ...rest, features: (features ?? []).map((text) => ({ text })) });
}

function planFromForm(form: Values): Values {
  const { features, ...rest } = form as Values & { features?: { text: Localized<string> }[] };
  return dropEmpty({ ...rest, features: (features ?? []).map((f) => f.text) });
}

const created = (doc: Doc) => (typeof doc.createdAt === "number" ? doc.createdAt : 0);
export { created as createdAt };

const text = (key: string) => (doc: Doc, locale: string, fallback: string) => textIn(L(doc[key]) ?? (doc[key] as string | undefined), locale, fallback) || "(sem título)";

export const COLLECTION_CONFIGS: Record<CollectionName, CollectionConfig> = {
  posts: {
    name: "posts",
    base: "/admin/blog",
    title: "Blog",
    singular: "post",
    plural: "posts",
    description: "Posts com capa, etiquetas e SEO. O endereço de cada post não muda sozinho.",
    fields: POST_FIELDS,
    docKeys: ["title", "excerpt", "cover", "content", "author", "tags", "featured", "seo"],
    required: ["title", "content"],
    slug: true,
    seo: true,
    tags: true,
    featured: true,
    reorderable: false,
    defaultPublished: false,
    imageKey: "cover",
    label: text("title"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.excerpt), locale, fallback) || undefined,
    empty: "Nenhum post ainda. Escreva o primeiro.",
    trashNote: "O post sai do site na próxima publicação. Só a agência (root) restaura ou apaga de vez.",
  },
  projects: {
    name: "projects",
    base: "/admin/projetos",
    title: "Projetos",
    singular: "projeto",
    plural: "projetos",
    description: "Cases e projetos, com seções, galeria, número de destaque e SEO.",
    fields: PROJECT_FIELDS,
    docKeys: ["title", "summary", "cover", "client", "year", "role", "category", "metric", "content", "sections", "metrics", "gallery", "links", "tags", "featured", "seo"],
    required: ["title"],
    slug: true,
    seo: true,
    tags: true,
    featured: true,
    reorderable: true,
    defaultPublished: false,
    imageKey: "cover",
    label: text("title"),
    subtitle: (doc) => [doc.client, doc.year].filter(Boolean).join(" · ") || undefined,
    toForm: projectToForm,
    fromForm: projectFromForm,
    empty: "Nenhum projeto ainda.",
    trashNote: "O projeto sai do site na próxima publicação. Só a agência (root) restaura ou apaga de vez.",
  },
  services: {
    name: "services",
    base: "/admin/servicos",
    title: "Serviços",
    singular: "serviço",
    plural: "serviços",
    description: "O que você oferece, na ordem em que aparece no site.",
    fields: SERVICE_FIELDS,
    docKeys: ["title", "description", "icon", "priceLabel", "featured"],
    required: ["title"],
    featured: true,
    reorderable: true,
    defaultPublished: true,
    label: text("title"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.description), locale, fallback) || undefined,
    empty: "Nenhum serviço ainda.",
    trashNote: "O serviço sai do site na próxima publicação.",
  },
  testimonials: {
    name: "testimonials",
    base: "/admin/depoimentos",
    title: "Depoimentos",
    singular: "depoimento",
    plural: "depoimentos",
    description: "O que dizem de você. Os enviados pelo site chegam à fila de aprovação.",
    fields: TESTIMONIAL_FIELDS,
    docKeys: ["quote", "author", "role", "company", "avatar", "featured"],
    required: ["quote", "author"],
    featured: true,
    reorderable: true,
    defaultPublished: true,
    imageKey: "avatar",
    label: (doc) => String(doc.author ?? "(sem nome)"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.quote), locale, fallback) || undefined,
    empty: "Nenhum depoimento ainda.",
    trashNote: "O depoimento sai do site na próxima publicação.",
  },
  faq: {
    name: "faq",
    base: "/admin/faq",
    title: "Perguntas frequentes",
    singular: "pergunta",
    plural: "perguntas",
    feminine: true,
    description: "Perguntas e respostas, na ordem em que aparecem.",
    fields: FAQ_FIELDS,
    docKeys: ["question", "answer", "tags"],
    required: ["question", "answer"],
    tags: true,
    reorderable: true,
    defaultPublished: true,
    label: text("question"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.answer), locale, fallback) || undefined,
    empty: "Nenhuma pergunta ainda.",
    trashNote: "A pergunta sai do site na próxima publicação.",
  },
  resume: {
    name: "resume",
    base: "/admin/curriculo",
    title: "Currículo",
    singular: "item",
    plural: "itens",
    description: "Experiência, formação, competências, certificações e idiomas. Alimenta a página de currículo e o PDF.",
    fields: RESUME_FIELDS,
    docKeys: ["kind", "title", "organization", "location", "start", "end", "description", "group"],
    required: ["kind", "title"],
    reorderable: true,
    defaultPublished: true,
    label: text("title"),
    subtitle: (doc) => {
      const kind = RESUME_KINDS[doc.kind as keyof typeof RESUME_KINDS] ?? String(doc.kind ?? "");
      const period = [doc.start, doc.end].filter(Boolean).join(" → ");
      return [kind, doc.organization, period].filter(Boolean).join(" · ");
    },
    empty: "Nenhum item ainda.",
    trashNote: "O item sai do currículo na próxima publicação.",
  },
  routine: {
    name: "routine",
    base: "/admin/dia-a-dia",
    title: "Dia a dia",
    singular: "momento",
    plural: "momentos",
    description: "Galeria do dia a dia da página sobre.",
    fields: ROUTINE_FIELDS,
    docKeys: ["title", "description", "image", "span"],
    required: ["title"],
    reorderable: true,
    defaultPublished: true,
    imageKey: "image",
    label: text("title"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.description), locale, fallback) || undefined,
    empty: "Nenhum momento ainda.",
    trashNote: "O item sai do site na próxima publicação.",
  },
  plans: {
    name: "plans",
    base: "/admin/planos",
    title: "Planos",
    singular: "plano",
    plural: "planos",
    description: "Planos com preço em reais, itens incluídos, destaque e botão. Dá para ligar um link de pagamento.",
    fields: PLAN_FIELDS,
    docKeys: ["name", "description", "priceCents", "currency", "period", "priceLabel", "features", "highlighted", "cta"],
    required: ["name", "features"],
    reorderable: true,
    defaultPublished: true,
    label: text("name"),
    toForm: planToForm,
    fromForm: planFromForm,
    empty: "Nenhum plano ainda.",
    trashNote: "O plano sai do site na próxima publicação.",
  },
  team: {
    name: "team",
    base: "/admin/equipe",
    title: "Equipe",
    singular: "pessoa",
    plural: "pessoas",
    feminine: true,
    description: "As pessoas da empresa, com foto, cargo e links.",
    fields: TEAM_FIELDS,
    docKeys: ["name", "role", "bio", "photo", "links"],
    required: ["name", "role"],
    reorderable: true,
    defaultPublished: true,
    imageKey: "photo",
    label: (doc) => String(doc.name ?? "(sem nome)"),
    subtitle: (doc, locale, fallback) => textIn(L(doc.role), locale, fallback) || undefined,
    empty: "Ninguém na equipe ainda.",
    trashNote: "A pessoa sai do site na próxima publicação.",
  },
};

/** Campos de capa/foto da lista, no documento. */
export function itemImage(config: CollectionConfig, doc: Doc): string | undefined {
  const image = config.imageKey ? (doc[config.imageKey] as { url?: string } | undefined) : undefined;
  return image?.url;
}
