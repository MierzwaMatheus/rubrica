/**
 * Plugins que o CLI oferece, tirados do registro do núcleo (`@rubrica/core/plugins`),
 * e os pacotes prontos do modo rápido. O estado efetivo de cada plugin (padrão do tipo
 * de site + escolha + dependências) é calculado pelo próprio núcleo.
 */
import { CORE_PLUGINS, V1_PLUGIN_RENAMES } from "@rubrica/core/plugins";
import type { SiteKind } from "@rubrica/core";

export { CORE_PLUGINS, V1_PLUGIN_RENAMES };

/** Plugins que só funcionam com a chave de um serviço externo (o setup pede). */
export const NEEDS_KEY: Record<string, string> = {
  payments: "Asaas",
  "ai-resumes": "OpenRouter",
  translation: "OpenRouter",
};

export interface PluginOption {
  id: string;
  label: string;
  description: string;
  requires: string[];
  defaultEnabled: boolean;
  needsKey?: string;
}

/** Plugins do tipo de site, na ordem do registro do núcleo. */
export function pluginOptions(kind: SiteKind): PluginOption[] {
  return CORE_PLUGINS.filter((p) => p.kinds.includes(kind)).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    requires: p.requires ?? [],
    defaultEnabled: p.defaultEnabled[kind] ?? false,
    ...(NEEDS_KEY[p.id] && { needsKey: NEEDS_KEY[p.id] }),
  }));
}

/** Plugins ligados por padrão no tipo de site. */
export function defaultPlugins(kind: SiteKind): string[] {
  return pluginOptions(kind)
    .filter((p) => p.defaultEnabled)
    .map((p) => p.id);
}

export interface PluginPreset {
  id: string;
  label: string;
  hint: string;
  kinds: SiteKind[];
  plugins: string[];
}

export const PLUGIN_PRESETS: PluginPreset[] = [
  {
    id: "recommended",
    label: "Padrão do tipo de site",
    hint: "o que o Rubrica liga por padrão",
    kinds: ["pessoal", "empresa"],
    plugins: [],
  },
  {
    id: "freelancer",
    label: "Para vender serviços",
    hint: "portfólio, contato, propostas e depoimentos",
    kinds: ["pessoal"],
    plugins: ["contact-wizard", "proposals", "portfolio", "about", "testimonials", "testimonials-intake", "audit-log", "media-manager"],
  },
  {
    id: "simple",
    label: "Só o portfólio",
    hint: "portfólio, currículo, sobre e contato",
    kinds: ["pessoal"],
    plugins: ["contact-wizard", "portfolio", "resume", "about"],
  },
];

/** Plugins de um pacote pronto (o "padrão" usa o padrão do tipo de site). */
export function presetPlugins(id: string, kind: SiteKind): string[] | undefined {
  const preset = PLUGIN_PRESETS.find((p) => p.id === id && p.kinds.includes(kind));
  if (!preset) return undefined;
  return preset.id === "recommended" ? defaultPlugins(kind) : [...preset.plugins];
}

/**
 * `{ id: ligado }` com todos os plugins do tipo de site: grava a escolha explícita,
 * para o site não mudar se o padrão do núcleo mudar numa versão nova.
 */
export function pluginsRecord(kind: SiteKind, selected: string[]): Record<string, boolean> {
  return Object.fromEntries(pluginOptions(kind).map((p) => [p.id, selected.includes(p.id)]));
}

/** Ids desconhecidos no tipo de site (para avisar). */
export function unknownPlugins(kind: SiteKind, ids: string[]): string[] {
  const known = new Set(pluginOptions(kind).map((p) => p.id));
  return ids.filter((id) => !known.has(id));
}
