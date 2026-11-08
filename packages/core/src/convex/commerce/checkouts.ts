/**
 * Checkouts e links de pagamento (plugin `payments`, port da v1 + planos).
 *
 * Papéis: tudo do painel é `checkouts` (root, admin, comercial). O proposal-editor
 * não tem acesso (decisão 18). Restaurar e apagar de vez: root.
 *
 * Dois tipos de link em `/checkout/<uniqueLink>`:
 * - **checkout**: criado no painel para um cliente (dados do pagador já preenchidos);
 * - **link de plano**: um plano da coleção `plans` com preço vira um link reutilizável
 *   (`linkPlan`), e o botão do plano (`cta`) passa a apontar para ele. O visitante
 *   informa os dados (`POST /api/checkout/start`) e ganha um checkout próprio, com o
 *   preço do plano naquele momento.
 *
 * O pagamento só conta como feito quando o webhook do Asaas confirma (`markPaidByLink`),
 * com idempotência pelo id do evento (`paymentEvents`) e pelo estado do checkout.
 */
import { v } from "convex/values";
import { logUserAction } from "../audit";
import { requireRole } from "../auth";
import { anyText } from "../lib/text";
import { getSettingsDoc, isPluginOn } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { action, internalMutation, internalQuery, mutation, query, ref, type ActionCtx, type Doc, type Id, type MutationCtx, type ReaderCtx } from "../server";
import type { CreatedCharge } from "./asaas";
import { originsOf } from "./commerce";
import { MIN_CHARGE_VALUE, isIsoDate, onlyDigits, todayInSaoPaulo } from "./lib/asaasClient";
import { installmentPlan, maxInstallmentsFor } from "./lib/installments";
import { escapeTgHtml, isEmail, randomId } from "./lib/security";
import { commerceError, formatBRL, guard, normalizeEmailAddress, notifyAdmin } from "./shared";
import { customerFields, vBillingType, vCheckoutStatus } from "./validators";

/** Cobranças que um mesmo checkout pode gerar (trocas de forma, QR code novo). Limite contra abuso. */
export const MAX_CHARGE_ATTEMPTS = 8;
/** Tempo máximo de uma geração de cobrança; depois disso a trava é ignorada. */
const PAYMENT_LOCK_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CHECKOUT_TTL_MS = 30 * DAY_MS;
/** Checkout aberto por um visitante num link de plano. */
const PLAN_CHECKOUT_TTL_MS = 7 * DAY_MS;
const PLAN_DUE_DAYS = 3;
/** Eventos do webhook guardados para a idempotência. */
const PAYMENT_EVENT_TTL_MS = 90 * DAY_MS;
/** Planos que viram link: pagamento único (assinatura recorrente não é suportada). */
const ONE_TIME_PERIODS = new Set([undefined, "once", "project"]);

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export interface PaymentInstructions {
  status: string;
  billingType: BillingType;
  pixPayload?: string;
  pixImage?: string;
  pixExpiresAt?: number;
  bankSlipUrl?: string;
  bankSlipLine?: string;
  invoiceUrl?: string;
  totalValue: number;
  installmentCount?: number;
}

export const checkoutHref = (uniqueLink: string) => `/checkout/${uniqueLink}`;

/** Rótulo do botão do plano quando ele ainda não tem um. */
const CTA_LABELS: Record<string, string> = { pt: "Contratar", en: "Get started", es: "Contratar" };

function defaultCtaLabel(locales: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of locales) out[locale] = CTA_LABELS[locale.split("-")[0]!.toLowerCase()] ?? CTA_LABELS.en!;
  return out;
}

function assertValue(value: number) {
  if (!Number.isFinite(value) || value < MIN_CHARGE_VALUE) throw new Error(`O valor mínimo de um checkout é ${formatBRL(MIN_CHARGE_VALUE)}.`);
  if (Math.round(value * 100) !== value * 100) throw new Error("Use no máximo 2 casas decimais no valor.");
}

/** CPF (11 dígitos) ou CNPJ (14). A validação completa é do Asaas. */
function cpfCnpjDigits(value: string): string | null {
  const digits = onlyDigits(value);
  return digits && (digits.length === 11 || digits.length === 14) ? digits : null;
}

function addDaysInSaoPaulo(days: number, now = Date.now()): string {
  return todayInSaoPaulo(new Date(now + days * DAY_MS));
}

async function byLink(ctx: ReaderCtx, uniqueLink: string) {
  return ctx.db
    .query("checkouts")
    .withIndex("by_uniqueLink", (q) => q.eq("uniqueLink", uniqueLink))
    .unique();
}

