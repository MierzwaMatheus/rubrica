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

// ---- Tipos -----------------------------------------------------------------

const TEMPLATE_FONTS: Record<string, { fontSans: string | string[]; fontMono: string }> = {
  cyberpunk: { fontSans: "Chakra Petch", fontMono: "JetBrains Mono" },
  magazine:  { fontSans: ["Bodoni Moda", "IBM Plex Serif"], fontMono: "JetBrains Mono" },
  bento:     { fontSans: "Manrope",      fontMono: "JetBrains Mono" },
  brutalist: { fontSans: "JetBrains Mono", fontMono: "JetBrains Mono" },
  swiss:     { fontSans: "Archivo",      fontMono: "" },
};

const ALL_PLUGINS = [
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
  const layout = await select({
    message: "Layout",
    options: [
      { value: "cyberpunk", label: "Cyberpunk", hint: "sidebar lateral com foto de perfil — dev, designer, freelancer" },
      { value: "brutalist", label: "Brutalism Terminal", hint: "identidade hacker total — monospace, sem bordas arredondadas" },
      { value: "swiss", label: "Swiss Grid", hint: "grid de 12 colunas, tipografia forte, design suíço rigoroso" },
      { value: "bento", label: "Bento", hint: "grid assimétrico com floating dock — moderno, orientado a produto" },
      { value: "magazine", label: "Magazine", hint: "editorial clássico · display serifado · grid assimétrico · áreas de respiro generosas" },
    ],
  }) as "cyberpunk" | "brutalist" | "swiss" | "bento" | "magazine";

  await applyLayoutFn(
    layout,
    { projectDir, templatesDir: `${projectDir}/templates` },
    fs as Parameters<typeof defaultApplyLayout>[2]
  );

  // Ciclo 4: prompt e apply de tema
  const themeChoice = await select({
    message: "Tema visual",
    options: [
      { value: "editorial-cream", label: "Editorial Cream", hint: "refinado e atemporal — blogs e portfólios literários" },
      { value: "paper-noir", label: "Paper Noir", hint: "contraste máximo — identidade editorial forte" },
      { value: "midnight-blue", label: "Midnight Blue", hint: "tech e premium — devs e designers noturnos" },
      { value: "solar-warm", label: "Solar Warm", hint: "energia e criatividade — marcas pessoais vibrantes" },
    ],
  }) as string;

  await applyThemeFn(
    { preset: themeChoice },
    `${projectDir}/src/index.css`,
    fs as Parameters<typeof defaultApplyTheme>[2]
  );

  // Ciclo 5: prompts de fonte
  const recommendedFonts = TEMPLATE_FONTS[layout] ?? { fontSans: "", fontMono: "" };
  const recommendedSans = Array.isArray(recommendedFonts.fontSans)
    ? recommendedFonts.fontSans
    : [recommendedFonts.fontSans];

  const fontSans = await select({
    message: "Fonte principal",
    options: [
      { value: "Inter", label: "Inter", hint: "neutra, legível, padrão de produtos digitais" },
      { value: "Chakra Petch", label: "Chakra Petch", hint: recommendedSans.includes("Chakra Petch") ? "recomendada" : "geométrica, tech, futurista" },
      { value: "Playfair Display", label: "Playfair Display", hint: "elegante, editorial clássico" },
      { value: "Space Grotesk", label: "Space Grotesk", hint: "moderna, startup" },
      { value: "DM Sans", label: "DM Sans", hint: "limpa, amigável, versátil" },
      { value: "Bodoni Moda", label: "Bodoni Moda", hint: recommendedSans.includes("Bodoni Moda") ? "recomendada" : "display serifado elegante, editorial clássico" },
      { value: "IBM Plex Serif", label: "IBM Plex Serif", hint: recommendedSans.includes("IBM Plex Serif") ? "recomendada" : "serifa técnica, confiança e rigor" },
      { value: "Manrope", label: "Manrope", hint: recommendedSans.includes("Manrope") ? "recomendada" : "geométrica humanista, moderna e acolhedora" },
      { value: "Archivo", label: "Archivo", hint: recommendedSans.includes("Archivo") ? "recomendada" : "grotesca utilitária, clareza e força tipográfica" },
    ],
  }) as string;

  const fontMono = recommendedFonts.fontMono === "" ? "" : await select({
    message: "Fonte mono",
    options: [
      { value: "JetBrains Mono", label: "JetBrains Mono", hint: recommendedFonts.fontMono === "JetBrains Mono" ? "recomendada" : "dev-friendly, clara" },
      { value: "Fira Code", label: "Fira Code", hint: "clássico, com ligatures" },
      { value: "Space Mono", label: "Space Mono", hint: "retro digital" },
      { value: "IBM Plex Mono", label: "IBM Plex Mono", hint: "corporativo-tech" },
    ],
  }) as string;

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
      { value: "payments", label: "Pagamentos — integração com Stripe/Asaas" },
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
    {
      fontFamily: fontSans,
      themeColor: "",
      siteName: identity.siteName,
      siteUrl: identity.siteUrl,
      twitterHandle: identity.twitterHandle,
      authorName: identity.authorName,
    },
    `${projectDir}/index.html`,
    fs as Parameters<typeof defaultApplyIndexHtml>[2]
  );

  await applyRubricalConfigFn(
    {
      siteName: identity.siteName,
      siteUrl: identity.siteUrl,
      siteDescription: identity.siteDescription,
      authorName: identity.authorName,
      authorEmail: identity.authorEmail,
      twitterHandle: identity.twitterHandle,
      lang: identity.lang,
      seoHomeTitle: identity.siteName,
      seoHomeDescription: identity.siteDescription,
      rssTitle: identity.siteName,
      rssDescription: identity.siteDescription,
      ogImageUrl: `${identity.siteUrl}/og.png`,
      fontSans,
      fontMono,
    },
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
      version: "0.1.0",
      layout,
      theme: themeChoice,
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
