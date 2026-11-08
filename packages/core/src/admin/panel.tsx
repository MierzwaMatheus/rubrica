/**
 * Contexto do painel depois do login: quem está logado, configurações do site,
 * plugins ligados, catálogo de blocos e o tema em uso.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { theme, projectBlocks } from "virtual:rubrica/client";
import { CORE_BLOCKS } from "../blocks/catalog";
import type { BlockDefinition } from "../blocks/define";
import type { SiteKind, SiteSettings } from "../content/types";
import type { LocaleConfig } from "../i18n";
import type { Role } from "../convex/lib/roles";
import { enabledPlugins, type PluginDefinition } from "../plugins/contract";
import { CORE_PLUGINS } from "../plugins/registry";
import type { ThemeDefinition } from "../theme/contract";
import { api, type Me, type PluginRow } from "./data/api";
import { useQuery } from "./data/backend";

export interface PanelValue {
  me: Me & { role: Role };
  /** `null` enquanto o site não foi configurado pelo `setup` do CLI. */
  settings: SiteSettings | null;
  kind: SiteKind;
  locales: LocaleConfig;
  plugins: readonly PluginDefinition[];
  pluginRows: PluginRow[];
  enabled: ReadonlySet<string>;
  blocks: readonly BlockDefinition[];
  theme: ThemeDefinition;
}

const PanelContext = createContext<PanelValue | null>(null);

const FALLBACK_LOCALES: LocaleConfig = { locales: ["pt-BR"], default: "pt-BR" };
const BLOCKS = [...CORE_BLOCKS, ...(projectBlocks ?? []).filter((b) => !CORE_BLOCKS.some((c) => c.type === b.type))];

export function PanelProvider({ me, children, fallback }: { me: Me & { role: Role }; children: ReactNode; fallback: ReactNode }) {
  const settings = useQuery(api.settings.get, {});
  const pluginRows = useQuery(api.settings.plugins, {});
  const value = useMemo((): PanelValue | null => {
    if (settings === undefined || pluginRows === undefined) return null;
    const kind = settings?.kind ?? "pessoal";
    // O estado efetivo vem do backend; o cálculo local cobre o site ainda sem configuração.
    const enabled = pluginRows.length ? new Set(pluginRows.filter((p) => p.enabled).map((p) => p.id)) : enabledPlugins(CORE_PLUGINS, kind, {});
    return { me, settings, kind, locales: settings?.locales ?? FALLBACK_LOCALES, plugins: CORE_PLUGINS, pluginRows, enabled, blocks: BLOCKS, theme };
  }, [me, settings, pluginRows]);
  if (!value) return <>{fallback}</>;
  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}

export function usePanel(): PanelValue {
  const panel = useContext(PanelContext);
  if (!panel) throw new Error("[rubrica] tela fora do PanelProvider");
  return panel;
}

export { localeName } from "./lib/locale";
