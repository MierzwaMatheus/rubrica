/**
 * Tema Swiss: o layout "swiss" da v1. Estilo tipográfico internacional: grade rígida de
 * 12 colunas, linhas de 2px entre faixas, tipografia pesada e apertada (Archivo, no lugar
 * da Helvetica), caixa alta espaçada nos rótulos e uma cor de destaque em blocos chapados.
 *
 * Substitui a casca e os blocos cujo visual muda (hero, texto, números, lista de itens,
 * cases, serviços, depoimentos, posts, galeria, currículo, chamada final). O resto herda
 * o núcleo e só ganha o visual por CSS. Sem JavaScript: menu do celular, filtro de
 * etiquetas e a numeração dos capítulos são CSS.
 */
import { CORE_RECIPES, defineTheme, type Recipe } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock, CtaBlock, CurriculoBlock, DepoimentosBlock, GaleriaBlock, HeroBlock, ListaItensBlock, NumerosBlock, PostsRecentesBlock, ServicosBlock, TextoBlock } from "./blocks";
import { SwissShell } from "./shell";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });
const text = (pt: string, en: string, es: string) => ({ pt, en, es });

/** Tira o `eyebrow` de exemplo do hero: o kicker ".01 — Reportagem de Capa" vem do tema. */
function withoutEyebrow<T extends { type: string; fields?: Record<string, unknown> }>(block: T): T {
  if (block.type !== "hero" || !block.fields) return block;
  const { eyebrow: _eyebrow, ...fields } = block.fields;
  return { ...block, fields };
}

/**
 * Home da v1: abertura, faixa de números, cases, o que faço, vozes e fechamento. O "texto
 * sobre mim" da receita do núcleo sai (na v1 ele já está na abertura, ao lado do avatar).
 */
function homeOf(recipe: Recipe): Recipe {
  return recipe.map((page) => {
    if (page.path !== "/") return page;
    const rank = ["hero", "numeros", "cases", "servicos", "depoimentos", "logos-clientes", "cta", "contato"];
    const kept = page.blocks.filter((b) => b.type !== "texto").map(withoutEyebrow);
    kept.sort((a, b) => rank.indexOf(a.type) - rank.indexOf(b.type));
    return { ...page, blocks: kept };
  });
}

function personal(): Recipe {
  const core = homeOf(CORE_RECIPES.pessoal);
  return core.map((page) => {
    if (page.path !== "/") return page;
    // v1: "O que eu faço" entre os cases e as vozes.
    const hasServices = page.blocks.some((b) => b.type === "servicos");
    if (hasServices) return page;
    const at = page.blocks.findIndex((b) => b.type === "depoimentos");
    const services = { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } };
    const blocks = [...page.blocks];
    blocks.splice(at < 0 ? blocks.length : at, 0, services);
    return { ...page, blocks };
  });
}

function company(): Recipe {
  return homeOf(CORE_RECIPES.empresa);
}

export default defineTheme({
  id: "swiss",
  label: "Swiss",
  description: "Estilo tipográfico internacional: grade rígida de 12 colunas, tipografia pesada e uma cor de destaque em blocos chapados.",
  contract: "^1",
  scheme: "paper-noir",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#F05454", light: "#BA1010" },
  },
  Shell: SwissShell,
  blocks: {
    hero: HeroBlock,
    texto: TextoBlock,
    cta: CtaBlock,
    numeros: NumerosBlock,
    "lista-itens": ListaItensBlock,
    cases: CasesBlock,
    servicos: ServicosBlock,
    depoimentos: DepoimentosBlock,
    "posts-recentes": PostsRecentesBlock,
    galeria: GaleriaBlock,
    curriculo: CurriculoBlock,
  },
  variants: {
    cases: [
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Lista" },
    ],
  },
  recipes: { pessoal: personal(), empresa: company() },
  texts: {
    "swiss.chapter": text("Capítulo", "Chapter", "Capítulo"),
    "swiss.cover": text("Reportagem de capa", "Cover story", "Reportaje de portada"),
    "swiss.sheet": text("Folha {n} / {total}", "Sheet {n} / {total}", "Hoja {n} / {total}"),
    "swiss.indexPersonal": text("Index — Portfólio pessoal", "Index — Personal portfolio", "Índice — Portafolio personal"),
    "swiss.indexCompany": text("Index — Empresa", "Index — Company", "Índice — Empresa"),
    "swiss.currentRole": text("Cargo atual", "Current role", "Cargo actual"),
    "swiss.aboutCompany": text("Sobre a empresa", "About the company", "Sobre la empresa"),
    "swiss.gridNote": text("Grade 12 · Helvetica", "Grid 12 · Helvetica", "Rejilla 12 · Helvetica"),
  },
});
