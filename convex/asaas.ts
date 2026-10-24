import { ConvexError, v } from 'convex/values';
import { action, internalAction, type ActionCtx } from './_generated/server';
import { api, internal } from './_generated/api';
import { AsaasError, asaasRequest, effectiveDueDate, onlyDigits } from './lib/asaasClient';

/**
 * Integração com o Asaas (PIX, boleto e cartão).
 *
 * - Ações internas: usadas pelo checkout público (checkouts.initiatePayment).
 * - Ações do admin: listar/criar/excluir clientes e cobranças e listar notas fiscais,
 *   restritas a root/admin e ao plugin "payments".
 *
 * O pagamento só é considerado feito quando o webhook do Asaas confirma
 * (http.ts → /webhooks/asaas → checkouts.markPaidByLink).
 */

interface AsaasPayment {
  id: string;
  status: string;
  installment?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
}

export type PaymentErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_PAID'
  | 'EXPIRED'
  | 'IN_PROGRESS'
  | 'METHOD_NOT_ALLOWED'
  | 'INVALID_INSTALLMENTS'
  | 'BOLETO_ISSUED'
  | 'TOO_MANY_ATTEMPTS'
  | 'SWITCH_FAILED'
  | 'NOT_CONFIGURED'
  | 'GATEWAY';

/**
 * Erro com código e mensagem que chegam ao navegador. Em produção, o Convex troca a
 * mensagem de um Error comum por "Server Error"; a de um ConvexError chega inteira.
 */
export function paymentError(code: PaymentErrorCode, message: string): ConvexError<{ code: PaymentErrorCode; message: string }> {
  return new ConvexError({ code, message });
}

/** Repassa os erros do Asaas (ex.: "CPF inválido") como ConvexError. */
async function gateway<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AsaasError) {
      throw paymentError(err.codes.includes('not_configured') ? 'NOT_CONFIGURED' : 'GATEWAY', err.message);
    }
    throw err;
  }
}

interface AsaasList<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

const billingType = v.union(v.literal('PIX'), v.literal('BOLETO'), v.literal('CREDIT_CARD'));

// ---- Checkout público (internas) ---------------------------------------------

export const createCustomer = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    cpfCnpj: v.string(),
    phone: v.optional(v.string()),
    externalReference: v.optional(v.string()),
  },
  handler: (_ctx, args): Promise<{ customerId: string }> =>
    gateway(async () => {
      const customer = await asaasRequest<{ id: string }>('POST', '/customers', {
        name: args.name,
        email: args.email || undefined,
        cpfCnpj: onlyDigits(args.cpfCnpj),
        mobilePhone: onlyDigits(args.phone),
        externalReference: args.externalReference,
        // O checkout já mostra PIX/boleto/cartão; os avisos do Asaas seriam duplicados.
        notificationDisabled: true,
      });
      return { customerId: customer.id };
    }),
});

export interface CreatedCharge {
  chargeId: string;
  installmentId?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  bankSlipLine?: string;
  pixPayload?: string;
  pixImage?: string;
  pixExpiresAt?: number;
}

export const createCharge = internalAction({
  args: {
    customerId: v.string(),
    value: v.number(),
    description: v.string(),
    billingType,
    dueDate: v.string(),
    externalReference: v.string(),
    installmentCount: v.optional(v.number()),
    successUrl: v.optional(v.string()),
  },
  handler: (_ctx, args): Promise<CreatedCharge> =>
    gateway(async () => {
      const card = args.billingType === 'CREDIT_CARD';
      const installments = card && args.installmentCount && args.installmentCount > 1 ? args.installmentCount : undefined;

      const body = {
        customer: args.customerId,
        billingType: args.billingType,
        // Parcelado: o Asaas divide o total entre as parcelas.
        ...(installments ? { installmentCount: installments, totalValue: args.value } : { value: args.value }),
        dueDate: effectiveDueDate(args.dueDate),
        description: args.description.slice(0, 500),
        externalReference: args.externalReference,
      };

      // Retorno ao site depois do cartão. O Asaas exige que a URL seja do domínio
      // cadastrado na conta; se recusar, cria sem o retorno em vez de falhar.
      let payment: AsaasPayment;
      if (card && args.successUrl) {
        try {
          payment = await asaasRequest<AsaasPayment>('POST', '/payments', {
            ...body,
            callback: { successUrl: args.successUrl, autoRedirect: true },
          });
        } catch (err) {
          if (!(err instanceof AsaasError) || err.status === 0) throw err;
          console.warn('[asaas] callback.successUrl recusada, criando sem retorno:', err.message);
          payment = await asaasRequest<AsaasPayment>('POST', '/payments', body);
        }
      } else {
        payment = await asaasRequest<AsaasPayment>('POST', '/payments', body);
      }

      const result: CreatedCharge = {
        chargeId: payment.id,
        installmentId: payment.installment ?? undefined,
        invoiceUrl: payment.invoiceUrl ?? undefined,
        bankSlipUrl: payment.bankSlipUrl ?? undefined,
      };

      if (args.billingType === 'PIX') {
        const pix = await asaasRequest<{ encodedImage: string; payload: string; expirationDate?: string }>(
          'GET',
          `/payments/${payment.id}/pixQrCode`,
        );
        result.pixPayload = pix.payload;
        result.pixImage = pix.encodedImage;
        result.pixExpiresAt = parseAsaasDateTime(pix.expirationDate);
      }

      if (args.billingType === 'BOLETO') {
        const slip = await asaasRequest<{ identificationField?: string }>(
          'GET',
          `/payments/${payment.id}/identificationField`,
        );
        result.bankSlipLine = slip.identificationField;
      }

      return result;
    }),
});

