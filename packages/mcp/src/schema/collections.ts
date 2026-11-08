/**
 * Coleções do conteúdo: campos (os validadores do Convex do backend), permissão e
 * plugin de cada uma. As ferramentas de coleção saem daqui.
 */
import type { CollectionName } from "@rubrica/core";
import type { Permission } from "@rubrica/core/convex/roles";
import {
  faqFields,
  planFields,
  postFields,
  projectFields,
  resumeItemFields,
  routineFields,
  serviceFields,
  teamMemberFields,
  testimonialFields,
} from "@rubrica/core/convex/validators";
import { validatorsToSchema, type JsonSchema, type SchemaOptions } from "./json-schema";

export interface CollectionSpec {
  name: CollectionName;
  /** Nome no plural, em pt-BR, para as descrições. */
  label: string;
  singular: string;
  /** Campos de conteúdo (sem `slug`, `published`). */
  fields: Record<string, unknown>;
  permission: Permission;
  /** Plugin que traz a coleção (ver `plugins/registry.ts` do núcleo). */
  plugin?: string;
  /** Tem slug estável. */
  slug?: boolean;
  /** Campos que dão o nome do item nas listas, em ordem. */
  labelFields: string[];
  /** Campos traduzíveis obrigatórios (pelo menos um idioma). */
  requiredText: string[];
  descriptions: Record<string, string>;
}

const common: Record<string, string> = {
  order: "Posição na lista (menor primeiro). Se faltar, vai para o fim.",
  featured: "Destaque (aparece nos blocos que mostram só os destacados).",
  tags: "Etiquetas livres, em minúsculas.",
  "seo.title": "Título para buscadores (até ~60 caracteres), por idioma.",
  "seo.description": "Descrição para buscadores (até ~160 caracteres), por idioma.",
  "seo.noindex": "Se verdadeiro, esconde a página dos buscadores.",
};

