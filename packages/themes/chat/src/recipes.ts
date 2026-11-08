/**
 * Receitas do tema Conversa (decisão 24): a ordem das páginas do layout `chat` da v1.
 *
 * - Home: apresentação, números, cases, sobre, o que faço, depoimentos, fechamento e,
 *   no fim, o contato (na v1 o assistente abria num modal; aqui é o destino de "Fale comigo").
 * - Sobre: princípios abrem a conversa, depois quem é, fora do trabalho, dia a dia,
 *   interesses (serviços em etiquetas) e as perguntas frequentes.
 * - Projetos e blog: o primeiro cartão em destaque, como na v1.
 *
 * As outras páginas seguem as do núcleo. Na empresa, a v1 não tinha site de empresa: vale
 * a receita do núcleo, só com os cases e o blog na variação `destaque`.
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
    {
      type: "cases",
      variant: "lista",
      fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: link(tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), "/portfolio") },
    },
    {
      type: "texto",
      variant: "pergunta",
      fields: {
        title: tr("Me conta mais sobre você", "Tell me more about yourself", "Cuéntame más sobre ti"),
        body: tr(
          "<p>Conte em poucas linhas quem você é e como trabalha.</p><p>Cada parágrafo vira um balão da conversa.</p>",
          "<p>Say in a few lines who you are and how you work.</p><p>Each paragraph becomes a chat bubble.</p>",
          "<p>Cuenta en pocas líneas quién eres y cómo trabajas.</p><p>Cada párrafo se convierte en una burbuja de la conversación.</p>",
        ),
      },
    },
    { type: "servicos", variant: "lista", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("Depoimentos", "Testimonials", "Testimonios"), allowSubmission: true } },
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

const sobre: RecipePage = {
  path: "/sobre",
  title: tr("Sobre", "About", "Sobre mí"),
  blocks: [
    {
      type: "lista-itens",
      fields: {
        title: tr("Princípios de trabalho", "How I work", "Principios de trabajo"),
        numbered: true,
        items: [
          { title: tr("Entender antes de fazer", "Understand before doing", "Entender antes de hacer"), body: tr("Começo ouvindo o problema.", "I start by listening to the problem.", "Empiezo escuchando el problema.") },
          { title: tr("Entregar em partes", "Deliver in small steps", "Entregar por partes"), body: tr("Ciclos curtos, com feedback.", "Short cycles, with feedback.", "Ciclos cortos, con retroalimentación.") },
        ],
      },
    },
    {
      type: "texto",
      variant: "pergunta",
      fields: {
        title: tr("Quem é você?", "Who are you?", "¿Quién eres?"),
        body: tr("<p>Sua trajetória profissional em poucos parágrafos.</p>", "<p>Your professional story in a few paragraphs.</p>", "<p>Tu trayectoria profesional en pocos párrafos.</p>"),
      },
    },
    {
      type: "texto",
      variant: "pergunta",
      fields: {
        title: tr("E fora do trabalho?", "And outside work?", "¿Y fuera del trabajo?"),
        body: tr("<p>O que você gosta de fazer quando não está trabalhando.</p>", "<p>What you like to do when you are not working.</p>", "<p>Lo que te gusta hacer cuando no trabajas.</p>"),
      },
    },
    { type: "galeria", fields: { title: tr("Meu dia a dia", "My day to day", "Mi día a día") } },
    { type: "servicos", variant: "etiquetas", fields: { title: tr("Interesses", "Interests", "Intereses") } },
    { type: "faq", fields: { title: tr("Perguntas frequentes", "Frequently asked questions", "Preguntas frecuentes") } },
  ],
};

/** Troca a variação dos blocos de um tipo numa página da receita do núcleo. */
const withVariant = (page: RecipePage, type: string, variant: string): RecipePage => ({
  ...page,
  blocks: page.blocks.map((b): RecipeBlock => (b.type === type ? { ...b, variant } : b)),
});

const listings = (page: RecipePage): RecipePage => {
  if (page.path === "/portfolio" || page.path === "/cases") return withVariant(page, "cases", "destaque");
  if (page.path === "/blog") return withVariant(page, "posts-recentes", "destaque");
  return page;
};

const pessoal: Recipe = [home, sobre, ...CORE_RECIPES.pessoal.filter((p) => p.path !== "/" && p.path !== "/sobre").map(listings)];
const empresa: Recipe = CORE_RECIPES.empresa.map(listings);

export const CHAT_RECIPES = { pessoal, empresa };
