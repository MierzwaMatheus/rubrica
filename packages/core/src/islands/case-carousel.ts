/**
 * Props da ilha do carrossel das telas do case (`caseCarousel` no tema), fora da ilha: a
 * prévia do painel monta o slot `carousel` com elas, com a mesma regra do `caseCarouselProps`
 * do site (`astro/runtime.ts`, que pode passar a usar esta função). Arquivo
 * à parte para a prévia não importar todas as ilhas (`islands/index.ts`) e para a tabela de
 * textos de interface não ir junto com as ilhas para o navegador.
 */
import { uiKeysWithPrefix } from "../i18n/ui-texts";
import type { ProjectItem } from "../render/collections";
import type { RenderContext, ThemeDefinition } from "../theme/contract";
import { CAROUSEL_TEXT_PREFIXES, type CarouselIslandProps } from "./carrossel";

/** Tema com carrossel e projeto com imagens (capa e galeria): as props da ilha; senão, nada. */
export function caseCarouselFor(
  theme: Pick<ThemeDefinition, "caseCarousel">,
  project: Pick<ProjectItem, "cover" | "gallery" | "title">,
  ctx: Pick<RenderContext, "t">,
): CarouselIslandProps | undefined {
  if (!theme.caseCarousel) return undefined;
  const images = [...(project.cover ? [project.cover] : []), ...project.gallery];
  if (images.length === 0) return undefined;
  const texts = Object.fromEntries(uiKeysWithPrefix(CAROUSEL_TEXT_PREFIXES).map((k) => [k, ctx.t(k)]));
  return { images, title: project.title, texts };
}
