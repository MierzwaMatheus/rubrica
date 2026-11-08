/**
 * Prévia ao vivo (decisão 17): o rascunho da página resolvido exatamente como o site
 * resolve no build (`render/site`), sobre o snapshot publicado. O rascunho não vai ao
 * site: só existe na memória do painel e no iframe da prévia.
 */
import type { BlockDefinition } from "../../blocks/define";
import type { PageRecord, SiteSettings } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import { localizedPath, type Locale } from "../../i18n";
import type { PluginDefinition } from "../../plugins/contract";
import { buildSite, type ResolvedPage } from "../../render/site";
import type { RenderContext, ThemeDefinition } from "../../theme/contract";

export interface PreviewInput {
  /** Snapshot publicado (`site.snapshot`): configurações, coleções e textos. */
  snapshot: SiteSnapshot;
  /** Rascunho da página, com os blocos como estão no editor. */
  page: PageRecord;
  locale: Locale;
  theme: ThemeDefinition;
  blocks: readonly BlockDefinition[];
  plugins: PluginDefinition[];
  /** Configurações ainda não salvas (tela de aparência). */
  settings?: SiteSettings;
}

export type PreviewResult =
  | { ok: true; page: ResolvedPage; ctx: RenderContext; url: string }
  | { ok: false; reason: "untranslated" | "error"; message: string };

export function resolvePreview(input: PreviewInput): PreviewResult {
  const site = input.settings ?? input.snapshot.site;
  // A página entra como publicada e é a única: as outras não mudam o que esta mostra.
  const page: PageRecord = { ...input.page, published: true };
  const locale = site.locales.locales.includes(input.locale) ? input.locale : site.locales.default;
  try {
    const built = buildSite({
      snapshot: { ...input.snapshot, site, pages: [page] },
      theme: input.theme,
      blocks: input.blocks,
      plugins: input.plugins,
    });
    const route = built.routes.find((r) => r.type === "page" && r.page.id === page.id && r.locale === locale);
    if (!route || route.type !== "page") {
      return {
        ok: false,
        reason: "untranslated",
        message: `A página não existe em ${locale}: falta o título nesse idioma (decisão 28).`,
      };
    }
    return { ok: true, page: route.page, ctx: built.context(locale, route.url, route.alternates), url: localizedPath(page.path, locale, site.locales) };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message.replace("[rubrica] ", "") };
  }
}
