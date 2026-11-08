import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runConfig } from "../commands/config.js";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { applyTheme } from "../transforms/applyTheme.js";
import { applyFont } from "../transforms/applyFont.js";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";
import { writeState } from "../state/writeState.js";
import { readState } from "../state/readState.js";

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn(),
  multiselect: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { multiselect, select } from "@clack/prompts";

// ---- conteúdo mínimo dos arquivos de projeto --------------------------------

const INITIAL_CSS = `:root {
  --font-sans: "Inter";
  --font-mono: "JetBrains Mono";
  --radius: 0.5rem;
  --primary: 0 0% 0%;
}
.dark {
  --primary: 0 0% 100%;
}`;

const INITIAL_HTML = `<!DOCTYPE html>
<html>
<head>
  <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  <meta name="theme-color" content="#6366f1" />
  <meta property="og:title" content="Test Site" />
  <meta property="og:url" content="https://test.com" />
  <meta name="twitter:creator" content="@testhandle" />
  <meta name="author" content="Test Author" />
</head>
<body></body>
</html>`;

const INITIAL_STATE = {
  version: "0.1.0",
  layout: "cyberpunk" as const,
  theme: "editorial-cream",
  accentColor: null,
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true, portfolio: true, resume: true },
};

const INITIAL_RUBRICA_CONFIG = `export const rubricalConfig = {
  siteName: "Original Site",
  siteUrl: "https://original.com",
  siteDescription: "Original description",
  authorName: "Original Author",
  authorEmail: "original@test.com",
  twitterHandle: "originalhandle",
  lang: "pt-BR",
  seoHomeTitle: "",
  seoHomeDescription: "",
  rssTitle: "",
  rssDescription: "",
  ogImageUrl: "",
  accentColor: "#6d28d9",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
};
`;

// ---- helpers ----------------------------------------------------------------

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    access: (p: string) => vol.promises.access(p).then(() => undefined),
    readFile: (p: string, encoding: string) =>
      vol.promises.readFile(p, encoding as BufferEncoding) as Promise<string>,
    writeFile: (p: string, data: string) =>
      vol.promises.writeFile(p, data).then(() => undefined),
    mkdir: (p: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(p, options).then(() => undefined),
    copyFile: (src: string, dest: string) =>
      vol.promises.copyFile(src, dest).then(() => undefined),
    unlink: (p: string) => vol.promises.unlink(p).then(() => undefined),
    exists: async (p: string) => {
      try {
        await vol.promises.access(p);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function setupProjectVolume(vol: InstanceType<typeof Volume>) {
  vol.mkdirSync("/project/src", { recursive: true });
  vol.mkdirSync("/project/convex", { recursive: true });
  vol.writeFileSync("/project/rubrica.json", JSON.stringify(INITIAL_STATE, null, 2));
  vol.writeFileSync("/project/rubrica.config.ts", INITIAL_RUBRICA_CONFIG);
  vol.writeFileSync("/project/src/index.css", INITIAL_CSS);
  vol.writeFileSync("/project/index.html", INITIAL_HTML);
}

const mockDetectProject = vi.fn(async () => "/project/rubrica.json");

const mockIdentityPrompt = vi.fn(async () => ({
  siteName: "New Site Name",
  siteUrl: "https://new.com",
  siteDescription: "New description",
  authorName: "New Author",
  authorEmail: "new@test.com",
  twitterHandle: "newhandle",
  lang: "en-US",
}));

// ---- Ciclo 5: config Aparência atualiza rubrica.json e não toca rubrica.config.ts

describe("config e2e — seção Aparência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("atualiza rubrica.json com novo tema e não modifica rubrica.config.ts", async () => {
    const vol = Volume.fromJSON({});
    setupProjectVolume(vol);
    const fs = makeFsModule(vol);

    // Seleciona "appearance" no multiselect de seções
    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    // Prompts de aparência: tema minimal, Inter, JetBrains Mono, 0.5rem
    vi.mocked(select)
      .mockResolvedValueOnce("editorial-cream")
      .mockResolvedValueOnce("Inter")
      .mockResolvedValueOnce("JetBrains Mono")
      .mockResolvedValueOnce("0.5rem");

    await runConfig({
      cwd: "/project",
      fs,
      detectProject: mockDetectProject,
      readState,
      writeState,
      applyTheme,
      applyFont,
      applyIndexHtml,
      applyRubricalConfig,
      identityPrompt: mockIdentityPrompt,
    });

    // rubrica.json deve ter o tema atualizado
    const stateRaw = await fs.readFile("/project/rubrica.json", "utf-8");
    const state = JSON.parse(stateRaw) as { theme: string };
    expect(state.theme).toBe("editorial-cream");

    // rubrica.config.ts NÃO deve ter sido modificado
    const configContent = await fs.readFile("/project/rubrica.config.ts", "utf-8");
    expect(configContent).toBe(INITIAL_RUBRICA_CONFIG);
  });
});

// ---- Ciclo 6: config Identidade atualiza rubrica.config.ts e não toca no tema

describe("config e2e — seção Identidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("atualiza rubrica.config.ts com novo siteName e não modifica src/index.css", async () => {
    const vol = Volume.fromJSON({});
    setupProjectVolume(vol);
    const fs = makeFsModule(vol);

    // Seleciona "identity" no multiselect de seções
    vi.mocked(multiselect).mockResolvedValueOnce(["identity"]);

    await runConfig({
      cwd: "/project",
      fs,
      detectProject: mockDetectProject,
      readState,
      writeState,
      applyTheme,
      applyFont,
      applyIndexHtml,
      applyRubricalConfig,
      identityPrompt: mockIdentityPrompt,
    });

    // rubrica.config.ts deve ter o novo siteName
    const configContent = await fs.readFile("/project/rubrica.config.ts", "utf-8");
    expect(configContent).toContain('"New Site Name"');
    expect(configContent).toContain('"New Author"');

    // src/index.css NÃO deve ter sido modificado (tema preservado)
    const css = await fs.readFile("/project/src/index.css", "utf-8");
    expect(css).toBe(INITIAL_CSS);

    // rubrica.json NÃO deve ter sido modificado (sem stateUpdate)
    const stateRaw = await fs.readFile("/project/rubrica.json", "utf-8");
    const state = JSON.parse(stateRaw) as { theme: string };
    expect(state.theme).toBe("editorial-cream");
  });
});
