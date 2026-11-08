/**
 * Textos traduzíveis no banco (decisão 26): um mapa idioma → texto, no lugar dos
 * campos fixos `ptBR`/`enUS` da v1.
 */
import type { Locale, Localized } from "../../i18n";

/** Código BCP 47 simples: `pt`, `pt-BR`, `en`, `zh-Hant-TW`. */
const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export function isLocaleCode(value: string): boolean {
  return LOCALE_PATTERN.test(value);
}

/**
 * Normaliza um texto traduzível antes de gravar: recusa códigos de idioma inválidos
 * e tira os idiomas vazios (texto vazio = não traduzido, decisão 28).
 */
export function cleanLocalized(value: Record<string, string>, path = "texto"): Localized<string> {
  const out: Localized<string> = {};
  for (const [locale, text] of Object.entries(value)) {
    if (!isLocaleCode(locale)) throw new Error(`${path}: código de idioma inválido "${locale}"`);
    if (typeof text !== "string") throw new Error(`${path}.${locale}: deve ser texto`);
    if (text.trim().length > 0) out[locale] = text;
  }
  return out;
}

/** Idiomas preenchidos. */
export function filledLocales(value: Localized<string> | undefined): Locale[] {
  if (!value) return [];
  return Object.entries(value)
    .filter(([, text]) => typeof text === "string" && text.trim().length > 0)
    .map(([locale]) => locale);
}

/** Texto num idioma, senão no principal, senão o primeiro preenchido. Para rótulos e slugs. */
export function anyText(value: Localized<string> | undefined, prefer?: Locale): string {
  if (!value) return "";
  if (prefer && value[prefer]?.trim()) return value[prefer]!;
  const first = filledLocales(value)[0];
  return first ? value[first]! : "";
}

/** Tradução da v1: `{ ptBR, enUS }`, com `enUS` opcional. */
export interface V1Translations {
  ptBR?: string;
  enUS?: string;
}

/** Códigos usados pela migração. As URLs `/en` da v1 continuam iguais (decisão 27). */
export const V1_LOCALES = { ptBR: "pt-BR", enUS: "en" } as const;

/**
 * Converte um texto da v1 (campo principal + `translations`) para o mapa por idioma.
 * O campo principal da v1 era em português; a tradução, quando existe, ganha dele.
 */
export function fromV1Translations(
  main: string | undefined,
  translations?: V1Translations | null,
  locales: { ptBR: Locale; enUS: Locale } = V1_LOCALES,
): Localized<string> {
  const out: Localized<string> = {};
  const pt = translations?.ptBR?.trim() ? translations.ptBR : main;
  if (pt?.trim()) out[locales.ptBR] = pt;
  if (translations?.enUS?.trim()) out[locales.enUS] = translations.enUS;
  return out;
}
