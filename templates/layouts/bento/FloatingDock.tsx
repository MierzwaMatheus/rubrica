import { Link, useLocation } from "wouter";
import { Home, Briefcase, FolderOpen, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/resume", label: "Currículo", icon: Briefcase },
  { href: "/portfolio", label: "Portfólio", icon: FolderOpen },
  { href: "/about", label: "Sobre", icon: User },
  { href: "/blog", label: "Blog", icon: FileText },
];

export function FloatingDock() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-[28px] border border-[var(--text)]/20 bg-[var(--bg)]/80 px-3 py-2.5 shadow-2xl backdrop-blur-xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[18px] px-3.5 py-2 text-[10.5px] font-semibold tracking-wide transition-colors",
                  active
                    ? "bg-primary text-[var(--bg)]"
                    : "text-[var(--text)]/40 hover:text-[var(--text)]"
                )}
              >
                <Icon size={18} strokeWidth={1.7} />
                <span>{label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
