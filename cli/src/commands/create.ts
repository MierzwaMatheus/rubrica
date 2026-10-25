import { outro, select, confirm, isCancel, cancel, log, note } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import { identityPrompt as defaultIdentityPrompt } from "../prompts/identityPrompt.js";
import { downloadRelease as defaultDownloadRelease, getLatestVersion as defaultGetLatestVersion } from "../utils/download.js";
import { applyLayout as defaultApplyLayout } from "../transforms/applyLayout.js";
import { applyTheme as defaultApplyTheme } from "../transforms/applyTheme.js";
import { applyFont as defaultApplyFont } from "../transforms/applyFont.js";
import { applyPlugins as defaultApplyPlugins } from "../transforms/applyPlugins.js";
import { applyIndexHtml as defaultApplyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyRubricalConfig as defaultApplyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { writeState as defaultWriteState } from "../state/writeState.js";
import { indexHtmlInput, rubricaConfigInput } from "../transforms/identityInputs.js";
import { applyAppearance as defaultApplyAppearance } from "../transforms/applyAppearance.js";
import { layoutPrompt, schemePrompt, appearancePrompt, fontPrompts } from "../prompts/appearancePrompt.js";
import { pluginsPrompt } from "../prompts/pluginsPrompt.js";
import { pluginsRecord } from "../plugins.js";
import { recommendedAppearance } from "../layouts.js";
import { packageManagerFromUserAgent } from "../utils/packageManager.js";
import { recipeSummary, type Recipe } from "../recipe.js";
import { runSetup as defaultRunSetup } from "./setup.js";

// ---- Tipos -----------------------------------------------------------------

// A lista de plugins mora em ../plugins.ts; o re-export mantém quem importava daqui.
export { ALL_PLUGINS } from "../plugins.js";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
  copyFile?: (src: string, dest: string) => Promise<void>;
  unlink?: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  rm: (path: string, opts?: { recursive?: boolean; force?: boolean }) => Promise<void>;
}

export interface RunCreateDeps {
  projectsDir: string;
  fs?: FsModule;
  download?: typeof defaultDownloadRelease;
  getLatestVersion?: typeof defaultGetLatestVersion;
  applyLayout?: typeof defaultApplyLayout;
  applyTheme?: typeof defaultApplyTheme;
  applyFont?: typeof defaultApplyFont;
  applyPlugins?: typeof defaultApplyPlugins;
  applyIndexHtml?: typeof defaultApplyIndexHtml;
  applyRubricalConfig?: typeof defaultApplyRubricalConfig;
  applyAppearance?: typeof defaultApplyAppearance;
  writeState?: typeof defaultWriteState;
  exec?: (command: string, cwd: string) => Promise<void>;
  identityPrompt?: typeof defaultIdentityPrompt;
  /** Setup do backend, encadeado no final quando a pessoa aceita. */
  setup?: (opts: {
    cwd: string;
    nextStep: string;
    newProject: string;
    site?: { profession?: string; specialties?: string };
  }) => Promise<void>;
  /** `npm_config_user_agent`: diz se o create veio do pnpm ou do npm. */
  userAgent?: string;
  /** Escolhas que vieram do site (`--receita`) ou das opções legíveis. Já validadas. */
  recipe?: Recipe;
}

/** Endereço que a Vercel dá a um projeto com esse nome: bom padrão para quem ainda não tem domínio. */
export function suggestedSiteUrl(projectName: string): string {
  return `https://${projectName.toLowerCase().replace(/_/g, "-")}.vercel.app`;
}

function assertNotCancelled<T>(value: T | symbol): asserts value is T {
  if (isCancel(value)) {
    cancel("Operação cancelada.");
    throw new Error("Prompt cancelado pelo usuário.");
  }
}

// ---- Validação do nome do projeto ------------------------------------------

export function validateProjectName(name: string): void {
  if (/\s/.test(name)) {
    throw new Error(
      `Nome inválido: "${name}" contém espaços. Use hífens ou underscores (ex: meu-portfolio).`
    );
  }
  if (/[^a-zA-Z0-9\-_]/.test(name)) {
    throw new Error(
      `Nome inválido: "${name}" contém caracteres especiais. Use apenas letras, números, hífens e underscores.`
    );
  }
}

// ---- Utilitário: remoção recursiva de diretório ----------------------------

