/** Lighthouse (mobile) na home, num post e num case, com mediana de até 3 execuções. */
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { serveStatic } from "./server.ts";
import type { LighthouseReport, LighthouseScores, Limits } from "./types.ts";

export interface LighthouseTarget {
  label: string;
  path: string;
}

/** Escolhe home, um post e um case a partir das rotas do sitemap. */
export function pickTargets(paths: string[]): { targets: LighthouseTarget[]; missing: string[] } {
  const find = (re: RegExp) => paths.find((p) => re.test(p));
  const picks: [string, string | undefined][] = [
    ["home", paths.includes("/") ? "/" : undefined],
    ["post", find(/^\/(blog|artigos|posts)\/[^/]+$/)],
    ["case", find(/^\/(portfolio|cases|projetos|trabalhos)\/[^/]+$/)],
  ];
  return {
    targets: picks.flatMap(([label, path]) => (path ? [{ label, path }] : [])),
    missing: picks.filter(([, path]) => !path).map(([label]) => label),
  };
}

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

export function medianScores(runs: LighthouseScores[]): LighthouseScores {
  return {
    performance: median(runs.map((r) => r.performance)),
    accessibility: median(runs.map((r) => r.accessibility)),
    seo: median(runs.map((r) => r.seo)),
  };
}

export function failuresOf(scores: LighthouseScores, limits: Limits["lighthouse"]): string[] {
  const names = { performance: "performance", accessibility: "acessibilidade", seo: "SEO" } as const;
  return (Object.keys(names) as (keyof typeof names)[])
    .filter((k) => scores[k] < limits[k])
    .map((k) => `${names[k]} ${scores[k]} abaixo do mínimo ${limits[k]}`);
}

async function runOnce(url: string, port: number): Promise<LighthouseScores> {
  const result = await lighthouse(url, { port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "seo"] });
  const cats = result?.lhr.categories;
  if (!cats) throw new Error("o Lighthouse não devolveu resultado");
  const score = (id: "performance" | "accessibility" | "seo") => Math.round((cats[id]?.score ?? 0) * 100);
  return { performance: score("performance"), accessibility: score("accessibility"), seo: score("seo") };
}

export interface LighthouseOptions {
  dist: string;
  paths: string[];
  limits: Limits;
  /** Máximo de execuções por página; a segunda e a terceira só rodam se a primeira falhar. */
  maxRuns?: number;
  onProgress?: (message: string) => void;
}

export async function runLighthouse(options: LighthouseOptions): Promise<{ reports: LighthouseReport[]; missing: string[] }> {
  const { targets, missing } = pickTargets(options.paths);
  const server = await serveStatic(options.dist);
  const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"] });
  try {
    const reports: LighthouseReport[] = [];
    for (const target of targets) {
      const runs: LighthouseScores[] = [];
      const maxRuns = options.maxRuns ?? 3;
      for (let i = 0; i < maxRuns; i++) {
        options.onProgress?.(`Lighthouse ${target.label} ${target.path} (execução ${i + 1})`);
        runs.push(await runOnce(server.url + target.path, chrome.port));
        // Passou de primeira: não gasta mais tempo. Reprovou: confirma com a mediana de 3.
        if (i === 0 && failuresOf(runs[0]!, options.limits.lighthouse).length === 0) break;
      }
      const scores = medianScores(runs);
      const failures = failuresOf(scores, options.limits.lighthouse);
      reports.push({ path: target.path, label: target.label, scores, runs, ok: failures.length === 0, failures });
    }
    return { reports, missing };
  } finally {
    await chrome.kill();
    await server.close();
  }
}
