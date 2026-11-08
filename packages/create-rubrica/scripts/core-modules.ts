/**
 * Funções de cada módulo do `@rubrica/core` do monorepo, lidas do próprio núcleo
 * (`RUBRICA_MODULES` + `createRubrica()`). O tsup e o vitest gravam o resultado em
 * `__CORE_MODULES__`: é a reserva do CLI para quando o projeto ainda não tem o núcleo
 * instalado. Assim ela nunca diverge do núcleo empacotado junto (mesma versão de
 * `CORE_VERSION`).
 */
import { fileURLToPath } from "node:url";
import { evaluateInProject } from "../src/project/introspect";

export async function bundledCoreModules(): Promise<Record<string, string[]>> {
  const coreDir = fileURLToPath(new URL("../../core/", import.meta.url));
  return evaluateInProject<Record<string, string[]>>(
    coreDir,
    `import { createRubrica, RUBRICA_MODULES } from "./src/convex/index.ts";
const rubrica = createRubrica();
export default Object.fromEntries(RUBRICA_MODULES.map((m) => [m, Object.keys(rubrica[m])]));`,
  );
}
