/**
 * Variáveis dos arquivos `.env*` do projeto, na ordem do Vite (o mais específico vence):
 * `.env`, `.env.local`, `.env.<modo>`, `.env.<modo>.local`. O ambiente do processo vence
 * todos. O Astro só carrega esses arquivos em `import.meta.env`, não no `process.env` que a
 * integração lê no config; sem isto, o `CONVEX_URL` que o `convex dev` grava no
 * `.env.local` não chega ao build.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, isAbsolute } from "node:path";

export function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2]!;
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "").trim();
    out[m[1]!] = value;
  }
  return out;
}

export function projectEnv(root: string, mode: string, processEnv: Record<string, string | undefined> = process.env): Record<string, string | undefined> {
  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];
  const fromFiles: Record<string, string> = {};
  for (const f of files) {
    const path = join(root, f);
    if (existsSync(path)) Object.assign(fromFiles, parseDotenv(readFileSync(path, "utf-8")));
  }
  return { ...fromFiles, ...processEnv };
}

/** Raiz do workspace como o Vite procura: a pasta com pnpm-workspace.yaml, lerna.json ou `workspaces` no package.json; senão o próprio projeto. */
export function workspaceRoot(root: string): string {
  let dir = root;
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml")) || existsSync(join(dir, "lerna.json"))) return dir;
    const pkg = join(dir, "package.json");
    if (existsSync(pkg)) {
      try {
        if (JSON.parse(readFileSync(pkg, "utf-8")).workspaces) return dir;
      } catch {
        /* package.json inválido: segue subindo */
      }
    }
    const up = dirname(dir);
    if (up === dir) return root;
    dir = up;
  }
}

/**
 * Pastas que o servidor de desenvolvimento pode servir. Só muda o padrão do Vite quando o
 * núcleo está fora do workspace do projeto (`create --local`, que liga o clone do
 * monorepo): sem isso o painel e as ilhas dão 403 no `astro dev`.
 */
export function devFsAllow(root: string, corePackageDir: string): string[] | undefined {
  const ws = workspaceRoot(root);
  const rel = relative(ws, corePackageDir);
  const inside = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  return inside || rel === "" ? undefined : [ws, corePackageDir];
}

/**
 * Endereço HTTP do Convex (`.convex.site`) que recebe os formulários das ilhas. Ordem:
 * `PUBLIC_RUBRICA_API` (API em outro endereço), `CONVEX_SITE_URL` (o `convex dev` grava no
 * `.env.local`) e o derivado do `CONVEX_URL` (`https://x.convex.cloud` → `https://x.convex.site`).
 * Sem nenhum, `undefined`: o envio fica desativado.
 */
export function findApiUrl(env: Record<string, string | undefined>): string | undefined {
  const clean = (v: string | undefined) => v?.trim().replace(/\/+$/, "") || undefined;
  const explicit = clean(env.PUBLIC_RUBRICA_API) ?? clean(env.CONVEX_SITE_URL);
  if (explicit) return explicit;
  const cloud = clean(env.CONVEX_URL) ?? clean(env.PUBLIC_CONVEX_URL) ?? clean(env.VITE_CONVEX_URL);
  const m = cloud && /^(https?:\/\/[^/]+)\.convex\.cloud$/.exec(cloud);
  return m ? `${m[1]}.convex.site` : undefined;
}
