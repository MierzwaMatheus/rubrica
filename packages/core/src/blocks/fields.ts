/**
 * Campos dos blocos. Um schema só, escrito uma vez por bloco, alimenta:
 * - a validação no backend e no MCP (`validateFields`);
 * - o formulário do painel (lê `kind`, `label`, `help`);
 * - as props que o tema recebe, já resolvidas no idioma (`ResolvedFields`).
 *
 * Valores guardados no Convex ("crus"):
 * - text/richText traduzíveis: `Localized<string>`; não traduzíveis: `string`
 * - image: `{ url, storageId?, alt?: Localized<string> }`
 * - link: `{ label: Localized<string>, href }`
 * - list: array de objetos com os campos de `of`
 */
import type { Localized } from "../i18n";

interface BaseField {
  /** Rótulo no painel (pt-BR). */
  label: string;
  help?: string;
  required?: boolean;
}

export interface TextField extends BaseField {
  kind: "text";
  /** Traduzível por idioma. Padrão: true. */
  localized?: boolean;
  multiline?: boolean;
  maxLength?: number;
}
export interface RichTextField extends BaseField {
  kind: "richText";
  localized?: boolean;
}
export interface NumberField extends BaseField {
  kind: "number";
  min?: number;
  max?: number;
  integer?: boolean;
}
export interface BooleanField extends BaseField {
  kind: "boolean";
  default?: boolean;
}
export interface SelectField<V extends string = string> extends BaseField {
  kind: "select";
  options: readonly { value: V; label: string }[];
  default?: V;
}
export interface ImageField extends BaseField {
  kind: "image";
}
export interface LinkField extends BaseField {
  kind: "link";
}
export interface ListField<Of extends FieldMap = FieldMap> extends BaseField {
  kind: "list";
  of: Of;
  min?: number;
  max?: number;
  /** Rótulo de cada item no painel ("Número", "Princípio"). */
  itemLabel?: string;
}

export type FieldDef = TextField | RichTextField | NumberField | BooleanField | SelectField | ImageField | LinkField | ListField;
export type FieldMap = Record<string, FieldDef>;

// ── Construtores (inferem os tipos literais) ────────────────────────────────

export const field = {
  text: (o: Omit<TextField, "kind">): TextField => ({ kind: "text", ...o }),
  richText: (o: Omit<RichTextField, "kind">): RichTextField => ({ kind: "richText", ...o }),
  number: (o: Omit<NumberField, "kind">): NumberField => ({ kind: "number", ...o }),
  boolean: (o: Omit<BooleanField, "kind">): BooleanField => ({ kind: "boolean", ...o }),
  select: <const V extends string>(o: Omit<SelectField<V>, "kind">): SelectField<V> => ({ kind: "select", ...o }),
  image: (o: Omit<ImageField, "kind">): ImageField => ({ kind: "image", ...o }),
  link: (o: Omit<LinkField, "kind">): LinkField => ({ kind: "link", ...o }),
  list: <const Of extends FieldMap>(o: Omit<ListField<Of>, "kind">): ListField<Of> => ({ kind: "list", ...o }),
};

// ── Valores crus e resolvidos ───────────────────────────────────────────────

export interface RawImage {
  url: string;
  storageId?: string;
  alt?: Localized<string>;
  width?: number;
  height?: number;
}
export interface RawLink {
  label: Localized<string>;
  href: string;
}
export interface ResolvedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
export interface ResolvedLink {
  label: string;
  href: string;
  external: boolean;
  /**
   * Id da janela (`popover`) que o link abre no lugar de navegar: links para o contato
   * (`#contato`, `/#contato` ou `contato:`) quando o site tem a janela de contato. Quem
   * desenha o link usa um `<button popoverTarget={dialog}>` (o `LinkButton` já faz).
   */
  dialog?: string;
}

type IsLocalized<F> = F extends { localized: false } ? false : true;

export type RawValue<F extends FieldDef> = F extends TextField | RichTextField
  ? IsLocalized<F> extends true
    ? Localized<string>
    : string
  : F extends NumberField
    ? number
    : F extends BooleanField
      ? boolean
      : F extends SelectField<infer V>
        ? V
        : F extends ImageField
          ? RawImage
          : F extends LinkField
            ? RawLink
            : F extends ListField<infer Of>
              ? RawFields<Of>[]
              : never;

export type ResolvedValue<F extends FieldDef> = F extends TextField | RichTextField
  ? string
  : F extends NumberField
    ? number
    : F extends BooleanField
      ? boolean
      : F extends SelectField<infer V>
        ? V
        : F extends ImageField
          ? ResolvedImage
          : F extends LinkField
            ? ResolvedLink
            : F extends ListField<infer Of>
              ? ResolvedFields<Of>[]
              : never;

