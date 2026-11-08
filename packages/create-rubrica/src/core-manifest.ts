/**
 * Funções de cada módulo do núcleo empacotado com este CLI. Não é uma lista escrita à
 * mão: o build (tsup) e os testes (vitest) leem `RUBRICA_MODULES` e `createRubrica()` do
 * `@rubrica/core` do monorepo e gravam aqui (`scripts/core-modules.ts`). O `create`, o
 * `update` e o `migrar` usam as funções do núcleo **instalado** no projeto; esta é só a
 * reserva para quando ele ainda não está instalado (`create --sem-instalar`).
 */
declare const __CORE_MODULES__: Record<string, readonly string[]> | undefined;

export const CORE_MODULES: Record<string, readonly string[]> = typeof __CORE_MODULES__ === "object" && __CORE_MODULES__ ? __CORE_MODULES__ : {};
