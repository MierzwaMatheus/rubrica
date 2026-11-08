/**
 * Depoimentos enviados pelo site (plugin `testimonials-intake`).
 *
 * Chegam por `POST /rubrica/depoimento` (`httpRoutes.ts`) e entram como pendentes.
 * Aprovar cria o item na coleção `testimonials` (texto em `{ [locale]: quote }`,
 * publicado) e guarda o vínculo; recusar apaga o envio. Permissão `content`.
 * Os destinos dos contatos (Telegram, e-mail, webhook) também avisam do envio.
 */
import { v } from "convex/values";
import { requireRole } from "./auth";
import { logAudit, logUserAction } from "./audit";
import { consumeRateLimits, deleteDeliveries, queueDeliveries } from "./contacts";
import { isPluginOn, requirePlugin } from "./plugins";
import { currentPolicyVersion } from "./privacyVersion";
import type { RubricaRuntime } from "./runtime";
import { internalMutation, mutation, query, type Doc, type Id, type MutationCtx } from "./server";

export function testimonialIntakeFunctions(rt: RubricaRuntime) {
  async function load(ctx: MutationCtx, id: Id<"testimonialSubmissions">): Promise<Doc<"testimonialSubmissions">> {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Depoimento enviado não encontrado");
    return doc;
  }

  return {
    /** Envios, do mais novo para o mais antigo. Padrão: só os pendentes. */
    list: query({
      args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"))), limit: v.optional(v.number()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, "content");
        return ctx.db
          .query("testimonialSubmissions")
          .withIndex("by_status_and_createdAt", (q) => q.eq("status", args.status ?? "pending"))
          .order("desc")
          .take(Math.min(Math.max(args.limit ?? 100, 1), 500));
      },
    }),

    /**
     * Aprova: cria o depoimento publicado na coleção, no fim da ordem. O texto vai no
     * idioma do envio (ou no `locale` informado); `quote` e `role` podem vir revisados.
     */
    approve: mutation({
      args: {
        id: v.id("testimonialSubmissions"),
        locale: v.optional(v.string()),
        quote: v.optional(v.string()),
        role: v.optional(v.string()),
        published: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "content");
        await requirePlugin(ctx, rt, "testimonials");
        const sub = await load(ctx, args.id);
        if (sub.status === "approved") throw new Error("Este depoimento já foi aprovado");
        const locale = args.locale ?? sub.locale;
        const quote = (args.quote ?? sub.quote).trim();
        if (!quote) throw new Error("O texto do depoimento está vazio");
        const role = (args.role ?? sub.role)?.trim();
        const last = await ctx.db.query("testimonials").withIndex("by_order").order("desc").first();
        const now = Date.now();
        const testimonialId = await ctx.db.insert("testimonials", {
          quote: { [locale]: quote },
          author: sub.name,
          ...(role ? { role: { [locale]: role } } : {}),
          ...(sub.company ? { company: sub.company } : {}),
          order: typeof last?.order === "number" ? last.order + 1 : 0,
          published: args.published ?? true,
          createdAt: now,
          createdBy: userId,
        });
        await ctx.db.patch(sub._id, { status: "approved", testimonialId, reviewedAt: now, reviewedBy: userId });
        await logUserAction(ctx, userId, "testimonial.approved", { type: "testimonials", id: testimonialId, label: sub.name }, { submissionId: sub._id });
        return testimonialId;
      },
    }),

    /** Recusa: apaga o envio (e os avisos dele). */
    reject: mutation({
      args: { id: v.id("testimonialSubmissions") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "content");
        const sub = await load(ctx, args.id);
        if (sub.status === "approved") throw new Error("Depoimento já aprovado: apague o item na coleção de depoimentos");
        await deleteDeliveries(ctx, "testimonial", sub._id);
        await ctx.db.delete(sub._id);
        await logUserAction(ctx, userId, "testimonial.rejected", { type: "testimonialSubmission", id: sub._id });
        return null;
      },
    }),

    // ── Interna ──────────────────────────────────────────────────────────

    submit: internalMutation({
      args: {
        name: v.string(),
        email: v.string(),
        role: v.optional(v.string()),
        company: v.optional(v.string()),
        quote: v.string(),
        locale: v.string(),
        blockId: v.string(),
        page: v.string(),
        ipHash: v.string(),
        emailHash: v.string(),
      },
      handler: async (ctx, args): Promise<{ ok: true; id: string } | { ok: false; error: "rate_limited"; retryAfter: number } | { ok: false; error: "disabled" }> => {
        if (!(await isPluginOn(ctx, rt, "testimonials-intake"))) return { ok: false, error: "disabled" };
        const retryAfter = await consumeRateLimits(ctx, [
          ["testimonial_ip", args.ipHash],
          ["testimonial_submit", args.emailHash],
        ]);
        if (retryAfter !== null) return { ok: false, error: "rate_limited", retryAfter };
        const now = Date.now();
        const { ipHash, emailHash, ...data } = args;
        void emailHash;
        const id = await ctx.db.insert("testimonialSubmissions", {
          ...data,
          status: "pending",
          consent: { acceptedAt: now, locale: data.locale, page: data.page, policyVersion: await currentPolicyVersion(ctx), ipHash },
          createdAt: now,
        });
        await logAudit(ctx, { eventType: "testimonial.submitted", actorType: "external", targetType: "testimonialSubmission", targetId: id, metadata: { page: data.page }, success: true });
        await queueDeliveries(ctx, "testimonial", id);
        return { ok: true, id };
      },
    }),
  };
}
