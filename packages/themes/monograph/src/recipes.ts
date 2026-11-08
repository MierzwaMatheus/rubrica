/**
 * Receitas da monografia. A home segue a ordem do livro da v1 (folha de rosto, números,
 * sumário, prefácio, ofícios, recepção, correspondência); as páginas internas abrem com
 * um capítulo (hero `capitulo`). Os textos são exemplos nos três idiomas de partida.
 */
import { CORE_RECIPES, type Recipe, type RecipeBlock, type RecipePage } from "@rubrica/core";

type Tr = Record<"pt-BR" | "en" | "es", string>;
const tr = (ptBR: string, en: string, es: string): Tr => ({ "pt-BR": ptBR, en, es });
const link = (label: Tr, href: string) => ({ label, href });

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Abertura de capítulo: "Capítulo II", título, fio e subtítulo em itálico. */
const chapter = (n: number, title: Tr, dek?: Tr): RecipeBlock => ({
  type: "hero",
  variant: "capitulo",
  fields: {
    eyebrow: tr(`Capítulo ${ROMAN[n]}`, `Chapter ${ROMAN[n]}`, `Capítulo ${ROMAN[n]}`),
    title,
    ...(dek && { subtitle: dek }),
  },
});

const core = (kind: "pessoal" | "empresa", path: string): RecipePage => CORE_RECIPES[kind].find((p) => p.path === path)!;
const heroFolha = (kind: "pessoal" | "empresa"): RecipeBlock => core(kind, "/").blocks[0]!;

const SUMARIO = tr("Sumário", "Contents", "Índice");

// ---- pessoal -------------------------------------------------------------------------

const pessoalHome: RecipePage = {
  path: "/",
  title: tr("Início", "Home", "Inicio"),
  blocks: [
    { ...heroFolha("pessoal"), variant: "folha-de-rosto" },
    {
      type: "numeros",
      fields: {
        title: tr("Em números", "By the numbers", "En números"),
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
          { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
        ],
      },
    },
    {
      type: "cases",
      variant: "sumario",
      fields: {
        anchor: "cases",
        title: SUMARIO,
        intro: tr("Projetos em destaque", "Featured work", "Proyectos destacados"),
        cta: link(tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), "/portfolio"),
      },
    },
    {
      type: "texto",
      fields: {
        title: tr("Prefácio", "Preface", "Prefacio"),
        body: tr(
          "<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p><p>Um segundo parágrafo costuma caber bem aqui.</p>",
          "<p>Say in a few lines who you are, how you work and what drives you.</p><p>A second paragraph usually fits well here.</p>",
          "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p><p>Un segundo párrafo suele encajar bien aquí.</p>",
        ),
      },
    },
    { type: "servicos", fields: { title: tr("Ofícios", "Crafts", "Oficios"), intro: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("Recepção", "Reception", "Recepción"), intro: tr("O que dizem sobre meu trabalho", "What people say about my work", "Lo que dicen de mi trabajo"), allowSubmission: true } },
    {
      type: "cta",
      fields: {
        title: tr("Vamos conversar?", "Shall we talk?", "¿Hablamos?"),
        body: tr("Me conte sobre o seu projeto ou a vaga.", "Tell me about your project or the role.", "Cuéntame sobre tu proyecto o la vacante."),
        primary: link(tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), "#contato"),
        secondary: link(tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), "#contato"),
      },
    },
    { type: "contato", fields: { anchor: "contato", title: tr("Correspondência", "Correspondence", "Correspondencia"), mode: "wizard", showChannels: true } },
  ],
};

const pessoalCurriculo: RecipePage = {
  path: "/curriculo",
  title: tr("Currículo", "Résumé", "Currículum"),
  blocks: [
    chapter(2, tr("Curriculum Vitae", "Curriculum Vitae", "Curriculum Vitae"), tr("Trajetória, formação e competências.", "Experience, education and skills.", "Trayectoria, formación y habilidades.")),
    { type: "curriculo", fields: { showDownload: true } },
  ],
};

const pessoalPortfolio: RecipePage = {
  path: "/portfolio",
  title: tr("Projetos", "Projects", "Proyectos"),
  blocks: [
    chapter(3, tr("Projetos", "Projects", "Proyectos"), tr("Uma seleção do que já fiz.", "A selection of what I've done.", "Una selección de lo que he hecho.")),
    { type: "cases", variant: "sumario", source: { collection: "projects", sort: "order" }, fields: { title: SUMARIO, intro: tr("Obras", "Works", "Obras") } },
  ],
};

