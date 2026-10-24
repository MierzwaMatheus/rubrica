import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { LAYOUTS } from "../../cli/src/layouts";
import { ROLE_VARS, LEGACY_ROLES, SCHEMES, contrast } from "../../cli/src/themes/schemes";

// Esquema de cores: 11 papéis por modo (claro em :root, escuro em .dark), gravados pelo
// CLI (applyTheme) em src/index.css. Os layouts originais (legacy) só usam as 4 cores do
// contrato original; os novos usam o esquema completo, sempre por variável.

const ROOT = resolve(import.meta.dirname, "../..");
const ALL_ROLES = Object.values(ROLE_VARS);
const CONTRACT = LEGACY_ROLES.map((r) => ROLE_VARS[r]);
const EXTENDED = ALL_ROLES.filter((v) => !CONTRACT.includes(v));

const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf-8");
const css = read("src/index.css");
const block = (selector: string) => css.match(new RegExp(`\\n${selector.replace(".", "\\.")} \\{([^}]*)\\}`))?.[1];
const decl = (body: string, name: string) => body.match(new RegExp(`(?:^|[\\s;])${name}\\s*:\\s*([^;]+);`))?.[1].trim();

function listTsx(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = resolve(dir, e.name);
    return e.isDirectory() ? listTsx(p) : e.name.endsWith(".tsx") ? [relative(ROOT, p)] : [];
  });
}

/** Proibido em qualquer template: tokens do shadcn e cores pensadas para um fundo só. */
const FORBIDDEN_ALWAYS: Array<[string, RegExp]> = [
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
  ["text-black hardcoded", /\btext-black\b/],
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

/** Layouts novos: nenhuma cor literal — tudo vem do esquema (var(--…)). */
const FORBIDDEN_LITERAL_COLORS: Array<[string, RegExp]> = [
  ["cor hex literal", /(["'`(\s:,])#[0-9a-fA-F]{3,8}\b/],
  ["rgb()/rgba() literal", /\brgba?\(\s*\d/],
  ["hsl()/hsla() literal", /\bhsla?\(\s*\d/],
  ["classe de cor fixa do Tailwind", /\b(?:bg|text|border|from|to|via|fill|stroke|ring)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b/],
];

describe("colorContract — registro de layouts", () => {
  it("os 5 layouts originais seguem marcados como legacy", () => {
    const legacy = LAYOUTS.filter((l) => l.legacy).map((l) => l.id).sort();
    expect(legacy).toEqual(["bento", "brutalist", "cyberpunk", "magazine", "swiss"]);
  });

  it("encontra os templates de todos os layouts que já existem", () => {
    for (const layout of LAYOUTS.filter((l) => existsSync(resolve(ROOT, "templates/layouts", l.id)))) {
      expect(listTsx(resolve(ROOT, "templates/layouts", layout.id)).length, layout.id).toBeGreaterThan(0);
    }
  });
});

for (const layout of LAYOUTS) {
  const files = listTsx(resolve(ROOT, "templates/layouts", layout.id));
  if (!files.length) continue;

  describe(`colorContract — ${layout.id} (${layout.legacy ? "4 cores" : "esquema completo"})`, () => {
    for (const file of files) {
      const content = read(file);
      it(`${file} não usa tokens proibidos nem cores de um fundo só`, () => {
        for (const [label, pattern] of FORBIDDEN_ALWAYS) {
          expect(content, `${file} contém "${label}"`).not.toMatch(pattern);
        }
      });

      if (layout.legacy) {
        it(`${file} usa só as 4 cores do contrato original`, () => {
          for (const v of EXTENDED) {
            expect(content, `${file} usa ${v}, que não existe para templates antigos`).not.toMatch(new RegExp(`var\\(${v}\\b`));
          }
        });
      } else {
        it(`${file} não tem cores literais (usa só as variáveis do esquema)`, () => {
          for (const [label, pattern] of FORBIDDEN_LITERAL_COLORS) {
            expect(content, `${file} contém ${label}`).not.toMatch(pattern);
          }
        });
        it(`${file} só usa variáveis de cor que existem no esquema`, () => {
          const used = [...content.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);
          const allowed = new Set([...ALL_ROLES, "--text-strong", "--font-sans", "--font-mono", "--radius"]);
          const unknown = [...new Set(used.filter((v) => !allowed.has(v) && !v.startsWith(`--${layout.id}-`)))];
          expect(unknown, `${file}: variáveis fora do esquema (as próprias do layout começam com --${layout.id}-)`).toEqual([]);
        });
      }
    }
  });
}

// ---- index.css define e consome o esquema --------------------------------------------

describe("colorContract — src/index.css", () => {
  const root = block(":root") ?? "";
  const dark = block(".dark") ?? "";

  it("o esquema fica entre os marcadores que o CLI substitui", () => {
    expect(css).toContain("/* rubrica:esquema:inicio */");
    expect(css).toContain("/* rubrica:esquema:fim */");
  });

  for (const name of ALL_ROLES) {
    it(`:root (claro) e .dark (escuro) declaram ${name} como cor completa`, () => {
      for (const [mode, body] of [["claro", root], ["escuro", dark]] as const) {
        const value = decl(body, name);
        expect(value, `${name} ausente no modo ${mode}`).toBeDefined();
        expect(value).not.toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/);
      }
    });
  }

  it.each([
    ["--color-background", "var(--bg)"],
    ["--color-foreground", "var(--text)"],
    ["--color-primary", "var(--primary)"],
    ["--color-primary-foreground", "var(--on-primary)"],
    ["--color-ring", "var(--primary)"],
    ["--color-neon-purple", "var(--primary)"],
    ["--color-neon-lime", "var(--accent)"],
    ["--color-accent-2", "var(--accent-2)"],
  ])("tokens Tailwind: %s aponta para %s", (token, value) => {
    expect(css).toMatch(new RegExp(`${token}:\\s*${value.replace(/[()]/g, "\\$&")};`));
  });

  it("nenhum token envolve variável do esquema em hsl() (seria cor inválida)", () => {
    expect(css).not.toMatch(/hsl\(var\(--(bg|text|primary|accent)\)\)/);
  });

  it("não sobra definição própria de neon (seguem o esquema)", () => {
    expect(css).not.toMatch(/--neon-(purple|lime)\s*:/);
  });

  it("o conteúdo de posts não usa cores fixas de fundo escuro", () => {
    const blog = css.slice(css.indexOf(".blog-content"));
    expect(blog).not.toMatch(/\bwhite\b|hsla?\(\s*\d/);
  });
});

describe("colorContract — esquemas", () => {
  for (const s of SCHEMES) {
    it(`${s.id}: texto legível sobre o fundo nos dois modos (≥ 4.5)`, () => {
      expect(contrast(s.light.text, s.light.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(s.dark.text, s.dark.bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

// ---- bento Layout usa --font-sans ------------------------------------------------------

describe("colorContract — bento Layout tipografia", () => {
  it("Layout.tsx do bento usa var(--font-sans) para tipografia principal", () => {
    const content = read("templates/layouts/bento/Layout.tsx");
    expect(content, "Layout.tsx deve declarar var(--font-sans) no container raiz").toMatch(/var\(--font-sans\)/);
  });
});
