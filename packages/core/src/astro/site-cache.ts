/**
 * Cache do site montado. No build, carrega uma vez. No dev, a integração manda
 * `astro:content-changed` quando o conteúdo muda (ver `dev-content.ts`) e o `runtime.ts`
 * chama `invalidate()`: a próxima requisição carrega de novo. Uma carga que falha não
 * fica guardada, para um erro passageiro do Convex não prender o dev num erro.
 */
export interface SiteCache<T> {
  get(): Promise<T>;
  invalidate(): void;
}

export function siteCache<T>(load: () => Promise<T>): SiteCache<T> {
  let current: Promise<T> | undefined;
  return {
    get() {
      if (!current) {
        const pending = load();
        current = pending;
        pending.catch(() => {
          if (current === pending) current = undefined;
        });
      }
      return current;
    },
    invalidate() {
      current = undefined;
    },
  };
}
