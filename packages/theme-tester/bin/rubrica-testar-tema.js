#!/usr/bin/env node
// O Node 22.18+ roda TypeScript direto (strip-types); sem build.
import { main } from "../src/cli.ts";

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
