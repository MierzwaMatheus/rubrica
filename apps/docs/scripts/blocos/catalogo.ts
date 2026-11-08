/**
 * Catálogo de blocos da documentação (docs/guia/blocos.md e blocos.en.md), gerado do
 * código: as definições do núcleo (`CORE_BLOCKS`), as variações dos componentes padrão
 * (`CORE_VARIANTS`), os plugins (`CORE_PLUGINS`, para o dono de cada coleção) e as
 * variações que cada tema de packages/themes declara. Nada aqui é lista escrita à mão:
 * um bloco novo no catálogo do núcleo entra ao rodar `pnpm docs:blocos`.
 *
 * Os rótulos do painel ficam em português nas duas versões (o painel é em português);
 * as descrições e as ajudas ganham inglês pelo mapa de `en.ts`, e o que faltar lá sai
 * em português.
 */
import type { BlockDefinition, CollectionQuery, FieldDef, FieldMap, PluginDefinition, VariantOption } from "@rubrica/core";
import { githubSlug } from "../../src/lib/markdown";
import { EN } from "./en";

export type Lang = "pt" | "en";

/** Variações que um tema declara, por tipo de bloco. */
export interface ThemeVariants {
  id: string;
  variants: Partial<Record<string, VariantOption[]>>;
}

export interface CatalogInput {
  blocks: readonly BlockDefinition[];
  coreVariants: Partial<Record<string, VariantOption[]>>;
  plugins: readonly PluginDefinition[];
  themes: readonly ThemeVariants[];
}

const WORDS = {
  pt: {
    title: "# Catálogo de blocos",
    intro: [
      "Todos os blocos que o núcleo do Rubrica traz, com os campos de cada um. Um bloco é uma seção de página: você escolhe os blocos no editor de páginas do painel, e cada tema desenha o seu jeito de mostrar cada um.",
      "Esta página é gerada do código do núcleo. Os nomes dos campos (como `title`) são os que o MCP e os arquivos de dados usam; o rótulo é o que aparece no painel. \"Quando usar\", \"Quando não usar\" e \"Combina com\" são a orientação de cada bloco, a mesma que o MCP entrega aos agentes.",
      "**Variações** são desenhos com nome que um tema oferece para o bloco (por exemplo, `cases` em grade ou em lista). O painel mostra só as do tema em uso, e a primeira de cada lista é a padrão. Ao trocar de tema, uma variação que o tema novo não tem cai na padrão dele.",
      "Precisa de uma seção que não está aqui? Veja [Criar um bloco](./criar-bloco.md).",
    ],
    index: "## Os blocos",
    indexHead: "| Bloco | Nome no painel | Para que serve | Tipo de site | Plugin |",
    kind: { comum: "pessoal e empresa", pessoal: "só pessoal", empresa: "só empresa" } as Record<string, string>,
    kindLabel: "Tipo de site",
    plugin: "Plugin",
    pluginNone: "nenhum: sempre disponível",
    pluginBlock: (id: string) => `\`${id}\`: o bloco some com o plugin desligado`,
    pluginCollection: (id: string, c: string) => `\`${id}\`, dono da coleção \`${c}\`: o bloco some com o plugin desligado`,
    source: "Lista itens de",
    sourceDefault: "padrão ao criar",
    island: "JavaScript",
    islandYes: "pode montar uma ilha (a parte interativa, com JavaScript no navegador); o resto é HTML estático",
    use: "Quando usar",
    avoid: "Quando não usar",
    pairs: "Combina com",
    variants: "Variações",
    variantsNone: "nenhuma: um desenho só em cada tema",
    variantsCore: "componente padrão do núcleo",
    variantsTheme: "temas",
    fieldsHead: "| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |",
    yes: "sim",
    no: "não",
    types: {
      text: "texto",
      textMultiline: "texto longo",
      richText: "texto formatado",
      number: "número",
      boolean: "sim ou não",
      select: "opção",
      image: "imagem",
      link: "link",
      list: "lista",
    },
    perLocale: { image: "o texto alternativo", link: "o rótulo" },
    maxLength: (n: number) => `até ${n} caracteres`,
    range: (min?: number, max?: number) =>
      min !== undefined && max !== undefined ? `de ${min} a ${max}` : min !== undefined ? `pelo menos ${min}` : `até ${max}`,
    items: "itens",
    integer: "inteiro",
    defaultValue: (v: string) => `padrão: ${v}`,
    options: "opções",
    itemLabel: (l: string) => `cada item: "${l}"`,
    query: {
      featured: "só os destaques",
      limit: (n: number) => `${n} itens`,
      sortRecent: "mais novos primeiro",
      sortOrder: "na ordem do painel",
    },
  },
  en: {
    title: "# Block catalog",
    intro: [
      "Every block that ships with the Rubrica core, with its fields. A block is a page section: you pick blocks in the panel's page editor, and each theme draws each one its own way.",
      "This page is generated from the core's code. Field names (like `title`) are the ones the MCP and data files use; the label is what the panel shows, in Portuguese. \"When to use\", \"When not to use\" and \"Pairs well with\" are each block's guidance, the same the MCP gives agents.",
      "**Variants** are named designs a theme offers for the block (for example, `cases` as a grid or a list). The panel shows only the ones of the theme in use, and the first in each list is the default. When you switch themes, a variant the new theme lacks falls back to its default.",
      "Need a section that isn't here? See [Create a block](./criar-bloco.md).",
    ],
    index: "## The blocks",
    indexHead: "| Block | Panel name | What it is for | Site type | Plugin |",
    kind: { comum: "personal and company", pessoal: "personal only", empresa: "company only" } as Record<string, string>,
    kindLabel: "Site type",
    plugin: "Plugin",
    pluginNone: "none: always available",
    pluginBlock: (id: string) => `\`${id}\`: the block disappears when the plugin is off`,
    pluginCollection: (id: string, c: string) => `\`${id}\`, owner of the \`${c}\` collection: the block disappears when the plugin is off`,
    source: "Lists items from",
    sourceDefault: "default when created",
    island: "JavaScript",
    islandYes: "may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML",
    use: "When to use",
    avoid: "When not to use",
    pairs: "Pairs well with",
    variants: "Variants",
    variantsNone: "none: a single design in each theme",
    variantsCore: "core default component",
    variantsTheme: "themes",
    fieldsHead: "| Field | Panel label | Type | Required | Translatable | Help and limits |",
    yes: "yes",
    no: "no",
    types: {
      text: "text",
      textMultiline: "long text",
      richText: "rich text",
      number: "number",
      boolean: "yes or no",
      select: "choice",
      image: "image",
      link: "link",
      list: "list",
    },
    perLocale: { image: "the alt text", link: "the label" },
    maxLength: (n: number) => `up to ${n} characters`,
    range: (min?: number, max?: number) =>
      min !== undefined && max !== undefined ? `${min} to ${max}` : min !== undefined ? `at least ${min}` : `up to ${max}`,
    items: "items",
    integer: "integer",
    defaultValue: (v: string) => `default: ${v}`,
    options: "options",
    itemLabel: (l: string) => `each item: "${l}"`,
    query: {
      featured: "featured only",
      limit: (n: number) => `${n} items`,
      sortRecent: "newest first",
      sortOrder: "in panel order",
    },
  },
};

