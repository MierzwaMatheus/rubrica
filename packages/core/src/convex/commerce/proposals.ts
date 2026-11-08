/**
 * Propostas comerciais (plugin `proposals`, port da v1): versões, senha, sessões,
 * aceite eletrônico com registro, desconto e brindes, link público.
 *
 * Papéis (decisão 18): `proposals` = root, admin, comercial e proposal-editor. Mandar
 * para a lixeira: root, admin e comercial. Restaurar e apagar de vez: root.
 *
 * Fluxo público (`/proposta/<slug>`):
 * 1. `getPublic` diz se a proposta pede senha. Sem sessão válida, só devolve o estado
 *    (o conteúdo fica trancado no servidor, não só escondido na página).
 * 2. `POST /api/proposal/session` (`createSession`) troca a senha por um token de 7 dias.
 * 3. `generateSignatureUploadUrl` + `POST /api/proposal/accept` (`accept`) registram o
 *    aceite com IP e navegador lidos no servidor, o conteúdo aceito e o hash dele.
 */
import { v, type Infer } from "convex/values";
import type { Localized } from "../../i18n";
import { checkRateLimit, logUserAction, logAudit, recordRateLimitAttempt, resetRateLimit } from "../audit";
import { requireRole } from "../auth";
import { cleanFields } from "../lib/clean";
import { slugify, assertValidSlug } from "../lib/slug";
import { anyText, filledLocales } from "../lib/text";
import { getSettingsDoc, isPluginOn, requirePlugin } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { internalMutation, mutation, query, type Doc, type Id, type MutationCtx, type ReaderCtx } from "../server";
import { validateDiscount } from "./lib/proposalDiscount";
import { escapeTgHtml, hashPassword, isEmail, randomId, randomToken, sha256Hex, verifyPassword } from "./lib/security";
import { clip, commerceError, formatBRL, guard, normalizeEmailAddress, notifyAdmin } from "./shared";
import { proposalContentFields } from "./validators";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Validade padrão de uma proposta nova. */
export const PROPOSAL_TTL_MS = 10 * DAY_MS;
/** Validade da sessão aberta com a senha. */
export const SESSION_TTL_MS = 7 * DAY_MS;
/** Assinatura desenhada: imagem pequena. */
export const MAX_SIGNATURE_BYTES = 1024 * 1024;
const SIGNATURE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

type Content = Infer<ReturnType<typeof v.object<typeof proposalContentFields>>>;
const CONTENT_KEYS = Object.keys(proposalContentFields) as (keyof Content)[];
/** Campos opcionais do conteúdo que podem ser apagados (`unset`). */
const UNSETTABLE = ["scopePrices", "originalValue", "giftIndexes", "templateId"] as const;

/** Mínimo para o painel criar uma senha de proposta. */
export const MIN_PROPOSAL_PASSWORD = 6;

function pickContent(doc: Doc<"proposals">): Content {
  const out: Record<string, unknown> = {};
  for (const key of CONTENT_KEYS) if (doc[key] !== undefined) out[key] = doc[key];
  return out as Content;
}

/** Normaliza os textos traduzíveis (tira idiomas vazios, recusa código inválido) e confere o essencial. */
function prepareContent<T extends Partial<Content>>(data: T, creating: boolean): T {
  const out = cleanFields(proposalContentFields, data as Record<string, unknown>) as T;
  if ((creating || out.clientName !== undefined) && !out.clientName?.trim()) throw new Error("clientName: informe o nome do cliente");
  if ((creating || out.title !== undefined) && filledLocales(out.title as Localized<string>).length === 0) {
    throw new Error("title: preencha em pelo menos um idioma");
  }
  if (out.investmentValue !== undefined && !(Number.isFinite(out.investmentValue) && out.investmentValue >= 0)) {
    throw new Error("investmentValue: valor inválido");
  }
  // Itens vazios de listas não entram.
  for (const key of ["scope", "paymentMethods", "conditions"] as const) {
    const list = out[key] as Localized<string>[] | undefined;
    if (list && list.some((item) => filledLocales(item).length === 0)) throw new Error(`${key}: há item vazio`);
  }
  return out;
}

function assertPassword(password: string) {
  if (password.length < MIN_PROPOSAL_PASSWORD) throw new Error(`A senha da proposta precisa ter pelo menos ${MIN_PROPOSAL_PASSWORD} caracteres`);
}

