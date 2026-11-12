/**
 * Lógica pura das telas de coleção: o que mudou entre o que está salvo e o que está no
 * formulário (patch + campos a apagar), idiomas faltando num item, filtros da lista e
 * ordenação. Sem React: testável.
 */
import type { FieldMap } from "../../blocks/fields";
import { slugify } from "../../convex/lib/slug";
import type { Locale, Localized } from "../../i18n";
import { missingLocales, missingTranslations, prune, sameDraft, type Values } from "../editor/model";
import { plainText, textIn } from "../lib/format";

export interface UpdatePlan {
  /** Campos novos ou alterados. */
  patch: Values;
  /** Campos opcionais que existiam e foram esvaziados. */
  unset: string[];
}

/**
 * Compara o formulário com o salvo. O `update` do backend só muda o que está no patch e
 * só apaga o que vem em `unset` (o Convex não envia `undefined`). `keys` limita aos
 * campos que o formulário controla; `required` nunca vai para `unset`.
 */
export function planUpdate(saved: Values, form: Values, keys: readonly string[], required: readonly string[] = []): UpdatePlan {
  const patch: Values = {};
  const unset: string[] = [];
  for (const key of keys) {
    const before = saved[key];
    const after = form[key];
    if (after === undefined || after === null) {
      if (before !== undefined && before !== null && !required.includes(key)) unset.push(key);
      continue;
    }
    if (!sameDraft(prune(before), prune(after))) patch[key] = prune(after);
  }
  return { patch, unset };
}

/** Item novo: só os campos preenchidos. */
export function planCreate(form: Values, keys: readonly string[]): Values {
  const out: Values = {};
  for (const key of keys) {
    const value = form[key];
    if (value !== undefined && value !== null) out[key] = prune(value);
  }
  return out;
}

/** Slug sugerido para um título novo (o do idioma principal, senão o primeiro). */
export function suggestSlug(title: Localized<string> | undefined, defaultLocale: Locale): string {
  return slugify(textIn(title, defaultLocale));
}

/** Idiomas em que o item tem algum texto sem tradução. */
export function itemMissingLocales(fields: FieldMap, doc: Values, locales: readonly Locale[]): Locale[] {
  return missingLocales(missingTranslations(fields, doc, locales));
}

export type StatusFilter = "all" | "published" | "draft" | "trash";

export interface ListFilters {
  search: string;
  status: StatusFilter;
  tag: string;
}

export interface ListItem {
  _id: string;
  published?: boolean;
  deletedAt?: number;
  tags?: string[];
  order?: number;
  publishedAt?: number;
  createdAt?: number;
  [key: string]: unknown;
}

/** Busca em texto livre (sem acento, sem caixa) no título e nas etiquetas. */
export function matchesSearch(haystack: string, search: string): boolean {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const terms = norm(search).split(/\s+/).filter(Boolean);
  const text = norm(haystack);
  return terms.every((t) => text.includes(t));
}

export function filterItems<T extends ListItem>(items: readonly T[], filters: ListFilters, label: (item: T) => string): T[] {
  return items.filter((item) => {
    const trashed = item.deletedAt !== undefined;
    if (filters.status === "trash" ? !trashed : trashed) return false;
    if (filters.status === "published" && !item.published) return false;
    if (filters.status === "draft" && item.published) return false;
    if (filters.tag && !(item.tags ?? []).includes(filters.tag)) return false;
    if (filters.search && !matchesSearch(`${label(item)} ${(item.tags ?? []).join(" ")}`, filters.search)) return false;
    return true;
  });
}

export function allTags(items: readonly ListItem[]): string[] {
  return [...new Set(items.filter((i) => i.deletedAt === undefined).flatMap((i) => i.tags ?? []))].sort((a, b) => a.localeCompare(b));
}

/** Leitura estimada de um texto em HTML (200 palavras/min, para cima, como o site mostra). */
export function readingMinutes(html: string): number {
  const words = plainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Nova ordem depois de mover o item `id` uma posição (para a lista de `reorder`). */
export function moveId(ids: readonly string[], id: string, delta: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/**
 * Nova ordem depois de mover o item `id` uma posição entre os itens do mesmo grupo
 * (`same`: mesma aba, mesmo subgrupo). Troca com o vizinho do grupo na lista inteira, então
 * os outros itens não saem do lugar e a ordem geral continua coerente.
 */
export function moveIdWithin(ids: readonly string[], id: string, delta: -1 | 1, same: (id: string) => boolean): string[] {
  const from = ids.indexOf(id);
  if (from < 0) return [...ids];
  let to = from + delta;
  while (to >= 0 && to < ids.length && !same(ids[to]!)) to += delta;
  if (to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** Quantos itens fora da lixeira há em cada valor do campo das abas. */
export function tabCounts(items: readonly ListItem[], field: string, values: readonly string[]): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(values.map((v) => [v, 0]));
  for (const item of items) {
    const value = item[field];
    if (item.deletedAt === undefined && typeof value === "string" && value in out) out[value]! += 1;
  }
  return out;
}

/** Aba pedida no endereço, se ela existe; senão a primeira. */
export function pickTab(values: readonly string[], requested: string | null | undefined): string | undefined {
  return requested && values.includes(requested) ? requested : values[0];
}

/** Valor de agrupamento de um item: texto simples ou o do idioma principal (senão o primeiro preenchido). */
export function groupValue(item: Record<string, unknown>, key: string, locale: string): string {
  const value = item[key];
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") return textIn(value as Localized<string>, locale).trim();
  return "";
}

export interface ItemGroup<T> {
  /** Valor do campo de agrupamento ("" para os itens sem grupo). */
  group: string;
  items: T[];
}

/** Agrupa pelo campo `key`, na ordem em que cada grupo aparece pela primeira vez. */
export function groupItems<T extends Record<string, unknown>>(items: readonly T[], key: string, locale: string): ItemGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const value = groupValue(item, key, locale);
    groups.set(value, [...(groups.get(value) ?? []), item]);
  }
  return [...groups].map(([group, list]) => ({ group, items: list }));
}
