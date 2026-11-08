/**
 * Auditoria de um `dist` estático: abre cada rota do sitemap (mais /404) no Chromium
 * e aplica as verificações da decisão 31 do RFC (menos o Lighthouse, que fica em lighthouse.ts).
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { chromium, type Browser, type Page } from "playwright";
import {
  checkCanonical,
  checkDescription,
  checkH1,
  checkHreflang,
  checkJs,
  checkLang,
  checkTitle,
  type HeadFacts,
  type ScriptFact,
} from "./checks.ts";
import { expectedLang, localeByPrefix, readSitemap, type SitemapEntry } from "./routes.ts";
import { serveStatic } from "./server.ts";
import { DEFAULT_LIMITS, type CheckResult, type Limits, type PageReport } from "./types.ts";

/** Caminho que não existe no `dist`: o servidor responde com 404.html e status 404. */
export const NOT_FOUND_PROBE = "/__rubrica-nao-existe";
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
const MOBILE = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 800 };

export interface AuditOptions {
  /** Pasta com o site já gerado (sitemap.xml na raiz). */
  dist: string;
  limits?: Limits;
  /** Chamado a cada página concluída (para progresso no terminal). */
  onPage?: (page: PageReport) => void;
  /** Caminhos a auditar no lugar do sitemap. */
  only?: string[];
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

const axeSource = () => readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: unknown[]; failureSummary?: string }[];
}

async function axeViolations(page: Page): Promise<AxeViolation[]> {
  return (await page.evaluate(async (tags) => {
    // @ts-expect-error axe é injetado na página
    const result = await window.axe.run(document, { runOnly: { type: "tag", values: tags } });
    return result.violations.map((v: AxeViolation) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({ target: n.target })),
    }));
  }, AXE_TAGS)) as AxeViolation[];
}

/** Folha que desliga transições e animações durante a medição do axe. */
export const NO_MOTION_CSS = "*,*::before,*::after{transition:none!important;animation:none!important}";

/**
 * axe no modo de cor atual e, se a página tem o botão de alternar, também no outro
 * (contraste do claro e do escuro são tokens diferentes). Transições e animações ficam
 * desligadas durante a medição: com `transition: color`, o axe mediria a cor do meio do
 * caminho logo depois da troca de modo.
 */
async function runAxe(page: Page, source: string): Promise<CheckResult> {
  await page.addScriptTag({ content: source });
  await page.evaluate((css) => {
    const style = document.createElement("style");
    style.id = "rb-tester-no-motion";
    style.textContent = css;
    document.head.appendChild(style);
  }, NO_MOTION_CSS);
  try {
    return await measureAxe(page);
  } finally {
    await page.evaluate(() => document.getElementById("rb-tester-no-motion")?.remove());
  }
}

async function measureAxe(page: Page): Promise<CheckResult> {
  const hasToggle = (await page.locator("[data-rb-color-toggle]").count()) > 0;
  const original = await page.evaluate(() => document.documentElement.dataset.colorMode ?? "");
  const modes = hasToggle ? ["dark", "light"] : [original || "padrão"];
  const details: string[] = [];
  let total = 0;
  for (const mode of modes) {
    if (hasToggle) await page.evaluate((m) => (document.documentElement.dataset.colorMode = m), mode);
    const violations = await axeViolations(page);
    total += violations.length;
    for (const v of violations) {
      for (const n of v.nodes.slice(0, 4)) {
        const target = n.target.map((t) => (Array.isArray(t) ? t.join(" ") : String(t))).join(", ");
        details.push(`${hasToggle ? `(${mode === "dark" ? "escuro" : "claro"}) ` : ""}[${v.id}${v.impact ? `, ${v.impact}` : ""}] ${v.help}: ${target}`);
      }
    }
  }
  if (hasToggle) await page.evaluate((m) => m ? (document.documentElement.dataset.colorMode = m) : delete document.documentElement.dataset.colorMode, original);
  const scope = hasToggle ? ", claro e escuro" : "";
  return total === 0
    ? { id: "axe", ok: true, message: `zero violações do axe (wcag2a, wcag2aa, wcag21aa${scope})` }
    : { id: "axe", ok: false, message: `${total} violação(ões) do axe`, details };
}

