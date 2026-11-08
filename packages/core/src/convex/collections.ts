/**
 * CRUD das coleções (posts, projetos, serviços, depoimentos, FAQ, currículo, dia a
 * dia, planos, equipe), com permissão por papel, plugin, lixeira e auditoria.
 *
 * Cada coleção recebe as mesmas funções: `list`, `get`, `create`, `update`,
 * `publish`, `unpublish`, `reorder`, `remove` (lixeira), `restore` e
 * `removePermanently` (as duas últimas só root). Posts e projetos têm slug estável.
 */
import { v, type GenericValidator, type PropertyValidators } from "convex/values";
import type { CollectionName } from "../content/types";
import type { Localized } from "../i18n";
import { requireRole } from "./auth";
import { logUserAction } from "./audit";
import { cleanFields, optionalKeys } from "./lib/clean";
import { sanitizeLocalizedHtml } from "./lib/sanitize";
import { anyText, filledLocales } from "./lib/text";
import { assertValidSlug, uniqueSlug } from "./lib/slug";
import type { Permission } from "./lib/roles";
import { getSettingsDoc, pluginForCollection, requirePlugin } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { mutation, query, type Id, type MutationCtx } from "./server";
import { COLLECTION_TABLES, type CollectionTable } from "./schema";
import {
  faqFields,
  planFields,
  postFields,
  projectFields,
  resumeItemFields,
  routineFields,
  serviceFields,
  teamMemberFields,
  testimonialFields,
} from "./validators";

type Data = Record<string, unknown>;

export interface CollectionSpec<F extends PropertyValidators, E extends PropertyValidators> {
  name: CollectionName;
  fields: F;
  /** Argumentos a mais na criação (o `slug` opcional de posts e projetos). */
  extra: E;
  permission: Permission;
  /** Tem slug estável (posts, projetos). */
  slug?: boolean;
  /** Publicado ao criar, se o painel não disser. Posts e projetos nascem como rascunho. */
  defaultPublished: boolean;
  /** Textos que precisam de pelo menos um idioma preenchido. */
  requiredText: string[];
  /** Rótulo para a auditoria e para o slug. */
  label: (doc: Data) => Localized<string> | string | undefined;
  /** Sanitiza o HTML dos campos ricos. */
  sanitize?: (data: Data) => Data;
  /** Campos a mais ao publicar (posts: data da primeira publicação). */
  onPublish?: (doc: Data, now: number) => Data;
}

function labelText(label: Localized<string> | string | undefined): string {
  return typeof label === "string" ? label : anyText(label);
}

async function defaultLocale(ctx: MutationCtx): Promise<string | undefined> {
  return (await getSettingsDoc(ctx))?.locales.default;
}

