import { intro, outro, confirm, isCancel, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { readState as defaultReadState } from "../state/readState.js";
import { writeState as defaultWriteState } from "../state/writeState.js";
import { getLatestVersion as defaultGetLatestVersion, downloadRelease as defaultDownloadRelease } from "../utils/download.js";
import { applyLayout as defaultApplyLayout } from "../transforms/applyLayout.js";
import { applyTheme as defaultApplyTheme } from "../transforms/applyTheme.js";
import { applyFont as defaultApplyFont } from "../transforms/applyFont.js";
import { applyPlugins as defaultApplyPlugins } from "../transforms/applyPlugins.js";
import { applyIndexHtml as defaultApplyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyRubricalConfig as defaultApplyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import type { RubricalConfigInput } from "../transforms/applyRubricalConfig.js";
import { checkRequiredEnv as defaultCheckRequiredEnv } from "../utils/checkRequiredEnv.js";

// ---- Tipos ------------------------------------------------------------------

export interface FsModule {
  access: (path: string) => Promise<void>;
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface RunUpdateDeps {
  cwd?: string;
  fs?: FsModule;
  detectProject?: typeof defaultDetectProject;
  readState?: typeof defaultReadState;
  writeState?: typeof defaultWriteState;
  getLatestVersion?: typeof defaultGetLatestVersion;
  downloadRelease?: typeof defaultDownloadRelease;
  applyLayout?: typeof defaultApplyLayout;
  applyTheme?: typeof defaultApplyTheme;
  applyFont?: typeof defaultApplyFont;
  applyPlugins?: typeof defaultApplyPlugins;
  applyIndexHtml?: typeof defaultApplyIndexHtml;
  applyRubricalConfig?: typeof defaultApplyRubricalConfig;
  exec?: (command: string, cwd: string) => Promise<void>;
  checkRequiredEnv?: typeof defaultCheckRequiredEnv;
}

// ---- Comparação semver ------------------------------------------------------

function parseMajor(version: string): number {
  const clean = version.replace(/^v/, "");
  const major = parseInt(clean.split(".")[0] ?? "0", 10);
  return isNaN(major) ? 0 : major;
}

function normalizeVersion(version: string): string {
  return version.replace(/^v/, "");
}

// ---- Comando runUpdate -------------------------------------------------------

export async function runUpdate(deps: RunUpdateDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? {
    ...nodeFsPromises,
    exists: async (p: string) => {
      try { await nodeFsPromises.access(p); return true; } catch { return false; }
    },
  } as unknown as FsModule;
  const detectProjectFn = deps.detectProject ?? defaultDetectProject;
  const readStateFn = deps.readState ?? defaultReadState;
  const writeStateFn = deps.writeState ?? defaultWriteState;
  const getLatestVersionFn = deps.getLatestVersion ?? defaultGetLatestVersion;
  const downloadReleaseFn = deps.downloadRelease ?? defaultDownloadRelease;
  const applyLayoutFn = deps.applyLayout ?? defaultApplyLayout;
  const applyThemeFn = deps.applyTheme ?? defaultApplyTheme;
  const applyFontFn = deps.applyFont ?? defaultApplyFont;
  const applyPluginsFn = deps.applyPlugins ?? defaultApplyPlugins;
  const applyIndexHtmlFn = deps.applyIndexHtml ?? defaultApplyIndexHtml;
  const applyRubricalConfigFn = deps.applyRubricalConfig ?? defaultApplyRubricalConfig;
  const checkRequiredEnvFn = deps.checkRequiredEnv ?? defaultCheckRequiredEnv;
  const execFn = deps.exec ?? (async (cmd: string, cwd: string) => {
    const { execSync } = await import("node:child_process");
    execSync(cmd, { cwd, stdio: "inherit" });
  });

  intro("Rubrica Update");

  // Ciclo 1: detectar projeto e ler versões
  const rubricaJsonPath = await detectProjectFn(cwd, fs);
  const projectDir = path.dirname(rubricaJsonPath);
  const state = await readStateFn(projectDir, fs as Parameters<typeof defaultReadState>[1]);

  const localVersion = normalizeVersion(state.version);
  const remoteVersion = normalizeVersion(await getLatestVersionFn());

  if (localVersion === remoteVersion) {
    outro(`Já está na versão mais recente (${localVersion}). Nenhuma atualização necessária.`);
    return;
  }

  // Ciclo 5/6: verificar se é major
  const localMajor = parseMajor(localVersion);
  const remoteMajor = parseMajor(remoteVersion);

  if (remoteMajor > localMajor) {
    log.warn(
      `Atualização major detectada: ${localVersion} → ${remoteVersion}\n` +
      `Atualizações major podem conter mudanças destrutivas no schema do Convex.\n` +
      `Consulte o guia de migração antes de prosseguir.`
    );

    const majorConfirmed = await confirm({
      message: `Confirmar atualização major (${localVersion} → ${remoteVersion})? Pode haver mudanças destrutivas.`,
    });

    if (isCancel(majorConfirmed) || !majorConfirmed) {
      cancel("Atualização cancelada.");
      return;
    }
  }

  // Confirmação padrão para minor/patch
  if (remoteMajor === localMajor) {
    const proceed = await confirm({
      message: `Atualizar de ${localVersion} para ${remoteVersion}?`,
    });

    if (isCancel(proceed) || !proceed) {
      cancel("Atualização cancelada.");
      return;
    }
  }

  // Ciclo 2: baixar nova versão (território Rubrica)
  await downloadReleaseFn(projectDir, remoteVersion);

  // Ciclo 3 e 4: re-aplicar todos os transforms (território do usuário)
  const templatesDir = path.join(projectDir, "templates");

  await applyLayoutFn(
    state.layout,
    { projectDir, templatesDir },
    fs as Parameters<typeof defaultApplyLayout>[2]
  );

  const cssPath = path.join(projectDir, "src", "index.css");
  await applyThemeFn({ preset: state.theme }, cssPath, fs as Parameters<typeof defaultApplyTheme>[2]);

  const htmlPath = path.join(projectDir, "index.html");
  await applyFontFn(
    { fontSans: state.fontSans, fontMono: state.fontMono },
    { css: cssPath, html: htmlPath },
    fs as Parameters<typeof defaultApplyFont>[2]
  );

  const registryPath = path.join(projectDir, "convex", "pluginRegistry.ts");
  await applyPluginsFn(
    state.plugins,
    registryPath,
    fs as Parameters<typeof defaultApplyPlugins>[2]
  );

  const identity: RubricalConfigInput = {
    siteName: "",
    siteUrl: "",
    siteDescription: "",
    authorName: "",
    authorEmail: "",
    twitterHandle: "",
    lang: "pt-BR",
    seoHomeTitle: "",
    seoHomeDescription: "",
    rssTitle: "",
    rssDescription: "",
    ogImageUrl: "",
    fontSans: state.fontSans,
    fontMono: state.fontMono,
  };

  await applyIndexHtmlFn(
    {
      fontFamily: identity.fontSans,
      themeColor: "",
      siteName: identity.siteName,
      siteUrl: identity.siteUrl,
      twitterHandle: identity.twitterHandle,
      authorName: identity.authorName,
    },
    htmlPath,
    fs as Parameters<typeof defaultApplyIndexHtml>[2]
  );

  await applyRubricalConfigFn(
    identity,
    projectDir,
    fs as Parameters<typeof defaultApplyRubricalConfig>[2]
  );

  // Atualizar versão no rubrica.json
  await writeStateFn(projectDir, { version: remoteVersion }, fs as Parameters<typeof defaultWriteState>[2]);

  // Verificar variáveis de ambiente faltantes
  const missingVars = await checkRequiredEnvFn(projectDir, fs as Parameters<typeof defaultCheckRequiredEnv>[1]);
  if (missingVars.length > 0) {
    const varList = missingVars
      .map((v) => `  • ${v.name} — ${v.description}`)
      .join("\n");
    log.warn(
      `Variáveis de ambiente faltantes no Convex Dashboard:\n${varList}\n` +
      `Configure-as em: https://dashboard.convex.dev`
    );
  }

  outro(`Rubrica atualizado para ${remoteVersion} com sucesso!`);
}
