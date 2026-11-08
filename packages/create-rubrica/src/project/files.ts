/**
 * Arquivos de um projeto v2 (RFC: "Visão geral"). O projeto não é cópia do template:
 * depende de `@rubrica/core` e de um tema e guarda só configuração, o `convex/` de
 * reexportações e as personalizações (`src/blocks/`, `src/overrides/`).
 *
 * Funções puras: devolvem `caminho → conteúdo`. Quem grava é o comando.
 */
import corePkg from "@rubrica/core/package.json";
import mcpPkg from "../../../mcp/package.json";
import agentsMd from "../../../../AGENTS.md";
import type { RubricaState } from "../state.js";
import { themePackage } from "../themes.js";
import { convexFiles, convexOwnedFiles } from "./convex.js";
import { defaultHosting, hostingFiles, type HostingConfig } from "./hosting.js";

/** Versão do núcleo com que este CLI foi feito. */
export const CORE_VERSION: string = corePkg.version;

/** Faixas das dependências de pares do núcleo (Astro, React, Convex, login). */
const PEERS = corePkg.peerDependencies as Record<string, string>;

export interface DependencySpecs {
  /** Especificador do `@rubrica/core` (`^2.0.0`, `link:../rubrica/packages/core`). */
  core: string;
  /** Especificador do pacote do tema. */
  theme: string;
  /** Especificador do próprio CLI (fica nas devDependencies, para `npx rubrica`). */
  cli?: string;
  /** Especificador do `@rubrica/mcp` (devDependencies): o `.mcp.json` roda `npx rubrica mcp`, que usa ele. */
  mcp?: string;
}

/** Versão do servidor MCP com que este CLI foi feito. */
export const MCP_VERSION: string = mcpPkg.version;

export const defaultDependencySpecs = (): DependencySpecs => ({ core: `^${CORE_VERSION}`, theme: `^${CORE_VERSION}`, cli: `^${CLI_PACKAGE_VERSION}`, mcp: `^${MCP_VERSION}` });

declare const __CLI_VERSION__: string | undefined;
const CLI_PACKAGE_VERSION = typeof __CLI_VERSION__ === "string" ? __CLI_VERSION__ : CORE_VERSION;

