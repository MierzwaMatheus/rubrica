// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docSlug, docUrl, isPublishedDoc, rewriteDoc, splitTitle } from "../../site/src/lib/docs";

const REPO = "https://github.com/MierzwaMatheus/rubrica";
const ROOT = path.resolve(import.meta.dirname, "../..");

const ctx = (from: string, lang: "pt" | "en" = "pt") => ({
  from,
  lang,
  repo: REPO,
  asset: (p: string) => (p.endsWith(".jpg") || p.endsWith(".svg") ? `/_astro/${path.basename(p)}` : undefined),
});

describe("isPublishedDoc", () => {
  it("publica os docs de quem usa", () => {
    expect(isPublishedDoc("docs/atualizacao.md")).toBe(true);
    expect(isPublishedDoc("docs/templates/README.md")).toBe(true);
    expect(isPublishedDoc("docs/templates/zine.md")).toBe(true);
    expect(isPublishedDoc("docs/guia/publicar.md")).toBe(true);
  });

  it("deixa de fora a tradução, a manutenção e os docs internos", () => {
    expect(isPublishedDoc("docs/templates/zine.en.md")).toBe(false);
    expect(isPublishedDoc("docs/cli/manutencao.md")).toBe(false);
    expect(isPublishedDoc("docs/features.md")).toBe(false);
    expect(isPublishedDoc("docs/brand/README.md")).toBe(false);
  });
});

describe("docSlug e docUrl", () => {
  it("o README da pasta vira a página da pasta", () => {
    expect(docSlug("docs/templates/README.md")).toBe("templates");
    expect(docSlug("docs/templates/cores.md")).toBe("templates/cores");
    expect(docSlug("docs/atualizacao.md")).toBe("atualizacao");
    expect(docSlug("docs/guia/cli.md")).toBe("guia/cli");
  });

  it("inglês fica em /en/docs", () => {
    expect(docUrl("templates/cores", "pt")).toBe("/docs/templates/cores");
    expect(docUrl("templates/cores", "en")).toBe("/en/docs/templates/cores");
  });
});

describe("splitTitle", () => {
  it("separa o # do resto", () => {
    expect(splitTitle("# Zine\n\n> frase\n\n## Conceito\n")).toEqual({ title: "Zine", body: "> frase\n\n## Conceito" });
  });
});

describe("rewriteDoc", () => {
  it("link para doc publicado vira página do site, no idioma da página", () => {
    expect(rewriteDoc("[c](./cores.md)", ctx("docs/templates/zine.md"))).toBe("[c](/docs/templates/cores)");
    expect(rewriteDoc("[c](./cores.md#papeis)", ctx("docs/templates/zine.md", "en"))).toBe("[c](/en/docs/templates/cores#papeis)");
    expect(rewriteDoc("[g](./docs/templates/README.md)", ctx("CHANGELOG.md"))).toBe("[g](/docs/templates)");
    expect(rewriteDoc("[a](../atualizacao.md)", ctx("docs/templates/README.md"))).toBe("[a](/docs/atualizacao)");
  });

  it("link para o changelog vai para a página de novidades", () => {
    expect(rewriteDoc("[n](../CHANGELOG.md)", ctx("docs/atualizacao.md"))).toBe("[n](/novidades)");
    expect(rewriteDoc("[n](../CHANGELOG.md)", ctx("docs/atualizacao.md", "en"))).toBe("[n](/en/changelog)");
  });

  it("arquivo que não é página vai para o GitHub", () => {
    expect(rewriteDoc("[m](./docs/cli/manutencao.md)", ctx("CHANGELOG.md"))).toBe(`[m](${REPO}/blob/main/docs/cli/manutencao.md)`);
    expect(rewriteDoc("[t](../../tests/app/x.test.ts)", ctx("docs/templates/cores.md"))).toBe(`[t](${REPO}/blob/main/tests/app/x.test.ts)`);
  });

  it("imagens apontam para o arquivo empacotado pelo build", () => {
    expect(rewriteDoc("![Início](img/zine/home.jpg)", ctx("docs/templates/zine.md"))).toBe("![Início](/_astro/home.jpg)");
    expect(rewriteDoc('<img src="img/cores/neon.svg" width="100%" />', ctx("docs/templates/cores.md"))).toBe(
      '<img src="/_astro/neon.svg" width="100%" />',
    );
  });

  it("mantém links absolutos, âncoras e código", () => {
    const md = "[r](https://exemplo.com/a.md) [s](#conceito) `[x](./y.md)`\n\n```\n[x](./cores.md)\n```";
    expect(rewriteDoc(md, ctx("docs/templates/zine.md"))).toBe(md);
  });
});

describe("docs publicados", () => {
  const published = [
    "docs/atualizacao.md",
    ...readdirSync(path.join(ROOT, "docs/guia"))
      .filter((f) => f.endsWith(".md") && !f.endsWith(".en.md"))
      .map((f) => `docs/guia/${f}`),
    ...readdirSync(path.join(ROOT, "docs/templates"))
      .filter((f) => f.endsWith(".md") && !f.endsWith(".en.md"))
      .map((f) => `docs/templates/${f}`),
  ];

  it.each(published)("%s tem tradução com os mesmos títulos", (file) => {
    const en = file.replace(/\.md$/, ".en.md");
    expect(existsSync(path.join(ROOT, en))).toBe(true);
    const levels = (f: string) =>
      readFileSync(path.join(ROOT, f), "utf8")
        .replace(/```[\s\S]*?```/g, "")
        .match(/^#{1,4} /gm)
        ?.map((h) => h.trim());
    expect(levels(en)).toEqual(levels(file));
  });

  it.each(published)("%s só usa imagens que existem", (file) => {
    const md = readFileSync(path.join(ROOT, file), "utf8");
    const dir = path.dirname(file);
    const refs = [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
    for (const ref of refs.filter((r) => !/^https?:/.test(r))) {
      expect(existsSync(path.join(ROOT, dir, ref)), ref).toBe(true);
    }
  });
});

describe("renderMarkdown", () => {
  it("dá âncoras no formato do GitHub aos títulos e lista os ## para o índice", async () => {
    const { renderMarkdown } = await import("../../site/src/lib/markdown");
    const { html, toc } = renderMarkdown("## Os papéis\n\ntexto\n\n### Neon — `neon`\n\n## Os papéis\n");
    expect(html).toContain('<h2 id="os-papéis">Os papéis</h2>');
    expect(html).toContain('<h3 id="neon--neon">Neon — <code>neon</code></h3>');
    expect(html).toContain('<h2 id="os-papéis-1">');
    expect(toc).toEqual([
      { id: "os-papéis", text: "Os papéis" },
      { id: "os-papéis-1", text: "Os papéis" },
    ]);
  });
});
