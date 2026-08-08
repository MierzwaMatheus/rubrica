/**
 * 2.12 — Integração: CLI → projeto gerado
 *
 * Valida que o output do comando `create` é correto:
 * - rubrica.json tem campos obrigatórios e é parseável
 * - rubrica.config.ts é TypeScript sintaticamente válido
 * - index.html não contém dados pessoais do template original
 * - plugins desmarcados têm defaultEnabled: false
 * - arquivos de layout são TypeScript sintaticamente válidos
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

// ---- caminhos ---------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = resolve(__dirname, "../../../templates/layouts");
const PROJECT_SRC_COMPONENTS = resolve(__dirname, "../../../src/components");

// ---- fixtures ---------------------------------------------------------------

const MINIMAL_CSS = `:root {
  --font-sans: "Inter";
  --font-mono: "JetBrains Mono";
  --radius: 0.5rem;
  --primary: 0 0% 0%;
}
.dark {
  --primary: 0 0% 100%;
}`;

/** HTML com dados pessoais intencionais para testar que applyIndexHtml os remove */
const HTML_WITH_PERSONAL_DATA = `<!DOCTYPE html>
<html>
<head>
  <link
      href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  <meta name="theme-color" content="#6D28D9" />
  <meta property="og:title" content="Matheus Mierzwa | Desenvolvedor Front-end Sênior" />
  <meta property="og:url" content="https://www.mmlo.com.br" />
  <meta property="twitter:creator" content="@matheusmierzwa" />
  <meta name="author" content="Matheus Mierzwa" />
  <meta property="twitter:url" content="https://www.mmlo.com.br" />
  <meta property="twitter:title" content="Matheus Mierzwa | Desenvolvedor Front-end Sênior" />
</head>
<body></body>
</html>`;

/** Registry completo com todos os plugins do projeto */
const FULL_REGISTRY = `export const pluginRegistry = [
  { id: 'contact-wizard', label: 'Contact Wizard', defaultEnabled: true },
  { id: 'proposals', label: 'Propostas', defaultEnabled: true },
  { id: 'payments', label: 'Pagamentos', defaultEnabled: false },
  { id: 'blog', label: 'Blog', defaultEnabled: true },
  { id: 'portfolio', label: 'Portfolio', defaultEnabled: true },
  { id: 'resume', label: 'Currículo', defaultEnabled: true },
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

function makeDownloadMock(
  vol: InstanceType<typeof Volume>,
  htmlContent = HTML_WITH_PERSONAL_DATA,
  registryContent = FULL_REGISTRY
) {
  return vi.fn(async (projectDir: string) => {
    const dirs = [
      `${projectDir}/src`,
      `${projectDir}/convex`,
      `${projectDir}/templates/layouts/cyberpunk`,
    ];
    for (const dir of dirs) {
      vol.mkdirSync(dir, { recursive: true });
    }

    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Layout.tsx`, "// cyberpunk Layout");
    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Sidebar.tsx`, "// Sidebar");

    vol.writeFileSync(`${projectDir}/src/index.css`, MINIMAL_CSS);
    vol.writeFileSync(`${projectDir}/index.html`, htmlContent);
    vol.writeFileSync(`${projectDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    vol.writeFileSync(`${projectDir}/convex/pluginRegistry.ts`, registryContent);
  });
}

