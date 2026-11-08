/**
 * Raiz do painel, montada em /admin (`client:only`). Escolhe o backend: o Convex do
 * projeto ou, quando o site usa fixtures, a demonstração em memória (carregada à parte).
 */
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { adminBackend } from "virtual:rubrica/admin";
import { BackendContext, type Backend } from "./data/backend";
import { App } from "./App";
import { Spinner } from "./ui/form";

const ConvexBackend = lazy(() => import("./data/convex").then((m) => ({ default: m.ConvexBackend })));

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">{children}</div>;
}

function DemoBackend({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend>();
  useEffect(() => {
    let alive = true;
    Promise.all([import("./data/demo"), import("virtual:rubrica/admin-demo")]).then(([demo, data]) => {
      if (!alive || !data.default) return;
      const { backend, store } = demo.createDemoBackend({ snapshot: data.default });
      // Para os testes de ponta a ponta inspecionarem o estado.
      (window as unknown as { __rubricaDemo?: unknown }).__rubricaDemo = store;
      setBackend(backend);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!backend) return <FullScreen><Spinner /></FullScreen>;
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}

export default function AdminRoot() {
  if (adminBackend.kind === "missing") {
    return (
      <FullScreen>
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-semibold text-foreground">Painel sem backend</h1>
          <p>
            Defina <code>PUBLIC_CONVEX_URL</code> (ou <code>CONVEX_URL</code>) no ambiente do build, ou passe <code>source: {"{ convex: { url } }"}</code> na
            integração do Rubrica.
          </p>
        </div>
      </FullScreen>
    );
  }
  const app = <App />;
  if (adminBackend.kind === "demo") return <DemoBackend>{app}</DemoBackend>;
  return (
    <Suspense fallback={<FullScreen><Spinner /></FullScreen>}>
      <ConvexBackend url={adminBackend.url}>{app}</ConvexBackend>
    </Suspense>
  );
}
