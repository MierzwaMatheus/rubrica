/**
 * Fonte de dados do Convex para o build. Implementada pelo backend (ver
 * packages/core/src/convex). Até lá, falha com uma mensagem clara.
 */
import type { DataSource } from "./source";

export function convexSource(url: string | null): DataSource {
  return {
    async load() {
      throw new Error(`[rubrica] a fonte Convex ainda não foi implementada (url: ${url ?? "CONVEX_URL"}). Use { fixtures: "..." } por enquanto.`);
    },
  };
}
