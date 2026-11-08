/**
 * Conteúdo do site. Layouts, esquemas e fontes vêm do CLI (cli/src): são exatamente as
 * opções que o `create-rubrica` oferece.
 */
import { LAYOUTS, TEXTURES, type ColorMode, type Texture } from "../../../cli/src/layouts";
import { SCHEMES } from "../../../cli/src/themes/schemes";
import { SANS_FONTS, MONO_FONTS } from "../../../cli/src/themes/fonts";

export { LAYOUTS, SCHEMES, SANS_FONTS, MONO_FONTS, TEXTURES };

export const REPO = "https://github.com/MierzwaMatheus/rubrica";
export const COMMAND = "npx create-rubrica@latest meu-portfolio";

/** Páginas que cada layout desenha (as rotas do app). Os nomes ficam no dicionário (i18n). */
export const PAGES = ["/", "/curriculo", "/portfolio", "/sobre", "/blog"];

export interface Mood {
  id: string;
  layout: string;
  scheme: string;
  mode: ColorMode;
  texture: Texture;
  sans: string;
  mono: string;
}

/**
 * Um mood é uma combinação pronta de tudo (layout, esquema, modo, textura e fontes).
 * A paleta (esquema) é só a parte das cores.
 */
export const MOODS: Mood[] = [
  { id: "atelie", layout: "zine", scheme: "riso", mode: "light", texture: "paper", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "catalogo", layout: "index", scheme: "sumi", mode: "light", texture: "none", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "ensaio", layout: "monograph", scheme: "azulejo", mode: "light", texture: "paper", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "sessao", layout: "desktop", scheme: "sorbet", mode: "light", texture: "grain", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "madrugada", layout: "desktop", scheme: "fosforo", mode: "dark", texture: "scanlines", sans: "JetBrains Mono", mono: "IBM Plex Mono" },
  { id: "prancheta", layout: "blueprint", scheme: "cianotipia", mode: "dark", texture: "paper", sans: "IBM Plex Sans", mono: "IBM Plex Mono" },
  { id: "fim-de-tarde", layout: "garden", scheme: "crepusculo", mode: "dark", texture: "grain", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "fala-comigo", layout: "chat", scheme: "alto-contraste", mode: "light", texture: "none", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "verao", layout: "poster", scheme: "tropicalia", mode: "light", texture: "grain", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "neon", layout: "cyberpunk", scheme: "neon", mode: "dark", texture: "none", sans: "Chakra Petch", mono: "JetBrains Mono" },
  { id: "terminal", layout: "brutalist", scheme: "concreto", mode: "dark", texture: "scanlines", sans: "JetBrains Mono", mono: "JetBrains Mono" },
  { id: "cartaz", layout: "swiss", scheme: "paper-noir", mode: "light", texture: "none", sans: "Archivo", mono: "JetBrains Mono" },
  { id: "produto", layout: "bento", scheme: "editorial-cream", mode: "light", texture: "none", sans: "Manrope", mono: "JetBrains Mono" },
  { id: "revista", layout: "magazine", scheme: "editorial-cream", mode: "light", texture: "paper", sans: "Bodoni Moda", mono: "JetBrains Mono" },
];

/** Comandos dos três passos de "Começar"; os textos ficam no dicionário (i18n). */
export const STEP_CODES = [COMMAND, "npm run dev", "npx create-rubrica publicar"];

export function layoutLabel(id: string): string {
  return LAYOUTS.find((l) => l.id === id)?.label ?? id;
}
