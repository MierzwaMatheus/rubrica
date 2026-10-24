import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runConfig } from "../commands/config.js";

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

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn().mockResolvedValue("cyberpunk"),
  multiselect: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { multiselect, select, text, confirm } from "@clack/prompts";

/**
 * Enfileira as respostas da seção Aparência, na ordem em que o config pergunta:
 * esquema → modo de cor → (confirm alternância) → textura → fonte principal → fonte mono.
 */
function mockAppearancePrompts(opts: {
  theme: string;
  fontSans: string;
  fontMono?: string;
  colorMode?: string;
  colorModeToggle?: boolean;
  texture?: string;
}) {
  const chain = vi.mocked(select)
    .mockResolvedValueOnce(opts.theme)
    .mockResolvedValueOnce(opts.colorMode ?? "dark")
    .mockResolvedValueOnce(opts.texture ?? "none")
    .mockResolvedValueOnce(opts.fontSans);
  if (opts.fontMono !== undefined) chain.mockResolvedValueOnce(opts.fontMono);
  vi.mocked(confirm).mockResolvedValueOnce(opts.colorModeToggle ?? false);
}

// ---- Ciclo 1: Estrutura básica + erro fora de projeto Rubrica ---------------

describe("runConfig — detecção de projeto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(multiselect).mockResolvedValue([]);
  });

  it("lança erro amigável quando rubrica.json não existe em nenhum ancestral", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockRejectedValue(
      new Error('detectProject: nenhum rubrica.json encontrado em "/some/dir" nem em nenhum diretório ancestral.')
    );

    await expect(
      runConfig({ cwd: "/some/dir", detectProject: detectProjectMock, fs })
    ).rejects.toThrow(/rubrica\.json/);

    expect(detectProjectMock).toHaveBeenCalledWith("/some/dir", expect.anything());
  });

  it("não lança erro quando rubrica.json existe no diretório atual", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      runConfig({
        cwd: "/project",
        detectProject: detectProjectMock,
        readState: readStateMock,
        writeState: writeStateMock,
        fs,
      })
    ).resolves.not.toThrow();

    expect(detectProjectMock).toHaveBeenCalledWith("/project", expect.anything());
  });
});

// ---- Ciclo 2: Leitura do estado atual ---------------------------------------

describe("runConfig — leitura do estado atual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(multiselect).mockResolvedValue([]);
  });

  it("lê rubrica.json via readState após detectar o projeto", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      fs,
    });

    expect(readStateMock).toHaveBeenCalledWith("/project", expect.anything());
  });
});

// ---- Ciclo 3: Prompt multi-select de seções ---------------------------------

describe("runConfig — prompt multi-select de seções", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe multi-select com as 4 opções de reconfiguração", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce([]);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      fs,
    });

    expect(multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "identity" }),
          expect.objectContaining({ value: "appearance" }),
          expect.objectContaining({ value: "layout" }),
          expect.objectContaining({ value: "plugins" }),
        ]),
      })
    );
  });
});

// ---- Ciclo 4: Re-configuração de Identidade ---------------------------------

describe("runConfig — identidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama identityPrompt e applyRubricalConfig quando Identidade selecionada", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["identity"]);

    const identityData = { siteName: "Novo Site", siteUrl: "https://novo.com", siteDescription: "desc", authorName: "Autor", authorEmail: "a@b.com", twitterHandle: "", lang: "pt-BR" as const };
    const identityPromptMock = vi.fn().mockResolvedValue(identityData);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      identityPrompt: identityPromptMock,
      applyRubricalConfig: applyRubricalConfigMock,
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    expect(identityPromptMock).toHaveBeenCalledTimes(1);
    // SEO, RSS e imagem de compartilhamento derivam da identidade, como no create.
    expect(applyRubricalConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({ siteName: "Novo Site", seoHomeTitle: "Novo Site", rssTitle: "Novo Site", ogImageUrl: "https://novo.com/og.png" }),
      "/project",
      expect.anything()
    );
    expect(applyIndexHtmlMock).toHaveBeenCalledWith(
      expect.objectContaining({ siteName: "Novo Site", siteUrl: "https://novo.com", authorName: "Autor" }),
      "/project/index.html",
      expect.anything()
    );
    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({ identity: identityData }),
      expect.anything()
    );
  });
});

// ---- Ciclo 5: Re-configuração de Aparência ----------------------------------

