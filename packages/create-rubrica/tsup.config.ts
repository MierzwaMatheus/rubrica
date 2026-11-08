import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  banner: { js: "#!/usr/bin/env node" },
  // A telemetria manda a versão do CLI (src/telemetry.ts).
  define: { __CLI_VERSION__: JSON.stringify(version) },
  // As partes puras do núcleo (receitas, plugins, idiomas) vão dentro do CLI.
  noExternal: [/^@rubrica\/core/],
  // O AGENTS.md do monorepo vai junto para os projetos criados.
  loader: { ".md": "text" },
  // Um arquivo só: o package.json publica só o dist/index.js.
  splitting: false,
  clean: true,
});
