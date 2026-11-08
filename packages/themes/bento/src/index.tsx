/**
 * Tema Bento: o layout bento da v1. Cada página é um mosaico de cartões (grade de 12
 * colunas, cantos bem arredondados, borda fina e fundo tingido pela cor do texto) e a
 * navegação sai do topo para uma dock flutuante no rodapé. Substitui a casca e os blocos
 * `hero`, `cases`, `servicos`, `depoimentos` e `curriculo`; o resto herda o núcleo e
 * ganha o visual de cartão pelo CSS.
 */
import { CORE_RECIPES, defineTheme, type Recipe, type RecipeBlock } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock, CurriculoBlock, DepoimentosBlock, HeroBlock, ServicosBlock } from "./blocks";
import { BentoShell } from "./shell";

export { BentoShell } from "./shell";
export { HeroBlock, CasesBlock, ServicosBlock, DepoimentosBlock, CurriculoBlock } from "./blocks";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/** Cases das páginas de listagem (portfólio) usam a hierarquia da v1. */
const withHierarchy = (blocks: RecipeBlock[]): RecipeBlock[] => blocks.map((b) => (b.type === "cases" && b.source ? { ...b, variant: "destaque" } : b));

/**
 * Pessoal: a home da v1 (hero com perfil e contato, números logo abaixo, cases em
 * destaque, serviços, depoimentos), fechando com o convite e o contato, que o botão
 * "Fale comigo" do hero alcança por âncora. As outras páginas seguem as do núcleo.
 */
const personalHome: Recipe[number] = {
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
        secondaryCta: { label: tr("Fale comigo", "Get in touch", "Hablemos"), href: "#contato" },
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
    { type: "cases", variant: "grade", fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: { label: tr("Ver todos os projetos", "See all projects", "Ver todos los proyectos"), href: "/portfolio" } } },
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

const pessoal: Recipe = CORE_RECIPES.pessoal.map((p) => (p.path === "/" ? personalHome : { ...p, blocks: withHierarchy(p.blocks) }));

/** Empresa: o núcleo, com os números logo abaixo do hero (como no Bento) e a hierarquia nos cases. */
const empresa: Recipe = CORE_RECIPES.empresa.map((p) => {
  if (p.path !== "/") return { ...p, blocks: withHierarchy(p.blocks) };
  const blocks = [...p.blocks];
  const n = blocks.findIndex((b) => b.type === "numeros");
  const [numeros] = n >= 0 ? blocks.splice(n, 1) : [];
  if (numeros) blocks.splice(1, 0, numeros);
  return { ...p, blocks: blocks.map((b) => (b.type === "cases" ? { ...b, variant: "grade" } : b)) };
});

export default defineTheme({
  id: "bento",
  label: "Bento",
  description: "Mosaico de cartões em grade de 12 colunas e dock flutuante: moderno, orientado a produto.",
  contract: "^1",
  scheme: "editorial-cream",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor primária", kind: "color", default: "#C084FC", light: "#8A1AF4" },
    "rb-accent-2": { label: "Cor de destaque", kind: "color", default: "#F87171", light: "#C71111" },
    "bento-radius": { label: "Arredondamento dos cartões", kind: "length", default: "1.375rem" },
    "bento-gap": { label: "Espaço entre cartões", kind: "length", default: "0.875rem" },
  },
  Shell: BentoShell,
  blocks: { hero: HeroBlock, cases: CasesBlock, servicos: ServicosBlock, depoimentos: DepoimentosBlock, curriculo: CurriculoBlock },
  variants: {
    cases: [
      { value: "grade", label: "Grade" },
      { value: "destaque", label: "Destaque" },
    ],
  },
  recipes: { pessoal, empresa },
  texts: {
    "bento.nav": { pt: "Navegação principal", en: "Main navigation", es: "Navegación principal" },
    "bento.featured": { pt: "Destaque", en: "Featured", es: "Destacado" },
  },
});
