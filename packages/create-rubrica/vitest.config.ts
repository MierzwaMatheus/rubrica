import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // O teste de ponta a ponta do create instala e builda um projeto de verdade.
    testTimeout: 30_000,
    hookTimeout: 600_000,
  },
});
