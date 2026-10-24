import { v } from 'convex/values';
import { action, internalMutation, internalQuery, mutation, query, type ActionCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { requireRole } from './auth';
import { escapeTgHtml } from './lib/security';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';
import { installmentPlan, maxInstallmentsFor } from './lib/installments';
import { MIN_CHARGE_VALUE, isIsoDate } from './lib/asaasClient';
import { paymentError } from './asaas';

/** Cobranças que um mesmo link pode gerar (trocas de forma, QR code novo). Limite contra abuso. */
export const MAX_CHARGE_ATTEMPTS = 8;
/** Tempo máximo de uma geração de cobrança; depois disso a trava é ignorada. */
const PAYMENT_LOCK_MS = 60_000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const statusValidator = v.union(
  v.literal('pending'),
  v.literal('payment_selected'),
  v.literal('payment_confirmed'),
  v.literal('paid'),
  v.literal('expired'),
  v.literal('failed'),
  v.literal('refunded'),
);

const billingTypeValidator = v.union(v.literal('PIX'), v.literal('BOLETO'), v.literal('CREDIT_CARD'));

const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export const getByLink = query({
  args: { uniqueLink: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'payments'))) return null;
    const doc = await ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
    if (!doc || doc.deletedAt !== undefined) return null;
    // Dados pessoais e campos internos não vão para o navegador.
    const {
      customerCpfCnpj: _cpf,
      customerMobilePhone: _phone,
      customerPhone: _phone2,
      customerCompany: _company,
      customerId: _customerId,
      paymentLockUntil: _lock,
      chargeAttempts: _attempts,
      deletedBy: _deletedBy,
      ...safe
    } = doc;
    return safe;
  },
});

export const _getById = internalQuery({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listAdmin = query({
  args: {
    status: v.optional(statusValidator),
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const all = args.status
      ? await ctx.db
          .query('checkouts')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .order('desc')
          .take(200)
      : await ctx.db.query('checkouts').order('desc').take(200);
    const filtered = args.includeDeleted ? all : all.filter((c) => c.deletedAt === undefined);
    return filtered.slice(0, args.limit ?? 50);
  },
});

export const create = mutation({
  args: {
    uniqueLink: v.string(),
    /** Cliente já cadastrado no Asaas (evita criar um duplicado no pagamento). */
    customerId: v.optional(v.string()),
    customerName: v.string(),
    customerEmail: v.string(),
    customerCpfCnpj: v.string(),
    customerMobilePhone: v.optional(v.string()),
    customerCompany: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    value: v.number(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    /** Restringe o checkout a uma forma de pagamento. */
    billingType: v.optional(billingTypeValidator),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root', 'admin']);

    if (!Number.isFinite(args.value) || args.value < MIN_CHARGE_VALUE) {
      throw new Error(`O valor mínimo de um checkout é ${formatBRL(MIN_CHARGE_VALUE)}.`);
    }
    if (Math.round(args.value * 100) !== args.value * 100) {
      throw new Error('Use no máximo 2 casas decimais no valor.');
    }
    if (!isIsoDate(args.dueDate)) throw new Error('Vencimento inválido: use AAAA-MM-DD.');
    if (args.uniqueLink.length < 16) throw new Error('Link de checkout curto demais.');

    const existing = await ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
    if (existing) throw new Error('Link already in use');

    const now = Date.now();
    const id = await ctx.db.insert('checkouts', {
      ...args,
      status: 'pending',
      expiresAt: args.expiresAt ?? now + THIRTY_DAYS_MS,
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'admin.create',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: id,
      metadata: { label: args.description ?? args.uniqueLink, customerName: args.customerName },
      success: true,
    });

    return id;
  },
});

// ---- Geração da cobrança (checkout público) ----------------------------------

function assertPayable(checkout: Doc<'checkouts'> | null, now: number): asserts checkout is Doc<'checkouts'> {
  if (!checkout || checkout.deletedAt !== undefined) throw paymentError('NOT_FOUND', 'Checkout não encontrado.');
  if (checkout.status === 'paid' || checkout.status === 'refunded') {
    throw paymentError('ALREADY_PAID', 'Este checkout já foi pago.');
  }
  if (checkout.status === 'expired' || checkout.expiresAt < now) {
    throw paymentError('EXPIRED', 'Este checkout expirou.');
  }
}

/**
 * Trava o checkout para uma geração de cobrança. Mutations do Convex são transacionais:
 * duas chamadas simultâneas não passam as duas por aqui, então não sobra cobrança órfã.
 */
export const _claimPayment = internalMutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'payments'))) throw paymentError('NOT_FOUND', 'Checkout não encontrado.');
    const checkout = await ctx.db.get(args.id);
    const now = Date.now();
    assertPayable(checkout, now);
    if (checkout.paymentLockUntil && checkout.paymentLockUntil > now) {
      throw paymentError('IN_PROGRESS', 'O pagamento já está sendo gerado. Aguarde alguns segundos.');
    }
    await ctx.db.patch(args.id, { paymentLockUntil: now + PAYMENT_LOCK_MS });
    return checkout;
  },
});

