/** Pequenos utilitários puros do tema (numerais romanos, fólios decorativos, listas em frase). */

const ROMAN: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** Numeral romano (1 → "I"). Zero ou negativo devolve texto vazio. */
export function toRoman(n: number): string {
  let rest = Math.floor(n);
  let out = "";
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

/**
 * Fólios decorativos do sumário: cada item "ocupa" páginas proporcionais ao tamanho do
 * texto e o sumário mostra em que página ele começa. Determinístico.
 */
export function folios(lengths: number[], firstPage = 3): number[] {
  const pages: number[] = [];
  let page = firstPage;
  for (const len of lengths) {
    pages.push(page);
    page += Math.max(2, Math.ceil(len / 500));
  }
  return pages;
}

/** Junta itens como numa frase no idioma ("a, b e c"). */
export function joinAsSentence(items: string[], locale: string): string {
  if (items.length <= 1) return items.join("");
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
}

/** Só dígitos, para `wa.me` e `tel:`. */
export function digits(value: string): string {
  return value.replace(/\D+/g, "");
}
