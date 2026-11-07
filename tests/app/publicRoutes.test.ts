// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listPublicRoutes } from "../../scripts/lib/publicRoutes";

let dir: string;
const write = (file: string, data: unknown) => writeFileSync(join(dir, file), JSON.stringify(data));
const paths = () => listPublicRoutes(dir).map((r) => r.path);

describe("listPublicRoutes — rotas pré-renderizadas e do sitemap", () => {
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "rotas-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("inclui páginas fixas, posts publicados e cases com slug", () => {
    write("blog.json", [
      { slug: "post-a", status: "published" },
      { slug: "rascunho", status: "draft" },
    ]);
    write("portfolio.json", [{ slug: "case-a" }, { title: "sem slug" }]);
    expect(paths()).toEqual([
      "/",
      "/sobre",
      "/curriculo",
      "/depoimentos",
      "/portfolio",
      "/portfolio/case-a",
      "/blog",
      "/blog/post-a",
    ]);
  });

  it("respeita plugins desligados", () => {
    write("plugins.json", { blog: false, testimonials: false });
    write("portfolio.json", [{ slug: "case-a" }]);
    expect(paths()).not.toContain("/blog");
    expect(paths()).not.toContain("/depoimentos");
    expect(paths()).toContain("/portfolio/case-a");
  });

  it("ignora slug que não vira pasta com segurança", () => {
    write("blog.json", [{ slug: "../fora", status: "published" }, { slug: "ok-1", status: "published" }]);
    expect(paths()).toContain("/blog/ok-1");
    expect(paths().some((p) => p.includes(".."))).toBe(false);
  });

  it("sem JSON de dados, gera ao menos as páginas fixas", () => {
    expect(paths()).toContain("/");
  });
});
