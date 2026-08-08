import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runUpdate } from "../commands/update.js";

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
  };
}

const BASE_STATE = {
  version: "1.0.0",
  layout: "cyberpunk" as const,
  theme: "cyberpunk",
  accentColor: null,
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true },
};

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { confirm, cancel, log } from "@clack/prompts";

// ---- Ciclo 1: versão local igual à remota → nenhum arquivo modificado ------

describe("runUpdate — versão já atualizada", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não chama nenhum transform quando versão local já é igual à remota", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.0.0");
    const downloadReleaseMock = vi.fn();
    const applyLayoutMock = vi.fn();
    const applyThemeMock = vi.fn();
    const applyFontMock = vi.fn();
    const applyPluginsMock = vi.fn();
    const applyIndexHtmlMock = vi.fn();
    const applyRubricalConfigMock = vi.fn();
    const writeStateMock = vi.fn();

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    expect(downloadReleaseMock).not.toHaveBeenCalled();
    expect(applyLayoutMock).not.toHaveBeenCalled();
    expect(applyThemeMock).not.toHaveBeenCalled();
    expect(applyFontMock).not.toHaveBeenCalled();
    expect(applyPluginsMock).not.toHaveBeenCalled();
    expect(applyIndexHtmlMock).not.toHaveBeenCalled();
    expect(applyRubricalConfigMock).not.toHaveBeenCalled();
    expect(writeStateMock).not.toHaveBeenCalled();
  });
});

// ---- Ciclo 2: território do usuário nunca sobrescrito diretamente ----------

describe("runUpdate — preservação do território do usuário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(confirm).mockResolvedValue(true);
  });

  it("não chama fs.writeFile em arquivos de território do usuário diretamente", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);
    const writeFileSpy = vi.spyOn(fs, "writeFile");

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.1.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    const userTerritory = [
      "rubrica.config.ts",
      "rubrica.json",
      ".env",
      ".env.local",
    ];

    for (const [callPath] of writeFileSpy.mock.calls) {
      for (const file of userTerritory) {
        expect(callPath).not.toMatch(new RegExp(`${file.replace(".", "\\.")}$`));
      }
    }
  });
});

// ---- Ciclo 3: applyRubricalConfig re-aplicado após update ------------------

describe("runUpdate — re-aplicação de applyRubricalConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(confirm).mockResolvedValue(true);
  });

  it("chama applyRubricalConfig após baixar nova versão", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.1.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    expect(downloadReleaseMock).toHaveBeenCalled();
    expect(applyRubricalConfigMock).toHaveBeenCalled();
  });
});

// ---- Ciclo 4: applyLayout re-aplicado após update --------------------------

describe("runUpdate — re-aplicação de applyLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(confirm).mockResolvedValue(true);
  });

  it("chama applyLayout com o layout do rubrica.json após update", async () => {
    const stateCyberpunk = { ...BASE_STATE, layout: "cyberpunk" as const };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(stateCyberpunk),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(stateCyberpunk);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.1.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    expect(applyLayoutMock).toHaveBeenCalled();
    const [layoutArg] = applyLayoutMock.mock.calls[0];
    expect(layoutArg).toBe("cyberpunk");
  });
});

// ---- Ciclo 5: versão major exige confirmação explícita ---------------------

describe("runUpdate — atualização major exige confirmação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama confirm com mensagem contendo 'major' quando major muda", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    vi.mocked(confirm).mockResolvedValue(true);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("2.0.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    const confirmCalls = vi.mocked(confirm).mock.calls;
    const hasMajorConfirm = confirmCalls.some(([opts]) =>
      typeof opts === "object" && opts !== null &&
      "message" in opts &&
      /major/i.test(String((opts as { message: string }).message))
    );
    expect(hasMajorConfirm).toBe(true);
  });
});

// ---- Ciclo 5 (integração): checkRequiredEnv integrado no update.ts ---------

describe("runUpdate — exibe vars faltantes via checkRequiredEnv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(confirm).mockResolvedValue(true);
  });

  it("exibe OPENROUTER_API_KEY no output quando faltante no .env após update", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.1.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);
    const checkRequiredEnvMock = vi.fn().mockResolvedValue([
      { name: "OPENROUTER_API_KEY", description: "Chave OpenRouter" },
    ]);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
      checkRequiredEnv: checkRequiredEnvMock,
    });

    const warnCalls = vi.mocked(log.warn).mock.calls;
    const hasApiKey = warnCalls.some(([msg]) =>
      typeof msg === "string" && msg.includes("OPENROUTER_API_KEY")
    );
    expect(hasApiKey).toBe(true);
  });

  it("não exibe aviso de vars faltantes quando required-env.json está vazio", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("1.1.0");
    const downloadReleaseMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);
    const checkRequiredEnvMock = vi.fn().mockResolvedValue([]);

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
      checkRequiredEnv: checkRequiredEnvMock,
    });

    const warnCalls = vi.mocked(log.warn).mock.calls;
    const hasEnvWarning = warnCalls.some(([msg]) =>
      typeof msg === "string" && msg.toLowerCase().includes("variáveis")
    );
    expect(hasEnvWarning).toBe(false);
  });
});

// ---- Ciclo 6: versão major cancelada → nenhum arquivo alterado -------------

describe("runUpdate — cancelamento de atualização major", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não chama nenhum transform quando major é cancelado", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);

    vi.mocked(confirm).mockResolvedValue(false);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(BASE_STATE);
    const getLatestVersionMock = vi.fn().mockResolvedValue("2.0.0");
    const downloadReleaseMock = vi.fn();
    const applyLayoutMock = vi.fn();
    const applyThemeMock = vi.fn();
    const applyFontMock = vi.fn();
    const applyPluginsMock = vi.fn();
    const applyIndexHtmlMock = vi.fn();
    const applyRubricalConfigMock = vi.fn();
    const writeStateMock = vi.fn();

    await runUpdate({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      readState: readStateMock,
      getLatestVersion: getLatestVersionMock,
      downloadRelease: downloadReleaseMock,
      applyLayout: applyLayoutMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyPlugins: applyPluginsMock,
      applyIndexHtml: applyIndexHtmlMock,
      applyRubricalConfig: applyRubricalConfigMock,
      writeState: writeStateMock,
    });

    expect(downloadReleaseMock).not.toHaveBeenCalled();
    expect(applyLayoutMock).not.toHaveBeenCalled();
    expect(applyThemeMock).not.toHaveBeenCalled();
    expect(applyFontMock).not.toHaveBeenCalled();
    expect(applyPluginsMock).not.toHaveBeenCalled();
    expect(applyIndexHtmlMock).not.toHaveBeenCalled();
    expect(applyRubricalConfigMock).not.toHaveBeenCalled();
    expect(writeStateMock).not.toHaveBeenCalled();
    expect(vi.mocked(cancel)).toHaveBeenCalled();
  });
});
