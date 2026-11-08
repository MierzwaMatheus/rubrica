import { runCli } from "./cli";

const code = await runCli(process.argv.slice(2));
if (code >= 0) process.exit(code);
