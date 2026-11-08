/**
 * O tema instalado no projeto, visto pelo MCP: variações por bloco e receitas de página.
 *
 * O tema é um pacote em TypeScript com React (o Node não roda TS dentro de node_modules),
 * e só o build do Astro o carrega. O MCP faz como o CLI (`create-rubrica`, introspect):
 * empacota um trecho que importa o tema com o esbuild que vem com o `convex` do projeto,
 * deixando React de fora, e lê só os dados (`variants`, `recipes`, quais blocos o tema
 * desenha). Nada é renderizado. Sem projeto, sem esbuild ou com erro, valem as variações
 * e as receitas do núcleo, com o motivo em `problem`.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CORE_VARIANTS, recipeFor, variantsFor, type Recipe, type SiteKind, type VariantOption } from "@rubrica/core";

export interface ThemeInfo {
  /** Pacote (ou caminho) do tema, como o `astro.config.ts` o importa. */
  package: string | null;
  id: string;
  label?: string;
  /** `tema`: lido do pacote instalado; `nucleo`: não deu para ler, valem as do núcleo. */
  source: "tema" | "nucleo";
  /** Variações que o tema declara, por tipo de bloco. */
  variants: Partial<Record<string, VariantOption[]>>;
  /** Blocos que o tema desenha com componente próprio (não herdam as variações do núcleo). */
  overridden: string[];
  /** Receitas que o tema declara; o tipo que faltar usa a do núcleo. */
  recipes: Partial<Record<SiteKind, Recipe>>;
  problem?: string;
}

export const CORE_THEME: ThemeInfo = { package: null, id: "nucleo", source: "nucleo", variants: {}, overridden: [], recipes: {} };

/** Variações do bloco no tema (a primeira é a padrão). Vazio: o bloco não tem variações. */
export function themeVariants(theme: ThemeInfo, type: string): VariantOption[] {
  if (theme.source === "nucleo") return CORE_VARIANTS[type] ?? [];
  return variantsFor({ variants: theme.variants, blocks: Object.fromEntries(theme.overridden.map((t) => [t, () => null])) }, type);
}

/** Receita do tema para o tipo de site; sem ela, a do núcleo. */
export function themeRecipe(theme: ThemeInfo, kind: SiteKind): Recipe {
  return recipeFor({ recipes: theme.recipes }, kind);
}

function readOrNull(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/**
 * Pacote do tema do projeto: o `theme` do `astro.config.ts` (o que o build usa) e, sem
 * ele, o `tema` do `rubrica.json` (`@rubrica/theme-<tema>`).
 */
export function themePackageOf(root: string): string | null {
  const astro = readOrNull(join(root, "astro.config.ts")) ?? readOrNull(join(root, "astro.config.mjs"));
  const fromAstro = astro ? /\btheme:\s*["']([^"']+)["']/.exec(astro)?.[1] : undefined;
  if (fromAstro) return fromAstro.startsWith(".") ? resolve(root, fromAstro) : fromAstro;
  const json = readOrNull(join(root, "rubrica.json"));
  if (json) {
    try {
      const tema = (JSON.parse(json) as { tema?: unknown }).tema;
      if (typeof tema === "string" && /^[a-z][a-z0-9-]*$/.test(tema)) return `@rubrica/theme-${tema}`;
    } catch {
      /* rubrica.json inválido: sem tema */
    }
  }
  return null;
}

interface Esbuild {
  build(options: Record<string, unknown>): Promise<unknown>;
}

const EXTERNAL = ["react", "react/*", "react-dom", "react-dom/*", "astro", "astro/*", "convex", "convex/*"];

let counter = 0;

/** Lê o tema do projeto. Nunca lança: em qualquer falha devolve o do núcleo com o motivo. */
export async function loadProjectTheme(root: string | null): Promise<ThemeInfo> {
  if (!root) return { ...CORE_THEME, problem: "Projeto não encontrado: valem as variações e receitas do núcleo." };
  const pkg = themePackageOf(root);
  if (!pkg) return { ...CORE_THEME, problem: "Não achei o tema no astro.config.ts nem no rubrica.json: valem as variações e receitas do núcleo." };
  let esbuild: Esbuild;
  try {
    const req = createRequire(join(root, "package.json"));
    esbuild = createRequire(req.resolve("convex/package.json"))("esbuild") as Esbuild;
  } catch {
    return { ...CORE_THEME, package: pkg, problem: "Sem o esbuild do convex no projeto (rode pnpm install): valem as variações e receitas do núcleo." };
  }
  // Dentro do node_modules do projeto: os imports deixados de fora (React) resolvem dali.
  const dir = join(root, "node_modules", ".cache", "rubrica-mcp");
  const out = join(dir, `tema-${process.pid}-${++counter}.mjs`);
  try {
    mkdirSync(dir, { recursive: true });
    await esbuild.build({
      stdin: {
        contents: `import theme from ${JSON.stringify(pkg)};
export default JSON.parse(JSON.stringify({ id: theme.id, label: theme.label, variants: theme.variants ?? {}, overridden: Object.keys(theme.blocks ?? {}), recipes: theme.recipes ?? {} }));`,
        resolveDir: root,
        loader: "tsx",
        sourcefile: "rubrica-mcp-tema.tsx",
      },
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
    const data = ((await import(`${pathToFileURL(out).href}?t=${Date.now()}`)) as { default: Omit<ThemeInfo, "package" | "source"> }).default;
    return { package: pkg, source: "tema", id: data.id, label: data.label, variants: data.variants ?? {}, overridden: data.overridden ?? [], recipes: data.recipes ?? {} };
  } catch (e) {
    const reason = String((e as Error).message ?? e).split("\n")[0]!.slice(0, 200);
    return { ...CORE_THEME, package: pkg, problem: `Não consegui ler o tema ${pkg} (${reason}): valem as variações e receitas do núcleo.` };
  } finally {
    if (existsSync(out)) rmSync(out, { force: true });
  }
}
