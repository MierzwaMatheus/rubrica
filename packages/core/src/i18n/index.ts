/**
 * Idiomas do site (RFC v2, decisões 26 a 28).
 *
 * - O site declara a lista de idiomas e qual é o principal.
 * - O principal não tem prefixo na URL; os outros ficam em `/<prefixo>`.
 * - Um texto traduzível é um mapa idioma → valor (`Localized<T>`).
 * - Conteúdo sem tradução num idioma não existe nesse idioma: `pick` devolve
 *   `undefined` e quem gera as páginas pula. Só os textos de interface caem no
 *   idioma principal (`pickWithFallback`).
 */

/** Código BCP 47 do idioma, como `pt-BR`, `en` ou `es`. */
export type Locale = string;

/** Valor traduzível: um valor por idioma. Idiomas ausentes não estão traduzidos. */
export type Localized<T = string> = Partial<Record<Locale, T>>;

export interface LocaleConfig {
  /** Idiomas do site, na ordem em que aparecem no seletor. Inclui o principal. */
  locales: Locale[];
  /** Idioma principal: sem prefixo na URL, usado como reserva dos textos de interface. */
  default: Locale;
  /**
   * Prefixo de URL de cada idioma que não é o principal. Sem entrada, usa a parte
   * antes do hífen em minúsculas (`en-US` → `en`).
   */
  prefixes?: Partial<Record<Locale, string>>;
}

export function defineLocales(config: LocaleConfig): LocaleConfig {
  if (config.locales.length === 0) throw new Error("[rubrica] a lista de idiomas está vazia");
  if (!config.locales.includes(config.default)) {
    throw new Error(`[rubrica] o idioma principal "${config.default}" não está na lista de idiomas`);
  }
  const seen = new Set<string>();
  for (const locale of config.locales) {
    if (locale === config.default) continue;
    const prefix = localePrefix(locale, config);
    if (!/^[a-z0-9-]+$/.test(prefix)) throw new Error(`[rubrica] prefixo de URL inválido para ${locale}: "${prefix}"`);
    if (seen.has(prefix)) throw new Error(`[rubrica] dois idiomas usam o prefixo "/${prefix}"`);
    seen.add(prefix);
  }
  return config;
}

/** Prefixo de URL do idioma. O principal devolve "" (sem prefixo). */
export function localePrefix(locale: Locale, config: LocaleConfig): string {
  if (locale === config.default) return "";
  return config.prefixes?.[locale] ?? locale.split("-")[0]!.toLowerCase();
}

/** Caminho no idioma: `/blog` → `/en/blog`. O principal fica sem prefixo. */
export function localizedPath(path: string, locale: Locale, config: LocaleConfig): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const prefix = localePrefix(locale, config);
  if (!prefix) return clean;
  return clean === "/" ? `/${prefix}` : `/${prefix}${clean}`;
}

/** Idioma e caminho sem prefixo a partir da URL: `/en/blog` → `{ locale: "en", path: "/blog" }`. */
export function splitLocale(pathname: string, config: LocaleConfig): { locale: Locale; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  for (const locale of config.locales) {
    if (locale === config.default) continue;
    if (first === localePrefix(locale, config)) {
      const path = `/${rest.join("/")}`;
      return { locale, path: path === "/" ? "/" : path.replace(/\/+$/, "") || "/" };
    }
  }
  return { locale: config.default, path: pathname || "/" };
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/** Valor no idioma, ou `undefined` se não estiver traduzido (decisão 28). */
export function pick<T>(value: Localized<T> | undefined, locale: Locale): T | undefined {
  const v = value?.[locale];
  return hasValue(v) ? v : undefined;
}

/** Valor no idioma, caindo no principal. Só para textos de interface. */
export function pickWithFallback<T>(value: Localized<T> | undefined, locale: Locale, config: LocaleConfig): T | undefined {
  return pick(value, locale) ?? pick(value, config.default);
}

/** Idiomas em que o valor está traduzido, na ordem da configuração. */
export function translatedLocales(value: Localized<unknown> | undefined, config: LocaleConfig): Locale[] {
  return config.locales.filter((locale) => hasValue(value?.[locale]));
}
