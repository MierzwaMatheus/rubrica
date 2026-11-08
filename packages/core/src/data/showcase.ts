/**
 * Vitrine da bateria de tema (RFC v2, decisão 31: "todos os blocos e variações").
 *
 * Os dados de demonstração não passam por todas as variações nem pelas receitas do tema.
 * A vitrine gera, A PARTIR DO TEMA, páginas a mais que o build acrescenta ao conteúdo
 * (sem mudar os arquivos de exemplo):
 * - uma página por tipo de bloco (`/vitrine/<tipo>`), com cada variação declarada pelo tema
 *   em várias instâncias: campos cheios (textos longos, listas no máximo, imagem), campos
 *   curtos (só o essencial, sem imagem), uma por opção de cada seleção e, nos blocos com
 *   coleção, uma sem nenhum item;
 * - as páginas da receita do tema para o tipo de site (`/vitrine/receita/...`).
 *
 * As páginas existem só no idioma principal e ficam fora do menu. Os campos são gerados
 * pelo schema do bloco e passam na validação dele. Funções puras.
 */
import type { Locale } from "../i18n";
import type { BlockDefinition } from "../blocks/define";
import type { FieldDef, FieldMap } from "../blocks/fields";
import type { BlockInstance, CollectionQuery, PageRecord, SiteSettings } from "../content/types";
import { enabledPlugins } from "../plugins/contract";
import { CORE_PLUGINS } from "../plugins/registry";
import { recipeFor } from "../theme/recipes";
import { variantsFor, type ThemeDefinition, type VariantOption } from "../theme/contract";
import { pagesFromRecipe } from "../convex/lib/seed";
import type { DataSource } from "./source";

/** Prefixo das páginas da vitrine (a bateria tira estas do Lighthouse). */
export const SHOWCASE_PREFIX = "/vitrine";

/** Etiqueta que nenhum item tem: a instância "vazia" dos blocos com coleção. */
export const SHOWCASE_EMPTY_TAG = "__vitrine-vazio";

type Mode = "cheio" | "curto";

const LONG =
  "Desenvolvimento de produtos digitais com responsabilidade, pesquisa contínua com as pessoas que usam o serviço, decisões registradas e entregas pequenas que chegam ao ar toda semana, sem perder de vista a acessibilidade, a performance e a manutenção do que já foi construído.";

/** Texto com até `max` caracteres, cortado no fim de uma palavra. */
function longText(max = 320): string {
  const limit = Math.min(max, 320);
  let text = LONG;
  while (text.length < limit) text += ` ${LONG}`;
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[,;]$/, "");
}

const RICH_LONG = `<p>${LONG}</p><h3>Como funciona</h3><ul><li>Descoberta com entrevistas e dados de uso.</li><li>Protótipo navegável antes do código.</li><li>Entrega contínua, com medição depois do lançamento.</li></ul><p>Um parágrafo com <strong>destaque</strong>, <em>ênfase</em> e um <a href="/contato">link interno</a>.</p>`;
const RICH_SHORT = "<p>Texto curto.</p>";

const IMAGE = { url: "/img/hero.svg", width: 800, height: 600 };
const LOGOS = ["/img/logo-1.svg", "/img/logo-2.svg", "/img/logo-3.svg", "/img/logo-4.svg"];

function localized(text: string, locales: readonly Locale[]): Record<Locale, string> {
  return Object.fromEntries(locales.map((l) => [l, text]));
}

interface SampleContext {
  mode: Mode;
  /** Índice da instância (escolhe a opção das seleções). */
  instance: number;
  locales: readonly Locale[];
  /** Identificador único da instância (âncoras). */
  uid: string;
  /** Índice do item, dentro de uma lista. */
  item?: number;
}

