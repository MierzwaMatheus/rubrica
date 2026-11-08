import { defineConfig } from "vitest/config";
// A auditoria abre o Chromium de verdade: testes mais lentos que os do núcleo.
export default defineConfig({ test: { include: ["test/**/*.test.ts"], testTimeout: 60_000, hookTimeout: 60_000 } });
