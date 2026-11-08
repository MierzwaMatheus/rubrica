import { rm } from "node:fs/promises";
import { afterAll, describe, expect, it } from "vitest";
import { auditSite } from "../src/audit.ts";
import type { PageReport } from "../src/types.ts";
import { goodBody, makeSite, ORIGIN } from "./helpers.ts";

const dirs: string[] = [];
afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

const failed = (page: PageReport | undefined) => page?.checks.filter((c) => !c.ok).map((c) => c.id) ?? [];
const find = (pages: PageReport[], path: string) => pages.find((p) => p.path === path);

describe("auditSite", () => {
  it("aprova um site correto", async () => {
    const dir = await makeSite([{ path: "/", body: goodBody() }], { "_rubrica/color-mode.js": "document.documentElement.dataset.ok='1'" });
    dirs.push(dir);
    const pages = await auditSite({ dist: dir });
    expect(pages.map((p) => p.path)).toEqual(["/", "/404"]);
    expect(pages.flatMap((p) => p.checks.filter((c) => !c.ok))).toEqual([]);
    expect(pages.every((p) => p.ok)).toBe(true);
  });

  it("reprova página quebrada de propósito: dois h1, imagem sem alt e script extra", async () => {
    const broken = `<main><h1>Um</h1><h1>Dois</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><script src="/extra.js"></script></main>`;
    const dir = await makeSite([{ path: "/", body: goodBody() }, { path: "/quebrada", body: broken }], { "extra.js": "window.__extra = true;" });
    dirs.push(dir);
    const pages = await auditSite({ dist: dir });
    const page = find(pages, "/quebrada");
    expect(page?.ok).toBe(false);
    expect(failed(page)).toEqual(expect.arrayContaining(["h1", "axe", "js"]));
    const axe = page?.checks.find((c) => c.id === "axe");
    expect(axe?.details?.join("\n")).toMatch(/image-alt/);
    expect(axe?.details?.join("\n")).toMatch(/img/);
    expect(page?.checks.find((c) => c.id === "h1")?.message).toMatch(/2/);
    expect(page?.checks.find((c) => c.id === "js")?.details?.join("\n")).toMatch(/extra\.js/);
    // A página boa continua passando.
    expect(find(pages, "/")?.ok).toBe(true);
  });

  it("página sem ilha aceita o script de analytics do núcleo e só ele", async () => {
    const tag = (attrs: string) => `<script ${attrs} src="/stats/script.js"></script>`;
    const dir = await makeSite(
      [
        { path: "/", body: goodBody(), head: tag('defer data-website-id="abc" data-rb-analytics') },
        { path: "/sem-defer", body: goodBody("Sem defer"), head: tag('data-website-id="abc" data-rb-analytics') },
        { path: "/sem-marca", body: goodBody("Sem marca"), head: tag('defer data-website-id="abc"') },
      ],
      { "stats/script.js": "window.__umami = true;" },
    );
    dirs.push(dir);
    const pages = await auditSite({ dist: dir });
    const js = (path: string) => find(pages, path)?.checks.find((c) => c.id === "js");
    expect(js("/")?.ok).toBe(true);
    expect(js("/")?.message).toMatch(/analytics/);
    expect(js("/sem-defer")?.ok).toBe(false);
    expect(js("/sem-marca")?.ok).toBe(false);
  });

  it("confere o contraste também no modo claro quando há botão de alternar", async () => {
    const style = `<style>[data-color-mode="light"] p{color:#bbb;background:#fff}</style>`;
    const body = `<main><h1>Modos</h1><button data-rb-color-toggle>Tema</button><p>Texto claro demais no modo claro.</p></main>`;
    const dir = await makeSite([{ path: "/", body, head: style }]);
    dirs.push(dir);
    const axe = find(await auditSite({ dist: dir }), "/")?.checks.find((c) => c.id === "axe");
    expect(axe?.ok).toBe(false);
    expect(axe?.details?.join("\n")).toMatch(/\(claro\).*color-contrast/);
  });

  it("mede o contraste depois da troca de modo sem pegar a cor no meio de uma transição", async () => {
    // Escuro: texto claro no fundo escuro. Claro: texto escuro no fundo branco. Os dois
    // passam; com a transição de 5 s na cor, logo depois da troca o texto ainda estaria
    // claro sobre o fundo já branco.
    const style = `<style>
      body{background:#111;color:#eee} p{color:#eee;transition:color 5s linear,background-color 5s linear}
      [data-color-mode="light"] body{background:#fff;color:#222} [data-color-mode="light"] p{color:#222}
    </style>`;
    const body = `<main><h1>Transição</h1><button data-rb-color-toggle>Tema</button><p>Texto com transição de cor.</p></main>`;
    const dir = await makeSite([{ path: "/", body, head: style }]);
    dirs.push(dir);
    const axe = find(await auditSite({ dist: dir }), "/")?.checks.find((c) => c.id === "axe");
    expect(axe?.details ?? []).toEqual([]);
    expect(axe?.ok).toBe(true);
  });

  it("reprova <head> incompleto, lang errado e hreflang sem volta", async () => {
    const alt: [string, string][] = [["pt-BR", "/"], ["en", "/en"]];
    const dir = await makeSite([
      { path: "/", body: goodBody(), alt, head: `<link rel="alternate" hreflang="pt-BR" href="${ORIGIN}/"><link rel="alternate" hreflang="en" href="${ORIGIN}/en">` },
      { path: "/en", body: goodBody("Title"), alt, lang: "pt-BR", head: `<link rel="alternate" hreflang="en" href="${ORIGIN}/en">`, rawHead: `<title></title>` },
    ]);
    dirs.push(dir);
    const pages = await auditSite({ dist: dir });
    expect(failed(find(pages, "/en"))).toEqual(expect.arrayContaining(["title", "description", "canonical", "lang"]));
    expect(failed(find(pages, "/"))).toContain("hreflang");
  });

  it("reprova rolagem horizontal, erro de console e requisição 404", async () => {
    const body = `<main><h1>Larga</h1><div style="width:900px;height:10px;background:#000"></div><img src="/nao-existe.png" alt="falta"><script>console.error("quebrou")</script></main>`;
    const dir = await makeSite([{ path: "/", body }]);
    dirs.push(dir);
    const page = find(await auditSite({ dist: dir }), "/");
    expect(failed(page)).toEqual(expect.arrayContaining(["overflow", "console", "network", "js"]));
  });

  it("rolagem lateral dentro de contêiner não reprova; contêiner que estoura a página aponta para ele", async () => {
    const strip = `<main><h1>Faixa</h1><div class="faixa" style="overflow-x:auto"><div class="larga" style="width:900px;height:10px;background:#000"></div></div></main>`;
    const blowout = `<main><h1>Estouro</h1><div class="caixa" style="width:600px;overflow-x:hidden"><div class="filho" style="width:900px;height:10px;background:#000"></div></div></main>`;
    const dir = await makeSite([
      { path: "/", body: strip },
      { path: "/estouro", body: blowout },
    ]);
    dirs.push(dir);
    const pages = await auditSite({ dist: dir });
    expect(find(pages, "/")?.checks.find((c) => c.id === "overflow")?.ok).toBe(true);
    const overflow = find(pages, "/estouro")?.checks.find((c) => c.id === "overflow");
    expect(overflow?.ok).toBe(false);
    expect(overflow?.details?.join("\n")).toMatch(/div\.caixa/);
    expect(overflow?.details?.join("\n")).not.toMatch(/div\.filho/);
  });

  it("aceita ilha hidratada e reprova ilha que não hidrata e JS acima do limite", async () => {
    const island = (src: string) => `<main><h1>Ilha</h1><astro-island ssr component-url="${src}" component-export="default" client="load" props="{}" opts="{}"></astro-island>
<script type="module">const el=document.querySelector("astro-island");await import("${src}").then(()=>el.removeAttribute("ssr"))</script></main>`;
    const big = "/big.js";
    const noisy = Array.from({ length: 40000 }, (_, i) => `window.v${i}=${Math.random()};`).join("");
    const dir = await makeSite(
      [
        { path: "/", body: island("/ok.js") },
        { path: "/pesada", body: island(big) },
        { path: "/travada", body: `<main><h1>Travada</h1><astro-island ssr component-url="/x.js" component-export="default" client="load" props="{}" opts="{}"></astro-island></main>` },
      ],
      { "ok.js": "export default 1;", "big.js": noisy },
    );
    dirs.push(dir);
    const pages = await auditSite({ dist: dir, limits: { jsKb: 120, lighthouse: { performance: 90, accessibility: 95, seo: 95 } } });
    expect(find(pages, "/")?.checks.filter((c) => !c.ok)).toEqual([]);
    expect(failed(find(pages, "/pesada"))).toContain("js");
    expect(failed(find(pages, "/travada"))).toContain("hydration");
  });
});