/** Texto não traduzível pelo nome do campo (âncora, ícone, valor, link…). */
function plainValue(key: string, def: Extract<FieldDef, { kind: "text" }>, c: SampleContext): string {
  const n = c.item ?? 0;
  const fit = (s: string) => (def.maxLength ? s.slice(0, def.maxLength) : s);
  switch (key) {
    case "anchor":
      return fit(`v-${c.uid}`);
    case "icon":
      return ["rocket", "compass", "layers", "shield", "sparkles", "users"][n % 6]!;
    case "value":
      return fit(c.mode === "cheio" ? ["R$ 2,5 mi", "1.234.567+", "98%", "24/7"][n % 4]! : String(n + 1));
    case "href":
      return n % 2 === 0 ? "https://example.com" : "/contato";
    case "name":
      return fit(c.mode === "cheio" ? `Empresa Parceira Internacional ${n + 1}` : `Marca ${n + 1}`);
    default:
      return fit(c.mode === "cheio" ? longText(def.maxLength ?? 120) : "Curto");
  }
}

function sampleValue(key: string, def: FieldDef, c: SampleContext): unknown {
  const full = c.mode === "cheio";
  switch (def.kind) {
    case "text": {
      if (def.localized === false) return plainValue(key, def, c);
      const short = c.item !== undefined ? `Item ${c.item + 1}` : "Título curto";
      return localized(full ? longText(def.maxLength ?? (def.multiline ? 320 : 120)) : short, c.locales);
    }
    case "richText":
      return localized(full ? RICH_LONG : RICH_SHORT, c.locales);
    case "number":
      return def.min ?? 1;
    case "boolean":
      return full;
    case "select":
      return def.options[c.instance % def.options.length]!.value;
    case "image": {
      if (!full && !def.required) return undefined;
      if (key === "image" && c.item !== undefined && /logo/i.test(def.label)) {
        return { url: LOGOS[c.item % LOGOS.length], width: 160, height: 48, alt: localized(`Logo ${c.item + 1}`, c.locales) };
      }
      return { ...IMAGE, alt: localized(full ? "Ilustração com gradiente azul e roxo" : "Ilustração", c.locales) };
    }
    case "link":
      return {
        label: localized(full ? "Quero conversar sobre um projeto novo" : "Ver", c.locales),
        href: "/contato",
      };
    case "list": {
      const count = full ? Math.min(def.max ?? 6, 12) : Math.max(def.min ?? 1, 1);
      return Array.from({ length: count }, (_, i) => sampleFields(def.of, { ...c, item: i }));
    }
  }
}

/**
 * Campos de exemplo válidos para o schema: `cheio` preenche tudo (textos no limite, listas
 * no máximo, imagem, booleanos ligados); `curto` só os textos curtos, listas no mínimo e
 * nenhuma imagem opcional. A seleção alterna as opções pela instância.
 */
export function sampleFields(fields: FieldMap, c: SampleContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(fields)) {
    // No modo curto, link opcional fica de fora (é o que mais muda o desenho).
    if (c.mode === "curto" && !def.required && (def.kind === "link" || def.kind === "image")) continue;
    if (c.mode === "curto" && key === "anchor") continue;
    const value = sampleValue(key, def, c);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** Variações a mostrar: as do bloco no tema (declaradas ou herdadas do núcleo); sem nenhuma, a padrão. */
export function showcaseVariants(theme: Pick<ThemeDefinition, "variants" | "blocks">, type: string): VariantOption[] {
  const options = variantsFor(theme, type);
  return options.length ? options : [{ value: "default", label: "Padrão" }];
}

/**
 * Exemplo do bloco (`sample`) com os textos traduzíveis em todos os idiomas: um objeto com
 * a chave "*" vira `{ "pt-BR": ..., "en": ... }`. O resto passa como está.
 */
function localizeSample(value: unknown, locales: readonly Locale[]): any {
  if (Array.isArray(value)) return value.map((v) => localizeSample(v, locales));
  if (typeof value !== "object" || value === null) return value;
  const obj = value as Record<string, unknown>;
  if (typeof obj["*"] === "string") return localized(obj["*"], locales);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, localizeSample(v, locales)]));
}

const selectCount = (fields: FieldMap) =>
  Math.max(1, ...Object.values(fields).map((d) => (d.kind === "select" ? d.options.length : 1)));

const safe = (s: string) => s.replace(/[^a-z0-9-]/gi, "-");

