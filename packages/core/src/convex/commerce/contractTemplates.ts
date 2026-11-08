/**
 * Modelos de contrato (plugin `contract-templates`, requer `proposals`; port da v1).
 *
 * Papéis: ler (para escolher o modelo de uma proposta) = `proposals`, inclusive o
 * proposal-editor; criar, editar, apagar e escolher o padrão = `contracts` (root,
 * admin, comercial). Na v1 a lista era pública; aqui a página da proposta recebe o
 * texto do contrato pela própria proposta (`proposals.getPublic`).
 */
import { v } from "convex/values";
import { logUserAction } from "../audit";
import { isPluginOn } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { internalMutation, mutation, query, type Id, type MutationCtx } from "../server";
import { DEFAULT_CONTRACT_TEMPLATE } from "./lib/defaultContract";
import { guard } from "./shared";

const PLUGINS = ["proposals", "contract-templates"];

async function clearDefault(ctx: MutationCtx, except?: Id<"contractTemplates">) {
  const current = await ctx.db
    .query("contractTemplates")
    .withIndex("by_is_default", (q) => q.eq("isDefault", true))
    .collect();
  for (const doc of current) if (doc._id !== except) await ctx.db.patch(doc._id, { isDefault: false, updatedAt: Date.now() });
}

function assertName(name: string) {
  if (!name.trim()) throw new Error("name: informe o nome do modelo");
}

export function contractTemplatesFunctions(rt: RubricaRuntime) {
  const target = (id: string, name?: string) => ({ type: "contract_template", id, label: name });

  async function load(ctx: MutationCtx, id: Id<"contractTemplates">) {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Modelo de contrato não encontrado");
    return doc;
  }

  return {
    /** Modelos (vazio com o plugin desligado). O padrão vem primeiro. */
    list: query({
      args: {},
      handler: async (ctx) => {
        await guard(ctx, rt, "proposals");
        if (!(await isPluginOn(ctx, rt, "contract-templates"))) return [];
        const docs = await ctx.db.query("contractTemplates").collect();
        return docs.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
      },
    }),

    get: query({
      args: { id: v.id("contractTemplates") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "proposals", ...PLUGINS);
        return ctx.db.get(args.id);
      },
    }),

    getDefault: query({
      args: {},
      handler: async (ctx) => {
        await guard(ctx, rt, "proposals", ...PLUGINS);
        return ctx.db
          .query("contractTemplates")
          .withIndex("by_is_default", (q) => q.eq("isDefault", true))
          .first();
      },
    }),

    create: mutation({
      args: { name: v.string(), description: v.optional(v.string()), content: v.string(), isDefault: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "contracts", ...PLUGINS);
        assertName(args.name);
        const now = Date.now();
        // O primeiro modelo vira o padrão.
        const isDefault = args.isDefault ?? !(await ctx.db.query("contractTemplates").first());
        if (isDefault) await clearDefault(ctx);
        const id = await ctx.db.insert("contractTemplates", {
          name: args.name.trim(),
          description: args.description,
          content: args.content,
          isDefault,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        });
        await logUserAction(ctx, userId, "admin.create", target(id, args.name));
        return id;
      },
    }),

    /**
     * Editar não muda propostas já aceitas: o contrato delas fica congelado no aceite.
     * As abertas passam a mostrar o texto novo.
     */
    update: mutation({
      args: { id: v.id("contractTemplates"), name: v.optional(v.string()), description: v.optional(v.string()), content: v.optional(v.string()) },
      handler: async (ctx, { id, ...fields }) => {
        const { userId } = await guard(ctx, rt, "contracts", ...PLUGINS);
        const doc = await load(ctx, id);
        if (fields.name !== undefined) assertName(fields.name);
        const patch = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
        await ctx.db.patch(id, { ...patch, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "admin.update", target(id, doc.name), { fields: Object.keys(patch) });
        return null;
      },
    }),

    /** Propostas abertas que usavam o modelo passam a usar o padrão. */
    remove: mutation({
      args: { id: v.id("contractTemplates") },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "contracts", ...PLUGINS);
        const doc = await load(ctx, args.id);
        await ctx.db.delete(args.id);
        await logUserAction(ctx, userId, "admin.delete", target(args.id, doc.name));
        return null;
      },
    }),

    setDefault: mutation({
      args: { id: v.id("contractTemplates") },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "contracts", ...PLUGINS);
        const doc = await load(ctx, args.id);
        await clearDefault(ctx, args.id);
        await ctx.db.patch(args.id, { isDefault: true, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "admin.update", target(args.id, doc.name), { action: "set_default" });
        return null;
      },
    }),

    /** Cria o modelo padrão quando não há nenhum (setup do CLI). */
    seedDefault: internalMutation({
      args: {},
      handler: async (ctx) => {
        if (await ctx.db.query("contractTemplates").first()) return null;
        const now = Date.now();
        return ctx.db.insert("contractTemplates", {
          name: "Contrato padrão",
          description: "Modelo padrão de contrato de prestação de serviços",
          content: DEFAULT_CONTRACT_TEMPLATE,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        });
      },
    }),
  };
}
