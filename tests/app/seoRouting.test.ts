// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { robotsTxt } from "../../scripts/generate-sitemap";

const vercel = JSON.parse(readFileSync(join(__dirname, "..", "..", "vercel.json"), "utf-8")) as {
  trailingSlash?: boolean;
  rewrites: Array<{ source: string; destination: string }>;
};
const toApp = (path: string) => vercel.rewrites.some((r) => r.destination === "/app.html" && new RegExp(`^${r.source}$`).test(path));

describe("vercel.json — SPA só nas rotas do app", () => {
  it("painel, login, playground, propostas e checkout caem na SPA", () => {
    for (const p of ["/admin", "/admin/blog", "/login", "/playground/ai-cv", "/proposta/abc", "/proposta/abc/aceitar", "/checkout/x1", "/payment-success/x1", "/en/proposta/abc"]) {
      expect(toApp(p), p).toBe(true);
    }
  });

  it("o resto não cai na SPA (endereço desconhecido responde 404)", () => {
    for (const p of ["/", "/blog/post-que-nao-existe", "/qualquer-coisa", "/administracao", "/en/blog/x"]) {
      expect(toApp(p), p).toBe(false);
    }
  });

  it("sem barra no fim (evita endereços duplicados)", () => {
    expect(vercel.trailingSlash).toBe(false);
  });
});

describe("robots.txt", () => {
  it("libera o site, bloqueia as rotas do app e aponta o sitemap", () => {
    const txt = robotsTxt("https://site.com");
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("Disallow: /proposta/");
    expect(txt).toContain("Sitemap: https://site.com/sitemap.xml");
    expect(txt).not.toContain("Disallow: /blog");
  });
});

describe("rotas do app — código e vercel.json concordam", () => {
  it("isAppRoute bate com os rewrites para app.html", async () => {
    const { isAppRoute } = await import("@/lib/appRoutes");
    const paths = ["/", "/admin", "/admin/blog", "/login", "/playground", "/proposta/abc", "/en/proposta/abc", "/checkout/x", "/payment-success/x", "/blog/x", "/sobre", "/administracao", "/en", "/en/blog"];
    for (const p of paths) expect(isAppRoute(p), p).toBe(toApp(p));
  });

  it("seções de texto só do app", async () => {
    const { isAppTextKey } = await import("@/lib/appRoutes");
    expect(isAppTextKey("admin.blog.title")).toBe(true);
    expect(isAppTextKey("proposals.clause1")).toBe(true);
    expect(isAppTextKey("auth.login")).toBe(true);
    expect(isAppTextKey("contactWizard.trigger")).toBe(false);
    expect(isAppTextKey("home.hero.headline")).toBe(false);
  });
});
