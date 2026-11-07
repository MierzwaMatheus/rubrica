/**
 * Idioma pela URL: pt-BR na raiz (/blog/x) e inglês sob /en (/en/blog/x).
 * A URL é a fonte da verdade do idioma, para que cada versão seja indexável.
 */
export type Locale = "pt-BR" | "en-US";

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const EN_BASE = "/en";

/** Rotas que não têm versão por idioma (painel, login, playground). */
const UNLOCALIZED = [/^\/admin(\/|$)/, /^\/login(\/|$)/, /^\/playground(\/|$)/];

export function isEnPath(pathname: string): boolean {
  return pathname === EN_BASE || pathname.startsWith(`${EN_BASE}/`);
}

export function localeFromPath(pathname: string): Locale {
  return isEnPath(pathname) ? "en-US" : DEFAULT_LOCALE;
}

/** Caminho sem o prefixo de idioma: "/en/blog/x" → "/blog/x", "/en" → "/". */
export function stripLocale(pathname: string): string {
  if (!isEnPath(pathname)) return pathname || "/";
  return pathname.slice(EN_BASE.length) || "/";
}

export function isLocalizedPath(pathname: string): boolean {
  const path = stripLocale(pathname);
  return !UNLOCALIZED.some((re) => re.test(path));
}

/** Caminho no idioma pedido: ("/blog/x", "en-US") → "/en/blog/x"; ("/", "en-US") → "/en". */
export function localizedPath(pathname: string, locale: Locale): string {
  const path = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE || !isLocalizedPath(path)) return path;
  return path === "/" ? EN_BASE : `${EN_BASE}${path}`;
}

/** Base do wouter para o idioma: "" (pt-BR) ou "/en". */
export function routerBase(locale: Locale): string {
  return locale === "en-US" ? EN_BASE : "";
}
