/**
 * Lógica pura do editor de páginas e dos formulários gerados do schema de campos
 * (`blocks/fields.ts`): valores iniciais, edição de textos por idioma, o que falta
 * traduzir, erros por campo e operações na lista de blocos. Sem React: testável e
 * usada também pelo backend de demonstração.
 */
import type { BlockDefinition } from "../../blocks/define";
import type { FieldDef, FieldError, FieldMap } from "../../blocks/fields";
import type { BlockInstance, SeoFields, SiteKind } from "../../content/types";
import type { Locale, Localized } from "../../i18n";

export type Values = Record<string, unknown>;

/** Página como o editor a guarda enquanto a pessoa mexe. */
export interface PageDraft {
  id: string;
  path: string;
  title: Localized<string>;
  seo?: SeoFields;
  blocks: BlockInstance[];
  published: boolean;
  system?: boolean;
  updatedAt: number;
}

// ── Valores ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Values {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Campo traduzível (texto, texto rico) segundo o schema. */
export function isLocalizedField(def: FieldDef): boolean {
  return (def.kind === "text" || def.kind === "richText") && def.localized !== false;
}

/** Valor vazio no sentido do schema: some do objeto ao gravar. */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return false;
  if (isObject(value) && Object.keys(value).length === 0) return true;
  return false;
}

/** Texto de um idioma; texto vazio tira o idioma (vazio = não traduzido, decisão 28). */
export function setLocalized(value: Localized<string> | undefined, locale: Locale, text: string): Localized<string> | undefined {
  const next: Localized<string> = { ...(value ?? {}) };
  if (text.trim() === "" || text === "<p></p>") delete next[locale];
  else next[locale] = text;
  return Object.keys(next).length ? next : undefined;
}

/** Atribui o campo, apagando a chave quando o valor fica vazio. */
export function setField(values: Values, key: string, value: unknown): Values {
  const next = { ...values };
  if (isEmptyValue(value)) delete next[key];
  else next[key] = value;
  return next;
}

/** Item novo de uma lista: listas internas obrigatórias já com o mínimo de itens. */
export function initialFields(fields: FieldMap): Values {
  const out: Values = {};
  for (const [key, def] of Object.entries(fields)) {
    if (def.kind === "list" && def.required && def.min) {
      out[key] = Array.from({ length: def.min }, () => initialFields(def.of));
    }
  }
  return out;
}

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Id curto e único entre os blocos da página (formato aceito pelo backend). */
export function newBlockId(taken: Iterable<string>, random: () => number = Math.random): string {
  const used = new Set(taken);
  for (;;) {
    let id = "b";
    for (let i = 0; i < 6; i++) id += ID_CHARS[Math.floor(random() * ID_CHARS.length)];
    if (!used.has(id)) return id;
  }
}

export function newBlock(def: BlockDefinition, taken: Iterable<string>, random?: () => number): BlockInstance {
  const block: BlockInstance = { id: newBlockId(taken, random), type: def.type, visible: true, fields: initialFields(def.fields) };
  if (def.source) block.source = structuredClone(def.source.default) as BlockInstance["source"];
  return block;
}

export function duplicateBlock(block: BlockInstance, taken: Iterable<string>, random?: () => number): BlockInstance {
  const copy = structuredClone(block);
  copy.id = newBlockId(taken, random);
  // Âncora repetida quebraria os links #âncora da página.
  if (typeof copy.fields.anchor === "string") delete copy.fields.anchor;
  return copy;
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item!);
  return next;
}

/** Tira `undefined` (o Convex não aceita em listas) e objetos vazios. */
export function prune<T>(value: T): T {
  if (Array.isArray(value)) return value.filter((v) => v !== undefined).map((v) => prune(v)) as T;
  if (!isObject(value)) return value;
  const out: Values = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    out[k] = prune(v);
  }
  return out as T;
}

