/**
 * Tema Índice: o layout "index" da v1. O site como catálogo de museu: cabeçalho fixo em
 * colunas, seções com o rótulo à esquerda e o conteúdo à direita, linhas finas, tipografia
 * grande só na abertura e tabelas de projetos e textos que invertem a linha no hover,
 * mostrando a imagem na coluna do rótulo.
 *
 * Substitui a casca e quase todos os blocos (a v1 reescreve Home, Sobre, Currículo,
 * Portfólio e Blog). Cada bloco vira uma "linha de catálogo". Sem JavaScript: o menu do
 * celular, o filtro de etiquetas, a ficha do currículo e a imagem do hover são CSS.
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
import { IndexShell } from "./shell";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });
const text = (pt: string, en: string, es: string) => ({ pt, en, es });

/** Muda a variação de blocos de um tipo, na página indicada (as outras ficam como estão). */
function withVariant(recipe: Recipe, path: string, type: string, variant: string): Recipe {
  return recipe.map((page) => (page.path === path ? { ...page, blocks: page.blocks.map((b): RecipeBlock => (b.type === type ? { ...b, variant } : b)) } : page));
}

/**
 * Pessoal: a home da v1 (abertura, números, cases em índice, sobre, o que faço,
 * depoimentos e fechamento), "Sobre" abrindo pelos princípios, portfólio e blog com a
 * primeira peça em ficha. Currículo, depoimentos e privacidade seguem o núcleo.
 */
function personal(): Recipe {
  const core = CORE_RECIPES.pessoal;
  const find = (path: string) => core.find((p) => p.path === path)!;
  const home = find("/");
  const blockOf = (type: string, nth = 0) => home.blocks.filter((b) => b.type === type)[nth]!;
  const { eyebrow: _eyebrow, ...heroFields } = (blockOf("hero").fields ?? {}) as Record<string, unknown>;
  const sobre = find("/sobre");
  const about = (nth: number) => sobre.blocks.filter((b) => b.type === "texto")[nth]!;
  let recipe: Recipe = core.map((page) => {
    if (page.path === "/") {
      return {
        ...page,
        blocks: [
          { ...blockOf("hero"), fields: { ...heroFields, primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" } } },
          blockOf("numeros"),
          { ...blockOf("cases"), variant: "indice", fields: { ...blockOf("cases").fields, anchor: "cases" } },
          blockOf("texto"),
          { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
          blockOf("depoimentos"),
          { ...blockOf("cta"), fields: { ...blockOf("cta").fields, title: tr("Vamos conversar sobre um projeto ou uma vaga?", "Shall we talk about a project or a role?", "¿Hablamos de un proyecto o una vacante?"), primary: { label: tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), href: "#contato" }, secondary: { label: tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), href: "#contato" } } },
          { ...blockOf("contato"), fields: { ...blockOf("contato").fields, title: tr("Enviar uma mensagem", "Send a message", "Enviar un mensaje") } },
        ],
      };
    }
    if (page.path === "/sobre") {
      // v1: "Como eu trabalho" abre a página; depois o texto profissional e o pessoal.
      return { ...page, blocks: [sobre.blocks.find((b) => b.type === "lista-itens")!, about(0), about(1), ...sobre.blocks.filter((b) => b.type === "galeria" || b.type === "faq")] };
    }
    return page;
  });
  recipe = withVariant(recipe, "/portfolio", "cases", "destaque");
  recipe = withVariant(recipe, "/blog", "posts-recentes", "destaque");
  return recipe;
}

/** Empresa: números logo depois da abertura, cases em índice; /cases e /blog com ficha. */
function company(): Recipe {
  const core = CORE_RECIPES.empresa;
  let recipe: Recipe = core.map((page) => {
    if (page.path !== "/") return page;
    const pick = (type: string) => page.blocks.filter((b) => b.type === type);
    const [hero] = pick("hero");
    return { ...page, blocks: [hero!, ...pick("numeros"), ...pick("servicos"), ...pick("cases").map((b) => ({ ...b, variant: "indice" })), ...pick("depoimentos"), ...pick("cta")] };
  });
  recipe = withVariant(recipe, "/cases", "cases", "destaque");
  recipe = withVariant(recipe, "/blog", "posts-recentes", "destaque");
  return recipe;
}

export default defineTheme({
  id: "index",
  label: "Índice",
  description: "Catálogo de museu: rótulos à esquerda, linhas finas e tabelas com imagem que surge no hover.",
  contract: "^1",
  scheme: "sumi",
  colorMode: "light",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#E96068", light: "#BA0F2B" },
  },
  Shell: IndexShell,
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
    cases: [
      { value: "indice", label: "Índice (tabela)" },
      { value: "destaque", label: "Ficha em destaque e índice" },
      { value: "grade", label: "Grade de figuras" },
    ],
    "posts-recentes": [
      { value: "indice", label: "Índice (tabela)" },
      { value: "destaque", label: "Ficha em destaque e índice" },
    ],
  },
  recipes: { pessoal: personal(), empresa: company() },
  texts: {
    "index.sheet": text("Nº", "No.", "N.º"),
    "index.intro": text("Apresentação", "Introduction", "Presentación"),
    "index.archive": text("Arquivo de trabalhos", "Archive of work", "Archivo de trabajos"),
    "index.catalog": text("Catálogo", "Catalogue", "Catálogo"),
    "index.inNumbers": text("Em números", "By the numbers", "En números"),
    "index.contact": text("Contato", "Contact", "Contacto"),
    "index.index": text("Índice", "Index", "Índice"),
    "index.featured": text("Em destaque", "Featured", "Destacado"),
    "index.total": text("Total: {n}", "Total: {n}", "Total: {n}"),
    "index.figure": text("Fig.", "Fig.", "Fig."),
    "index.minutes": text("{minutes} min", "{minutes} min", "{minutes} min"),
    "index.colProject": text("Projeto", "Project", "Proyecto"),
    "index.colClient": text("Cliente", "Client", "Cliente"),
    "index.colField": text("Área", "Field", "Área"),
    "index.colSummary": text("Resumo", "Summary", "Resumen"),
    "index.colDate": text("Data", "Date", "Fecha"),
    "index.colTitle": text("Título", "Title", "Título"),
    "index.colTags": text("Tags", "Tags", "Etiquetas"),
    "index.colReading": text("Leitura", "Reading", "Lectura"),
    "index.colPeriod": text("Período", "Period", "Período"),
    "index.colRole": text("Cargo", "Role", "Cargo"),
    "index.colOrg": text("Organização", "Organization", "Organización"),
  },
});
