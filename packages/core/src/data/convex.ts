/**
 * Fonte de dados do Convex para o build: uma leitura da query pública
 * `rubrica/site:snapshot` (ver `src/convex/site.ts`), que devolve o `SiteSnapshot` só
 * com o que está publicado e as URLs das imagens já resolvidas.
 */
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import type { DataSource, SiteSnapshot } from "./source";

/** Caminho da query no `convex/` do projeto (arquivo `convex/rubrica/site.ts`). */
export const SNAPSHOT_FUNCTION = "rubrica/site:snapshot";

const snapshotRef = makeFunctionReference<"query", Record<string, never>, SiteSnapshot>(SNAPSHOT_FUNCTION);

/** Endereço do Convex: o informado, senão `CONVEX_URL`, senão `VITE_CONVEX_URL`. */
export function resolveConvexUrl(url: string | null | undefined, env: Record<string, string | undefined> = process.env): string {
  const resolved = url?.trim() || env.CONVEX_URL?.trim() || env.VITE_CONVEX_URL?.trim();
  if (!resolved) {
    throw new Error(
      "[rubrica] endereço do Convex ausente: defina CONVEX_URL (ou VITE_CONVEX_URL) no ambiente do build, ou passe source: { convex: { url } } na integração.",
    );
  }
  return resolved;
}

export interface ConvexSourceOptions {
  /** Cliente a usar no lugar do `ConvexHttpClient` (testes). */
  client?: { query(ref: typeof snapshotRef, args: Record<string, never>): Promise<SiteSnapshot> };
  env?: Record<string, string | undefined>;
}

export function convexSource(url: string | null, options: ConvexSourceOptions = {}): DataSource {
  return {
    async load() {
      const address = options.client ? (url ?? "") : resolveConvexUrl(url, options.env);
      const client = options.client ?? new ConvexHttpClient(address);
      try {
        return await client.query(snapshotRef, {});
      } catch (e) {
        throw new Error(`[rubrica] não foi possível ler o conteúdo do Convex (${address || "cliente"}): ${(e as Error).message}`);
      }
    },
  };
}
