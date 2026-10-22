// @ts-check
/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
  ],
  vitest: {
    configFile: "vitest.stryker.issue88.config.ts",
  },
  reporters: ["clear-text", "html", "progress"],
  // Escopo da issue #88: TESTIMONIALS_SEED_VALUES + seed em testimonials.ts,
  // e gate testimonials em seed.ts.
  mutate: [
    "convex/testimonials.ts:8-27",
    "convex/testimonials.ts:264-281",
    "convex/seed.ts:60-62",
  ],
  ignorePatterns: ["stryker.config.mjs", "stryker.issue84.config.mjs", "stryker.issue85.config.mjs", "stryker.issue86.config.mjs", "stryker.issue87.config.mjs", "stryker.issue88.config.mjs", ".stryker-tmp"],
  coverageAnalysis: "perTest",
};