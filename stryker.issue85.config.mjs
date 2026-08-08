// @ts-check
/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
  ],
  vitest: {
    configFile: "vitest.stryker.issue85.config.ts",
  },
  reporters: ["clear-text", "html", "progress"],
  // Escopo da issue #85: apenas POSTS_SEED_VALUES (linhas 267+) + seed em posts.ts
  // e seedAll em seed.ts (escopo do plano TDD).
  mutate: [
    "convex/posts.ts:267-423",
    "convex/seed.ts:29-50",
  ],
  ignorePatterns: ["stryker.config.mjs", "stryker.issue84.config.mjs", "stryker.issue85.config.mjs", ".stryker-tmp"],
  coverageAnalysis: "perTest",
};
