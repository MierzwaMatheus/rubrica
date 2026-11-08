/**
 * Um `npx convex` / `npx vercel` de mentira para testar os comandos sem deployment:
 * guarda as variáveis de cada ambiente, responde às funções e registra as chamadas.
 */
import { RunError, type Runner } from "../src/utils/exec";

type Env = Record<string, string>;
export type FnHandler = (args: Record<string, unknown>, prod: boolean) => unknown;

export class FakeShell {
  env: { dev: Env; prod: Env } = { dev: {}, prod: {} };
  calls: string[][] = [];
  functions: Record<string, FnHandler> = {};
  /** Saída de `vercel api` por caminho. */
  vercelApi: Record<string, unknown> = {};

  constructor(functions: Record<string, FnHandler> = {}) {
    this.functions = functions;
  }

  fnCalls(name: string) {
    return this.calls
      .filter((c) => c[1] === "convex" && c[2] === "run" && c.includes(name))
      .map((c) => ({ prod: c.includes("--prod"), args: JSON.parse(c[c.length - 1]!) as Record<string, unknown> }));
  }

  runner: Runner = (file, args) => {
    this.calls.push([file, ...args]);
    if (file !== "npx") return "";
    if (args[0] === "convex") return this.convex(args.slice(1));
    if (args.some((a) => a.startsWith("vercel"))) return this.vercel(args.slice(args.findIndex((a) => a.startsWith("vercel")) + 1));
    return "";
  };

  private convex(args: string[]): string {
    const prod = args.includes("--prod");
    const rest = args.filter((a) => a !== "--prod" && a !== "--");
    const env = prod ? this.env.prod : this.env.dev;
    if (rest[0] === "env" && rest[1] === "get") {
      const value = env[rest[2]!];
      if (value === undefined) throw new RunError("env get", `Environment variable ${rest[2]} not found`, 1);
      return `${value}\n`;
    }
    if (rest[0] === "env" && rest[1] === "set") {
      env[rest[2]!] = rest[3]!;
      return "";
    }
    if (rest[0] === "run") {
      const handler = this.functions[rest[1]!];
      if (!handler) throw new RunError("run", `Could not find function for '${rest[1]}'`, 1);
      let result: unknown;
      try {
        result = handler(JSON.parse(rest[2] ?? "{}"), prod);
      } catch (err) {
        throw new RunError("run", `Uncaught Error: ${(err as Error).message}`, 1);
      }
      return result === undefined ? "" : JSON.stringify(result);
    }
    if (rest[0] === "deployment" && rest[1] === "token") return "Criando...\nprod:feliz-gato-123|segredo\n";
    return "";
  }

  private vercel(args: string[]): string {
    if (args[0] === "api") return JSON.stringify(this.vercelApi[args[1]!] ?? {});
    return "";
  }
}
