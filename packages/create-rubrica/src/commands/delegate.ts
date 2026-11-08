/**
 * Comandos que rodam outro pacote do Rubrica: `testar-tema` (@rubrica/theme-tester) e
 * `mcp` (@rubrica/mcp). O pacote vem do projeto (ou do monorepo, subindo as pastas).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { findPackageDir } from "../project/introspect.js";

/** Bin de um pacote do Rubrica: instalado no projeto, ou na pasta do monorepo. */
export function findRubricaBin(cwd: string, pkg: string, monorepoDir: string, bin: string): string | null {
  const installed = findPackageDir(cwd, pkg);
  if (installed && existsSync(join(installed, bin))) return join(installed, bin);
  let dir = cwd;
  for (;;) {
    const candidate = join(dir, "packages", monorepoDir, bin);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export interface DelegateDeps {
  cwd: string;
  /** Roda o bin (teste troca). Devolve o código de saída. */
  spawn?: (bin: string, args: string[]) => number;
  /** Mensagens de erro: vão para o stderr (o stdout do `mcp` é o protocolo). */
  error?: (message: string) => void;
  /** Acha o bin (teste troca para simular o pacote ausente). */
  findBin?: typeof findRubricaBin;
}

const defaultSpawn = (bin: string, args: string[]) => spawnSync(process.execPath, [bin, ...args], { stdio: "inherit" }).status ?? 1;

export function runThemeTester(argv: string[], deps: DelegateDeps): number {
  const bin = (deps.findBin ?? findRubricaBin)(deps.cwd, "@rubrica/theme-tester", "theme-tester", "bin/rubrica-testar-tema.js");
  if (!bin) {
    (deps.error ?? console.error)(
      "A bateria de tema vem no pacote @rubrica/theme-tester, que não está instalado aqui.\n" +
        "Instale com pnpm add -D @rubrica/theme-tester (ela roda o tema sobre os sites de demonstração do monorepo; use --raiz <pasta do monorepo>),\n" +
        "ou rode no monorepo do Rubrica: pnpm testar-tema <tema>.",
    );
    return 1;
  }
  return (deps.spawn ?? defaultSpawn)(bin, argv);
}

export function runMcp(argv: string[], deps: DelegateDeps): number {
  const bin = (deps.findBin ?? findRubricaBin)(deps.cwd, "@rubrica/mcp", "mcp", "bin/rubrica-mcp.js");
  if (!bin) {
    (deps.error ?? console.error)(
      "[rubrica mcp] O servidor MCP vem no pacote @rubrica/mcp, que não está instalado neste projeto.\n" +
        "Instale com pnpm add -D @rubrica/mcp e reinicie o agente (o .mcp.json já aponta para npx rubrica mcp).",
    );
    return 1;
  }
  return (deps.spawn ?? defaultSpawn)(bin, argv);
}
