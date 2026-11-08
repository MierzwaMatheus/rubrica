/**
 * Integração do Astro (RFC v2, decisão 4): o projeto do cliente só tem
 *
 *   // astro.config.ts
 *   import rubrica from "@rubrica/core/astro";
 *   export default defineConfig({ integrations: [rubrica({ theme: "@rubrica/theme-padrao" })] });
 *
 * e as rotas públicas, o <head>, o sitemap, o robots e as ilhas vêm do pacote.
 */
import type { AstroIntegration } from "astro";
import react from "@astrojs/react";
import { fontProviders } from "astro/config";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isAbsolute, resolve } from "node:path";
import { fixtureSource, type DataSource } from "../data/source";
import type { ThemeFonts } from "../theme/contract";
import { planFonts, type FontPlan } from "../theme/fonts";
import tailwindcss from "@tailwindcss/vite";
import { convexSource, findConvexUrl } from "../data/convex";
import { devFsAllow, projectEnv } from "./env";
import { enabledPlugins } from "../plugins/contract";
import { CORE_PLUGINS } from "../plugins/registry";

export type SourceOption =
  /**
   * Pasta com site.json, pages.json, texts.json e collections/*.json. `showcase` acrescenta
   * as páginas da vitrine (todos os blocos e variações do tema, e as receitas), que a
   * bateria de tema usa (`data/showcase.ts`).
   */
  | { fixtures: string; showcase?: boolean }
  /** Convex de produção (lê CONVEX_URL, PUBLIC_CONVEX_URL ou VITE_CONVEX_URL se `url` faltar). */
  | { convex: { url?: string } };

export interface RubricaOptions {
  /** Especificador do pacote do tema: exporta a definição em "." e o CSS em "./styles.css". */
  theme: string;
  /** De onde vem o conteúdo no build. Padrão: Convex. */
  source?: SourceOption;
  /** Módulos do projeto que exportam `blocks: BlockDefinition[]` (blocos próprios, decisão 3). */
  blocks?: string[];
  /** Componentes ejetados/próprios por tipo de bloco: tipo → especificador do módulo (export default). */
  blockComponents?: Record<string, string>;
  /** Ilhas extras do projeto: nome → especificador (export default). */
  islands?: Record<string, string>;
  /**
   * Painel em `/admin` (padrão: ligado). Com `source: { convex }`, fala com o Convex
   * (endereço de `source.convex.url`, `CONVEX_URL`, `PUBLIC_CONVEX_URL` ou
   * `VITE_CONVEX_URL`); com `source: { fixtures }`, roda em memória sobre os dados de
   * exemplo (demonstração, nada é gravado).
   */
  admin?: boolean;
}

const VIRTUAL = {
  config: "virtual:rubrica/config",
  styles: "virtual:rubrica/styles",
  islands: "virtual:rubrica/islands",
  /** Tema e blocos do projeto, sem a fonte de dados (painel e prévia, no navegador). */
  client: "virtual:rubrica/client",
  /** Como o painel acessa o backend. */
  admin: "virtual:rubrica/admin",
  /** Dados de exemplo do painel em modo demonstração (carregado sob demanda). */
  adminDemo: "virtual:rubrica/admin-demo",
} as const;

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const devFsAllowed = (root: string) => devFsAllow(root, here("../.."));

/**
 * Fontes do tema: o pacote exporta `./fonts.json` (`{ sans, mono, display }`), que o
 * `index` do tema também importa. Procura pelo Node (dependência do projeto) e, para
 * temas do workspace que o testador injeta por alias, pelo `RUBRICA_THEME_ALIAS`.
 */