async function collectFacts(page: Page): Promise<{ head: HeadFacts; scripts: ScriptFact[]; islands: number }> {
  return page.evaluate(() => {
    const meta = (name: string) => document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null;
    const toPath = (href: string) => {
      try {
        const { pathname } = new URL(href, location.href);
        return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
      } catch {
        return href;
      }
    };
    return {
      head: {
        h1Count: document.querySelectorAll("h1").length,
        title: document.title,
        description: meta("description"),
        canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null,
        robots: meta("robots"),
        htmlLang: document.documentElement.getAttribute("lang"),
        alternates: [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map((l) => ({
          hreflang: l.getAttribute("hreflang")!,
          path: toPath(l.getAttribute("href") ?? ""),
        })),
      },
      scripts: [...document.querySelectorAll("script")].map((s) => ({ src: s.getAttribute("src"), type: s.getAttribute("type") })),
      islands: document.querySelectorAll("astro-island").length,
    };
  });
}

/** Rola até cada ilha (client:visible) e espera todas perderem o atributo `ssr`. */
async function hydrate(page: Page, islands: number): Promise<CheckResult> {
  if (islands === 0) return { id: "hydration", ok: true, message: "sem ilhas" };
  // <astro-island> tem display: contents (sem caixa): rola até o conteúdo dela (ou o pai),
  // uma ilha por vez, dando tempo ao IntersectionObserver do client:visible.
  const count = await page.locator("astro-island").count();
  for (let i = 0; i < count; i++) {
    await page.evaluate((index) => {
      const island = document.querySelectorAll("astro-island")[index];
      const target = (island?.firstElementChild ?? island?.parentElement) as HTMLElement | null | undefined;
      target?.scrollIntoView({ block: "center" });
    }, i);
    await page.waitForTimeout(150);
  }
  try {
    await page.waitForFunction(() => [...document.querySelectorAll("astro-island")].every((i) => !i.hasAttribute("ssr")), undefined, { timeout: 10_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    return { id: "hydration", ok: true, message: `${islands} ilha(s) hidratada(s)` };
  } catch {
    const pending = await page.evaluate(() =>
      [...document.querySelectorAll("astro-island[ssr]")].map((i) => i.getAttribute("component-export") ?? i.getAttribute("component-url") ?? "ilha"),
    );
    return { id: "hydration", ok: false, message: "ilha(s) não hidratou em 10 s", details: pending };
  }
}

async function auditOne(browser: Browser, base: string, path: string, is404: boolean, limits: Limits, axe: string) {
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const badRequests: string[] = [];
  const scriptFiles = new Map<string, number>();
  const pending: Promise<void>[] = [];
  // Na 404 de propósito, o Chromium registra o erro do próprio documento: não conta.
  page.on("console", (m) => m.type() === "error" && !(is404 && m.location().url === base + path) && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`exceção: ${e.message}`));
  page.on("requestfailed", (r) => badRequests.push(`${r.url()} (${r.failure()?.errorText ?? "falhou"})`));
  page.on("response", (res) => {
    const isDoc = res.request().resourceType() === "document" && res.url() === base + path;
    if (res.status() >= 400 && !(is404 && isDoc)) badRequests.push(`${res.status()} ${res.url()}`);
    const type = res.headers()["content-type"] ?? "";
    if (res.request().resourceType() === "script" || /javascript/.test(type)) {
      pending.push(
        res
          .body()
          .then((body) => void scriptFiles.set(res.url(), gzipSync(body).length))
          .catch(() => void scriptFiles.set(res.url(), 0)),
      );
    }
  });

  const response = await page.goto(base + path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
  const { head, scripts, islands } = await collectFacts(page);
  const hydration = await hydrate(page, islands);
  const axeResult = await runAxe(page, axe);
  await Promise.all(pending);
  await context.close();

  const mobile = await browser.newContext({ viewport: MOBILE });
  const mpage = await mobile.newPage();
  await mpage.goto(base + path, { waitUntil: "load" });
  const overflow = await mpage.evaluate((width) => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= width) return [];
    return [...document.body.querySelectorAll("*")]
      .filter((el) => el.getBoundingClientRect().right > width + 1)
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}`)
      .concat([`scrollWidth ${doc.scrollWidth}px > ${width}px`]);
  }, MOBILE.width);
  await mobile.close();

  const requested = [...scriptFiles].map(([url, gzipBytes]) => ({ url: url.replace(base, ""), gzipBytes }));
  const checks: CheckResult[] = [];
  const status = response?.status() ?? 0;
  const wantStatus = is404 ? 404 : 200;
  checks.push(status === wantStatus ? { id: "status", ok: true, message: `HTTP ${status}` } : { id: "status", ok: false, message: `HTTP ${status}, esperado ${wantStatus}` });
  checks.push(axeResult, checkH1(head), checkTitle(head), checkDescription(head), checkCanonical(head, path, is404));
  checks.push({ id: "overflow", ok: overflow.length === 0, message: overflow.length ? `rolagem horizontal em ${MOBILE.width}px` : `sem rolagem horizontal em ${MOBILE.width}px`, ...(overflow.length && { details: overflow }) });
  checks.push(
    consoleErrors.length ? { id: "console", ok: false, message: `${consoleErrors.length} erro(s) no console`, details: consoleErrors } : { id: "console", ok: true, message: "console limpo" },
    badRequests.length ? { id: "network", ok: false, message: `${badRequests.length} requisição(ões) com erro`, details: [...new Set(badRequests)] } : { id: "network", ok: true, message: "nenhuma requisição 4xx/5xx" },
    checkJs({ islands, scripts, requested, limitKb: limits.jsKb }),
    hydration,
  );
  return {
    head,
    checks,
    js: { gzipBytes: requested.reduce((n, f) => n + f.gzipBytes, 0), islands, files: requested },
  };
}

export async function auditSite(options: AuditOptions): Promise<PageReport[]> {
  const limits = options.limits ?? DEFAULT_LIMITS;
  const entries: SitemapEntry[] = await readSitemap(options.dist);
  const prefixes = localeByPrefix(entries);
  const paths = options.only ?? [...entries.map((e) => e.path), "/404"];
  const server = await serveStatic(options.dist);
  const browser = await launchBrowser();
  const axe = await axeSource();
  try {
    const reports: PageReport[] = [];
    const facts = new Map<string, HeadFacts>();
    for (const path of paths) {
      const is404 = path === "/404";
      const r = await auditOne(browser, server.url, is404 ? NOT_FOUND_PROBE : path, is404, limits, axe);
      facts.set(path, r.head);
      // lang é checado aqui, quando o idioma esperado do caminho já é conhecido.
      r.checks.push(checkLang(r.head, expectedLang(is404 ? "/" : path, prefixes)));
      reports.push({ path, checks: r.checks, js: r.js, ok: false });
    }
    // hreflang precisa de todas as páginas para conferir a reciprocidade.
    const alternates = new Map<string, HeadFacts["alternates"]>(entries.map((e) => [e.path, e.alternates]));
    for (const [p, f] of facts) alternates.set(p, f.alternates);
    for (const report of reports) {
      const f = facts.get(report.path)!;
      report.checks.push(report.path === "/404" ? { id: "hreflang", ok: true, message: "404 dispensa hreflang" } : checkHreflang(report.path, f, alternates));
      report.ok = report.checks.every((c) => c.ok);
      options.onPage?.(report);
    }
    return reports;
  } finally {
    await browser.close();
    await server.close();
  }
}
