/**
 * Receitas do tema Terminal Brutalista (decisão 24): a ordem das páginas do layout
 * `brutalist` da v1.
 *
 * - Home pessoal: apresentação (nome, `cat /etc/motd`, botões), números, cases em destaque,
 *   o que faço, depoimentos, fechamento e contato (o "Fale comigo" do hero alcança o contato
 *   por âncora).
 * - Sobre: a bio numerada abre, depois princípios, fora do trabalho, dia a dia e perguntas.
 * - Projetos: a variação `lista` (índice `ls -la` e cartões README), como o portfólio da v1.
 *
 * Na empresa, a v1 não tinha site de empresa: vale a receita do núcleo, só com a variação
 * `grade` nos cases da home e `lista` na página de cases.
 */
import { CORE_RECIPES, type Recipe, type RecipeBlock, type RecipePage } from "@rubrica/core";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });
const link = (label: ReturnType<typeof tr>, href: string) => ({ label, href });

const home: RecipePage = {
  path: "/",
  title: tr("Início", "Home", "Inicio"),
  blocks: [
    {
      type: "hero",
      fields: {
        eyebrow: tr("Seu cargo ou área", "Your role or field", "Tu cargo o área"),
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
        title: tr("Números", "Numbers", "Números"),
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
          { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
        ],
      },
    },
    { type: "cases", variant: "grade", fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: link(tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), "/portfolio") } },
    { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("O que falam sobre mim", "What people say about me", "Lo que dicen de mí"), allowSubmission: true } },
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

/** Troca a variação dos blocos de um tipo numa página da receita do núcleo. */
const withVariant = (page: RecipePage, type: string, variant: string, onlyWithSource = false): RecipePage => ({
  ...page,
  blocks: page.blocks.map((b): RecipeBlock => (b.type === type && (!onlyWithSource || b.source) ? { ...b, variant } : b)),
});

/** Páginas de listagem de projetos usam o índice com README. */
const listings = (page: RecipePage): RecipePage => (page.path === "/portfolio" || page.path === "/cases" ? withVariant(page, "cases", "lista") : page);

/** A primeira `texto` do Sobre é a bio: parágrafos numerados, como na v1. */
const aboutBio = (page: RecipePage): RecipePage => {
  let done = false;
  return {
    ...page,
    blocks: page.blocks.map((b): RecipeBlock => {
      if (b.type !== "texto" || done) return b;
      done = true;
      return { ...b, variant: "numerado" };
    }),
  };
};

const pessoal: Recipe = CORE_RECIPES.pessoal.map((p) => {
  if (p.path === "/") return home;
  if (p.path === "/sobre") return aboutBio(p);
  return listings(p);
});

const empresa: Recipe = CORE_RECIPES.empresa.map((p) => {
  if (p.path === "/") return withVariant(p, "cases", "grade");
  return listings(p);
});

export const BRUTALIST_RECIPES = { pessoal, empresa };
