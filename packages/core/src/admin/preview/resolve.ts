/**
 * Prévia ao vivo (decisão 17): o rascunho da página resolvido exatamente como o site
 * resolve no build (`render/site`), sobre o snapshot publicado. O rascunho não vai ao
 * site: só existe na memória do painel e no iframe da prévia.
 */
import type { BlockDefinition } from "../../blocks/define";
import type { PageRecord, RawProject, SiteSettings } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import { localizedPath, pick, type Locale } from "../../i18n";
import type { PluginDefinition } from "../../plugins/contract";
import type { ProjectItem } from "../../render/collections";
import { buildSite, homeShowsAvailability, type ResolvedBlock, type ResolvedPage } from "../../render/site";
import type { ResolvedBrand } from "../../theme/brand";
import type { RenderContext, ShellCollections, ThemeDefinition } from "../../theme/contract";

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
  | { ok: true; page: ResolvedPage; ctx: RenderContext; url: string; collections: ShellCollections }
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
    const ctx = built.context(locale, route.url, route.alternates);
    // A disponibilidade vem da home publicada (ou do rascunho, se ele é a home).
    ctx.site.availability = homeShowsAvailability(page.path === "/" ? [page] : input.snapshot.pages);
    return {
      ok: true,
      page: route.page,
      ctx,
      url: localizedPath(page.path, locale, site.locales),
      collections: built.collections(locale),
    };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message.replace("[rubrica] ", "") };
  }
}

// ── Prévia do case ──────────────────────────────────────────────────────────

export interface CasePreviewInput extends Omit<PreviewInput, "page"> {
  /** Rascunho do projeto, como o formulário o guarda (com `blocks` e `brand`). */
  project: RawProject;
}

export type CasePreviewResult =
  | {
      ok: true;
      project: ProjectItem;
      related: ProjectItem[];
      next?: ProjectItem;
      /** Corpo do case, no formato dos blocos de página (já no contexto `case`: h2). */
      blocks: ResolvedBlock[];
      brand?: ResolvedBrand;
      ctx: RenderContext;
      url: string;
      collections: ShellCollections;
    }
  | { ok: false; reason: "untranslated" | "disabled" | "error"; message: string };

/**
 * Prévia do case (o rascunho do projeto sobre o snapshot publicado): monta a rota de case
 * com o motor do site (`buildSite`) e devolve o corpo em blocos (contexto `case`) e a marca
 * já resolvidos, como o site os desenha.
 */
export function resolveCasePreview(input: CasePreviewInput): CasePreviewResult {
  const site = input.settings ?? input.snapshot.site;
  const locale = site.locales.locales.includes(input.locale) ? input.locale : site.locales.default;
  // Com `blocks`, o texto e as seções do formato antigo não entram (o editor já os converteu).
  const { content: _content, sections: _sections, ...rest } = input.project;
  void _content;
  void _sections;
  const raw: RawProject = { ...rest, blocks: input.project.blocks ?? [] };
  const projects = input.snapshot.collections.projects;
  const at = projects.findIndex((p) => p.id === raw.id);
  const withDraft = at < 0 ? [...projects, raw] : projects.map((p, i) => (i === at ? raw : p));
  try {
    const built = buildSite({
      snapshot: { ...input.snapshot, site, collections: { ...input.snapshot.collections, projects: withDraft } },
      theme: input.theme,
      blocks: input.blocks,
      plugins: input.plugins,
    });
    const route = built.routes.find((r) => r.type === "case" && r.project.id === raw.id && r.locale === locale);
    if (!route || route.type !== "case") {
      const untitled = !pick(raw.title, locale);
      return {
        ok: false,
        reason: untitled ? "untranslated" : "disabled",
        message: untitled ? `O case não existe em ${locale}: falta o título nesse idioma (decisão 28).` : "O plugin de portfólio está desligado: o site não tem página de case.",
      };
    }
    const ctx = built.context(locale, route.url, route.alternates);
    ctx.site.availability = homeShowsAvailability(input.snapshot.pages);
    return { ok: true, project: route.project, related: route.related, ...(route.next ? { next: route.next } : {}), blocks: route.blocks, ...(route.brand ? { brand: route.brand } : {}), ctx, url: route.url, collections: built.collections(locale) };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message.replace("[rubrica] ", "") };
  }
}
