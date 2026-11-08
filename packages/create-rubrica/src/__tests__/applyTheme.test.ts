import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyTheme } from "../transforms/applyTheme.js";
import { getScheme, schemeCss, SCHEME_START, SCHEME_END, ROLE_VARS } from "../themes/schemes.js";

/** O CSS sem o trecho entre os marcadores do esquema. */
function outsideBlock(css: string): string {
  const i = css.indexOf(SCHEME_START);
  const j = css.indexOf(SCHEME_END);
  return css.slice(0, i) + css.slice(j + SCHEME_END.length);
}

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

const stubCss = `@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}

body { margin: 0; }
`;

// ---- index.css com marcadores (projetos novos) ------------------------------

const markedCss = `@import "tailwindcss";

${SCHEME_START}
:root { --bg: #000000; }
.dark { --bg: #ffffff; }
${SCHEME_END}

:root {
  --radius: 0.5rem;
  --text-strong: hsl(from var(--text) h s l);
}

body { margin: 0; }
`;

describe("applyTheme — esquema completo entre os marcadores", () => {
  it("substitui o bloco por :root (claro) e .dark (escuro) com os 11 papéis", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": markedCss });
    await applyTheme({ preset: "riso" }, "/project/src/index.css", makeFsModule(vol));

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    const scheme = getScheme("riso")!;
    const block = result.slice(result.indexOf(SCHEME_START), result.indexOf(SCHEME_END));
    const light = block.match(/:root \{([^}]*)\}/)?.[1] ?? "";
    const dark = block.match(/\.dark \{([^}]*)\}/)?.[1] ?? "";
    for (const [role, cssVar] of Object.entries(ROLE_VARS)) {
      const r = role as keyof typeof scheme.light;
      expect(light).toContain(`${cssVar}: ${scheme.light[r]};`);
      expect(dark).toContain(`${cssVar}: ${scheme.dark[r]};`);
    }
    expect(result).not.toContain("--bg: #000000");
  });

  it("mantém intacto tudo o que está fora dos marcadores", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": markedCss });
    await applyTheme({ preset: "sumi" }, "/project/src/index.css", makeFsModule(vol));

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(outsideBlock(result)).toBe(outsideBlock(markedCss));
    expect(result.split(SCHEME_START)).toHaveLength(2);
  });

  it("trocar de esquema duas vezes não duplica o bloco e é idempotente", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": markedCss });
    const fs = makeFsModule(vol);
    await applyTheme({ preset: "neon" }, "/project/src/index.css", fs);
    await applyTheme({ preset: "azulejo" }, "/project/src/index.css", fs);
    const first = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    await applyTheme({ preset: "azulejo" }, "/project/src/index.css", fs);
    const second = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    expect(second).toBe(first);
    expect(second.split(SCHEME_START)).toHaveLength(2);
    expect(second).toContain(schemeCss(getScheme("azulejo")!));
  });

  it("esquema inexistente lança erro com a mensagem do applyTheme", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": markedCss });
    await expect(
      applyTheme({ preset: "x" }, "/project/src/index.css", makeFsModule(vol))
    ).rejects.toThrow('applyTheme: esquema "x" não encontrado.');
  });
});

// ---- index.css antigo, sem marcadores (modo legado) ---------------------------

describe("applyTheme — modo legado (index.css sem marcadores)", () => {
  it("esquema novo grava só as 4 cores do contrato, com os valores do modo escuro", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": ":root {\n  --radius: 0.5rem;\n}\n" });
    await applyTheme({ preset: "tropicalia" }, "/project/src/index.css", makeFsModule(vol));

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    const dark = getScheme("tropicalia")!.dark;
    expect(result).toContain(`--bg: ${dark.bg};`);
    expect(result).toContain(`--text: ${dark.text};`);
    expect(result).toContain(`--primary: ${dark.primary};`);
    expect(result).toContain(`--accent: ${dark.accent};`);
    for (const extra of ["--surface:", "--on-primary:", "--accent-2:", SCHEME_START]) {
      expect(result).not.toContain(extra);
    }
    expect(result).toContain("--radius: 0.5rem;");
  });
});

