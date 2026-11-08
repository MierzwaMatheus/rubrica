#!/usr/bin/env node
// Entrada do servidor MCP local do Rubrica (`npx rubrica mcp` chama este mesmo código).
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
if (!existsSync(dist)) {
  console.error("[rubrica-mcp] dist/ não existe. No monorepo, rode: pnpm --filter @rubrica/mcp build");
  process.exit(1);
}
await import(dist);
