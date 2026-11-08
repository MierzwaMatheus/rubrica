/**
 * Receitas do tema Blueprint (decisão 24): a ordem das páginas do layout `blueprint` da v1.
 *
 * - Home: apresentação (folha 00), especificações (números), pranchas (cases em destaque),
 *   memorial (sobre), detalhes (serviços), pareceres (depoimentos), ordem de serviço
 *   (chamada) e, no fim, o contato que o botão "Fale comigo" alcança por âncora.
 * - Páginas internas abrem com a "ficha técnica" (hero na variação `folha`): o título da
 *   página e o apoio, no lugar de repetir o título no primeiro bloco.
 * - Sobre: as normas (princípios) abrem, depois memorial, "fora do trabalho", cronograma
 *   (dia a dia), áreas de interesse (serviços) e as notas gerais (FAQ).
 * - Currículo: ficha, números e a ficha técnica do currículo.
 *
 * Na empresa, a v1 não tinha site de empresa: vale a receita do núcleo, com os números
 * logo abaixo da apresentação e a mesma ficha de abertura nas páginas internas.
 */
import { CORE_RECIPES, type Recipe, type RecipeBlock, type RecipePage } from "@rubrica/core";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });
const link = (label: ReturnType<typeof tr>, href: string) => ({ label, href });

/** Abre a página com a ficha técnica: o título e o apoio do primeiro bloco sobem para ela. */
function withSheetHero(page: RecipePage): RecipePage {
  const [first, ...rest] = page.blocks;
  const title = first?.fields?.title;
  if (!first || !title) return page;
  const { title: _t, intro, subtitle: _s, ...remaining } = first.fields ?? {};
  const hero: RecipeBlock = { type: "hero", variant: "folha", fields: { title, ...(intro ? { subtitle: intro } : {}) } };
  return { ...page, blocks: [hero, { ...first, fields: remaining }, ...rest] };
}

const personalHome: RecipePage = {
  path: "/",
  title: tr("Início", "Home", "Inicio"),
  blocks: [
    {
      type: "hero",
      variant: "apresentacao",
      fields: {
        title: tr("Uma frase que diz o que você faz e para quem", "One sentence on what you do and for whom", "Una frase sobre qué haces y para quién"),
        subtitle: tr("Um parágrafo curto sobre você e o tipo de trabalho que procura.", "A short paragraph about you and the kind of work you look for.", "Un párrafo corto sobre ti y el tipo de trabajo que buscas."),
        primaryCta: link(tr("Ver cases", "See cases", "Ver casos"), "#cases"),
        secondaryCta: link(tr("Fale comigo", "Get in touch", "Hablemos"), "#contato"),
        showAvailability: true,
      },
    },
    {
      type: "numeros",
      fields: {
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
          { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
        ],
      },
    },
    { type: "cases", variant: "grade", fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: link(tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), "/portfolio") } },
    {
      type: "texto",
      fields: {
        title: tr("Um pouco sobre mim", "A little about me", "Un poco sobre mí"),
        body: tr(
          "<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p><p>Cada parágrafo ganha um número de item no memorial.</p><p>Os números de resultado, como 40 projetos, aparecem em destaque.</p>",
          "<p>Say in a few lines who you are, how you work and what drives you.</p><p>Each paragraph gets an item number in the memorial.</p><p>Result figures, like 40 projects, stand out.</p>",
          "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p><p>Cada párrafo recibe un número de ítem en la memoria.</p><p>Las cifras de resultado, como 40 proyectos, se destacan.</p>",
        ),
      },
    },
    { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("O que dizem sobre meu trabalho", "What people say about my work", "Lo que dicen de mi trabajo"), allowSubmission: true } },
    {
      type: "cta",
      fields: {
        title: tr("Vamos conversar?", "Shall we talk?", "¿Hablamos?"),
        body: tr("Conte o contexto e eu respondo com os próximos passos.", "Tell me the context and I'll reply with next steps.", "Cuéntame el contexto y respondo con los próximos pasos."),
        primary: link(tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), "#contato"),
        secondary: link(tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), "#contato"),
      },
    },
    { type: "contato", fields: { anchor: "contato", title: tr("Contato", "Contact", "Contacto"), mode: "wizard", showChannels: true } },
  ],
};

/** Sobre: normas, memorial, fora do trabalho, cronograma, interesses e notas gerais. */
function personalAbout(core: RecipePage): RecipePage {
  const texts = core.blocks.filter((b) => b.type === "texto");
  const of = (type: string) => core.blocks.filter((b) => b.type === type);
  const interests: RecipeBlock = { type: "servicos", fields: { title: tr("Áreas de interesse", "Areas of interest", "Áreas de interés") } };
  return withSheetHero({
    ...core,
    blocks: [...texts.slice(0, 1), ...of("lista-itens"), ...texts.slice(1), ...of("galeria"), interests, ...of("faq")],
  });
}

/** Cases das listagens (portfólio e cases) usam a hierarquia da v1: o primeiro em destaque. */
const featured = (blocks: RecipeBlock[]): RecipeBlock[] => blocks.map((b) => (b.type === "cases" && b.source ? { ...b, variant: "destaque" } : b));

const pessoal: Recipe = CORE_RECIPES.pessoal.map((page) => {
  switch (page.path) {
    case "/":
      return personalHome;
    case "/sobre":
      return personalAbout(page);
    case "/curriculo": {
      const withHero = withSheetHero(page);
      const [hero, ...rest] = withHero.blocks;
      const specs: RecipeBlock = { type: "numeros", fields: { items: personalHome.blocks[1]!.fields!.items } };
      return { ...withHero, blocks: [hero!, specs, ...rest] };
    }
    default:
      return withSheetHero({ ...page, blocks: featured(page.blocks) });
  }
});

/** Empresa: o núcleo, com os números logo abaixo do hero (como as especificações da v1). */
const empresa: Recipe = CORE_RECIPES.empresa.map((page) => {
  if (page.path !== "/") return withSheetHero({ ...page, blocks: featured(page.blocks) });
  const blocks = [...page.blocks];
  const n = blocks.findIndex((b) => b.type === "numeros");
  const [numeros] = n >= 0 ? blocks.splice(n, 1) : [];
  if (numeros) blocks.splice(1, 0, numeros);
  return { ...page, blocks: blocks.map((b) => (b.type === "hero" ? { ...b, variant: "apresentacao" } : b.type === "cases" ? { ...b, variant: "grade" } : b)) };
});

export const BLUEPRINT_RECIPES = { pessoal, empresa };
