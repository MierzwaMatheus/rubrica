/** Auxiliares dos blocos padrão (puros, sem estado). */
import type { ReactNode } from "react";
import type { ResolvedLink } from "../../blocks/fields";
import type { RenderContext } from "../../theme/contract";
import { LinkButton } from "../primitives";

/** Link do campo de texto livre (`href` de logos): interno ganha o prefixo do idioma. */
export function resolveFreeHref(href: string | undefined, ctx: RenderContext): { href: string; external: boolean } | undefined {
  if (!href) return undefined;
  if (/^(https?:|\/\/)/i.test(href)) return { href, external: true };
  if (/^(mailto:|tel:|#)/i.test(href)) return { href, external: false };
  return { href: ctx.href(href), external: false };
}

/** Parte do texto que pode virar link para uma página interna (`/portfolio/x`) ou externa. */
export function ExternalHint({ external, ctx }: { external: boolean; ctx: RenderContext }) {
  return external ? <span className="rb-sr-only"> {ctx.t("common.external")}</span> : null;
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="rb-actions">{children}</div>;
}

export function CtaLink({ link, variant = "secondary" }: { link?: ResolvedLink; variant?: "primary" | "secondary" | "ghost" }) {
  return link ? <LinkButton link={link} variant={variant} /> : null;
}

const WEEKDAYS: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

/** "Mo-Fr" (schema.org) → "seg. a sex." no idioma. Formatos desconhecidos voltam como vieram. */
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

/** Só dígitos, para `wa.me` e `tel:`. */
export function digits(value: string): string {
  return value.replace(/\D+/g, "");
}

/** Identificador seguro para usar em `id` e seletores CSS. */
export function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Corta um texto longo no limite, sem partir palavra, com reticências. */
export function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).trimEnd()}…`;
}

export interface TagFilterCssOptions {
  /** Itens filtrados, a partir do irmão dos botões de opção. Padrão: `.rb-posts__list > .rb-post`. */
  items?: string;
  /** Grupo dos rótulos, irmão dos botões de opção. Padrão: `.rb-filter`. */
  filter?: string;
  /** Declarações CSS do rótulo marcado. */
  checked?: string;
  /** Declarações CSS do rótulo com foco do teclado. */
  focus?: string;
}

/**
 * Filtro por etiqueta SEM JavaScript: botões de opção (`radio`, ids `<scope>-all` e
 * `<scope>-t<i>`) antes da lista e uma folha de estilo gerada para o bloco esconde os
 * itens cujo `data-tags` não tem `t<i>`. Sem CSS, a lista aparece inteira. Os ids vêm do
 * índice, nunca do texto da etiqueta. Os seletores e o destaque se ajustam ao tema.
 */
export function tagFilterCss(scope: string, count: number, options: TagFilterCssOptions = {}): string {
  const items = options.items ?? ".rb-posts__list > .rb-post";
  const filter = options.filter ?? ".rb-filter";
  const on = options.checked ?? "background:var(--rb-accent);color:var(--rb-accent-fg);border-color:var(--rb-accent)";
  const ring = options.focus ?? "outline:2px solid var(--rb-accent);outline-offset:2px";
  const rules: string[] = [];
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ ${items}:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked ~ ${filter} label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible ~ ${filter} label[for="${scope}-t${i}"]{${ring}}`);
  }
  rules.push(`#${scope}-all:checked ~ ${filter} label[for="${scope}-all"]{${on}}`);
  rules.push(`#${scope}-all:focus-visible ~ ${filter} label[for="${scope}-all"]{${ring}}`);
  return rules.join("\n");
}
