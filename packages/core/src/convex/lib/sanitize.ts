/**
 * Sanitização do HTML que vai ao site (conteúdo dos posts, cases e campos `richText`
 * dos blocos), feita no backend ao salvar. O site renderiza esse HTML sem escapar.
 *
 * Por que `xss` (js-xss) e não DOMPurify ou `sanitize-html`:
 * - DOMPurify precisa de um DOM (a v1 rodava no navegador); no Convex não há.
 * - `sanitize-html` depende do `postcss`, que usa módulos do Node: só rodaria numa
 *   action com "use node", e cada gravação viraria action + mutation.
 * - `xss` é JavaScript puro, sem dependência de Node nem de DOM, e roda no runtime
 *   padrão do Convex dentro da própria mutation. A lista de permissões é explícita.
 */
import { FilterXSS } from "xss";
import type { Localized } from "../../i18n";
import type { FieldDef, FieldMap } from "../../blocks/fields";

/**
 * Tags e atributos permitidos. Sem `h1` (é da página), sem `style`, `script`,
 * `iframe`, formulários nem eventos. O `xss` já recusa `javascript:` e afins em
 * `href`/`src`.
 */
const ALLOWED: Record<string, string[]> = {
  p: [],
  br: [],
  hr: [],
  h2: ["id"],
  h3: ["id"],
  h4: ["id"],
  h5: ["id"],
  h6: ["id"],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  del: [],
  ins: [],
  mark: [],
  small: [],
  sub: [],
  sup: [],
  abbr: ["title"],
  a: ["href", "title", "target", "rel"],
  ul: [],
  ol: ["start", "reversed"],
  li: [],
  blockquote: ["cite"],
  q: ["cite"],
  code: ["class"],
  pre: ["class"],
  kbd: [],
  img: ["src", "alt", "title", "width", "height", "loading"],
  figure: [],
  figcaption: [],
  table: [],
  caption: [],
  thead: [],
  tbody: [],
  tfoot: [],
  tr: [],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
  span: [],
};

const filter = new FilterXSS({
  whiteList: ALLOWED,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math"],
  allowCommentTag: false,
  css: false,
  onTagAttr(tag, name, value) {
    // `class` só com nomes de linguagem para realce de código (`language-ts`).
    if ((tag === "code" || tag === "pre") && name === "class") {
      return /^(language|lang)-[\w-]+$/.test(value) ? `class="${value}"` : "";
    }
    if (tag === "a" && name === "target") return value === "_blank" ? 'target="_blank"' : "";
    return undefined;
  },
});

/** HTML seguro para o site. */
export function sanitizeHtml(html: string): string {
  return filter.process(html);
}

export function sanitizeLocalizedHtml(value: Localized<string>): Localized<string> {
  const out: Localized<string> = {};
  for (const [locale, html] of Object.entries(value)) {
    if (typeof html === "string") out[locale] = sanitizeHtml(html);
  }
  return out;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeField(def: FieldDef, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (def.kind === "richText") {
    if (typeof value === "string") return sanitizeHtml(value);
    if (isObject(value)) return sanitizeLocalizedHtml(value as Localized<string>);
    return value;
  }
  if (def.kind === "list" && Array.isArray(value)) {
    return value.map((item) => (isObject(item) ? sanitizeFields(def.of, item) : item));
  }
  return value;
}

/** Campos de bloco com os `richText` sanitizados (inclusive dentro de listas). */
export function sanitizeFields(fields: FieldMap, values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const def = fields[key];
    out[key] = def ? sanitizeField(def, value) : value;
  }
  return out;
}
