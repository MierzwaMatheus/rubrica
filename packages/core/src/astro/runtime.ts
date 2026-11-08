/**
 * Carrega o conteúdo uma vez por build e monta o site. As páginas injetadas
 * (page.astro, 404, sitemap, robots) importam daqui.
 */
// @ts-expect-error módulo virtual da integração
import { theme, source, projectBlocks, projectComponents } from "virtual:rubrica/config";
// @ts-expect-error módulo virtual da integração
import { islands } from "virtual:rubrica/islands";
import { CORE_BLOCKS } from "../blocks/catalog";
import type { BlockDefinition } from "../blocks/define";
import type { DataSource } from "../data/source";
import { CORE_PLUGINS } from "../plugins/registry";
import { buildSite, type BuiltSite } from "../render/site";
import type { BlockComponent, ThemeDefinition } from "../theme/contract";
import { blockComponent as themeBlockComponent } from "../components";

let built: Promise<BuiltSite> | undefined;

export const activeTheme = theme as ThemeDefinition;

export function loadSite(): Promise<BuiltSite> {
  built ??= (source as DataSource).load().then((snapshot) =>
    buildSite({
      snapshot,
      theme: activeTheme,
      blocks: [...CORE_BLOCKS, ...((projectBlocks as BlockDefinition[]) ?? [])],
      plugins: CORE_PLUGINS,
    }),
  );
  return built;
}

/** Componente do projeto (ejetado/próprio) > tema > padrão do núcleo > genérico. */
export function componentFor(type: string): BlockComponent {
  return (projectComponents as Record<string, BlockComponent>)[type] ?? themeBlockComponent(activeTheme, type);
}

/** Há componente de ilha para o bloco? Sem ele, o bloco sai estático (sem JavaScript). */
export function hasIsland(type: string): boolean {
  return type in (islands as Record<string, unknown>);
}
