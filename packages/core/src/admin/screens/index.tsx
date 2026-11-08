/** Tela de cada caminho do painel, com o aviso de permissão e de plugin desligado. */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { Lock, Puzzle } from "lucide-react";
import { ROLE_LABELS } from "../../convex/lib/roles";
import { PageHeader } from "../Layout";
import { Link, useRouter } from "../lib/router";
import { usePanel } from "../panel";
import { screenAccess, type AdminScreenDef } from "../routes";
import { Alert } from "../ui/form";
import { Button } from "../ui/button";

const SCREENS: Record<string, LazyExoticComponent<ComponentType>> = {
  "/admin": lazy(() => import("./Dashboard")),
  "/admin/paginas": lazy(() => import("./Pages")),
  "/admin/paginas/editar": lazy(() => import("../editor/PageEditor")),
  "/admin/blog": lazy(() => import("./collections").then((m) => ({ default: m.Blog }))),
  "/admin/projetos": lazy(() => import("./collections").then((m) => ({ default: m.Projects }))),
  "/admin/servicos": lazy(() => import("./collections").then((m) => ({ default: m.Services }))),
  "/admin/faq": lazy(() => import("./collections").then((m) => ({ default: m.Faq }))),
  "/admin/curriculo": lazy(() => import("./collections").then((m) => ({ default: m.Resume }))),
  "/admin/dia-a-dia": lazy(() => import("./collections").then((m) => ({ default: m.Routine }))),
  "/admin/planos": lazy(() => import("./collections").then((m) => ({ default: m.Plans }))),
  "/admin/equipe": lazy(() => import("./collections").then((m) => ({ default: m.Team }))),
  "/admin/depoimentos": lazy(() => import("./Testimonials")),
  "/admin/aparencia": lazy(() => import("./Appearance")),
  "/admin/configuracoes": lazy(() => import("./Settings")),
  "/admin/textos": lazy(() => import("./Texts")),
  "/admin/midia": lazy(() => import("./Media")),
  "/admin/plugins": lazy(() => import("./Plugins")),
  "/admin/usuarios": lazy(() => import("./Users")),
  "/admin/conta": lazy(() => import("./Account")),
};

function Notice({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="p-6">
        <Alert variant="warning" className="max-w-2xl">
          {icon}
          <div className="space-y-2">{children}</div>
        </Alert>
      </div>
    </>
  );
}

/** Tela de plugin cuja interface ainda não existe nesta versão do painel. */
function PendingScreen({ screen }: { screen: AdminScreenDef }) {
  return (
    <>
      <PageHeader title={screen.label} />
      <div className="p-6">
        <Alert className="max-w-2xl">
          <Puzzle />
          <p>A tela de “{screen.label}” chega na próxima etapa do painel da v2. Enquanto isso, o conteúdo pode ser editado pelo agente (MCP) ou pelo CLI.</p>
        </Alert>
      </div>
    </>
  );
}

export function ScreenOutlet() {
  const { path } = useRouter();
  const panel = usePanel();
  const access = screenAccess(path, { role: panel.me.role, kind: panel.kind, enabled: panel.enabled, plugins: panel.plugins });

  if (access.status === "not-found") {
    return (
      <Notice title="Tela não encontrada" icon={<Lock />}>
        <p>Esse endereço não existe no painel.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">Ir para o início</Link>
        </Button>
      </Notice>
    );
  }
  if (access.status === "forbidden") {
    return (
      <Notice title={access.screen.label} icon={<Lock />}>
        <p>
          O seu papel ({ROLE_LABELS[panel.me.role]}) não tem acesso a esta tela. Ela é de: {access.screen.roles.map((r) => ROLE_LABELS[r]).join(", ")}.
        </p>
      </Notice>
    );
  }
  if (access.status === "plugin-off") {
    const kindOk = access.plugin.kinds.includes(panel.kind);
    return (
      <Notice title={access.screen.label} icon={<Puzzle />}>
        <p>
          {kindOk
            ? `Esta tela é do plugin “${access.plugin.label}”, que está desligado.`
            : `O plugin “${access.plugin.label}” não existe em sites do tipo ${panel.kind}.`}
        </p>
        {kindOk && (panel.me.role === "root" || panel.me.role === "admin") && (
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/plugins">Abrir os plugins</Link>
          </Button>
        )}
      </Notice>
    );
  }
  const Screen = SCREENS[access.screen.path];
  if (!Screen) return <PendingScreen screen={access.screen} />;
  return <Screen />;
}
