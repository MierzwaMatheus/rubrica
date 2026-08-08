import { describe, it, expect, vi } from "vitest";
import { Volume } from "memfs";
import { runCreate, validateProjectName } from "../commands/create.js";

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
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import { select, text, multiselect, confirm } from "@clack/prompts";

const DEFAULT_PLUGINS = { blog: true, portfolio: true };

/** Configura a sequência de respostas dos prompts */
const NO_MONO_LAYOUTS = new Set(["swiss"]);

function setupPrompts(opts: {
  layout?: string;
  theme?: string;
  fontSans?: string;
  fontMono?: string;
  plugins?: string[];
  packageManager?: string;
}) {
  const layout = opts.layout ?? "cyberpunk";
  const hasMono = !NO_MONO_LAYOUTS.has(layout);
  const mock = vi.mocked(select)
    .mockResolvedValueOnce(layout)
    .mockResolvedValueOnce(opts.theme ?? "editorial-cream")
    .mockResolvedValueOnce(opts.fontSans ?? "Inter");
  if (hasMono) {
    mock.mockResolvedValueOnce(opts.fontMono ?? "JetBrains Mono");
  }
  mock.mockResolvedValueOnce(opts.packageManager ?? "none");
  vi.mocked(multiselect).mockResolvedValueOnce(opts.plugins ?? ["blog", "portfolio"]);
}

