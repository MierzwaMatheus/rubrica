/**
 * Monta um projeto temporário do Rubrica com um layout e uma aparência aplicados pelo
 * próprio CLI, como o `create-rubrica` faria. Usado por scripts/preview-layout.ts e pelo
 * build dos previews do site público (site/scripts/build-previews.ts).
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { applyLayout } from "../../cli/src/transforms/applyLayout";
import { applyTheme } from "../../cli/src/transforms/applyTheme";
import { applyAppearance } from "../../cli/src/transforms/applyAppearance";
import { applyFont } from "../../cli/src/transforms/applyFont";
import type { ColorMode, LayoutSpec, Texture } from "../../cli/src/layouts";

export const ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Endereço fictício do Convex: no build de produção os dados vêm de public/data, mas o app
 * cria o cliente do Convex ao iniciar e quebra sem endereço nenhum.
 */
/** O que não vai para o projeto temporário: dependências, artefatos e o que o create apaga. */
const SKIP_TOP_LEVEL = new Set([
  ".git", "dist", "reports", ".playwright-mcp", "cli", "templates", "docs", "site", ".stryker-tmp", ".env.local",
]);

export const PREVIEW_CONVEX_URL = "https://preview-layout.convex.cloud";

export interface LayoutProjectOptions {
  layout: LayoutSpec;
  dir: string;
  scheme?: string;
  mode?: ColorMode;
  toggle?: boolean;
  texture?: Texture;
}

const fsMod = {
  ...(await import("node:fs/promises")),
  exists: async (p: string) => existsSync(p),
} as never;

/** Copia o repositório (sem dependências nem artefatos) e aplica layout, esquema, aparência e fontes. */
export async function prepareLayoutProject(o: LayoutProjectOptions): Promise<void> {
  const { layout, dir } = o;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // Cópia em Node puro (a imagem de build da Vercel não tem rsync).
  cpSync(ROOT, dir, {
    recursive: true,
    filter: (src) => {
      const parts = relative(ROOT, src).split(sep);
      return !parts.includes("node_modules") && !SKIP_TOP_LEVEL.has(parts[0]);
    },
  });
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"));

  await applyLayout(layout.id, { projectDir: dir, templatesDir: join(ROOT, "templates") }, fsMod);
  const cssPath = join(dir, "src", "index.css");
  const htmlPath = join(dir, "index.html");
  await applyTheme({ preset: o.scheme ?? layout.recommended.scheme }, cssPath, fsMod);
  await applyAppearance(
    {
      colorMode: o.mode ?? layout.recommended.mode,
      colorModeToggle: o.toggle ?? true,
      texture: o.texture ?? layout.recommended.texture,
    },
    htmlPath,
    fsMod
  );
  await applyFont({ fontSans: layout.fonts.sans[0] ?? "Inter", fontMono: layout.fonts.mono }, { css: cssPath, html: htmlPath }, fsMod);
}

/** `tsc --noEmit` no projeto. Devolve a saída com erros, ou null se estiver limpo. */
export function typecheckProject(dir: string): string | null {
  try {
    execFileSync(join(ROOT, "node_modules", ".bin", "tsc"), ["--noEmit", "-p", join(dir, "tsconfig.json")], { cwd: dir, stdio: "pipe" });
    return null;
  } catch (e) {
    return String((e as { stdout?: Buffer }).stdout ?? e).replaceAll(`${dir}/`, "");
  }
}

/** `vite build` de produção (dados de exemplo de public/data). */
export function buildProject(dir: string, extraArgs: string[] = []): void {
  execFileSync(join(ROOT, "node_modules", ".bin", "vite"), ["build", "--logLevel", "warn", ...extraArgs], {
    cwd: dir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", VITE_CONVEX_URL: process.env.VITE_CONVEX_URL ?? PREVIEW_CONVEX_URL },
  });
}
