import { intro } from "@clack/prompts";
import { runCreate } from "./commands/create.js";
import { runConfig } from "./commands/config.js";
import { runUpdate, type UpdateOptions } from "./commands/update.js";
import { runSetup } from "./commands/setup.js";

export async function runCli(argv: string[], cwd: string): Promise<void> {
  const [,, command, projectName] = argv;

  intro("Rubrica CLI");

  if (command === "create") {
    if (!projectName) {
      console.error("Uso: rubrica create <nome-do-projeto>");
      process.exit(1);
    }
    await runCreate(projectName, { projectsDir: cwd });
  } else if (command === "config") {
    await runConfig({ cwd });
  } else if (command === "update") {
    await runUpdate({ cwd, options: parseUpdateOptions(argv.slice(3)) });
  } else if (command === "setup") {
    await runSetup({ cwd });
  } else if (command && !command.startsWith("-")) {
    // `pnpm create rubrica <nome>` / `npx create-rubrica <nome>` chegam sem o "create".
    await runCreate(command, { projectsDir: cwd });
  } else {
    console.log(
      "Comandos disponíveis: create <nome-do-projeto> | config | setup\n" +
      "  update [--dry-run] [--from <versão>] [--to <versão>] [--yes]"
    );
  }
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