type Words = (typeof WORDS)["pt"];

/** Texto do catálogo (pt) no idioma: inglês pelo mapa, senão o original. */
const tr = (text: string, lang: Lang) => (lang === "en" ? (EN[text] ?? text) : text);

/** Célula de tabela: sem quebra de linha nem barra vertical solta. */
const cell = (s: string) => s.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");

const code = (s: string) => `\`${s}\``;

function typeName(def: FieldDef, w: Words): string {
  if (def.kind === "text" && def.multiline) return w.types.textMultiline;
  return w.types[def.kind];
}

function translatable(def: FieldDef, w: Words): string {
  if (def.kind === "text" || def.kind === "richText") return def.localized === false ? w.no : w.yes;
  if (def.kind === "image") return w.perLocale.image;
  if (def.kind === "link") return w.perLocale.link;
  return "—";
}

function limits(def: FieldDef, w: Words, lang: Lang): string {
  const parts: string[] = [];
  if (def.help) parts.push(tr(def.help, lang).replace(/\.$/, ""));
  switch (def.kind) {
    case "text":
      if (def.maxLength) parts.push(w.maxLength(def.maxLength));
      break;
    case "number":
      if (def.min !== undefined || def.max !== undefined) parts.push(w.range(def.min, def.max));
      if (def.integer) parts.push(w.integer);
      break;
    case "boolean":
      if (def.default !== undefined) parts.push(w.defaultValue(def.default ? w.yes : w.no));
      break;
    case "select":
      parts.push(`${w.options}: ${def.options.map((o) => `${code(o.value)} (${o.label})`).join(", ")}`);
      if (def.default !== undefined) parts.push(w.defaultValue(code(def.default)));
      break;
    case "list":
      if (def.min !== undefined || def.max !== undefined) parts.push(`${w.range(def.min, def.max)} ${w.items}`);
      if (def.itemLabel) parts.push(w.itemLabel(def.itemLabel));
      break;
  }
  return parts.join("; ");
}