describe("applyTheme", () => {
  // ---- editorial-cream (☀ claro) -----------------------------------------------

  it("editorial-cream injeta as 4 vars hex no :root e não modifica .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #faf7f2");
    expect(result).toContain("--text: #1a1614");
    // bloco .dark permanece intacto (não é sobrescrito)
    expect(result).toContain("--background: 0 0% 0%");
  });

  // ---- paper-noir (☀ claro) -----------------------------------------------------

  it("paper-noir injeta as 4 vars hex no :root e não modifica .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "paper-noir" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #f0eee9");
    expect(result).toContain("--text: #0a0a0a");
    expect(result).toContain("--background: 0 0% 0%");
  });

  // ---- midnight-blue (🌑 escuro, dark-first) ------------------------------------

  it("midnight-blue injeta as 4 vars hex no :root e não modifica .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "midnight-blue" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #0a1224");
    expect(result).toContain("--text: #e8e6e0");
    expect(result).toContain("--background: 0 0% 0%");
  });

  // ---- solar-warm (🌑 escuro, dark-first) ----------------------------------------

  it("solar-warm injeta as 4 vars hex no :root e não modifica .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "solar-warm" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #1a1410");
    expect(result).toContain("--text: #f2ede4");
    expect(result).toContain("--background: 0 0% 0%");
  });

  // ---- comportamentos gerais -----------------------------------------------------

  it("re-executar com mesmos valores não duplica blocos (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
    const first = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
    const second = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    expect(first).toBe(second);
    const rootMatches = second.match(/:root \{/g) ?? [];
    expect(rootMatches.length).toBe(1);
  });

  it("substitui no lugar as vars do contrato já declaradas no :root, sem duplicar", async () => {
    const css = `:root {\n  --bg: hsl(0 0% 8%);\n  --primary: hsl(271 91% 65%);\n  --surface: hsl(from var(--bg) h s calc(l - 4));\n  --radius: 0.5rem;\n}\n`;
    const vol = Volume.fromJSON({ "/project/src/index.css": css });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "midnight-blue" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #0a1224;");
    expect(result).toContain("--primary: #06b6d4;");
    expect(result).toContain("--surface: hsl(from var(--bg) h s calc(l - 4));");
    expect(result).toContain("--radius: 0.5rem;");
    expect(result.match(/--bg:/g)).toHaveLength(1);
    expect(result.match(/--primary:/g)).toHaveLength(1);
  });

  it("não confunde --primary com --on-primary ou --sidebar-primary", async () => {
    const css = `:root {\n  --on-primary: #ffffff;\n  --sidebar-primary: red;\n}\n`;
    const vol = Volume.fromJSON({ "/project/src/index.css": css });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "solar-warm" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--on-primary: #ffffff;");
    expect(result).toContain("--sidebar-primary: red;");
    expect(result).toContain("--primary: #f97316;");
  });

  it("atualiza as vars do contrato que o .dark redeclara, para o modo escuro não sobrescrever o tema", async () => {
    const css = `:root {\n  --primary: hsl(263 90% 66%);\n}\n\n.dark {\n  --primary: hsl(263 90% 66%);\n  --background: 0 0% 8%;\n}\n`;
    const vol = Volume.fromJSON({ "/project/src/index.css": css });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "paper-noir" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    const dark = result.match(/\.dark \{([^}]*)\}/s)?.[1] ?? "";
    expect(dark).toContain("--primary: #ef4444");
    expect(dark).toContain("--background: 0 0% 8%");
    expect(dark).not.toContain("--bg:");
  });

  it("aplicado ao src/index.css real, troca só o bloco do esquema e mantém tokens derivados e o --radius", async () => {
    const realCss = readFileSync(resolve(import.meta.dirname, "../../../src/index.css"), "utf-8");
    const vol = Volume.fromJSON({ "/project/src/index.css": realCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    const scheme = getScheme("editorial-cream")!;
    expect(result).toContain(schemeCss(scheme));
    // fora do bloco, nada muda
    expect(outsideBlock(result)).toBe(outsideBlock(realCss));
    for (const kept of ["--text-strong:", "--radius:", "--color-primary: var(--primary);"]) {
      expect(result).toContain(kept);
    }
  });

  it("preset inexistente lança erro descritivo", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await expect(
      applyTheme({ preset: "naoexiste" }, "/project/src/index.css", fs)
    ).rejects.toThrow(/naoexiste/);
  });

  // ---- contrato hex (--bg, --text, --primary, --accent) -------------------------

  it("editorial-cream expõe variáveis hex do contrato no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #faf7f2");
    expect(result).toContain("--text: #1a1614");
    expect(result).toContain("--primary: #a855f7");
    expect(result).toContain("--accent: #ef4444");
  });

  it("midnight-blue expõe variáveis hex do contrato no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "midnight-blue" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #0a1224");
    expect(result).toContain("--text: #e8e6e0");
    expect(result).toContain("--primary: #06b6d4");
    expect(result).toContain("--accent: #facc15");
  });

  it("solar-warm expõe variáveis hex do contrato no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "solar-warm" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #1a1410");
    expect(result).toContain("--text: #f2ede4");
    expect(result).toContain("--primary: #f97316");
    expect(result).toContain("--accent: #facc15");
  });

  it("paper-noir expõe variáveis hex do contrato no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "paper-noir" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--bg: #f0eee9");
    expect(result).toContain("--text: #0a0a0a");
    expect(result).toContain("--primary: #ef4444");
    expect(result).toContain("--accent: #3b82f6");
  });

  it("presets antigos (minimal, forest, editorial, cyberpunk) não existem mais", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    for (const old of ["minimal", "forest", "editorial", "cyberpunk"]) {
      await expect(
        applyTheme({ preset: old }, "/project/src/index.css", fs)
      ).rejects.toThrow();
    }
  });

  // ---- contrato: apenas 4 vars hex, sem legado HSL ----------------------------------

  const PRESETS_ALL = [
    "editorial-cream",
    "paper-noir",
    "midnight-blue",
    "solar-warm",
  ] as const;

  const LEGACY_VARS = [
    "--background:",
    "--foreground:",
    "--card:",
    "--card-foreground:",
    "--popover:",
    "--muted:",
    "--muted-foreground:",
    "--border:",
    "--input:",
    "--ring:",
    "--sidebar:",
    "--sidebar-foreground:",
    "--sidebar-primary:",
    "--sidebar-accent:",
    "--sidebar-border:",
    "--sidebar-ring:",
    "--neon-purple:",
    "--neon-lime:",
    "--primary-foreground:",
    "--accent-foreground:",
    "--secondary:",
    "--secondary-foreground:",
    "--destructive:",
    "--destructive-foreground:",
  ];

  const CONTRACT_VARS = /^\s*--(bg|text|primary|accent)\s*:.*$/gm;

  for (const preset of PRESETS_ALL) {
    it(`${preset}: não injeta vars HSL legadas no CSS`, async () => {
      const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
      const fs = makeFsModule(vol);

      await applyTheme({ preset }, "/project/src/index.css", fs);

      const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
      const before = stubCss.match(/:root \{([^}]*)\}/s)?.[1] ?? "";
      const rootBlock = result.match(/:root \{([^}]*)\}/s)?.[1] ?? "";
      for (const legacy of LEGACY_VARS) {
        const count = (s: string) => s.split(legacy).length - 1;
        expect(count(rootBlock), `${preset} não deve injetar "${legacy}"`).toBe(count(before));
      }
    });

    it(`${preset}: altera só as 4 vars do contrato e preserva o resto do :root`, async () => {
      const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
      const fs = makeFsModule(vol);

      await applyTheme({ preset }, "/project/src/index.css", fs);

      const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
      const strip = (s: string) => (s.match(/:root \{([^}]*)\}/s)?.[1] ?? "").replace(CONTRACT_VARS, "").replace(/\s+/g, " ").trim();
      expect(strip(result)).toBe(strip(stubCss));
    });

    it(`${preset}: bloco :root contém as 4 vars do contrato hex`, async () => {
      const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
      const fs = makeFsModule(vol);

      await applyTheme({ preset }, "/project/src/index.css", fs);

      const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
      const rootBlock = result.match(/:root \{([^}]*)\}/s)?.[1] ?? "";
      // As 4 vars devem estar presentes
      expect(rootBlock).toMatch(/--bg:\s*#[0-9a-fA-F]{3,6}/);
      expect(rootBlock).toMatch(/--text:\s*#[0-9a-fA-F]{3,6}/);
      expect(rootBlock).toMatch(/--primary:\s*#[0-9a-fA-F]{3,6}/);
      expect(rootBlock).toMatch(/--accent:\s*#[0-9a-fA-F]{3,6}/);
    });
  }
});
