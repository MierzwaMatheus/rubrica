import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

// Os 5 layouts originais funcionam nos dois modos: a navegação de cada um traz o botão de
// alternar o modo (que some sozinho com a alternância desligada) e nenhuma página do app
// usada pelo cyberpunk presume fundo claro ou escuro.

const ROOT = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf-8");

const NAVS = [
  "templates/layouts/cyberpunk/Sidebar.tsx",
  "templates/layouts/brutalist/Navbar.tsx",
  "templates/layouts/swiss/Sidebar.tsx",
  "templates/layouts/bento/FloatingDock.tsx",
  "templates/layouts/magazine/Masthead.tsx",
  "src/components/Sidebar.tsx",
];

describe("layouts originais — botão de modo claro/escuro", () => {
  it.each(NAVS)("%s usa o ColorModeToggle", (file) => {
    const src = read(file);
    expect(src).toMatch(/import { ColorModeToggle( as \w+)? } from "@\/components\/ColorModeToggle"/);
    expect(src).toMatch(/<ColorModeToggle\b/);
  });

  it.each(["templates/layouts/cyberpunk/Sidebar.tsx", "templates/layouts/swiss/Sidebar.tsx", "templates/layouts/magazine/Masthead.tsx", "src/components/Sidebar.tsx"])(
    "%s também mostra o botão no celular",
    (file) => {
      expect(read(file).match(/<ColorModeToggle\b/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    },
  );
});

describe("layouts originais — páginas do app (cyberpunk) sem cores de um fundo só", () => {
  const PAGES = ["Home", "Resume", "Portfolio", "About", "Blog"].map((p) => `src/pages/${p}.tsx`);
  const FIXED: Array<[string, RegExp]> = [
    ["text-white", /\btext-white\b/],
    ["bg-black", /\bbg-black\b/],
    ["from-/via-/to-black ou white", /\b(?:from|via|to)-(?:black|white)\b/],
    ["text-gray-*", /\btext-gray-\d+\b/],
    ["rgba() literal", /\brgba?\(\s*\d/],
    ["prose-invert fixo", /(?<!dark:)\bprose-invert\b/],
  ];
  for (const file of [...PAGES, "src/components/Sidebar.tsx", "src/components/Layout.tsx"]) {
    it(`${file} não usa cores fixas`, () => {
      const src = read(file);
      for (const [label, re] of FIXED) expect(src, `${file} contém ${label}`).not.toMatch(re);
    });
  }
});
