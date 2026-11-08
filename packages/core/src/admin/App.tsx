/** Painel: login, sessão e a tela pedida, com o menu do papel e dos plugins. */
import { Component, Suspense, type ReactNode } from "react";
import { api } from "./data/api";
import { useAuth, useQuery } from "./data/backend";
import { errorMessage } from "./editor/model";
import { RouterProvider, useRouter } from "./lib/router";
import { Toaster } from "./lib/toast";
import { PanelProvider } from "./panel";
import { Layout } from "./Layout";
import { ChangePasswordScreen, FirstAccessScreen, LoginScreen, NoRoleScreen } from "./screens/auth";
import { ScreenOutlet } from "./screens";
import { Alert, Spinner } from "./ui/form";
import { Button } from "./ui/button";

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
      <Spinner /> {label}
    </div>
  );
}

/** Erro de uma tela (ex.: query recusada) vira aviso, sem derrubar o painel. */
export class ScreenBoundary extends Component<{ children: ReactNode; resetKey: string }, { error?: unknown }> {
  state: { error?: unknown } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined });
  }
  render() {
    if (this.state.error) {
      return (
        <Alert variant="destructive" className="m-6 flex-col">
          <p className="font-medium">Não foi possível abrir esta tela.</p>
          <p>{errorMessage(this.state.error)}</p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ error: undefined })}>
            Tentar de novo
          </Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

function Gate() {
  const auth = useAuth();
  const setupRequired = useQuery(api.users.isSetupRequired, auth.isAuthenticated ? "skip" : {});
  const me = useQuery(api.users.me, auth.isAuthenticated ? {} : "skip");
  const { path } = useRouter();

  if (auth.isLoading) return <Loading />;
  if (!auth.isAuthenticated) {
    if (setupRequired === undefined) return <Loading />;
    return setupRequired ? <FirstAccessScreen /> : <LoginScreen />;
  }
  if (me === undefined) return <Loading />;
  if (me === null || !me.role) return <NoRoleScreen suspended={!!me?.suspended} />;
  if (me.mustChangePassword) return <ChangePasswordScreen forced />;
  const user = { ...me, role: me.role };
  return (
    <PanelProvider me={user} fallback={<Loading />}>
      <Layout>
        <ScreenBoundary resetKey={path}>
          <Suspense fallback={<Loading />}>
            <ScreenOutlet />
          </Suspense>
        </ScreenBoundary>
      </Layout>
    </PanelProvider>
  );
}

export function App() {
  return (
    <RouterProvider>
      <Gate />
      <Toaster richColors position="bottom-right" />
    </RouterProvider>
  );
}
