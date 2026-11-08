import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  banner: { js: "#!/usr/bin/env node" },
  // A telemetria manda a versão do CLI (src/telemetry.ts).
  define: { __CLI_VERSION__: JSON.stringify(version) },
  clean: true,
});
