/**
 * Conteúdo ao vivo no `astro dev`. O build lê o snapshot uma vez; no dev, o que se salva
 * no painel precisa aparecer no site sem reiniciar. A integração se inscreve no snapshot
 * (Convex: `ConvexClient.onUpdate`, que avisa a cada mudança; fixtures: o watcher do Vite
 * na pasta) e, quando o conteúdo muda, manda `astro:content-changed` aos ambientes de
 * servidor do Vite. Esse evento é o mesmo das coleções de conteúdo do Astro: limpa o cache
 * de `getStaticPaths` (páginas, posts e cases novos deixam de dar 404) e o `runtime.ts`
 * descarta o site montado.
 *
 * O que foi decidido no `astro:config:setup` (fontes baixadas, rotas do RSS) não muda sem
 * reiniciar: quando isso muda, o terminal avisa.
 */
import { ConvexClient } from "convex/browser";
import { relative, isAbsolute } from "node:path";
import { snapshotRef } from "../data/convex";
import type { DataSource, SiteSnapshot } from "../data/source";

/** Evento que o Astro já trata no dev: limpa o cache de rotas; o `runtime.ts` também ouve. */
export const CONTENT_CHANGED_EVENT = "astro:content-changed";

/** Algo decidido na partida do dev que só um reinício aplica. */
export interface RestartNotice {
  /** Valor comparável no snapshot (ex.: as fontes planejadas, em JSON). */
  key(snapshot: SiteSnapshot): string;
  message: string;
}

export interface ContentTrackerOptions {
  /** Snapshot com que o dev partiu (o mesmo do `astro:config:setup`). */
  initial: SiteSnapshot;
  /** Conteúdo mudou: invalidar caches. */
  onChange(): void;
  /** Aviso no terminal (uma vez por valor novo). */
  warn(message: string): void;
  restartNotices?: RestartNotice[];
}

/**
 * Recebe cada snapshot que chega e decide se é novo (compara o JSON, porque a inscrição
 * também entrega o valor atual e repete o mesmo conteúdo). Devolve `true` quando mudou.
 */
export function contentChangeTracker(options: ContentTrackerOptions): (snapshot: SiteSnapshot) => boolean {
  let last = JSON.stringify(options.initial);
  const notices = (options.restartNotices ?? []).map((n) => {
    const initial = n.key(options.initial);
    return { ...n, initial, warned: initial };
  });
  return (snapshot) => {
    const next = JSON.stringify(snapshot);
    if (next === last) return false;
    last = next;
    options.onChange();
    for (const n of notices) {
      const value = n.key(snapshot);
      // Avisa quando sai do valor da partida e não repete o aviso para o mesmo valor.
      if (value !== n.initial && value !== n.warned) options.warn(n.message);
      n.warned = value;
    }
    return true;
  };
}

export type Unsubscribe = () => void;

/** Inscrição no snapshot do Convex por WebSocket (o primeiro valor é o atual). */
export function subscribeConvex(url: string, onSnapshot: (s: SiteSnapshot) => void, onError: (e: Error) => void): Unsubscribe {
  const client = new ConvexClient(url);
  const unsubscribe = client.onUpdate(snapshotRef, {}, onSnapshot, onError);
  return () => {
    unsubscribe();
    void client.close();
  };
}

/** O que a inscrição em fixtures usa do watcher do Vite (chokidar). */
export interface FileWatcher {
  add(path: string): unknown;
  on(event: "all", listener: (event: string, path: string) => void): unknown;
  off(event: "all", listener: (event: string, path: string) => void): unknown;
}

/** Fixtures: relê a pasta quando um arquivo dela muda. */
export function subscribeFixtures(
  dir: string,
  source: DataSource,
  watcher: FileWatcher,
  onSnapshot: (s: SiteSnapshot) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const inside = (file: string) => {
    const rel = relative(dir, file);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  };
  const listener = (_event: string, file: string) => {
    if (!inside(file)) return;
    source.load().then(onSnapshot, onError);
  };
  watcher.add(dir);
  watcher.on("all", listener);
  return () => watcher.off("all", listener);
}