async function linkByUnique(ctx: ReaderCtx, uniqueLink: string) {
  return ctx.db
    .query("paymentLinks")
    .withIndex("by_uniqueLink", (q) => q.eq("uniqueLink", uniqueLink))
    .unique();
}

async function freeLink(ctx: ReaderCtx): Promise<string> {
  for (;;) {
    const candidate = randomId(24);
    if (!(await byLink(ctx, candidate)) && !(await linkByUnique(ctx, candidate))) return candidate;
  }
}

/** Plano que pode ser cobrado: publicado, fora da lixeira, com preço em reais e pagamento único. */
function payablePlan(plan: Doc<"plans"> | null): plan is Doc<"plans"> & { priceCents: number } {
  return (
    !!plan &&
    plan.published &&
    plan.deletedAt === undefined &&
    typeof plan.priceCents === "number" &&
    plan.priceCents >= MIN_CHARGE_VALUE * 100 &&
    (plan.currency === undefined || plan.currency.toUpperCase() === "BRL") &&
    ONE_TIME_PERIODS.has(plan.period)
  );
}

function assertPayable(checkout: Doc<"checkouts"> | null, now: number): asserts checkout is Doc<"checkouts"> {
  if (!checkout || checkout.deletedAt !== undefined) throw commerceError("NOT_FOUND", "Checkout não encontrado.");
  if (checkout.status === "paid" || checkout.status === "refunded") throw commerceError("ALREADY_PAID", "Este checkout já foi pago.");
  if (checkout.status === "expired" || checkout.expiresAt < now) throw commerceError("EXPIRED", "Este checkout expirou.");
}

/** A confirmação é da cobrança atual deste checkout? */
function matchesCurrentCharge(checkout: Doc<"checkouts">, paymentId?: string, installmentId?: string): boolean {
  if (!checkout.asaasChargeId) return false;
  if (paymentId && paymentId === checkout.asaasChargeId) return true;
  return Boolean(installmentId && checkout.asaasInstallmentId && installmentId === checkout.asaasInstallmentId);
}

const CHARGE_FIELDS_CLEARED = {
  asaasChargeId: undefined,
  asaasInstallmentId: undefined,
  paymentMethod: undefined,
  pixQrCode: undefined,
  pixQrCodeImage: undefined,
  pixExpirationDate: undefined,
  bankSlipUrl: undefined,
  bankSlipLine: undefined,
  invoiceUrl: undefined,
  installmentCount: undefined,
  installmentValue: undefined,
  installmentInterestRate: undefined,
  installmentInterestAmount: undefined,
  totalValue: undefined,
} as const;

function storedInstructions(checkout: Doc<"checkouts">, billingType: BillingType): PaymentInstructions {
  return {
    status: checkout.status,
    billingType,
    pixPayload: checkout.pixQrCode,
    pixImage: checkout.pixQrCodeImage,
    pixExpiresAt: checkout.pixExpirationDate,
    bankSlipUrl: checkout.bankSlipUrl,
    bankSlipLine: checkout.bankSlipLine,
    invoiceUrl: checkout.invoiceUrl,
    totalValue: checkout.totalValue ?? checkout.value,
    installmentCount: checkout.installmentCount,
  };
}

/** Recebe paymentEvent já visto? Grava o novo. */
async function seenEvent(ctx: MutationCtx, eventId: string | undefined, event: string, uniqueLink: string): Promise<boolean> {
  if (!eventId) return false;
  const existing = await ctx.db
    .query("paymentEvents")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
    .first();
  if (existing) return true;
  const now = Date.now();
  await ctx.db.insert("paymentEvents", { provider: "asaas", eventId, event, uniqueLink, createdAt: now, expiresAt: now + PAYMENT_EVENT_TTL_MS });
  return false;
}

const refs = {
  claimPayment: ref<"mutation", { id: Id<"checkouts"> }, { checkout: Doc<"checkouts">; siteUrl: string | null }>("mutation", "checkouts", "claimPayment"),
  releasePayment: ref<"mutation", { id: Id<"checkouts"> }>("mutation", "checkouts", "releasePayment"),
  setCustomerId: ref<"mutation", { id: Id<"checkouts">; customerId: string }>("mutation", "checkouts", "setCustomerId"),
  clearCharge: ref<"mutation", { id: Id<"checkouts"> }>("mutation", "checkouts", "clearCharge"),
  patchGatewayData: ref<"mutation">("mutation", "checkouts", "patchGatewayData"),
  createCustomer: ref<"action", Record<string, unknown>, { customerId: string }>("action", "asaas", "createCustomer"),
  createCharge: ref<"action", Record<string, unknown>, CreatedCharge>("action", "asaas", "createCharge"),
  deleteCharge: ref<"action", { chargeId: string; installmentId?: string }>("action", "asaas", "deleteCharge"),
};

