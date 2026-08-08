import { describe, it, expect, vi } from "vitest";
import { Volume } from "memfs";
import { runCreate } from "../commands/create.js";
import { applyLayout } from "../transforms/applyLayout.js";
import { applyTheme } from "../transforms/applyTheme.js";
import { applyFont } from "../transforms/applyFont.js";
import { applyPlugins } from "../transforms/applyPlugins.js";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";
import { writeState } from "../state/writeState.js";

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn(),
  multiselect: vi.fn().mockResolvedValue(["blog", "portfolio", "resume"]),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import { select, multiselect } from "@clack/prompts";

// ---- conteúdo mínimo dos arquivos de template -------------------------------

const MINIMAL_CSS = `:root {
  --font-sans: "Inter";
  --font-mono: "JetBrains Mono";
  --radius: 0.5rem;
  --primary: 0 0% 0%;
}
.dark {
  --primary: 0 0% 100%;
}`;

const MINIMAL_HTML = `<!DOCTYPE html>
<html>
<head>
  <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  <meta name="theme-color" content="#6366f1" />
  <meta property="og:title" content="Rubrica Portfolio" />
  <meta property="og:url" content="https://exemplo.com" />
  <meta name="twitter:creator" content="@handle" />
  <meta name="author" content="Author" />
</head>
<body></body>
</html>`;

const MINIMAL_REGISTRY = `export const pluginRegistry = [
  { id: 'contact-wizard', label: 'Contact Wizard', defaultEnabled: true },
  { id: 'proposals', label: 'Propostas', defaultEnabled: true },
  { id: 'payments', label: 'Pagamentos', defaultEnabled: false },
  { id: 'blog', label: 'Blog', defaultEnabled: true },
  { id: 'portfolio', label: 'Portfolio', defaultEnabled: true },
  { id: 'resume', label: 'Resume', defaultEnabled: true },
  { id: 'about', label: 'Sobre', defaultEnabled: true },
  { id: 'ai-resumes', label: 'CV com IA', defaultEnabled: false },
  { id: 'audit-log', label: 'Audit Log', defaultEnabled: true },
  { id: 'media-manager', label: 'Media', defaultEnabled: false },
  { id: 'i18n', label: 'Tradução IA', defaultEnabled: false },
  { id: 'playground', label: 'Playground', defaultEnabled: false },
  { id: 'testimonials', label: 'Depoimentos', defaultEnabled: true },
  { id: 'testimonials-intake', label: 'Depoimentos Intake', defaultEnabled: true },
];`;

// ---- helpers ----------------------------------------------------------------

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
    copyFile: (src: string, dest: string) =>
      vol.promises.copyFile(src, dest).then(() => undefined),
    unlink: (path: string) =>
      vol.promises.unlink(path).then(() => undefined),
    exists: async (path: string) => {
      try {
        await vol.promises.access(path);
        return true;
      } catch {
        return false;
      }
    },
    rm: async (path: string, _opts?: { recursive?: boolean; force?: boolean }) => {
      try {
        await (vol.promises as unknown as { rmdir: (p: string, o: { recursive: boolean }) => Promise<void> }).rmdir(path, { recursive: true });
      } catch {
        // ignora
      }
    },
  };
}