const mockIdentityPrompt = vi.fn(async () => ({
  siteName: "Meu Portfólio",
  siteUrl: "https://meusite.com",
  siteDescription: "Portfólio profissional",
  authorName: "Desenvolvedor Exemplo",
  authorEmail: "dev@exemplo.com",
  twitterHandle: "devexemplo",
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

function makeRealDeps(
  vol: InstanceType<typeof Volume>,
  opts: { html?: string; registry?: string } = {}
): RealDeps {
  return {
    projectsDir: "/projects",
    fs: makeFsModule(vol),
    download: makeDownloadMock(vol, opts.html, opts.registry) as RealDeps["download"],
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

async function runValidityCreate(
  layout: string,
  plugins: string[],
  opts: { html?: string; registry?: string } = {}
) {
  vi.resetAllMocks();
  setupSelectPrompts(layout);
  vi.mocked(multiselect).mockResolvedValueOnce(plugins);

  const vol = Volume.fromJSON({});
  vol.mkdirSync("/projects", { recursive: true });

  const deps = makeRealDeps(vol, opts);
  await runCreate("meu-portfolio", deps);

  const fs = deps.fs as ReturnType<typeof makeFsModule>;
  return { vol, fs };
}

// ---- Ciclo 1: rubrica.json parseável com campos obrigatórios ----------------

describe("2.12 — rubrica.json campos obrigatórios", () => {
  it("é parseável como JSON e contém version, layout, theme e plugins", async () => {
    const { fs } = await runValidityCreate("cyberpunk", ["blog", "portfolio"]);

    const raw = await fs.readFile("/projects/meu-portfolio/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state).toHaveProperty("version");
    expect(typeof state.version).toBe("string");
    expect(state.version).toBeTruthy();

    expect(state).toHaveProperty("layout");
    expect(state.layout).toBe("cyberpunk");

    expect(state).toHaveProperty("theme");
    expect(typeof state.theme).toBe("string");

    expect(state).toHaveProperty("plugins");
    expect(typeof state.plugins).toBe("object");
    expect(state.plugins).not.toBeNull();
  });
});

// ---- Ciclo 2: rubrica.config.ts sintaticamente válido -----------------------

describe("2.12 — rubrica.config.ts sintaxe TypeScript", () => {
  it("é TypeScript sintaticamente válido com export const rubricalConfig", async () => {
    const { fs } = await runValidityCreate("cyberpunk", ["blog", "portfolio"]);

    const content = await fs.readFile("/projects/meu-portfolio/rubrica.config.ts", "utf-8");

    expect(content).toContain("export const rubricalConfig");

    // Verifica sintaxe via TypeScript AST parser
    const sourceFile = ts.createSourceFile(
      "rubrica.config.ts",
      content,
      ts.ScriptTarget.Latest,
      true
    );
    const syntaxErrors = sourceFile.parseDiagnostics as ts.Diagnostic[] | undefined;
    const errors = syntaxErrors?.filter(d => d.category === ts.DiagnosticCategory.Error) ?? [];
    expect(errors).toHaveLength(0);

    // Chaves balanceadas
    const openBraces = (content.match(/\{/g) ?? []).length;
    const closeBraces = (content.match(/\}/g) ?? []).length;
    expect(openBraces).toBe(closeBraces);
  });
});

// ---- Ciclo 3: index.html sem dados pessoais ---------------------------------

const PERSONAL_STRINGS = [
  "Matheus Mierzwa",
  "matheusmierzwa",
  "mmlo.com.br",
  "@matheusmierzwa",
];

describe("2.12 — index.html sem dados pessoais", () => {
  it("não contém strings pessoais do template original após create", async () => {
    // HTML injetado com dados pessoais reais do template pré-fase-1
    const { fs } = await runValidityCreate(
      "cyberpunk",
      ["blog"],
      { html: HTML_WITH_PERSONAL_DATA }
    );

    const html = await fs.readFile("/projects/meu-portfolio/index.html", "utf-8");

    for (const personal of PERSONAL_STRINGS) {
      expect(html).not.toContain(personal);
    }
  });

  it("substitui dados pessoais pelos valores informados nos prompts", async () => {
    const { fs } = await runValidityCreate(
      "cyberpunk",
      ["blog"],
      { html: HTML_WITH_PERSONAL_DATA }
    );

    const html = await fs.readFile("/projects/meu-portfolio/index.html", "utf-8");

    expect(html).toContain("Meu Portfólio");
    expect(html).toContain("https://meusite.com");
    expect(html).toContain("devexemplo");
    expect(html).toContain("Desenvolvedor Exemplo");
  });
});

// ---- Ciclo 4: plugins desmarcados com defaultEnabled: false -----------------

describe("2.12 — plugins desmarcados têm defaultEnabled: false", () => {
  it("payments e ai-resumes ficam como false quando não selecionados", async () => {
    const selectedPlugins = ["blog", "portfolio", "resume", "about", "contact-wizard"];
    const { fs } = await runValidityCreate(
      "cyberpunk",
      selectedPlugins,
      { registry: FULL_REGISTRY }
    );

    const registry = await fs.readFile(
      "/projects/meu-portfolio/convex/pluginRegistry.ts",
      "utf-8"
    );

    // Plugins selecionados devem ter defaultEnabled: true
    expect(registry).toMatch(/'blog'.*defaultEnabled:\s*true/s);
    expect(registry).toMatch(/'portfolio'.*defaultEnabled:\s*true/s);

    // Plugins não selecionados devem ter defaultEnabled: false
    expect(registry).toMatch(/'payments'.*defaultEnabled:\s*false/s);
    expect(registry).toMatch(/'ai-resumes'.*defaultEnabled:\s*false/s);
    expect(registry).toMatch(/'i18n'.*defaultEnabled:\s*false/s);
  });

  it("todos os plugins desmarcados têm defaultEnabled: false", async () => {
    // Seleciona apenas blog — todos os outros devem ficar false
    const { fs } = await runValidityCreate(
      "cyberpunk",
      ["blog"],
      { registry: FULL_REGISTRY }
    );

    const registry = await fs.readFile(
      "/projects/meu-portfolio/convex/pluginRegistry.ts",
      "utf-8"
    );

    const notSelected = [
      "contact-wizard",
      "proposals",
      "payments",
      "portfolio",
      "resume",
      "about",
      "ai-resumes",
      "audit-log",
      "media-manager",
      "i18n",
      "playground",
      "testimonials",
      "testimonials-intake",
    ];

    for (const pluginId of notSelected) {
      const pattern = new RegExp(`'${pluginId}'[^}]+defaultEnabled:\\s*false`);
      expect(registry, `plugin ${pluginId} deveria ser false`).toMatch(pattern);
    }
  });
});

// ---- Ciclo 5: arquivos de layout são TypeScript sintaticamente válidos -------

/**
 * Verifica sintaxe TypeScript de um arquivo real de template.
 * Usa `getSyntacticDiagnostics` que checa sintaxe sem resolver imports.
 */
function checkLayoutFileSyntax(filePath: string): { errors: number; messages: string[] } {
  const content = readFileSync(filePath, "utf-8");
  const fileName = filePath.split("/").pop() ?? filePath;

  const program = ts.createProgram([filePath], {
    noEmit: true,
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.Latest,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noResolve: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
  });

  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    return { errors: 1, messages: [`Não foi possível parsear ${fileName}`] };
  }

  const syntacticDiags = program.getSyntacticDiagnostics(sourceFile);
  const errors = syntacticDiags.filter(d => d.category === ts.DiagnosticCategory.Error);

  return {
    errors: errors.length,
    messages: errors.map(d =>
      typeof d.messageText === "string"
        ? d.messageText
        : d.messageText.messageText
    ),
  };
}

describe("2.12 — arquivos de layout são TypeScript sintaticamente válidos", () => {
  it("layout cyberpunk — src/components/Layout.tsx é válido", () => {
    const filePath = resolve(PROJECT_SRC_COMPONENTS, "Layout.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout cyberpunk — src/components/Sidebar.tsx é válido", () => {
    const filePath = resolve(PROJECT_SRC_COMPONENTS, "Sidebar.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout cyberpunk — templates/layouts/cyberpunk/Layout.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "cyberpunk/Layout.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout cyberpunk — templates/layouts/cyberpunk/Sidebar.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "cyberpunk/Sidebar.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — templates/layouts/brutalist/Layout.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/Layout.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — templates/layouts/brutalist/Navbar.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/Navbar.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — templates/layouts/swiss/Layout.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/Layout.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — templates/layouts/swiss/Sidebar.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/Sidebar.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — Sidebar.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/Sidebar.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com|SP·BR/);
    expect(content).not.toMatch(/["']\d{4}["']/);
    expect(content).toMatch(/contactInfo/);
  });

  it("layout magazine — templates/layouts/magazine/Layout.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/Layout.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — templates/layouts/magazine/Masthead.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/Masthead.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — Masthead.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/Masthead.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/contactInfo/);
  });

  it("layout magazine — pages/Home.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Home.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — pages/Home.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Home.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useHome/);
  });

  it("layout bento — pages/Home.tsx é sintaticamente válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Home.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout bento — pages/Home.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Home.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useHome/);
  });

  it("layout bento — pages/Resume.tsx é sintaticamente válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Resume.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout bento — pages/Resume.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Resume.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useResume/);
  });

  it("layout bento — pages/Portfolio.tsx é sintaticamente válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Portfolio.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout bento — pages/Portfolio.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Portfolio.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/usePortfolio/);
  });

  it("layout bento — pages/About.tsx é sintaticamente válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/About.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout bento — pages/About.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/About.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useAbout/);
  });

  it("layout bento — pages/Blog.tsx é sintaticamente válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Blog.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout bento — pages/Blog.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "bento/pages/Blog.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useBlogPosts/);
  });

  it("layout swiss — SwissShared.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/SwissShared.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — SwissShared.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/SwissShared.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com|SP·BR/);
    expect(content).toMatch(/useSiteConfig|useHome|useSidebar/);
  });

  it("layout swiss — pages/Home.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Home.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — pages/Home.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Home.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useHome|useResume/);
  });

  it("layout swiss — pages/Home.tsx usa array posicional de ícones (não mapeamento por ID Convex)", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Home.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/SERVICE_ICONS\[c\.id\]/);
    expect(content).toMatch(/SERVICE_ICONS\[i/);
  });

  it("layout magazine — pages/Resume.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Resume.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — pages/Resume.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Resume.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useResume/);
  });

  it("layout magazine — pages/Portfolio.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Portfolio.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — pages/Portfolio.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Portfolio.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/usePortfolio/);
  });

  it("layout magazine — pages/About.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/About.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — pages/About.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/About.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useAbout/);
  });

  it("layout magazine — pages/Blog.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Blog.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout magazine — pages/Blog.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "magazine/pages/Blog.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useBlogPosts/);
  });

  it("layout brutalist — pages/Home.tsx é válido TypeScript", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Home.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — pages/Home.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Home.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useHome/);
  });

  it("layout brutalist — pages/Resume.tsx é válido TypeScript", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Resume.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — pages/Resume.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Resume.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useResume/);
  });

  it("layout swiss — pages/Resume.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Resume.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — pages/Resume.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Resume.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useResume/);
  });

  it("layout swiss — pages/Resume.tsx renderiza descriptions HTML via dangerouslySetInnerHTML", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Resume.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/dangerouslySetInnerHTML/);
  });

  it("layout swiss — pages/Portfolio.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Portfolio.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — pages/Portfolio.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Portfolio.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/usePortfolio/);
  });

  it("layout brutalist — pages/Portfolio.tsx é válido TypeScript", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Portfolio.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — pages/Portfolio.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Portfolio.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/usePortfolio/);
  });

  it("layout brutalist — pages/About.tsx é válido TypeScript", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/About.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — pages/About.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/About.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useAbout/);
  });

  it("layout swiss — pages/About.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/About.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — pages/About.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/About.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useAbout/);
  });

  it("layout brutalist — pages/Blog.tsx é válido TypeScript", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Blog.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout brutalist — pages/Blog.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "brutalist/pages/Blog.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useBlogPosts/);
  });

  it("layout swiss — pages/Blog.tsx é válido", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Blog.tsx");
    const result = checkLayoutFileSyntax(filePath);
    expect(result.errors, result.messages.join(", ")).toBe(0);
  });

  it("layout swiss — pages/Blog.tsx não contém dados pessoais hardcoded", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Blog.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toMatch(/Matheus|Mierzwa|mierzwa\.com/);
    expect(content).toMatch(/useBlogPosts/);
  });

  it("layout swiss — pages/Blog.tsx formata datas em pt-BR (toLocaleDateString)", () => {
    const filePath = resolve(TEMPLATES_DIR, "swiss/pages/Blog.tsx");
    const content = readFileSync(filePath, "utf-8");
    expect(content).toMatch(/toLocaleDateString/);
  });
});
