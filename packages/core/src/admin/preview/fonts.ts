/**
 * Fontes de conteúdo na prévia do painel. No site, a Fonts API do Astro baixa no build a
 * fonte do cliente e as famílias dos blocos `tipografia` e preenche a variável de cada uma
 * (`fontVarFor`). Na prévia não há build: as famílias vêm do Google Fonts e as variáveis são
 * definidas aqui, com o mesmo nome, para os componentes acharem a fonte do mesmo jeito.
 */
import type { BlockInstance } from "../../content/types";
import { fontFallbacks, fontsInBlocks, fontVarFor, fontWeights, isSafeFamily, KNOWN_FONTS } from "../../theme/fonts";

/**
 * Endereço do Google Fonts de uma família. Pedir um peso que a família não tem derruba o
 * pedido inteiro (Bebas Neue e DM Serif Display só têm o 400): família conhecida pede os
 * pesos que ela tem (os pedidos, se algum existir nela); desconhecida vai sem eixo, que traz
 * o regular (toda família tem) e deixa o navegador simular o resto.
 */
export function googleFontHref(family: string, wanted: readonly number[] = []): string {
  const name = encodeURIComponent(family.trim()).replace(/%20/g, "+");
  if (!KNOWN_FONTS.includes(family.trim())) return `https://fonts.googleapis.com/css2?family=${name}&display=swap`;
  const known = fontWeights(family.trim());
  const valid = wanted.filter((w) => known.includes(w));
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${(valid.length ? valid : known).join(";")}&display=swap`;
}

export interface PreviewContentFonts {
  /** `:root{--rbf-f-…:"Família",reservas}` para cada família, ou vazio. */
  css: string;
  /** Um `<link>` por família (uma família que falha não derruba as outras). */
  hrefs: string[];
}

/** As famílias dos blocos `tipografia` mostrados e a fonte do cliente: variáveis e endereços. */
export function previewContentFonts(blocks: readonly Pick<BlockInstance, "type" | "fields">[], brandFont?: string): PreviewContentFonts {
  const byFamily = new Map<string, Set<number>>();
  for (const use of [...fontsInBlocks(blocks), ...(brandFont ? [{ family: brandFont.trim(), weights: [] }] : [])]) {
    if (!isSafeFamily(use.family)) continue;
    const weights = byFamily.get(use.family) ?? new Set<number>();
    use.weights.forEach((w) => weights.add(w));
    byFamily.set(use.family, weights);
  }
  const vars = new Map<string, string>();
  const hrefs: string[] = [];
  for (const [family, weights] of byFamily) {
    vars.set(fontVarFor(family), `"${family}",${fontFallbacks(family).join(",")}`);
    hrefs.push(googleFontHref(family, [...weights].sort((a, b) => a - b)));
  }
  const decls = [...vars].map(([v, value]) => `${v}:${value}`).join(";");
  return { css: decls ? `:root{${decls}}` : "", hrefs };
}