export const _releasePayment = internalMutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    if (await ctx.db.get(args.id)) await ctx.db.patch(args.id, { paymentLockUntil: undefined });
  },
});

/** Grava o cliente do Asaas assim que é criado, para não criar outro se a cobrança falhar. */
export const _setCustomerId = internalMutation({
  args: { id: v.id('checkouts'), customerId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { customerId: args.customerId });
  },
});

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

/** A cobrança anterior foi cancelada no Asaas: o checkout não pode mais apontar para ela. */
export const _clearCharge = internalMutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    const checkout = await ctx.db.get(args.id);
    if (!checkout || checkout.status === 'paid') return;
    await ctx.db.patch(args.id, { ...CHARGE_FIELDS_CLEARED, status: 'pending', updatedAt: Date.now() });
  },
});

/** Grava a cobrança nova. Recusa se o checkout deixou de ser pagável no meio do caminho. */
export const _patchGatewayData = internalMutation({
  args: {
    id: v.id('checkouts'),
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
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const checkout = await ctx.db.get(id);
    if (!checkout) throw new Error('Checkout not found');
    assertPayable(checkout, Date.now());
    await ctx.db.patch(id, {
      ...CHARGE_FIELDS_CLEARED,
      ...fields,
      status: 'payment_selected',
      chargeAttempts: (checkout.chargeAttempts ?? 0) + 1,
      paymentLockUntil: undefined,
      updatedAt: Date.now(),
    });
  },
});

export interface PaymentInstructions {
  status: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  pixPayload?: string;
  pixImage?: string;
  pixExpiresAt?: number;
  bankSlipUrl?: string;
  bankSlipLine?: string;
  invoiceUrl?: string;
  totalValue: number;
  installmentCount?: number;
}

function siteUrl(): string | undefined {
  const url = process.env.SITE_URL?.trim().replace(/\/+$/, '');
  return url && /^https:\/\//.test(url) ? url : undefined;
}

