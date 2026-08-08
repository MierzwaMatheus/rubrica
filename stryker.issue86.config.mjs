// @ts-check
/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
  ],
  vitest: {
    configFile: "vitest.stryker.issue86.config.ts",
  },
  reporters: ["clear-text", "html", "progress"],
  // Escopo da issue #86: RESUME_ITEMS_SEED_VALUES + seed em resumeItems.ts
  // e seedAll em seed.ts (escopo do plano TDD).
  mutate: [
    "convex/resumeItems.ts:9-57",
    "convex/resumeItems.ts:203-216",
    "convex/seed.ts:29-54",
  ],
  ignorePatterns: ["stryker.config.mjs", "stryker.issue84.config.mjs", "stryker.issue85.config.mjs", "stryker.issue86.config.mjs", ".stryker-tmp"],
  coverageAnalysis: "perTest",
};
