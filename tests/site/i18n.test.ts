// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LAYOUTS, TEXTURES } from "../../cli/src/layouts";
import { SCHEMES } from "../../cli/src/themes/schemes";
import { PLUGIN_PRESETS } from "../../cli/src/plugins";
import { MOODS, PAGES } from "../../site/src/lib/data";
import { fill, useDict } from "../../site/src/i18n";

const ids = (o: object) => Object.keys(o).sort();

describe.each(["pt", "en"] as const)("dicionário %s", (lang) => {
  const { catalog, pages } = useDict(lang);

  it("tem dica para todo layout e esquema do CLI", () => {
    expect(ids(catalog.layoutHints)).toEqual(LAYOUTS.map((l) => l.id).sort());
    expect(ids(catalog.schemeHints)).toEqual(SCHEMES.map((s) => s.id).sort());
  });

  it("tem rótulo para toda textura, preset, mood e página do preview", () => {
    expect(ids(catalog.textures)).toEqual(TEXTURES.map((t) => t.value).sort());
    expect(ids(catalog.presets)).toEqual(PLUGIN_PRESETS.map((p) => p.id).sort());
    expect(ids(catalog.moods)).toEqual(MOODS.map((m) => m.id).sort());
    expect(ids(pages)).toEqual([...PAGES].sort());
  });

  it("não tem texto vazio, a não ser os avisos que só existem em inglês", () => {
    const optional = new Set(["hero.languageNote", "combinator.previewNote", "docs.translationNote"]);
    const walk = (v: unknown, at: string): string[] =>
      typeof v === "string"
        ? v.trim() || optional.has(at) ? [] : [at]
        : v && typeof v === "object"
          ? Object.entries(v).flatMap(([k, x]) => walk(x, at ? `${at}.${k}` : k))
          : [];
    expect(walk(useDict(lang), "")).toEqual([]);
  });
});

describe("dicionários", () => {
  it("o inglês tem as mesmas chaves do português", () => {
    const keys = (v: unknown, at = ""): string[] =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.entries(v).flatMap(([k, x]) => keys(x, `${at}.${k}`))
        : Array.isArray(v)
          ? [`${at}[${v.length}]`, ...v.flatMap((x, i) => keys(x, `${at}[${i}]`))]
          : [at];
    expect(keys(useDict("en"))).toEqual(keys(useDict("pt")));
  });

  it("o inglês avisa que o CLI e o painel são em português", () => {
    expect(useDict("en").hero.languageNote).toMatch(/Portuguese/);
    expect(useDict("pt").hero.languageNote).toBe("");
  });
});

describe("fill", () => {
  it("troca as chaves e mantém as que não vieram", () => {
    expect(fill("Home do layout {name} {x}", { name: "Zine" })).toBe("Home do layout Zine {x}");
  });
});
