import type { BlockComponent, ThemeDefinition } from "../theme/contract";
import { CtaBlock, GenericBlock, HeroBlock, TextoBlock } from "./blocks/basic";
import { DefaultCase, DefaultNotFound, DefaultPost, DefaultShell } from "./shell";

export * from "./primitives";
export { DefaultShell, DefaultPost, DefaultCase, DefaultNotFound, LocaleLinks } from "./shell";
export { HeroBlock, TextoBlock, CtaBlock, GenericBlock } from "./blocks/basic";

/** Componentes padrão por tipo de bloco. Tipo sem entrada usa `GenericBlock`. */
export const DEFAULT_BLOCKS: Partial<Record<string, BlockComponent>> = {
  hero: HeroBlock,
  texto: TextoBlock,
  cta: CtaBlock,
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