function fieldRows(fields: FieldMap, w: Words, lang: Lang, prefix = ""): string[] {
  return Object.entries(fields).flatMap(([key, def]) => {
    const name = `${prefix}${key}`;
    const row = `| ${code(name)} | ${cell(def.label)} | ${typeName(def, w)} | ${def.required ? w.yes : w.no} | ${translatable(def, w)} | ${cell(limits(def, w, lang)) || "—"} |`;
    return def.kind === "list" ? [row, ...fieldRows(def.of, w, lang, `${name}[].`)] : [row];
  });
}

function describeQuery(q: CollectionQuery, w: Words): string {
  const parts: string[] = [];
  if (q.featured) parts.push(w.query.featured);
  if (q.limit) parts.push(w.query.limit(q.limit));
  parts.push(q.sort === "recent" ? w.query.sortRecent : w.query.sortOrder);
  return parts.join(", ");
}

/** Plugin que esconde o bloco: o declarado nele, senão o dono da coleção que ele lista. */
export function blockOwner(def: BlockDefinition, plugins: readonly PluginDefinition[]): { plugin: string; via?: string } | undefined {
  if (def.plugin) return { plugin: def.plugin };
  for (const c of def.source?.collections ?? []) {
    const owner = plugins.find((p) => p.collections?.includes(c));
    if (owner) return { plugin: owner.id, via: c };
  }
  return undefined;
}

function pluginText(def: BlockDefinition, input: CatalogInput, w: Words): string {
  const owner = blockOwner(def, input.plugins);
  if (!owner) return w.pluginNone;
  return owner.via ? w.pluginCollection(owner.plugin, owner.via) : w.pluginBlock(owner.plugin);
}

function variantsText(type: string, input: CatalogInput, w: Words): string {
  const values = (opts: VariantOption[] | undefined) => (opts ?? []).map((o) => code(o.value)).join(", ");
  const parts: string[] = [];
  const core = input.coreVariants[type];
  if (core?.length) parts.push(`${w.variantsCore}: ${values(core)}`);
  const themes = input.themes.filter((t) => t.variants[type]?.length);
  if (themes.length) parts.push(`${w.variantsTheme}: ${themes.map((t) => `${code(t.id)} (${values(t.variants[type])})`).join("; ")}`);
  return parts.length ? parts.join(" · ") : w.variantsNone;
}

/** Âncora do título "## `hero` — Hero", no mesmo formato do site e do GitHub. */
export function blockAnchor(def: BlockDefinition): string {
  return githubSlug(`${def.type} — ${def.label}`);
}

export function renderCatalog(input: CatalogInput, lang: Lang): string {
  const w = WORDS[lang];
  const out: string[] = [
    w.title,
    "",
    "<!-- Gerado por apps/docs/scripts/blocos.ts a partir de packages/core. Não edite à mão: rode pnpm docs:blocos. -->",
    "",
  ];
  for (const p of w.intro) out.push(p, "");

  out.push(w.index, "", w.indexHead, "|---|---|---|---|---|");
  for (const def of input.blocks) {
    const owner = blockOwner(def, input.plugins);
    out.push(
      `| [${code(def.type)}](#${blockAnchor(def)}) | ${cell(def.label)} | ${cell(tr(def.description, lang))} | ${w.kind[def.category] ?? def.category} | ${owner ? code(owner.plugin) : "—"} |`,
    );
  }
  out.push("");

  for (const def of input.blocks) {
    out.push(`## ${code(def.type)} — ${def.label}`, "", tr(def.description, lang), "");
    if (def.guidance) {
      out.push(`- **${w.use}:** ${tr(def.guidance.use, lang)}`);
      if (def.guidance.avoid) out.push(`- **${w.avoid}:** ${tr(def.guidance.avoid, lang)}`);
      const pairs = (def.guidance.pairsWith ?? []).map((t) => input.blocks.find((b) => b.type === t)).filter((b): b is BlockDefinition => !!b);
      if (pairs.length) out.push(`- **${w.pairs}:** ${pairs.map((b) => `[${code(b.type)}](#${blockAnchor(b)})`).join(", ")}`);
    }
    out.push(`- **${w.kindLabel}:** ${w.kind[def.category] ?? def.category}`);
    out.push(`- **${w.plugin}:** ${pluginText(def, input, w)}`);
    if (def.source) {
      out.push(`- **${w.source}:** ${def.source.collections.map(code).join(", ")} (${w.sourceDefault}: ${describeQuery(def.source.default, w)})`);
    }
    if (def.interactive) out.push(`- **${w.island}:** ${w.islandYes}`);
    out.push(`- **${w.variants}:** ${variantsText(def.type, input, w)}`, "");
    out.push(w.fieldsHead, "|---|---|---|---|---|---|", ...fieldRows(def.fields, w, lang), "");
  }
  return `${out.join("\n").trimEnd()}\n`;
}