export const COLLECTION_SPECS: Record<CollectionName, CollectionSpec> = {
  posts: {
    name: "posts",
    label: "posts do blog",
    singular: "post",
    fields: postFields,
    permission: "blog",
    plugin: "blog",
    slug: true,
    labelFields: ["title"],
    requiredText: ["title", "content"],
    descriptions: {
      ...common,
      title: "Título do post.",
      excerpt: "Resumo curto (aparece nas listas e no compartilhamento).",
      content: "Corpo do post em HTML (h2, h3, p, ul, ol, li, strong, em, a, blockquote, img, code, pre; sem h1). O backend sanitiza.",
      cover: "Imagem de capa.",
      author: "Nome do autor exibido.",
    },
  },
  projects: {
    name: "projects",
    label: "projetos e cases",
    singular: "projeto",
    fields: projectFields,
    permission: "content",
    plugin: "portfolio",
    slug: true,
    labelFields: ["title"],
    requiredText: ["title"],
    descriptions: {
      ...common,
      title: "Nome do projeto.",
      summary: "Resumo de uma frase (cartão da lista).",
      content: "Case em HTML, quando não usa seções.",
      sections: "Seções do case (contexto, decisões, resultado), em ordem.",
      "sections[].title": "Título da seção.",
      "sections[].body": "Corpo da seção em HTML.",
      cover: "Imagem de capa.",
      gallery: "Imagens do projeto.",
      client: "Nome do cliente.",
      year: "Ano de entrega.",
      role: "Papel da pessoa no projeto.",
      category: "Categoria do projeto (uma só; o tema pode agrupar o portfólio por ela).",
      links: "Links externos (site, repositório).",
    },
  },
  services: {
    name: "services",
    label: "serviços",
    singular: "serviço",
    fields: serviceFields,
    permission: "content",
    labelFields: ["title"],
    requiredText: ["title"],
    descriptions: { ...common, title: "Nome do serviço.", description: "O que está incluído.", icon: "Nome de um ícone (Lucide).", priceLabel: "Preço em texto livre (ex.: a partir de R$ 500)." },
  },
  testimonials: {
    name: "testimonials",
    label: "depoimentos",
    singular: "depoimento",
    fields: testimonialFields,
    permission: "content",
    plugin: "testimonials",
    labelFields: ["author"],
    requiredText: ["quote"],
    descriptions: { ...common, quote: "O depoimento.", author: "Nome de quem deu o depoimento.", role: "Cargo.", company: "Empresa.", avatar: "Foto." },
  },
  faq: {
    name: "faq",
    label: "perguntas frequentes",
    singular: "pergunta",
    fields: faqFields,
    permission: "content",
    labelFields: ["question"],
    requiredText: ["question", "answer"],
    descriptions: { ...common, question: "A pergunta.", answer: "A resposta." },
  },
  resume: {
    name: "resume",
    label: "itens do currículo",
    singular: "item do currículo",
    fields: resumeItemFields,
    permission: "content",
    plugin: "resume",
    labelFields: ["title"],
    requiredText: ["title"],
    descriptions: {
      ...common,
      kind: "Tipo: experience, education, skill, certification ou language.",
      title: "Cargo, curso, competência…",
      organization: "Empresa ou instituição.",
      location: "Local.",
      start: "Início, no formato AAAA-MM.",
      end: "Fim, AAAA-MM. Vazio = atual.",
      description: "Detalhes.",
    },
  },
  routine: {
    name: "routine",
    label: "itens do dia a dia",
    singular: "item do dia a dia",
    fields: routineFields,
    permission: "content",
    plugin: "about",
    labelFields: ["title"],
    requiredText: ["title"],
    descriptions: { ...common, title: "Título.", description: "Texto curto.", image: "Foto." },
  },
  plans: {
    name: "plans",
    label: "planos e preços",
    singular: "plano",
    fields: planFields,
    permission: "plans",
    plugin: "pricing",
    labelFields: ["name"],
    requiredText: ["name"],
    descriptions: {
      ...common,
      name: "Nome do plano.",
      description: "Para quem é.",
      priceCents: "Preço em centavos (R$ 49,90 = 4990).",
      currency: "Moeda ISO (BRL, USD).",
      period: "Periodicidade: month, year, once, hour ou project.",
      priceLabel: "Preço em texto livre, no lugar do valor (ex.: sob consulta).",
      features: "Itens incluídos, um texto por idioma em cada item.",
      highlighted: "Plano em destaque.",
      cta: "Botão do plano.",
    },
  },
  team: {
    name: "team",
    label: "equipe",
    singular: "pessoa da equipe",
    fields: teamMemberFields,
    permission: "content",
    plugin: "team",
    labelFields: ["name"],
    requiredText: ["role"],
    descriptions: { ...common, name: "Nome.", role: "Cargo.", bio: "Bio curta.", photo: "Foto.", links: "Redes e links." },
  },
};

export const COLLECTION_NAMES = Object.keys(COLLECTION_SPECS) as CollectionName[];

/** Esquema dos campos de um item. `partial` tira os obrigatórios (atualização). */
export function collectionFieldsSchema(spec: CollectionSpec, opts: SchemaOptions = {}, partial = false): JsonSchema {
  const schema = validatorsToSchema(spec.fields, { ...opts, descriptions: spec.descriptions });
  if (spec.slug) {
    (schema.properties as JsonSchema).slug = {
      type: "string",
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      description: "Endereço estável do item (kebab-case). Na criação, se faltar, sai do título. Mudar depois quebra links já compartilhados.",
    };
  }
  if (partial) delete schema.required;
  return schema;
}

/** Nome legível de um item (para listas e logs). */
export function itemLabel(spec: CollectionSpec, item: Record<string, unknown>, preferred?: string): string {
  for (const field of spec.labelFields) {
    const v = item[field];
    if (typeof v === "string" && v) return v;
    if (v && typeof v === "object") {
      const map = v as Record<string, string>;
      const text = (preferred && map[preferred]) || Object.values(map).find((t) => typeof t === "string" && t);
      if (text) return text;
    }
  }
  return String(item._id ?? item.id ?? "");
}