function storedInstructions(checkout: Doc<'checkouts'>, billingType: PaymentInstructions['billingType']): PaymentInstructions {
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

/**
 * Gera a cobrança no Asaas para a forma de pagamento escolhida e devolve as instruções
 * (QR code PIX, boleto ou página de pagamento do cartão). Não confirma pagamento:
 * isso só acontece quando o webhook do Asaas avisa (markPaidByLink).
 */
export const initiatePayment = action({
  args: {
    id: v.id('checkouts'),
    billingType: billingTypeValidator,
    installmentCount: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<PaymentInstructions> => {
    const checkout = await ctx.runMutation(internal.checkouts._claimPayment, { id: args.id });
    try {
      return await generateCharge(ctx, checkout, args);
    } finally {
      await ctx.runMutation(internal.checkouts._releasePayment, { id: args.id });
    }
  },
});


async function generateCharge(
  ctx: ActionCtx,
  checkout: Doc<'checkouts'>,
  args: { id: Id<'checkouts'>; billingType: PaymentInstructions['billingType']; installmentCount?: number },
): Promise<PaymentInstructions> {
  if (checkout.billingType && checkout.billingType !== args.billingType) {
    throw paymentError('METHOD_NOT_ALLOWED', 'Esta forma de pagamento não está disponível para este checkout.');
  }

  const card = args.billingType === 'CREDIT_CARD';
  const count = card ? (args.installmentCount ?? 1) : 1;
  if (card && (!Number.isInteger(count) || count < 1 || count > maxInstallmentsFor(checkout.value))) {
    throw paymentError('INVALID_INSTALLMENTS', `Escolha de 1 a ${maxInstallmentsFor(checkout.value)} parcelas.`);
  }
  const plan = card ? installmentPlan(checkout.value, count) : undefined;
  const method = args.billingType.toLowerCase();

  // Mesma forma (e mesmas parcelas) e a cobrança ainda vale: devolve a já criada.
  const pixExpired =
    checkout.paymentMethod === 'pix' && checkout.pixExpirationDate !== undefined && checkout.pixExpirationDate < Date.now();
  if (
    checkout.asaasChargeId &&
    checkout.paymentMethod === method &&
    (!card || (checkout.installmentCount ?? 1) === count) &&
    !pixExpired
  ) {
    return storedInstructions(checkout, args.billingType);
  }

  if (checkout.asaasChargeId && checkout.paymentMethod === 'boleto') {
    // Um boleto pago leva até 3 dias úteis para aparecer: cancelar agora poderia
    // fazer o cliente pagar duas vezes.
    throw paymentError(
      'BOLETO_ISSUED',
      'Já existe um boleto para este checkout. Se você já pagou, aguarde a compensação; se não, pague o boleto ou peça um novo link.',
    );
  }

  if ((checkout.chargeAttempts ?? 0) >= MAX_CHARGE_ATTEMPTS) {
    throw paymentError('TOO_MANY_ATTEMPTS', 'Limite de tentativas atingido para este link. Peça um novo link a quem cobrou.');
  }

  // Trocou de forma (ou o QR code venceu): cancela a cobrança anterior antes de criar outra.
  if (checkout.asaasChargeId) {
    try {
      await ctx.runAction(internal.asaas.deleteCharge, {
        chargeId: checkout.asaasChargeId,
        installmentId: checkout.asaasInstallmentId,
      });
    } catch {
      throw paymentError(
        'SWITCH_FAILED',
        'Não foi possível trocar a forma de pagamento agora. Se você já pagou, aguarde a confirmação.',
      );
    }
    await ctx.runMutation(internal.checkouts._clearCharge, { id: args.id });
  }

  let customerId = checkout.customerId;
  if (!customerId) {
    customerId = (
      await ctx.runAction(internal.asaas.createCustomer, {
        name: checkout.customerName,
        email: checkout.customerEmail,
        cpfCnpj: checkout.customerCpfCnpj,
        phone: checkout.customerMobilePhone,
        externalReference: checkout.uniqueLink,
      })
    ).customerId;
    await ctx.runMutation(internal.checkouts._setCustomerId, { id: args.id, customerId });
  }

  const totalValue = plan?.totalValue ?? checkout.value;
  const base = siteUrl();
  const charge = await ctx.runAction(internal.asaas.createCharge, {
    customerId,
    value: totalValue,
    description: checkout.description ?? `Pagamento ${checkout.uniqueLink}`,
    billingType: args.billingType,
    dueDate: checkout.dueDate,
    externalReference: checkout.uniqueLink,
    installmentCount: plan?.count,
    successUrl: card && base ? `${base}/payment-success/${checkout.uniqueLink}` : undefined,
  });

  try {
    await ctx.runMutation(internal.checkouts._patchGatewayData, {
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
    // O checkout deixou de ser pagável (expirou, foi pago ou apagado) enquanto a
    // cobrança era criada: ela não pode ficar aberta no Asaas.
    await ctx.runAction(internal.asaas.deleteCharge, { chargeId: charge.chargeId, installmentId: charge.installmentId }).catch(() => {});
    throw err;
  }

  return {
    status: 'payment_selected',
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

// ---- Admin ----------------------------------------------------------------------

export const remove = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    if (checkout.status === 'paid') throw new Error('Cannot delete paid checkout');

    await softDeleteDoc(ctx, 'checkouts', args.id, userId);
    // Link apagado não pode continuar recebendo. Boleto fica: pode estar compensando.
    if (checkout.asaasChargeId && checkout.paymentMethod !== 'boleto') {
      await ctx.scheduler.runAfter(0, internal.asaas.deleteCharge, {
        chargeId: checkout.asaasChargeId,
        installmentId: checkout.asaasInstallmentId,
      });
    }
    await logAudit(ctx, {
      eventType: 'admin.delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName, softDelete: true },
      success: true,
    });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    if (checkout.status === 'paid') throw new Error('Cannot delete paid checkout');
    await ctx.db.delete(args.id);
    await logAudit(ctx, {
      eventType: 'admin.permanent_delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName },
      success: true,
    });
  },
});

export const restore = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    await restoreDoc(ctx, 'checkouts', args.id);
    await logAudit(ctx, {
      eventType: 'admin.restore',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName },
      success: true,
    });
  },
});

// ---- Webhook ----------------------------------------------------------------------

async function findByLink(ctx: { db: any }, uniqueLink: string): Promise<Doc<'checkouts'> | null> {
  return ctx.db
    .query('checkouts')
    .withIndex('by_uniqueLink', (q: any) => q.eq('uniqueLink', uniqueLink))
    .unique();
}

/** A confirmação é da cobrança atual deste checkout? */
function matchesCurrentCharge(checkout: Doc<'checkouts'>, paymentId?: string, installmentId?: string): boolean {
  if (!checkout.asaasChargeId) return false;
  if (paymentId && paymentId === checkout.asaasChargeId) return true;
  return Boolean(installmentId && checkout.asaasInstallmentId && installmentId === checkout.asaasInstallmentId);
}

