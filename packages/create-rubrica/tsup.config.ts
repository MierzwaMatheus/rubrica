import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { bundledCoreModules } from "./scripts/core-modules";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig(async () => ({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  banner: { js: "#!/usr/bin/env node" },
  // A versão do CLI (telemetria, src/telemetry.ts) e as funções do núcleo empacotado
  // (reserva do convex/ gerado, src/core-manifest.ts).
  define: { __CLI_VERSION__: JSON.stringify(version), __CORE_MODULES__: JSON.stringify(await bundledCoreModules()) },
  // As partes puras do núcleo (receitas, plugins, idiomas) vão dentro do CLI.
  noExternal: [/^@rubrica\/core/],
  // O AGENTS.md do monorepo vai junto para os projetos criados.
  loader: { ".md": "text" },
  // Um arquivo só: o package.json publica só o dist/index.js.
  splitting: false,
  clean: true,
}));
