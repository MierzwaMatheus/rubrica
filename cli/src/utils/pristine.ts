import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { downloadRelease as defaultDownloadRelease } from "./download.js";
import { applyLayout } from "../transforms/applyLayout.js";
import { applyTheme } from "../transforms/applyTheme.js";
import { applyFont } from "../transforms/applyFont.js";
import { applyPlugins } from "../transforms/applyPlugins.js";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { indexHtmlInput, rubricaConfigInput } from "../transforms/identityInputs.js";
import type { RubricaState } from "../state/readState.js";

export interface BuildPristineOptions {
  /** Diretório vazio onde a versão será montada. */
  dir: string;
  /** Tag da release (com ou sem "v"). */
  version: string;
  /** Escolhas do projeto (rubrica.json). */
  state: RubricaState;
  /** Nome do package.json do projeto do usuário. */
  packageName?: string;
  download?: typeof defaultDownloadRelease;
}

const fsForTransforms = {
  ...nodeFsPromises,
  exists: async (p: string) => {
    try {
      await nodeFsPromises.access(p);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Monta, num diretório à parte, o projeto exatamente como o `create` o deixaria
 * para uma versão e um conjunto de escolhas (layout, tema, fontes, plugins, identidade).
 *
 * O update usa isto duas vezes: com a versão de origem do projeto (a "base") e com a
 * versão nova. Comparando as duas com o projeto do usuário, dá para saber o que foi
 * personalizado e o que mudou no Rubrica.
 *
 * Precisa seguir os mesmos passos do `create` (ver commands/create.ts).
 */
export async function buildPristine(options: BuildPristineOptions): Promise<void> {
  const { dir, state } = options;
  const download = options.download ?? defaultDownloadRelease;
  const tag = options.version.startsWith("v") ? options.version : `v${options.version}`;
  const fs = fsForTransforms as never;

  await download(dir, tag);

  await applyLayout(state.layout, { projectDir: dir, templatesDir: path.join(dir, "templates") }, fs);

  const cssPath = path.join(dir, "src", "index.css");
  const htmlPath = path.join(dir, "index.html");
  await applyTheme({ preset: state.theme }, cssPath, fs);
  await applyFont({ fontSans: state.fontSans, fontMono: state.fontMono }, { css: cssPath, html: htmlPath }, fs);

  const registryPath = path.join(dir, "convex", "pluginRegistry.ts");
  const knownPlugins = await knownPluginIds(registryPath);
  const plugins = Object.fromEntries(
    Object.entries(state.plugins ?? {}).filter(([id]) => knownPlugins.has(id))
  );
  await applyPlugins(plugins, registryPath, fs);

  const identity = state.identity;
  if (identity) {
    await applyIndexHtml(indexHtmlInput(identity, state.fontSans), htmlPath, fs);
    await applyRubricalConfig(rubricaConfigInput(identity, state.fontSans, state.fontMono), dir, fs);
  }

  if (options.packageName) {
    const pkgPath = path.join(dir, "package.json");
    const pkg = JSON.parse(await nodeFsPromises.readFile(pkgPath, "utf-8")) as Record<string, unknown>;
    pkg.name = options.packageName;
    await nodeFsPromises.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  }

  await nodeFsPromises.rm(path.join(dir, "templates"), { recursive: true, force: true });
  await nodeFsPromises.rm(path.join(dir, "cli"), { recursive: true, force: true });
}

/** Plugins que a versão conhece: versões antigas podem não ter os mais novos. */
async function knownPluginIds(registryPath: string): Promise<Set<string>> {
  try {
    const content = await nodeFsPromises.readFile(registryPath, "utf-8");
    return new Set([...content.matchAll(/id: '([^']+)'/g)].map((m) => m[1]!));
  } catch {
    return new Set();
  }
}
