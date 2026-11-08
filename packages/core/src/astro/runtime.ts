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
import { ISLAND_META, islandNameFor } from "../islands";
import { uiKeysWithPrefix } from "../i18n/ui-texts";
import type { RenderContext } from "../theme/contract";

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
  return islandNameFor(type) in (islands as Record<string, unknown>);
}

/**
 * Props serializáveis da ilha de um bloco: o básico (bloco, campos, idioma, página, site,
 * política de privacidade), os textos de interface que ela declara e, se pedir, os itens.
 */
export function islandProps(block: { id: string; type: string; fields: Record<string, unknown>; items: unknown[] }, ctx: RenderContext) {
  const name = islandNameFor(block.type);
  const meta = ISLAND_META[name];
  const texts = Object.fromEntries(uiKeysWithPrefix(meta?.textPrefixes ?? []).map((k) => [k, ctx.t(k)]));
  const { person, organization, social } = ctx.site;
  return {
    blockId: block.id,
    page: ctx.path,
    locale: ctx.locale,
    fields: block.fields,
    texts,
    privacyHref: ctx.href("/privacidade"),
    site: {
      name: ctx.site.name,
      person: person ?? null,
      organization: organization ? { email: organization.email, phone: organization.phone } : null,
      social,
    },
    ...(meta?.items ? { items: block.items } : {}),
  };
}
