/**
 * Conteúdo do site. Layouts, esquemas e fontes vêm do CLI (cli/src): são exatamente as
 * opções que o `create-rubrica` oferece.
 */
import { LAYOUTS, TEXTURES, type ColorMode, type Texture } from "../../../cli/src/layouts";
import { SCHEMES } from "../../../cli/src/themes/schemes";
import { SANS_FONTS, MONO_FONTS } from "../../../cli/src/themes/fonts";

export { LAYOUTS, SCHEMES, SANS_FONTS, MONO_FONTS, TEXTURES };

export const REPO = "https://github.com/MierzwaMatheus/rubrica";
export const COMMAND = "npx create-rubrica@latest meu-portfolio";

/** Páginas que cada layout desenha (as rotas do app). */
export const PAGES = [
  { path: "/", label: "Início" },
  { path: "/curriculo", label: "Currículo" },
  { path: "/portfolio", label: "Portfólio" },
  { path: "/sobre", label: "Sobre" },
  { path: "/blog", label: "Blog" },
];

export interface Mood {
  id: string;
  name: string;
  layout: string;
  scheme: string;
  mode: ColorMode;
  texture: Texture;
  sans: string;
  mono: string;
}

/**
 * Um mood é uma combinação pronta de tudo (layout, esquema, modo, textura e fontes).
 * A paleta (esquema) é só a parte das cores.
 */
export const MOODS: Mood[] = [
  { id: "atelie", name: "Ateliê de papel", layout: "zine", scheme: "riso", mode: "light", texture: "paper", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "catalogo", name: "Catálogo", layout: "index", scheme: "sumi", mode: "light", texture: "none", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "ensaio", name: "Ensaio longo", layout: "monograph", scheme: "azulejo", mode: "light", texture: "paper", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "sessao", name: "Sessão 1998", layout: "desktop", scheme: "sorbet", mode: "light", texture: "grain", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "madrugada", name: "Madrugada", layout: "desktop", scheme: "fosforo", mode: "dark", texture: "scanlines", sans: "JetBrains Mono", mono: "IBM Plex Mono" },
  { id: "prancheta", name: "Prancheta", layout: "blueprint", scheme: "cianotipia", mode: "dark", texture: "paper", sans: "IBM Plex Sans", mono: "IBM Plex Mono" },
  { id: "fim-de-tarde", name: "Fim de tarde", layout: "garden", scheme: "crepusculo", mode: "dark", texture: "grain", sans: "Fraunces", mono: "IBM Plex Mono" },
  { id: "fala-comigo", name: "Fala comigo", layout: "chat", scheme: "alto-contraste", mode: "light", texture: "none", sans: "Instrument Sans", mono: "IBM Plex Mono" },
  { id: "verao", name: "Verão no Aterro", layout: "poster", scheme: "tropicalia", mode: "light", texture: "grain", sans: "Bricolage Grotesque", mono: "IBM Plex Mono" },
  { id: "neon", name: "Neon original", layout: "cyberpunk", scheme: "neon", mode: "dark", texture: "none", sans: "Chakra Petch", mono: "JetBrains Mono" },
  { id: "terminal", name: "Terminal", layout: "brutalist", scheme: "concreto", mode: "dark", texture: "scanlines", sans: "JetBrains Mono", mono: "JetBrains Mono" },
  { id: "cartaz", name: "Cartaz suíço", layout: "swiss", scheme: "paper-noir", mode: "light", texture: "none", sans: "Archivo", mono: "JetBrains Mono" },
  { id: "produto", name: "Produto", layout: "bento", scheme: "editorial-cream", mode: "light", texture: "none", sans: "Manrope", mono: "JetBrains Mono" },
  { id: "revista", name: "Revista", layout: "magazine", scheme: "editorial-cream", mode: "light", texture: "paper", sans: "Bodoni Moda", mono: "JetBrains Mono" },
];

export const FEATURES = [
  { title: "Home", text: "Apresentação, números de destaque, cases, serviços, depoimentos e chamada de contato." },
  { title: "Portfólio", text: "Projetos com filtro por categoria e estudos de caso com métricas, decisões e aprendizados." },
  { title: "Blog", text: "Editor rich text, tags, busca e RSS automático." },
  { title: "Currículo", text: "Estruturado, com PDF otimizado para ATS." },
  { title: "Propostas", text: "Protegidas por senha, com aceite eletrônico, assinatura manuscrita e contrato em PDF." },
  { title: "Painel admin", text: "Tudo editável pela interface, sem tocar no código." },
  { title: "Plugins", text: "Liga e desliga o que você não quer expor." },
  { title: "Pagamentos", text: "Checkout com PIX, boleto e cartão em até 12x pelo Asaas. Opcional." },
  { title: "IA", text: "Tradução automática e currículo adaptado para cada vaga. Opcional." },
];

export const STEPS = [
  {
    title: "Crie o projeto",
    code: COMMAND,
    text: "Monte no combinador e copie o comando pronto em \"Crie o seu\", ou rode este e responda às perguntas. Ele instala tudo, conecta o banco de dados e cria o painel admin.",
  },
  { title: "Abra o site", code: "npm run dev", text: "Na pasta do projeto. O painel fica em /login, com o e-mail e a senha que você definiu." },
  { title: "Publique", code: "npx create-rubrica publicar", text: "Coloca o site no ar na Vercel (conta gratuita), com o banco de produção e o admin do site publicado. Depois, o update traz as versões novas sem apagar o que você personalizou." },
];

export function layoutLabel(id: string): string {
  return LAYOUTS.find((l) => l.id === id)?.label ?? id;
}
