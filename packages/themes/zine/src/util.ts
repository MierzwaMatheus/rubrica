/** Auxiliares puros do tema (o núcleo não exporta os dele). */
import type { RenderContext } from "@rubrica/core";

/** Só dígitos, para `wa.me` e `tel:`. */
export const digits = (value: string) => value.replace(/\D+/g, "");

/** Identificador seguro para `id` e seletores CSS. */
export const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

/** Link do campo de texto livre (`href` de logos): interno ganha o prefixo do idioma. */
export function resolveFreeHref(href: string | undefined, ctx: RenderContext): { href: string; external: boolean } | undefined {
  if (!href) return undefined;
  if (/^(https?:|\/\/)/i.test(href)) return { href, external: true };
  if (/^(mailto:|tel:|#)/i.test(href)) return { href, external: false };
  return { href: ctx.href(href), external: false };
}

const WEEKDAYS: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

/** "Mo-Fr" (schema.org) → "seg. – sex." no idioma. Formato desconhecido volta como veio. */
export function formatDays(days: string, locale: string): string {
  const name = (code: string): string | undefined => {
    const n = WEEKDAYS[code];
    if (n === undefined) return undefined;
    // 2024-01-07 foi um domingo.
    return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + n)));
  };
  const parts = days.split(",").map((part) => {
    const [a, b] = part.trim().split("-");
    const first = a && name(a);
    if (!first) return undefined;
    if (!b) return first;
    const last = name(b);
    return last ? `${first} – ${last}` : undefined;
  });
  return parts.every(Boolean) ? parts.join(", ") : days;
}

/** Primeiro nome, para a assinatura da carta ("Matheus Mierzwa" → "Matheus"). */
export const firstName = (name?: string) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * Regras CSS do filtro por etiqueta sem JavaScript (mesma ideia do núcleo): botões de
 * opção antes da lista e uma folha gerada esconde os recortes sem a etiqueta marcada.
 * As etiquetas viram abas de fita; a marcada fica na cor de destaque.
 */
export function tagFilterCss(scope: string, count: number): string {
  const rules: string[] = [];
  const on = "background:var(--rb-accent);color:var(--rb-accent-fg)";
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ .zn-clips > .zn-clip-item:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked ~ .zn-tabs label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible ~ .zn-tabs label[for="${scope}-t${i}"]{outline:3px solid var(--rb-fg);outline-offset:3px}`);
  }
  rules.push(`#${scope}-all:checked ~ .zn-tabs label[for="${scope}-all"]{${on}}`);
  rules.push(`#${scope}-all:focus-visible ~ .zn-tabs label[for="${scope}-all"]{outline:3px solid var(--rb-fg);outline-offset:3px}`);
  return rules.join("\n");
}
