/**
 * Carrega o conteúdo e monta o site: uma vez por build; no dev, de novo quando o conteúdo
 * muda (ver `dev-content.ts`). As páginas injetadas (page.astro, 404, sitemap, robots)
 * importam daqui.
 */
// @ts-expect-error módulo virtual da integração
import { theme, source, projectBlocks, projectComponents, fontPlan } from "virtual:rubrica/config";
// @ts-expect-error módulo virtual da integração
import { islands } from "virtual:rubrica/islands";
import { adminBackend } from "virtual:rubrica/admin";
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
import { rssFeeds } from "../seo/rss";
import { resolveAnalytics } from "../seo/analytics";
import type { SiteHeadOptions } from "../seo/site-head";
import { siteCache } from "./site-cache";
import { appRoutes, appShells, type AppShell } from "../plugins/app-routes";
import { localePrefix } from "../i18n";
import { appBackend } from "../islands/app/client";
import type { AppIslandProps } from "../islands/app/ui";

export const activeTheme = theme as ThemeDefinition;
export const activeFontPlan = fontPlan as import("../theme/fonts").FontPlan;

const site = siteCache<BuiltSite>(() =>
  (source as DataSource).load().then((snapshot) =>
    buildSite({
      snapshot,
      theme: activeTheme,
      blocks: [...CORE_BLOCKS, ...((projectBlocks as BlockDefinition[]) ?? [])],
      plugins: CORE_PLUGINS,
    }),
  ),
);

// Dev: a integração avisa quando o conteúdo mudou (`CONTENT_CHANGED_EVENT` de dev-content.ts,
// o mesmo evento com que o Astro limpa o cache de `getStaticPaths`). No build não há `hot`.
(import.meta as unknown as { hot?: { on(event: string, cb: () => void): void } }).hot?.on("astro:content-changed", () => site.invalidate());

export function loadSite(): Promise<BuiltSite> {
  return site.get();
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

/**
 * O que o `<head>` de todas as páginas precisa além da rota: o tema (cor da barra), os
 * feeds RSS e o analytics (plugin ligado e configurado nas configurações ou no `PUBLIC_*`).
 */
export function headOptions(site: BuiltSite): SiteHeadOptions {
  const base = site.settings.url.replace(/\/+$/, "");
  const analytics = site.plugins.has("analytics") ? resolveAnalytics(site.settings, process.env) : undefined;
  return {
    theme: activeTheme,
    feeds: rssFeeds(site).map((f) => ({ locale: f.locale, href: `${base}${f.path}`, title: f.title })),
    ...(analytics && { analytics }),
  };
}

/**
 * Páginas das rotas do app (proposta, checkout…) a gerar: as dos plugins ligados, em cada
 * idioma, com ilha registrada. Ver `plugins/app-routes.ts`.
 */
export function siteAppShells(site: BuiltSite): AppShell[] {
  const routes = appRoutes(CORE_PLUGINS, site.plugins).filter((r) => r.island in (islands as Record<string, unknown>));
  return appShells(routes, site.settings.locales.locales, (l) => localePrefix(l, site.settings.locales));
}

/** Props da ilha de uma página do app: textos, links entre as páginas do idioma e o backend. */
export function appIslandProps(shell: AppShell, shells: AppShell[], site: BuiltSite, ctx: RenderContext): Omit<AppIslandProps, "api"> {
  const meta = ISLAND_META[shell.island];
  return {
    locale: shell.locale,
    defaultLocale: site.settings.locales.default,
    pattern: shell.pattern,
    routes: Object.fromEntries(shells.filter((s) => s.locale === shell.locale).map((s) => [s.island, s.pattern])),
    homeHref: ctx.href("/"),
    texts: Object.fromEntries(uiKeysWithPrefix(meta?.textPrefixes ?? []).map((k) => [k, ctx.t(k)])),
    backend: appBackend(adminBackend, import.meta.env.PUBLIC_RUBRICA_API),
  };
}
