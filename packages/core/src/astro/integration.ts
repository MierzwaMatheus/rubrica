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
import { fileURLToPath } from "node:url";
import { isAbsolute, resolve } from "node:path";

export type SourceOption =
  /** Pasta com site.json, pages.json, texts.json e collections/*.json. */
  | { fixtures: string }
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
}

const VIRTUAL = {
  config: "virtual:rubrica/config",
  styles: "virtual:rubrica/styles",
  islands: "virtual:rubrica/islands",
} as const;

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default function rubrica(options: RubricaOptions): AstroIntegration {
  return {
    name: "@rubrica/core",
    hooks: {
      "astro:config:setup"({ config, updateConfig, injectRoute }) {
        const root = fileURLToPath(config.root);
        const abs = (p: string) => (isAbsolute(p) ? p : resolve(root, p));
        const spec = (s: string) => (s.startsWith(".") ? abs(s) : s);
        const source: SourceOption = options.source ?? { convex: {} };

        const sourceCode =
          "fixtures" in source
            ? `import { fixtureSource } from "@rubrica/core/data";\nexport const source = fixtureSource(${JSON.stringify(abs(source.fixtures))});`
            : `import { convexSource } from "@rubrica/core/data/convex";\nexport const source = convexSource(${JSON.stringify(source.convex.url ?? null)});`;

        const blockImports = (options.blocks ?? []).map((m, i) => `import { blocks as projectBlocks${i} } from ${JSON.stringify(spec(m))};`);
        const componentImports = Object.entries(options.blockComponents ?? {}).map(
          ([type, m], i) => `import ProjectBlock${i} from ${JSON.stringify(spec(m))};\nprojectComponents[${JSON.stringify(type)}] = ProjectBlock${i};`,
        );
        const islandImports = Object.entries(options.islands ?? {}).map(
          ([name, m], i) => `import ProjectIsland${i} from ${JSON.stringify(spec(m))};\nislands[${JSON.stringify(name)}] = ProjectIsland${i};`,
        );

        const modules: Record<string, string> = {
          [VIRTUAL.config]: [
            `import theme from ${JSON.stringify(spec(options.theme))};`,
            sourceCode,
            ...blockImports,
            "export const projectComponents = {};",
            ...componentImports,
            `export const projectBlocks = [${(options.blocks ?? []).map((_, i) => `...projectBlocks${i}`).join(", ")}];`,
            "export { theme };",
          ].join("\n"),
          [VIRTUAL.styles]: [`import "@rubrica/core/styles/base.css";`, `import ${JSON.stringify(`${spec(options.theme)}/styles.css`)};`].join("\n"),
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
          vite: {
            plugins: [
              {
                name: "rubrica:virtual",
                resolveId(id) {
                  return id in modules ? `\0${id}` : undefined;
                },
                load(id) {
                  if (id.startsWith("\0") && id.slice(1) in modules) return modules[id.slice(1)];
                  return undefined;
                },
              },
            ],
            ssr: { noExternal: ["@rubrica/core", /^@rubrica\/theme-/] },
          },
        });

        injectRoute({ pattern: "/[...path]", entrypoint: here("./pages/page.astro"), prerender: true });
        injectRoute({ pattern: "/404", entrypoint: here("./pages/404.astro"), prerender: true });
        injectRoute({ pattern: "/sitemap.xml", entrypoint: here("./pages/sitemap.xml.ts"), prerender: true });
        injectRoute({ pattern: "/robots.txt", entrypoint: here("./pages/robots.txt.ts"), prerender: true });
        injectRoute({ pattern: "/_rubrica/color-mode.js", entrypoint: here("./pages/color-mode.js.ts"), prerender: true });
      },
    },
  };
}