export function collectionFunctions<F extends PropertyValidators, E extends PropertyValidators>(rt: RubricaRuntime, spec: CollectionSpec<F, E>) {
  const table: CollectionTable = COLLECTION_TABLES[spec.name];
  const plugin = pluginForCollection(rt, spec.name);
  const allFields: Record<string, GenericValidator> = { ...spec.fields, ...spec.extra };
  const removable = optionalKeys(spec.fields);
  const target = (id: string, doc?: Data | null) => ({ type: spec.name, id, label: doc ? labelText(spec.label(doc)) : undefined });

  // Os documentos são de tabelas diferentes; os tipos exatos ficam nos argumentos.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const db = (ctx: MutationCtx) => ctx.db as any;
  const vId = v.id(table) as unknown as GenericValidator & { type: Id<CollectionTable> };

  async function guardWrite(ctx: MutationCtx) {
    const actor = await requireRole(ctx, spec.permission);
    if (plugin) await requirePlugin(ctx, rt, plugin);
    return actor;
  }

  async function load(ctx: MutationCtx, id: string): Promise<Data> {
    const doc = await db(ctx).get(id);
    if (!doc) throw new Error("Item não encontrado");
    return doc;
  }

  function prepare(data: Data, creating: boolean): Data {
    let out = cleanFields(allFields, data);
    if (spec.sanitize) out = spec.sanitize(out);
    for (const key of spec.requiredText) {
      if ((creating || key in out) && filledLocales(out[key] as Localized<string>).length === 0) {
        throw new Error(`${key}: preencha em pelo menos um idioma`);
      }
    }
    return out;
  }

  async function slugTaken(ctx: MutationCtx, slug: string, except?: string): Promise<boolean> {
    const found = await db(ctx)
      .query(table)
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    return !!found && found._id !== except;
  }

  async function nextOrder(ctx: MutationCtx): Promise<number> {
    const last = await db(ctx).query(table).withIndex("by_order").order("desc").first();
    return typeof last?.order === "number" ? last.order + 1 : 0;
  }

  const list = query({
    args: { includeDeleted: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
      await requireRole(ctx, spec.permission);
      const docs: Data[] = await (ctx.db as any).query(table).withIndex("by_order").collect();
      return docs.filter((d) => args.includeDeleted || d.deletedAt === undefined) as (Data & { _id: string })[];
    },
  });

  const get = query({
    args: { id: vId },
    handler: async (ctx, args) => {
      await requireRole(ctx, spec.permission);
      return ((await (ctx.db as any).get(args.id)) ?? null) as (Data & { _id: string }) | null;
    },
  });

  const create = mutation({
    args: { ...spec.fields, ...spec.extra, published: v.optional(v.boolean()) } as F & E & { published: ReturnType<typeof v.optional<ReturnType<typeof v.boolean>>> },
    handler: async (ctx, rawArgs): Promise<Id<CollectionTable>> => {
      const { userId } = await guardWrite(ctx);
      const { published, ...input } = rawArgs as Data & { published?: boolean };
      const data = prepare(input, true);
      if (spec.slug) {
        const given = typeof data.slug === "string" ? data.slug : undefined;
        if (given) {
          assertValidSlug(given);
          if (await slugTaken(ctx, given)) throw new Error(`O slug "${given}" já está em uso`);
        } else {
          const locale = await defaultLocale(ctx);
          const source = spec.label(data);
          const base = typeof source === "string" ? source : anyText(source, locale);
          data.slug = await uniqueSlug(base, (s) => slugTaken(ctx, s));
        }
      }
      if (data.order === undefined) data.order = await nextOrder(ctx);
      const now = Date.now();
      const isPublished = published ?? spec.defaultPublished;
      const doc: Data = { ...data, published: isPublished, createdAt: now, createdBy: userId };
      if (isPublished && spec.onPublish) Object.assign(doc, spec.onPublish(doc, now));
      if (spec.name === "posts") doc.authorId = userId;
      const id = await db(ctx).insert(table, doc);
      await logUserAction(ctx, userId, "admin.create", target(id, doc));
      return id;
    },
  });

  const update = mutation({
    args: {
      id: vId,
      patch: v.object({ ...spec.fields, ...spec.extra } as F & E).partial(),
      /** Campos opcionais a apagar (o cliente do Convex não envia `undefined`). */
      unset: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
      const { userId } = await guardWrite(ctx);
      const current = await load(ctx, args.id);
      const patch = prepare(args.patch as Data, false);
      for (const key of args.unset ?? []) {
        if (!removable.has(key)) throw new Error(`O campo "${key}" não pode ser apagado`);
        if (key in patch) throw new Error(`O campo "${key}" está no patch e no unset`);
        patch[key] = undefined;
      }
      // O slug só muda quando pedido; o título nunca mexe nele (correção da v1.10).
      if (spec.slug && typeof patch.slug === "string" && patch.slug !== current.slug) {
        assertValidSlug(patch.slug);
        if (await slugTaken(ctx, patch.slug, args.id)) throw new Error(`O slug "${patch.slug}" já está em uso`);
      }
      await db(ctx).patch(args.id, { ...patch, updatedAt: Date.now(), updatedBy: userId });
      await logUserAction(ctx, userId, "admin.update", target(args.id, current), {
        fields: Object.keys(patch),
        ...(patch.slug !== undefined && patch.slug !== current.slug ? { previousSlug: current.slug } : {}),
      });
      return null;
    },
  });

  const setPublished = (published: boolean) =>
    mutation({
      args: { id: vId },
      handler: async (ctx, args) => {
        const { userId } = await guardWrite(ctx);
        const doc = await load(ctx, args.id);
        if (doc.deletedAt !== undefined) throw new Error("O item está na lixeira");
        const now = Date.now();
        const extra = published && spec.onPublish ? spec.onPublish(doc, now) : {};
        await db(ctx).patch(args.id, { published, ...extra, updatedAt: now, updatedBy: userId });
        await logUserAction(ctx, userId, published ? "admin.publish" : "admin.unpublish", target(args.id, doc));
        return null;
      },
    });

  const reorder = mutation({
    args: { ids: v.array(vId) },
    handler: async (ctx, args) => {
      const { userId } = await guardWrite(ctx);
      for (const [order, id] of args.ids.entries()) {
        await load(ctx, id);
        await db(ctx).patch(id, { order });
      }
      await logUserAction(ctx, userId, "admin.reorder", { type: spec.name }, { count: args.ids.length });
      return null;
    },
  });

  const remove = mutation({
    args: { id: vId },
    handler: async (ctx, args) => {
      const { userId } = await guardWrite(ctx);
      const doc = await load(ctx, args.id);
      await db(ctx).patch(args.id, { deletedAt: Date.now(), deletedBy: userId });
      await logUserAction(ctx, userId, "admin.delete", target(args.id, doc), { softDelete: true });
      return null;
    },
  });

  const restore = mutation({
    args: { id: vId },
    handler: async (ctx, args) => {
      const { userId } = await requireRole(ctx, "purge");
      const doc = await load(ctx, args.id);
      await db(ctx).patch(args.id, { deletedAt: undefined, deletedBy: undefined });
      await logUserAction(ctx, userId, "admin.restore", target(args.id, doc));
      return null;
    },
  });

  const removePermanently = mutation({
    args: { id: vId },
    handler: async (ctx, args) => {
      const { userId } = await requireRole(ctx, "purge");
      const doc = await load(ctx, args.id);
      await db(ctx).delete(args.id);
      await logUserAction(ctx, userId, "admin.permanent_delete", target(args.id, doc));
      return null;
    },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    list,
    get,
    create,
    update,
    publish: setPublished(true),
    unpublish: setPublished(false),
    reorder,
    remove,
    restore,
    removePermanently,
  };
}

// ── Coleções do núcleo ──────────────────────────────────────────────────────

const slugArg = { slug: v.optional(v.string()) };

const sanitizePost = (data: Data): Data =>
  data.content ? { ...data, content: sanitizeLocalizedHtml(data.content as Localized<string>) } : data;

const sanitizeProject = (data: Data): Data => {
  const out = { ...data };
  if (out.content) out.content = sanitizeLocalizedHtml(out.content as Localized<string>);
  if (Array.isArray(out.sections)) {
    out.sections = (out.sections as Data[]).map((s) => ({ ...s, body: sanitizeLocalizedHtml(s.body as Localized<string>) }));
  }
  return out;
};

export function postsFunctions(rt: RubricaRuntime) {
  return collectionFunctions(rt, {
    name: "posts",
    fields: postFields,
    extra: slugArg,
    permission: "blog",
    slug: true,
    defaultPublished: false,
    requiredText: ["title"],
    label: (d) => d.title as Localized<string>,
    sanitize: sanitizePost,
    // A data da primeira publicação fica: republicar não muda a data do post.
    onPublish: (doc, now) => (typeof doc.publishedAt === "number" ? {} : { publishedAt: now }),
  });
}

export function projectsFunctions(rt: RubricaRuntime) {
  return collectionFunctions(rt, {
    name: "projects",
    fields: projectFields,
    extra: slugArg,
    permission: "content",
    slug: true,
    defaultPublished: false,
    requiredText: ["title"],
    label: (d) => d.title as Localized<string>,
    sanitize: sanitizeProject,
  });
}

const simple = <F extends PropertyValidators>(
  rt: RubricaRuntime,
  name: CollectionName,
  fields: F,
  requiredText: string[],
  label: (d: Data) => Localized<string> | string | undefined,
  permission: Permission = "content",
) => collectionFunctions(rt, { name, fields, extra: {}, permission, defaultPublished: true, requiredText, label });

export const servicesFunctions = (rt: RubricaRuntime) => simple(rt, "services", serviceFields, ["title"], (d) => d.title as Localized<string>);
export const testimonialsFunctions = (rt: RubricaRuntime) => simple(rt, "testimonials", testimonialFields, ["quote"], (d) => d.author as string);
export const faqFunctions = (rt: RubricaRuntime) => simple(rt, "faq", faqFields, ["question", "answer"], (d) => d.question as Localized<string>);
/** A descrição do currículo é texto rico (HTML, como na v1): sanitizada ao gravar. */
const sanitizeResume = (data: Data): Data =>
  data.description ? { ...data, description: sanitizeLocalizedHtml(data.description as Localized<string>) } : data;

export const resumeFunctions = (rt: RubricaRuntime) =>
  collectionFunctions(rt, { name: "resume", fields: resumeItemFields, extra: {}, permission: "content", defaultPublished: true, requiredText: ["title"], label: (d) => d.title as Localized<string>, sanitize: sanitizeResume });
export const routineFunctions = (rt: RubricaRuntime) => simple(rt, "routine", routineFields, ["title"], (d) => d.title as Localized<string>);
export const plansFunctions = (rt: RubricaRuntime) => simple(rt, "plans", planFields, ["name"], (d) => d.name as Localized<string>, "plans");
export const teamFunctions = (rt: RubricaRuntime) => simple(rt, "team", teamMemberFields, ["role"], (d) => d.name as string);
