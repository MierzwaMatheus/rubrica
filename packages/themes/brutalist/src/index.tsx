/**
 * Tema Terminal Brutalista: o layout `brutalist` da v1. Monoespaçado no texto todo, bordas
 * retas de 1 a 2 px na cor do texto, títulos como régua ASCII (`─── [ TÍTULO ] ───`),
 * linhas de prompt e abas `nome.sh`. Esquema e fontes padrão do layout na v1: `paper-noir`
 * e JetBrains Mono.
 *
 * Substitui a casca e os blocos `hero`, `texto`, `cases`, `depoimentos`, `faq`, `galeria` e
 * `cta`; os outros herdam o núcleo e ganham o visual pelo CSS. Os templates de post, case e
 * 404 são os do núcleo, estilizados pelo CSS.
 */
import { defineTheme } from "@rubrica/core";
import fonts from "./fonts.json";
import { BRUTALIST_BLOCKS } from "./blocks";
import { BRUTALIST_RECIPES } from "./recipes";
import { BrutalistShell } from "./shell";
import { BRUTALIST_TEXTS } from "./texts";

export { BrutalistShell } from "./shell";
export * from "./blocks";
export { BRUTALIST_TEXTS } from "./texts";

export default defineTheme({
  id: "brutalist",
  label: "Terminal Brutalista",
  description: "Identidade de terminal: monoespaçada, bordas retas, seções como linhas de comando e abas .sh.",
  contract: "^1",
  scheme: "paper-noir",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor primária (títulos, valores)", kind: "color", default: "#F05454", light: "#BA1010" },
    "rb-accent-2": { label: "Cor de apoio (réguas, prompt)", kind: "color", default: "#60A5FA", light: "#0955D0" },
  },
  Shell: BrutalistShell,
  blocks: BRUTALIST_BLOCKS,
  variants: {
    cases: [
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Índice e README" },
    ],
    texto: [
      { value: "simples", label: "Simples (faixa lateral)" },
      { value: "numerado", label: "Parágrafos numerados" },
    ],
  },
  recipes: BRUTALIST_RECIPES,
  texts: BRUTALIST_TEXTS,
});
