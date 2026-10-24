import { intro, outro, select, multiselect, confirm, isCancel, cancel } from "@clack/prompts";
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

// ---- Tipos -----------------------------------------------------------------

export const ALL_PLUGINS = [
  "contact-wizard",
  "proposals",
  "payments",
  "blog",
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
] as const;

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

  const projectDir = `${deps.projectsDir}/${projectName}`;

  // Ciclo 2: download
  const version = await getVersion();
  await download(projectDir, version);

  // Ciclo 3: prompt e apply de layout (antes de remover templates/)
  const layout = await layoutPrompt();

  await applyLayoutFn(
    layout,
    { projectDir, templatesDir: `${projectDir}/templates` },
    fs as Parameters<typeof defaultApplyLayout>[2]
  );

  // Ciclo 4: prompt e apply de tema
  const themeChoice = await schemePrompt(layout);

  await applyThemeFn(
    { preset: themeChoice },
    `${projectDir}/src/index.css`,
    fs as Parameters<typeof defaultApplyTheme>[2]
  );

  // Aparência: modo de cor, alternância e textura (atributos do <html>)
  const appearance = await appearancePrompt(layout);
  await applyAppearanceFn(
    appearance,
    `${projectDir}/index.html`,
    fs as Parameters<typeof defaultApplyAppearance>[2]
  );

  // Ciclo 5: prompts de fonte
  const { fontSans, fontMono } = await fontPrompts(layout);

  await applyFontFn(
    { fontSans, fontMono },
    { css: `${projectDir}/src/index.css`, html: `${projectDir}/index.html` },
    fs as Parameters<typeof defaultApplyFont>[2]
  );

  // Ciclo 6: plugins multi-select + applyPlugins
  const selectedPlugins = await multiselect({
    message: "Plugins ativos",
    options: [
      { value: "contact-wizard", label: "Contact Wizard — formulário de contato multi-etapas", hint: "recomendado" },
      { value: "proposals", label: "Propostas — propostas comerciais com assinatura eletrônica", hint: "recomendado" },
      { value: "payments", label: "Pagamentos — checkout com PIX, boleto e cartão via Asaas" },
      { value: "blog", label: "Blog — listagem e leitura de posts", hint: "recomendado" },
      { value: "portfolio", label: "Portfolio — galeria de projetos", hint: "recomendado" },
      { value: "resume", label: "Currículo — currículo interativo com download de PDF", hint: "recomendado" },
      { value: "about", label: "Sobre — página sobre mim", hint: "recomendado" },
      { value: "ai-resumes", label: "CV com IA — geração de currículo customizado por IA" },
      { value: "audit-log", label: "Audit Log — log de auditoria do painel admin", hint: "recomendado" },
      { value: "media-manager", label: "Media Manager — gerenciador de arquivos e imagens" },
      { value: "i18n", label: "Tradução IA — internacionalização automática de conteúdo" },
      { value: "playground", label: "Playground — ambiente de testes interativo" },
      { value: "testimonials", label: "Depoimentos — seção de testimoniais de clientes", hint: "recomendado" },
      { value: "testimonials-intake", label: "Coleta de Depoimentos — formulário público para coleta", hint: "recomendado" },
    ],
    required: false,
  }) as string[];

  const pluginsRecord = Object.fromEntries(
    ALL_PLUGINS.map((id) => [id, selectedPlugins.includes(id)])
  );

  await applyPluginsFn(
    pluginsRecord,
    `${projectDir}/convex/pluginRegistry.ts`,
    fs as Parameters<typeof defaultApplyPlugins>[2]
  );

  // Ciclo 7: identityPrompt + applyIndexHtml + applyRubricalConfig
  const identity = await doIdentityPrompt();

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

  // Ciclo 9: atualiza name em package.json
  const pkgPath = `${projectDir}/package.json`;
  const pkgRaw = await fs.readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
  pkg.name = projectName;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  // Ciclo 8: writeState → rubrica.json
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
      plugins: pluginsRecord,
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

  // Ciclo 10: git init + package install
  const doGitInit = await confirm({ message: "Inicializar repositório git?" }) as boolean;
  const packageManager = await select({
    message: "Gerenciador de pacotes",
    options: [
      { value: "pnpm", label: "pnpm (recomendado)" },
      { value: "npm", label: "npm" },
      { value: "none", label: "Não agora" },
    ],
  }) as string;

  if (doGitInit) {
    await execFn("git init", projectDir);
  }

  if (packageManager !== "none") {
    await execFn(`${packageManager} install`, projectDir);
  }

  // Ciclo 2: limpeza após uso dos templates
  await removeDir(`${projectDir}/templates`, fs);
  await removeDir(`${projectDir}/cli`, fs);
  // O site público do Rubrica vive no repositório, mas não faz parte do portfólio.
  await removeDir(`${projectDir}/site`, fs);

  // Ciclo 11: next steps
  const installStep = packageManager === "none" ? "pnpm install\n  " : "";
  outro(
    `Projeto criado com sucesso!\n\n  cd ${projectName}\n\n` +
    `Próximos passos:\n\n` +
    `  1. Suba o backend:\n     npx convex dev\n     (deixe rodando em um terminal)\n\n` +
    `  2. Configure o ambiente (em outro terminal, com Convex ativo):\n     rubrica setup\n\n` +
    `  3. Inicie o frontend:\n     ${installStep}pnpm dev\n\nBoa sorte! 🚀`
  );
}
