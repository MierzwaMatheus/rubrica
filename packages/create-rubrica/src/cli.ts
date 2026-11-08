/**
 * Roteia os comandos do CLI (`create-rubrica` e `rubrica`). Sem comando conhecido, o
 * primeiro argumento é a pasta do `create` (`npx create-rubrica meu-site`).
 */
import { ArgError } from "./utils/args.js";
import { NotAProjectError } from "./state.js";
import { CLI_VERSION } from "./telemetry.js";
import { Cancelled, intro, log, outro } from "./ui.js";

export const HELP = `Rubrica ${CLI_VERSION}

Uso: npx create-rubrica@latest <comando> [opções]   (no projeto: npx rubrica <comando>)

  create <pasta>        cria um site (--tipo pessoal|empresa --tema <id>; --help lista as opções)
  setup                 liga o Convex, cria o root e o conteúdo inicial, integrações
  config                troca identidade, tipo, tema, cores, idiomas ou plugins
  publicar              põe o site no ar na Vercel (ou publica de novo)
  senha                 troca a senha do painel e libera o login bloqueado
  update                atualiza o @rubrica/core e o tema (--dry-run mostra o plano; --yes aplica)
  ejetar <bloco>        copia o componente do bloco para src/overrides/ (--listar mostra os ejetados)
  verificar             confere o convex/ gerado, o tema e os ejetados (pnpm test)
  testar-tema [tema]    bateria de testes de tema (@rubrica/theme-tester)
  mcp                   servidor MCP local (@rubrica/mcp), para o agente
  migrar                leva um projeto da v1 para a v2 (--relatorio só mostra, sem gravar)
  telemetria [ligar|desligar]

Em qualquer comando: --sem-telemetria (só nesta execução).`;

export async function runCli(rawArgv: string[], cwd: string): Promise<void> {
  const noTelemetry = rawArgv.includes("--sem-telemetria");
  if (noTelemetry) process.env.RUBRICA_TELEMETRIA = "0";
  const argv = rawArgv.filter((a) => a !== "--sem-telemetria");
  const [command, ...rest] = argv;

  // O MCP fala pelo stdout: nada de banner.
  if (command === "mcp") {
    const { runMcp } = await import("./commands/delegate.js");
    process.exitCode = runMcp(rest, { cwd });
    return;
  }
  if (command === "--version" || command === "-v") {
    console.log(CLI_VERSION);
    return;
  }
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(HELP);
    return;
  }

  intro(`Rubrica ${CLI_VERSION}`);
  try {
    switch (command) {
      case "create": {
        const { runCreate } = await import("./commands/create.js");
        const { runSetup } = await import("./commands/setup.js");
        await runCreate(rest, { cwd, noTelemetry, setup: (dir, name) => runSetup({ cwd: dir, newProject: name }) });
        break;
      }
      case "setup": {
        const { runSetup } = await import("./commands/setup.js");
        await runSetup({ cwd });
        break;
      }
      case "config": {
        const { runConfig } = await import("./commands/config.js");
        await runConfig(rest, { cwd });
        break;
      }
      case "publicar": {
        const { runPublish } = await import("./commands/publish.js");
        await runPublish({ cwd });
        break;
      }
      case "senha": {
        const { runPassword } = await import("./commands/password.js");
        await runPassword({ cwd });
        break;
      }
      case "telemetria": {
        const { runTelemetry } = await import("./commands/telemetry.js");
        await runTelemetry({ cwd, ...(rest[0] && { action: rest[0] }) });
        break;
      }
      case "update": {
        const { runUpdate } = await import("./commands/update.js");
        await runUpdate(rest, { cwd });
        break;
      }
      case "ejetar": {
        const { runEject } = await import("./commands/eject.js");
        await runEject(rest, { cwd });
        break;
      }
      case "verificar": {
        const { runVerify } = await import("./commands/verify.js");
        await runVerify({ cwd });
        break;
      }
      case "testar-tema": {
        const { runThemeTester } = await import("./commands/delegate.js");
        process.exitCode = runThemeTester(rest, { cwd });
        break;
      }
      case "migrar": {
        const { runMigrate } = await import("./commands/migrate.js");
        await runMigrate(rest, { cwd });
        break;
      }
      default: {
        if (command.startsWith("-")) {
          console.log(HELP);
          process.exitCode = 1;
          return;
        }
        // `npx create-rubrica meu-site` (sem o "create").
        const { runCreate } = await import("./commands/create.js");
        const { runSetup } = await import("./commands/setup.js");
        await runCreate(argv, { cwd, noTelemetry, setup: (dir, name) => runSetup({ cwd: dir, newProject: name }) });
      }
    }
  } catch (err) {
    process.exitCode = 1;
    if (err instanceof Cancelled || err instanceof NotAProjectError) {
      outro(err.message);
      return;
    }
    if (err instanceof ArgError) {
      log.error(err.message);
      outro("Veja as opções com --help.");
      return;
    }
    log.error((err as Error).message);
    outro("Não deu certo. Nada além do que está descrito acima foi alterado.");
  }
}
