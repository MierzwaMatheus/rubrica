import { describe, expect, it } from "vitest";
import { checkCanonical, checkH1, checkHreflang, checkJs, checkLang, type HeadFacts } from "../src/checks.ts";
import { median, failuresOf, pickTargets } from "../src/lighthouse.ts";
import { expectedLang, localeByPrefix, parseSitemap } from "../src/routes.ts";

const facts = (over: Partial<HeadFacts> = {}): HeadFacts => ({ h1Count: 1, title: "t", description: "d", canonical: "https://x.test/a", robots: null, htmlLang: "pt-BR", alternates: [], ...over });

describe("verificações puras", () => {
  it("h1: exatamente um", () => {
    expect(checkH1(facts()).ok).toBe(true);
    expect(checkH1(facts({ h1Count: 0 })).ok).toBe(false);
    expect(checkH1(facts({ h1Count: 2 })).ok).toBe(false);
  });

  it("canonical: dispensado em 404 e noindex, senão aponta para a própria página", () => {
    expect(checkCanonical(facts({ canonical: null }), "/a", true).ok).toBe(true);
    expect(checkCanonical(facts({ canonical: null, robots: "noindex" }), "/a", false).ok).toBe(true);
    expect(checkCanonical(facts({ canonical: null }), "/a", false).ok).toBe(false);
    expect(checkCanonical(facts({ canonical: "https://x.test/b" }), "/a", false).ok).toBe(false);
    expect(checkCanonical(facts(), "/a", false).ok).toBe(true);
  });

  it("lang compara sem diferenciar maiúsculas", () => {
    expect(checkLang(facts({ htmlLang: "pt-br" }), "pt-BR").ok).toBe(true);
    expect(checkLang(facts({ htmlLang: "en" }), "pt-BR").ok).toBe(false);
    expect(checkLang(facts({ htmlLang: null }), "pt-BR").ok).toBe(false);
  });

  it("hreflang recíproco", () => {
    const pt = [{ hreflang: "pt-BR", path: "/" }, { hreflang: "en", path: "/en" }];
    const all = new Map([["/", pt], ["/en", [{ hreflang: "en", path: "/en" }]]]);
    expect(checkHreflang("/", facts({ alternates: pt }), all).ok).toBe(false);
    all.set("/en", pt);
    expect(checkHreflang("/", facts({ alternates: pt }), all).ok).toBe(true);
  });

  it("js: sem ilha só aceita color-mode e JSON-LD", () => {
    const base = { islands: 0, requested: [], limitKb: 120 };
    expect(checkJs({ ...base, scripts: [{ src: "/_rubrica/color-mode.js", type: null }, { src: null, type: "application/ld+json" }] }).ok).toBe(true);
    expect(checkJs({ ...base, scripts: [{ src: null, type: null }] }).ok).toBe(false);
    expect(checkJs({ ...base, scripts: [], requested: [{ url: "/_astro/a.js", gzipBytes: 10 }] }).ok).toBe(false);
  });

  it("js: sem ilha, aceita só o script de analytics marcado, com defer e id do site", () => {
    const base = { islands: 0, limitKb: 120 };
    const umami = "https://cloud.umami.is/script.js";
    const ok = { src: umami, type: null, analytics: { defer: true, websiteId: "abc" } };
    const r = checkJs({ ...base, scripts: [{ src: "/_rubrica/color-mode.js", type: null }, ok], requested: [{ url: umami, gzipBytes: 900 }] });
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/analytics/);
    // Sem defer, sem id ou sem a marca: reprova.
    expect(checkJs({ ...base, scripts: [{ ...ok, analytics: { defer: false, websiteId: "abc" } }], requested: [] }).details?.join()).toMatch(/sem defer/);
    expect(checkJs({ ...base, scripts: [{ ...ok, analytics: { defer: true, websiteId: null } }], requested: [] }).ok).toBe(false);
    expect(checkJs({ ...base, scripts: [{ src: umami, type: null }], requested: [{ url: umami, gzipBytes: 900 }] }).ok).toBe(false);
    // A marca não libera outro arquivo de JavaScript.
    expect(checkJs({ ...base, scripts: [ok], requested: [{ url: "https://cloud.umami.is/outro.js", gzipBytes: 1 }] }).ok).toBe(false);
  });

  it("js: com ilha vale o limite em gzip", () => {
    const args = { islands: 1, scripts: [], limitKb: 1 };
    expect(checkJs({ ...args, requested: [{ url: "/a.js", gzipBytes: 1000 }] }).ok).toBe(true);
    expect(checkJs({ ...args, requested: [{ url: "/a.js", gzipBytes: 2000 }] }).ok).toBe(false);
  });
});

describe("sitemap e Lighthouse", () => {
  const xml = `<urlset xmlns:xhtml="x"><url><loc>https://x.test/</loc><xhtml:link rel="alternate" hreflang="pt-BR" href="https://x.test/"/><xhtml:link rel="alternate" hreflang="en" href="https://x.test/en"/></url><url><loc>https://x.test/en/sobre/</loc></url></urlset>`;
  it("lê rotas, alternativas e o idioma por prefixo", () => {
    const entries = parseSitemap(xml);
    expect(entries.map((e) => e.path)).toEqual(["/", "/en/sobre"]);
    const prefixes = localeByPrefix(entries);
    expect(expectedLang("/en/sobre", prefixes)).toBe("en");
    expect(expectedLang("/blog", prefixes)).toBe("pt-BR");
  });

  it("mediana, limites e escolha de páginas", () => {
    expect(median([90, 50, 95])).toBe(90);
    expect(failuresOf({ performance: 89, accessibility: 100, seo: 94 }, { performance: 90, accessibility: 95, seo: 95 })).toHaveLength(2);
    const { targets, missing } = pickTargets(["/", "/blog", "/blog/a", "/portfolio/b"]);
    expect(targets.map((t) => t.path)).toEqual(["/", "/blog/a", "/portfolio/b"]);
    expect(missing).toEqual([]);
    expect(pickTargets(["/"]).missing).toEqual(["post", "case"]);
  });
});
