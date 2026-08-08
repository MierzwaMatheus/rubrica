import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runUpdate } from "../commands/update.js";
import { applyLayout } from "../transforms/applyLayout.js";
import { applyTheme } from "../transforms/applyTheme.js";
import { applyFont } from "../transforms/applyFont.js";
import { applyPlugins } from "../transforms/applyPlugins.js";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";
import { readState } from "../state/readState.js";
import { writeState } from "../state/writeState.js";
import { checkRequiredEnv } from "../utils/checkRequiredEnv.js";

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { confirm, log } from "@clack/prompts";

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
    access: (path: string) =>
      vol.promises.access(path).then(() => undefined),
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

const BASE_STATE = {
  version: "1.0.0",
  layout: "cyberpunk" as const,
  theme: "midnight-blue",
  accentColor: "#ff5500" as string | null,
  fontSans: "Playfair Display",
  fontMono: "Fira Code",
  radius: "0.75rem",
  plugins: {
    blog: true,
    portfolio: true,
    resume: true,
    about: true,
    proposals: false,
    payments: false,
    "contact-wizard": true,
    "ai-resumes": false,
    "audit-log": true,
    "media-manager": false,
    i18n: false,
    playground: false,
    testimonials: true,
    "testimonials-intake": true,
  },
};

/** Cria um volume com estrutura completa de projeto rubrica */
function makeProjectVolume(state = BASE_STATE, extraFiles: Record<string, string> = {}) {
  const projectDir = "/project";
  const vol = Volume.fromJSON({
    [`${projectDir}/rubrica.json`]: JSON.stringify(state, null, 2),
    [`${projectDir}/src/index.css`]: MINIMAL_CSS,
    [`${projectDir}/index.html`]: MINIMAL_HTML,
    [`${projectDir}/convex/pluginRegistry.ts`]: MINIMAL_REGISTRY,
    [`${projectDir}/package.json`]: JSON.stringify({ name: "meu-portfolio" }),
    [`${projectDir}/templates/layouts/cyberpunk/Layout.tsx`]: "// cyberpunk Layout",
    [`${projectDir}/templates/layouts/cyberpunk/Sidebar.tsx`]: "// Sidebar",
    ...extraFiles,
  });
  return vol;
}

