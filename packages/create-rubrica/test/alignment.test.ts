/**
 * O CLI fala a língua do núcleo: as variáveis que o setup grava são as que o backend lê
 * (docs/v2/variaveis.md), a URL do webhook do Asaas é a rota de verdade e os temas que o
 * CLI oferece como portados existem como pacotes no workspace.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { SCHEMES } from "@rubrica/core";
import { createRubrica } from "@rubrica/core/convex";
import { ASAAS_WEBHOOK_PATH, BASE_ENV, COPIED_TO_PRODUCTION, INTEGRATIONS } from "../src/commands/setup";
import { getTheme, initialFonts, PORTED_THEMES, SCHEME_IDS, THEME_PACKAGE_DEFAULTS, THEMES, themePackage } from "../src/themes";
import { repo } from "./helpers";

const documented = new Set([...readFileSync(repo("docs/v2/variaveis.md"), "utf-8").matchAll(/^\| `([A-Z][A-Z0-9_]+)` \|/gm)].map((m) => m[1]!));

describe("setup ↔ backend", () => {
  it("o webhook do Asaas aponta para uma rota POST do http do núcleo", () => {
    const http = createRubrica().http;
    expect(http.lookup(ASAAS_WEBHOOK_PATH, "POST")).not.toBeNull();
    expect(readFileSync(repo("docs/v2/variaveis.md"), "utf-8")).toContain(`<CONVEX_SITE_URL>${ASAAS_WEBHOOK_PATH}`);
  });

  it("toda variável que o setup e o publicar gravam está documentada em docs/v2/variaveis.md", () => {
    const written = [...INTEGRATIONS.flatMap((i) => i.vars.map((v) => v.key)), ...BASE_ENV, ...COPIED_TO_PRODUCTION];
    expect(documented.size).toBeGreaterThan(10);
    expect(written.filter((k) => !documented.has(k))).toEqual([]);
  });

  it("o núcleo lê cada variável que o setup grava", () => {
    const source = ["contacts.ts", "lib/destinations.ts", "lib/crypto.ts", "lib/openrouter.ts", "publish.ts", "httpRoutes.ts", "lib/intake.ts", "commerce/asaas.ts", "commerce/http.ts", "commerce/commerce.ts", "commerce/shared.ts", "commerce/aiResumes.ts"]
      .map((f) => {
        try {
          return readFileSync(repo("packages/core/src/convex", f), "utf-8");
        } catch {
          return "";
        }
      })
      .join("\n");
    const written = [...INTEGRATIONS.flatMap((i) => i.vars.map((v) => v.key)), ...BASE_ENV];
    expect(written.filter((k) => !source.includes(k))).toEqual([]);
  });
});

describe("temas ↔ pacotes do workspace", () => {
  it("cada tema portado é um pacote em packages/themes, e vice-versa", () => {
    const dirs = readdirSync(repo("packages/themes")).filter((d) => existsSync(repo("packages/themes", d, "package.json"))).sort();
    expect([...PORTED_THEMES].sort()).toEqual(dirs);
    for (const id of PORTED_THEMES) expect(JSON.parse(readFileSync(repo("packages/themes", id, "package.json"), "utf-8")).name).toBe(themePackage(id));
  });

  it("esquema e fontes recomendados de um tema portado são os que o pacote declara", async () => {
    for (const id of PORTED_THEMES) {
      const theme = (await import(repo("packages/themes", id, "src/index.tsx"))).default as { scheme?: string; colorMode?: string; fonts?: { sans?: string; mono?: string } };
      const fonts = JSON.parse(readFileSync(repo("packages/themes", id, "src/fonts.json"), "utf-8")) as { sans: string; mono?: string };
      expect(THEME_PACKAGE_DEFAULTS[id], id).toEqual({ scheme: theme.scheme, mode: theme.colorMode ?? "dark", fontSans: fonts.sans, ...(fonts.mono && { fontMono: fonts.mono }) });
      expect(getTheme(id)!.recommended).toMatchObject(THEME_PACKAGE_DEFAULTS[id]);
    }
    expect(getTheme("cyberpunk")!.recommended.scheme).toBe("neon");
    expect(getTheme("magazine")!.recommended.mode).toBe("light");
  });

  it("os esquemas oferecidos são os do núcleo, e todo tema recomenda um que existe", () => {
    expect(SCHEME_IDS).toEqual(SCHEMES.map((s) => s.id));
    for (const t of THEMES) expect(SCHEME_IDS, t.id).toContain(t.recommended.scheme);
  });

  it("o create não grava fontes num tema portado (valem as do tema)", () => {
    expect(initialFonts("cyberpunk")).toEqual({});
    expect(initialFonts("padrao")).toEqual({});
    expect(initialFonts("zine")).toEqual({});
  });
});