async function generateCharge(
  ctx: ActionCtx,
  checkout: Doc<"checkouts">,
  siteUrl: string | null,
  args: { id: Id<"checkouts">; billingType: BillingType; installmentCount?: number },
): Promise<PaymentInstructions> {
  if (checkout.billingType && checkout.billingType !== args.billingType) {
    throw commerceError("METHOD_NOT_ALLOWED", "Esta forma de pagamento não está disponível para este checkout.");
  }
  const card = args.billingType === "CREDIT_CARD";
  const count = card ? (args.installmentCount ?? 1) : 1;
  const max = maxInstallmentsFor(checkout.value);
  if (card && (!Number.isInteger(count) || count < 1 || count > max)) {
    throw commerceError("INVALID_INSTALLMENTS", `Escolha de 1 a ${max} parcelas.`);
  }
  const plan = card ? installmentPlan(checkout.value, count) : undefined;
  const method = args.billingType.toLowerCase();

  // Mesma forma (e mesmas parcelas) e a cobrança ainda vale: devolve a já criada.
  const pixExpired = checkout.paymentMethod === "pix" && checkout.pixExpirationDate !== undefined && checkout.pixExpirationDate < Date.now();
  if (checkout.asaasChargeId && checkout.paymentMethod === method && (!card || (checkout.installmentCount ?? 1) === count) && !pixExpired) {
    return storedInstructions(checkout, args.billingType);
  }
  if (checkout.asaasChargeId && checkout.paymentMethod === "boleto") {
    // Um boleto pago leva até 3 dias úteis para aparecer: cancelar agora poderia fazer o cliente pagar duas vezes.
    throw commerceError(
      "BOLETO_ISSUED",
      "Já existe um boleto para este checkout. Se você já pagou, aguarde a compensação; se não, pague o boleto ou peça um novo link.",
    );
  }
  if ((checkout.chargeAttempts ?? 0) >= MAX_CHARGE_ATTEMPTS) {
    throw commerceError("TOO_MANY_ATTEMPTS", "Limite de tentativas atingido para este link. Peça um novo link a quem cobrou.");
  }

  // Trocou de forma (ou o QR code venceu): cancela a cobrança anterior antes de criar outra.
  if (checkout.asaasChargeId) {
    try {
      await ctx.runAction(refs.deleteCharge, { chargeId: checkout.asaasChargeId, installmentId: checkout.asaasInstallmentId });
    } catch {
      throw commerceError("SWITCH_FAILED", "Não foi possível trocar a forma de pagamento agora. Se você já pagou, aguarde a confirmação.");
    }
    await ctx.runMutation(refs.clearCharge, { id: args.id });
  }

  let customerId = checkout.customerId;
  if (!customerId) {
    customerId = (
      await ctx.runAction(refs.createCustomer, {
        name: checkout.customerName,
        email: checkout.customerEmail,
        cpfCnpj: checkout.customerCpfCnpj,
        phone: checkout.customerMobilePhone,
        externalReference: checkout.uniqueLink,
      })
    ).customerId;
    await ctx.runMutation(refs.setCustomerId, { id: args.id, customerId });
  }

  const totalValue = plan?.totalValue ?? checkout.value;
  const charge = await ctx.runAction(refs.createCharge, {
    customerId,
    value: totalValue,
    description: checkout.description ?? `Pagamento ${checkout.uniqueLink}`,
    billingType: args.billingType,
    dueDate: checkout.dueDate,
    externalReference: checkout.uniqueLink,
    installmentCount: plan?.count,
    successUrl: card && siteUrl ? `${siteUrl}/payment-success/${checkout.uniqueLink}` : undefined,
  });

  try {
    await ctx.runMutation(refs.patchGatewayData, {
      id: args.id,
      paymentMethod: method,
      customerId,
      asaasChargeId: charge.chargeId,
      asaasInstallmentId: charge.installmentId,
      pixQrCode: charge.pixPayload,
      pixQrCodeImage: charge.pixImage,
      pixExpirationDate: charge.pixExpiresAt,
      bankSlipUrl: charge.bankSlipUrl,
      bankSlipLine: charge.bankSlipLine,
      invoiceUrl: charge.invoiceUrl,
      ...(plan
        ? {
            installmentCount: plan.count,
            installmentValue: plan.value,
            installmentInterestRate: plan.interestRate,
            installmentInterestAmount: plan.interestAmount,
            totalValue: plan.totalValue,
          }
        : { totalValue }),
    });
  } catch (err) {
    // O checkout deixou de ser pagável (expirou, foi pago ou apagado) enquanto a cobrança era criada.
    await ctx.runAction(refs.deleteCharge, { chargeId: charge.chargeId, installmentId: charge.installmentId }).catch(() => {});
    throw err;
  }

  return {
    status: "payment_selected",
    billingType: args.billingType,
    pixPayload: charge.pixPayload,
    pixImage: charge.pixImage,
    pixExpiresAt: charge.pixExpiresAt,
    bankSlipUrl: charge.bankSlipUrl,
    bankSlipLine: charge.bankSlipLine,
    invoiceUrl: charge.invoiceUrl,
    totalValue,
    installmentCount: plan?.count,
  };
}

