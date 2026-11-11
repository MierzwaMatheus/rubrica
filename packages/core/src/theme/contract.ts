/**
 * Contrato de tema (RFC v2: "Temas e o contrato de blocos", decisões 16, 23, 24, 30).
 *
 * Um tema é um pacote que exporta `defineTheme({...})` como padrão em "." e a folha
 * de estilo em "./styles.css" (convenção: a integração importa as duas). Ele fornece:
 * - tokens (CSS custom properties) e a folha de estilo;
 * - a casca (Shell): cabeçalho, navegação, rodapé;
 * - um componente React por tipo de bloco (opcional: sem ele, vale o padrão do núcleo);
 * - templates de post, case e 404 (opcionais);
 * - variações por bloco e receitas de páginas por tipo de site.
 *
 * Componentes de tema são React PUROS: só props, sem buscar dados, sem estado nem
 * efeitos. O Astro os renderiza em HTML estático. O que precisa de JavaScript é ilha
 * (`islands`), montada pelo núcleo.
 *
 * O que NÃO é do tema (fica no núcleo): <head>, SEO, JSON-LD, o h1 único por página,
 * imagens responsivas, idiomas.
 */
import type { ComponentType, ReactNode } from "react";
import type { Locale, LocaleConfig } from "../i18n";
import type { ResolvedImage, ResolvedLink } from "../blocks/fields";
import type { NavItem, Organization, SiteKind, SocialLink } from "../content/types";
import type { CollectionItems, PostItem, ProjectItem } from "../render/collections";

/** Versão do contrato de blocos que este núcleo implementa (decisão 30). 1.1: vídeo, incorporação, linha do tempo e comparativo de planos. 1.2: orientação de uso dos blocos (`guidance`). */
export const CONTRACT_VERSION = "1.2.0";

export interface ResolvedNavItem {
  label: string;
  href: string;
  current: boolean;
}

export interface ResolvedSite {
  kind: SiteKind;
  name: string;
  description?: string;
  url: string;
  navigation: ResolvedNavItem[];
  social: SocialLink[];
  organization?: Organization;
  person?: { name: string; jobTitle?: string; email?: string; phone?: string; whatsapp?: string; photo?: ResolvedImage };
  plugins: Record<string, boolean>;
  colorMode: "dark" | "light" | "system";
  colorToggle: boolean;
  /** Logo resolvida (o `alt` já vem com o nome do site se faltar). `dark` para fundo escuro. */
  logo?: ResolvedImage & { dark?: ResolvedImage };
  /**
   * A home mostra a disponibilidade (algum hero visível dela com "Mostrar disponibilidade"),
   * para a casca repetir o aviso (ex.: o status no cabeçalho do chat). O texto é
   * `ctx.t("hero.available")`.
   */
  availability: boolean;
  /**
   * WhatsApp do site (`SiteSettings.whatsapp`), no idioma: `href` é o `wa.me` com a mensagem
   * do idioma. O núcleo já desenha o botão flutuante quando `floating`; o tema pode usar o
   * `href` onde quiser (ex.: um botão na casca).
   */
  whatsapp?: ResolvedWhatsApp;
  /** Faixa de aviso no ar neste build e idioma. O núcleo a desenha antes da casca. */
  announcement?: ResolvedAnnouncement;
  /**
   * Id da janela de contato (`popover`) que o núcleo põe em toda página quando o tema pede
   * (`ThemeDefinition.contactDialog`), o plugin de contato está ligado e o site tem um bloco
   * `contato` no idioma. O tema abre a janela com `<button popoverTarget={id}>`, sem
   * JavaScript; o formulário dela só carrega quando ela abre.
   */
  contactDialog?: string;
}

export interface ResolvedWhatsApp {
  /** Só dígitos, formato internacional. */
  number: string;
  href: string;
  floating: boolean;
  /** Texto visível do botão flutuante no idioma, quando há. */
  label?: string;
}

export interface ResolvedAnnouncement {
  text: string;
  link?: ResolvedLink;
  tone: "info" | "destaque";
}

/** Feeds do site no idioma da página (caminhos com o prefixo do idioma). */
export interface ResolvedFeeds {
  /** RSS do blog: o do idioma, ou o do idioma principal se este não tem post. Sem blog, ausente. */
  rss?: string;
}

export interface Alternate {
  locale: Locale;
  href: string;
  /** Nome do idioma no próprio idioma ("English"). */
  label: string;
  current: boolean;
}

export interface RenderContext {
  locale: Locale;
  locales: LocaleConfig;
  site: ResolvedSite;
  /** Caminho atual, com prefixo do idioma. */
  path: string;
  /** Versões da página atual nos idiomas em que ela existe (seletor de idioma). */
  alternates: Alternate[];
  /** Texto de interface pela chave, já no idioma (cai no principal). */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Caminho interno no idioma atual: `href("/blog")` → `/en/blog`. */
  href: (path: string) => string;
  /** Data formatada no idioma. */
  formatDate: (iso: string, style?: "long" | "short" | "month") => string;
  /** Feeds (RSS) para o tema linkar. */
  feeds: ResolvedFeeds;
}

