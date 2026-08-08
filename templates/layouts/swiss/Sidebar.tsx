import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { usePlugins } from "@/contexts/PluginsContext";
import { useSidebar } from "@/hooks/useSidebar";
import { sidebarRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";

const NAV_ITEMS_KEYS: Array<{ key: string; href: string; pluginId?: PluginId }> = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", pluginId: "portfolio" },
  { key: "about", href: "/sobre", pluginId: "about" },
  { key: "blog", href: "/blog", pluginId: "blog" },
];

const NAV_LABELS: Record<string, string> = {
  home: "Início",
  resume: "Currículo",
  portfolio: "Portfólio",
  about: "Sobre Mim",
  blog: "Blog",
};

function NavItems({ location }: { location: string }) {
  const { isEnabled } = usePlugins();

  const items = NAV_ITEMS_KEYS.filter(
    (item) => !item.pluginId || isEnabled(item.pluginId)
  );

  return (
    <>
      {items.map((item, i) => {
        const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.key} href={item.href}>
            <a
              className={cn(
                "flex items-baseline gap-3 px-4 py-3 text-sm font-semibold tracking-tight transition-colors border-r border-[var(--text)]/20",
                "hover:bg-[var(--text)] hover:text-[var(--bg)]",
                active ? "bg-[var(--text)] text-[var(--bg)]" : "text-[var(--text)]"
              )}
            >
              <span className="text-[10px] font-normal opacity-50 tabular-nums">
                .{String(i + 1).padStart(2, "0")}
              </span>
              {NAV_LABELS[item.key] ?? item.key}
            </a>
          </Link>
        );
      })}
    </>
  );
}

export function SwissNav() {
  const [location] = useLocation();
  const { contactInfo } = useSidebar(sidebarRepository);

  return (
    <header className="border-b-2 border-[var(--text)]">
      {/* Masthead */}
      <div className="grid grid-cols-2 border-b border-[var(--text)] px-4 py-2">
        <div className="text-xs font-black tracking-widest uppercase">
          <span className="bg-[var(--text)] text-[var(--bg)] px-1.5 mr-1.5">R</span>
          {contactInfo?.name ?? "Rubrica"}
        </div>
        <div className="text-xs font-semibold tracking-widest uppercase text-right opacity-60">
          Portfolio · 2026
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:grid" style={{ gridTemplateColumns: `repeat(5, 1fr)` }}>
        <NavItems location={location} />
      </nav>

      {/* Mobile nav */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <span className="text-sm font-bold tracking-tight uppercase">
          {NAV_LABELS[Object.entries(NAV_ITEMS_KEYS).find(([, v]) => v.href === location)?.[1]?.key ?? "home"] ?? "Início"}
        </span>
        <Sheet>
          <SheetTrigger asChild>
            <button aria-label="Menu" className="p-1">
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[var(--bg)] border-r-2 border-[var(--text)]">
            <VisuallyHidden>
              <SheetTitle>Navegação</SheetTitle>
            </VisuallyHidden>
            <nav className="flex flex-col pt-8">
              <NavItems location={location} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
