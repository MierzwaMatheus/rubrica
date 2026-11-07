import { lazy, type ComponentType } from "react";

type Loader<P> = () => Promise<{ default: ComponentType<P> }>;
export type LazyRoute<P> = ComponentType<P> & { preload: () => Promise<unknown> };

/**
 * Página carregada sob demanda que pode ser pré-carregada. Depois de carregada, renderiza
 * direto, sem suspender.
 *
 * Por quê: numa página pré-renderizada, se o código da rota ainda estiver chegando quando o
 * React hidrata, aquele trecho fica pendente; qualquer atualização nesse meio-tempo (o tema
 * aplicando a escolha salva, as animações carregando) faz o React descartar o HTML do build e
 * redesenhar o conteúdo. O main.tsx pré-carrega a rota da URL antes de hidratar.
 */
export function lazyRoute<P extends object>(load: Loader<P>): LazyRoute<P> {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<unknown> | null = null;
  const preload = () =>
    (pending ??= load().then((mod) => {
      Loaded = mod.default;
    }));
  const Lazy = lazy(() => preload().then(() => ({ default: Loaded! })));
  const Route = (props: P) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return Object.assign(Route, { preload });
}
