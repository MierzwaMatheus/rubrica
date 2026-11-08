/** API da bateria: `testTheme` roda tudo para um tema e devolve o relatório. */
import { rm } from "node:fs/promises";
import { auditSite } from "./audit.ts";
import { buildDemo, findRepoRoot, hasFixtures, SITE_KINDS, themeName } from "./build.ts";
import { runLighthouse } from "./lighthouse.ts";
import { readSitemap } from "./routes.ts";
import { DEFAULT_LIMITS, type FullReport, type Limits, type SiteKind, type SiteReport } from "./types.ts";

export * from "./types.ts";
export { auditSite } from "./audit.ts";
export { serveStatic } from "./server.ts";
export { runLighthouse } from "./lighthouse.ts";

export interface TestThemeOptions {
  theme: string;
  /** Tipos de site a testar. Padrão: todos. */
  sites?: (SiteKind | string)[];
  root?: string;
  lighthouse?: boolean;
  limits?: Limits;
  lighthouseRuns?: number;
  /** Mantém a pasta do build em vez de apagar. */
  keepDist?: boolean;
  log?: (message: string) => void;
  onSite?: (site: SiteReport) => void;
}

export async function testTheme(options: TestThemeOptions): Promise<FullReport> {
  const root = options.root ?? findRepoRoot();
  const theme = themeName(options.theme);
  const limits = options.limits ?? DEFAULT_LIMITS;
  const log = options.log ?? (() => undefined);
  const sites: SiteReport[] = [];

  for (const kind of options.sites ?? SITE_KINDS) {
    const base: SiteReport = { site: kind, theme, pages: [], lighthouse: [], ok: false };
    if (!hasFixtures(root, kind)) {
      base.skipped = `sem fixtures em apps/demo/fixtures/${kind}; tipo de site pulado`;
      sites.push(base);
      options.onSite?.(base);
      continue;
    }
    log(`Build da demo (${kind}) com ${theme}...`);
    const build = await buildDemo({ root, theme, kind });
    try {
      if (build.error) {
        base.buildError = build.error;
      } else {
        log(`Auditando as páginas (${kind})...`);
        base.pages = await auditSite({ dist: build.dist, limits });
        if (options.lighthouse !== false) {
          const paths = (await readSitemap(build.dist)).map((e) => e.path);
          const lh = await runLighthouse({ dist: build.dist, paths, limits, ...(options.lighthouseRuns && { maxRuns: options.lighthouseRuns }), onProgress: log });
          base.lighthouse = lh.reports;
          if (lh.missing.length) base.lighthouseSkipped = `Lighthouse: sem página de ${lh.missing.join(", ")} neste site`;
        }
        base.ok = base.pages.every((p) => p.ok) && base.lighthouse.every((l) => l.ok);
      }
    } finally {
      if (!options.keepDist) await rm(build.dist, { recursive: true, force: true });
    }
    sites.push(base);
    options.onSite?.(base);
  }

  const tested = sites.filter((s) => !s.skipped);
  return {
    theme,
    limits,
    startedAt: new Date().toISOString(),
    sites,
    ok: tested.length > 0 && tested.every((s) => s.ok),
  };
}