/** Chamado pelo webhook do Asaas (PAYMENT_CONFIRMED / PAYMENT_RECEIVED). */
export const markPaidByLink = internalMutation({
  args: {
    uniqueLink: v.string(),
    paymentId: v.optional(v.string()),
    installmentId: v.optional(v.string()),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checkout = await findByLink(ctx, args.uniqueLink);
    if (!checkout) return;

    if (checkout.status === 'paid' || checkout.status === 'refunded') {
      // Parcelas seguintes do mesmo parcelamento chegam aqui; não são pagamento extra.
      const sameInstallment = args.installmentId && args.installmentId === checkout.asaasInstallmentId;
      if (!sameInstallment && args.paymentId && args.paymentId !== checkout.paidChargeId) {
        await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
          message: `⚠️ <b>Pagamento extra recebido</b> em um checkout que já estava pago.\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nCobrança: <code>${escapeTgHtml(args.paymentId)}</code>\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>\n\nConfira no Asaas e estorne se for o caso.`,
        });
      }
      return;
    }

    // Dinheiro recebido vale mesmo em link vencido, apagado ou com outra cobrança;
    // nesses casos o aviso pede conferência.
    const warnings: string[] = [];
    if (!matchesCurrentCharge(checkout, args.paymentId, args.installmentId)) warnings.push('a cobrança paga não é a atual deste link');
    if (checkout.deletedAt !== undefined) warnings.push('o link estava apagado');
    if (checkout.status === 'expired') warnings.push('o link estava vencido');
    const expected = checkout.installmentCount && checkout.installmentCount > 1 ? checkout.installmentValue : (checkout.totalValue ?? checkout.value);
    if (args.value !== undefined && expected !== undefined && args.value + 0.01 < expected) {
      warnings.push(`valor recebido (${formatBRL(args.value)}) menor que o esperado (${formatBRL(expected)})`);
    }

    const now = Date.now();
    await ctx.db.patch(checkout._id, {
      status: 'paid',
      paidChargeId: args.paymentId,
      paidValue: args.value,
      completedAt: now,
      updatedAt: now,
    });

    const total = checkout.totalValue ?? checkout.value;
    const installments = checkout.installmentCount && checkout.installmentCount > 1 ? ` em ${checkout.installmentCount}x` : '';
    await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
      message:
        `💰 <b>Pagamento confirmado!</b>\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nEmail: ${escapeTgHtml(checkout.customerEmail)}\nValor: ${formatBRL(total)}${installments}\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>` +
        (warnings.length ? `\n\n⚠️ Confira: ${escapeTgHtml(warnings.join('; '))}.` : ''),
    });
  },
});

/** Chamado pelo webhook do Asaas em estornos e chargebacks. */
export const markRefundedByLink = internalMutation({
  args: {
    uniqueLink: v.string(),
    paymentId: v.optional(v.string()),
    installmentId: v.optional(v.string()),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const checkout = await findByLink(ctx, args.uniqueLink);
    if (!checkout || checkout.status !== 'paid') return;
    const isPaidCharge =
      (args.paymentId && args.paymentId === checkout.paidChargeId) ||
      (args.installmentId && args.installmentId === checkout.asaasInstallmentId) ||
      matchesCurrentCharge(checkout, args.paymentId, args.installmentId);
    if (!isPaidCharge) return;

    const now = Date.now();
    await ctx.db.patch(checkout._id, { status: 'refunded', refundedAt: now, updatedAt: now });
    const label = args.event.includes('CHARGEBACK') ? 'Chargeback aberto' : 'Pagamento estornado';
    await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
      message: `↩️ <b>${label}</b>\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>\nEvento: ${escapeTgHtml(args.event)}`,
    });
  },
});

// ---- Cron -------------------------------------------------------------------------

export const expireOldCheckouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    for (const status of ['pending', 'payment_selected'] as const) {
      const expired = await ctx.db
        .query('checkouts')
        .withIndex('by_status_and_expiresAt', (q) => q.eq('status', status).lt('expiresAt', now))
        .take(500);

      for (const checkout of expired) {
        await ctx.db.patch(checkout._id, { status: 'expired', updatedAt: now });
        // Cancela a cobrança no Asaas para o link vencido não poder mais ser pago.
        // Boleto fica: pode ter sido pago e ainda estar compensando (até 3 dias úteis).
        if (checkout.asaasChargeId && checkout.paymentMethod !== 'boleto') {
          await ctx.scheduler.runAfter(0, internal.asaas.deleteCharge, {
            chargeId: checkout.asaasChargeId,
            installmentId: checkout.asaasInstallmentId,
          });
        }
      }
    }
  },
});
