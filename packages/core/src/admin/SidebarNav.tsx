/** Menu lateral do painel com grupos recolhíveis (como na v1). Serve à barra fixa e à gaveta do celular. */
import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { activeGroup, isCurrentPath, readOpenGroups, resolveOpenGroups, sidebarLayout, writeOpenGroups, type OpenGroups } from "./lib/sidebar";
import { MenuIcon } from "./lib/icons";
import { Link } from "./lib/router";
import { cn } from "./lib/utils";
import type { AdminScreenDef, MenuGroup, MenuSection } from "./routes";

const groupId = (group: MenuGroup) =>
  `admin-menu-${group
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()}`;

export function SidebarNav({
  menu,
  path,
  onNavigate,
  extra,
}: {
  menu: readonly MenuSection[];
  path: string;
  /** Ao escolher uma tela (fecha a gaveta no celular). */
  onNavigate?: () => void;
  /** Algo a mais no item (o selo de contatos novos). */
  extra?: (item: AdminScreenDef) => ReactNode;
}) {
  const { pinned, sections } = sidebarLayout(menu);
  const active = activeGroup(sections, path);
  const [open, setOpen] = useState<OpenGroups>(() => resolveOpenGroups(readOpenGroups(), active));

  // A tela mudou para um grupo recolhido: abre o grupo dela.
  useEffect(() => {
    if (!active) return;
    setOpen((current) => {
      if (current[active]) return current;
      const next = resolveOpenGroups(current, active);
      writeOpenGroups(next);
      return next;
    });
  }, [active]);

  const toggle = (group: MenuGroup) =>
    setOpen((current) => {
      const next = { ...current, [group]: !current[group] };
      writeOpenGroups(next);
      return next;
    });

  const item = (screen: AdminScreenDef) => {
    const current = isCurrentPath(screen.path, path);
    return (
      <li key={screen.path}>
        <Link
          to={screen.path}
          onClick={onNavigate}
          aria-current={current ? "page" : undefined}
          className={cn(
            "flex min-h-8 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
            current && "bg-accent font-medium text-foreground",
          )}
        >
          <MenuIcon name={screen.icon} className="size-4" />
          {screen.label}
          {extra?.(screen)}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Menu do painel" className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
      {pinned.length > 0 && <ul className="space-y-0.5">{pinned.map(item)}</ul>}
      {sections.map((section) => {
        const id = groupId(section.group);
        const expanded = Boolean(open[section.group]);
        return (
          <div key={section.group}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => toggle(section.group)}
              className="flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {section.group}
              <ChevronRight aria-hidden="true" className={cn("size-3.5 transition-transform motion-reduce:transition-none", expanded && "rotate-90")} />
            </button>
            <ul id={id} hidden={!expanded} className="mt-0.5 space-y-0.5">
              {section.items.map(item)}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
