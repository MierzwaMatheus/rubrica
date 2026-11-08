/**
 * Ponta a ponta do painel contra o site de demonstração (apps/demo), que roda o
 * painel com o backend em memória (dados dos fixtures). Sem deployment do Convex:
 * o backend de demonstração usa as mesmas regras puras do núcleo (validação de
 * blocos e caminhos, papéis, plugins). Rodar: `pnpm --filter @rubrica/core test:e2e`.
 */
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const demo = fileURLToPath(new URL("../../../apps/demo", import.meta.url));
const serve = fileURLToPath(new URL("./serve.mjs", import.meta.url));
const PORT = Number(process.env.E2E_PORT ?? 4787);

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  webServer: {
    command: `node node_modules/astro/bin/astro.mjs build --outDir dist-e2e && node ${serve} dist-e2e ${PORT}`,
    cwd: demo,
    url: `http://localhost:${PORT}/admin`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { ASTRO_TELEMETRY_DISABLED: "1" },
  },
});
