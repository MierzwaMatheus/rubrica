/**
 * Tema Zine: o layout "zine" da v1. Um fanzine de colagem: polaroides presas com fita,
 * post-its, adesivos redondos, ingressos recortados, carta datilografada, cupom de
 * recortar e títulos em letra à mão com marca-texto. Esquema padrão: "riso".
 *
 * Substitui a casca e os 17 blocos (a v1 reescreve Home, Sobre, Currículo, Portfólio e
 * Blog). Sem JavaScript no navegador: o filtro de etiquetas, o FAQ e o hover são CSS.
 * Post, case e 404 ficam com os templates do núcleo (na v1 eles eram compartilhados),
 * só com a letra à mão nos títulos, por CSS.
 */
import { CORE_RECIPES, defineTheme, type Recipe, type RecipeBlock } from "@rubrica/core";
import fonts from "./fonts.json";
import { ContatoBlock, CtaBlock, FaqBlock, HeroBlock, ListaItensBlock, LocalizacaoBlock, LogosClientesBlock, NumerosBlock, ServicosBlock, TextoBlock } from "./blocks";
import { CasesBlock, DepoimentosBlock, EquipeBlock, GaleriaBlock, PostsRecentesBlock, PrecosBlock } from "./collections";
import { CurriculoBlock } from "./resume";
import { ZineShell } from "./shell";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });
const text = (pt: string, en: string, es: string) => ({ pt, en, es });

/** Muda a variação do `nth`-ésimo bloco de um tipo, na página indicada. */
function withVariant(recipe: Recipe, path: string, type: string, variant: string, nth = 0): Recipe {
  return recipe.map((page) => {
    if (page.path !== path) return page;
    let seen = -1;
    return { ...page, blocks: page.blocks.map((b): RecipeBlock => (b.type === type && ++seen === nth ? { ...b, variant } : b)) };
  });
}

/**
 * Pessoal: a home da v1 (capa, números, cases, carta, o que faço, depoimentos e o
 * cupom de contato), "Sobre" abrindo pelos princípios (carta, bilhete de "fora do
 * trabalho", dia a dia e FAQ), portfólio com a primeira polaroide em destaque e blog com
 * o primeiro recorte em destaque.
 */
function personal(): Recipe {
  const core = CORE_RECIPES.pessoal;
  const find = (path: string) => core.find((p) => p.path === path)!;
  const home = find("/");
  const blockOf = (type: string, nth = 0) => home.blocks.filter((b) => b.type === type)[nth]!;
  const sobre = find("/sobre");
  const about = (nth: number) => sobre.blocks.filter((b) => b.type === "texto")[nth]!;
  let recipe: Recipe = core.map((page) => {
    if (page.path === "/") {
      return {
        ...page,
        blocks: [
          { ...blockOf("hero"), fields: { ...blockOf("hero").fields, primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" } } },
          blockOf("numeros"),
          { ...blockOf("cases"), fields: { ...blockOf("cases").fields, anchor: "cases", title: tr("Coisas que fiz", "Things I made", "Cosas que hice") } },
          { ...blockOf("texto"), fields: { ...blockOf("texto").fields, title: tr("Uma cartinha", "A little letter", "Una cartita") } },
          { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
          blockOf("depoimentos"),
          { ...blockOf("cta"), fields: { ...blockOf("cta").fields, title: tr("Vamos conversar sobre um projeto ou uma vaga?", "Shall we talk about a project or a role?", "¿Hablamos de un proyecto o una vacante?"), primary: { label: tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), href: "#contato" }, secondary: { label: tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), href: "#contato" } } },
          blockOf("contato"),
        ],
      };
    }
    if (page.path === "/sobre") {
      // v1: "Como eu trabalho" abre a página; depois a carta profissional e o bilhete pessoal.
      return { ...page, blocks: [sobre.blocks.find((b) => b.type === "lista-itens")!, about(0), { ...about(1), variant: "postit" }, ...sobre.blocks.filter((b) => b.type === "galeria" || b.type === "faq")] };
    }
    return page;
  });
  recipe = withVariant(recipe, "/portfolio", "cases", "destaque");
  recipe = withVariant(recipe, "/blog", "posts-recentes", "destaque");
  return recipe;
}

/** Empresa: a ordem do núcleo; só o primeiro case e o primeiro post ganham destaque nas listas. */
function company(): Recipe {
  let recipe: Recipe = CORE_RECIPES.empresa;
  recipe = withVariant(recipe, "/cases", "cases", "destaque");
  recipe = withVariant(recipe, "/blog", "posts-recentes", "destaque");
  return recipe;
}

export default defineTheme({
  id: "zine",
  label: "Zine",
  description: "Colagem de fanzine: polaroides, fita adesiva, post-its, carimbos e letra à mão.",
  contract: "^1",
  scheme: "riso",
  colorMode: "light",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#FF5CBA", light: "#B4156B" },
    "rb-accent-3": { label: "Cor da fita e do marca-texto", kind: "color", default: "#FFE45C", light: "#FFE800" },
  },
  Shell: ZineShell,
  blocks: {
    hero: HeroBlock,
    texto: TextoBlock,
    cta: CtaBlock,
    numeros: NumerosBlock,
    "lista-itens": ListaItensBlock,
    cases: CasesBlock,
    servicos: ServicosBlock,
    depoimentos: DepoimentosBlock,
    faq: FaqBlock,
    "posts-recentes": PostsRecentesBlock,
    contato: ContatoBlock,
    galeria: GaleriaBlock,
    curriculo: CurriculoBlock,
    precos: PrecosBlock,
    equipe: EquipeBlock,
    localizacao: LocalizacaoBlock,
    "logos-clientes": LogosClientesBlock,
  },
  variants: {
    texto: [
      { value: "carta", label: "Carta datilografada" },
      { value: "postit", label: "Bilhete (post-it)" },
    ],
    cases: [
      { value: "grade", label: "Polaroides em grade" },
      { value: "destaque", label: "Primeira polaroide em destaque" },
      { value: "lista", label: "Lista (uma por linha)" },
    ],
    "posts-recentes": [
      { value: "recortes", label: "Recortes em grade" },
      { value: "destaque", label: "Primeiro recorte em destaque" },
    ],
  },
  recipes: { pessoal: personal(), empresa: company() },
  texts: {
    "zine.no": text("Nº {n}", "No. {n}", "N.º {n}"),
    "zine.dear": text("Pessoa querida,", "Dear reader,", "Querida persona,"),
    "zine.byHand": text("feito à mão por {name}", "handmade by {name}", "hecho a mano por {name}"),
    "zine.featured": text("destaque", "featured", "destacado"),
  },
});
