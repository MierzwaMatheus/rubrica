/**
 * Linha de comando: `rubrica-mcp` (ou `rubrica mcp`). Sem comando, sobe o servidor
 * stdio. Os comandos de login rodam no terminal da pessoa: a senha é digitada aqui e
 * nunca passa pelo agente.
 */
import { createInterface } from "node:readline";
import { AuthManager, ConvexClient, RubricaError } from "./client";
import { ConfigError, resolveProject, type ProjectConfig } from "./config";
import { optionsFromEnv, Runtime } from "./runtime";
import { serveStdio } from "./server";
import { SessionStore, sessionPath } from "./session";
import { loadState } from "./state";
import { ROLE_LABELS } from "@rubrica/core/convex/roles";

export const HELP = `Uso: rubrica-mcp [comando] [opções]      (ou: npx rubrica mcp ...)

Comandos:
  serve        Sobe o servidor MCP (stdio). É o padrão; o agente chama este.
  login        Entra com e-mail e senha de um usuário do painel (no seu terminal).
  logout       Sai e apaga o token guardado neste computador.
  whoami       Mostra o projeto, o Convex, a conta e o papel.

Opções:
  --email <e-mail>    E-mail do login (senão, pergunta).
  --senha-stdin       Lê a senha da entrada padrão (scripts). Padrão: pergunta sem eco.
  --producao          Usa o Convex do site publicado (producao.convexUrl do rubrica.json).
  --projeto <pasta>   Pasta do projeto (padrão: a atual, subindo até achar o projeto).
  -h, --help          Esta ajuda.

Ambiente:
  RUBRICA_CONVEX_URL        Endereço do Convex (vence o .env.local).
  RUBRICA_PROJECT           Pasta do projeto.
  RUBRICA_CONFIG_DIR        Onde guardar a sessão (padrão: ~/.config/rubrica).
  RUBRICA_MCP_DRYRUN=0      Grava direto, sem prévia (padrão: prévia primeiro).
  RUBRICA_MCP_ALLOW_PASSWORD=1  Deixa a ferramenta login receber a senha (evite).
`;

interface Parsed {
  command: string;
  email?: string;
  passwordStdin: boolean;
  production: boolean;
  project?: string;
  help: boolean;
}

export function parseArgs(argv: string[]): Parsed {
  const out: Parsed = { command: "serve", passwordStdin: false, production: false, help: false };
  const rest = [...argv];
  let commandSet = false;
  while (rest.length) {
    const a = rest.shift()!;
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "--senha-stdin") out.passwordStdin = true;
    else if (a === "--producao" || a === "--produção") out.production = true;
    else if (a === "--email") out.email = rest.shift();
    else if (a.startsWith("--email=")) out.email = a.slice(8);
    else if (a === "--projeto") out.project = rest.shift();
    else if (a.startsWith("--projeto=")) out.project = a.slice(10);
    else if (!a.startsWith("-") && !commandSet) {
      out.command = a;
      commandSet = true;
    } else throw new ConfigError(`Opção desconhecida: ${a}\n\n${HELP}`);
  }
  return out;
}

function prompt(question: string, hidden: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new ConfigError("Sem terminal para digitar. Rode num terminal seu, ou use --senha-stdin."));
    process.stderr.write(question);
    if (!hidden) {
      const rl = createInterface({ input: process.stdin, output: process.stderr });
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off("data", onData);
          process.stderr.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") {
          process.stdin.setRawMode(false);
          process.stderr.write("\n");
          return reject(new ConfigError("Cancelado."));
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function readStdinLine(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
    if ((chunk as Buffer).includes(10)) break;
  }
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/)[0] ?? "";
}

export function buildRuntime(project: ProjectConfig, env: Record<string, string | undefined> = process.env): Runtime {
  const store = new SessionStore(sessionPath(project.name, project.convexUrl, env));
  const auth = new AuthManager(project.convexUrl, store);
  return Runtime.create(project, optionsFromEnv(env), { auth, client: new ConvexClient(auth) });
}

const out = (line: string) => process.stderr.write(`${line}\n`);

export async function runCli(argv: string[], env: Record<string, string | undefined> = process.env): Promise<number> {
  try {
    const args = parseArgs(argv);
    if (args.help || args.command === "help") {
      out(HELP);
      return 0;
    }
    const project = resolveProject({ cwd: args.project ?? process.cwd(), env, production: args.production });

    if (args.command === "serve") {
      await serveStdio(buildRuntime(project, env));
      return -1; // fica rodando até o agente fechar a conexão
    }

    const runtime = buildRuntime(project, env);
    const host = new URL(project.convexUrl).hostname;
    const describe = () => `${host} (${project.environment}, de ${project.source})`;

    if (args.command === "login") {
      out(`Projeto ${project.name} · Convex ${describe()}`);
      if (project.environment === "producao") out("Atenção: este é o Convex de PRODUÇÃO.");
      const email = args.email ?? (await prompt("E-mail do painel: ", false));
      const password = args.passwordStdin ? await readStdinLine() : await prompt("Senha: ", true);
      await runtime.signIn(email, password);
      const state = await loadState(new ConvexClient(new AuthManager(project.convexUrl, new SessionStore(sessionPath(project.name, project.convexUrl, env)))), true);
      if (!state.me?.role) {
        out(`Login feito, mas: ${state.problem ?? "a conta não tem papel no painel."}`);
        return 1;
      }
      out(`Pronto: ${state.me.email} · ${ROLE_LABELS[state.me.role]}. O token fica em ${sessionPath(project.name, project.convexUrl, env).replace(process.env.HOME ?? "~", "~")} (permissão 600). Agora o agente já pode usar o MCP.`);
      return 0;
    }

    if (args.command === "logout") {
      const had = await runtime.signOut();
      out(had ? "Sessão encerrada e token apagado." : "Não havia sessão neste projeto.");
      return 0;
    }

    if (args.command === "whoami") {
      out(`Projeto ${project.name} · Convex ${describe()}`);
      if (!runtime.hasSession()) {
        out("Sem login. Rode: npx rubrica mcp login");
        return 1;
      }
      const state = await runtime.refresh();
      if (!state.me) {
        out(state.problem ?? "Sessão inválida.");
        return 1;
      }
      out(`${state.me.email} · ${state.me.role ? ROLE_LABELS[state.me.role] : "sem papel"}`);
      if (state.settings) out(`Site ${state.settings.kind} · idiomas ${state.settings.locales.locales.join(", ")} · ${runtime.toolNames().length} ferramentas`);
      return 0;
    }

    out(`Comando desconhecido: ${args.command}\n\n${HELP}`);
    return 2;
  } catch (e) {
    if (e instanceof ConfigError || e instanceof RubricaError) {
      out(e.message);
      return e instanceof RubricaError && e.kind === "auth" ? 4 : 3;
    }
    out(`Erro inesperado: ${(e as Error).message}`);
    return 1;
  }
}
