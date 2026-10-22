import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";

// Contrato de 4 cores: --bg, --text, --primary e --accent são as únicas cores que um
// tema define (CLI applyTheme, admin via ThemeApplier). Guardam cores completas.

const ROOT = resolve(import.meta.dirname, "../..");
const CONTRACT = ["--bg", "--text", "--primary", "--accent"];

const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf-8");
const css = read("src/index.css");
const block = (selector: string) => css.match(new RegExp(`\\n${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1];
const decl = (body: string, name: string) => body.match(new RegExp(`(?:^|[\\s;])${name}\\s*:\\s*([^;]+);`))?.[1].trim();

function listTemplates(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    return e.isDirectory() ? listTemplates(p) : e.name.endsWith(".tsx") ? [relative(ROOT, p)] : [];
  });
}

// ---- templates usam só as 4 cores do contrato ----------------------------------------

const FORBIDDEN_PATTERNS: Array<[string, RegExp]> = [
  ["--background", /--background\b/],
  ["--foreground", /--foreground\b/],
  ["--muted", /--muted\b/],
  ["--card", /--card\b/],
  ["--border", /--border\b/],
  ["--primary-foreground", /--primary-foreground\b/],
  ["--accent-foreground", /--accent-foreground\b/],
  ["neon-purple", /neon-purple/],
  ["neon-lime", /neon-lime/],
  ["bg-background", /bg-background\b/],
  ["text-foreground", /text-foreground\b/],
  ["text-white hardcoded", /\btext-white\b/],
  ["text-gray hardcoded", /\btext-gray-\d+\b/],
  ["bg-white/ hardcoded", /\bbg-white\/\d/],
  ["border-white/ hardcoded", /\bborder-white\/\d/],
  ["--bento-card", /--bento-card\b/],
  ["--bento-border", /--bento-border\b/],
  ["--bento-dock", /--bento-dock\b/],
  ["--bento-font", /--bento-font\b/],
  ["--swiss-font", /--swiss-font\b/],
  ["--mag-body", /--mag-body\b/],
  ["--mag-display", /--mag-display\b/],
  ["--mag-mono", /--mag-mono\b/],
];

const TEMPLATE_FILES = listTemplates(resolve(ROOT, "templates/layouts"));

describe("colorContract — templates", () => {
  it("encontra os templates de todos os layouts", () => {
    for (const layout of ["bento", "brutalist", "cyberpunk", "magazine", "swiss"]) {
      expect(TEMPLATE_FILES.some((f) => f.includes(`/${layout}/`)), layout).toBe(true);
    }
  });

  for (const file of TEMPLATE_FILES) {
    describe(file, () => {
      const content = read(file);
      for (const [label, pattern] of FORBIDDEN_PATTERNS) {
        it(`não usa "${label}"`, () => {
          expect(content, `${file} contém padrão proibido "${label}"`).not.toMatch(pattern);
        });
      }
    });
  }
});

// ---- index.css define e consome o contrato -------------------------------------------

describe("colorContract — src/index.css", () => {
  const root = block(":root") ?? "";

  for (const name of CONTRACT) {
    it(`:root declara ${name} como cor completa (não canais HSL soltos)`, () => {
      const value = decl(root, name);
      expect(value, `${name} ausente do :root`).toBeDefined();
      expect(value).not.toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/);
    });
  }

  it(".dark não redeclara as cores do contrato (o app roda com .dark e anularia o tema)", () => {
    const dark = block(".dark") ?? "";
    for (const name of CONTRACT) expect(decl(dark, name), name).toBeUndefined();
  });

  it.each([
    ["--color-background", "var(--bg)"],
    ["--color-foreground", "var(--text)"],
    ["--color-primary", "var(--primary)"],
    ["--color-ring", "var(--primary)"],
    ["--color-neon-purple", "var(--primary)"],
    ["--color-neon-lime", "var(--accent)"],
  ])("tokens Tailwind: %s aponta para %s", (token, value) => {
    expect(css).toMatch(new RegExp(`${token}:\\s*${value.replace(/[()]/g, "\\$&")};`));
  });

  it("nenhum token envolve variável do contrato em hsl() (seria cor inválida)", () => {
    expect(css).not.toMatch(/hsl\(var\(--(bg|text|primary|accent)\)\)/);
  });

  it("não sobra definição própria de neon (seguem o contrato)", () => {
    expect(css).not.toMatch(/--neon-(purple|lime)\s*:/);
  });
});

// ---- bento Layout usa --font-sans ------------------------------------------------------

describe("colorContract — bento Layout tipografia", () => {
  it("Layout.tsx do bento usa var(--font-sans) para tipografia principal", () => {
    const content = read("templates/layouts/bento/Layout.tsx");
    expect(content, "Layout.tsx deve declarar var(--font-sans) no container raiz").toMatch(/var\(--font-sans\)/);
  });
});
