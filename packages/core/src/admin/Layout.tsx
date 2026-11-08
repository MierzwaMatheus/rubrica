/** Casca do painel: menu lateral (por papel e plugins), conta e conteúdo da tela. */
import { useState, type ReactNode } from "react";
import { ExternalLink, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { ROLE_LABELS } from "../convex/lib/roles";
import { pickWithFallback } from "../i18n";
import { useAuth, useBackend } from "./data/backend";
import { MenuIcon } from "./lib/icons";
import { Link, useRouter } from "./lib/router";
import { cn } from "./lib/utils";
import { usePanel } from "./panel";
import { buildMenu } from "./routes";
import { Button } from "./ui/button";

function ThemeToggle() {
  const [mode, setMode] = useState(() => document.documentElement.dataset.adminTheme ?? "light");
  const next = mode === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={next === "dark" ? "Usar tema escuro no painel" : "Usar tema claro no painel"}
      onClick={() => {
        document.documentElement.dataset.adminTheme = next;
        try {
          localStorage.setItem("rubrica:admin-theme", next);
        } catch {
          /* sem armazenamento: vale só nesta visita */
        }
        setMode(next);
      }}
    >
      {mode === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const panel = usePanel();
  const auth = useAuth();
  const { mode } = useBackend();
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const menu = buildMenu({ role: panel.me.role, kind: panel.kind, enabled: panel.enabled, plugins: panel.plugins });
  const siteName = panel.settings ? pickWithFallback(panel.settings.name, panel.locales.default, panel.locales) : undefined;
  const isCurrent = (p: string) => (p === "/admin" ? path === "/admin" : path === p || path.startsWith(`${p}/`));

  const nav = (
    <nav aria-label="Menu do painel" className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
      {menu.map((section) => (
        <div key={section.group}>
          <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{section.group}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(item.path) ? "page" : undefined}
                  className={cn(
                    "flex min-h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
                    isCurrent(item.path) && "bg-accent font-medium text-foreground",
                  )}
                >
                  <MenuIcon name={item.icon} className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 -translate-x-full flex-col border-r bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b px-4">
          <Link to="/admin" className="truncate font-semibold">
            {siteName || "Painel"}
          </Link>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        {nav}
        <div className="space-y-2 border-t p-3 text-sm">
          <Link to="/admin/conta" className="block rounded-md px-2 py-1 hover:bg-accent">
            <span className="block truncate font-medium">{panel.me.name || panel.me.email}</span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABELS[panel.me.role]}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={() => auth.signOut()}>
              <LogOut /> Sair
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="flex min-w-0 flex-1 flex-col lg:h-screen">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon-sm" aria-label="Abrir menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <span className="truncate font-semibold">{siteName || "Painel"}</span>
        </header>
        {mode === "demo" && (
          <div className="border-b bg-warning/10 px-4 py-1.5 text-xs text-warning">
            Demonstração sem Convex: as mudanças ficam só nesta aba e somem ao recarregar.{" "}
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
              Ver o site <ExternalLink className="size-3" />
            </a>
          </div>
        )}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão das telas. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-card px-6 py-5">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
