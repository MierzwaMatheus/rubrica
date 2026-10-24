import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getLayout } from "../../../cli/src/layouts";

// Zine: a letra à mão vem do próprio Layout (com fonte de reserva), a navegação tem o
// botão de modo e os textos próprios do layout existem nos dois idiomas.

const ROOT = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(ROOT, "templates/layouts/zine", rel), "utf-8");

describe("zine — contrato do layout", () => {
  it("o registro lista exatamente os arquivos que existem", () => {
    const layout = getLayout("zine");
    expect(layout?.copy).toEqual(["Layout.tsx", "ZineNav.tsx", "ZineShared.tsx"]);
    for (const f of [...(layout?.copy ?? []), "pages/Home.tsx", "pages/Resume.tsx", "pages/Portfolio.tsx", "pages/About.tsx", "pages/Blog.tsx"]) {
      expect(() => read(f), f).not.toThrow();
    }
  });

  it("Layout carrega a Caveat pelo Helmet e a pilha da letra à mão tem reserva", () => {
    expect(read("Layout.tsx")).toMatch(/<Helmet>[\s\S]*family=Caveat/);
    expect(read("ZineShared.tsx")).toMatch(/--zine-hand:\s*"Caveat",[^;]*cursive;/);
  });

  it("a navegação tem o ColorModeToggle", () => {
    expect(read("ZineNav.tsx")).toContain("<ColorModeToggle");
  });

  it("as rotações respeitam o celular e as animações respeitam prefers-reduced-motion", () => {
    const css = read("ZineShared.tsx");
    expect(css).toMatch(/--zine-tilt:\s*0\.35/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*\.zn-lift/);
  });

  it("os textos próprios existem em pt-BR e en-US com as mesmas chaves", () => {
    const src = read("ZineShared.tsx");
    const block = (loc: string) => src.match(new RegExp(`"${loc}": \\{([\\s\\S]*?)\\n  \\},`))?.[1] ?? "";
    const keys = (b: string) => [...b.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]).sort();
    expect(keys(block("pt-BR")).length).toBeGreaterThan(10);
    expect(keys(block("en-US"))).toEqual(keys(block("pt-BR")));
  });
});
