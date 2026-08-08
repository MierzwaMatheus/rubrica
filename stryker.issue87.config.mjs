// @ts-check
/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  packageManager: "pnpm",
  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
  ],
  vitest: {
    configFile: "vitest.stryker.issue87.config.ts",
  },
  reporters: ["clear-text", "html", "progress"],
  // Escopo da issue #87: ABOUT_DAILY_ROUTINE_SEED_VALUES + seed em aboutDailyRoutine.ts,
  // ABOUT_FAQ_SEED_VALUES + seed em aboutFaq.ts, e gate about em seed.ts.
  mutate: [
    "convex/aboutDailyRoutine.ts:115-134",
    "convex/aboutFaq.ts:100-132",
    "convex/seed.ts:55-58",
  ],
  ignorePatterns: ["stryker.config.mjs", "stryker.issue84.config.mjs", "stryker.issue85.config.mjs", "stryker.issue86.config.mjs", "stryker.issue87.config.mjs", ".stryker-tmp"],
  coverageAnalysis: "perTest",
};