/** Mesma página? (para saber se há mudanças por salvar) */
export function sameDraft(a: unknown, b: unknown): boolean {
  return stableJson(prune(a)) === stableJson(prune(b));
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

// ── Traduções ───────────────────────────────────────────────────────────────

function filled(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const text = v.replace(/<[^>]*>/g, "").trim();
  return text.length > 0;
}

export interface MissingTranslation {
  /** Caminho do campo (`items.0.label`, `primaryCta.label`, `image.alt`). */
  path: string;
  label: string;
  missing: Locale[];
}

function missingIn(value: unknown, locales: readonly Locale[]): Locale[] {
  const map = isObject(value) ? value : {};
  if (!locales.some((l) => filled(map[l]))) return [];
  return locales.filter((l) => !filled(map[l]));
}

/**
 * Textos traduzíveis preenchidos em algum idioma e vazios em outros. Campo vazio em
 * todos não conta (não é tradução que falta, é campo vazio).
 */
export function missingTranslations(fields: FieldMap, values: Values | undefined, locales: readonly Locale[], prefix = ""): MissingTranslation[] {
  const out: MissingTranslation[] = [];
  if (locales.length < 2) return out;
  const at = (key: string) => (prefix ? `${prefix}.${key}` : key);
  for (const [key, def] of Object.entries(fields)) {
    const value = values?.[key];
    if (value === undefined) continue;
    if (isLocalizedField(def)) {
      const missing = missingIn(value, locales);
      if (missing.length) out.push({ path: at(key), label: def.label, missing });
    } else if (def.kind === "link" && isObject(value)) {
      const missing = missingIn(value.label, locales);
      if (missing.length) out.push({ path: at(`${key}.label`), label: `${def.label} (rótulo)`, missing });
    } else if (def.kind === "image" && isObject(value)) {
      const missing = missingIn(value.alt, locales);
      if (missing.length) out.push({ path: at(`${key}.alt`), label: `${def.label} (texto alternativo)`, missing });
    } else if (def.kind === "list" && Array.isArray(value)) {
      value.forEach((item, i) => {
        if (isObject(item)) out.push(...missingTranslations(def.of, item, locales, at(`${key}.${i}`)));
      });
    }
  }
  return out;
}

/** Idiomas com alguma tradução faltando no conjunto. */
export function missingLocales(list: MissingTranslation[]): Locale[] {
  return [...new Set(list.flatMap((m) => m.missing))];
}

/** O que falta traduzir num campo e abaixo dele. */
export function missingUnder(list: MissingTranslation[], path: string): Locale[] {
  return missingLocales(list.filter((m) => m.path === path || m.path.startsWith(`${path}.`)));
}

// ── Erros ───────────────────────────────────────────────────────────────────

/**
 * Erros que um controle mostra. Campos simples ficam com os do próprio caminho e os
 * de idioma abaixo dele (`title.en`); a lista só com os dela (mínimo, máximo), porque
 * cada item mostra os seus.
 */
export function errorsAt(errors: readonly FieldError[], path: string, kind?: FieldDef["kind"]): FieldError[] {
  return errors.filter((e) => e.path === path || (kind !== "list" && e.path.startsWith(`${path}.`)));
}

/** Há erro em algum ponto abaixo do caminho (para abrir o item da lista com erro). */
export function hasErrorUnder(errors: readonly FieldError[], path: string): boolean {
  return errors.some((e) => e.path === path || e.path.startsWith(`${path}.`));
}

export interface BlockError extends FieldError {
  index: number;
  blockId?: string;
}

/**
 * Lê a mensagem do backend (`preparePageBlocks`): "Página inválida: bloco 1 (h1) title:
 * Título: obrigatório; bloco 2 …". Em produção o Convex esconde a mensagem; por isso o
 * painel valida antes com `panel.validatePage` e isto fica como reserva.
 */
export function parseBlockErrors(message: string): BlockError[] {
  const at = message.indexOf("Página inválida: ");
  if (at < 0) return [];
  const body = message.slice(at + "Página inválida: ".length).split(/\n\s+at /)[0]!;
  const out: BlockError[] = [];
  for (const part of body.split("; ")) {
    const m = /^bloco (\d+)(?: \(([^)]+)\))?(?: ([A-Za-z0-9._-]+))?: ([\s\S]*)$/.exec(part.trim());
    if (!m) continue;
    const error: BlockError = { index: Number(m[1]) - 1, path: m[3] ?? "", message: m[4]!.trim() };
    if (m[2]) error.blockId = m[2];
    out.push(error);
  }
  return out;
}

/** Mensagem legível de um erro do Convex (tira o prefixo "[CONVEX M(...)] ... Uncaught Error:"). */
export function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const data = (error as { data?: unknown })?.data;
  if (typeof data === "string" && data) return data;
  const uncaught = raw.split("Uncaught Error: ")[1] ?? raw.replace(/^\[CONVEX [^\]]*\]\s*(\[Request ID: [^\]]*\]\s*)?/, "");
  const clean = uncaught.split(/\n\s+at /)[0]!.replace(/\s*Called by client$/, "").trim();
  if (!clean || /^Server Error$/i.test(clean)) return "O servidor recusou a operação. Tente de novo ou fale com quem cuida do site.";
  return clean;
}

// ── Catálogo e resumo ───────────────────────────────────────────────────────

/** Blocos que a página pode receber: do tipo do site e com o plugin ligado. */
export function availableBlocks(blocks: readonly BlockDefinition[], kind: SiteKind, enabled: ReadonlySet<string>): BlockDefinition[] {
  return blocks.filter((b) => (b.category === "comum" || b.category === kind) && (!b.plugin || enabled.has(b.plugin)));
}

/** Por que um bloco da página não aparece no site (outro tipo de site, plugin desligado). */
export function blockUnavailableReason(def: BlockDefinition | undefined, kind: SiteKind, enabled: ReadonlySet<string>): string | undefined {
  if (!def) return "Tipo de bloco desconhecido";
  if (def.category !== "comum" && def.category !== kind) return `Só existe em sites do tipo ${def.category}`;
  if (def.plugin && !enabled.has(def.plugin)) return `Precisa do plugin "${def.plugin}" ligado`;
  return undefined;
}

function textOf(value: unknown, locale: Locale): string | undefined {
  if (typeof value === "string") return filled(value) ? value : undefined;
  if (!isObject(value)) return undefined;
  const preferred = value[locale];
  if (filled(preferred)) return preferred as string;
  const any = Object.values(value).find(filled);
  return typeof any === "string" ? any : undefined;
}

/** Texto curto que identifica o bloco na lista (título, sobretítulo…). */
export function blockSummary(block: BlockInstance, def: BlockDefinition | undefined, locale: Locale): string {
  const keys = ["title", "eyebrow", "subtitle", "body", "intro"];
  for (const key of keys) {
    const text = textOf(block.fields[key], locale);
    if (text) {
      const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return plain.length > 70 ? `${plain.slice(0, 69)}…` : plain;
    }
  }
  return def?.description ?? "";
}
