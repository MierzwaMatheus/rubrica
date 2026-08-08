import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyTheme } from "../transforms/applyTheme.js";

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

  for (const preset of PRESETS_ALL) {
    it(`${preset}: não injeta vars HSL legadas no CSS`, async () => {
      const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
      const fs = makeFsModule(vol);

      await applyTheme({ preset }, "/project/src/index.css", fs);

      const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
      // Extrai somente o bloco :root injetado
      const rootBlock = result.match(/:root \{([^}]*)\}/s)?.[1] ?? "";
      for (const legacy of LEGACY_VARS) {
        expect(rootBlock, `${preset} não deve conter "${legacy}"`).not.toContain(legacy);
      }
    });

    it(`${preset}: bloco :root contém apenas as 4 vars do contrato hex`, async () => {
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
