import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
      {items.map((item) => {
        const active =
          location === item.href ||
          (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.key} href={item.href}>
            <a
              className={cn(
                "text-[11px] font-mono tracking-[0.18em] uppercase pb-1.5 transition-colors",
                "border-b-2",
                active
                  ? "border-primary text-[var(--text)] opacity-100"
                  : "border-transparent text-[var(--text)] opacity-60 hover:opacity-90"
              )}
            >
              {NAV_LABELS[item.key] ?? item.key}
            </a>
          </Link>
        );
      })}
    </>
  );
}

export function Masthead() {
  const [location] = useLocation();
  const { contactInfo } = useSidebar(sidebarRepository);

  const siteName = contactInfo?.name ?? "";
  const spaced = siteName.toUpperCase().split("").join(" ");

  return (
    <header className="border-b border-[var(--text)]/20">
      {/* Metadata strip */}
      <div className="flex justify-between items-center px-12 py-[18px] text-[10.5px] font-mono tracking-[0.22em] uppercase text-[var(--text)]/55 border-b border-[var(--text)]/20">
        <span>Vol. 01 · No. 26</span>
        <span className="hidden sm:block">Portfolio Profissional</span>
        <span>Est. MMXX</span>
      </div>

      {/* Display title */}
      <div className="px-12 pt-8 pb-3 text-center">
        <div className="font-sans text-[clamp(3rem,8vw,5.25rem)] font-medium tracking-[0.04em] text-[var(--text)] leading-none">
          {spaced || "PORTFOLIO"}
        </div>
      </div>

      {/* Centered nav — desktop */}
      <nav className="hidden md:flex justify-center gap-9 pb-5">
        <NavItems location={location} />
      </nav>

      {/* Mobile nav */}
      <div className="flex justify-center pb-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-[var(--text)]/70 border border-[var(--text)]/20 px-4 py-2"
              aria-label="Abrir menu"
            >
              <Menu className="h-3.5 w-3.5" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="top" className="bg-[var(--bg)] border-b border-[var(--text)]/20 pt-12">
            <VisuallyHidden>
              <SheetTitle>Navegação</SheetTitle>
            </VisuallyHidden>
            <nav className="flex flex-col gap-1 pb-4">
              {NAV_ITEMS_KEYS.map((item) => (
                <Link key={item.key} href={item.href}>
                  <a className="block text-sm font-mono tracking-widest uppercase py-3 border-b border-[var(--text)]/10 text-[var(--text)]/80 hover:text-[var(--text)] transition-colors">
                    {NAV_LABELS[item.key] ?? item.key}
                  </a>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