/** Cria download mock que popula o volume */
function makeDownloadMock(vol: InstanceType<typeof Volume>, extraDirs: string[] = []) {
  return vi.fn(async (targetDir: string, _version: string) => {
    const fs = makeFsModule(vol);
    await fs.mkdir(`${targetDir}/src`, { recursive: true });
    await fs.mkdir(`${targetDir}/templates`, { recursive: true });
    await fs.writeFile(`${targetDir}/src/index.css`, ":root{}\n.dark{}");
    await fs.writeFile(`${targetDir}/index.html`, "<!DOCTYPE html><html></html>");
    await fs.writeFile(`${targetDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    for (const dir of extraDirs) {
      await fs.mkdir(`${targetDir}/${dir}`, { recursive: true });
      await fs.writeFile(`${targetDir}/${dir}/.keep`, "");
    }
  });
}

// ---- mocks de transforms (injetados via DI) ---------------------------------

const mockApplyLayout = vi.fn(async () => undefined);
const mockApplyTheme = vi.fn(async () => undefined);
const mockApplyFont = vi.fn(async () => undefined);
const mockApplyPlugins = vi.fn(async () => undefined);
const mockApplyIndexHtml = vi.fn(async () => undefined);
const mockApplyRubricalConfig = vi.fn(async () => undefined);
const mockIdentityPrompt = vi.fn(async () => ({
  siteName: "Test Site",
  siteUrl: "https://test.com",
  siteDescription: "A test site",
  authorName: "Test Author",
  authorEmail: "test@test.com",
  twitterHandle: "testhandle",
  lang: "pt-BR",
}));

type Deps = Parameters<typeof runCreate>[1];

function makeDefaultDeps(vol: InstanceType<typeof Volume>, extraDirs?: string[]): Deps {
  return {
    projectsDir: "/projects",
    fs: makeFsModule(vol),
    download: makeDownloadMock(vol, extraDirs) as Deps["download"],
    getLatestVersion: vi.fn(async () => "v0.1.0") as Deps["getLatestVersion"],
    applyLayout: mockApplyLayout as Deps["applyLayout"],
    applyTheme: mockApplyTheme as Deps["applyTheme"],
    applyFont: mockApplyFont as Deps["applyFont"],
    applyPlugins: mockApplyPlugins as Deps["applyPlugins"],
    applyIndexHtml: mockApplyIndexHtml as Deps["applyIndexHtml"],
    applyRubricalConfig: mockApplyRubricalConfig as Deps["applyRubricalConfig"],
    identityPrompt: mockIdentityPrompt as Deps["identityPrompt"],
  };
}

/** Helper: limpa mocks e chama runCreate com deps injetáveis */
async function callRunCreate(opts: {
  layout?: string;
  theme?: string;
  accentColor?: string;
  fontSans?: string;
  fontMono?: string;
  radius?: string;
  plugins?: string[];
}) {
  vi.clearAllMocks();
  setupPrompts(opts);

  const vol = Volume.fromJSON({});
  vol.mkdirSync("/projects", { recursive: true });
  const deps = makeDefaultDeps(vol);

  await runCreate("meu-portfolio", deps);

  return { mockApplyLayout, mockApplyTheme, mockApplyFont, mockApplyPlugins, mockApplyIndexHtml, mockApplyRubricalConfig };
}

// ---- Ciclo 1: validação do nome do projeto ----------------------------------

describe("create — validação do nome do projeto", () => {
  it("nome com espaços lança erro descritivo", () => {
    expect(() => validateProjectName("meu portfolio")).toThrow(/espaços/);
  });

  it("nome com caracteres especiais lança erro descritivo", () => {
    expect(() => validateProjectName("meu@portfolio!")).toThrow(/caracteres especiais/);
  });

  it("nome válido é aceito sem lançar erro", () => {
    expect(() => validateProjectName("meu-portfolio")).not.toThrow();
    expect(() => validateProjectName("portfolio_v2")).not.toThrow();
    expect(() => validateProjectName("meuPortfolio")).not.toThrow();
  });
});

// ---- Ciclo 2: download e remoção de templates/ e cli/ ----------------------

describe("create — download e limpeza do projeto extraído", () => {
  it("chama downloadRelease com o diretório do projeto", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeDefaultDeps(vol);

    await runCreate("meu-portfolio", deps);

    expect(deps.download).toHaveBeenCalledWith("/projects/meu-portfolio", expect.anything());
  });

  it("remove a pasta templates/ do projeto extraído após o uso dos templates", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeDefaultDeps(vol, ["templates/layouts/cyberpunk"]);

    await runCreate("meu-portfolio", deps);

    expect(await (deps.fs as ReturnType<typeof makeFsModule>).exists("/projects/meu-portfolio/templates")).toBe(false);
  });

  it("remove a pasta cli/ do projeto extraído após download", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeDefaultDeps(vol, ["cli", "templates"]);

    await runCreate("meu-portfolio", deps);

    expect(await (deps.fs as ReturnType<typeof makeFsModule>).exists("/projects/meu-portfolio/cli")).toBe(false);
  });
});

// ---- Ciclo 3: applyLayout --------------------------------------------------

describe("create — applyLayout", () => {
  it("chama applyLayout com layout cyberpunk quando selecionado nos prompts", async () => {
    const { mockApplyLayout } = await callRunCreate({ layout: "cyberpunk" });
    expect(mockApplyLayout).toHaveBeenCalledWith(
      "cyberpunk",
      expect.objectContaining({ projectDir: "/projects/meu-portfolio" }),
      expect.anything()
    );
  });

  it("chama applyLayout com layout bento quando selecionado nos prompts", async () => {
    const { mockApplyLayout } = await callRunCreate({ layout: "bento" });
    expect(mockApplyLayout).toHaveBeenCalledWith(
      "bento",
      expect.objectContaining({ projectDir: "/projects/meu-portfolio" }),
      expect.anything()
    );
  });

  it("select de layout inclui opção bento com hint descritivo", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
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

  it("select de layout inclui opção magazine com hint descritivo", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const layoutCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Layout"
    );
    expect(layoutCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "magazine", hint: expect.any(String) }),
        ]),
      })
    );
  });

  it("chama applyLayout com layout magazine quando selecionado nos prompts", async () => {
    const { mockApplyLayout } = await callRunCreate({ layout: "magazine" });
    expect(mockApplyLayout).toHaveBeenCalledWith(
      "magazine",
      expect.objectContaining({ projectDir: "/projects/meu-portfolio" }),
      expect.anything()
    );
  });
});

// ---- Ciclo 4: applyTheme ---------------------------------------------------

describe("create — applyTheme", () => {
  it("chama applyTheme com preset editorial-cream quando selecionado", async () => {
    const { mockApplyTheme } = await callRunCreate({ theme: "editorial-cream" });
    expect(mockApplyTheme).toHaveBeenCalledWith(
      { preset: "editorial-cream" },
      "/projects/meu-portfolio/src/index.css",
      expect.anything()
    );
  });

  it("chama applyTheme com preset midnight-blue quando selecionado", async () => {
    const { mockApplyTheme } = await callRunCreate({ theme: "midnight-blue" });
    expect(mockApplyTheme).toHaveBeenCalledWith(
      { preset: "midnight-blue" },
      "/projects/meu-portfolio/src/index.css",
      expect.anything()
    );
  });

  it("não chama text para cor personalizada — opção custom foi removida", async () => {
    const { mockApplyTheme } = await callRunCreate({ theme: "paper-noir" });
    expect(vi.mocked(text)).not.toHaveBeenCalled();
    expect(mockApplyTheme).toHaveBeenCalledWith(
      { preset: "paper-noir" },
      expect.anything(),
      expect.anything()
    );
  });
});

// ---- Ciclo 4b: hints descritivos em temas e layout -------------------------

describe("create — hints descritivos nos selects de tema e layout", () => {
  it("select de tema tem hint descritivo nas opções", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const themeCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Tema visual"
    );
    expect(themeCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "editorial-cream", hint: expect.any(String) }),
          expect.objectContaining({ value: "paper-noir", hint: expect.any(String) }),
          expect.objectContaining({ value: "midnight-blue", hint: expect.any(String) }),
          expect.objectContaining({ value: "solar-warm", hint: expect.any(String) }),
        ]),
      })
    );
  });

  it("select de layout tem hint descritivo nas opções", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const layoutCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Layout"
    );
    expect(layoutCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "cyberpunk", hint: expect.any(String) }),
        ]),
      })
    );
  });

  it("select de layout inclui opção swiss com hint descritivo", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const layoutCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Layout"
    );
    expect(layoutCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "swiss", hint: expect.any(String) }),
        ]),
      })
    );
  });
});

// ---- Ciclo 5: applyFont ----------------------------------------------------

describe("create — hints descritivos nas fontes (sans e mono)", () => {
  it("todas as opções de fontMono têm hint descritivo", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontMonoCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte mono"
    );
    const options = (fontMonoCall?.[0] as { options?: Array<{ value: string; hint?: string }> })?.options ?? [];
    for (const opt of options) {
      expect(opt.hint, `opção "${opt.value}" deve ter hint`).toBeTruthy();
    }
  });

  it("todas as opções de fontSans têm hint descritivo", async () => {
    vi.clearAllMocks();
    setupPrompts({});
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    const options = (fontSansCall?.[0] as { options?: Array<{ value: string; hint?: string }> })?.options ?? [];
    for (const opt of options) {
      expect(opt.hint, `opção "${opt.value}" deve ter hint`).toBeTruthy();
    }
  });
});

describe("create — applyFont", () => {
  it("chama applyFont com fontSans e fontMono selecionados (sem radius)", async () => {
    const { mockApplyFont } = await callRunCreate({
      fontSans: "Inter",
      fontMono: "JetBrains Mono",
    });
    expect(mockApplyFont).toHaveBeenCalledWith(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      expect.objectContaining({
        css: "/projects/meu-portfolio/src/index.css",
        html: "/projects/meu-portfolio/index.html",
      }),
      expect.anything()
    );
  });

  it("chama applyFont com outra fonte quando selecionada", async () => {
    const { mockApplyFont } = await callRunCreate({
      fontSans: "Playfair Display",
      fontMono: "Fira Code",
    });
    expect(mockApplyFont).toHaveBeenCalledWith(
      { fontSans: "Playfair Display", fontMono: "Fira Code" },
      expect.anything(),
      expect.anything()
    );
  });
});

// ---- Ciclo 5b: novas fontes e recomendação por template --------------------

describe("create — novas fontes e recomendação por template", () => {
  it("novas fontes aparecem nas opções de fontSans", async () => {
    vi.clearAllMocks();
    setupPrompts({ fontSans: "Bodoni Moda" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
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

  it("Chakra Petch aparece como recomendada quando cyberpunk é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "cyberpunk", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "Chakra Petch", hint: "recomendada" }),
        ]),
      })
    );
  });

  it("Archivo aparece como recomendada quando swiss é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "swiss", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "Archivo", hint: "recomendada" }),
        ]),
      })
    );
  });

  it("Manrope aparece como recomendada quando bento é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "bento", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "Manrope", hint: "recomendada" }),
        ]),
      })
    );
  });

  it("prompt de fonte mono não é exibido quando swiss é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "swiss", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontMonoCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte mono"
    );
    expect(fontMonoCall).toBeUndefined();
  });

  it("Bodoni Moda aparece como recomendada quando magazine é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "magazine", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "Bodoni Moda", hint: "recomendada" }),
        ]),
      })
    );
  });

  it("IBM Plex Serif aparece como recomendada quando magazine é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "magazine", fontSans: "Inter" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontSansCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte principal"
    );
    expect(fontSansCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "IBM Plex Serif", hint: "recomendada" }),
        ]),
      })
    );
  });

  it("JetBrains Mono aparece como recomendada no fontMono quando cyberpunk é selecionado", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "cyberpunk", fontMono: "Fira Code" });
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    await runCreate("meu-portfolio", makeDefaultDeps(vol));
    const fontMonoCall = vi.mocked(select).mock.calls.find(
      (args) => (args[0] as { message?: string }).message === "Fonte mono"
    );
    expect(fontMonoCall?.[0]).toEqual(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "JetBrains Mono", hint: "recomendada" }),
        ]),
      })
    );
  });
});

// ---- Ciclo 6: applyPlugins -------------------------------------------------

describe("create — applyPlugins", () => {
  it("chama applyPlugins com plugins selecionados via multi-select", async () => {
    const { mockApplyPlugins } = await callRunCreate({
      plugins: ["blog", "portfolio", "resume"],
    });
    const call = vi.mocked(mockApplyPlugins).mock.calls[0];
    const pluginsArg = call[0] as Record<string, boolean>;
    expect(pluginsArg["blog"]).toBe(true);
    expect(pluginsArg["portfolio"]).toBe(true);
    expect(pluginsArg["resume"]).toBe(true);
    expect(pluginsArg["payments"]).toBe(false);
    expect(pluginsArg["i18n"]).toBe(false);
    expect(call[1]).toContain("pluginRegistry");
  });

  it("plugins não selecionados são marcados como false", async () => {
    const { mockApplyPlugins } = await callRunCreate({
      plugins: ["portfolio"],
    });
    const call = vi.mocked(mockApplyPlugins).mock.calls[0];
    const pluginsArg = call[0] as Record<string, boolean>;
    expect(pluginsArg["portfolio"]).toBe(true);
    expect(pluginsArg["blog"]).toBe(false);
  });
});

// ---- Ciclo 7: applyIndexHtml e applyRubricalConfig -------------------------

describe("create — applyIndexHtml", () => {
  it("chama applyIndexHtml com fontFamily, siteName e siteUrl do identityPrompt", async () => {
    const { mockApplyIndexHtml } = await callRunCreate({ fontSans: "Inter", theme: "cyberpunk" });
    expect(mockApplyIndexHtml).toHaveBeenCalledWith(
      expect.objectContaining({
        fontFamily: "Inter",
        siteName: "Test Site",
        siteUrl: "https://test.com",
      }),
      expect.stringContaining("index.html"),
      expect.anything()
    );
  });
});

describe("create — applyRubricalConfig", () => {
  it("chama applyRubricalConfig com dados de identidade e aparência", async () => {
    const { mockApplyRubricalConfig } = await callRunCreate({ fontSans: "Inter", fontMono: "JetBrains Mono" });
    expect(mockApplyRubricalConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        siteName: "Test Site",
        siteUrl: "https://test.com",
        authorName: "Test Author",
        fontSans: "Inter",
        fontMono: "JetBrains Mono",
      }),
      expect.stringContaining("meu-portfolio"),
      expect.anything()
    );
  });
});

// ---- Ciclo 8: writeState (rubrica.json) ------------------------------------

describe("create — writeState", () => {
  it("cria rubrica.json com version, layout, theme e plugins (sem radius nem accentColor)", async () => {
    vi.clearAllMocks();
    setupPrompts({ layout: "cyberpunk", theme: "editorial-cream", plugins: ["blog"] });

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });

    const mockWriteState = vi.fn(async () => ({
      version: "0.1.0",
      layout: "cyberpunk",
      theme: "editorial-cream",
      fontSans: "Inter",
      fontMono: "JetBrains Mono",
      plugins: { blog: true, portfolio: false, resume: false },
    }));

    const deps = {
      ...makeDefaultDeps(vol),
      writeState: mockWriteState as Deps["writeState"],
    };

    await runCreate("meu-portfolio", deps);

    expect(mockWriteState).toHaveBeenCalledWith(
      "/projects/meu-portfolio",
      expect.objectContaining({
        layout: "cyberpunk",
        theme: "editorial-cream",
        plugins: expect.objectContaining({ blog: true }),
      }),
      expect.anything()
    );
    const call = vi.mocked(mockWriteState).mock.calls[0][1];
    expect((call as Record<string, unknown>).radius).toBeUndefined();
    expect((call as Record<string, unknown>).accentColor).toBeUndefined();
  });
});

// ---- Ciclo 9: atualiza name em package.json --------------------------------

describe("create — package.json name", () => {
  it("atualiza name em package.json com o nome do projeto", async () => {
    vi.clearAllMocks();
    setupPrompts({});

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const deps = makeDefaultDeps(vol);

    await runCreate("meu-portfolio", deps);

    const pkgRaw = await (deps.fs as ReturnType<typeof makeFsModule>).readFile(
      "/projects/meu-portfolio/package.json",
      "utf-8"
    );
    const pkg = JSON.parse(pkgRaw) as { name: string };
    expect(pkg.name).toBe("meu-portfolio");
  });
});

// ---- Ciclo 10: git init e instalação de dependências ----------------------

describe("create — git init e package install", () => {
  async function callRunCreateWithExec(opts: {
    confirmGit?: boolean;
    packageManager?: string;
  }) {
    vi.clearAllMocks();
    setupPrompts({ packageManager: opts.packageManager ?? "pnpm" });
    vi.mocked(confirm).mockResolvedValueOnce(opts.confirmGit ?? true);

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });

    const mockExec = vi.fn(async () => undefined);
    const deps = {
      ...makeDefaultDeps(vol),
      exec: mockExec as Deps["exec"],
    };

    await runCreate("meu-portfolio", deps);
    return { mockExec };
  }

  it("executa git init quando usuário confirma", async () => {
    const { mockExec } = await callRunCreateWithExec({ confirmGit: true });
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("git init"),
      expect.stringContaining("meu-portfolio")
    );
  });

  it("não executa git init quando usuário recusa", async () => {
    const { mockExec } = await callRunCreateWithExec({ confirmGit: false });
    const gitCalls = vi.mocked(mockExec).mock.calls.filter(
      (c) => String(c[0]).includes("git init")
    );
    expect(gitCalls).toHaveLength(0);
  });

  it("executa pnpm install quando selecionado", async () => {
    const { mockExec } = await callRunCreateWithExec({ confirmGit: false, packageManager: "pnpm" });
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("pnpm install"),
      expect.stringContaining("meu-portfolio")
    );
  });
});

// ---- Ciclo 11: next steps message ------------------------------------------

describe("create — next steps message", () => {
  it("exibe mensagem de next steps ao concluir", async () => {
    const { outro } = await import("@clack/prompts");
    const { mockResolvedValue: _v, ..._ } = {};
    vi.clearAllMocks();
    setupPrompts({});

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });

    await runCreate("meu-portfolio", makeDefaultDeps(vol));

    expect(vi.mocked(outro)).toHaveBeenCalledWith(
      expect.stringMatching(/cd meu-portfolio/i)
    );
  });

  it("menciona rubrica setup após npx convex dev nas instruções", async () => {
    const { outro } = await import("@clack/prompts");
    vi.clearAllMocks();
    setupPrompts({});

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });

    await runCreate("meu-portfolio", makeDefaultDeps(vol));

    const outroArg = vi.mocked(outro).mock.calls[0][0] as string;
    expect(outroArg).toMatch(/npx convex dev/i);
    expect(outroArg).toMatch(/rubrica setup/i);
  });
});
