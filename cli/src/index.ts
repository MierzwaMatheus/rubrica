import { intro } from "@clack/prompts";
import { runCreate } from "./commands/create.js";
import { runConfig } from "./commands/config.js";
import { runUpdate } from "./commands/update.js";
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
    await runUpdate({ cwd });
  } else if (command === "setup") {
    await runSetup({ cwd });
  } else {
    console.log("Comandos disponíveis: create <nome-do-projeto> | config | update | setup");
  }
}

await runCli(process.argv, process.cwd());