export interface BlockProps<Fields = Record<string, unknown>, Item = unknown> {
  id: string;
  /** Variação escolhida (já validada contra as do tema; senão, a padrão). */
  variant: string;
  fields: Fields;
  /** Itens da coleção, para blocos com fonte. */
  items: Item[];
  /** 1 só no primeiro bloco, quando ele leva o título da página (hero). Senão 2. */
  headingLevel: 1 | 2;
  /** Posição na página, a partir de 0. */
  index: number;
  /** Quantos blocos visíveis a página tem (para "03/06"). */
  total: number;
  ctx: RenderContext;
  /** Ilha do bloco interativo (ex.: o assistente de contato), já montada pelo núcleo. */
  island?: ReactNode;
}

export type BlockComponent<Fields = any, Item = any> = ComponentType<BlockProps<Fields, Item>>;

/** Projeto resumido para a casca (mapa do site, menu de projetos). */
export interface ShellProjectSummary {
  id: string;
  title: string;
  url: string;
  category?: string;
  tags: string[];
  featured: boolean;
}

/** Post resumido para a casca. */
export interface ShellPostSummary {
  id: string;
  title: string;
  url: string;
  /** ISO 8601. */
  publishedAt: string;
  tags: string[];
  featured: boolean;
}

/**
 * Resumo leve das coleções no idioma da página, para a casca (ex.: o mapa do jardim).
 * Só título, endereço e marcadores: nada de texto longo nem imagem, e nada vai ao HTML se
 * o tema não usar. Coleção com o plugin desligado vem vazia.
 */
export interface ShellCollections {
  /** Na ordem do painel. */
  projects: ShellProjectSummary[];
  /** Mais novos primeiro. */
  posts: ShellPostSummary[];
}

export interface ShellProps {
  ctx: RenderContext;
  /** Tipo da página, para a casca variar (ex.: sem hero no post). */
  pageType: "page" | "post" | "case" | "notFound";
  /** Projetos e posts do idioma, resumidos. */
  collections: ShellCollections;
  children: ReactNode;
  /** Ilhas que a casca pode posicionar: alternância de tema e seletor de idioma. */
  colorToggle?: ReactNode;
  localeSwitcher?: ReactNode;
}

export interface PostTemplateProps {
  post: PostItem;
  /** HTML do post, sanitizado no backend. */
  html: string;
  related: PostItem[];
  /** Projeto com case que divide uma etiqueta com o post (o "Case relacionado" da v1), se houver. */
  relatedCase?: ProjectItem;
  ctx: RenderContext;
}

export interface CaseTemplateProps {
  project: ProjectItem;
  related: ProjectItem[];
  /** Próximo case na ordem do portfólio (com volta ao início), entre os projetos com seções. */
  next?: ProjectItem;
  /**
   * O carrossel das telas (a capa e a galeria) já montado como ilha, quando o tema pede
   * (`caseCarousel`) e o projeto tem imagens. Sem JavaScript, é uma faixa com rolagem lateral.
   */
  carousel?: ReactNode;
  ctx: RenderContext;
}

export interface NotFoundProps {
  ctx: RenderContext;
}

export interface VariantOption {
  value: string;
  label: string;
}

/** Blocos iniciais de uma página: tipo + campos e fonte opcionais. */
export interface RecipeBlock {
  type: string;
  variant?: string;
  /**
   * `false` cria o bloco escondido (fica na página, desligado no editor). Ex.: o `contato` da
   * home num tema que abre o contato numa janela. Sem valor, visível.
   */
  visible?: boolean;
  fields?: Record<string, unknown>;
  source?: import("../content/types").CollectionQuery;
}

export interface RecipePage {
  path: string;
  /** Título por idioma. */
  title: Record<Locale, string>;
  blocks: RecipeBlock[];
}

export type Recipe = RecipePage[];

export interface TokenDef {
  label: string;
  kind: "color" | "font" | "length" | "other";
  default: string;
  /** Valor no modo claro, quando difere. */
  light?: string;
}

export interface ThemeFonts {
  sans?: string;
  mono?: string;
  display?: string;
  /**
   * Papéis (`sans`, `mono`, `display`) que também baixam o itálico de verdade, no lugar do
   * oblíquo sintetizado pelo navegador. Vale para a família que ocupar o papel, mesmo que
   * o site troque a fonte. Ex.: `"italic": ["sans", "display"]`.
   */
  italic?: string[];
}