export function readThemeFonts(themeSpec: string, root: string): ThemeFonts | undefined {
  const spec = `${themeSpec}/fonts.json`;
  let file: string | undefined;
  try {
    file = createRequire(resolve(root, "package.json")).resolve(spec);
  } catch {
    try {
      const aliases: { find: string; replacement: string }[] = JSON.parse(process.env.RUBRICA_THEME_ALIAS ?? "[]");
      file = aliases.find((a) => new RegExp(a.find).test(spec))?.replacement;
    } catch {
      /* alias malformado: sem fontes do tema */
    }
  }
  if (!file || !existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf-8")) as ThemeFonts;
}

function loadSource(source: SourceOption, abs: (p: string) => string, convexUrl: string | undefined): DataSource {
  if ("fixtures" in source) return fixtureSource(abs(source.fixtures));
  return convexSource(convexUrl ?? null);
}

export default function rubrica(options: RubricaOptions): AstroIntegration {
  return {
    name: "@rubrica/core",
    hooks: {
      async "astro:config:setup"({ config, command, updateConfig, injectRoute }) {
        const root = fileURLToPath(config.root);
        const abs = (p: string) => (isAbsolute(p) ? p : resolve(root, p));
        const spec = (s: string) => (s.startsWith(".") ? abs(s) : s);
        const source: SourceOption = options.source ?? { convex: {} };
        // Endereço do Convex: o da opção, senão o do ambiente ou dos .env* do projeto.
        const env = projectEnv(root, command === "dev" ? "development" : "production");
        const convexUrl = "convex" in source ? findConvexUrl(source.convex.url, env) : undefined;

        const sourceCode =
          "fixtures" in source
            ? `import { fixtureSource } from "@rubrica/core/data";\nconst baseSource = fixtureSource(${JSON.stringify(abs(source.fixtures))});`
            : `import { convexSource } from "@rubrica/core/data/convex";\nconst baseSource = convexSource(${JSON.stringify(convexUrl ?? null)});`;
        // Vitrine (só com fixtures): as páginas geradas do tema entram depois dos blocos do projeto.
        const showcase = "fixtures" in source && source.showcase === true;
        const exportSource = showcase
          ? [
              `import { withShowcase } from "@rubrica/core/data/showcase";`,
              `import { CORE_BLOCKS as showcaseCoreBlocks } from "@rubrica/core/blocks";`,
              "export const source = withShowcase(baseSource, theme, [...showcaseCoreBlocks, ...projectBlocks]);",
            ].join("\n")
          : "export const source = baseSource;";

        const blockImports = (options.blocks ?? []).map((m, i) => `import { blocks as projectBlocks${i} } from ${JSON.stringify(spec(m))};`);
        const componentImports = Object.entries(options.blockComponents ?? {}).map(
          ([type, m], i) => `import ProjectBlock${i} from ${JSON.stringify(spec(m))};\nprojectComponents[${JSON.stringify(type)}] = ProjectBlock${i};`,
        );
        const islandImports = Object.entries(options.islands ?? {}).map(
          ([name, m], i) => `import ProjectIsland${i} from ${JSON.stringify(spec(m))};\nislands[${JSON.stringify(name)}] = ProjectIsland${i};`,
        );

        // Fontes: as famílias vêm do site (aparência) ou do tema. O Astro baixa do Google Fonts
        // no build e serve local; o <head> só recebe `<Font>` (ver Document.astro).
        const snapshot = await loadSource(source, abs, convexUrl).load();
        const fontPlan: FontPlan = planFonts(snapshot.site.appearance, readThemeFonts(options.theme, root));

        const modules: Record<string, string> = {
          [VIRTUAL.config]: [
            `export const fontPlan = ${JSON.stringify(fontPlan)};`,
            `import theme from ${JSON.stringify(spec(options.theme))};`,
            sourceCode,
            ...blockImports,
            "export const projectComponents = {};",
            ...componentImports,
            `export const projectBlocks = [${(options.blocks ?? []).map((_, i) => `...projectBlocks${i}`).join(", ")}];`,
            exportSource,
            "export { theme };",
          ].join("\n"),
          [VIRTUAL.styles]: [`import "@rubrica/core/styles/base.css";`, `import ${JSON.stringify(`${spec(options.theme)}/styles.css`)};`].join("\n"),
          [VIRTUAL.client]: [
            `import theme from ${JSON.stringify(spec(options.theme))};`,
            ...blockImports,
            "export const projectComponents = {};",
            ...componentImports,
            `export const projectBlocks = [${(options.blocks ?? []).map((_, i) => `...projectBlocks${i}`).join(", ")}];`,
            "export { theme };",
          ].join("\n"),
          [VIRTUAL.admin]:
            "fixtures" in source
              ? `export const adminBackend = { kind: "demo" };`
              : `export const adminBackend = ${JSON.stringify(
                  convexUrl ? { kind: "convex", url: convexUrl } : { kind: "missing" },
                )};`,
          [VIRTUAL.islands]: [
            `import { CORE_ISLANDS } from "@rubrica/core/islands";`,
            "export const islands = { ...CORE_ISLANDS };",
            ...islandImports,
          ].join("\n"),
        };

        updateConfig({
          output: "static",
          trailingSlash: "never",
          build: { format: "directory" },
          integrations: [react()],
          fonts: fontPlan.fonts.map((f) => ({
            provider: fontProviders.google(),
            name: f.name,
            cssVariable: f.cssVariable,
            weights: f.weights,
            styles: f.styles ?? ["normal"],
            subsets: ["latin", "latin-ext"],
            fallbacks: f.fallbacks,
          })),
          vite: {
            ...(devFsAllowed(root) && { server: { fs: { allow: devFsAllowed(root)! } } }),
            plugins: [
              // Só processa CSS com `@import "tailwindcss"`: o do painel. O tema não usa.
              ...(options.admin === false ? [] : tailwindcss()),
              {
                name: "rubrica:virtual",
                resolveId(id) {
                  return id in modules || id === VIRTUAL.adminDemo ? `\0${id}` : undefined;
                },
                async load(id) {
                  if (id === `\0${VIRTUAL.adminDemo}`) {
                    const snapshot = "fixtures" in source ? await fixtureSource(abs(source.fixtures)).load() : null;
                    return `export default ${JSON.stringify(snapshot)};`;
                  }
                  if (id.startsWith("\0") && id.slice(1) in modules) return modules[id.slice(1)];
                  return undefined;
                },
              },
            ],
            ssr: { noExternal: ["@rubrica/core", /^@rubrica\/theme-/] },
          },
        });

        injectRoute({ pattern: "/[...path]", entrypoint: here("./pages/page.astro"), prerender: true });
        if (options.admin !== false) {
          // Painel: rota do app, fora do sitemap, noindex, sem o CSS do tema.
          injectRoute({ pattern: "/admin/[...rest]", entrypoint: here("./pages/admin.astro"), prerender: true });
          // Prévia ao vivo: componentes e CSS do tema, num iframe do painel.
          injectRoute({ pattern: "/admin/preview", entrypoint: here("./pages/admin-preview.astro"), prerender: true });
        }
        injectRoute({ pattern: "/404", entrypoint: here("./pages/404.astro"), prerender: true });
        injectRoute({ pattern: "/sitemap.xml", entrypoint: here("./pages/sitemap.xml.ts"), prerender: true });
        injectRoute({ pattern: "/robots.txt", entrypoint: here("./pages/robots.txt.ts"), prerender: true });
        injectRoute({ pattern: "/_rubrica/color-mode.js", entrypoint: here("./pages/color-mode.js.ts"), prerender: true });
        injectRoute({ pattern: "/manifest.webmanifest", entrypoint: here("./pages/manifest.webmanifest.ts"), prerender: true });
        // RSS do blog: o do idioma principal e os dos outros idiomas com post traduzido.
        if (enabledPlugins(CORE_PLUGINS, snapshot.site.kind, snapshot.site.plugins).has("blog")) {
          injectRoute({ pattern: "/rss.xml", entrypoint: here("./pages/rss.xml.ts"), prerender: true });
          injectRoute({ pattern: "/[prefix]/rss.xml", entrypoint: here("./pages/rss-locale.xml.ts"), prerender: true });
        }
      },
    },
  };
}