async function removeDir(dirPath: string, fs: FsModule): Promise<void> {
  if (await fs.exists(dirPath)) {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}


// ---- Comando runCreate -----------------------------------------------------

export async function runCreate(
  projectName: string,
  deps: RunCreateDeps
): Promise<void> {
  validateProjectName(projectName);

  const fs = deps.fs ?? {
    ...nodeFsPromises,
    exists: async (p: string) => {
      try { await nodeFsPromises.access(p); return true; } catch { return false; }
    },
  } as unknown as FsModule;
  const download = deps.download ?? defaultDownloadRelease;
  const getVersion = deps.getLatestVersion ?? defaultGetLatestVersion;
  const applyLayoutFn = deps.applyLayout ?? defaultApplyLayout;
  const applyThemeFn = deps.applyTheme ?? defaultApplyTheme;
  const applyFontFn = deps.applyFont ?? defaultApplyFont;
  const applyPluginsFn = deps.applyPlugins ?? defaultApplyPlugins;
  const applyIndexHtmlFn = deps.applyIndexHtml ?? defaultApplyIndexHtml;
  const applyRubricalConfigFn = deps.applyRubricalConfig ?? defaultApplyRubricalConfig;
  const writeStateFn = deps.writeState ?? defaultWriteState;
  const applyAppearanceFn = deps.applyAppearance ?? defaultApplyAppearance;
  const execFn = deps.exec ?? (async (cmd: string, cwd: string) => {
    const { execSync } = await import("node:child_process");
    execSync(cmd, { cwd, stdio: "inherit" });
  });
  const doIdentityPrompt = deps.identityPrompt ?? defaultIdentityPrompt;
  const setupFn = deps.setup ?? defaultRunSetup;
  const packageManager = packageManagerFromUserAgent(deps.userAgent ?? process.env.npm_config_user_agent);

  const projectDir = `${deps.projectsDir}/${projectName}`;

  const recipe = deps.recipe ?? {};
  const fromRecipe = Object.keys(recipe).length > 0;

  // Com receita: mostra o que veio do site e confirma antes de baixar. Sem pergunta de modo:
  // o que faltar da aparência vem do recomendado do layout, como no rápido.
  if (fromRecipe) {
    note(recipeSummary(recipe).join("\n"), "Escolhas que vieram do site");
    const ok = await confirm({ message: "Criar com essas escolhas? (o que faltar eu pergunto)", initialValue: true });
    if (ok !== true) {
      cancel("Operação cancelada.");
      throw new Error("Prompt cancelado pelo usuário.");
    }
  }

  // Modo: o rápido só pergunta layout, plugins e identidade; o resto vem do layout.
  const mode = fromRecipe ? "quick" : await select({
    message: "Como você quer montar o site?",
    initialValue: "quick",
    options: [
      { value: "quick", label: "Rápido", hint: "escolho o visual, cores e fontes vêm combinadas" },
      { value: "custom", label: "Personalizado", hint: "escolho cores, modo claro/escuro, textura e fontes" },
    ],
  });
  assertNotCancelled(mode);
  const custom = mode === "custom";

  const version = await getVersion();
  await download(projectDir, version);

  // Layout (antes de remover templates/)
  const layout = recipe.layout ?? (await layoutPrompt());
  assertNotCancelled(layout);

  await applyLayoutFn(
    layout,
    { projectDir, templatesDir: `${projectDir}/templates` },
    fs as Parameters<typeof defaultApplyLayout>[2]
  );

  let themeChoice: string;
  let appearance: Awaited<ReturnType<typeof appearancePrompt>>;
  let fontSans: string;
  let fontMono: string;
  if (custom) {
    themeChoice = await schemePrompt(layout);
    appearance = await appearancePrompt(layout);
    ({ fontSans, fontMono } = await fontPrompts(layout));
  } else {
    const rec = recommendedAppearance(layout);
    themeChoice = recipe.scheme ?? rec.theme;
    appearance = {
      colorMode: recipe.colorMode ?? rec.colorMode,
      colorModeToggle: recipe.colorModeToggle ?? rec.colorModeToggle,
      texture: recipe.texture ?? rec.texture,
    };
    fontSans = recipe.fontSans ?? rec.fontSans;
    // Layout sem mono (rec.fontMono vazio) não carrega fonte mono, venha o que vier.
    fontMono = rec.fontMono === "" ? "" : (recipe.fontMono ?? rec.fontMono);
  }

  await applyThemeFn(
    { preset: themeChoice },
    `${projectDir}/src/index.css`,
    fs as Parameters<typeof defaultApplyTheme>[2]
  );

  // Aparência: modo de cor, alternância e textura (atributos do <html>)
  await applyAppearanceFn(
    appearance,
    `${projectDir}/index.html`,
    fs as Parameters<typeof defaultApplyAppearance>[2]
  );

  await applyFontFn(
    { fontSans, fontMono },
    { css: `${projectDir}/src/index.css`, html: `${projectDir}/index.html` },
    fs as Parameters<typeof defaultApplyFont>[2]
  );

  // Plugins: pacote pronto ou um por um
  const plugins = pluginsRecord(recipe.plugins ?? (await pluginsPrompt()));

  await applyPluginsFn(
    plugins,
    `${projectDir}/convex/pluginRegistry.ts`,
    fs as Parameters<typeof defaultApplyPlugins>[2]
  );

  // Identidade. Sem domínio ainda, o endereço da Vercel é um bom ponto de partida.
  const identity = await doIdentityPrompt(
    { siteUrl: suggestedSiteUrl(projectName), ...recipe.identity },
    fromRecipe ? { askLang: false, onlyMissing: true } : { askLang: custom }
  );

  await applyIndexHtmlFn(
    indexHtmlInput(identity, fontSans, fontMono),
    `${projectDir}/index.html`,
    fs as Parameters<typeof defaultApplyIndexHtml>[2]
  );

  await applyRubricalConfigFn(
    rubricaConfigInput(identity, fontSans, fontMono),
    projectDir,
    fs as Parameters<typeof defaultApplyRubricalConfig>[2]
  );

  const pkgPath = `${projectDir}/package.json`;
  const pkgRaw = await fs.readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
  pkg.name = projectName;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  await writeStateFn(
    projectDir,
    {
      // Versão realmente baixada: o update usa como base para preservar as personalizações.
      version: version.replace(/^v/, ""),
      layout,
      theme: themeChoice,
      ...appearance,
      fontSans,
      fontMono,
      plugins,
      identity: {
        siteName: identity.siteName,
        siteUrl: identity.siteUrl,
        siteDescription: identity.siteDescription,
        authorName: identity.authorName,
        authorEmail: identity.authorEmail,
        twitterHandle: identity.twitterHandle,
        lang: identity.lang,
      },
    },
    fs as Parameters<typeof defaultWriteState>[2]
  );

  // Git (sempre na branch main) e dependências, sem perguntar. Sem git instalado, o projeto funciona do mesmo jeito.
  let hasGit = true;
  try {
    await execFn("git init -b main", projectDir);
  } catch {
    try {
      // git anterior à 2.28 não conhece o -b
      await execFn("git init", projectDir);
      await execFn("git symbolic-ref HEAD refs/heads/main", projectDir);
    } catch {
      hasGit = false;
      log.warn("Não deu para iniciar o git (ele está instalado?). O projeto funciona sem; dá para rodar `git init` depois.");
    }
  }
  await execFn(`${packageManager} install`, projectDir);

  await removeDir(`${projectDir}/templates`, fs);
  await removeDir(`${projectDir}/cli`, fs);
  // O site público do Rubrica vive no repositório, mas não faz parte do portfólio.
  await removeDir(`${projectDir}/site`, fs);

  // Commit inicial: a branch main passa a existir e o projeto já sai pronto para ir a um repositório.
  if (hasGit) {
    const message = '-m "Projeto criado com create-rubrica"';
    try {
      await execFn("git add -A", projectDir);
      try {
        await execFn(`git commit -q ${message}`, projectDir);
      } catch {
        // git sem nome e e-mail configurados
        await execFn(
          `git -c user.name="create-rubrica" -c user.email="create-rubrica@users.noreply.github.com" commit -q ${message}`,
          projectDir
        );
      }
    } catch {
      log.warn("Não deu para fazer o primeiro commit. O projeto funciona do mesmo jeito.");
    }
  }

  const devCommand = `${packageManager} run dev`;
  const nextStep = `cd ${projectName} && ${devCommand}`;

  // Backend: o setup conecta o Convex (cria o projeto, login pelo navegador) e cria o admin.
  // Vindo do site, não pergunta: o site já explicou que o comando faz isso.
  const setupNow = fromRecipe
    ? true
    : await confirm({
        message: "Configurar o painel admin agora? Abre o login do Convex no navegador (conta gratuita).",
        initialValue: true,
      });
  if (setupNow === true) {
    await setupFn({
      cwd: projectDir,
      nextStep,
      newProject: projectName,
      ...(fromRecipe && {
        site: { profession: recipe.identity?.profession, specialties: recipe.identity?.specialties },
      }),
    });
    return;
  }

  outro(
    `Projeto criado!\n\n  cd ${projectName}\n\n` +
    `Próximos passos:\n\n` +
    `  1. Conecte o backend e crie o admin:\n     npx create-rubrica setup\n\n` +
    `  2. Abra o site no navegador:\n     ${devCommand}\n\nBoa sorte! 🚀`
  );
}
