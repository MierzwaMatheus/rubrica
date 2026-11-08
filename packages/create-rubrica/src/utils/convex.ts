/**
 * `npx convex ...` no projeto. Antes de gravar, o comando diz em qual deployment vai
 * rodar (regra do AGENTS.md): o de desenvolvimento vem do `.env.local`; com `prod`, é o
 * de produção do mesmo projeto do Convex.
 */
import { describeDeployment, readEnvLocal } from "./env.js";
import { RunError, run as defaultRun, type Runner } from "./exec.js";

export interface ConvexContext {
  projectDir: string;
  prod?: boolean;
  runner?: Runner;
}

const base = (ctx: ConvexContext) => (ctx.prod ? ["--prod"] : []);

function convex(ctx: ConvexContext, args: string[], input?: string): string {
  return (ctx.runner ?? defaultRun)("npx", ["convex", ...args], { cwd: ctx.projectDir, stdio: "pipe", ...(input !== undefined && { input }) });
}

/** "nome (desenvolvimento)" ou "produção do projeto". */
export function deploymentLabel(ctx: ConvexContext): string {
  if (ctx.prod) return "PRODUÇÃO (o banco do site no ar)";
  return describeDeployment(readEnvLocal(ctx.projectDir).CONVEX_DEPLOYMENT);
}

/** Roda uma função (interna ou pública) e devolve o valor que ela retornou. */
export function convexRun<T = unknown>(ctx: ConvexContext, fn: string, args: Record<string, unknown> = {}): T {
  const out = convex(ctx, ["run", ...base(ctx), fn, JSON.stringify(args)]).trim();
  if (!out) return undefined as T;
  try {
    return JSON.parse(out) as T;
  } catch {
    // A saída pode ter avisos antes do valor: pega o último JSON.
    const last = out.slice(Math.max(out.lastIndexOf("\n{"), out.lastIndexOf("\n["), 0)).trim();
    try {
      return JSON.parse(last) as T;
    } catch {
      return out as T;
    }
  }
}

export function convexEnvGet(ctx: ConvexContext, key: string): string {
  try {
    return convex(ctx, ["env", "get", ...base(ctx), key]).trim();
  } catch {
    return "";
  }
}

export function convexEnvSet(ctx: ConvexContext, key: string, value: string): void {
  convex(ctx, ["env", "set", ...base(ctx), "--", key, value]);
}

/** O backend instalado não tem a função (núcleo mais antigo, ou módulo ainda não feito). */
export function isMissingFunction(err: unknown): boolean {
  const text = err instanceof RunError ? err.output : String((err as Error)?.message ?? err);
  return /Could not find (public )?function|No functions found|function .* not found|is not a function/i.test(text);
}

/** Deployment sem funções publicadas (nunca rodou `convex dev` / `deploy`). */
export function isEmptyDeployment(err: unknown): boolean {
  const text = err instanceof RunError ? err.output : String(err);
  return /No functions found|has no functions/i.test(text);
}
