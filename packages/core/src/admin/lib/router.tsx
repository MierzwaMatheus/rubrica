/**
 * Roteador mínimo do painel (History API, base /admin). O build estático gera uma
 * página por tela; dentro do painel a troca de tela não recarrega.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

interface Location {
  path: string;
  search: URLSearchParams;
}

interface RouterValue extends Location {
  navigate(to: string, options?: { replace?: boolean }): void;
  /** Pergunta antes de sair (mudanças não salvas). Devolve a função que desfaz. */
  block(message: string): () => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function read(): Location {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return { path, search: new URLSearchParams(window.location.search) };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(read);
  const [blocker, setBlocker] = useState<string | null>(null);

  useEffect(() => {
    const onPop = () => setLocation(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!blocker) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = blocker;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [blocker]);

  const navigate = useCallback(
    (to: string, options: { replace?: boolean } = {}) => {
      if (blocker && !window.confirm(blocker)) return;
      setBlocker(null);
      if (options.replace) window.history.replaceState(null, "", to);
      else window.history.pushState(null, "", to);
      setLocation(read());
      window.scrollTo(0, 0);
    },
    [blocker],
  );

  const block = useCallback((message: string) => {
    setBlocker(message);
    return () => setBlocker((current) => (current === message ? null : current));
  }, []);

  const value = useMemo(() => ({ ...location, navigate, block }), [location, navigate, block]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const router = useContext(RouterContext);
  if (!router) throw new Error("[rubrica] painel sem RouterProvider");
  return router;
}

export function Link({ to, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...props} />;
}
