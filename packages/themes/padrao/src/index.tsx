/**
 * Tema padrão: o layout padrão da v1 (sidebar fixa, cartões com degradê, títulos de seção
 * em `/* ... *\/`). Substitui só a casca e os blocos `hero`, `servicos` e `depoimentos`;
 * o resto herda os componentes do núcleo e ganha o visual pelo CSS.
 */
import { CORE_RECIPES, defineTheme, type Recipe } from "@rubrica/core";
import fonts from "./fonts.json";
import { CurriculoBlock, DepoimentosBlock, HeroBlock, ServicosBlock } from "./blocks";
import { createSidebarShell } from "./shell";

export { createSidebarShell } from "./shell";
export { HeroBlock, ServicosBlock, DepoimentosBlock, CurriculoBlock } from "./blocks";
export { Icon } from "./icons";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/**
 * Receita do tipo pessoal: a home da v1 padrão (hero com números, cases, sobre, o que
 * faço, depoimentos, fechamento e contato). As outras páginas seguem as do núcleo.
 */
const core = CORE_RECIPES.pessoal;
const home: Recipe[number] = {
  path: "/",
  title: tr("Início", "Home", "Inicio"),
  blocks: [
    {
      type: "hero",
      fields: {
        eyebrow: tr("whoami", "whoami", "whoami"),
        title: tr("Uma frase que diz o que você faz e para quem", "One sentence on what you do and for whom", "Una frase sobre qué haces y para quién"),
        subtitle: tr("Um parágrafo curto sobre você e o tipo de trabalho que procura.", "A short paragraph about you and the kind of work you look for.", "Un párrafo corto sobre ti y el tipo de trabajo que buscas."),
        primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" },
        secondaryCta: { label: tr("Falar comigo", "Get in touch", "Hablemos"), href: "#contato" },
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
    { type: "cases", fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: { label: tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), href: "/portfolio" } } },
    {
      type: "texto",
      fields: {
        title: tr("Sobre mim", "About me", "Sobre mí"),
        body: tr("<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p>", "<p>Say in a few lines who you are, how you work and what drives you.</p>", "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p>"),
      },
    },
    { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("O que falam sobre mim", "What people say about me", "Lo que dicen de mí"), allowSubmission: true } },
    {
      type: "cta",
      fields: {
        title: tr("Vamos conversar?", "Shall we talk?", "¿Hablamos?"),
        body: tr("Conte o contexto e eu respondo com os próximos passos.", "Tell me the context and I'll reply with next steps.", "Cuéntame el contexto y respondo con los próximos pasos."),
        primary: { label: tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), href: "#contato" },
        secondary: { label: tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), href: "#contato" },
      },
    },
    { type: "contato", fields: { anchor: "contato", title: tr("Contato", "Contact", "Contacto"), mode: "wizard", showChannels: true } },
  ],
};

/**
 * Currículo como o da v1: cabeçalho da página, o resumo profissional, os números, o PDF e
 * as duas colunas do currículo (o bloco `curriculo` sem título: o cabeçalho já é o h1).
 */
const curriculo: Recipe[number] = {
  path: "/curriculo",
  title: tr("Currículo", "Résumé", "Currículum"),
  blocks: [
    {
      type: "hero",
      variant: "pagina",
      fields: {
        title: tr("Currículo", "Résumé", "Currículum"),
        subtitle: tr("Onde trabalhei, o que estudei e com o que trabalho.", "Where I've worked, what I studied and what I work with.", "Dónde trabajé, qué estudié y con qué trabajo."),
      },
    },
    {
      type: "texto",
      fields: {
        body: tr(
          "<p>Um parágrafo sobre você: o que faz, onde, e um ou dois resultados com <strong>números</strong>.</p>",
          "<p>One paragraph about you: what you do, where, and one or two results with <strong>numbers</strong>.</p>",
          "<p>Un párrafo sobre ti: qué haces, dónde, y uno o dos resultados con <strong>números</strong>.</p>",
        ),
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
    { type: "curriculo", fields: { showDownload: true } },
  ],
};

/**
 * Páginas de lista (portfólio, blog, depoimentos) com o cabeçalho da v1: o título e o apoio do
 * bloco da lista sobem para um hero "pagina" (h1 visível), e a lista fica sem título.
 */
const LIST_PAGES = new Set(["/portfolio", "/blog", "/depoimentos"]);
function withPageHeader(page: Recipe[number]): Recipe[number] {
  const [list, ...rest] = page.blocks;
  if (!LIST_PAGES.has(page.path) || !list?.fields?.title) return page;
  const { title, intro, ...fields } = list.fields;
  return {
    ...page,
    blocks: [{ type: "hero", variant: "pagina", fields: { title, ...(intro ? { subtitle: intro } : {}) } }, { ...list, fields }, ...rest],
  };
}

export default defineTheme({
  id: "padrao",
  label: "Padrão",
  description: "Layout padrão do Rubrica: sidebar fixa, cartões em degradê e títulos de seção em comentário de código.",
  contract: "^1",
  scheme: "neon",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#A855F7", light: "#7E22CE" },
    "rb-accent-2": { label: "Segunda cor", kind: "color", default: "#BEF264", light: "#4A770E" },
  },
  Shell: createSidebarShell(),
  // O "Fale comigo" abre o contato numa janela, como o assistente da v1.
  contactDialog: true,
  blocks: { hero: HeroBlock, servicos: ServicosBlock, depoimentos: DepoimentosBlock, curriculo: CurriculoBlock },
  variants: {
    hero: [
      { value: "inicio", label: "Início" },
      { value: "pagina", label: "Cabeçalho de página" },
    ],
    cases: [
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Lista" },
    ],
  },
  recipes: { pessoal: [home, ...core.filter((p) => p.path !== "/").map((p) => (p.path === "/curriculo" ? curriculo : withPageHeader(p)))] },
});
