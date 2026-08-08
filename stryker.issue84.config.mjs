// @ts-check
/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  // pnpm precisa de plugins explícitos (auto-discovery não funciona)
  plugins: [
    "@stryker-mutator/vitest-runner",
  ],
  vitest: {
    configFile: "vitest.stryker.issue84.config.ts",
  },
  reporters: ["clear-text", "html", "progress"],
  // Escopo da issue #84: arquivos de produção modificados pelo plano TDD.
  mutate: [
    "convex/projects.ts",
    "convex/seed.ts",
  ],
  ignorePatterns: ["stryker.config.mjs", "stryker.issue84.config.mjs", ".stryker-tmp"],
  coverageAnalysis: "perTest",
  // TypeScript checker desabilitado: o projeto tem erros pré-existentes que
  // bloqueiam o dry-run compilation. O vitest-runner valida comportamento em runtime.
};
