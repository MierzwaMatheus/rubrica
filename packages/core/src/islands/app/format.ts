/** Formatação das páginas do app: dinheiro (sempre real), datas no idioma, documentos, textos traduzíveis. */
import type { Localized } from "../../i18n";

export function money(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(value);
}

export function dateText(ms: number, locale: string): string {
  return new Date(ms).toLocaleDateString(locale);
}

export function dateTimeText(ms: number, locale: string): string {
  return new Date(ms).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
}

/** "AAAA-MM-DD" como data local (sem o deslocamento de fuso do `new Date(string)`). */
export function dayText(day: string, locale: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d).toLocaleDateString(locale) : day;
}

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** CPF (11 dígitos) ou CNPJ (14) com pontuação; o resto fica como veio. */
export function formatDocument(value: string): string {
  const n = onlyDigits(value);
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
}

/** Máscara enquanto a pessoa digita (até 14 dígitos). */
export function maskDocument(value: string): string {
  const n = onlyDigits(value).slice(0, 14);
  if (n.length <= 11) {
    return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return n.length === 14 ? formatDocument(n) : n;
}

export const isDocument = (value: string) => [11, 14].includes(onlyDigits(value).length);

/**
 * Texto no idioma da página. Conteúdo das propostas é do comercial: se faltar a tradução,
 * cai no idioma principal e depois em qualquer um (uma proposta nunca some por idioma).
 */
export function pickText(value: Localized<string> | string | undefined | null, locale: string, fallback: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const base = locale.split("-")[0]!.toLowerCase();
  const exact = value[locale] ?? Object.entries(value).find(([k]) => k.split("-")[0]!.toLowerCase() === base)?.[1];
  return (exact?.trim() ? exact : undefined) ?? (value[fallback]?.trim() ? value[fallback] : undefined) ?? Object.values(value).find((v) => v?.trim()) ?? "";
}
