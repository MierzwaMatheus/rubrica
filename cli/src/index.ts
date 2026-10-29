import { intro, log } from "@clack/prompts";
import { runCreate } from "./commands/create.js";
import { runConfig } from "./commands/config.js";
import { runUpdate, type UpdateOptions } from "./commands/update.js";
import { runSetup } from "./commands/setup.js";
import { parseCreateArgs } from "./args.js";
import { runPassword } from "./commands/password.js";
import { runPublish } from "./commands/publish.js";
import { runTelemetry } from "./commands/telemetry.js";

export async function runCli(rawArgv: string[], cwd: string): Promise<void> {
  // `--sem-telemetria` vale para qualquer comando: só nesta execução (no create, o projeto já nasce desligado).
  const noTelemetry = rawArgv.includes("--sem-telemetria");
  const argv = rawArgv.filter((a) => a !== "--sem-telemetria");
  if (noTelemetry) process.env.RUBRICA_TELEMETRIA = "0";
  const [,, command, projectName] = argv;

  intro("Rubrica CLI");

  if (command === "create") {
    if (!projectName) {
      console.error("Uso: rubrica create <nome-do-projeto>");
      process.exit(1);
    }
    await create(argv.slice(3), cwd, noTelemetry);
  } else if (command === "config") {
    await runConfig({ cwd });
  } else if (command === "update") {
    await runUpdate({ cwd, options: parseUpdateOptions(argv.slice(3)) });
  } else if (command === "setup") {
    await runSetup({ cwd });
  } else if (command === "senha") {
    await runPassword({ cwd });
  } else if (command === "publicar") {
    await runPublish({ cwd });
  } else if (command === "telemetria") {
    await runTelemetry({ cwd, action: projectName });
  } else if (command && !command.startsWith("-")) {
    // `pnpm create rubrica <nome>` / `npx create-rubrica <nome>` chegam sem o "create".
    await create(argv.slice(2), cwd, noTelemetry);
  } else {
    console.log(
      "Comandos disponíveis: create <nome-do-projeto> [--receita <código>] | config | setup | senha | publicar\n" +
      "  update [--dry-run] [--from <versão>] [--to <versão>] [--yes]\n" +
      "  telemetria [ligar|desligar]   (em qualquer comando: --sem-telemetria)"
    );
  }
}

/** `<nome> [--receita <código>] [opções]`: a receita vem do site do Rubrica. */
async function create(args: string[], cwd: string, noTelemetry = false): Promise<void> {
  let parsed;
  try {
    parsed = parseCreateArgs(args);
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
    return;
  }
  if (!parsed.projectName) {
    console.error("Uso: npx create-rubrica <nome-da-pasta> [--receita <código>]");
    process.exitCode = 1;
    return;
  }
  for (const warning of parsed.warnings) log.warn(warning);
  const hasRecipe = Object.keys(parsed.recipe).length > 0;
  await runCreate(parsed.projectName, {
    projectsDir: cwd,
    ...(hasRecipe && { recipe: parsed.recipe }),
    ...(noTelemetry && { noTelemetry: true }),
  });
}

export function parseUpdateOptions(args: string[]): UpdateOptions {
  const options: UpdateOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--from") options.from = args[++i];
    else if (arg === "--to") options.to = args[++i];
  }
  return options;
}

await runCli(process.argv, process.cwd());
