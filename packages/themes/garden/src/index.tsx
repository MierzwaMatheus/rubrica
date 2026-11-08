/**
 * Tema Jardim Digital: o layout `garden` da v1. O site como a entrada de um jardim de
 * notas: barra lateral fixa com o nome do jardim, a navegação, a legenda dos estágios e o
 * mapa de notas; a leitura numa coluna estreita; e projetos, posts e experiências com um
 * estágio de crescimento (semente ○, broto ◐, árvore ●) tirado dos dados que já existem.
 *
 * Desenha a casca e os blocos de apresentação, números, cases, posts, serviços,
 * depoimentos, chamada, galeria e currículo; o resto herda o núcleo e ganha o visual pelo
 * CSS. Os templates de post, case e 404 são os do núcleo, na coluna do jardim, como as
 * páginas compartilhadas da v1. Esquema e fontes padrão do layout na v1: `crepusculo`,
 * Fraunces e IBM Plex Mono.
 */
import { defineTheme } from "@rubrica/core";
import fonts from "./fonts.json";
import { GARDEN_BLOCKS } from "./blocks";
import { GARDEN_RECIPES } from "./recipes";
import { GardenShell } from "./shell";
import { GARDEN_TEXTS } from "./texts";

export { GardenShell } from "./shell";
export * from "./blocks";
export * from "./garden";
export { GARDEN_TEXTS } from "./texts";

export default defineTheme({
  id: "garden",
  label: "Jardim Digital",
  description: "Notas com estágio de crescimento, barra lateral com mapa de ligações e coluna de leitura em serifa.",
  contract: "^1",
  scheme: "crepusculo",
  // Textura que o layout da v1 recomendava (o site troca ou desliga em Aparência).
  texture: "grain",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor primária (botões, estágios, nó atual)", kind: "color", default: "#B788F2", light: "#6B2FA3" },
    "rb-accent-2": { label: "Cor de destaque", kind: "color", default: "#FF8A4C", light: "#A9410C" },
  },
  Shell: GardenShell,
  blocks: GARDEN_BLOCKS,
  variants: {
    cases: [
      { value: "grade", label: "Grade" },
      { value: "destaque", label: "Primeiro em destaque, com filtro" },
    ],
    "posts-recentes": [
      { value: "notas", label: "Notas por estágio" },
      { value: "lista", label: "Lista única" },
    ],
    servicos: [
      { value: "canteiros", label: "Canteiros" },
      { value: "etiquetas", label: "Etiquetas" },
    ],
  },
  recipes: GARDEN_RECIPES,
  texts: GARDEN_TEXTS,
});
