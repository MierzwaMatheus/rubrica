/**
 * Onde ficam os previews do combinador (builds do site de demonstração, um por tipo de site
 * e tema) e quais páginas cada tipo mostra nas abas. Usado pelo site e por
 * scripts/build-previews.ts, para os dois concordarem nos caminhos.
 */

/** Tipos de site do Rubrica: as fixtures de apps/demo/fixtures/<tipo>. */
export type SiteKind = "pessoal" | "empresa";

export const SITE_KINDS: SiteKind[] = ["pessoal", "empresa"];

/** Pasta do preview: o pessoal fica em /previews/<tema>, os outros em /previews/<tipo>/<tema>. */
export function previewBase(kind: SiteKind, theme: string): string {
  return kind === "pessoal" ? `/previews/${theme}` : `/previews/${kind}/${theme}`;
}

/**
 * Páginas das abas do preview, na ordem do menu das fixtures. Os nomes ficam no dicionário
 * (i18n, `pages`).
 */
export const PREVIEW_PAGES: Record<SiteKind, string[]> = {
  pessoal: ["/", "/curriculo", "/portfolio", "/sobre", "/blog"],
  empresa: ["/", "/quem-somos", "/servicos", "/precos", "/cases", "/blog", "/contato"],
};