/** Popula o volume com a estrutura completa de templates no projectDir */
function makeE2eDownloadMock(vol: InstanceType<typeof Volume>) {
  return vi.fn(async (projectDir: string) => {
    const dirs = [
      `${projectDir}/src`,
      `${projectDir}/convex`,
      `${projectDir}/templates/layouts/cyberpunk`,
      `${projectDir}/templates/layouts/brutalist`,
    ];
    for (const dir of dirs) {
      vol.mkdirSync(dir, { recursive: true });
    }

    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Layout.tsx`, "// cyberpunk Layout");
    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Sidebar.tsx`, "// Sidebar");
    vol.writeFileSync(`${projectDir}/templates/layouts/brutalist/Layout.tsx`, "// brutalist Layout");
    vol.writeFileSync(`${projectDir}/templates/layouts/brutalist/Navbar.tsx`, "// brutalist Navbar");

    vol.writeFileSync(`${projectDir}/src/index.css`, MINIMAL_CSS);
    vol.writeFileSync(`${projectDir}/index.html`, MINIMAL_HTML);
    vol.writeFileSync(`${projectDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    vol.writeFileSync(`${projectDir}/convex/pluginRegistry.ts`, MINIMAL_REGISTRY);
  });
}

const mockIdentityPrompt = vi.fn(async () => ({
  siteName: "Test Site",
  siteUrl: "https://test.com",
  siteDescription: "A test site",
  authorName: "Test Author",
  authorEmail: "test@test.com",
  twitterHandle: "testhandle",
  lang: "pt-BR",
}));

function setupSelectPrompts(layout: string, theme = "editorial-cream") {
  vi.mocked(select)
    .mockResolvedValueOnce(layout)
    .mockResolvedValueOnce(theme)
    .mockResolvedValueOnce("Inter")
    .mockResolvedValueOnce("JetBrains Mono")
    .mockResolvedValueOnce("none");
}

type RealDeps = Parameters<typeof runCreate>[1];

function makeRealDeps(vol: InstanceType<typeof Volume>): RealDeps {
  return {
    projectsDir: "/projects",
    fs: makeFsModule(vol),
    download: makeE2eDownloadMock(vol) as RealDeps["download"],
    getLatestVersion: vi.fn(async () => "v0.1.0"),
    applyLayout,
    applyTheme,
    applyFont,
    applyPlugins,
    applyIndexHtml,
    applyRubricalConfig,
    writeState,
    identityPrompt: mockIdentityPrompt,
  };
}

async function runE2eCreate(layout: string, plugins: string[] = ["blog", "portfolio", "resume"]) {
  vi.clearAllMocks();
  setupSelectPrompts(layout);
  vi.mocked(multiselect).mockResolvedValueOnce(plugins);

  const vol = Volume.fromJSON({});
  vol.mkdirSync("/projects", { recursive: true });

  const deps = makeRealDeps(vol);
  await runCreate("meu-portfolio", deps);

  return { vol, fs: deps.fs as ReturnType<typeof makeFsModule> };
}

// ---- Ciclo 1: layout cyberpunk -----------------------------------------------

describe("create e2e — layout cyberpunk", () => {
  it("gera Layout.tsx e Sidebar.tsx em src/components/", async () => {
    const { fs } = await runE2eCreate("cyberpunk");

    expect(await fs.exists("/projects/meu-portfolio/src/components/Layout.tsx")).toBe(true);
    expect(await fs.exists("/projects/meu-portfolio/src/components/Sidebar.tsx")).toBe(true);
  });

  it("não gera Navbar.tsx com layout cyberpunk", async () => {
    const { fs } = await runE2eCreate("cyberpunk");

    expect(await fs.exists("/projects/meu-portfolio/src/components/Navbar.tsx")).toBe(false);
  });
});

// ---- Ciclo 3: rubrica.config.ts com todos os campos dos prompts --------------

describe("create e2e — rubrica.config.ts", () => {
  it("gera rubrica.config.ts com todos os campos de identidade e aparência", async () => {
    const { fs } = await runE2eCreate("cyberpunk");

    const content = await fs.readFile("/projects/meu-portfolio/rubrica.config.ts", "utf-8");

    expect(content).toContain('"Test Site"');
    expect(content).toContain('"https://test.com"');
    expect(content).toContain('"Test Author"');
    expect(content).toContain('"testhandle"');
    expect(content).toContain('"Inter"');
    expect(content).toContain('"JetBrains Mono"');
  });
});

// ---- Ciclo 4: rubrica.json com campos corretos ------------------------------

describe("create e2e — rubrica.json", () => {
  it("gera rubrica.json com version, layout, theme e plugins corretos", async () => {
    vi.clearAllMocks();
    setupSelectPrompts("cyberpunk", "editorial-cream");
    vi.mocked(multiselect).mockResolvedValueOnce(["blog"]);

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeRealDeps(vol);

    await runCreate("meu-portfolio", deps);

    const fs = deps.fs as ReturnType<typeof makeFsModule>;
    const raw = await fs.readFile("/projects/meu-portfolio/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state.version).toBeTruthy();
    expect(state.layout).toBe("cyberpunk");
    expect(state.theme).toBe("editorial-cream");
    expect((state.plugins as Record<string, boolean>).blog).toBe(true);
    expect((state.plugins as Record<string, boolean>).portfolio).toBe(false);
    expect((state.plugins as Record<string, boolean>).resume).toBe(false);
  });
});

// ---- Ciclo brutalist: wizard expõe layout brutalist --------------------------

describe("create e2e — layout brutalist", () => {
  it("gera Layout.tsx e Navbar.tsx em src/components/ com layout brutalist", async () => {
    const { fs } = await runE2eCreate("brutalist");

    expect(await fs.exists("/projects/meu-portfolio/src/components/Layout.tsx")).toBe(true);
    expect(await fs.exists("/projects/meu-portfolio/src/components/Navbar.tsx")).toBe(true);
  });

  it("não gera Sidebar.tsx com layout brutalist", async () => {
    const { fs } = await runE2eCreate("brutalist");

    expect(await fs.exists("/projects/meu-portfolio/src/components/Sidebar.tsx")).toBe(false);
  });

  it("gera rubrica.json com layout brutalist", async () => {
    vi.clearAllMocks();
    setupSelectPrompts("brutalist", "paper-noir");
    vi.mocked(multiselect).mockResolvedValueOnce(["blog"]);

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeRealDeps(vol);

    await runCreate("meu-portfolio", deps);

    const fsm = deps.fs as ReturnType<typeof makeFsModule>;
    const raw = await fsm.readFile("/projects/meu-portfolio/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state.layout).toBe("brutalist");
    expect(state.theme).toBe("paper-noir");
  });
});
