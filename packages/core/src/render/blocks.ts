/**
 * O motor de blocos: de uma lista de `BlockInstance` (a de uma página ou o corpo de um case)
 * aos blocos prontos para o tema, num idioma. Página e case usam a mesma função; muda só o
 * contexto (`page` ou `case`), que decide quais blocos entram e onde fica o h1.
 */
import { blockAllowedIn, type BlockContext, type BlockDefinition } from "../blocks/define";
import type { BlockInstance, CollectionName, CollectionQuery, SiteKind } from "../content/types";
import type { SiteSnapshot } from "../data/source";
import type { PluginDefinition } from "../plugins/contract";
import { resolveVariant, type ThemeDefinition } from "../theme/contract";
import { queryCollection, type CollectionPaths } from "./collections";
import { resolveFields, type ResolveOptions } from "./resolve";

export interface ResolvedBlock {
  id: string;
  type: string;
  variant: string;
  fields: Record<string, unknown>;
  items: unknown[];
  headingLevel: 1 | 2;
  index: number;
  /** Quantos blocos visíveis a página (ou o corpo do case) tem. */
  total: number;
  interactive: boolean;
}

/** O site em volta dos blocos: o que decide se um bloco entra e como ele se resolve. */
export interface BlockSite {
  kind: SiteKind;
  theme: ThemeDefinition;
  /** Definições por tipo (núcleo e projeto). */
  definitions: ReadonlyMap<string, BlockDefinition>;
  /** Plugins ligados. */
  plugins: ReadonlySet<string>;
  /** Todos os plugins conhecidos (para achar o dono de uma coleção). */
  pluginDefs: readonly PluginDefinition[];
  /** Coleções cruas do snapshot (as que os blocos de coleção listam). */
  collections: SiteSnapshot["collections"];
  paths: CollectionPaths;
}

/** O site e as opções do idioma em que os blocos são resolvidos. */
export interface BlockEnv extends BlockSite {
  options: ResolveOptions;
}

export interface ResolveBlocksOptions {
  /**
   * `page`: o primeiro bloco leva o h1 quando é hero. `case`: só entram os blocos que
   * aceitam o case (`contexts`), todos com h2 (o h1 é do template de case).
   */
  context: BlockContext;
}

export interface ResolvedBlocks {
  blocks: ResolvedBlock[];
  /** O primeiro bloco é um hero com o h1 (só no contexto `page`). */
  firstIsHero: boolean;
}

/** O bloco é do tipo do site (comum ou do mesmo `kind`)? */
export function blockKindAllows(site: Pick<BlockSite, "kind">, def: BlockDefinition | undefined): def is BlockDefinition {
  return !!def && (def.category === "comum" || def.category === site.kind);
}

/** A coleção está ligada (sem plugin dono, ou com o dono ligado)? */
export function collectionOn(site: Pick<BlockSite, "plugins" | "pluginDefs">, collection: CollectionName): boolean {
  const owner = site.pluginDefs.find((p) => p.collections?.includes(collection));
  return !owner || site.plugins.has(owner.id);
}

/** Bloco cujo plugin (ou o dono da coleção que ele lista) está desligado. */
export function blockOff(site: Pick<BlockSite, "plugins" | "pluginDefs">, def: BlockDefinition, query: CollectionQuery | undefined): boolean {
  return (!!def.plugin && !site.plugins.has(def.plugin)) || (!!query && !collectionOn(site, query.collection));
}

/** O bloco pode sair no site: tipo do site, plugin e coleção ligados. */
export function blockAllowed(site: Pick<BlockSite, "kind" | "plugins" | "pluginDefs">, def: BlockDefinition | undefined, query?: CollectionQuery): def is BlockDefinition {
  return blockKindAllows(site, def) && !blockOff(site, def, query);
}

/** Algum campo obrigatório chegou preenchido no idioma? (Bloco sem campo obrigatório: sim.) */
function hasRequiredContent(def: BlockDefinition, fields: Record<string, unknown>): boolean {
  const required = Object.entries(def.fields).filter(([, f]) => f.required);
  if (!required.length) return true;
  return required.some(([key]) => {
    const v = fields[key];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  });
}

/**
 * Resolve os blocos no idioma de `env.options`: some o bloco invisível, o de outro tipo de
 * site, o de plugin desligado e (no case) o que não aceita o case; resolve campos, itens de
 * coleção, variação do tema e se monta ilha.
 *
 * Bloco de coleção sem itens não vira título solto: some (um convite interativo, como o de
 * depoimento, é conteúdo). Se sobrasse página vazia, os blocos ficam e o tema mostra o
 * vazio padrão (só na página: no case eles somem). No case, um bloco sem nenhum campo
 * obrigatório no idioma (seção sem tradução) também some, como as seções antigas.
 */
export function resolveBlocks(instances: readonly BlockInstance[], env: BlockEnv, { context }: ResolveBlocksOptions): ResolvedBlocks {
  const { theme, definitions, plugins, options, collections, paths } = env;
  const prepared = instances
    .filter((b) => b.visible)
    .flatMap((b) => {
      const def = definitions.get(b.type);
      const query = b.source ?? def?.source?.default;
      if (!blockAllowed(env, def, query)) return [];
      if (context === "case" && !blockAllowedIn(def, "case")) return [];
      const items = query ? queryCollection(query, collections[query.collection] as never[], options, paths) : [];
      const fields = resolveFields(def.fields, b.fields, options);
      if (context === "case" && !hasRequiredContent(def, fields)) return [];
      const optedOut = !!def.islandOptIn && !!theme.blocks?.[b.type] && !theme.islandBlocks?.includes(b.type);
      const interactive = !!def.interactive && !optedOut && (def.islandWhen?.(fields, plugins) ?? true);
      return [{ b, query, items, fields, interactive }];
    });
  const withContent = prepared.filter((x) => !x.query || x.items.length > 0 || x.interactive);
  // Na página, sobrar só blocos de coleção vazios ainda mostra o vazio padrão do tema. No
  // case, não: um corpo só de listas vazias é um case sem corpo (e não conta em `hasCase`).
  const visible = withContent.length || context === "case" ? withContent : prepared;
  const firstIsHero = context === "page" && visible[0]?.b.type === "hero";
  const blocks = visible.map(({ b, items, fields, interactive }, index): ResolvedBlock => ({
    id: b.id,
    type: b.type,
    variant: resolveVariant(theme, b.type, b.variant),
    fields,
    items,
    headingLevel: index === 0 && firstIsHero ? 1 : 2,
    index,
    total: visible.length,
    interactive,
  }));
  return { blocks, firstIsHero };
}
