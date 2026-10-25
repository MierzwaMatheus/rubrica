// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatDates, parseChangelog } from "../../site/src/lib/changelog";

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

  it("o CHANGELOG.en.md tem as mesmas versões, na mesma ordem", () => {
    const read = (f: string) => readFileSync(path.resolve(import.meta.dirname, "../..", f), "utf8");
    const pt = parseChangelog(read("CHANGELOG.md")).versions;
    const en = parseChangelog(read("CHANGELOG.en.md")).versions;
    expect(en.map((v) => v.version)).toEqual(pt.map((v) => v.version));
    expect(en.map((v) => v.date.slice(0, 10))).toEqual(pt.map((v) => v.date.slice(0, 10)));
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

describe("formatDates", () => {
  it("escreve a data por extenso em pt-BR", () => {
    expect(formatDates("2026-10-25", "pt")).toBe("25 de outubro de 2026");
  });

  it("formata cada data de uma faixa", () => {
    expect(formatDates("2026-05-22 a 2026-05-23", "pt")).toBe("22 de maio de 2026 a 23 de maio de 2026");
  });

  it("escreve a data em inglês", () => {
    expect(formatDates("2026-10-05", "en")).toBe("October 5, 2026");
    expect(formatDates("2026-05-22 to 2026-05-23", "en")).toBe("May 22, 2026 to May 23, 2026");
  });
});
