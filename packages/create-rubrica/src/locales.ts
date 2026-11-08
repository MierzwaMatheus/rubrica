/** Idiomas do site (decisões 26 e 27): lista e principal. */
const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export const COMMON_LOCALES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

export function isLocale(value: string): boolean {
  return LOCALE.test(value);
}

/**
 * Valida a lista e o principal. O principal vai para o começo da lista (fica sem
 * prefixo na URL); prefixos repetidos (`pt-BR` e `pt-PT` → `/pt`) são recusados.
 */
export function normalizeLocales(list: string[], main?: string): { lista: string[]; principal: string } {
  const lista = [...new Set(list.map((l) => l.trim()).filter(Boolean))];
  if (lista.length === 0) throw new Error("Informe ao menos um idioma (ex.: pt-BR).");
  for (const l of lista) if (!isLocale(l)) throw new Error(`Idioma inválido: "${l}". Use códigos como pt-BR, en, es.`);
  const principal = main?.trim() || lista[0]!;
  if (!isLocale(principal)) throw new Error(`Idioma inválido: "${principal}".`);
  if (!lista.includes(principal)) lista.unshift(principal);
  const prefixes = new Map<string, string>();
  for (const l of lista) {
    if (l === principal) continue;
    const prefix = l.split("-")[0]!.toLowerCase();
    if (prefixes.has(prefix)) throw new Error(`Os idiomas ${prefixes.get(prefix)} e ${l} usariam o mesmo prefixo de URL (/${prefix}).`);
    prefixes.set(prefix, l);
  }
  return { lista: [principal, ...lista.filter((l) => l !== principal)], principal };
}
