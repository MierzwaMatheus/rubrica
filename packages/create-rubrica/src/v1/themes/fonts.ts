/**
 * Fontes que o CLI oferece. Os pesos são os que a família tem de fato no Google Fonts:
 * pedir um peso inexistente faz o Google recusar o link inteiro.
 */
export interface FontOption {
  family: string;
  hint: string;
  weights: number[];
}

export const SANS_FONTS: FontOption[] = [
  { family: "Inter", hint: "neutra, legível, padrão de produtos digitais", weights: [300, 400, 500, 600, 700] },
  { family: "Chakra Petch", hint: "geométrica, tech, futurista", weights: [300, 400, 500, 600, 700] },
  { family: "Playfair Display", hint: "elegante, editorial clássico", weights: [400, 500, 600, 700, 800] },
  { family: "Space Grotesk", hint: "moderna, startup", weights: [300, 400, 500, 600, 700] },
  { family: "DM Sans", hint: "limpa, amigável, versátil", weights: [300, 400, 500, 600, 700] },
  { family: "Bodoni Moda", hint: "display serifado elegante, editorial clássico", weights: [400, 500, 600, 700, 800] },
  { family: "IBM Plex Serif", hint: "serifa técnica, confiança e rigor", weights: [300, 400, 500, 600, 700] },
  { family: "Manrope", hint: "geométrica humanista, moderna e acolhedora", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Archivo", hint: "grotesca utilitária, clareza e força tipográfica", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Instrument Sans", hint: "grotesca contemporânea, precisa e discreta", weights: [400, 500, 600, 700] },
  { family: "IBM Plex Sans", hint: "técnica e neutra, par natural da IBM Plex Mono", weights: [300, 400, 500, 600, 700] },
  { family: "Fraunces", hint: "serifa expressiva de livro, calorosa", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Source Serif 4", hint: "serifa de leitura longa, sóbria", weights: [300, 400, 600, 700] },
  { family: "Bricolage Grotesque", hint: "display com personalidade, pôster e colagem", weights: [300, 400, 500, 600, 700, 800] },
  // Principal do brutalist: monoespaçada também no corpo do texto.
  { family: "JetBrains Mono", hint: "monoespaçada no texto todo, identidade de terminal", weights: [300, 400, 500, 600, 700] },
];

export const MONO_FONTS: FontOption[] = [
  { family: "JetBrains Mono", hint: "dev-friendly, clara", weights: [300, 400, 500, 600, 700] },
  { family: "Fira Code", hint: "clássico, com ligatures", weights: [300, 400, 500, 600, 700] },
  { family: "Space Mono", hint: "retro digital", weights: [400, 700] },
  { family: "IBM Plex Mono", hint: "corporativo-tech", weights: [300, 400, 500, 600, 700] },
];

const DEFAULT_WEIGHTS = [400, 700];

function weightsOf(family: string): number[] {
  return [...SANS_FONTS, ...MONO_FONTS].find((f) => f.family === family)?.weights ?? DEFAULT_WEIGHTS;
}

/** Link do Google Fonts com as famílias pedidas (sem repetir, ignorando vazias). */
export function googleFontsHref(families: string[]): string {
  const unique = [...new Set(families.filter(Boolean))];
  const params = unique
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@${weightsOf(f).join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function fontLinkTag(families: string[]): string {
  return `<link\n      href="${googleFontsHref(families)}"\n      rel="stylesheet"\n    />`;
}
