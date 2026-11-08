/**
 * Receitas do tema Jardim Digital (decisão 24): a ordem e os títulos das páginas do
 * layout `garden` da v1.
 *
 * - Home: entrada ("Oi! Eu sou…"), estado do jardim (números), árvores (cases), quem
 *   cuida do jardim, canteiros (serviços), livro de visitas, "plante uma conversa" e contato.
 * - Sobre: regras do jardim abrem a página; depois o resumo, o lado pessoal, o dia a
 *   dia, os interesses (serviços em etiquetas) e as perguntas frequentes.
 * - Currículo, portfólio e blog: título da página (hero), com a linha do tempo, as
 *   árvores e brotos (cases em destaque + filtro) e as notas por estágio.
 *
 * Na empresa a v1 não tinha site: vale a receita do núcleo, com os números logo abaixo
 * da abertura e os cases na variação `destaque` na página de cases.
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
        title: tr("Estado do jardim", "State of the garden", "Estado del jardín"),
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
          { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
        ],
      },
    },
    {
      type: "cases",
      variant: "grade",
      fields: { anchor: "cases", title: tr("Árvores do jardim", "Trees in the garden", "Árboles del jardín"), cta: link(tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), "/portfolio") },
    },
    {
      type: "texto",
      fields: {
        title: tr("Quem cuida do jardim", "Who tends this garden", "Quién cuida el jardín"),
        body: tr("<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p>", "<p>Say in a few lines who you are, how you work and what drives you.</p>", "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p>"),
      },
    },
    { type: "servicos", variant: "canteiros", fields: { title: tr("Canteiros", "Garden beds", "Bancales"), intro: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("Livro de visitas", "Guestbook", "Libro de visitas"), allowSubmission: true } },
    {
      type: "cta",
      fields: {
        title: tr("Tem um projeto em mente?", "Have a project in mind?", "¿Tienes un proyecto en mente?"),
        body: tr("Conte o contexto e eu respondo com os próximos passos.", "Tell me the context and I'll reply with next steps.", "Cuéntame el contexto y respondo con los próximos pasos."),
        primary: link(tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), "#contato"),
        secondary: link(tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), "#contato"),
      },
    },
    { type: "contato", fields: { anchor: "contato", title: tr("Contato", "Contact", "Contacto"), mode: "wizard", showChannels: true } },
  ],
};

const sobre: RecipePage = {
  path: "/sobre",
  title: tr("Sobre", "About", "Sobre mí"),
  blocks: [
    { type: "hero", fields: { title: tr("Sobre", "About", "Sobre mí"), subtitle: tr("Quem sou, como trabalho e o que faço fora do trabalho.", "Who I am, how I work and what I do outside work.", "Quién soy, cómo trabajo y qué hago fuera del trabajo.") } },
    {
      type: "lista-itens",
      fields: {
        title: tr("Regras do jardim", "Garden rules", "Reglas del jardín"),
        intro: tr("Como eu trabalho", "How I work", "Cómo trabajo"),
        numbered: true,
        items: [
          { title: tr("Entender antes de fazer", "Understand before doing", "Entender antes de hacer"), body: tr("Começo ouvindo o problema.", "I start by listening to the problem.", "Empiezo escuchando el problema.") },
          { title: tr("Entregar em partes", "Deliver in small steps", "Entregar por partes"), body: tr("Ciclos curtos, com feedback.", "Short cycles, with feedback.", "Ciclos cortos, con retroalimentación.") },
        ],
      },
    },
    {
      type: "texto",
      fields: {
        title: tr("Resumo profissional", "Professional summary", "Resumen profesional"),
        body: tr("<p>Sua trajetória profissional em poucos parágrafos.</p>", "<p>Your professional story in a few paragraphs.</p>", "<p>Tu trayectoria profesional en pocos párrafos.</p>"),
      },
    },
    {
      type: "texto",
      fields: {
        title: tr("Fora do trabalho", "Outside of work", "Fuera del trabajo"),
        body: tr("<p>O que você gosta de fazer quando não está trabalhando.</p>", "<p>What you like to do when you are not working.</p>", "<p>Lo que te gusta hacer cuando no trabajas.</p>"),
      },
    },
    { type: "galeria", fields: { title: tr("Meu dia a dia", "My day to day", "Mi día a día") } },
    { type: "servicos", variant: "etiquetas", fields: { title: tr("Interesses", "Interests", "Intereses") } },
    { type: "faq", fields: { title: tr("Perguntas frequentes", "Frequently asked questions", "Preguntas frecuentes") } },
  ],
};

const curriculo: RecipePage = {
  path: "/curriculo",
  title: tr("Currículo", "Résumé", "Currículum"),
  blocks: [
    { type: "hero", fields: { title: tr("Currículo", "Résumé", "Currículum"), subtitle: tr("Um resumo da sua trajetória em uma ou duas frases.", "A summary of your career in a sentence or two.", "Un resumen de tu trayectoria en una o dos frases.") } },
    {
      type: "numeros",
      fields: {
        title: tr("Estado do jardim", "State of the garden", "Estado del jardín"),
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
        ],
      },
    },
    { type: "curriculo", fields: { showDownload: true } },
  ],
};

const portfolio: RecipePage = {
  path: "/portfolio",
  title: tr("Projetos", "Projects", "Proyectos"),
  blocks: [
    {
      type: "hero",
      fields: {
        title: tr("Árvores e brotos", "Trees and sprouts", "Árboles y brotes"),
        subtitle: tr("Árvores são projetos com estudo de caso completo; brotos ainda não têm case.", "Trees are projects with a full case study; sprouts don't have one yet.", "Los árboles son proyectos con un caso de estudio completo; los brotes todavía no lo tienen."),
      },
    },
    { type: "cases", variant: "destaque", source: { collection: "projects", sort: "order" }, fields: {} },
  ],
};

const blog: RecipePage = {
  path: "/blog",
  title: tr("Blog", "Blog", "Blog"),
  blocks: [
    {
      type: "hero",
      fields: {
        title: tr("Notas do jardim", "Garden notes", "Notas del jardín"),
        subtitle: tr("Textos sobre o que aprendo e faço, em diferentes estágios de crescimento.", "Writing about what I learn and do, at different stages of growth.", "Textos sobre lo que aprendo y hago, en distintas etapas de crecimiento."),
      },
    },
    { type: "posts-recentes", variant: "notas", source: { collection: "posts", sort: "recent" }, fields: { showTagFilter: true } },
  ],
};

const depoimentos: RecipePage = {
  path: "/depoimentos",
  title: tr("Depoimentos", "Testimonials", "Testimonios"),
  blocks: [
    {
      type: "depoimentos",
      source: { collection: "testimonials", sort: "order" },
      fields: {
        title: tr("Livro de visitas", "Guestbook", "Libro de visitas"),
        intro: tr("O que as pessoas dizem sobre trabalhar comigo.", "What people say about working with me.", "Lo que dice la gente sobre trabajar conmigo."),
        allowSubmission: true,
      },
    },
  ],
};

const OWN: Record<string, RecipePage> = { "/": home, "/sobre": sobre, "/curriculo": curriculo, "/portfolio": portfolio, "/blog": blog, "/depoimentos": depoimentos };

const pessoal: Recipe = CORE_RECIPES.pessoal.map((p) => OWN[p.path] ?? p);

/** Empresa: o núcleo, com os números logo abaixo da abertura e os cases em destaque na listagem. */
const empresa: Recipe = CORE_RECIPES.empresa.map((page) => {
  if (page.path === "/") {
    const blocks = [...page.blocks];
    const n = blocks.findIndex((b) => b.type === "numeros");
    const [numeros] = n >= 0 ? blocks.splice(n, 1) : [];
    if (numeros) blocks.splice(1, 0, numeros);
    return { ...page, blocks };
  }
  if (page.path === "/cases") return { ...page, blocks: page.blocks.map((b): RecipeBlock => (b.type === "cases" ? { ...b, variant: "destaque" } : b)) };
  return page;
});

export const GARDEN_RECIPES = { pessoal, empresa };
