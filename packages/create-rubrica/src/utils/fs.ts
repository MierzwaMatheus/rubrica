import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Grava `caminho → conteúdo` a partir de `dir`, criando as pastas. */
export function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

export const readText = (path: string): string | null => (existsSync(path) ? readFileSync(path, "utf-8") : null);

export function isEmptyDir(dir: string): boolean {
  return !existsSync(dir) || readdirSync(dir).filter((f) => f !== ".git").length === 0;
}

/** Gerenciador de pacotes do projeto: pnpm se houver pnpm-lock.yaml, npm se houver package-lock.json. */
export function projectPackageManager(dir: string, fallback: "pnpm" | "npm" = "pnpm"): "pnpm" | "npm" {
  if (existsSync(join(dir, "package-lock.json"))) return "npm";
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  return fallback;
}
