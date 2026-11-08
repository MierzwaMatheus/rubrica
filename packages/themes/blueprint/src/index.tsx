/**
 * Tema Blueprint: o layout `blueprint` da v1. Cada bloco é uma folha técnica numerada
 * ("FOLHA 02 · PRANCHAS") sobre papel quadriculado, com linhas de cota, números em
 * círculo, áreas hachuradas e o carimbo (tabela de título) no fim; o cabeçalho numera a
 * navegação como códigos de folha (A0, A1…).
 *
 * Substitui a casca, os templates de post, case e 404 e os blocos `hero`, `numeros`,
 * `cases`, `servicos`, `depoimentos`, `texto`, `lista-itens`, `faq`, `galeria`, `cta`,
 * `posts-recentes` e `curriculo`. Os outros (contato, preços, equipe, localização, logos)
 * usam o componente do núcleo dentro da folha. Esquema e fontes padrão do layout na v1:
 * `cianotipia`, IBM Plex Sans e IBM Plex Mono.
 */
import { defineTheme, type BlockComponent } from "@rubrica/core";
import { DEFAULT_BLOCKS } from "@rubrica/core/components";
import fonts from "./fonts.json";
import { CasesBlock, CtaBlock, CurriculoBlock, DepoimentosBlock, FaqBlock, GaleriaBlock, HeroBlock, ListaItensBlock, NumerosBlock, PostsRecentesBlock, ServicosBlock, TextoBlock } from "./blocks";
import { sheeted } from "./parts";
import { BLUEPRINT_RECIPES } from "./recipes";
import { BlueprintShell } from "./shell";
import { BlueprintCase, BlueprintNotFound, BlueprintPost } from "./templates";
import { BLUEPRINT_TEXTS } from "./texts";

export { BlueprintShell } from "./shell";
export * from "./blocks";
export { BLUEPRINT_TEXTS } from "./texts";

/** Blocos do núcleo que só ganham a folha (a moldura numerada), sem desenho próprio. */
const SHEETED_ONLY = ["contato", "precos", "equipe", "localizacao", "logos-clientes"] as const;

const blocks: Record<string, BlockComponent> = {
  hero: HeroBlock,
  numeros: NumerosBlock,
  cases: CasesBlock,
  servicos: ServicosBlock,
  depoimentos: DepoimentosBlock,
  texto: TextoBlock,
  "lista-itens": ListaItensBlock,
  faq: FaqBlock,
  galeria: GaleriaBlock,
  cta: CtaBlock,
  "posts-recentes": PostsRecentesBlock,
  curriculo: CurriculoBlock,
};
for (const type of SHEETED_ONLY) {
  const inner = DEFAULT_BLOCKS[type];
  if (inner) blocks[type] = sheeted(type, inner);
}

export default defineTheme({
  id: "blueprint",
  label: "Blueprint",
  description: "Folhas técnicas numeradas sobre papel quadriculado, com cotas, pranchas e carimbo.",
  contract: "^1",
  scheme: "cianotipia",
  // Textura que o layout da v1 recomendava (o site troca ou desliga em Aparência).
  texture: "paper",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor primária (traço e botões)", kind: "color", default: "#F2F5FA", light: "#1D4E89" },
    "rb-accent-2": { label: "Segunda cor", kind: "color", default: "#83ACDB", light: "#356394" },
  },
  Shell: BlueprintShell,
  blocks,
  templates: { post: BlueprintPost, case: BlueprintCase, notFound: BlueprintNotFound },
  variants: {
    hero: [
      { value: "apresentacao", label: "Apresentação (nome e carimbo)" },
      { value: "folha", label: "Ficha da página" },
    ],
    cases: [
      { value: "grade", label: "Pranchas em grade" },
      { value: "destaque", label: "Primeira prancha em destaque" },
    ],
  },
  recipes: BLUEPRINT_RECIPES,
  texts: BLUEPRINT_TEXTS,
});
