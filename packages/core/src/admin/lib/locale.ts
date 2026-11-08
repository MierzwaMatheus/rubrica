/** Nome do idioma em português ("inglês"), para rótulos do painel. */
export function localeName(locale: string): string {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "language" }).of(locale) ?? locale;
  } catch {
    return locale;
  }
}
