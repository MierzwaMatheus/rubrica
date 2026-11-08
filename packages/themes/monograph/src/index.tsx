/**
 * Tema monografia: o layout "monograph" da v1. O site como livro: cabeçalho corrido fixo,
 * folha de rosto, sumário com linhas pontilhadas, capitulares, notas na margem e tipografia
 * de livro (Fraunces nos títulos, Source Serif 4 no texto). Esquema padrão `azulejo`.
 * Substitui a casca e os blocos cujo visual na v1 difere do núcleo; o resto herda.
 */
import { defineTheme } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock, CtaBlock, CurriculoBlock, DepoimentosBlock, FaqBlock, GaleriaBlock, HeroBlock, ListaItensBlock, NumerosBlock, PostsRecentesBlock, ServicosBlock, TextoBlock } from "./blocks";
import { RECIPES } from "./recipes";
import { MonographShell } from "./shell";
import { TEXTS } from "./texts";

export default defineTheme({
  id: "monograph",
  label: "Monografia",
  description: "O site como livro: cabeçalho corrido, folha de rosto, sumário, capitulares e notas na margem.",
  contract: "^1",
  scheme: "azulejo",
  fonts,
  texts: TEXTS,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#7397F2", light: "#1F4FB4" },
    "rb-accent-2": { label: "Segunda cor", kind: "color", default: "#E58C61", light: "#984F2E" },
  },
  Shell: MonographShell,
  blocks: {
    hero: HeroBlock,
    numeros: NumerosBlock,
    cases: CasesBlock,
    "posts-recentes": PostsRecentesBlock,
    texto: TextoBlock,
    "lista-itens": ListaItensBlock,
    servicos: ServicosBlock,
    depoimentos: DepoimentosBlock,
    faq: FaqBlock,
    galeria: GaleriaBlock,
    curriculo: CurriculoBlock,
    cta: CtaBlock,
  },
  variants: {
    hero: [
      { value: "folha-de-rosto", label: "Folha de rosto" },
      { value: "capitulo", label: "Abertura de capítulo" },
    ],
    cases: [
      { value: "sumario", label: "Sumário" },
      { value: "pranchas", label: "Pranchas" },
    ],
  },
  recipes: RECIPES,
});
