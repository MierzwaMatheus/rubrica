import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  User,
  Home,
  Mail,
  Menu,
  X,
  FileSignature,
  CreditCard,
  Sparkles,
  ScrollText,
  MessageSquare,
  Puzzle,
  ExternalLink,
} from "lucide-react";

// Mirrors the admin sidebar nav exactly — same icons, same order, same labels.
// Routes are remapped to /playground/* equivalents.
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",         path: "/playground" },
  { icon: FolderKanban,    label: "Projetos",          path: null },
  { icon: FileText,        label: "Blog",              path: "/playground/blog" },
  { icon: User,            label: "Currículo",         path: null },
  { icon: FileSignature,   label: "Propostas",         path: "/playground/proposal" },
  { icon: Home,            label: "Home",              path: null },
  { icon: User,            label: "Sobre Mim",         path: null },
  { icon: Mail,            label: "Contato",           path: null },
  { icon: MessageSquare,   label: "Contatos",          path: "/playground/contact" },
  { icon: CreditCard,      label: "Links de Pagamento",path: "/playground/payment" },
  { icon: Sparkles,        label: "CV com IA",         path: "/playground/ai-cv" },
  { icon: User,            label: "Criar Usuário",     path: null },
  { icon: ScrollText,      label: "Logs",              path: null },
  { icon: Puzzle,          label: "Plugins",           path: null },
] as const;

function PlaygroundSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-foreground-strong"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-foreground/10 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Same header as admin */}
          <div className="mb-6 flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-neon-purple flex items-center justify-center">
              <span className="font-bold text-foreground-strong">A</span>
            </div>
            <span className="text-xl font-bold text-foreground-strong">Admin Panel</span>
          </div>

          {/* Demo mode badge — só o que diferencia do admin real */}
          <div className="mb-4 px-3 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider">Modo Demonstração</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Nenhuma ação é real</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item, i) => {
              const isActive = item.path !== null && (
                item.path === "/playground"
                  ? location === "/playground"
                  : location.startsWith(item.path)
              );
              const disabled = item.path === null;

              if (disabled) {
                return (
                  <div
                    key={i}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/25 cursor-not-allowed select-none"
                    title="Não disponível no playground"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <Link key={item.path} href={item.path!}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20"
                        : "text-foreground/65 hover:text-foreground-strong hover:bg-foreground/5"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Footer — em vez de "Sair", link para o portfólio */}
          <div className="pt-6 border-t border-foreground/10">
            <Link href="/">
              <a className="flex items-center space-x-3 px-4 py-3 rounded-lg text-foreground/65 hover:text-foreground-strong hover:bg-foreground/5 transition-colors">
                <ExternalLink className="w-5 h-5" />
                <span>Voltar ao portfólio</span>
              </a>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground-strong">
      <PlaygroundSidebar />
      <main className="md:ml-64 p-8 pt-20 md:pt-8">{children}</main>
    </div>
  );
}
