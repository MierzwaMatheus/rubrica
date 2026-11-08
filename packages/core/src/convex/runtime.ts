/**
 * Configuração do backend no projeto: blocos e plugins próprios além dos do núcleo.
 * Vem de `createRubrica(config)` (ver `index.ts`).
 */
import type { BlockDefinition } from "../blocks/define";
import { CORE_BLOCKS } from "../blocks/catalog";
import type { PluginDefinition } from "../plugins/contract";
import { CORE_PLUGINS } from "../plugins/registry";
import { resolvePersonalDataSources, type PersonalDataSource } from "./personalData";

export interface RubricaConfig {
  /** Blocos próprios do projeto (só a definição: tipo, campos, plugin). */
  blocks?: BlockDefinition[];
  /** Plugins próprios do projeto. */
  plugins?: PluginDefinition[];
  /** Fontes de dados pessoais do projeto (LGPD), além das do núcleo. Ver `personalData.ts`. */
  personalData?: PersonalDataSource[];
}

export interface RubricaRuntime {
  blocks: readonly BlockDefinition[];
  plugins: readonly PluginDefinition[];
  personalData: readonly PersonalDataSource[];
}

export function resolveRuntime(config: RubricaConfig = {}): RubricaRuntime {
  const blocks = [...CORE_BLOCKS, ...(config.blocks ?? [])];
  const plugins = [...CORE_PLUGINS, ...(config.plugins ?? [])];
  const dup = <T>(items: T[], key: (t: T) => string, what: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      const k = key(item);
      if (seen.has(k)) throw new Error(`[rubrica] ${what} repetido: "${k}"`);
      seen.add(k);
    }
  };
  dup(blocks, (b) => b.type, "tipo de bloco");
  dup(plugins, (p) => p.id, "plugin");
  return { blocks, plugins, personalData: resolvePersonalDataSources(config.personalData) };
}
