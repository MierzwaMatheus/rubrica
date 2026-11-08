/**
 * Tema magazine: o layout de revista da v1 (masthead com o nome em letras espaçadas,
 * grade editorial, capa com manchete gigante, tipografia de destaque em Bodoni Moda).
 * Substitui a casca e os blocos de capa, texto, cases, serviços, depoimentos, cta, FAQ,
 * posts, galeria e currículo; o resto herda os componentes do núcleo e ganha o visual
 * pelo CSS.
 */
import { CORE_RECIPES, defineTheme, type Recipe, type RecipeBlock } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock, CtaBlock, CurriculoBlock, DepoimentosBlock, FaqBlock, GaleriaBlock, HeroBlock, PostsRecentesBlock, ServicosBlock, TextoBlock } from "./blocks";
import { MagazineShell } from "./shell";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/** Ordem da home da v1: capa, números de prova, cases, dossiê, vozes e carta ao leitor. */
const HOME_ORDER = ["hero", "numeros", "cases", "servicos", "depoimentos", "cta", "contato"];

function editorialHome(page: Recipe[number], overrides: Record<string, Record<string, unknown>>): Recipe[number] {
  const rank = (b: RecipeBlock) => {
    const i = HOME_ORDER.indexOf(b.type);
    return i < 0 ? HOME_ORDER.length : i;
  };
  const blocks = page.blocks
    .map((b): RecipeBlock => (overrides[b.type] ? { ...b, ...(overrides[b.type]!.variant ? { variant: overrides[b.type]!.variant as string } : {}), fields: { ...b.fields, ...(overrides[b.type]!.fields as object) } } : b))
    .sort((a, b) => rank(a) - rank(b));
  // Sem os números de prova (home de empresa) a receita segue só com o que tem.
  return { ...page, blocks: blocks.filter((b) => b.type !== "texto") };
}

/** Pessoal: home editorial, "Sobre" como perfil, portfólio em obras e blog em sumário. */
const pessoal: Recipe = CORE_RECIPES.pessoal.map((page) => {
  switch (page.path) {
    case "/":
      return editorialHome(page, {
        cases: { fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados") }, variant: "grade" },
        servicos: { fields: { title: tr("Dossiê de capacidades", "What I can do", "Dossier de capacidades") } },
        depoimentos: { fields: { title: tr("Vozes do campo", "Voices from the field", "Voces del campo") } },
        hero: { fields: { primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" } } },
      });
    case "/sobre":
      return {
        ...page,
        blocks: page.blocks.map((b, i): RecipeBlock => {
          if (i === 0) return { ...b, fields: { ...b.fields, title: tr("Quem faz o trabalho, e como ele é feito", "Who does the work, and how it gets done", "Quién hace el trabajo y cómo se hace") } };
          if (b.type === "texto") return { ...b, variant: "ensaio" };
          return b;
        }),
      };
    case "/curriculo":
      return { ...page, blocks: page.blocks.map((b) => ({ ...b, fields: { ...b.fields, title: tr("Curriculum Vitæ", "Curriculum Vitæ", "Curriculum Vitæ") } })) };
    case "/portfolio":
      return { ...page, blocks: page.blocks.map((b) => ({ ...b, variant: "lista", fields: { ...b.fields, title: tr("Obras selecionadas", "Selected works", "Obras seleccionadas"), intro: tr("Curadoria pessoal.", "A personal selection.", "Curaduría personal.") } })) };
    case "/blog":
      return { ...page, blocks: page.blocks.map((b) => ({ ...b, variant: "sumario" })) };
    default:
      return page;
  }
});

/** Empresa: a mesma ordem editorial na home; as outras páginas seguem as do núcleo. */
const empresa: Recipe = CORE_RECIPES.empresa.map((page) => {
  switch (page.path) {
    case "/":
      return editorialHome(page, { cases: { fields: {}, variant: "grade" }, servicos: { fields: { title: tr("Dossiê de serviços", "Services dossier", "Dossier de servicios") } } });
    case "/cases":
      return { ...page, blocks: page.blocks.map((b) => ({ ...b, variant: "lista" })) };
    case "/blog":
      return { ...page, blocks: page.blocks.map((b) => ({ ...b, variant: "sumario" })) };
    default:
      return page;
  }
});

export default defineTheme({
  id: "magazine",
  label: "Magazine",
  description: "Revista: masthead com o nome em letras espaçadas, grade editorial e tipografia de destaque em Bodoni Moda.",
  contract: "^1",
  scheme: "editorial-cream",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#C084FC", light: "#8A1AF4" },
    "rb-accent-2": { label: "Segunda cor", kind: "color", default: "#F87171", light: "#C71111" },
  },
  Shell: MagazineShell,
  blocks: {
    hero: HeroBlock,
    texto: TextoBlock,
    cases: CasesBlock,
    servicos: ServicosBlock,
    depoimentos: DepoimentosBlock,
    cta: CtaBlock,
    faq: FaqBlock,
    "posts-recentes": PostsRecentesBlock,
    galeria: GaleriaBlock,
    curriculo: CurriculoBlock,
  },
  variants: {
    cases: [
      { value: "grade", label: "Colunas numeradas" },
      { value: "lista", label: "Uma obra por linha" },
    ],
    "posts-recentes": [
      { value: "sumario", label: "Capa e sumário" },
      { value: "colunas", label: "Colunas" },
    ],
    texto: [
      { value: "coluna", label: "Colunas com capitular" },
      { value: "ensaio", label: "Ensaio centralizado" },
    ],
  },
  recipes: { pessoal, empresa },
  texts: {
    "magazine.strip.edition": { pt: "Vol. 01 · Nº {issue}", en: "Vol. 01 · No. {issue}", es: "Vol. 01 · N.º {issue}" },
    "magazine.strip.dateline": { pt: "Edição de {date}", en: "{date} edition", es: "Edición de {date}" },
    "magazine.strip.personal": { pt: "Portfólio profissional", en: "Professional portfolio", es: "Portafolio profesional" },
    "magazine.strip.company": { pt: "Informativo institucional", en: "Company bulletin", es: "Boletín institucional" },
    "magazine.hero.cover": { pt: "Reportagem de capa", en: "Cover story", es: "Reportaje de portada" },
    "magazine.case.read": { pt: "Ler a reportagem", en: "Read the story", es: "Leer el reportaje" },
    "magazine.cta.eyebrow": { pt: "Carta ao leitor", en: "Letter to the reader", es: "Carta al lector" },
    "magazine.faq.prefix": { pt: "P", en: "Q", es: "P" },
    "magazine.blog.featured": { pt: "Em destaque", en: "Featured", es: "Destacado" },
  },
});
