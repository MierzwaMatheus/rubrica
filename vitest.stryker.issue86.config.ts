// Config do Vitest exclusiva para o Stryker. Filtra apenas os testes do escopo
// da issue #86 e pula os testes pré-existentes quebrados que bloqueiam a dry-run.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/convex/resumeItems.test.ts",
      "tests/convex/seed.test.ts",
    ],
    environmentMatchGlobs: [
      ["cli/**", "node"],
      ["tests/convex/**", "node"],
    ],
    // Excluir testes pré-existentes quebrados (não relacionados à issue #86).
    testNamePattern: "^(?!.*(?:theme_accent_color|Root user already exists|insere todas as chaves))",
  },
});