type RequiredKeys<M extends FieldMap> = { [K in keyof M]: M[K] extends { required: true } ? K : never }[keyof M];
type OptionalKeys<M extends FieldMap> = Exclude<keyof M, RequiredKeys<M>>;

export type RawFields<M extends FieldMap> = { [K in RequiredKeys<M>]: RawValue<M[K]> } & {
  [K in OptionalKeys<M>]?: RawValue<M[K]>;
};
/**
 * No tema, campo traduzível sem tradução no idioma chega como `undefined`, mesmo se
 * for obrigatório no painel: a página pode existir num idioma com um campo vazio.
 */
export type ResolvedFields<M extends FieldMap> = { [K in keyof M]?: ResolvedValue<M[K]> };

// ── Validação ───────────────────────────────────────────────────────────────

export interface FieldError {
  /** Caminho do campo: `items.2.label`. */
  path: string;
  message: string;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isLocalizedString(v: unknown): v is Localized<string> {
  return isObject(v) && Object.values(v).every((s) => typeof s === "string");
}

function hasLocalizedValue(v: Localized<string>): boolean {
  return Object.values(v).some((s) => typeof s === "string" && s.trim().length > 0);
}

function validateField(def: FieldDef, value: unknown, path: string, errors: FieldError[]): void {
  const missing = value === undefined || value === null || value === "";
  if (missing) {
    if (def.required) errors.push({ path, message: `${def.label}: obrigatório` });
    return;
  }
  const fail = (message: string): void => {
    errors.push({ path, message: `${def.label}: ${message}` });
  };

  switch (def.kind) {
    case "text":
    case "richText": {
      if (def.localized === false) {
        if (typeof value !== "string") return fail("deve ser texto");
        if (def.kind === "text" && def.maxLength && value.length > def.maxLength) fail(`até ${def.maxLength} caracteres`);
        return;
      }
      if (!isLocalizedString(value)) return fail("deve ser um texto por idioma ({ \"pt-BR\": \"...\" })");
      if (def.required && !hasLocalizedValue(value)) return fail("obrigatório em pelo menos um idioma");
      if (def.kind === "text" && def.maxLength) {
        for (const [locale, s] of Object.entries(value)) {
          if (s && s.length > def.maxLength) errors.push({ path: `${path}.${locale}`, message: `${def.label}: até ${def.maxLength} caracteres` });
        }
      }
      return;
    }
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) return fail("deve ser número");
      if (def.integer && !Number.isInteger(value)) fail("deve ser inteiro");
      if (def.min !== undefined && value < def.min) fail(`mínimo ${def.min}`);
      if (def.max !== undefined && value > def.max) fail(`máximo ${def.max}`);
      return;
    case "boolean":
      if (typeof value !== "boolean") fail("deve ser verdadeiro ou falso");
      return;
    case "select":
      if (!def.options.some((o) => o.value === value)) fail(`opção inválida: ${String(value)}`);
      return;
    case "image":
      if (!isObject(value) || typeof value.url !== "string" || !value.url) return fail("imagem sem url");
      if (value.alt !== undefined && !isLocalizedString(value.alt)) fail("texto alternativo deve ser um texto por idioma");
      return;
    case "link":
      if (!isObject(value) || typeof value.href !== "string" || !value.href) return fail("link sem endereço");
      if (!isLocalizedString(value.label)) fail("rótulo do link deve ser um texto por idioma");
      return;
    case "list": {
      if (!Array.isArray(value)) return fail("deve ser uma lista");
      if (def.min !== undefined && value.length < def.min) fail(`pelo menos ${def.min} itens`);
      if (def.max !== undefined && value.length > def.max) fail(`no máximo ${def.max} itens`);
      value.forEach((item, i) => {
        if (!isObject(item)) {
          errors.push({ path: `${path}.${i}`, message: `${def.label}: item ${i + 1} inválido` });
          return;
        }
        validateFieldMap(def.of, item, `${path}.${i}`, errors);
      });
      return;
    }
  }
}

function validateFieldMap(fields: FieldMap, values: Record<string, unknown>, prefix: string, errors: FieldError[]): void {
  for (const [key, def] of Object.entries(fields)) {
    validateField(def, values[key], prefix ? `${prefix}.${key}` : key, errors);
  }
  for (const key of Object.keys(values)) {
    if (!(key in fields)) errors.push({ path: prefix ? `${prefix}.${key}` : key, message: `campo desconhecido: ${key}` });
  }
}

/** Erros dos valores crus contra o schema. Lista vazia = válido. */
export function validateFields(fields: FieldMap, values: unknown): FieldError[] {
  const errors: FieldError[] = [];
  if (!isObject(values)) return [{ path: "", message: "os campos do bloco devem ser um objeto" }];
  validateFieldMap(fields, values, "", errors);
  return errors;
}
