import { Link } from "wouter";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import {
  FolderKanban,
  FileText,
  FileSignature,
  MessageSquare,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Playground() {
  const [posts] = usePlaygroundStorage<unknown[]>("pg_blog_posts", []);
  const [proposals] = usePlaygroundStorage<unknown[]>("pg_proposals", []);
  const [contacts] = usePlaygroundStorage<unknown[]>("pg_contact_submissions", []);

  const stats = [
    { title: "Projetos",  count: "—", icon: FolderKanban,  color: "text-blue-400",   bg: "bg-blue-400/10",   disabled: true },
    { title: "Artigos",   count: posts.length, icon: FileText,      color: "text-green-400",  bg: "bg-green-400/10",  href: "/playground/blog" },
    { title: "Propostas", count: proposals.length, icon: FileSignature, color: "text-purple-400", bg: "bg-purple-400/10", href: "/playground/proposal" },
  ];

  const shortcuts = [
    { icon: FileSignature, label: "Nova Proposta",   href: "/playground/proposal" },
    { icon: FileText,      label: "Novo Post",        href: "/playground/blog" },
    { icon: MessageSquare, label: "Simular Contato",  href: "/playground/contact" },
    { icon: CreditCard,    label: "Link de Pagamento",href: "/playground/payment" },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard — Playground</title>
        <meta name="description" content="Explore as funcionalidades do admin em modo demonstração." />
      </Helmet>

      <PlaygroundLayout>
        <div className="space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground-strong">Dashboard</h1>
              <p className="text-foreground/65 mt-2">
                Bem-vindo ao painel administrativo — modo demonstração.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-mono">
              SANDBOX
            </div>
          </header>

          {/* Stat cards — mirrors admin Dashboard exactly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => {
              const card = (
                <div className={cn(
                  "bg-card border border-foreground/10 rounded-xl p-6 flex items-center space-x-4 transition-colors",
                  !stat.disabled && "hover:border-foreground/20 cursor-pointer"
                )}>
                  <div className={cn("p-4 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-8 h-8", stat.color)} />
                  </div>
                  <div>
                    <p className="text-foreground/65 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground-strong">{stat.count}</p>
                  </div>
                </div>
              );
              return stat.href
                ? <Link key={i} href={stat.href}>{card}</Link>
                : <div key={i}>{card}</div>;
            })}
          </div>

          {/* Quick shortcuts — mirrors admin "Atalhos Rápidos" */}
          <div className="bg-card border border-foreground/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground-strong mb-4">Atalhos Rápidos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shortcuts.map((s, i) => (
                <Link key={i} href={s.href}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 border-foreground/10 hover:bg-foreground/5 hover:border-neon-purple/50"
                  >
                    <s.icon className="w-6 h-6 text-neon-purple" />
                    {s.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Info note */}
          <p className="text-xs text-muted-foreground/50 font-mono text-center">
            Todos os dados ficam apenas no seu dispositivo. Nenhuma ação aqui afeta dados reais.
          </p>
        </div>
      </PlaygroundLayout>
    </>
  );
}
