/** Relatório legível no terminal e JSON. */
import type { FullReport, LighthouseReport, PageReport, SiteReport } from "./types.ts";

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
export const red = paint(31);
export const green = paint(32);
export const yellow = paint(33);
export const dim = paint(2);
export const bold = paint(1);

export function formatPage(page: PageReport, verbose = false): string[] {
  const kb = (page.js.gzipBytes / 1024).toFixed(1);
  const lines = [`${page.ok ? green("ok  ") : red("FALHA")} ${page.path} ${dim(`(${page.js.islands} ilha(s), ${kb} KB JS gzip)`)}`];
  for (const check of page.checks) {
    if (check.ok && !verbose) continue;
    lines.push(`   ${check.ok ? green("+") : red("x")} ${check.id}: ${check.message}`);
    if (!check.ok) for (const d of check.details ?? []) lines.push(`       ${dim("-")} ${d}`);
  }
  return lines;
}

export function formatLighthouse(r: LighthouseReport): string {
  const s = r.scores;
  const text = `${r.label} ${r.path}: performance ${s.performance}, acessibilidade ${s.accessibility}, SEO ${s.seo}${r.runs.length > 1 ? ` (mediana de ${r.runs.length})` : ""}`;
  return r.ok ? `${green("ok  ")} Lighthouse ${text}` : `${red("FALHA")} Lighthouse ${text}\n       ${r.failures.map((f) => `${dim("-")} ${f}`).join("\n       ")}`;
}

export function formatSite(site: SiteReport, verbose = false): string {
  const out = [bold(`\n== ${site.theme} / site ${site.site} ==`)];
  if (site.skipped) {
    out.push(`${yellow("PULADO")} ${site.skipped}`);
    return out.join("\n");
  }
  if (site.buildError) {
    out.push(`${red("FALHA")} o build da demo quebrou:`, ...site.buildError.split("\n").map((l) => `   ${dim(l)}`));
    return out.join("\n");
  }
  for (const page of site.pages) out.push(...formatPage(page, verbose));
  for (const r of site.lighthouse) out.push(formatLighthouse(r));
  if (site.lighthouseSkipped) out.push(`${yellow("AVISO")} ${site.lighthouseSkipped}`);
  const bad = site.pages.filter((p) => !p.ok).length + site.lighthouse.filter((l) => !l.ok).length;
  out.push(bad === 0 && site.ok ? green(`Site ${site.site}: tudo certo (${site.pages.length} páginas).`) : red(`Site ${site.site}: ${bad} item(ns) com falha.`));
  return out.join("\n");
}

export function summary(report: FullReport): string {
  const ran = report.sites.filter((s) => !s.skipped);
  const skipped = report.sites.filter((s) => s.skipped);
  const line = report.ok ? green(`\nTema ${report.theme} PASSOU na bateria.`) : red(`\nTema ${report.theme} REPROVADO na bateria.`);
  return `${line}${skipped.length ? yellow(` (${skipped.length} tipo(s) de site pulado(s): ${skipped.map((s) => s.site).join(", ")})`) : ""}${ran.length === 0 ? red(" Nenhum site foi testado.") : ""}`;
}
