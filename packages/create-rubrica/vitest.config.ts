import { defineConfig } from "vitest/config";

export default defineConfig({
  // Igual ao loader "text" do tsup: o AGENTS.md entra no CLI como texto.
  plugins: [
    {
      name: "rubrica:md-text",
      transform(code, id) {
        if (id.endsWith(".md")) return { code: `export default ${JSON.stringify(code)};`, map: null };
        return undefined;
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    testTimeout: 30_000,
    // O teste de ponta a ponta do create instala e builda um projeto de verdade.
    hookTimeout: 600_000,
  },
});