describe("runConfig — aparência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyTheme, applyFont e applyIndexHtml quando Aparência selecionada", async () => {
    const identity = { siteName: "Ana Dev", siteUrl: "https://ana.dev", siteDescription: "d", authorName: "Ana", authorEmail: "a@a.dev", twitterHandle: "ana", lang: "pt-BR" };
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {}, identity };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({
      theme: "editorial-cream",
      colorMode: "light",
      colorModeToggle: true,
      texture: "paper",
      fontSans: "Inter",
      fontMono: "JetBrains Mono",
    });

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyAppearanceMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyAppearance: applyAppearanceMock,
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    expect(applyThemeMock).toHaveBeenCalledWith({ preset: "editorial-cream" }, "/project/src/index.css", expect.anything());
    expect(applyAppearanceMock).toHaveBeenCalledWith(
      { colorMode: "light", colorModeToggle: true, texture: "paper" },
      "/project/index.html",
      expect.anything()
    );
    expect(applyFontMock).toHaveBeenCalledTimes(1);
    // Troca só a fonte: as meta tags continuam com a identidade salva, não em branco.
    expect(applyIndexHtmlMock).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: "Inter", fontMono: "JetBrains Mono", siteName: "Ana Dev", siteUrl: "https://ana.dev", authorName: "Ana" }),
      "/project/index.html",
      expect.anything()
    );
  });

  it("sem identidade salva, não regrava as meta tags do index.html", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono" });
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      readState: vi.fn().mockResolvedValue(state),
      writeState: vi.fn().mockResolvedValue(undefined),
      applyTheme: vi.fn().mockResolvedValue(undefined),
      applyFont: vi.fn().mockResolvedValue(undefined),
      applyAppearance: vi.fn().mockResolvedValue(undefined),
      applyIndexHtml: applyIndexHtmlMock,
      fs: makeFsModule(vol),
    });

    expect(applyIndexHtmlMock).not.toHaveBeenCalled();
  });

  it("usa valores atuais do estado como defaults nos prompts de aparência", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Playfair Display", fontMono: "Fira Code", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "editorial-cream", fontSans: "Playfair Display", fontMono: "Fira Code" });

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyAppearance: vi.fn().mockResolvedValue(undefined),
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    // Verifica que o select de tema foi chamado com o tema atual como initialValue
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: "editorial-cream" })
    );
  });
});

// ---- Ciclo 5b: novas fontes e hints no config --------------------------------

describe("runConfig — novas fontes e hints descritivos", () => {
  function makeConfigDeps(vol: ReturnType<typeof Volume.fromJSON>) {
    const fs = makeFsModule(vol);
    return {
      cwd: "/project",
      fs,
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      readState: vi.fn().mockResolvedValue({ version: "1.0.0", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} }),
      writeState: vi.fn().mockResolvedValue(undefined),
      applyTheme: vi.fn().mockResolvedValue(undefined),
      applyFont: vi.fn().mockResolvedValue(undefined),
      applyAppearance: vi.fn().mockResolvedValue(undefined),
      applyIndexHtml: vi.fn().mockResolvedValue(undefined),
    };
  }

  it("novas fontes aparecem nas opções de fontSans do config", async () => {
    vi.clearAllMocks();
    const vol = Volume.fromJSON({ "/project/rubrica.json": "{}", "/project/src/index.css": "", "/project/index.html": "" });
    const deps = makeConfigDeps(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "editorial-cream", fontSans: "Bodoni Moda", fontMono: "JetBrains Mono" });

    await runConfig(deps);

    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "Bodoni Moda" }),
          expect.objectContaining({ value: "IBM Plex Serif" }),
          expect.objectContaining({ value: "Manrope" }),
          expect.objectContaining({ value: "Archivo" }),
        ]),
      })
    );
  });

  it("select de esquema de cores no config tem hints descritivos", async () => {
    vi.clearAllMocks();
    const vol = Volume.fromJSON({ "/project/rubrica.json": "{}", "/project/src/index.css": "", "/project/index.html": "" });
    const deps = makeConfigDeps(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono" });

    await runConfig(deps);

    const themeCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Esquema de cores"
    );
    expect(themeCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "editorial-cream", hint: expect.any(String) }),
          expect.objectContaining({ value: "midnight-blue", hint: expect.any(String) }),
        ]),
      })
    );
  });

  it("select de fontMono no config tem hints descritivos", async () => {
    vi.clearAllMocks();
    const vol = Volume.fromJSON({ "/project/rubrica.json": "{}", "/project/src/index.css": "", "/project/index.html": "" });
    const deps = makeConfigDeps(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono" });

    await runConfig(deps);

    const fontMonoCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte mono"
    );
    expect(fontMonoCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "JetBrains Mono", hint: expect.any(String) }),
        ]),
      })
    );
  });
});

describe("runConfig — aparência em layout sem fonte mono", () => {
  it("não pergunta a fonte mono quando o layout atual é swiss e grava fontMono vazio", async () => {
    vi.clearAllMocks();
    const state = { version: "1.0.0", layout: "swiss", theme: "paper-noir", fontSans: "Archivo", fontMono: "", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({ theme: "paper-noir", fontSans: "Archivo" });
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      readState: vi.fn().mockResolvedValue(state),
      writeState: writeStateMock,
      applyTheme: vi.fn().mockResolvedValue(undefined),
      applyFont: vi.fn().mockResolvedValue(undefined),
      applyAppearance: vi.fn().mockResolvedValue(undefined),
      applyIndexHtml: vi.fn().mockResolvedValue(undefined),
    });

    const monoCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte mono"
    );
    expect(monoCall).toBeUndefined();
    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({ fontSans: "Archivo", fontMono: "" }),
      expect.anything()
    );
  });
});

