/**
 * Tema Pôster: o layout "poster" (Pôster Cinético) da v1. Tipografia gigante do começo ao
 * fim, fios grossos entre as seções, uma faixa rolante com os nomes dos projetos e linhas
 * de cartaz (número em contorno, nome gigante, metadados à direita) que invertem as cores
 * no hover.
 *
 * Substitui a casca e quase todos os blocos (a v1 reescreve Home, Sobre, Currículo,
 * Portfólio e Blog), mais os templates de post, case e 404. Sem JavaScript no navegador: a
 * gaveta do celular, a pausa da faixa, o filtro por etiqueta e o acordeão são CSS/HTML;
 * a faixa só anima com `prefers-reduced-motion` liberado.
 */
import { CORE_RECIPES, defineTheme, type Recipe, type RecipeBlock } from "@rubrica/core";
import fonts from "./fonts.json";
import {
  CasesBlock,
  ContatoBlock,
  CtaBlock,
  CurriculoBlock,
  DepoimentosBlock,
  EquipeBlock,
  FaqBlock,
  GaleriaBlock,
  HeroBlock,
  ListaItensBlock,
  LocalizacaoBlock,
  LogosClientesBlock,
  NumerosBlock,
  PostsRecentesBlock,
  PrecosBlock,
  ServicosBlock,
  TextoBlock,
} from "./blocks";
import { PosterShell } from "./shell";
import { PosterCase, PosterNotFound, PosterPost } from "./templates";
import { POSTER_TEXTS } from "./texts";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/** Muda a variação de blocos de um tipo, na página indicada (as outras ficam como estão). */
function withVariant(recipe: Recipe, path: string, type: string, variant: string): Recipe {
  return recipe.map((page) => (page.path === path ? { ...page, blocks: page.blocks.map((b): RecipeBlock => (b.type === type ? { ...b, variant } : b)) } : page));
}

/** Faixa rolante com todos os projetos, logo depois da abertura. */
const ticker: RecipeBlock = { type: "cases", variant: "faixa", source: { collection: "projects", sort: "order" }, fields: {} };

/**
 * Pessoal: a home da v1 (abertura, faixa de projetos, números, cases em cartaz, sobre em
 * declaração, o que faço, depoimentos e fechamento), "Sobre" abrindo pelos princípios,
 * portfólio com o filtro em palavras grandes. Currículo, blog e depoimentos seguem o núcleo.
 */
function personal(): Recipe {
  const core = CORE_RECIPES.pessoal;
  const find = (path: string) => core.find((p) => p.path === path)!;
  const home = find("/");
  const blockOf = (type: string) => home.blocks.find((b) => b.type === type)!;
  const sobre = find("/sobre");
  const about = (nth: number) => sobre.blocks.filter((b) => b.type === "texto")[nth]!;
  let recipe: Recipe = core.map((page) => {
    if (page.path === "/") {
      const hero = blockOf("hero");
      return {
        ...page,
        blocks: [
          { ...hero, fields: { ...hero.fields, primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" } } },
          ticker,
          blockOf("numeros"),
          { ...blockOf("cases"), fields: { ...blockOf("cases").fields, anchor: "cases" } },
          blockOf("texto"),
          { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
          blockOf("depoimentos"),
          { ...blockOf("cta"), fields: { ...blockOf("cta").fields, title: tr("Vamos conversar sobre um projeto ou uma vaga?", "Shall we talk about a project or a role?", "¿Hablamos de un proyecto o una vacante?"), primary: { label: tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), href: "#contato" }, secondary: { label: tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), href: "#contato" } } },
          blockOf("contato"),
        ],
      };
    }
    if (page.path === "/sobre") {
      // v1: "Como eu trabalho" abre a página; depois o texto profissional, o pessoal e o dia a dia.
      return { ...page, blocks: [sobre.blocks.find((b) => b.type === "lista-itens")!, about(0), about(1), ...sobre.blocks.filter((b) => b.type === "galeria" || b.type === "faq")] };
    }
    return page;
  });
  recipe = withVariant(recipe, "/portfolio", "cases", "catalogo");
  recipe = withVariant(recipe, "/privacidade", "texto", "corrido");
  return recipe;
}

/** Empresa: faixa de cases e números logo depois da abertura; /cases com o filtro. */
function company(): Recipe {
  const core = CORE_RECIPES.empresa;
  let recipe: Recipe = core.map((page) => {
    if (page.path !== "/") return page;
    const pick = (type: string) => page.blocks.filter((b) => b.type === type);
    return { ...page, blocks: [...pick("hero"), ticker, ...pick("numeros"), ...pick("servicos"), ...pick("cases"), ...pick("depoimentos"), ...pick("cta")] };
  });
  recipe = withVariant(recipe, "/cases", "cases", "catalogo");
  recipe = withVariant(recipe, "/privacidade", "texto", "corrido");
  return recipe;
}

export default defineTheme({
  id: "poster",
  label: "Pôster Cinético",
  description: "Tipografia gigante do começo ao fim, faixas rolando e linhas de cartaz — impacto.",
  contract: "^1",
  scheme: "tropicalia",
  // Textura que o layout da v1 recomendava (o site troca ou desliga em Aparência).
  texture: "grain",
  colorMode: "light",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#34C08A", light: "#0B6E4F" },
  },
  Shell: PosterShell,
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
  templates: { post: PosterPost, case: PosterCase, notFound: PosterNotFound },
  variants: {
    cases: [
      { value: "cartaz", label: "Linhas de cartaz" },
      { value: "catalogo", label: "Linhas com filtro por etiqueta" },
      { value: "faixa", label: "Faixa rolante com os nomes" },
    ],
    texto: [
      { value: "declaracao", label: "Primeiro parágrafo em destaque" },
      { value: "corrido", label: "Texto corrido" },
    ],
  },
  recipes: { pessoal: personal(), empresa: company() },
  texts: POSTER_TEXTS,
});
