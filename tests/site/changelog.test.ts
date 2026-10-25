// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatDates, parseChangelog, resolveLinks } from "../../site/src/lib/changelog";

const REPO = "https://github.com/MierzwaMatheus/rubrica";

const SAMPLE = `# Changelog

Texto de abertura com [guia](./docs/atualizacao.md).

## 1.5.0 — 2026-10-25

Resumo da 1.5.

### Seção
- item

## 0.2.0 – 0.2.4 — 2026-05-22 a 2026-05-23

Faixa de versões.
`;

describe("parseChangelog", () => {
  it("separa a abertura das versões", () => {
    const { intro, versions } = parseChangelog(SAMPLE);
    expect(intro).toBe("Texto de abertura com [guia](./docs/atualizacao.md).");
    expect(versions).toHaveLength(2);
  });

  it("lê versão, data, âncora e corpo de cada versão", () => {
    const [v15] = parseChangelog(SAMPLE).versions;
    expect(v15).toEqual({
      version: "1.5.0",
      date: "2026-10-25",
      id: "v1-5-0",
      body: "Resumo da 1.5.\n\n### Seção\n- item",
    });
  });

  it("aceita faixa de versões e de datas", () => {
    const range = parseChangelog(SAMPLE).versions[1];
    expect(range.version).toBe("0.2.0 – 0.2.4");
    expect(range.date).toBe("2026-05-22 a 2026-05-23");
    expect(range.id).toBe("v0-2-0-0-2-4");
  });

  it("título sem data fica com a data vazia", () => {
    const [v] = parseChangelog("# C\n\n## 2.0.0\n\nCorpo\n").versions;
    expect(v.version).toBe("2.0.0");
    expect(v.date).toBe("");
  });

  it("lê o CHANGELOG.md do repositório sem perder versões", () => {
    const md = readFileSync(path.resolve(import.meta.dirname, "../../CHANGELOG.md"), "utf8");
    const { versions } = parseChangelog(md);
    const headings = md.match(/^## /gm) ?? [];
    expect(versions).toHaveLength(headings.length);
    for (const v of versions) {
      expect(v.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(v.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(v.body.length).toBeGreaterThan(0);
    }
    expect(new Set(versions.map((v) => v.id)).size).toBe(versions.length);
  });
});

describe("resolveLinks", () => {
  it("aponta links relativos para o arquivo no GitHub", () => {
    expect(resolveLinks("[a](./docs/x.md) e [b](docs/y.md)", REPO)).toBe(
      `[a](${REPO}/blob/main/docs/x.md) e [b](${REPO}/blob/main/docs/y.md)`,
    );
  });

  it("mantém links absolutos e âncoras", () => {
    const md = "[r](https://exemplo.com/a) [m](mailto:a@b.c) [s](#v1-0-0)";
    expect(resolveLinks(md, REPO)).toBe(md);
  });
});

describe("formatDates", () => {
  it("escreve a data por extenso em pt-BR", () => {
    expect(formatDates("2026-10-25")).toBe("25 de outubro de 2026");
  });

  it("formata cada data de uma faixa", () => {
    expect(formatDates("2026-05-22 a 2026-05-23")).toBe("22 de maio de 2026 a 23 de maio de 2026");
  });
});
