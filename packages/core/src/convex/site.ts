/**
 * Snapshot do build: tudo o que o site público precisa, numa leitura, só com o que
 * está publicado (sem rascunho, sem lixeira, sem bloco oculto, sem coleção de plugin
 * desligado), no formato `SiteSnapshot` de `data/source.ts`. As URLs das imagens do
 * storage são refeitas aqui (`ctx.storage.getUrl`).
 *
 * É a única query pública sem login: devolve só o que o site já mostra.
 */
import type { SiteSnapshot } from "../data/source";
import type { CollectionName, PageRecord, RawCollections, SiteSettings, UiTexts } from "../content/types";
import { COLLECTIONS } from "../content/types";
import { enabledPluginsFor, getSettingsDoc, pluginForCollection } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { COLLECTION_TABLES } from "./schema";
import { query, type Doc, type QueryCtx } from "./server";

type Data = Record<string, unknown>;

/** Campos de controle que não vão ao site. */
const INTERNAL_FIELDS = new Set(["_id", "_creationTime", "published", "createdAt", "createdBy", "updatedBy", "deletedAt", "deletedBy", "authorId"]);

/** Documento do banco → item cru da coleção (`id` no lugar de `_id`, sem os campos de controle). */
export function toRawItem<T>(doc: Data): T {
  const out: Data = { id: doc._id };
  for (const [key, value] of Object.entries(doc)) {
    if (!INTERNAL_FIELDS.has(key) && value !== undefined) out[key] = value;
  }
  return out as T;
}

export function toPageRecord(page: Doc<"pages">): PageRecord {
  return {
    id: page._id,
    path: page.path,
    ...(page.system ? { system: true } : {}),
    title: page.title,
    ...(page.seo ? { seo: page.seo } : {}),
    blocks: page.blocks.filter((b) => b.visible),
    published: true,
    updatedAt: page.updatedAt,
  };
}

function isLive(doc: Data): boolean {
  return doc.published === true && doc.deletedAt === undefined;
}

function byOrder(a: Data, b: Data): number {
  const oa = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
  const ob = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
  return oa - ob || (a._creationTime as number) - (b._creationTime as number);
}

// ── Imagens ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Data {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function collectStorageIds(value: unknown, ids: Set<string>): void {
  if (Array.isArray(value)) value.forEach((v) => collectStorageIds(v, ids));
  else if (isObject(value)) {
    if (typeof value.storageId === "string" && typeof value.url === "string") ids.add(value.storageId);
    Object.values(value).forEach((v) => collectStorageIds(v, ids));
  }
}

interface StoredImage {
  url: string | null;
  width?: number;
  height?: number;
}

function applyImages<T>(value: T, images: Map<string, StoredImage>): T {
  if (Array.isArray(value)) return value.map((v) => applyImages(v, images)) as T;
  if (!isObject(value)) return value;
  const out: Data = {};
  for (const [key, v] of Object.entries(value)) out[key] = applyImages(v, images);
  if (typeof out.storageId === "string" && typeof out.url === "string") {
    const stored = images.get(out.storageId);
    if (stored?.url) out.url = stored.url;
    if (out.width === undefined && stored?.width) out.width = stored.width;
    if (out.height === undefined && stored?.height) out.height = stored.height;
  }
  return out as T;
}

/** Troca a URL de toda imagem com `storageId` pela atual e completa as dimensões pela biblioteca. */
export async function resolveImages<T>(ctx: QueryCtx, value: T): Promise<T> {
  const ids = new Set<string>();
  collectStorageIds(value, ids);
  const images = new Map<string, StoredImage>();
  await Promise.all(
    [...ids].map(async (id) => {
      const storageId = ctx.db.system.normalizeId("_storage", id);
      if (!storageId) return;
      const media = await ctx.db
        .query("media")
        .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
        .first();
      images.set(id, { url: await ctx.storage.getUrl(storageId), width: media?.width, height: media?.height });
    }),
  );
  return applyImages(value, images);
}

// ── Snapshot ────────────────────────────────────────────────────────────────

export async function buildSnapshot(ctx: QueryCtx, rt: RubricaRuntime): Promise<SiteSnapshot> {
  const settings = await getSettingsDoc(ctx);
  if (!settings) throw new Error("[rubrica] o site ainda não foi configurado no Convex (rode o setup)");
  const { _id, _creationTime, updatedAt, updatedBy, ...site } = settings;
  void _id;
  void _creationTime;
  void updatedAt;
  void updatedBy;
  const enabled = await enabledPluginsFor(ctx, rt, settings);

  const pages = (await ctx.db.query("pages").withIndex("by_published", (q) => q.eq("published", true)).collect())
    .filter((p) => p.deletedAt === undefined)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(toPageRecord);

  const collections = {} as { [C in CollectionName]: RawCollections[C][] };
  for (const name of COLLECTIONS) {
    const plugin = pluginForCollection(rt, name);
    if (plugin && !enabled.has(plugin)) {
      (collections as Record<string, unknown[]>)[name] = [];
      continue;
    }
    const table = COLLECTION_TABLES[name];
    // Os documentos são de tabelas diferentes; a forma de cada um é a do schema.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = (await (ctx.db as any)
      .query(table)
      .withIndex(name === "posts" ? "by_published_and_publishedAt" : "by_published_and_order", (q: any) => q.eq("published", true))
      .collect()) as Data[];
    let live = docs.filter(isLive);
    if (name === "posts") {
      live = live.filter((d) => typeof d.publishedAt === "number").sort((a, b) => (b.publishedAt as number) - (a.publishedAt as number));
    } else {
      live.sort(byOrder);
    }
    (collections as Record<string, unknown[]>)[name] = live.map((d) => toRawItem(d));
  }

  const texts: UiTexts = {};
  for (const doc of await ctx.db.query("uiTexts").collect()) texts[doc.key] = doc.value;

  return resolveImages(ctx, { site: site as SiteSettings, pages, collections, texts });
}

export function siteFunctions(rt: RubricaRuntime) {
  return {
    /** O que o build do site público lê (`convexSource`). Pública: só conteúdo publicado. */
    snapshot: query({
      args: {},
      handler: async (ctx): Promise<SiteSnapshot> => buildSnapshot(ctx, rt),
    }),
  };
}