/** Checkout sem dados pessoais nem campos internos, para a página pública. */
function publicCheckout(doc: Doc<"checkouts">) {
  const {
    customerCpfCnpj: _cpf,
    customerMobilePhone: _phone,
    customerPhone: _phone2,
    customerCompany: _company,
    customerId: _customerId,
    paymentLockUntil: _lock,
    chargeAttempts: _attempts,
    deletedBy: _deletedBy,
    createdBy: _createdBy,
    ...safe
  } = doc;
  return { kind: "checkout" as const, ...safe };
}

export function checkoutsFunctions(rt: RubricaRuntime) {
  const target = (doc: Doc<"checkouts">) => ({ type: "checkout", id: doc._id, label: doc.description ?? doc.uniqueLink });

  async function load(ctx: MutationCtx, id: Id<"checkouts">) {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Checkout não encontrado");
    return doc;
  }

  async function cancelOpenCharge(ctx: MutationCtx, checkout: Doc<"checkouts">) {
    // Boleto fica: pode ter sido pago e ainda estar compensando (até 3 dias úteis).
    if (checkout.asaasChargeId && checkout.paymentMethod !== "boleto") {
      await ctx.scheduler.runAfter(0, refs.deleteCharge, { chargeId: checkout.asaasChargeId, installmentId: checkout.asaasInstallmentId });
    }
  }

  return {
    // ── Painel ─────────────────────────────────────────────────────────────

    list: query({
      args: { status: v.optional(vCheckoutStatus), limit: v.optional(v.number()), includeDeleted: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "checkouts", "payments");
        const docs = args.status
          ? await ctx.db
              .query("checkouts")
              .withIndex("by_status", (q) => q.eq("status", args.status!))
              .order("desc")
              .take(500)
          : await ctx.db.query("checkouts").order("desc").take(500);
        return docs.filter((c) => args.includeDeleted || c.deletedAt === undefined).slice(0, Math.min(args.limit ?? 50, 500));
      },
    }),

    get: query({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        await guard(ctx, rt, "checkouts", "payments");
        return ctx.db.get(args.id);
      },
    }),

    create: mutation({
      args: {
        /** Sem link, gera um aleatório. */
        uniqueLink: v.optional(v.string()),
        /** Cliente já cadastrado no Asaas (evita criar um duplicado no pagamento). */
        customerId: v.optional(v.string()),
        ...customerFields,
        value: v.number(),
        description: v.optional(v.string()),
        dueDate: v.string(),
        /** Restringe o checkout a uma forma de pagamento. */
        billingType: v.optional(vBillingType),
        expiresAt: v.optional(v.number()),
        proposalId: v.optional(v.id("proposals")),
      },
      handler: async (ctx, args): Promise<Id<"checkouts">> => {
        const { userId } = await guard(ctx, rt, "checkouts", "payments");
        assertValue(args.value);
        if (!isIsoDate(args.dueDate)) throw new Error("Vencimento inválido: use AAAA-MM-DD.");
        const customerEmail = normalizeEmailAddress(args.customerEmail);
        if (!isEmail(customerEmail)) throw new Error("E-mail do cliente inválido.");
        if (!args.customerName.trim()) throw new Error("Informe o nome do cliente.");
        if (args.uniqueLink !== undefined) {
          if (!/^[A-Za-z0-9_-]{16,64}$/.test(args.uniqueLink)) throw new Error("Link de checkout inválido: use de 16 a 64 letras, números, - ou _.");
          if ((await byLink(ctx, args.uniqueLink)) || (await linkByUnique(ctx, args.uniqueLink))) throw new Error("Link já está em uso");
        }
        if (args.proposalId && !(await ctx.db.get(args.proposalId))) throw new Error("Proposta não encontrada");
        const uniqueLink = args.uniqueLink ?? (await freeLink(ctx));
        const now = Date.now();
        const id = await ctx.db.insert("checkouts", {
          ...args,
          uniqueLink,
          customerName: args.customerName.trim(),
          customerEmail,
          status: "pending",
          expiresAt: args.expiresAt ?? now + CHECKOUT_TTL_MS,
          createdAt: now,
          createdBy: userId,
        });
        await logUserAction(ctx, userId, "admin.create", { type: "checkout", id, label: args.description ?? uniqueLink });
        return id;
      },
    }),

    remove: mutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "checkouts", "payments");
        const checkout = await load(ctx, args.id);
        if (checkout.status === "paid") throw new Error("Checkout pago não pode ser apagado");
        await ctx.db.patch(args.id, { deletedAt: Date.now(), deletedBy: userId });
        // Link apagado não pode continuar recebendo.
        await cancelOpenCharge(ctx, checkout);
        await logUserAction(ctx, userId, "admin.delete", target(checkout), { softDelete: true });
        return null;
      },
    }),

    restore: mutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const checkout = await load(ctx, args.id);
        await ctx.db.patch(args.id, { deletedAt: undefined, deletedBy: undefined });
        await logUserAction(ctx, userId, "admin.restore", target(checkout));
        return null;
      },
    }),

    removePermanently: mutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const checkout = await load(ctx, args.id);
        if (checkout.status === "paid") throw new Error("Checkout pago não pode ser apagado");
        await ctx.db.delete(args.id);
        await logUserAction(ctx, userId, "admin.permanent_delete", target(checkout));
        return null;
      },
    }),

    // ── Planos → link de pagamento ─────────────────────────────────────────

    /**
     * Cria (ou reativa) o link de pagamento de um plano e aponta o botão do plano para
     * ele. O plano precisa estar publicado, ter preço em reais (mínimo R$ 5) e ser de
     * pagamento único (período `once`, `project` ou sem período).
     */
    linkPlan: mutation({
      args: { planId: v.id("plans"), billingType: v.optional(vBillingType) },
      handler: async (ctx, args): Promise<{ uniqueLink: string; href: string }> => {
        const { userId } = await guard(ctx, rt, "checkouts", "payments", "pricing");
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.deletedAt !== undefined) throw new Error("Plano não encontrado");
        if (!payablePlan({ ...plan, published: true })) {
          throw new Error(
            `O plano precisa de preço em reais (mínimo ${formatBRL(MIN_CHARGE_VALUE)}) e pagamento único para virar link de pagamento.`,
          );
        }
        const now = Date.now();
        const existing = await ctx.db
          .query("paymentLinks")
          .withIndex("by_planId", (q) => q.eq("planId", args.planId))
          .first();
        let uniqueLink: string;
        if (existing) {
          uniqueLink = existing.uniqueLink;
          await ctx.db.patch(existing._id, { active: true, billingType: args.billingType, updatedAt: now });
        } else {
          uniqueLink = await freeLink(ctx);
          await ctx.db.insert("paymentLinks", { uniqueLink, planId: args.planId, billingType: args.billingType, active: true, createdAt: now, createdBy: userId });
        }
        const href = checkoutHref(uniqueLink);
        const locales = (await getSettingsDoc(ctx))?.locales.locales ?? ["pt-BR"];
        await ctx.db.patch(args.planId, { cta: { label: plan.cta?.label ?? defaultCtaLabel(locales), href }, updatedAt: now, updatedBy: userId });
        await logUserAction(ctx, userId, "admin.update", { type: "plans", id: args.planId, label: anyText(plan.name) }, { action: "payment_link", uniqueLink });
        return { uniqueLink, href };
      },
    }),

    /** Desativa o link do plano e tira o botão, se ele apontava para o link. */
    unlinkPlan: mutation({
      args: { planId: v.id("plans") },
      handler: async (ctx, args) => {
        const { userId } = await guard(ctx, rt, "checkouts", "payments");
        const link = await ctx.db
          .query("paymentLinks")
          .withIndex("by_planId", (q) => q.eq("planId", args.planId))
          .first();
        if (!link) return null;
        const now = Date.now();
        await ctx.db.patch(link._id, { active: false, updatedAt: now });
        const plan = await ctx.db.get(args.planId);
        if (plan?.cta?.href === checkoutHref(link.uniqueLink)) await ctx.db.patch(args.planId, { cta: undefined, updatedAt: now, updatedBy: userId });
        await logUserAction(ctx, userId, "admin.update", { type: "plans", id: args.planId, label: plan ? anyText(plan.name) : undefined }, { action: "payment_link_removed" });
        return null;
      },
    }),

    listLinks: query({
      args: {},
      handler: async (ctx) => {
        await guard(ctx, rt, "checkouts", "payments");
        return ctx.db.query("paymentLinks").order("desc").collect();
      },
    }),

    // ── Página pública ─────────────────────────────────────────────────────

    /**
     * O que a página `/checkout/<uniqueLink>` mostra: um checkout (`kind: "checkout"`,
     * sem os dados pessoais) ou um link de plano (`kind: "plan"`, para o visitante
     * informar os dados). `null` se não existe ou não está disponível.
     */
    getByLink: query({
      args: { uniqueLink: v.string() },
      handler: async (ctx, args) => {
        if (!(await isPluginOn(ctx, rt, "payments"))) return null;
        const doc = await byLink(ctx, args.uniqueLink);
        if (doc) return doc.deletedAt === undefined ? publicCheckout(doc) : null;
        const link = await linkByUnique(ctx, args.uniqueLink);
        if (!link?.active || !(await isPluginOn(ctx, rt, "pricing"))) return null;
        const plan = await ctx.db.get(link.planId);
        if (!payablePlan(plan)) return null;
        return {
          kind: "plan" as const,
          uniqueLink: link.uniqueLink,
          value: plan.priceCents / 100,
          billingType: link.billingType,
          plan: { name: plan.name, description: plan.description, features: plan.features, priceLabel: plan.priceLabel, period: plan.period },
        };
      },
    }),

    /** Gera a cobrança da forma escolhida e devolve as instruções (QR code, boleto, página do cartão). */
    initiatePayment: action({
      args: { id: v.id("checkouts"), billingType: vBillingType, installmentCount: v.optional(v.number()) },
      handler: async (ctx, args): Promise<PaymentInstructions> => {
        const { checkout, siteUrl } = await ctx.runMutation(refs.claimPayment, { id: args.id });
        try {
          return await generateCharge(ctx, checkout, siteUrl, args);
        } finally {
          await ctx.runMutation(refs.releasePayment, { id: args.id });
        }
      },
    }),

    // ── Internas ───────────────────────────────────────────────────────────

    /** Visitante num link de plano (via `POST /api/checkout/start`): cria o checkout dele. */
    startFromLink: internalMutation({
      args: {
        uniqueLink: v.string(),
        customerName: v.string(),
        customerEmail: v.string(),
        customerCpfCnpj: v.string(),
        customerMobilePhone: v.optional(v.string()),
        customerCompany: v.optional(v.string()),
      },
      handler: async (ctx, args): Promise<{ uniqueLink: string }> => {
        const unavailable = commerceError("NOT_FOUND", "Este link de pagamento não está disponível.");
        if (!(await isPluginOn(ctx, rt, "payments")) || !(await isPluginOn(ctx, rt, "pricing"))) throw unavailable;
        const link = await linkByUnique(ctx, args.uniqueLink);
        if (!link?.active) throw unavailable;
        const plan = await ctx.db.get(link.planId);
        if (!payablePlan(plan)) throw unavailable;

        const customerName = args.customerName.trim().slice(0, 200);
        const customerEmail = normalizeEmailAddress(args.customerEmail).slice(0, 254);
        const cpfCnpj = cpfCnpjDigits(args.customerCpfCnpj);
        if (!customerName) throw commerceError("INVALID_INPUT", "Informe o nome.");
        if (!isEmail(customerEmail)) throw commerceError("INVALID_INPUT", "E-mail inválido.");
        if (!cpfCnpj) throw commerceError("INVALID_INPUT", "CPF ou CNPJ inválido.");

        const settings = await getSettingsDoc(ctx);
        const now = Date.now();
        const uniqueLink = await freeLink(ctx);
        await ctx.db.insert("checkouts", {
          uniqueLink,
          customerName,
          customerEmail,
          customerCpfCnpj: cpfCnpj,
          customerMobilePhone: onlyDigits(args.customerMobilePhone)?.slice(0, 20),
          customerCompany: args.customerCompany?.trim().slice(0, 200) || undefined,
          value: plan.priceCents / 100,
          description: anyText(plan.name, settings?.locales.default).slice(0, 500),
          dueDate: addDaysInSaoPaulo(PLAN_DUE_DAYS, now),
          billingType: link.billingType,
          status: "pending",
          paymentLinkId: link._id,
          planId: plan._id,
          expiresAt: now + PLAN_CHECKOUT_TTL_MS,
          createdAt: now,
        });
        return { uniqueLink };
      },
    }),

    getById: internalQuery({
      args: { id: v.id("checkouts") },
      handler: (ctx, args) => ctx.db.get(args.id),
    }),

    /**
     * Trava o checkout para uma geração de cobrança. Mutations são transacionais: duas
     * chamadas ao mesmo tempo não passam as duas por aqui, então não sobra cobrança órfã.
     */
    claimPayment: internalMutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        if (!(await isPluginOn(ctx, rt, "payments"))) throw commerceError("NOT_FOUND", "Checkout não encontrado.");
        const checkout = await ctx.db.get(args.id);
        const now = Date.now();
        assertPayable(checkout, now);
        if (checkout.paymentLockUntil && checkout.paymentLockUntil > now) {
          throw commerceError("IN_PROGRESS", "O pagamento já está sendo gerado. Aguarde alguns segundos.");
        }
        await ctx.db.patch(args.id, { paymentLockUntil: now + PAYMENT_LOCK_MS });
        const settings = await getSettingsDoc(ctx);
        const site = originsOf(process.env.SITE_URL)[0] ?? originsOf(settings?.url)[0] ?? null;
        return { checkout, siteUrl: site && site.startsWith("https://") ? site : null };
      },
    }),

    releasePayment: internalMutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        if (await ctx.db.get(args.id)) await ctx.db.patch(args.id, { paymentLockUntil: undefined });
        return null;
      },
    }),

    /** Grava o cliente do Asaas assim que é criado, para não criar outro se a cobrança falhar. */
    setCustomerId: internalMutation({
      args: { id: v.id("checkouts"), customerId: v.string() },
      handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { customerId: args.customerId });
        return null;
      },
    }),

    /** A cobrança anterior foi cancelada no Asaas: o checkout não pode mais apontar para ela. */
    clearCharge: internalMutation({
      args: { id: v.id("checkouts") },
      handler: async (ctx, args) => {
        const checkout = await ctx.db.get(args.id);
        if (!checkout || checkout.status === "paid") return null;
        await ctx.db.patch(args.id, { ...CHARGE_FIELDS_CLEARED, status: "pending", updatedAt: Date.now() });
        return null;
      },
    }),

    /** Grava a cobrança nova. Recusa se o checkout deixou de ser pagável no meio do caminho. */
    patchGatewayData: internalMutation({
      args: {
        id: v.id("checkouts"),
        paymentMethod: v.string(),
        customerId: v.optional(v.string()),
        asaasChargeId: v.optional(v.string()),
        asaasInstallmentId: v.optional(v.string()),
        pixQrCode: v.optional(v.string()),
        pixQrCodeImage: v.optional(v.string()),
        pixExpirationDate: v.optional(v.number()),
        bankSlipUrl: v.optional(v.string()),
        bankSlipLine: v.optional(v.string()),
        invoiceUrl: v.optional(v.string()),
        installmentCount: v.optional(v.number()),
        installmentValue: v.optional(v.number()),
        installmentInterestRate: v.optional(v.number()),
        installmentInterestAmount: v.optional(v.number()),
        totalValue: v.optional(v.number()),
      },
      handler: async (ctx, { id, ...fields }) => {
        const checkout = await ctx.db.get(id);
        assertPayable(checkout, Date.now());
        await ctx.db.patch(id, {
          ...CHARGE_FIELDS_CLEARED,
          ...fields,
          status: "payment_selected",
          chargeAttempts: (checkout.chargeAttempts ?? 0) + 1,
          paymentLockUntil: undefined,
          updatedAt: Date.now(),
        });
        return null;
      },
    }),

    /** Webhook (PAYMENT_CONFIRMED / PAYMENT_RECEIVED). Idempotente pelo id do evento e pelo estado. */
    markPaidByLink: internalMutation({
      args: {
        uniqueLink: v.string(),
        event: v.optional(v.string()),
        eventId: v.optional(v.string()),
        paymentId: v.optional(v.string()),
        installmentId: v.optional(v.string()),
        value: v.optional(v.number()),
      },
      handler: async (ctx, args): Promise<"paid" | "duplicate" | "already_paid" | "not_found"> => {
        if (await seenEvent(ctx, args.eventId, args.event ?? "PAYMENT_CONFIRMED", args.uniqueLink)) return "duplicate";
        const checkout = await byLink(ctx, args.uniqueLink);
        if (!checkout) return "not_found";

        if (checkout.status === "paid" || checkout.status === "refunded") {
          // Parcelas seguintes do mesmo parcelamento chegam aqui; não são pagamento extra.
          const sameInstallment = args.installmentId && args.installmentId === checkout.asaasInstallmentId;
          if (!sameInstallment && args.paymentId && args.paymentId !== checkout.paidChargeId) {
            await notifyAdmin(
              ctx,
              `⚠️ <b>Pagamento extra recebido</b> em um checkout que já estava pago.\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nCobrança: <code>${escapeTgHtml(args.paymentId)}</code>\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>\n\nConfira no Asaas e estorne se for o caso.`,
            );
          }
          return "already_paid";
        }

        // Dinheiro recebido vale mesmo em link vencido, apagado ou com outra cobrança; o aviso pede conferência.
        const warnings: string[] = [];
        if (!matchesCurrentCharge(checkout, args.paymentId, args.installmentId)) warnings.push("a cobrança paga não é a atual deste link");
        if (checkout.deletedAt !== undefined) warnings.push("o link estava apagado");
        if (checkout.status === "expired") warnings.push("o link estava vencido");
        const expected = checkout.installmentCount && checkout.installmentCount > 1 ? checkout.installmentValue : (checkout.totalValue ?? checkout.value);
        if (args.value !== undefined && expected !== undefined && args.value + 0.01 < expected) {
          warnings.push(`valor recebido (${formatBRL(args.value)}) menor que o esperado (${formatBRL(expected)})`);
        }

        const now = Date.now();
        await ctx.db.patch(checkout._id, { status: "paid", paidChargeId: args.paymentId, paidValue: args.value, completedAt: now, updatedAt: now });
        const total = checkout.totalValue ?? checkout.value;
        const installments = checkout.installmentCount && checkout.installmentCount > 1 ? ` em ${checkout.installmentCount}x` : "";
        await notifyAdmin(
          ctx,
          `💰 <b>Pagamento confirmado!</b>\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nE-mail: ${escapeTgHtml(checkout.customerEmail)}\nValor: ${formatBRL(total)}${installments}\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>` +
            (warnings.length ? `\n\n⚠️ Confira: ${escapeTgHtml(warnings.join("; "))}.` : ""),
        );
        return "paid";
      },
    }),

    /** Webhook: estornos e chargebacks. */
    markRefundedByLink: internalMutation({
      args: {
        uniqueLink: v.string(),
        event: v.string(),
        eventId: v.optional(v.string()),
        paymentId: v.optional(v.string()),
        installmentId: v.optional(v.string()),
        value: v.optional(v.number()),
      },
      handler: async (ctx, args): Promise<"refunded" | "duplicate" | "ignored"> => {
        if (await seenEvent(ctx, args.eventId, args.event, args.uniqueLink)) return "duplicate";
        const checkout = await byLink(ctx, args.uniqueLink);
        if (!checkout || checkout.status !== "paid") return "ignored";
        const isPaidCharge =
          (args.paymentId && args.paymentId === checkout.paidChargeId) ||
          (args.installmentId && args.installmentId === checkout.asaasInstallmentId) ||
          matchesCurrentCharge(checkout, args.paymentId, args.installmentId);
        if (!isPaidCharge) return "ignored";
        const now = Date.now();
        await ctx.db.patch(checkout._id, { status: "refunded", refundedAt: now, updatedAt: now });
        const label = args.event.includes("CHARGEBACK") ? "Chargeback aberto" : "Pagamento estornado";
        await notifyAdmin(
          ctx,
          `↩️ <b>${label}</b>\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>\nEvento: ${escapeTgHtml(args.event)}`,
        );
        return "refunded";
      },
    }),

    /** Cron de hora em hora: vence checkouts pendentes e cancela a cobrança aberta. */
    expireOldCheckouts: internalMutation({
      args: {},
      handler: async (ctx) => {
        const now = Date.now();
        let expired = 0;
        for (const status of ["pending", "payment_selected"] as const) {
          const docs = await ctx.db
            .query("checkouts")
            .withIndex("by_status_and_expiresAt", (q) => q.eq("status", status).lt("expiresAt", now))
            .take(500);
          for (const checkout of docs) {
            await ctx.db.patch(checkout._id, { status: "expired", updatedAt: now });
            await cancelOpenCharge(ctx, checkout);
            expired++;
          }
        }
        return { expired };
      },
    }),

    /** Cron diário: esquece os eventos do webhook com mais de 90 dias. */
    cleanupPaymentEvents: internalMutation({
      args: {},
      handler: async (ctx) => {
        const old = await ctx.db
          .query("paymentEvents")
          .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
          .take(500);
        for (const doc of old) await ctx.db.delete(doc._id);
        return { deleted: old.length };
      },
    }),
  };
}
