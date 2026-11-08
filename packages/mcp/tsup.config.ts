import { defineConfig } from "tsup";

// O pacote publicado roda com `node` puro: o código de @rubrica/core usado aqui
// (catálogo de blocos, papéis, validadores) vai dentro do bundle.
export default defineConfig({
  entry: { bin: "src/bin.ts", index: "src/index.ts" },
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  noExternal: [/^@rubrica\//],
  external: ["convex"],
});
