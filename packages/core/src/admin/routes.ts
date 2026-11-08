/**
 * Telas do painel e o menu (RFC v2, "Painel"; decisão 19). Arquivo puro, sem React:
 * a integração do Astro usa `staticAdminPaths` para gerar `/admin/<tela>` no build
 * estático, e o painel usa `buildMenu`/`screenAccess` para montar o menu e barrar o
 * que o papel ou os plugins não permitem.
 *
 * O menu = telas do núcleo + `admin` de cada plugin ligado no tipo do site. Uma tela de
 * plugin com o mesmo caminho de uma do núcleo (ex.: `/admin/midia`) fica com a do núcleo.
 */
import type { SiteKind } from "../content/types";
import { PERMISSIONS, type Permission, type Role } from "../convex/lib/roles";
import type { PluginDefinition } from "../plugins/contract";

export const ADMIN_BASE = "/admin";

export type MenuGroup = "Site" | "Conteúdo" | "Comercial" | "Administração";
export const MENU_GROUPS: MenuGroup[] = ["Site", "Conteúdo", "Comercial", "Administração"];

export interface AdminScreenDef {
  /** Caminho completo (`/admin/paginas`). */
  path: string;
  label: string;
  /** Nome do ícone do Lucide (kebab-case). */
  icon: string;
  roles: readonly Role[];
  group: MenuGroup;
  /** Plugin dono da tela (telas de plugin). */
  plugin?: string;
  /** Fica fora do menu (subtelas como o editor de uma página). */
  hidden?: boolean;
  /** Tela do núcleo. */
  core?: boolean;
}

const screen = (path: string, label: string, icon: string, permission: Permission, group: MenuGroup, extra: Partial<AdminScreenDef> = {}): AdminScreenDef => ({
  path: `${ADMIN_BASE}${path}`,
  label,
  icon,
  roles: PERMISSIONS[permission],
  group,
  core: true,
  ...extra,
});

/** Telas do núcleo, na ordem do menu. */
export const CORE_SCREENS: AdminScreenDef[] = [
  screen("", "Início", "house", "panel", "Site"),
  screen("/paginas", "Páginas", "files", "pages", "Site"),
  screen("/paginas/editar", "Editar página", "file-pen", "pages", "Site", { hidden: true }),
  screen("/aparencia", "Aparência", "palette", "settings", "Site"),
  screen("/configuracoes", "Configurações", "settings", "settings", "Site"),
  screen("/textos", "Textos", "languages", "texts", "Site"),
  screen("/midia", "Mídia", "image", "media", "Site"),
  screen("/plugins", "Plugins", "puzzle", "settings", "Administração"),
  screen("/usuarios", "Usuários", "user-cog", "users", "Administração"),
  screen("/conta", "Minha conta", "key-round", "panel", "Administração", { hidden: true }),
];

function pluginGroup(plugin: PluginDefinition, roles: readonly string[], group?: string): MenuGroup {
  if (group && (MENU_GROUPS as string[]).includes(group)) return group as MenuGroup;
  if (plugin.collections?.length) return "Conteúdo";
  if (roles.includes("comercial")) return "Comercial";
  return "Administração";
}

/** Todas as telas conhecidas: núcleo + plugins (sem filtrar por papel ou estado). */
export function adminScreens(plugins: readonly PluginDefinition[]): AdminScreenDef[] {
  const screens = [...CORE_SCREENS];
  const taken = new Set(screens.map((s) => s.path));
  for (const plugin of plugins) {
    for (const s of plugin.admin ?? []) {
      if (taken.has(s.path)) continue;
      taken.add(s.path);
      screens.push({
        path: s.path,
        label: s.label,
        icon: s.icon,
        roles: s.roles as Role[],
        group: pluginGroup(plugin, s.roles, s.group),
        plugin: plugin.id,
      });
    }
  }
  return screens;
}

/** Caminhos que o build estático gera (`/admin`, `/admin/paginas`…), sem o prefixo `/admin/`. */
export function staticAdminPaths(plugins: readonly PluginDefinition[]): (string | undefined)[] {
  return adminScreens(plugins).map((s) => (s.path === ADMIN_BASE ? undefined : s.path.slice(ADMIN_BASE.length + 1)));
}

export interface AccessContext {
  role: Role | null;
  kind: SiteKind;
  /** Plugins ligados (estado efetivo, com dependências). */
  enabled: ReadonlySet<string>;
  plugins: readonly PluginDefinition[];
}

export type ScreenAccess =
  | { status: "ok"; screen: AdminScreenDef }
  | { status: "forbidden"; screen: AdminScreenDef }
  | { status: "plugin-off"; screen: AdminScreenDef; plugin: PluginDefinition }
  | { status: "not-found" };

function normalize(path: string): string {
  const clean = path.replace(/\/+$/, "");
  return clean === "" ? ADMIN_BASE : clean;
}

/** Pode abrir a tela? Rota sem permissão ou de plugin desligado vira aviso, não erro. */
export function screenAccess(path: string, ctx: AccessContext): ScreenAccess {
  const target = normalize(path);
  const screen = adminScreens(ctx.plugins).find((s) => s.path === target);
  if (!screen) return { status: "not-found" };
  if (screen.plugin) {
    const plugin = ctx.plugins.find((p) => p.id === screen.plugin)!;
    if (!plugin.kinds.includes(ctx.kind) || !ctx.enabled.has(plugin.id)) return { status: "plugin-off", screen, plugin };
  }
  if (!ctx.role || !screen.roles.includes(ctx.role)) return { status: "forbidden", screen };
  return { status: "ok", screen };
}

export interface MenuSection {
  group: MenuGroup;
  items: AdminScreenDef[];
}

/** Menu do usuário: só as telas que o papel vê e cujos plugins estão ligados, por grupo. */
export function buildMenu(ctx: AccessContext): MenuSection[] {
  const visible = adminScreens(ctx.plugins).filter((s) => !s.hidden && screenAccess(s.path, ctx).status === "ok");
  return MENU_GROUPS.map((group) => ({ group, items: visible.filter((s) => s.group === group) })).filter((g) => g.items.length > 0);
}
