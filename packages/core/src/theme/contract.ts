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

/** Versão do contrato de blocos que este núcleo implementa (decisão 30). */
export const CONTRACT_VERSION = "1.0.0";

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
  person?: { name: string; jobTitle?: string; email?: string; photo?: ResolvedImage };
  plugins: Record<string, boolean>;
  colorMode: "dark" | "light" | "system";
  colorToggle: boolean;
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
  ctx: RenderContext;
  /** Ilha do bloco interativo (ex.: o assistente de contato), já montada pelo núcleo. */
  island?: ReactNode;
}

export type BlockComponent<Fields = any, Item = any> = ComponentType<BlockProps<Fields, Item>>;

export interface ShellProps {
  ctx: RenderContext;
  /** Tipo da página, para a casca variar (ex.: sem hero no post). */
  pageType: "page" | "post" | "case" | "notFound";
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
  ctx: RenderContext;
}

export interface CaseTemplateProps {
  project: ProjectItem;
  related: ProjectItem[];
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
  templates?: {
    post?: ComponentType<PostTemplateProps>;
    case?: ComponentType<CaseTemplateProps>;
    notFound?: ComponentType<NotFoundProps>;
  };
  /** Variações por tipo de bloco; a primeira é a padrão (decisão 23). */
  variants?: Partial<Record<string, VariantOption[]>>;
  /** Receitas por tipo de site (decisão 24). Sem receita, usa a do núcleo. */
  recipes?: Partial<Record<SiteKind, Recipe>>;
  /** Fontes que o tema usa por padrão (Google Fonts), baixadas no build. */
  fonts?: { sans?: string; mono?: string; display?: string };
}

export function defineTheme(theme: ThemeDefinition): ThemeDefinition {
  if (!/^[a-z][a-z0-9-]*$/.test(theme.id)) throw new Error(`[rubrica] id de tema inválido: "${theme.id}"`);
  return theme;
}

/** Variação válida para o bloco no tema; desconhecida ou ausente cai na primeira. */
export function resolveVariant(theme: ThemeDefinition, type: string, variant: string | undefined): string {
  const options = theme.variants?.[type];
  if (!options?.length) return "default";
  return options.some((o) => o.value === variant) ? variant! : options[0]!.value;
}

export type { CollectionItems, NavItem, ResolvedImage, ResolvedLink };
