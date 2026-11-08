/**
 * Estado do site visto pelo usuário logado: papel, configurações, plugins e quais
 * módulos opcionais o backend tem. Decide quais ferramentas aparecem.
 */
import type { SiteSettings } from "@rubrica/core";
import type { Role } from "@rubrica/core/convex/roles";
import { isRole } from "@rubrica/core/convex/roles";
import { RubricaError, type RubricaClient } from "./client";

export interface PluginInfo {
  id: string;
  label: string;
  description: string;
  requires: string[];
  enabled: boolean;
}

export interface Me {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role | null;
  mustChangePassword: boolean;
}

/**
 * Módulos do backend que podem não existir ainda (outros agentes os acrescentam).
 * As ferramentas só aparecem se a função existir; a checagem chama a função com um
 * argumento inválido de propósito: o Convex recusa os argumentos antes de executar
 * (nada roda) e a mensagem diz se a função existe.
 */
export interface OptionalModule {
  id: string;
  probe: { type: "query" | "mutation" | "action"; path: string };
}

export const OPTIONAL_MODULES: OptionalModule[] = [
  { id: "contacts", probe: { type: "query", path: "rubrica/contacts:list" } },
  { id: "deploy", probe: { type: "action", path: "rubrica/deploy:trigger" } },
];

export interface SiteState {
  me: Me | null;
  settings: SiteSettings | null;
  plugins: PluginInfo[];
  modules: ReadonlySet<string>;
  loadedAt: number;
  /** Por que o estado está incompleto (rede, backend sem configuração). */
  problem?: string;
}

export const EMPTY_STATE: SiteState = { me: null, settings: null, plugins: [], modules: new Set(), loadedAt: 0 };

export function pluginEnabled(state: SiteState, id: string): boolean {
  return state.plugins.some((p) => p.id === id && p.enabled);
}

export function siteLocales(state: SiteState): string[] {
  return state.settings?.locales.locales ?? [];
}

export async function probeModule(client: RubricaClient, mod: OptionalModule): Promise<boolean> {
  try {
    await client[mod.probe.type](mod.probe.path, { __rubricaProbe: true });
    // Rodou sem recusar o argumento: a função existe, mas não tem validador. Conta como presente.
    return true;
  } catch (e) {
    return !(e instanceof RubricaError && e.kind === "missing-function");
  }
}

/** Carrega o estado. Sem login ou com falha, devolve o estado vazio com o motivo. */
export async function loadState(client: RubricaClient, hasSession: boolean): Promise<SiteState> {
  if (!hasSession) return { ...EMPTY_STATE, loadedAt: Date.now() };
  try {
    const raw = await client.query<Me | null>("rubrica/users:me", {});
    if (!raw) return { ...EMPTY_STATE, loadedAt: Date.now(), problem: "A sessão não é mais válida. Faça o login de novo." };
    const me: Me = { ...raw, role: isRole(raw.role) ? raw.role : null };
    if (!me.role) return { ...EMPTY_STATE, me, loadedAt: Date.now(), problem: "Este usuário não tem papel no painel." };
    const [settings, plugins, modules] = await Promise.all([
      client.query<SiteSettings | null>("rubrica/settings:get", {}),
      client.query<PluginInfo[]>("rubrica/settings:plugins", {}),
      Promise.all(OPTIONAL_MODULES.map(async (m) => ((await probeModule(client, m)) ? m.id : null))),
    ]);
    return {
      me,
      settings,
      plugins,
      modules: new Set(modules.filter((m): m is string => !!m)),
      loadedAt: Date.now(),
      ...(settings ? {} : { problem: "O site ainda não foi configurado no Convex (rode o setup)." }),
    };
  } catch (e) {
    return { ...EMPTY_STATE, loadedAt: Date.now(), problem: (e as Error).message };
  }
}