/** downloadRelease mock que simula nova versão populando templates no volume */
function makeDownloadMock(vol: InstanceType<typeof Volume>, requiredEnvContent?: string) {
  return vi.fn(async (projectDir: string, _version: string) => {
    const dirs = [
      `${projectDir}/templates/layouts/cyberpunk`,
    ];
    for (const dir of dirs) {
      vol.mkdirSync(dir, { recursive: true });
    }
    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Layout.tsx`, "// cyberpunk Layout v2");
    vol.writeFileSync(`${projectDir}/templates/layouts/cyberpunk/Sidebar.tsx`, "// Sidebar v2");

    if (requiredEnvContent !== undefined) {
      vol.writeFileSync(`${projectDir}/required-env.json`, requiredEnvContent);
    }
  });
}

type UpdateDeps = Parameters<typeof runUpdate>[0];

function makeUpdateDeps(
  vol: InstanceType<typeof Volume>,
  remoteVersion = "1.0.1",
  extraDeps: Partial<UpdateDeps> = {}
): UpdateDeps {
  const fs = makeFsModule(vol);
  return {
    cwd: "/project",
    fs,
    detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
    readState,
    writeState,
    getLatestVersion: vi.fn().mockResolvedValue(remoteVersion),
    downloadRelease: makeDownloadMock(vol),
    applyLayout,
    applyTheme,
    applyFont,
    applyPlugins,
    applyIndexHtml,
    applyRubricalConfig,
    checkRequiredEnv,
    exec: vi.fn().mockResolvedValue(undefined),
    ...extraDeps,
  };
}

// ---- Ciclo 1: rubrica.config.ts preserva valores visuais customizados --------

describe("update e2e — rubrica.config.ts preserva valores customizados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("após update, rubrica.config.ts contém fontes do state customizado", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol));

    const fs = makeFsModule(vol);
    const content = await fs.readFile("/project/rubrica.config.ts", "utf-8");

    expect(content).toContain('"Playfair Display"');
    expect(content).toContain('"Fira Code"');
  });

  it("rubrica.config.ts não contém valores pessoais do autor original após update", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol));

    const fs = makeFsModule(vol);
    const content = await fs.readFile("/project/rubrica.config.ts", "utf-8");

    expect(content).not.toContain("Matheus Mierzwa");
    expect(content).not.toContain("mmlo.com.br");
    expect(content).not.toContain("@matheusmierzwa");
  });
});

// ---- Ciclo 2: version atualizado, layout e theme preservados ----------------

describe("update e2e — rubrica.json version atualizado, configs preservados", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rubrica.json tem version=1.1.0 após update para 1.1.0", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol, "1.1.0"));

    const fs = makeFsModule(vol);
    const raw = await fs.readFile("/project/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state.version).toBe("1.1.0");
  });

  it("rubrica.json preserva layout e theme originais após update", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol, "1.1.0"));

    const fs = makeFsModule(vol);
    const raw = await fs.readFile("/project/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state.layout).toBe("cyberpunk");
    expect(state.theme).toBe("midnight-blue");
    expect(state.fontSans).toBe("Playfair Display");
    expect(state.fontMono).toBe("Fira Code");
    expect(state.radius).toBe("0.75rem");
  });
});

// ---- Ciclo 3: .env não modificado durante update ----------------------------

describe("update e2e — .env não é modificado", () => {
  beforeEach(() => vi.clearAllMocks());

  it(".env preservado integralmente após update", async () => {
    const envContent = "VITE_CONVEX_URL=https://minha-convex-url.convex.cloud\nCUSTOM_VAR=valor_custom\n";
    const vol = makeProjectVolume(BASE_STATE, {
      "/project/.env": envContent,
    });
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol));

    const fs = makeFsModule(vol);
    const after = await fs.readFile("/project/.env", "utf-8");

    expect(after).toBe(envContent);
  });

  it(".env.local preservado integralmente após update", async () => {
    const envLocalContent = "VITE_CONVEX_URL=https://local-convex.convex.cloud\nDEBUG=true\n";
    const vol = makeProjectVolume(BASE_STATE, {
      "/project/.env.local": envLocalContent,
    });
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol));

    const fs = makeFsModule(vol);
    const after = await fs.readFile("/project/.env.local", "utf-8");

    expect(after).toBe(envLocalContent);
  });
});

// ---- Ciclo 4: update de versão major sem confirmação = sem alterações --------

describe("update e2e — versão major cancelada não altera arquivos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("downloadRelease não é chamado quando major version é cancelada", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(false);

    const downloadMock = makeDownloadMock(vol);
    const applyLayoutMock = vi.fn();

    await runUpdate(
      makeUpdateDeps(vol, "2.0.0", {
        downloadRelease: downloadMock,
        applyLayout: applyLayoutMock,
      })
    );

    expect(downloadMock).not.toHaveBeenCalled();
    expect(applyLayoutMock).not.toHaveBeenCalled();
  });

  it("rubrica.json mantém version=1.0.0 quando major update é cancelado", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(false);

    await runUpdate(makeUpdateDeps(vol, "2.0.0"));

    const fs = makeFsModule(vol);
    const raw = await fs.readFile("/project/rubrica.json", "utf-8");
    const state = JSON.parse(raw) as Record<string, unknown>;

    expect(state.version).toBe("1.0.0");
  });
});

// ---- Ciclo 5: rubrica.config.ts gerado é TypeScript sintaticamente válido ---

describe("update e2e — rubrica.config.ts gerado após patch é TypeScript válido", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rubrica.config.ts contém export const rubricalConfig com campos obrigatórios", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol, "1.0.1"));

    const fs = makeFsModule(vol);
    const content = await fs.readFile("/project/rubrica.config.ts", "utf-8");

    expect(content).toContain("export const rubricalConfig");
    expect(content).toContain("fontSans:");
    expect(content).toContain("fontMono:");
    expect(content).toMatch(/^export const rubricalConfig = \{/m);
  });

  it("rubrica.json gerado após update é JSON parseável com campos obrigatórios", async () => {
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await runUpdate(makeUpdateDeps(vol, "1.0.1"));

    const fs = makeFsModule(vol);
    const raw = await fs.readFile("/project/rubrica.json", "utf-8");

    let state: Record<string, unknown>;
    expect(() => { state = JSON.parse(raw); }).not.toThrow();

    state = JSON.parse(raw) as Record<string, unknown>;
    expect(state.version).toBeTruthy();
    expect(state.layout).toBeTruthy();
    expect(state.theme).toBeTruthy();
    expect(state.plugins).toBeTruthy();
  });
});

// ---- Ciclo 6: required-env.json com vars faltantes aparece no output --------

describe("update e2e — required-env.json lista vars faltantes no output", () => {
  beforeEach(() => vi.clearAllMocks());

  it("OPENROUTER_API_KEY aparece no warning quando ausente do .env", async () => {
    const requiredEnvJson = JSON.stringify([
      { name: "OPENROUTER_API_KEY", description: "Chave da API do OpenRouter para geração de CV com IA" },
    ]);
    const vol = makeProjectVolume();
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const downloadMock = makeDownloadMock(vol, requiredEnvJson);

    await runUpdate(makeUpdateDeps(vol, "1.0.1", { downloadRelease: downloadMock }));

    expect(vi.mocked(log.warn)).toHaveBeenCalledWith(
      expect.stringContaining("OPENROUTER_API_KEY")
    );
  });

  it("OPENROUTER_API_KEY não aparece no warning quando já está no .env", async () => {
    const requiredEnvJson = JSON.stringify([
      { name: "OPENROUTER_API_KEY", description: "Chave da API do OpenRouter" },
    ]);
    const vol = makeProjectVolume(BASE_STATE, {
      "/project/.env": "OPENROUTER_API_KEY=sk-or-v1-abc123\n",
    });
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const downloadMock = makeDownloadMock(vol, requiredEnvJson);

    await runUpdate(makeUpdateDeps(vol, "1.0.1", { downloadRelease: downloadMock }));

    const warnCalls = vi.mocked(log.warn).mock.calls.flat().join(" ");
    expect(warnCalls).not.toContain("OPENROUTER_API_KEY");
  });
});