export function packageJson(name: string, state: RubricaState, deps: DependencySpecs, previous?: Record<string, unknown>): string {
  const pick = (k: string) => PEERS[k] ?? "latest";
  const dependencies: Record<string, string> = {
    ...((previous?.dependencies as Record<string, string>) ?? {}),
    "@astrojs/react": pick("@astrojs/react"),
    "@auth/core": pick("@auth/core"),
    "@convex-dev/auth": pick("@convex-dev/auth"),
    "@rubrica/core": deps.core,
    [themePackage(state.tema)]: deps.theme,
    astro: pick("astro"),
    convex: pick("convex"),
    react: pick("react"),
    "react-dom": pick("react-dom"),
  };
  const devDependencies: Record<string, string> = {
    ...((previous?.devDependencies as Record<string, string>) ?? {}),
    "@types/node": "^22.0.0",
    "@types/react": "^19.2.0",
    typescript: "^5.9.0",
    ...(deps.cli && { "create-rubrica": deps.cli }),
    ...(deps.mcp && { "@rubrica/mcp": deps.mcp }),
  };
  const pkg = {
    name,
    private: true,
    type: "module",
    scripts: {
      dev: "astro dev",
      "dev:convex": "convex dev",
      build: "astro build",
      preview: "astro preview",
      check: "tsc --noEmit -p tsconfig.json && tsc --noEmit -p convex/tsconfig.json",
      test: "rubrica verificar",
      rubrica: "rubrica",
    },
    dependencies: sortKeys(dependencies),
    devDependencies: sortKeys(devDependencies),
    ...(previous?.pnpm ? { pnpm: previous.pnpm } : { pnpm: { onlyBuiltDependencies: ["esbuild", "sharp"] } }),
  };
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

export const MARK = {
  themeStart: "// rubrica:tema:inicio",
  themeEnd: "// rubrica:tema:fim",
  ejectedStart: "// rubrica:ejetados:inicio",
  ejectedEnd: "// rubrica:ejetados:fim",
} as const;

/** Trecho do tema no `astro.config.ts` (entre os marcadores). */
export function themeSection(state: Pick<RubricaState, "tema">): string {
  return `      ${MARK.themeStart}\n      theme: ${JSON.stringify(themePackage(state.tema))},\n      ${MARK.themeEnd}`;
}

/** Trecho dos componentes ejetados (entre os marcadores). */
export function ejectedSection(state: Pick<RubricaState, "ejetados">): string {
  const entries = Object.values(state.ejetados ?? {})
    .sort((a, b) => a.tipo.localeCompare(b.tipo))
    .map((e) => `        ${JSON.stringify(e.tipo)}: ${JSON.stringify(`./${e.arquivo}`)},`);
  return [`      ${MARK.ejectedStart}`, "      blockComponents: {", ...entries, "        ...ownComponents,", "      },", `      ${MARK.ejectedEnd}`].join("\n");
}

export function astroConfig(state: RubricaState): string {
  return `/**
 * Configuração do site. O CLI mantém os trechos entre marcadores "rubrica:" (tema e
 * componentes ejetados): mude-os com npx create-rubrica config e ejetar.
 *
 * Conteúdo do build: o Convex de CONVEX_URL. Com RUBRICA_FIXTURES=<pasta>, arquivos JSON
 * (site.json, pages.json, collections/*.json), para ver o site sem banco.
 */
import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";
import { components as ownComponents } from "./src/blocks";

export default defineConfig({
  site: ${JSON.stringify(state.identidade.url)},
  integrations: [
    rubrica({
${themeSection(state)}
      source: process.env.RUBRICA_FIXTURES ? { fixtures: process.env.RUBRICA_FIXTURES } : undefined,
      // Blocos próprios (definições). Os componentes deles vão em src/blocks/index.ts.
      blocks: ["./src/blocks/index.ts"],
${ejectedSection(state)}
    }),
  ],
});
`;
}

/** Troca um trecho entre marcadores. Lança se os marcadores sumiram (arquivo mexido à mão). */
export function replaceSection(source: string, start: string, end: string, section: string, file = "astro.config.ts"): string {
  const i = source.indexOf(start);
  const j = source.indexOf(end);
  if (i === -1 || j === -1 || j < i) {
    throw new Error(`Não achei os marcadores "${start}" e "${end}" no ${file}. Volte o trecho ao formato gerado pelo CLI e rode de novo.`);
  }
  const lineStart = source.lastIndexOf("\n", i) + 1;
  const lineEnd = source.indexOf("\n", j);
  return source.slice(0, lineStart) + section + (lineEnd === -1 ? "" : source.slice(lineEnd));
}

export const BLOCKS_INDEX = `/**
 * Blocos próprios do projeto (RFC v2: "Personalização no projeto", item 2). Cada bloco
 * tem a definição (campos, com defineBlock) e um componente React puro. O site e o
 * backend (convex/rubrica.config.ts) leem as definições daqui; o painel os mostra no
 * editor de páginas como os do núcleo.
 *
 *   import { defineBlock, field } from "@rubrica/core";
 *   export const blocks = [defineBlock({ type: "meu-bloco", label: "Meu bloco", ... })];
 *   export const components = { "meu-bloco": "./src/blocks/MeuBloco.tsx" };
 */
import type { BlockDefinition } from "@rubrica/core";

export const blocks: BlockDefinition[] = [];

/** Componente de cada bloco próprio: tipo → arquivo (export default), a partir da raiz. */
export const components: Record<string, string> = {};
`;

export const TSCONFIG = `{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "jsx": "react-jsx", "types": ["node"] },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules", "convex"]
}
`;

export const GITIGNORE = `node_modules
dist
.astro
.vercel
.env*
!.env.example
# Arquivos de trabalho do CLI (export e import do migrar, cópias temporárias)
.rubrica/
`;

export const ENV_EXAMPLE = `# Endereço do Convex usado no build (o npx convex dev grava o do computador no .env.local).
CONVEX_URL=
# Endereço HTTP do Convex (termina em .convex.site), para os formulários do site.
PUBLIC_RUBRICA_API=
`;

export const MCP_JSON = `${JSON.stringify({ mcpServers: { rubrica: { command: "npx", args: ["rubrica", "mcp"] } } }, null, 2)}\n`;

export const CLAUDE_MD = `# Instruções para o Claude Code

As instruções deste projeto ficam no \`AGENTS.md\`, que vale para qualquer agente:

@AGENTS.md
`;

export function readme(state: RubricaState): string {
  return `# ${state.identidade.nome}

Site feito com o [Rubrica](https://github.com/MierzwaMatheus/rubrica) v2 (tema \`${state.tema}\`, tipo \`${state.tipo}\`).

| O quê | Comando |
|---|---|
| Ligar o Convex, criar o admin e o conteúdo inicial | \`npx create-rubrica setup\` |
| Abrir o site no computador | \`pnpm dev\` (e \`pnpm dev:convex\` em outro terminal) |
| Colocar no ar (Vercel) | \`npx create-rubrica publicar\` |
| Atualizar o Rubrica | \`npx create-rubrica update --dry-run\` |

Instruções para agentes: [AGENTS.md](./AGENTS.md).
`;
}

export interface ProjectFilesOptions {
  name: string;
  state: RubricaState;
  deps: DependencySpecs;
  hosting?: HostingConfig;
  /** Funções por módulo do núcleo (sem: as do manifesto deste CLI). */
  modules?: Record<string, readonly string[]>;
  /** package.json anterior (o `migrar` mantém o que a pessoa tinha). */
  previousPackageJson?: Record<string, unknown>;
}

/** Tudo o que o `create` grava (o `migrar` também, depois de tirar o código da v1). */
export function projectFiles(options: ProjectFilesOptions): Record<string, string> {
  const { state } = options;
  return {
    "package.json": packageJson(options.name, state, options.deps, options.previousPackageJson),
    "astro.config.ts": astroConfig(state),
    "tsconfig.json": TSCONFIG,
    ".gitignore": GITIGNORE,
    ".env.example": ENV_EXAMPLE,
    ".mcp.json": MCP_JSON,
    "AGENTS.md": agentsMd,
    "CLAUDE.md": CLAUDE_MD,
    "README.md": readme(state),
    "src/blocks/index.ts": BLOCKS_INDEX,
    ...convexOwnedFiles(),
    ...convexFiles(options.modules),
    ...hostingFiles(options.hosting ?? defaultHosting()),
    "rubrica.json": `${JSON.stringify(state, null, 2)}\n`,
  };
}
