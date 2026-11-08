/** Build da demo (apps/demo) com um tema e um tipo de site, numa pasta própria. */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { SiteKind } from "./types.ts";

export const SITE_KINDS: SiteKind[] = ["pessoal", "empresa"];

/** Sobe a partir de `from` até achar o pnpm-workspace.yaml do monorepo. */
export function findRepoRoot(from: string = process.cwd()): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml")) && existsSync(join(dir, "apps", "demo"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error("monorepo do Rubrica não encontrado (rode dentro dele ou use --raiz)");
    dir = parent;
  }
}

/** "padrao" e "@rubrica/theme-padrao" apontam para o mesmo pacote. */
export function themeName(input: string): string {
  return input.startsWith("@") || input.includes("/") ? input : `@rubrica/theme-${input}`;
}

export async function listThemes(root: string): Promise<string[]> {
  const dir = join(root, "packages", "themes");
  if (!existsSync(dir)) return [];
  const names: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const pkg = join(dir, entry.name, "package.json");
    if (entry.isDirectory() && existsSync(pkg)) names.push(JSON.parse(await readFile(pkg, "utf8")).name);
  }
  return names.sort();
}

/**
 * Se o tema é um pacote do workspace que a demo não declara como dependência,
 * devolve aliases do Vite (lidos do `exports` dele) para a demo conseguir importá-lo.
 */
export async function themeAliases(root: string, theme: string): Promise<{ find: string; replacement: string }[]> {
  const base = join(root, "packages", "themes");
  if (!existsSync(base)) return [];
  for (const entry of await readdir(base)) {
    const pkgPath = join(base, entry, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    if (pkg.name !== theme) continue;
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    return Object.entries<string>(pkg.exports ?? {})
      .filter(([, target]) => typeof target === "string")
      .map(([key, target]) => ({
        find: `^${escape(key === "." ? theme : `${theme}/${key.replace(/^\.\//, "")}`)}$`,
        replacement: join(base, entry, target),
      }));
  }
  return [];
}

export function hasFixtures(root: string, kind: string): boolean {
  return existsSync(join(root, "apps", "demo", "fixtures", kind, "site.json"));
}

export interface BuildResult {
  dist: string;
  error?: string;
}

export async function buildDemo(args: { root: string; theme: string; kind: SiteKind | string; outDir?: string }): Promise<BuildResult> {
  const demo = join(args.root, "apps", "demo");
  const dist = args.outDir ?? (await mkdtemp(join(tmpdir(), `rubrica-tema-${args.kind}-`)));
  const astroBin = join(dirname(createRequire(join(demo, "package.json")).resolve("astro/package.json")), "bin", "astro.mjs");
  const aliases = await themeAliases(args.root, args.theme);
  const env = {
    ...process.env,
    SITE: args.kind,
    THEME: args.theme,
    ASTRO_TELEMETRY_DISABLED: "1",
    ...(aliases.length && { RUBRICA_THEME_ALIAS: JSON.stringify(aliases) }),
  };
  const bin = existsSync(astroBin) ? astroBin : join(dirname(astroBin), "astro.js");
  return new Promise((done) => {
    const child = spawn(process.execPath, [bin, "build", "--outDir", dist], { cwd: demo, env });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => done(code === 0 ? { dist } : { dist, error: output.trim().split("\n").slice(-25).join("\n") }));
    child.on("error", (e) => done({ dist, error: e.message }));
  });
}
