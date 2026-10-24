import { outro, select, multiselect, confirm, isCancel, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { readState as defaultReadState } from "../state/readState.js";
import { writeState as defaultWriteState } from "../state/writeState.js";
import { identityPrompt as defaultIdentityPrompt } from "../prompts/identityPrompt.js";
import { applyRubricalConfig as defaultApplyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { applyTheme as defaultApplyTheme } from "../transforms/applyTheme.js";
import { applyFont as defaultApplyFont } from "../transforms/applyFont.js";
import { applyIndexHtml as defaultApplyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyLayout as defaultApplyLayout } from "../transforms/applyLayout.js";
import { applyPlugins as defaultApplyPlugins } from "../transforms/applyPlugins.js";
import { getLatestVersion as defaultGetLatestVersion, downloadRelease as defaultDownloadRelease } from "../utils/download.js";
import { indexHtmlInput, rubricaConfigInput } from "../transforms/identityInputs.js";
import { applyAppearance as defaultApplyAppearance } from "../transforms/applyAppearance.js";
import { SCHEME_START } from "../themes/schemes.js";
import { layoutPrompt, schemePrompt, appearancePrompt, fontPrompts } from "../prompts/appearancePrompt.js";
import { ALL_PLUGINS } from "./create.js";
import { tmpdir } from "node:os";
import type { RubricaLayout, RubricaState } from "../state/readState.js";

// ---- Tipos ------------------------------------------------------------------

export interface FsModule {
  access: (path: string) => Promise<void>;
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface RunConfigDeps {
  cwd?: string;
  fs?: FsModule;
  detectProject?: typeof defaultDetectProject;
  readState?: typeof defaultReadState;
  writeState?: typeof defaultWriteState;
  identityPrompt?: typeof defaultIdentityPrompt;
  applyRubricalConfig?: typeof defaultApplyRubricalConfig;
  applyTheme?: typeof defaultApplyTheme;
  applyFont?: typeof defaultApplyFont;
  applyIndexHtml?: typeof defaultApplyIndexHtml;
  applyLayout?: typeof defaultApplyLayout;
  applyPlugins?: typeof defaultApplyPlugins;
  applyAppearance?: typeof defaultApplyAppearance;
  downloadRelease?: typeof defaultDownloadRelease;
  getLatestVersion?: typeof defaultGetLatestVersion;
}

async function existsIn(fs: { access: (p: string) => Promise<void> }, p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---- Comando runConfig -------------------------------------------------------

export async function runConfig(deps: RunConfigDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? (nodeFsPromises as unknown as FsModule);
  const detectProjectFn = deps.detectProject ?? defaultDetectProject;
  const readStateFn = deps.readState ?? defaultReadState;
  const writeStateFn = deps.writeState ?? defaultWriteState;
  const doIdentityPrompt = deps.identityPrompt ?? defaultIdentityPrompt;
  const applyRubricalConfigFn = deps.applyRubricalConfig ?? defaultApplyRubricalConfig;
  const applyThemeFn = deps.applyTheme ?? defaultApplyTheme;
  const applyFontFn = deps.applyFont ?? defaultApplyFont;
  const applyIndexHtmlFn = deps.applyIndexHtml ?? defaultApplyIndexHtml;
  const applyLayoutFn = deps.applyLayout ?? defaultApplyLayout;
  const applyPluginsFn = deps.applyPlugins ?? defaultApplyPlugins;
  const downloadReleaseFn = deps.downloadRelease ?? defaultDownloadRelease;
  const getLatestVersionFn = deps.getLatestVersion ?? defaultGetLatestVersion;
  const applyAppearanceFn = deps.applyAppearance ?? defaultApplyAppearance;

  // Ciclo 1: detectar projeto
  const rubricaJsonPath = await detectProjectFn(cwd, fs);
  const projectDir = path.dirname(rubricaJsonPath);

  // Ciclo 2: ler estado atual
  const currentState = await readStateFn(projectDir, fs as Parameters<typeof defaultReadState>[1]);
  const stateUpdate: Partial<RubricaState> = {};

  // Ciclo 3: multi-select de seções
  const sections = await multiselect({
    message: "O que deseja reconfigurar?",
    options: [
      { value: "identity", label: "Identidade (nome, URL, SEO, RSS)" },
      { value: "appearance", label: "Aparência (esquema de cores, modo claro/escuro, textura, fontes)" },
      { value: "layout", label: "Layout" },
      { value: "plugins", label: "Plugins" },
    ],
    required: false,
  });

  if (isCancel(sections)) {
    cancel("Operação cancelada.");
    return;
  }

  const selected = sections as string[];

  // Ciclo 4: identidade
  if (selected.includes("identity")) {
    const identityData = await doIdentityPrompt();
    await applyRubricalConfigFn(
      rubricaConfigInput(identityData, currentState.fontSans, currentState.fontMono),
      projectDir,
      fs as Parameters<typeof defaultApplyRubricalConfig>[2]
    );
    await applyIndexHtmlFn(
      indexHtmlInput(identityData, currentState.fontSans, currentState.fontMono),
      path.join(projectDir, "index.html"),
      fs as Parameters<typeof defaultApplyIndexHtml>[2]
    );
    stateUpdate.identity = identityData;
  }

  // Ciclo 5: aparência
  if (selected.includes("appearance")) {
    const theme = await schemePrompt(currentState.layout, currentState.theme);
    const appearance = await appearancePrompt(currentState.layout, {
      colorMode: currentState.colorMode,
      colorModeToggle: currentState.colorModeToggle,
      texture: currentState.texture,
    });
    const { fontSans, fontMono } = await fontPrompts(currentState.layout, currentState);

    const cssPath = path.join(projectDir, "src", "index.css");
    const htmlPath = path.join(projectDir, "index.html");

    await applyThemeFn(
      { preset: theme },
      cssPath,
      fs as Parameters<typeof defaultApplyTheme>[2]
    );
    await applyAppearanceFn(appearance, htmlPath, fs as Parameters<typeof defaultApplyAppearance>[2]);
    const css = await fs.readFile(cssPath, "utf-8").catch(() => "");
    if (css && !css.includes(SCHEME_START)) {
      log.warn(
        "Este projeto é de uma versão sem modo claro/escuro: só as 4 cores principais do esquema foram aplicadas. " +
          "Para ter os dois modos, a alternância e as texturas, atualize com `npx create-rubrica@latest update` e rode o config de novo."
      );
    }
    await applyFontFn(
      { fontSans, fontMono },
      { css: cssPath, html: htmlPath },
      fs as Parameters<typeof defaultApplyFont>[2]
    );
    // Só a fonte muda aqui; o resto das meta tags vem da identidade salva.
    const identity = stateUpdate.identity ?? currentState.identity;
    if (identity) {
      await applyIndexHtmlFn(
        indexHtmlInput(identity, fontSans, fontMono),
        htmlPath,
        fs as Parameters<typeof defaultApplyIndexHtml>[2]
      );
    }

    stateUpdate.theme = theme;
    Object.assign(stateUpdate, appearance);
    stateUpdate.fontSans = fontSans;
    stateUpdate.fontMono = fontMono;
  }

  // Ciclo 6: layout
  if (selected.includes("layout")) {
    const newLayout: RubricaLayout = await layoutPrompt(currentState.layout);

    const confirmed = await confirm({
      message: "⚠ Isso sobrescreve Layout.tsx e arquivos de navegação. Customizações manuais serão perdidas. Continuar?",
    });

    if (!isCancel(confirmed) && confirmed === true) {
      // O create apaga templates/ do projeto: os layouts vêm da release do projeto.
      let templatesDir = path.join(projectDir, "templates");
      let tmpDir: string | undefined;
      if (!(await existsIn(fs, templatesDir))) {
        tmpDir = await nodeFsPromises.mkdtemp(path.join(tmpdir(), "rubrica-config-"));
        const version = currentState.version === "0.1.0" ? await getLatestVersionFn() : currentState.version;
        await downloadReleaseFn(tmpDir, version.startsWith("v") ? version : `v${version}`);
        templatesDir = path.join(tmpDir, "templates");
      }
      try {
        // Layouts novos não existem nas versões antigas do projeto (os templates vêm da release dele).
        const layoutsDir = path.join(templatesDir, "layouts");
        if ((await existsIn(fs, layoutsDir)) && !(await existsIn(fs, path.join(layoutsDir, newLayout)))) {
          log.warn(
            `O layout "${newLayout}" não existe na versão ${currentState.version} deste projeto. ` +
              "Atualize o projeto com `npx create-rubrica@latest update` e rode o config de novo."
          );
          return;
        }
        await applyLayoutFn(
          newLayout,
          { projectDir, templatesDir },
          { ...(fs as object), copyFile: nodeFsPromises.copyFile, unlink: nodeFsPromises.unlink, exists: (p: string) => existsIn(fs, p) } as unknown as Parameters<typeof defaultApplyLayout>[2]
        );
      } finally {
        if (tmpDir) await nodeFsPromises.rm(tmpDir, { recursive: true, force: true });
      }
      stateUpdate.layout = newLayout;
    }
  }

  // Ciclo 7: plugins
  if (selected.includes("plugins")) {
    const activePlugins = Object.entries(currentState.plugins)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const selectedPlugins = await multiselect({
      message: "Plugins ativos",
      initialValues: activePlugins,
      options: ALL_PLUGINS.map((p) => ({ value: p, label: p })),
      required: false,
    });

    if (!isCancel(selectedPlugins)) {
      const pluginsMap: Record<string, boolean> = {};
      for (const p of ALL_PLUGINS) {
        pluginsMap[p] = (selectedPlugins as string[]).includes(p);
      }

      await applyPluginsFn(
        pluginsMap,
        path.join(projectDir, "convex", "pluginRegistry.ts"),
        fs as Parameters<typeof defaultApplyPlugins>[2]
      );
      stateUpdate.plugins = pluginsMap;
    }
  }

  // Ciclo 8: persistir estado
  if (Object.keys(stateUpdate).length > 0) {
    await writeStateFn(projectDir, stateUpdate, fs as Parameters<typeof defaultWriteState>[2]);
  }

  outro("Configuração atualizada com sucesso!");
}
