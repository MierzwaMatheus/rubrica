/**
 * Conteúdo do site. Temas, esquemas, fontes e presets vêm do pacote do CLI
 * (packages/create-rubrica/src) e do núcleo: são exatamente as opções que o
 * `create-rubrica` oferece.
 */
import { THEMES, THEME_PACKAGE_DEFAULTS, SANS_FAMILIES, MONO_FAMILIES, type ColorMode } from "../../../../packages/create-rubrica/src/themes";
import { SCHEMES } from "@rubrica/core";

export type { ColorMode };

/** Um tema da v2 no formato que o combinador usa. */
export interface ThemeEntry {
  id: string;
  label: string;
  hint: string;
  recommended: { scheme: string; mode: ColorMode };
  fonts: { sans: string[]; mono: string };
}

/** Os 14 temas, com o esquema, o modo e as fontes que o pacote de cada um declara. */
export const LAYOUTS: ThemeEntry[] = THEMES.filter((t) => t.ported).map((t) => {
  const d = THEME_PACKAGE_DEFAULTS[t.id as keyof typeof THEME_PACKAGE_DEFAULTS];
  return {
    id: t.id,
    label: t.label,
    hint: t.hint,
    recommended: { scheme: d.scheme, mode: d.mode },
    fonts: { sans: [d.fontSans], mono: d.fontMono ?? "" },
  };
});

export const SANS_FONTS = SANS_FAMILIES.map((family) => ({ family }));
export const MONO_FONTS = MONO_FAMILIES.map((family) => ({ family }));
export { SCHEMES };

export const REPO = "https://github.com/MierzwaMatheus/rubrica";
export const COMMAND = "npx create-rubrica@latest meu-site";

export interface Mood {
  id: string;
  layout: string;
  scheme: string;
  mode: ColorMode;
  sans: string;
  mono: string;
}

/**
 * Um mood é uma combinação pronta de tudo (tema, esquema, modo e fontes).
 * A paleta (esquema) é só a parte das cores.
 */
export const MOODS: Mood[] = [
  { id: "atelie", layout: "zine", scheme: "riso", mode: "light", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "catalogo", layout: "index", scheme: "sumi", mode: "light", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "ensaio", layout: "monograph", scheme: "azulejo", mode: "light", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "sessao", layout: "desktop", scheme: "sorbet", mode: "light", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "madrugada", layout: "desktop", scheme: "fosforo", mode: "dark", sans: "JetBrains Mono", mono: "IBM Plex Mono" },
  { id: "prancheta", layout: "blueprint", scheme: "cianotipia", mode: "dark", sans: "IBM Plex Sans", mono: "IBM Plex Mono" },
  { id: "fim-de-tarde", layout: "garden", scheme: "crepusculo", mode: "dark", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "fala-comigo", layout: "chat", scheme: "alto-contraste", mode: "light", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "verao", layout: "poster", scheme: "tropicalia", mode: "light", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "neon", layout: "cyberpunk", scheme: "neon", mode: "dark", sans: "Chakra Petch", mono: "JetBrains Mono" },
  { id: "terminal", layout: "brutalist", scheme: "concreto", mode: "dark", sans: "JetBrains Mono", mono: "JetBrains Mono" },
  { id: "cartaz", layout: "swiss", scheme: "paper-noir", mode: "light", sans: "Archivo", mono: "JetBrains Mono" },
  { id: "produto", layout: "bento", scheme: "editorial-cream", mode: "light", sans: "Manrope", mono: "JetBrains Mono" },
  { id: "revista", layout: "magazine", scheme: "editorial-cream", mode: "light", sans: "Bodoni Moda", mono: "JetBrains Mono" },
];

/**
 * Comandos dos três passos de "Começar"; os textos ficam no dicionário (i18n). O `npx`
 * cria o projeto com npm, e `npm run dev` funciona também num projeto com pnpm.
 */
export const STEP_CODES = [COMMAND, "npm run dev", "npx create-rubrica publicar"];

export function layoutLabel(id: string): string {
  return LAYOUTS.find((l) => l.id === id)?.label ?? id;
}