// ---- Ciclo 6: Re-configuração de Layout (com aviso) -------------------------

describe("runConfig — layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyLayout quando Layout selecionado e usuário confirma", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      downloadRelease: vi.fn().mockResolvedValue(undefined),
      fs,
    });

    expect(applyLayoutMock).toHaveBeenCalledWith(
      "cyberpunk",
      expect.anything(),
      expect.anything()
    );
  });

  it("não chama applyLayout quando usuário cancela confirmação", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(false);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      downloadRelease: vi.fn().mockResolvedValue(undefined),
      fs,
    });

    expect(applyLayoutMock).not.toHaveBeenCalled();
  });

  it("select de layout inclui opção bento com hint descritivo", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(false);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      fs,
    });

    const layoutCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Layout"
    );
    expect(layoutCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "bento", hint: expect.any(String) }),
        ]),
      })
    );
  });

  it("chama applyLayout com bento quando selecionado e usuário confirma", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("bento");
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      downloadRelease: vi.fn().mockResolvedValue(undefined),
      fs,
    });

    expect(applyLayoutMock).toHaveBeenCalledWith(
      "bento",
      expect.anything(),
      expect.anything()
    );
  });
});

// ---- Ciclo 7: Re-configuração de Plugins ------------------------------------

describe("runConfig — plugins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyPlugins com o novo mapa quando Plugins selecionado", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: { blog: true, portfolio: true, resume: false } };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect)
      .mockResolvedValueOnce(["plugins"])   // seleção de seções
      .mockResolvedValueOnce(["blog"]);     // seleção de plugins (só blog ativo)

    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyPlugins: applyPluginsMock,
      fs,
    });

    expect(applyPluginsMock).toHaveBeenCalledWith(
      expect.objectContaining({ blog: true, portfolio: false, resume: false }),
      expect.any(String),
      expect.anything()
    );
  });

  it("usa plugins ativos atuais como initialValues no multi-select", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: { blog: true, portfolio: false, resume: true } };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect)
      .mockResolvedValueOnce(["plugins"])
      .mockResolvedValueOnce(["blog", "resume"]);

    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyPlugins: applyPluginsMock,
      fs,
    });

    // O segundo multiselect deve ter initialValues com os plugins ativos atuais
    expect(multiselect).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        initialValues: expect.arrayContaining(["blog", "resume"]),
      })
    );
  });
});

// ---- Ciclo 8: Persistência em rubrica.json ----------------------------------

describe("runConfig — persistência em rubrica.json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama writeState com o layout atualizado após trocar layout", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk" as const, theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      downloadRelease: vi.fn().mockResolvedValue(undefined),
      fs,
    });

    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({ layout: "cyberpunk"}),
      expect.anything()
    );
  });

  it("chama writeState com tema e fontes atualizados após trocar aparência", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    mockAppearancePrompts({
      theme: "midnight-blue",
      colorMode: "system",
      colorModeToggle: true,
      texture: "grain",
      fontSans: "DM Sans",
      fontMono: "IBM Plex Mono",
    });

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyAppearance: vi.fn().mockResolvedValue(undefined),
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({
        theme: "midnight-blue",
        colorMode: "system",
        colorModeToggle: true,
        texture: "grain",
        fontSans: "DM Sans",
        fontMono: "IBM Plex Mono",
      }),
      expect.anything()
    );
  });
});

describe("runConfig — layout em projeto criado pelo CLI (sem templates/)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("baixa os layouts da versão do projeto e aplica a partir deles", async () => {
    const state = { version: "0.3.18", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("magazine");
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const downloadMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      readState: vi.fn().mockResolvedValue(state),
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      downloadRelease: downloadMock,
      fs: makeFsModule(vol),
    });

    expect(downloadMock).toHaveBeenCalledWith(expect.any(String), "v0.3.18");
    const tmpDir = downloadMock.mock.calls[0]![0] as string;
    expect(applyLayoutMock).toHaveBeenCalledWith(
      "magazine",
      { projectDir: "/project", templatesDir: `${tmpDir}/templates` },
      expect.anything()
    );
    expect(writeStateMock).toHaveBeenCalledWith("/project", expect.objectContaining({ layout: "magazine" }), expect.anything());
  });

  it("usa a pasta templates/ local quando ela existe", async () => {
    const state = { version: "0.3.18", layout: "cyberpunk", theme: "editorial-cream", fontSans: "Inter", fontMono: "JetBrains Mono", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state), "/project/templates/layouts/bento/Layout.tsx": "x" });
    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("bento");
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const downloadMock = vi.fn().mockResolvedValue(undefined);
    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      readState: vi.fn().mockResolvedValue(state),
      writeState: vi.fn().mockResolvedValue(undefined),
      applyLayout: applyLayoutMock,
      downloadRelease: downloadMock,
      fs: makeFsModule(vol),
    });

    expect(downloadMock).not.toHaveBeenCalled();
    expect(applyLayoutMock).toHaveBeenCalledWith("bento", { projectDir: "/project", templatesDir: "/project/templates" }, expect.anything());
  });
});
