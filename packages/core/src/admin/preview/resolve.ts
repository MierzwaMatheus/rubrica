/**
 * Prévia ao vivo (decisão 17): o rascunho da página resolvido exatamente como o site
 * resolve no build (`render/site`), sobre o snapshot publicado. O rascunho não vai ao
 * site: só existe na memória do painel e no iframe da prévia.
 */
import { blockAllowedIn, type BlockDefinition } from "../../blocks/define";
import type { PageRecord, RawProject, SiteSettings } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import { localizedPath, pick, type Locale } from "../../i18n";
import type { PluginDefinition } from "../../plugins/contract";
import type { ProjectItem } from "../../render/collections";
import { buildSite, homeShowsAvailability, type ResolvedBlock, type ResolvedPage } from "../../render/site";
import { resolveBrand, type ResolvedBrand } from "../../theme/brand";
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

/** Página-ferramenta que carrega os blocos do case pelo resolvedor de páginas. */
const CASE_BODY_PAGE = "__rubrica-case-preview";

/**
 * Prévia do case (o rascunho do projeto sobre o snapshot publicado): monta a rota de case
 * com o motor do site e devolve o corpo em blocos e a marca já resolvidos.
 *
 * TODO(frente A): hoje `buildSite` não resolve `project.blocks`; os blocos passam por uma
 * página-ferramenta (`CASE_BODY_PAGE`) só para reaproveitar o resolvedor de blocos de página.
 * Quando a rota de case trouxer `blocks: ResolvedBlock[]` e `brand` (render/blocks.ts,
 * `resolveBlocks`), troque o trecho marcado abaixo por `route.blocks` e `route.brand`.
 */
export function resolveCasePreview(input: CasePreviewInput): CasePreviewResult {
  const site = input.settings ?? input.snapshot.site;
  const locale = site.locales.locales.includes(input.locale) ? input.locale : site.locales.default;
  // Com `blocks`, o texto e as seções do formato antigo não entram (o editor já os converteu).
  const { content: _content, sections: _sections, ...rest } = input.project;
  void _content;
  void _sections;
  const raw: RawProject = { ...rest, blocks: input.project.blocks ?? [] };
  const defs = new Map(input.blocks.map((b) => [b.type, b]));
  const body = (raw.blocks ?? []).filter((b) => {
    const def = defs.get(b.type);
    return !def || blockAllowedIn(def, "case");
  });
  const titles = Object.fromEntries(site.locales.locales.map((l) => [l, "Prévia do case"]));
  const bodyPage: PageRecord = { id: CASE_BODY_PAGE, path: `/${CASE_BODY_PAGE}`, title: titles, blocks: body, published: true, updatedAt: 0 };
  const projects = input.snapshot.collections.projects;
  const at = projects.findIndex((p) => p.id === raw.id);
  const withDraft = at < 0 ? [...projects, raw] : projects.map((p, i) => (i === at ? raw : p));
  try {
    const built = buildSite({
      snapshot: { ...input.snapshot, site, pages: [bodyPage], collections: { ...input.snapshot.collections, projects: withDraft } },
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
    // TODO(frente A): trocar por `route.blocks` e `route.brand`.
    const bodyRoute = built.routes.find((r) => r.type === "page" && r.page.id === CASE_BODY_PAGE && r.locale === locale);
    const blocks = bodyRoute?.type === "page" ? bodyRoute.page.blocks.map((b) => ({ ...b, headingLevel: 2 as const })) : [];
    const brand = resolveBrand(raw.brand);
    const ctx = built.context(locale, route.url, route.alternates);
    ctx.site.availability = homeShowsAvailability(input.snapshot.pages);
    return { ok: true, project: route.project, related: route.related, ...(route.next ? { next: route.next } : {}), blocks, ...(brand ? { brand } : {}), ctx, url: route.url, collections: built.collections(locale) };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message.replace("[rubrica] ", "") };
  }
}
