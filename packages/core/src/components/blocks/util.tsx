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
