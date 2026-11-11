/**
 * Datas do site: dia em que o post saiu, mês de uma experiência do currículo.
 *
 * Um instante (`2026-11-07T23:30:00.000Z`) vira o dia no fuso do site: um post publicado
 * às 21h no Brasil é do dia 7, não do dia 8 (como a v1 mostrava, no fuso do navegador).
 * Uma data sem hora (`2026-11-07`, `2024-03`) é um dia do calendário: fica em UTC, senão
 * o fuso a jogaria para o dia anterior.
 */
import type { Locale } from "../i18n";

/**
 * Fuso pelo país do idioma principal do site (`pt-BR` → Brasília). Os sites do Rubrica não
 * guardam fuso; o idioma principal é o melhor indício de onde o dono está. Sem país, ou
 * país fora da lista, vale UTC (o comportamento de antes).
 */
const ZONE_BY_REGION: Record<string, string> = {
  BR: "America/Sao_Paulo",
  PT: "Europe/Lisbon",
  ES: "Europe/Madrid",
  MX: "America/Mexico_City",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  UY: "America/Montevideo",
  GB: "Europe/London",
  US: "America/New_York",
};

export function siteTimeZone(defaultLocale: Locale): string {
  const region = defaultLocale.split("-")[1]?.toUpperCase();
  return (region && ZONE_BY_REGION[region]) || "UTC";
}

const FORMATS: Record<"long" | "short" | "month", Intl.DateTimeFormatOptions> = {
  long: { day: "numeric", month: "long", year: "numeric" },
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  month: { month: "short", year: "numeric" },
};

const DATE_ONLY = /^\d{4}-\d{2}(-\d{2})?$/;

/** Data no idioma: instantes no fuso do site, datas sem hora como estão. */
export function formatSiteDate(iso: string, locale: Locale, timeZone: string, style: "long" | "short" | "month" = "long"): string {
  const zone = DATE_ONLY.test(iso) ? "UTC" : timeZone;
  return new Intl.DateTimeFormat(locale, { ...FORMATS[style], timeZone: zone }).format(new Date(iso));
}