const pessoalSobre: RecipePage = {
  path: "/sobre",
  title: tr("Sobre", "About", "Sobre mí"),
  blocks: [
    chapter(4, tr("Prefácio", "Preface", "Prefacio"), tr("Quem sou, como trabalho e o que me move.", "Who I am, how I work and what drives me.", "Quién soy, cómo trabajo y qué me mueve.")),
    ...core("pessoal", "/sobre").blocks.map((b): RecipeBlock => {
      if (b.type === "lista-itens") return { ...b, fields: { ...b.fields, title: tr("Teses", "Theses", "Tesis"), intro: tr("Princípios de trabalho", "How I work", "Principios de trabajo") } };
      if (b.type === "galeria") return { ...b, fields: { ...b.fields, title: tr("Pranchas", "Plates", "Láminas"), intro: tr("Meu dia a dia", "My day to day", "Mi día a día") } };
      if (b.type === "faq") return { ...b, fields: { ...b.fields, title: tr("Perguntas e respostas", "Questions and answers", "Preguntas y respuestas") } };
      return b;
    }),
  ],
};

const pessoalBlog: RecipePage = {
  path: "/blog",
  title: tr("Blog", "Blog", "Blog"),
  blocks: [
    chapter(5, tr("Ensaios", "Essays", "Ensayos"), tr("Textos sobre o que aprendo e faço.", "Writing about what I learn and do.", "Textos sobre lo que aprendo y hago.")),
    { type: "posts-recentes", source: { collection: "posts", sort: "recent" }, fields: { title: SUMARIO, intro: tr("Ensaios", "Essays", "Ensayos"), showTagFilter: true } },
  ],
};

const pessoal: Recipe = [
  pessoalHome,
  pessoalCurriculo,
  pessoalPortfolio,
  pessoalSobre,
  pessoalBlog,
  core("pessoal", "/depoimentos"),
  core("pessoal", "/privacidade"),
];

// ---- empresa -------------------------------------------------------------------------

const E = (path: string) => core("empresa", path);
const rest = (path: string) => E(path).blocks;

const empresa: Recipe = [
  {
    path: "/",
    title: tr("Início", "Home", "Inicio"),
    blocks: [
      { ...heroFolha("empresa"), variant: "folha-de-rosto" },
      ...["numeros", "servicos", "cases", "depoimentos", "cta"].map((t) => E("/").blocks.find((b) => b.type === t)!),
    ],
  },
  {
    path: "/quem-somos",
    title: tr("Quem somos", "About us", "Quiénes somos"),
    blocks: [
      chapter(2, tr("Quem somos", "About us", "Quiénes somos"), tr("A história e as pessoas por trás da empresa.", "The story and the people behind the company.", "La historia y las personas detrás de la empresa.")),
      ...rest("/quem-somos").map((b): RecipeBlock => (b.type === "texto" ? { ...b, fields: { ...b.fields, title: tr("Prefácio", "Preface", "Prefacio") } } : b)),
    ],
  },
  {
    path: "/servicos",
    title: tr("Serviços", "Services", "Servicios"),
    blocks: [
      chapter(3, tr("Serviços", "Services", "Servicios"), tr("O que fazemos por você.", "What we do for you.", "Lo que hacemos por ti.")),
      ...rest("/servicos").map((b): RecipeBlock => (b.type === "servicos" ? { ...b, fields: { title: tr("Ofícios", "Crafts", "Oficios") } } : b)),
    ],
  },
  {
    path: "/precos",
    title: tr("Preços", "Pricing", "Precios"),
    blocks: [
      chapter(4, tr("Planos e preços", "Plans and pricing", "Planes y precios"), tr("Escolha o plano que cabe no seu momento.", "Pick the plan that fits where you are.", "Elige el plan que se ajusta a tu momento.")),
      ...rest("/precos").map((b): RecipeBlock => (b.type === "precos" ? { ...b, fields: { note: b.fields?.note } } : b)),
    ],
  },
  {
    path: "/cases",
    title: tr("Cases", "Case studies", "Casos"),
    blocks: [
      chapter(5, tr("Cases", "Case studies", "Casos"), tr("Resultados que ajudamos a construir.", "Results we helped build.", "Resultados que ayudamos a construir.")),
      { type: "cases", variant: "sumario", source: { collection: "projects", sort: "order" }, fields: { title: SUMARIO } },
    ],
  },
  {
    path: "/blog",
    title: tr("Blog", "Blog", "Blog"),
    blocks: [
      chapter(6, tr("Ensaios", "Essays", "Ensayos"), tr("Notas e ideias da nossa equipe.", "Notes and ideas from our team.", "Notas e ideas de nuestro equipo.")),
      { type: "posts-recentes", source: { collection: "posts", sort: "recent" }, fields: { title: SUMARIO, showTagFilter: true } },
    ],
  },
  {
    path: "/contato",
    title: tr("Contato", "Contact", "Contacto"),
    blocks: [
      chapter(7, tr("Contato", "Contact", "Contacto"), tr("Respondemos em até um dia útil.", "We reply within one business day.", "Respondemos en un día hábil.")),
      ...rest("/contato").map((b): RecipeBlock => (b.type === "contato" ? { ...b, fields: { ...b.fields, title: tr("Correspondência", "Correspondence", "Correspondencia"), intro: undefined } } : b)),
    ],
  },
  E("/privacidade"),
];

export const RECIPES = { pessoal, empresa };
