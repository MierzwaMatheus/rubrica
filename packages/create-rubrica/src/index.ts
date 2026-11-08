/** Ponto de entrada do CLI (`create-rubrica` e `rubrica`). */
import { runCli } from "./cli.js";

await runCli(process.argv.slice(2), process.cwd());
