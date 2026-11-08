/**
 * Contrato de plugin (RFC v2, decisão 19). Cada plugin declara num lugar só o que
 * traz; o núcleo liga e desliga tudo junto. Plugins de terceiros em pacote usarão o
 * mesmo formato, mas a API ainda não é pública.
 */
import type { BlockDefinition } from "../blocks/define";
import type { CollectionName, SiteKind } from "../content/types";

export interface PluginRoute {
  /** Caminho sem idioma (`/curriculo`). */
  path: string;
  /** `public`: página do site (pré-renderizada). `app`: rota do app (proposta, checkout). */
  kind: "public" | "app";
}

export interface AdminScreen {
  /** Caminho dentro do painel (`/admin/propostas`). */
  path: string;
  label: string;
  /** Ícone do Lucide. */
  icon: string;
  /** Papéis que veem a tela (ver convex/roles). */
  roles: string[];
  group?: string;
}

export interface PluginDefinition {
  id: string;
  label: string;
  description: string;
  /** Tipos de site em que o plugin existe. */
  kinds: SiteKind[];
  /** Ligado por padrão em cada tipo. */
  defaultEnabled: Partial<Record<SiteKind, boolean>>;
  /** Plugins que precisam estar ligados junto. */
  requires?: string[];
  blocks?: BlockDefinition[];
  collections?: CollectionName[];
  routes?: PluginRoute[];
  admin?: AdminScreen[];
  /** Nomes das ferramentas do MCP que o plugin acrescenta. */
  mcpTools?: string[];
}

export function definePlugin(plugin: PluginDefinition): PluginDefinition {
  if (!/^[a-z][a-z0-9-]*$/.test(plugin.id)) throw new Error(`[rubrica] id de plugin inválido: "${plugin.id}"`);
  return plugin;
}

/** Estado efetivo: configuração do site, senão o padrão do tipo; dependências desligadas desligam. */
export function enabledPlugins(
  plugins: PluginDefinition[],
  kind: SiteKind,
  configured: Record<string, boolean>,
): Set<string> {
  const byId = new Map(plugins.map((p) => [p.id, p]));
  const on = new Set<string>();
  for (const p of plugins) {
    if (!p.kinds.includes(kind)) continue;
    if (configured[p.id] ?? p.defaultEnabled[kind] ?? false) on.add(p.id);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...on]) {
      const missing = byId.get(id)?.requires?.some((r) => !on.has(r));
      if (missing) {
        on.delete(id);
        changed = true;
      }
    }
  }
  return on;
}