/** O Asaas devolve "AAAA-MM-DD HH:MM:SS" no horário de Brasília, sem fuso. */
export function parseAsaasDateTime(raw: string | undefined): number | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value.replace(' ', 'T') : `${value.replace(' ', 'T')}-03:00`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * Remove a cobrança no Asaas (o cliente trocou a forma de pagamento, o link venceu ou
 * foi apagado). Parcelado: remove o parcelamento inteiro, senão as parcelas 2..N ficariam
 * abertas. Já removida (404) conta como sucesso.
 */
export const deleteCharge = internalAction({
  args: { chargeId: v.string(), installmentId: v.optional(v.string()) },
  handler: (_ctx, args): Promise<void> =>
    gateway(async () => {
      const path = args.installmentId
        ? `/installments/${encodeURIComponent(args.installmentId)}`
        : `/payments/${encodeURIComponent(args.chargeId)}`;
      try {
        await asaasRequest('DELETE', path);
      } catch (err) {
        if (err instanceof AsaasError && err.status === 404) return;
        throw err;
      }
    }),
});

// ---- Admin ---------------------------------------------------------------------

/** asaasRequest com os erros do Asaas repassados ao admin. */
function req<T = Record<string, unknown>>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  return gateway(() => asaasRequest<T>(method, path, body));
}

async function requireAdmin(ctx: ActionCtx): Promise<string> {
  const enabled = await ctx.runQuery(api.plugins.checkPlugin, { pluginId: 'payments' });
  if (!enabled) throw new Error('PLUGIN_DISABLED:payments');
  const { userId } = await ctx.runQuery(internal.auth.requireRoleQuery, { allowedRoles: ['root', 'admin'] });
  return userId;
}

function listQuery(limit?: number, offset?: number): string {
  const l = Math.min(Math.max(Math.trunc(limit ?? 100), 1), 100);
  const o = Math.max(Math.trunc(offset ?? 0), 0);
  return `limit=${l}&offset=${o}`;
}

export const listCustomers = action({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
    await requireAdmin(ctx);
    return req('GET', `/customers?${listQuery(args.limit, args.offset)}`);
  },
});

export const adminCreateCustomer = action({
  args: {
    name: v.string(),
    cpfCnpj: v.string(),
    email: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const userId = await requireAdmin(ctx);
    const customer = await req<Record<string, unknown> & { id: string }>('POST', '/customers', {
      name: args.name,
      cpfCnpj: onlyDigits(args.cpfCnpj),
      email: args.email || undefined,
      mobilePhone: onlyDigits(args.mobilePhone),
      phone: onlyDigits(args.phone),
      company: args.company || undefined,
    });
    await ctx.runMutation(internal.audit.logFromAction, {
      eventType: 'admin.create',
      actorId: userId,
      targetType: 'asaas_customer',
      targetId: customer.id,
      metadata: { label: args.name },
      success: true,
    });
    return customer;
  },
});

export const adminDeleteCustomer = action({
  args: { customerId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const userId = await requireAdmin(ctx);
    await req('DELETE', `/customers/${encodeURIComponent(args.customerId)}`);
    await ctx.runMutation(internal.audit.logFromAction, {
      eventType: 'admin.delete',
      actorId: userId,
      targetType: 'asaas_customer',
      targetId: args.customerId,
      success: true,
    });
  },
});

export const listCharges = action({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
    await requireAdmin(ctx);
    return req('GET', `/payments?${listQuery(args.limit, args.offset)}`);
  },
});

export const getCharge = action({
  args: { chargeId: v.string() },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    await requireAdmin(ctx);
    return req('GET', `/payments/${encodeURIComponent(args.chargeId)}`);
  },
});

export const adminCreateCharge = action({
  args: {
    customer: v.string(),
    billingType: v.union(billingType, v.literal('UNDEFINED')),
    value: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const userId = await requireAdmin(ctx);
    if (!(args.value > 0)) throw new Error('Informe um valor maior que zero.');
    const charge = await req<Record<string, unknown> & { id: string }>('POST', '/payments', {
      customer: args.customer,
      billingType: args.billingType,
      value: args.value,
      dueDate: args.dueDate,
      description: args.description?.slice(0, 500) || undefined,
    });
    await ctx.runMutation(internal.audit.logFromAction, {
      eventType: 'admin.create',
      actorId: userId,
      targetType: 'asaas_charge',
      targetId: charge.id,
      metadata: { label: args.description ?? charge.id, value: args.value },
      success: true,
    });
    return charge;
  },
});

export const cancelCharge = action({
  args: { chargeId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const userId = await requireAdmin(ctx);
    await req('DELETE', `/payments/${encodeURIComponent(args.chargeId)}`);
    await ctx.runMutation(internal.audit.logFromAction, {
      eventType: 'admin.delete',
      actorId: userId,
      targetType: 'asaas_charge',
      targetId: args.chargeId,
      success: true,
    });
  },
});

export const listInvoices = action({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
    await requireAdmin(ctx);
    return req('GET', `/invoices?${listQuery(args.limit, args.offset)}`);
  },
});
