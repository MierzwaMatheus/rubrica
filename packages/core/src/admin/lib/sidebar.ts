/**
 * Grupos recolhíveis do menu lateral (como na v1). Arquivo puro: separa o Início dos
 * grupos, acha o grupo da tela aberta e decide quais grupos ficam abertos a partir do
 * que a pessoa deixou guardado no navegador.
 */
import { ADMIN_BASE, type AdminScreenDef, type MenuGroup, type MenuSection } from "../routes";

export interface SidebarLayout {
  /** Fora dos grupos, sempre à vista (o Início). */
  pinned: AdminScreenDef[];
  /** Grupos recolhíveis, só os que têm item (grupo vazio some). */
  sections: MenuSection[];
}

/** Tira o Início dos grupos e descarta os grupos que ficaram vazios. */
export function sidebarLayout(menu: readonly MenuSection[]): SidebarLayout {
  const pinned: AdminScreenDef[] = [];
  const sections: MenuSection[] = [];
  for (const section of menu) {
    const items = section.items.filter((item) => {
      if (item.path !== ADMIN_BASE) return true;
      pinned.push(item);
      return false;
    });
    if (items.length > 0) sections.push({ group: section.group, items });
  }
  return { pinned, sections };
}

/** A tela do caminho é a do item (ou uma subtela dele, como `/admin/paginas/editar`). */
export function isCurrentPath(itemPath: string, path: string): boolean {
  return itemPath === ADMIN_BASE ? path === ADMIN_BASE : path === itemPath || path.startsWith(`${itemPath}/`);
}

/** Grupo do item da tela aberta, se ele estiver num grupo. */
export function activeGroup(sections: readonly MenuSection[], path: string): MenuGroup | undefined {
  return sections.find((s) => s.items.some((item) => isCurrentPath(item.path, path)))?.group;
}

export type OpenGroups = Partial<Record<MenuGroup, boolean>>;

/**
 * Quais grupos aparecem abertos: o que ficou guardado vale; sem nada guardado, o grupo
 * começa recolhido. O grupo da tela aberta abre sempre que a tela muda para ele.
 */
export function resolveOpenGroups(stored: OpenGroups, active: MenuGroup | undefined): OpenGroups {
  return active ? { ...stored, [active]: true } : { ...stored };
}

export const SIDEBAR_STORAGE_KEY = "rubrica:admin-menu-groups";

/** Lê o estado guardado; sem armazenamento ou com valor estragado, nada guardado. */
export function readOpenGroups(storage?: Pick<Storage, "getItem">): OpenGroups {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: OpenGroups = {};
    for (const [key, value] of Object.entries(parsed)) if (typeof value === "boolean") out[key as MenuGroup] = value;
    return out;
  } catch {
    return {};
  }
}

export function writeOpenGroups(open: OpenGroups, storage?: Pick<Storage, "setItem">): void {
  try {
    (storage ?? globalThis.localStorage)?.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(open));
  } catch {
    /* sem armazenamento: o estado vale só nesta visita */
  }
}
