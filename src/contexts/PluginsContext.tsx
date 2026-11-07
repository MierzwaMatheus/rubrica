import { createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import { api } from '../../convex/_generated/api';
import { PLUGIN_REGISTRY, PluginId } from '../../convex/pluginRegistry';

type PluginStates = Record<string, boolean>;

interface PluginsContextValue {
  states: PluginStates;
  isLoading: boolean;
  isEnabled: (id: PluginId) => boolean;
}

const PluginsContext = createContext<PluginsContextValue | null>(null);

const IS_PROD = import.meta.env.PROD;

function defaultStates(): PluginStates {
  return Object.fromEntries(PLUGIN_REGISTRY.map(p => [p.id, p.defaultEnabled]));
}

function resolveStates(raw: Record<string, boolean> | undefined): PluginStates {
  const result: PluginStates = {};
  for (const plugin of PLUGIN_REGISTRY) {
    result[plugin.id] = raw ? (raw[plugin.id] ?? plugin.defaultEnabled) : plugin.defaultEnabled;
  }
  return result;
}

/** Produção: estados do JSON gerado no build (via react-query, para entrar na pré-renderização). */
function StaticPluginsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useReactQuery({
    queryKey: ['plugins'],
    queryFn: async (): Promise<Record<string, boolean> | null> => {
      try {
        const r = await fetch('/data/plugins.json');
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
  });
  const states = data === undefined ? defaultStates() : resolveStates(data ?? undefined);

  const isEnabled = (id: PluginId): boolean => states[id] ?? true;

  return (
    <PluginsContext.Provider value={{ states, isLoading, isEnabled }}>
      {children}
    </PluginsContext.Provider>
  );
}

function ConvexPluginsProvider({ children }: { children: React.ReactNode }) {
  const raw = useQuery(api.plugins.getPluginStates);
  const states = resolveStates(raw);
  const isEnabled = (id: PluginId): boolean => states[id] ?? true;

  return (
    <PluginsContext.Provider value={{ states, isLoading: raw === undefined, isEnabled }}>
      {children}
    </PluginsContext.Provider>
  );
}

export function PluginsProvider({ children }: { children: React.ReactNode }) {
  return IS_PROD
    ? <StaticPluginsProvider>{children}</StaticPluginsProvider>
    : <ConvexPluginsProvider>{children}</ConvexPluginsProvider>;
}

export function usePlugins() {
  const ctx = useContext(PluginsContext);
  if (!ctx) throw new Error('usePlugins must be inside PluginsProvider');
  return ctx;
}

export function usePlugin(id: PluginId): boolean {
  return usePlugins().isEnabled(id);
}
