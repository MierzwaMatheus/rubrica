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
import type { RubricaState } from "../state/readState.js";

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
}

const ALL_PLUGINS = [
  "blog", "portfolio", "resume", "about", "proposals",
  "payments", "ai-resumes", "i18n", "playground",
  "testimonials", "testimonials-intake", "contact-wizard", "audit-log",
] as const;

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
      { value: "appearance", label: "Aparência (tema, fonte)" },
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
      {
        siteName: identityData.siteName,
        siteUrl: identityData.siteUrl,
        siteDescription: identityData.siteDescription,
        authorName: identityData.authorName,
        authorEmail: identityData.authorEmail,
        twitterHandle: identityData.twitterHandle,
        lang: identityData.lang,
        seoHomeTitle: "",
        seoHomeDescription: "",
        rssTitle: "",
        rssDescription: "",
        ogImageUrl: "",
        fontSans: currentState.fontSans,
        fontMono: currentState.fontMono,
      },
      projectDir,
      fs as Parameters<typeof defaultApplyRubricalConfig>[2]
    );
  }

  // Ciclo 5: aparência
  if (selected.includes("appearance")) {
    const theme = await select({
      message: "Tema visual",
      initialValue: currentState.theme,
      options: [
        { value: "editorial-cream", label: "Editorial Cream", hint: "refinado e atemporal — blogs e portfólios literários" },
        { value: "paper-noir", label: "Paper Noir", hint: "contraste máximo — identidade editorial forte" },
        { value: "midnight-blue", label: "Midnight Blue", hint: "tech e premium — devs e designers noturnos" },
        { value: "solar-warm", label: "Solar Warm", hint: "energia e criatividade — marcas pessoais vibrantes" },
      ],
    }) as string;

    const fontSans = await select({
      message: "Fonte principal",
      initialValue: currentState.fontSans,
      options: [
        { value: "Inter", label: "Inter", hint: "neutra, legível, padrão de produtos digitais" },
        { value: "Chakra Petch", label: "Chakra Petch", hint: "geométrica, tech, futurista" },
        { value: "Playfair Display", label: "Playfair Display", hint: "elegante, editorial clássico" },
        { value: "Space Grotesk", label: "Space Grotesk", hint: "moderna, startup" },
        { value: "DM Sans", label: "DM Sans", hint: "limpa, amigável, versátil" },
        { value: "Bodoni Moda", label: "Bodoni Moda", hint: "display serifado elegante, editorial clássico" },
        { value: "IBM Plex Serif", label: "IBM Plex Serif", hint: "serifa técnica, confiança e rigor" },
        { value: "Manrope", label: "Manrope", hint: "geométrica humanista, moderna e acolhedora" },
        { value: "Archivo", label: "Archivo", hint: "grotesca utilitária, clareza e força tipográfica" },
      ],
    }) as string;

    const fontMono = await select({
      message: "Fonte mono",
      initialValue: currentState.fontMono,
      options: [
        { value: "JetBrains Mono", label: "JetBrains Mono", hint: "dev-friendly, clara" },
        { value: "Fira Code", label: "Fira Code", hint: "clássico, com ligatures" },
        { value: "Space Mono", label: "Space Mono", hint: "retro digital" },
        { value: "IBM Plex Mono", label: "IBM Plex Mono", hint: "corporativo-tech" },
      ],
    }) as string;

    const cssPath = path.join(projectDir, "src", "index.css");
    const htmlPath = path.join(projectDir, "index.html");

    await applyThemeFn(
      { preset: theme },
      cssPath,
      fs as Parameters<typeof defaultApplyTheme>[2]
    );
    await applyFontFn(
      { fontSans, fontMono },
      { css: cssPath, html: htmlPath },
      fs as Parameters<typeof defaultApplyFont>[2]
    );
    await applyIndexHtmlFn(
      { fontFamily: fontSans, themeColor: "", siteName: "", siteUrl: "", twitterHandle: "", authorName: "" },
      htmlPath,
      fs as Parameters<typeof defaultApplyIndexHtml>[2]
    );

    stateUpdate.theme = theme;
    stateUpdate.fontSans = fontSans;
    stateUpdate.fontMono = fontMono;
  }

  // Ciclo 6: layout
  if (selected.includes("layout")) {
    const newLayout = await select({
      message: "Layout",
      initialValue: currentState.layout,
      options: [
        { value: "cyberpunk", label: "Cyberpunk", hint: "sidebar lateral com foto de perfil — dev, designer, freelancer" },
        { value: "brutalist", label: "Brutalism Terminal", hint: "identidade hacker total — monospace, sem bordas arredondadas" },
        { value: "swiss", label: "Swiss Grid", hint: "grid de 12 colunas, tipografia forte, design suíço rigoroso" },
        { value: "bento", label: "Bento", hint: "grid assimétrico com floating dock — moderno, orientado a produto" },
      ],
    }) as "cyberpunk" | "brutalist" | "swiss" | "bento";

    const confirmed = await confirm({
      message: "⚠ Isso sobrescreve Layout.tsx e arquivos de navegação. Customizações manuais serão perdidas. Continuar?",
    });

    if (!isCancel(confirmed) && confirmed === true) {
      await applyLayoutFn(
        newLayout,
        { projectDir, templatesDir: path.join(projectDir, "templates") },
        fs as Parameters<typeof defaultApplyLayout>[2]
      );
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
