/**
 * Execução de programas externos (npx convex, npx vercel, git, pnpm). Os comandos
 * recebem um `Runner` para os testes trocarem por um falso.
 */
import { execFileSync, spawnSync } from "node:child_process";

export interface RunOptions {
  cwd?: string;
  /** `inherit`: a pessoa vê e responde (login no navegador, perguntas do Convex). */
  stdio?: "pipe" | "inherit";
  env?: Record<string, string | undefined>;
  /** Entrada padrão (para não passar segredos na linha de comando). */
  input?: string;
}

export type Runner = (file: string, args: string[], options?: RunOptions) => string;

export class RunError extends Error {
  constructor(
    message: string,
    readonly output: string,
    readonly code: number | null,
  ) {
    super(message);
  }
}

export const run: Runner = (file, args, options = {}) => {
  if (options.stdio === "inherit") {
    const result = spawnSync(file, args, { cwd: options.cwd, stdio: "inherit", env: { ...process.env, ...options.env } });
    if (result.status !== 0) throw new RunError(`${file} ${args[0] ?? ""} terminou com erro`, "", result.status);
    return "";
  }
  try {
    return execFileSync(file, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      input: options.input,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    }).toString();
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; status?: number | null; message?: string };
    const output = `${e.stderr?.toString() ?? ""}${e.stdout?.toString() ?? ""}`.trim() || e.message || "";
    throw new RunError(`${file} ${args.slice(0, 2).join(" ")} falhou`, output, e.status ?? null);
  }
};

/** Saída de um erro de execução (para mostrar as últimas linhas). */
export function errorOutput(err: unknown): string {
  if (err instanceof RunError) return err.output || err.message;
  return (err as Error)?.message ?? String(err);
}

export const tail = (text: string, lines = 15) => text.trim().split("\n").slice(-lines).join("\n");
