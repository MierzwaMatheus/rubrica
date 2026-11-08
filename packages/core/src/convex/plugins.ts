/**
 * Plugins ligados, a partir das configurações do site (`siteSettings.plugins`) e do
 * padrão de cada tipo de site (`enabledPlugins` do contrato).
 */
import { enabledPlugins } from "../plugins/contract";
import type { CollectionName, SiteKind } from "../content/types";
import type { Doc, ReaderCtx } from "./server";
import type { RubricaRuntime } from "./runtime";

export async function getSettingsDoc(ctx: ReaderCtx): Promise<Doc<"siteSettings"> | null> {
  return ctx.db.query("siteSettings").first();
}

/** Plugins ligados. Sem configurações ainda, vale o padrão de um site pessoal. */
export async function enabledPluginsFor(ctx: ReaderCtx, rt: RubricaRuntime, settings?: Doc<"siteSettings"> | null): Promise<Set<string>> {
  const doc = settings === undefined ? await getSettingsDoc(ctx) : settings;
  const kind: SiteKind = doc?.kind ?? "pessoal";
  return enabledPlugins([...rt.plugins], kind, doc?.plugins ?? {});
}

export async function isPluginOn(ctx: ReaderCtx, rt: RubricaRuntime, id: string): Promise<boolean> {
  return (await enabledPluginsFor(ctx, rt)).has(id);
}

export async function requirePlugin(ctx: ReaderCtx, rt: RubricaRuntime, id: string): Promise<void> {
  if (!(await isPluginOn(ctx, rt, id))) throw new Error(`O plugin "${id}" está desligado`);
}

/** Plugin que traz a coleção, se houver (posts → blog). Coleção sem plugin está sempre disponível. */
export function pluginForCollection(rt: RubricaRuntime, collection: CollectionName): string | undefined {
  return rt.plugins.find((p) => p.collections?.includes(collection))?.id;
}
