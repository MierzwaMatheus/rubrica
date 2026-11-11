import type { BlockComponent, ThemeDefinition } from "../theme/contract";
import { CtaBlock, GenericBlock, HeroBlock, TextoBlock } from "./blocks/basic";
import { CasesBlock, DepoimentosBlock, FaqBlock, PostsRecentesBlock, PrecosBlock } from "./blocks/collections";
import { ContatoBlock, LocalizacaoBlock } from "./blocks/contact";
import { EquipeBlock, GaleriaBlock, ListaItensBlock, LogosClientesBlock, NumerosBlock, ServicosBlock } from "./blocks/lists";
import { CurriculoBlock } from "./blocks/resume";
import { IncorporacaoBlock, VideoBlock } from "./blocks/media";
import { LinhaDoTempoBlock } from "./blocks/timeline";
import { ComparativoPlanosBlock } from "./blocks/compare";
import { DefaultCase, DefaultNotFound, DefaultPost, DefaultShell } from "./shell";

export * from "./primitives";
export { CaseMetrics, LucideIcon, lucideIcon } from "./case";
export { DefaultShell, DefaultPost, DefaultCase, DefaultNotFound, LocaleLinks, localeCode } from "./shell";
export { SiteAnnouncement, WhatsAppFloat, siteWideAttributes } from "./sitewide";
export { HeroBlock, TextoBlock, CtaBlock, GenericBlock } from "./blocks/basic";
export { CasesBlock, DepoimentosBlock, FaqBlock, PostsRecentesBlock, PrecosBlock } from "./blocks/collections";
export { ContatoBlock, LocalizacaoBlock } from "./blocks/contact";
export { EquipeBlock, GaleriaBlock, ListaItensBlock, LogosClientesBlock, NumerosBlock, ServicosBlock } from "./blocks/lists";
export { CurriculoBlock, groupResumeSkills, ResumeDescription, ResumeHeading, ResumePeriod } from "./blocks/resume";
export { IncorporacaoBlock, VideoBlock, VideoFrame, videoName, videoPoster, videoRatio } from "./blocks/media";
export type { VideoFrameProps } from "./blocks/media";
export { LinhaDoTempoBlock } from "./blocks/timeline";
export { ComparativoPlanosBlock } from "./blocks/compare";
/** Utilitários puros dos blocos padrão, para os temas não copiarem. */
export { digits, formatDays, isHtmlText, resolveFreeHref, safeId, shorten, tagFilterCss } from "./blocks/util";
export type { TagFilterCssOptions } from "./blocks/util";

/** Componentes padrão por tipo de bloco. Tipo sem entrada usa `GenericBlock`. */
export const DEFAULT_BLOCKS: Partial<Record<string, BlockComponent>> = {
  hero: HeroBlock,
  texto: TextoBlock,
  cta: CtaBlock,
  numeros: NumerosBlock,
  "lista-itens": ListaItensBlock,
  cases: CasesBlock,
  servicos: ServicosBlock,
  depoimentos: DepoimentosBlock,
  faq: FaqBlock,
  "posts-recentes": PostsRecentesBlock,
  contato: ContatoBlock,
  galeria: GaleriaBlock,
  curriculo: CurriculoBlock,
  precos: PrecosBlock,
  equipe: EquipeBlock,
  localizacao: LocalizacaoBlock,
  "logos-clientes": LogosClientesBlock,
  video: VideoBlock,
  incorporacao: IncorporacaoBlock,
  "linha-do-tempo": LinhaDoTempoBlock,
  "comparativo-planos": ComparativoPlanosBlock,
};

/** Componente do bloco no tema, senão o padrão do núcleo, senão o genérico. */
export function blockComponent(theme: ThemeDefinition, type: string): BlockComponent {
  return theme.blocks?.[type] ?? DEFAULT_BLOCKS[type] ?? (GenericBlock as BlockComponent);
}

export function templates(theme: ThemeDefinition) {
  return {
    Shell: theme.Shell ?? DefaultShell,
    Post: theme.templates?.post ?? DefaultPost,
    Case: theme.templates?.case ?? DefaultCase,
    NotFound: theme.templates?.notFound ?? DefaultNotFound,
  };
}
