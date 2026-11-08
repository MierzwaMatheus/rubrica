/**
 * Dados do catálogo, lidos do monorepo: blocos, variações padrão e plugins do
 * `@rubrica/core`, e as variações de cada tema em packages/themes/* (o que o `exports`
 * "." do pacote aponta).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CORE_VARIANTS, type ThemeDefinition } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { CORE_PLUGINS } from "@rubrica/core/plugins";
import type { CatalogInput, ThemeVariants } from "./catalogo";

export const REPO_ROOT = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));

async function themeVariants(): Promise<ThemeVariants[]> {
  const dir = join(REPO_ROOT, "packages/themes");
  const out: ThemeVariants[] = [];
  for (const name of readdirSync(dir).sort()) {
    const pkgPath = join(dir, name, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { exports?: Record<string, string> };
    const entry = pkg.exports?.["."];
    if (!entry) continue;
    const mod = (await import(pathToFileURL(join(dir, name, entry)).href)) as { default: ThemeDefinition };
    out.push({ id: mod.default.id, variants: mod.default.variants ?? {} });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadCatalogInput(): Promise<CatalogInput> {
  return { blocks: CORE_BLOCKS, coreVariants: CORE_VARIANTS, plugins: CORE_PLUGINS, themes: await themeVariants() };
}

export const CATALOG_FILES = { pt: "docs/guia/blocos.md", en: "docs/guia/blocos.en.md" } as const;