export interface ThemeDefinition {
  /** Identificador do pacote sem o escopo: `padrao`, `cyberpunk`. */
  id: string;
  label: string;
  description?: string;
  /** Faixa semver do contrato de blocos compatível (decisão 30): `^1`. */
  contract: string;
  tokens: Record<string, TokenDef>;
  Shell: ComponentType<ShellProps>;
  blocks?: Partial<Record<string, BlockComponent>>;
  /**
   * Blocos próprios do tema que desenham a ilha de um bloco com `islandOptIn` (ex.: a busca
   * do `posts-recentes`). Sem o tipo aqui, um bloco do tema não recebe essa ilha, e a página
   * não carrega JavaScript à toa.
   */
  islandBlocks?: string[];
  templates?: {
    post?: ComponentType<PostTemplateProps>;
    case?: ComponentType<CaseTemplateProps>;
    notFound?: ComponentType<NotFoundProps>;
  };
  /** Variações por tipo de bloco; a primeira é a padrão (decisão 23). */
  variants?: Partial<Record<string, VariantOption[]>>;
  /** Receitas por tipo de site (decisão 24). Sem receita, usa a do núcleo. */
  recipes?: Partial<Record<SiteKind, Recipe>>;
  /**
   * Esquema de cor padrão do tema (id de `SCHEMES`), usado quando o site não escolhe um
   * (`appearance.scheme`). Opcional: sem ele valem só os tokens da folha do tema.
   */
  scheme?: string;
  /**
   * Modo de cor recomendado (o que o layout foi desenhado para mostrar primeiro). O CLI
   * usa como padrão ao criar o site e ao trocar de tema; quem decide no site continua
   * sendo `appearance.colorMode`. Sem ele, o recomendado é o escuro.
   */
  colorMode?: "dark" | "light" | "system";
  /**
   * Textura padrão do tema (a que o layout da v1 recomendava), quando o site não escolhe uma
   * (`appearance.texture`). Uma camada fixa por cima da página, sem receber cliques; some com
   * `prefers-reduced-transparency`. Sem ela, nenhuma.
   */
  texture?: import("../content/types").Texture;
  /**
   * Fontes que o tema usa por padrão (Google Fonts), baixadas no build. O build lê as
   * mesmas famílias do `fonts.json` que o pacote do tema exporta em "./fonts.json" (o
   * `index` do tema importa esse arquivo, então há uma fonte só).
   */
  fonts?: ThemeFonts;
  /**
   * Textos de interface próprios do tema (chave → texto por idioma base: `pt`, `en`, `es`).
   * Use um prefixo com o id do tema (`chat.typing`). O site pode sobrescrever em "Textos".
   */
  texts?: Record<string, Record<string, string>>;
  /**
   * O contato abre numa janela, em qualquer página (como o assistente da v1): o núcleo põe a
   * janela com o formulário do bloco `contato` e entrega o id em `ctx.site.contactDialog`.
   * Cada página ganha o script pequeno de ilha do Astro; o formulário só carrega ao abrir.
   */
  contactDialog?: boolean;
  /**
   * A página de case mostra as telas (a capa e a galeria) num carrossel (ilha `carrossel`,
   * com a imagem ampliada): o núcleo monta a ilha e a entrega ao template em `carousel`.
   */
  caseCarousel?: boolean;
}

export function defineTheme(theme: ThemeDefinition): ThemeDefinition {
  if (!/^[a-z][a-z0-9-]*$/.test(theme.id)) throw new Error(`[rubrica] id de tema inválido: "${theme.id}"`);
  return theme;
}

/**
 * Variações que os componentes PADRÃO do núcleo sabem desenhar, por bloco. Um tema que
 * herda o componente padrão só deve declarar estas (pode reordenar para mudar a padrão);
 * variações novas exigem o componente próprio do tema.
 */
export const CORE_VARIANTS: Partial<Record<string, VariantOption[]>> = {
  cases: [
    { value: "grade", label: "Grade" },
    { value: "lista", label: "Lista" },
  ],
  "linha-do-tempo": [
    { value: "vertical", label: "Vertical" },
    { value: "horizontal", label: "Horizontal (compacta)" },
  ],
};

/**
 * Variações do bloco no tema: as que ele declara; sem declaração, as do componente padrão
 * (`CORE_VARIANTS`) quando o tema herda o componente do núcleo. Assim um bloco novo do
 * núcleo chega a todos os temas já com as suas variações (decisão 30: bloco novo é minor).
 */
export function variantsFor(theme: Pick<ThemeDefinition, "variants" | "blocks">, type: string): VariantOption[] {
  const declared = theme.variants?.[type];
  if (declared) return declared;
  return theme.blocks?.[type] ? [] : (CORE_VARIANTS[type] ?? []);
}

/** Variação válida para o bloco no tema; desconhecida ou ausente cai na primeira. */
export function resolveVariant(theme: Pick<ThemeDefinition, "variants" | "blocks">, type: string, variant: string | undefined): string {
  const options = variantsFor(theme, type);
  if (!options?.length) return "default";
  return options.some((o) => o.value === variant) ? variant! : options[0]!.value;
}

export type { CollectionItems, NavItem, ResolvedImage, ResolvedLink };
