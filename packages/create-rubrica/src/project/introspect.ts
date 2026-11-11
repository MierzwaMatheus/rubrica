/**
 * Lê o que o projeto tem instalado (versão e funções do `@rubrica/core`, receitas do
 * tema), empacotando um trecho com o esbuild que vem com o `convex` do projeto. Os
 * pacotes do Rubrica são TypeScript (o Node não roda TS dentro de node_modules), por
 * isso não dá para só importar.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Recipe } from "@rubrica/core";
import type { SiteKind } from "@rubrica/core";

const EXTERNAL = ["convex", "convex/*", "@convex-dev/auth", "@convex-dev/auth/*", "@auth/core", "@auth/core/*", "react", "react/*", "react-dom", "react-dom/*", "astro", "astro/*"];

interface Esbuild {
  build(options: Record<string, unknown>): Promise<unknown>;
}

function esbuildFor(projectDir: string): Esbuild {
  const req = createRequire(join(projectDir, "package.json"));
  const convexPkg = req.resolve("convex/package.json");
  return createRequire(convexPkg)("esbuild") as Esbuild;
}

let counter = 0;

/** Empacota `code` (ESM, com imports resolvidos a partir do projeto) e importa o resultado. */
export async function evaluateInProject<T>(projectDir: string, code: string): Promise<T> {
  const esbuild = esbuildFor(projectDir);
  const dir = join(projectDir, ".rubrica", "tmp");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `introspect-${process.pid}-${++counter}.mjs`);
  try {
    await esbuild.build({
      stdin: { contents: code, resolveDir: projectDir, loader: "tsx", sourcefile: "rubrica-introspect.tsx" },
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
      jsx: "automatic",
      outfile: out,
      external: EXTERNAL,
      loader: { ".css": "empty", ".json": "json", ".svg": "empty", ".png": "empty", ".woff2": "empty" },
      logLevel: "silent",
    });
    const mod = (await import(`${pathToFileURL(out).href}?t=${Date.now()}`)) as { default: T };
    return mod.default;
  } finally {
    rmSync(out, { force: true });
  }
}

export interface InstalledCore {
  version: string;
  /** Funções de cada módulo do núcleo instalado. */
  modules: Record<string, string[]>;
  /** Migrações de dados declaradas pelo núcleo (se a versão tiver). */
  migrations: CoreMigration[];
}

export interface CoreMigration {
  id: string;
  /** Versão do núcleo que trouxe a migração. */
  since: string;
  description: string;
  /** Função a rodar com `npx convex run` (ex.: `rubrica/migrations:run`). */
  fn: string;
  args?: Record<string, unknown>;
}

/**
 * Pasta de um pacote instalado: procura `node_modules/<pacote>` subindo as pastas e, só se
 * não achar, pergunta ao `require.resolve`. Nessa ordem porque o Node guarda o caminho
 * resolvido em cache dentro do processo: depois do `update` instalar a versão nova, o
 * `require.resolve` ainda devolveria a pasta da antiga (que o pnpm mantém no disco).
 */
export function findPackageDir(fromDir: string, pkg: string): string | null {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, "node_modules", pkg);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    return dirname(createRequire(join(fromDir, "package.json")).resolve(`${pkg}/package.json`));
  } catch {
    return null;
  }
}

export function installedVersion(projectDir: string, pkg: string): string | null {
  const dir = findPackageDir(projectDir, pkg);
  if (!dir) return null;
  try {
    return (JSON.parse(readFileSync(join(dir, "package.json"), "utf-8")) as { version: string }).version;
  } catch {
    return null;
  }
}

/** Versão, funções e migrações do `@rubrica/core` instalado no projeto. */
export async function loadInstalledCore(projectDir: string): Promise<InstalledCore> {
  const version = installedVersion(projectDir, "@rubrica/core");
  if (!version) throw new Error("O @rubrica/core não está instalado neste projeto (rode pnpm install).");
  const data = await evaluateInProject<{ modules: Record<string, string[]>; migrations: CoreMigration[] }>(
    projectDir,
    `import * as core from "@rubrica/core/convex";
const rubrica = core.createRubrica();
const modules = Object.fromEntries(core.RUBRICA_MODULES.map((m) => [m, Object.keys(rubrica[m])]));
const migrations = Array.isArray(core.RUBRICA_DATA_MIGRATIONS) ? core.RUBRICA_DATA_MIGRATIONS : [];
export default { modules, migrations };`,
  );
  return { version, ...data };
}

/** Receitas do tema instalado (decisão 24), ou `null` se o tema não declara. */
export async function loadThemeRecipe(projectDir: string, themePkg: string, kind: SiteKind): Promise<Recipe | null> {
  return evaluateInProject<Recipe | null>(
    projectDir,
    `import theme from ${JSON.stringify(themePkg)};
export default JSON.parse(JSON.stringify(theme.recipes?.[${JSON.stringify(kind)}] ?? null));`,
  );
}