/** Instâncias de um bloco na vitrine: cheio, curto, uma por opção a mais das seleções e vazio. */
export function showcaseBlocks(def: BlockDefinition, theme: Pick<ThemeDefinition, "variants" | "blocks">, locales: readonly Locale[]): BlockInstance[] {
  const out: BlockInstance[] = [];
  const instances = Math.max(2, selectCount(def.fields));
  for (const variant of showcaseVariants(theme, def.type)) {
    for (let i = 0; i < instances; i++) {
      const mode: Mode = i === 1 ? "curto" : "cheio";
      const uid = safe(`${def.type}-${variant.value}-${i + 1}`);
      const block: BlockInstance = {
        id: uid,
        type: def.type,
        ...(variant.value !== "default" && { variant: variant.value }),
        visible: true,
        fields: { ...sampleFields(def.fields, { mode, instance: i, locales, uid }), ...localizeSample(def.sample?.(mode, i), locales) },
      };
      if (def.source) {
        const base = def.source.default;
        // Cheio: a coleção inteira; curto: a consulta padrão do bloco.
        const source: CollectionQuery = mode === "cheio" ? { collection: base.collection, ...(base.sort && { sort: base.sort }) } : base;
        block.source = source;
      }
      out.push(block);
    }
    if (def.source) {
      const uid = safe(`${def.type}-${variant.value}-vazio`);
      out.push({
        id: uid,
        type: def.type,
        ...(variant.value !== "default" && { variant: variant.value }),
        visible: true,
        fields: sampleFields(def.fields, { mode: "curto", instance: 0, locales, uid }),
        source: { collection: def.source.default.collection, tags: [SHOWCASE_EMPTY_TAG] },
      });
    }
  }
  return out;
}

export interface ShowcaseInput {
  theme: Pick<ThemeDefinition, "variants" | "recipes" | "blocks">;
  blocks: readonly BlockDefinition[];
  site: Pick<SiteSettings, "kind" | "locales" | "plugins">;
}

/** Páginas da vitrine para o site: uma por tipo de bloco aceito e as da receita do tema. */
export function showcasePages({ theme, blocks, site }: ShowcaseInput): PageRecord[] {
  const plugins = enabledPlugins(CORE_PLUGINS, site.kind, site.plugins ?? {});
  const allowed = (def: BlockDefinition | undefined): def is BlockDefinition =>
    !!def && (def.category === "comum" || def.category === site.kind) && (!def.plugin || plugins.has(def.plugin));
  const main = site.locales.default;
  const locales = site.locales.locales;
  const pages: PageRecord[] = [];

  for (const def of blocks.filter(allowed)) {
    pages.push({
      id: `vitrine-${def.type}`,
      path: `${SHOWCASE_PREFIX}/${def.type}`,
      title: { [main]: `Vitrine: ${def.label}` },
      blocks: showcaseBlocks(def, theme, locales),
      published: true,
      updatedAt: 0,
    });
  }

  const byType = new Map(blocks.map((b) => [b.type, b]));
  const recipe = pagesFromRecipe(recipeFor(theme, site.kind), { locales: site.locales, allowBlock: (t) => allowed(byType.get(t)) });
  for (const page of recipe) {
    const title = page.title[main];
    if (!title) continue;
    pages.push({
      id: `vitrine-receita${safe(page.path === "/" ? "" : page.path)}`,
      path: `${SHOWCASE_PREFIX}/receita${page.path === "/" ? "" : page.path}`,
      title: { [main]: `Receita: ${title}` },
      blocks: page.blocks,
      published: true,
      updatedAt: 0,
    });
  }
  return pages;
}

/** Fonte de dados com as páginas da vitrine acrescentadas às do conteúdo. */
export function withShowcase(source: DataSource, theme: ShowcaseInput["theme"], blocks: readonly BlockDefinition[]): DataSource {
  return {
    async load() {
      const snapshot = await source.load();
      return { ...snapshot, pages: [...snapshot.pages, ...showcasePages({ theme, blocks, site: snapshot.site })] };
    },
  };
}
