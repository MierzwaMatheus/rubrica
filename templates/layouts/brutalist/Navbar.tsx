import { Link, useRoute } from "wouter";
import { usePlugin } from "@/contexts/PluginsContext";
import type { PluginId } from "../../../convex/pluginRegistry";

const NAV_ITEMS: Array<{ href: string; label: string; pluginId: PluginId | null }> = [
  { href: "/", label: "início", pluginId: null },
  { href: "/curriculo", label: "currículo", pluginId: "resume" },
  { href: "/portfolio", label: "portfólio", pluginId: "portfolio" },
  { href: "/sobre", label: "sobre-mim", pluginId: "about" },
  { href: "/blog", label: "blog", pluginId: "blog" },
];

export function Navbar() {
  return (
    <nav
      style={{ fontFamily: "var(--font-mono, monospace)" }}
      className="border-b-2 border-[var(--text)] bg-[var(--bg)] text-[var(--text)]"
    >
      <div className="flex items-center px-4 py-2 border-b border-[var(--text)] text-xs gap-4">
        <span className="opacity-70">[●][○][○]</span>
        <span className="flex-1 text-xs">rubrica:~/portfolio</span>
        <span className="opacity-50">tty1 · 80x40</span>
      </div>
      <div className="flex text-xs overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <NavTab key={item.href} href={item.href} label={item.label} pluginId={item.pluginId} />
        ))}
        <div className="flex-1" />
      </div>
    </nav>
  );
}

function NavTab({ href, label, pluginId }: { href: string; label: string; pluginId: PluginId | null }) {
  const resolved = (pluginId ?? "blog") as PluginId;
  const enabled = usePlugin(resolved);
  const [active] = useRoute(href === "/" ? "/" : `${href}*`);

  if (pluginId !== null && !enabled) return null;

  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-5 py-2.5 border-r border-[var(--text)] no-underline transition-colors"
      style={{
        background: active ? "var(--text)" : "transparent",
        color: active ? "var(--bg)" : "var(--text)",
        fontWeight: active ? 700 : 400,
      }}
    >
      <span className="opacity-60">{active ? "▶" : " "}</span>
      {label}.sh
    </Link>
  );
}
