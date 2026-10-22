import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";

// Os templates de layout substituem a navegação do app; todo link interno deles
// precisa apontar para uma rota que existe em src/App.tsx.

const ROOT = resolve(import.meta.dirname, "../../..");

const routes = [...readFileSync(resolve(ROOT, "src/App.tsx"), "utf-8").matchAll(/<Route path="([^"]+)"/g)]
  .map(([, path]) => new RegExp(`^${path.replace(/:[^/]+/g, "[^/]+")}/?$`));

function listTemplates(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    return e.isDirectory() ? listTemplates(p) : e.name.endsWith(".tsx") ? [p] : [];
  });
}

describe("templates — links internos apontam para rotas do app", () => {
  it("encontra rotas no App.tsx", () => {
    expect(routes.length).toBeGreaterThan(5);
  });

  for (const file of listTemplates(resolve(ROOT, "templates/layouts"))) {
    const links = [...readFileSync(file, "utf-8").matchAll(/\b(?:href|to)\s*[:=]\s*["'`](\/[^"'`$#?]*)/g)].map(([, p]) => p);
    if (!links.length) continue;

    it(relative(ROOT, file), () => {
      const broken = links.filter((p) => p !== "/" && !routes.some((r) => r.test(p)));
      expect(broken, `links sem rota: ${broken.join(", ")}`).toEqual([]);
    });
  }
});