async function bySlug(ctx: ReaderCtx, slug: string) {
  return ctx.db
    .query("proposals")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

async function sessionByToken(ctx: ReaderCtx, token: string) {
  const tokenHash = await sha256Hex(token);
  return ctx.db
    .query("proposalSessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
}

async function sessionFor(ctx: ReaderCtx, proposalId: Id<"proposals">, token: string | undefined, now: number) {
  if (!token) return null;
  const session = await sessionByToken(ctx, token);
  if (!session || session.proposalId !== proposalId || session.expiresAt <= now) return null;
  return session;
}

/** Contrato da proposta: o congelado no aceite, senão o modelo escolhido, senão o padrão. */
async function contractText(ctx: ReaderCtx, rt: RubricaRuntime, proposal: Doc<"proposals">): Promise<string | null> {
  if (proposal.templateSnapshot !== undefined) return proposal.templateSnapshot;
  if (!(await isPluginOn(ctx, rt, "contract-templates"))) return null;
  const chosen = proposal.templateId ? await ctx.db.get(proposal.templateId) : null;
  const template =
    chosen ??
    (await ctx.db
      .query("contractTemplates")
      .withIndex("by_is_default", (q) => q.eq("isDefault", true))
      .first());
  return template?.content ?? null;
}

/** Proposta sem a senha (o painel recebe `hasPassword`). */
function forPanel(doc: Doc<"proposals">) {
  const { password, ...rest } = doc;
  return { ...rest, hasPassword: !!password };
}

export function proposalsFunctions(rt: RubricaRuntime) {
  const target = (doc: Doc<"proposals">) => ({ type: "proposal", id: doc._id, label: anyText(doc.title) });

  async function load(ctx: MutationCtx, id: Id<"proposals">) {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Proposta não encontrada");
    return doc;
  }

  async function invalidateAll(ctx: MutationCtx, proposalId: Id<"proposals">) {
    const sessions = await ctx.db
      .query("proposalSessions")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", proposalId))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);
  }

  return {
    // ── Painel ─────────────────────────────────────────────────────────────

    list: query({
      args: {
        filter: v.optional(v.union(v.literal("all"), v.literal("accepted"), v.literal("pending"))),
        limit: v.optional(v.number()),
        includeDeleted: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "proposals", "proposals");
        const docs =
          args.filter === "accepted" || args.filter === "pending"
            ? await ctx.db
                .query("proposals")
                .withIndex("by_isAccepted", (q) => q.eq("isAccepted", args.filter === "accepted"))
                .order("desc")
                .take(500)
            : await ctx.db.query("proposals").order("desc").take(500);
        return docs
          .filter((p) => args.includeDeleted || p.deletedAt === undefined)
          .slice(0, Math.min(args.limit ?? 50, 500))
          .map(forPanel);
      },
    }),

    get: query({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "proposals", "proposals");
        const doc = await ctx.db.get(args.id);
        return doc ? forPanel(doc) : null;
      },
    }),

    /** Versões anteriores (a atual é a própria proposta). */
    versions: query({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "proposals", "proposals");
        return ctx.db
          .query("proposalVersions")
          .withIndex("by_proposalId_and_version", (q) => q.eq("proposalId", args.id))
          .order("desc")
          .collect();
      },
    }),

    /** Aceite completo (com dados pessoais), para o painel. */
    getAcceptance: query({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "proposals", "proposals");
        const acceptance = await ctx.db
          .query("proposalAcceptances")
          .withIndex("by_proposalId", (q) => q.eq("proposalId", args.id))
          .order("desc")
          .first();
        if (!acceptance) return null;
        const signatureUrl = acceptance.signatureStorageId ? await ctx.storage.getUrl(acceptance.signatureStorageId) : null;
        return { ...acceptance, signatureUrl };
      },
    }),

    create: mutation({
      args: {
        ...proposalContentFields,
        /** Sem slug, gera um a partir do cliente com sufixo aleatório (o link é público). */
        slug: v.optional(v.string()),
        password: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
      },
      handler: async (ctx, args): Promise<Id<"proposals">> => {
        const { userId } = await guard(ctx, rt, "proposals", "proposals");
        const { slug: givenSlug, password, expiresAt, ...input } = args;
        const content = prepareContent(input, true);
        validateDiscount({ ...content, scopeLength: content.scope.length });
        if (content.templateId && !(await ctx.db.get(content.templateId))) throw new Error("Modelo de contrato não encontrado");

        let slug = givenSlug?.trim();
        if (slug) {
          assertValidSlug(slug);
          if (await bySlug(ctx, slug)) throw new Error(`O link "${slug}" já está em uso`);
        } else {
          do slug = `${slugify(content.clientName).slice(0, 40) || "proposta"}-${randomId(8)}`;
          while (await bySlug(ctx, slug));
        }
        if (password !== undefined) assertPassword(password);

        const now = Date.now();
        const id = await ctx.db.insert("proposals", {
          ...content,
          scopePrices: content.scopePrices?.some((p) => p !== null) ? content.scopePrices : undefined,
          giftIndexes: content.giftIndexes?.length ? content.giftIndexes : undefined,
          slug,
          password: password ? await hashPassword(password) : undefined,
          version: 1,
          isAccepted: false,
          expiresAt: expiresAt ?? now + PROPOSAL_TTL_MS,
          createdAt: now,
          createdBy: userId,
        });
        await logUserAction(ctx, userId, "admin.create", { type: "proposal", id, label: anyText(content.title) }, { clientName: content.clientName });
        return id;
      },
    }),

    /**
     * Edita a proposta (não aceita). Cada edição guarda a versão anterior em
     * `proposalVersions` e sobe o número da versão. Trocar a senha derruba as sessões.
     */
    update: mutation({
      args: {
        id: v.id("proposals"),
        patch: v.optional(v.object(proposalContentFields).partial()),
        /** Campos a apagar: `scopePrices`, `originalValue` (tira o desconto), `giftIndexes`, `templateId`. */
        unset: v.optional(v.array(v.union(...UNSETTABLE.map((k) => v.literal(k))))),
        password: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "proposals", "proposals");
        const proposal = await load(ctx, args.id);
        if (proposal.isAccepted) throw new Error("Proposta aceita não pode ser alterada");
        if (proposal.deletedAt !== undefined) throw new Error("A proposta está na lixeira");

        const patch: Partial<Content> & Record<string, unknown> = prepareContent(args.patch ?? {}, false);
        for (const key of args.unset ?? []) {
          if (key in patch) throw new Error(`O campo "${key}" está no patch e no unset`);
          patch[key] = undefined;
        }
        if (patch.scopePrices && !patch.scopePrices.some((p) => p !== null)) patch.scopePrices = undefined;
        if (patch.giftIndexes && patch.giftIndexes.length === 0) patch.giftIndexes = undefined;
        if (patch.templateId && !(await ctx.db.get(patch.templateId))) throw new Error("Modelo de contrato não encontrado");

        const next = { ...pickContent(proposal), ...patch } as Content;
        validateDiscount({ ...next, scopeLength: next.scope.length });
        if (args.password !== undefined) assertPassword(args.password);

        const now = Date.now();
        await ctx.db.insert("proposalVersions", {
          proposalId: proposal._id,
          version: proposal.version,
          content: pickContent(proposal),
          createdAt: now,
          createdBy: userId,
        });
        const templateChanged = "templateId" in patch && patch.templateId !== proposal.templateId;
        await ctx.db.patch(proposal._id, {
          ...patch,
          ...(args.password !== undefined ? { password: await hashPassword(args.password) } : {}),
          ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
          ...(templateChanged ? { templateSnapshot: undefined } : {}),
          version: proposal.version + 1,
          updatedAt: now,
          updatedBy: userId,
        });
        if (args.password !== undefined) await invalidateAll(ctx, proposal._id);
        await logUserAction(ctx, userId, "admin.update", target(proposal), { fields: Object.keys(patch), version: proposal.version + 1 });
        return null;
      },
    }),

    /** Troca ou tira a senha (sem `newPassword`, a proposta fica aberta). Derruba as sessões. */
    resetPassword: mutation({
      args: { id: v.id("proposals"), newPassword: v.optional(v.string()) },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "proposals", "proposals");
        const proposal = await load(ctx, args.id);
        if (args.newPassword !== undefined) assertPassword(args.newPassword);
        await ctx.db.patch(args.id, {
          password: args.newPassword ? await hashPassword(args.newPassword) : undefined,
          updatedAt: Date.now(),
          updatedBy: userId,
        });
        await invalidateAll(ctx, args.id);
        await logUserAction(ctx, userId, "admin.update", target(proposal), { action: "password_reset", hasPassword: !!args.newPassword });
        return null;
      },
    }),

    remove: mutation({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, ["root", "admin", "comercial"]);
        await requirePlugin(ctx, rt, "proposals");
        const proposal = await load(ctx, args.id);
        if (proposal.isAccepted) throw new Error("Proposta aceita não pode ser apagada");
        await ctx.db.patch(args.id, { deletedAt: Date.now(), deletedBy: userId });
        await invalidateAll(ctx, args.id);
        await logUserAction(ctx, userId, "admin.delete", target(proposal), { softDelete: true, clientName: proposal.clientName });
        return null;
      },
    }),

    restore: mutation({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const proposal = await load(ctx, args.id);
        await ctx.db.patch(args.id, { deletedAt: undefined, deletedBy: undefined });
        await logUserAction(ctx, userId, "admin.restore", target(proposal));
        return null;
      },
    }),

    removePermanently: mutation({
      args: { id: v.id("proposals") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const proposal = await load(ctx, args.id);
        if (proposal.isAccepted) throw new Error("Proposta aceita não pode ser apagada");
        await invalidateAll(ctx, args.id);
        const versions = await ctx.db
          .query("proposalVersions")
          .withIndex("by_proposalId_and_version", (q) => q.eq("proposalId", args.id))
          .collect();
        for (const version of versions) await ctx.db.delete(version._id);
        await ctx.db.delete(args.id);
        await logUserAction(ctx, userId, "admin.permanent_delete", target(proposal), { clientName: proposal.clientName });
        return null;
      },
    }),

    // ── Página pública ─────────────────────────────────────────────────────

    /**
     * Proposta para a página pública. Com senha e sem sessão válida, devolve só o estado
     * (`locked: true`), sem o conteúdo.
     */
    getPublic: query({
      args: { slug: v.string(), token: v.optional(v.string()) },
      handler: async (ctx, args) => {
        if (!(await isPluginOn(ctx, rt, "proposals"))) return null;
        const proposal = await bySlug(ctx, args.slug);
        if (!proposal || proposal.deletedAt !== undefined) return null;
        const now = Date.now();
        const requiresPassword = !!proposal.password;
        const hasValidSession = requiresPassword ? !!(await sessionFor(ctx, proposal._id, args.token, now)) : false;
        const status = {
          slug: proposal.slug,
          requiresPassword,
          hasValidSession,
          isExpired: proposal.expiresAt < now,
          isAccepted: proposal.isAccepted,
          expiresAt: proposal.expiresAt,
        };
        if (requiresPassword && !hasValidSession) return { ...status, locked: true as const };
        const settings = await getSettingsDoc(ctx);
        return {
          ...status,
          locked: false as const,
          ...pickContent(proposal),
          version: proposal.version,
          acceptedAt: proposal.acceptedAt,
          createdAt: proposal.createdAt,
          /** Markdown do contrato com as variáveis (`{{client_name}}`…), preenchido pela página. */
          contract: await contractText(ctx, rt, proposal),
          /** Quem contrata o serviço: dados do site (pessoa ou empresa). */
          contractor: {
            name: settings?.name ?? {},
            person: settings?.person ?? null,
            organization: settings?.organization ?? null,
          },
        };
      },
    }),

    /** A sessão ainda vale? (A página guarda o token no navegador.) */
    checkSession: query({
      args: { token: v.string() },
      handler: async (ctx, args) => {
        const session = await sessionByToken(ctx, args.token);
        if (!session || session.expiresAt <= Date.now()) return null;
        const proposal = await ctx.db.get(session.proposalId);
        if (!proposal || proposal.deletedAt !== undefined) return null;
        return { slug: proposal.slug, expiresAt: session.expiresAt };
      },
    }),

    /** URL para enviar a assinatura desenhada antes do aceite. */
    generateSignatureUploadUrl: mutation({
      args: { slug: v.string(), token: v.optional(v.string()) },
      handler: async (ctx, args) => {
        if (!(await isPluginOn(ctx, rt, "proposals"))) throw commerceError("NOT_FOUND", "Proposta não encontrada.");
        const now = Date.now();
        const proposal = await bySlug(ctx, args.slug);
        if (!proposal || proposal.deletedAt !== undefined) throw commerceError("NOT_FOUND", "Proposta não encontrada.");
        if (proposal.isAccepted) throw commerceError("ALREADY_ACCEPTED", "Esta proposta já foi aceita.");
        if (proposal.expiresAt < now) throw commerceError("EXPIRED", "Esta proposta expirou.");
        if (proposal.password) {
          const session = await sessionFor(ctx, proposal._id, args.token, now);
          if (!session || session.isUsed) throw commerceError("SESSION_REQUIRED", "Abra a proposta com a senha de novo.");
        }
        return ctx.storage.generateUploadUrl();
      },
    }),

    /** Aceite para quem aceitou (precisa do token da sessão), para baixar o contrato. */
    getAcceptanceByToken: query({
      args: { slug: v.string(), token: v.string() },
      handler: async (ctx, args) => {
        const proposal = await bySlug(ctx, args.slug);
        if (!proposal || !proposal.isAccepted) return null;
        if (!(await sessionFor(ctx, proposal._id, args.token, Date.now()))) return null;
        const acceptance = await ctx.db
          .query("proposalAcceptances")
          .withIndex("by_proposalId", (q) => q.eq("proposalId", proposal._id))
          .order("desc")
          .first();
        if (!acceptance) return null;
        const { signatureStorageId, sessionId: _session, ...rest } = acceptance;
        const signatureUrl = signatureStorageId ? await ctx.storage.getUrl(signatureStorageId) : null;
        return { ...rest, signatureUrl };
      },
    }),

    // ── Internas (rotas HTTP e cron) ───────────────────────────────────────

    /**
     * Senha → token de sessão. Não lança no erro de senha: lançar desfaria a contagem
     * de tentativas (a mutation inteira volta), e o limite nunca bloquearia.
     */
    createSession: internalMutation({
      args: { slug: v.string(), password: v.string(), ipAddress: v.optional(v.string()), userAgent: v.optional(v.string()) },
      handler: async (ctx, args): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; error: "NOT_FOUND" | "NO_PASSWORD" | "INVALID_PASSWORD" | "TOO_MANY_ATTEMPTS" }> => {
        const key = `${args.slug}:${args.ipAddress ?? "unknown"}`;
        if (!(await checkRateLimit(ctx, "proposal_password", key)).allowed) return { ok: false, error: "TOO_MANY_ATTEMPTS" };
        const proposal = (await isPluginOn(ctx, rt, "proposals")) ? await bySlug(ctx, args.slug) : null;
        if (!proposal || proposal.deletedAt !== undefined) {
          await recordRateLimitAttempt(ctx, "proposal_password", key);
          return { ok: false, error: "NOT_FOUND" };
        }
        if (!proposal.password) return { ok: false, error: "NO_PASSWORD" };
        if (!(await verifyPassword(args.password, proposal.password))) {
          await recordRateLimitAttempt(ctx, "proposal_password", key);
          await logAudit(ctx, { eventType: "proposal.password_failed", actorType: "external", targetType: "proposal", targetId: proposal._id, ipAddress: args.ipAddress, success: false });
          return { ok: false, error: "INVALID_PASSWORD" };
        }
        await resetRateLimit(ctx, "proposal_password", key);
        const token = randomToken();
        const now = Date.now();
        const expiresAt = now + SESSION_TTL_MS;
        await ctx.db.insert("proposalSessions", {
          proposalId: proposal._id,
          tokenHash: await sha256Hex(token),
          ipAddress: args.ipAddress,
          userAgent: clip(args.userAgent, 256),
          isUsed: false,
          expiresAt,
          createdAt: now,
        });
        return { ok: true, token, expiresAt };
      },
    }),

    /** Aceite eletrônico. O conteúdo aceito sai do banco, nunca do navegador. */
    accept: internalMutation({
      args: {
        slug: v.string(),
        token: v.optional(v.string()),
        clientName: v.string(),
        clientDocument: v.string(),
        clientEmail: v.string(),
        clientRole: v.optional(v.string()),
        clientDeclaration: v.optional(v.string()),
        locale: v.optional(v.string()),
        signatureStorageId: v.optional(v.id("_storage")),
        ipAddress: v.string(),
        userAgent: v.string(),
      },
      handler: async (ctx, args) => {
        if (!(await isPluginOn(ctx, rt, "proposals"))) throw commerceError("NOT_FOUND", "Proposta não encontrada.");
        const proposal = await bySlug(ctx, args.slug);
        if (!proposal || proposal.deletedAt !== undefined) throw commerceError("NOT_FOUND", "Proposta não encontrada.");
        if (proposal.isAccepted) throw commerceError("ALREADY_ACCEPTED", "Esta proposta já foi aceita.");
        const now = Date.now();
        if (proposal.expiresAt < now) throw commerceError("EXPIRED", "Esta proposta expirou.");

        const session = proposal.password ? await sessionFor(ctx, proposal._id, args.token, now) : null;
        if (proposal.password && (!session || session.isUsed)) throw commerceError("SESSION_REQUIRED", "Abra a proposta com a senha de novo.");

        const clientName = args.clientName.trim().slice(0, 200);
        const clientDocument = args.clientDocument.trim().slice(0, 40);
        const clientEmail = normalizeEmailAddress(args.clientEmail).slice(0, 254);
        if (!clientName || !clientDocument) throw commerceError("INVALID_INPUT", "Informe nome e documento.");
        if (!isEmail(clientEmail)) throw commerceError("INVALID_INPUT", "E-mail inválido.");
        const clientRole = clip(args.clientRole?.trim() || undefined, 200);
        const clientDeclaration = clip(args.clientDeclaration?.trim() || undefined, 2000);

        if (args.signatureStorageId) {
          const file = await ctx.db.system.get(args.signatureStorageId);
          if (!file) throw commerceError("INVALID_INPUT", "Assinatura não encontrada.");
          if ((file.contentType && !SIGNATURE_TYPES.has(file.contentType)) || file.size > MAX_SIGNATURE_BYTES) {
            await ctx.storage.delete(args.signatureStorageId);
            throw commerceError("INVALID_INPUT", "A assinatura precisa ser uma imagem de até 1 MB.");
          }
        }

        const contract = await contractText(ctx, rt, proposal);
        const contentSnapshot = JSON.stringify({
          proposal: {
            id: proposal._id,
            slug: proposal.slug,
            version: proposal.version,
            ...pickContent(proposal),
            contract,
          },
          acceptance: {
            clientName,
            clientDocument,
            clientEmail,
            clientRole: clientRole ?? null,
            clientDeclaration: clientDeclaration ?? null,
            locale: args.locale ?? null,
            acceptedAt: new Date(now).toISOString(),
          },
        });
        const contentHash = await sha256Hex(contentSnapshot);

        const acceptanceId = await ctx.db.insert("proposalAcceptances", {
          proposalId: proposal._id,
          proposalVersion: proposal.version,
          sessionId: session?._id,
          clientName,
          clientDocument,
          clientEmail,
          clientRole,
          clientDeclaration,
          locale: args.locale,
          contentSnapshot,
          contentSnapshotVersion: "rubrica-v2",
          contentHash,
          ipAddress: args.ipAddress,
          userAgent: args.userAgent.slice(0, 512),
          signatureStorageId: args.signatureStorageId,
          acceptedAt: now,
          createdAt: now,
        });
        await ctx.db.patch(proposal._id, {
          isAccepted: true,
          acceptedAt: now,
          updatedAt: now,
          ...(contract !== null ? { templateSnapshot: contract } : {}),
        });
        if (session) await ctx.db.patch(session._id, { isUsed: true });

        // Sem e-mail nem IP do cliente no registro de atividades (LGPD): o aceite já tem tudo.
        await logAudit(ctx, {
          eventType: "proposal.accepted",
          actorType: "external",
          targetType: "proposal",
          targetId: proposal._id,
          metadata: { version: proposal.version, contentHash, acceptanceId },
          success: true,
        });
        await notifyAdmin(
          ctx,
          `✅ <b>Proposta aceita!</b>\n\nCliente: ${escapeTgHtml(clientName)}\nE-mail: ${escapeTgHtml(clientEmail)}\nProposta: <code>${escapeTgHtml(proposal.slug)}</code>\nValor: ${formatBRL(proposal.investmentValue)}`,
        );
        return { acceptanceId, contentHash };
      },
    }),

    invalidateSessions: internalMutation({
      args: { proposalId: v.id("proposals") },
      handler: async (ctx, args) => {
        await invalidateAll(ctx, args.proposalId);
        return null;
      },
    }),

    /** Cron diário: apaga sessões vencidas. */
    cleanupExpiredSessions: internalMutation({
      args: {},
      handler: async (ctx) => {
        const expired = await ctx.db
          .query("proposalSessions")
          .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
          .take(500);
        for (const s of expired) await ctx.db.delete(s._id);
        return { deleted: expired.length };
      },
    }),
  };
}

