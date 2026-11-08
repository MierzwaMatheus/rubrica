/**
 * Integração com o Asaas (PIX, boleto e cartão; port da v1). Chaves em variáveis do
 * Convex: ASAAS_API_KEY (e ASAAS_ENV, opcional).
 *
 * - Internas: usadas pelo checkout público (`checkouts.initiatePayment`).
 * - Do painel: listar/criar/excluir clientes e cobranças e listar notas fiscais, com
 *   a permissão `checkouts` (root, admin, comercial) e o plugin `payments`.
 *
 * O pagamento só conta como feito quando o webhook do Asaas confirma
 * (`POST /webhooks/asaas` → `checkouts.markPaidByLink`).
 */
import { v } from "convex/values";
import type { RubricaRuntime } from "../runtime";
import { action, internalAction, ref, type ActionCtx, type Id } from "../server";
import { AsaasError, asaasRequest, effectiveDueDate, onlyDigits } from "./lib/asaasClient";
import { commerceError } from "./shared";
import { vBillingType } from "./validators";

interface AsaasPayment {
  id: string;
  status: string;
  installment?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
}

interface AsaasList<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

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

/** Repassa os erros do Asaas (ex.: "CPF inválido") como erro com código. */
async function gateway<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AsaasError) throw commerceError(err.codes.includes("not_configured") ? "NOT_CONFIGURED" : "GATEWAY", err.message);
    throw err;
  }
}

function req<T = Record<string, unknown>>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  return gateway(() => asaasRequest<T>(method, path, body));
}

/** O Asaas devolve "AAAA-MM-DD HH:MM:SS" no horário de Brasília, sem fuso. */
export function parseAsaasDateTime(raw: string | undefined): number | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value.replace(" ", "T") : `${value.replace(" ", "T")}-03:00`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? undefined : ms;
}

function listQuery(limit?: number, offset?: number): string {
  const l = Math.min(Math.max(Math.trunc(limit ?? 100), 1), 100);
  const o = Math.max(Math.trunc(offset ?? 0), 0);
  return `limit=${l}&offset=${o}`;
}

const refs = {
  access: ref<"query", { permission: string; plugins: string[] }, { userId: Id<"users">; role: string }>("query", "commerce", "access"),
  logFromAction: ref<"mutation">("mutation", "audit", "logFromAction"),
};

async function requireCheckoutsAccess(ctx: ActionCtx): Promise<Id<"users">> {
  return (await ctx.runQuery(refs.access, { permission: "checkouts", plugins: ["payments"] })).userId;
}

async function audit(ctx: ActionCtx, userId: Id<"users">, eventType: string, targetType: string, targetId: string, metadata?: Record<string, unknown>) {
  await ctx.runMutation(refs.logFromAction, { eventType, actorId: userId, targetType, targetId, metadata, success: true });
}

export function asaasFunctions(_rt: RubricaRuntime) {
  return {
    // ── Checkout público (internas) ────────────────────────────────────────

    createCustomer: internalAction({
      args: { name: v.string(), email: v.string(), cpfCnpj: v.string(), phone: v.optional(v.string()), externalReference: v.optional(v.string()) },
      handler: (_ctx, args): Promise<{ customerId: string }> =>
        gateway(async () => {
          const customer = await asaasRequest<{ id: string }>("POST", "/customers", {
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
    }),

    createCharge: internalAction({
      args: {
        customerId: v.string(),
        value: v.number(),
        description: v.string(),
        billingType: vBillingType,
        dueDate: v.string(),
        externalReference: v.string(),
        installmentCount: v.optional(v.number()),
        successUrl: v.optional(v.string()),
      },
      handler: (_ctx, args): Promise<CreatedCharge> =>
        gateway(async () => {
          const card = args.billingType === "CREDIT_CARD";
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

          // Retorno ao site depois do cartão. O Asaas exige URL do domínio cadastrado na
          // conta; se recusar, cria sem o retorno em vez de falhar.
          let payment: AsaasPayment;
          if (card && args.successUrl) {
            try {
              payment = await asaasRequest<AsaasPayment>("POST", "/payments", { ...body, callback: { successUrl: args.successUrl, autoRedirect: true } });
            } catch (err) {
              if (!(err instanceof AsaasError) || err.status === 0) throw err;
              console.warn("[asaas] callback.successUrl recusada, criando sem retorno:", err.message);
              payment = await asaasRequest<AsaasPayment>("POST", "/payments", body);
            }
          } else {
            payment = await asaasRequest<AsaasPayment>("POST", "/payments", body);
          }

          const result: CreatedCharge = {
            chargeId: payment.id,
            installmentId: payment.installment ?? undefined,
            invoiceUrl: payment.invoiceUrl ?? undefined,
            bankSlipUrl: payment.bankSlipUrl ?? undefined,
          };
          if (args.billingType === "PIX") {
            const pix = await asaasRequest<{ encodedImage: string; payload: string; expirationDate?: string }>("GET", `/payments/${payment.id}/pixQrCode`);
            result.pixPayload = pix.payload;
            result.pixImage = pix.encodedImage;
            result.pixExpiresAt = parseAsaasDateTime(pix.expirationDate);
          }
          if (args.billingType === "BOLETO") {
            const slip = await asaasRequest<{ identificationField?: string }>("GET", `/payments/${payment.id}/identificationField`);
            result.bankSlipLine = slip.identificationField;
          }
          return result;
        }),
    }),

    /**
     * Remove a cobrança (troca de forma, link vencido ou apagado). Parcelado: remove o
     * parcelamento inteiro, senão as parcelas 2..N ficariam abertas. Já removida (404)
     * conta como sucesso.
     */
    deleteCharge: internalAction({
      args: { chargeId: v.string(), installmentId: v.optional(v.string()) },
      handler: (_ctx, args): Promise<null> =>
        gateway(async () => {
          const path = args.installmentId ? `/installments/${encodeURIComponent(args.installmentId)}` : `/payments/${encodeURIComponent(args.chargeId)}`;
          try {
            await asaasRequest("DELETE", path);
          } catch (err) {
            if (err instanceof AsaasError && err.status === 404) return null;
            throw err;
          }
          return null;
        }),
    }),

    // ── Painel ─────────────────────────────────────────────────────────────

    listCustomers: action({
      args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
      handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
        await requireCheckoutsAccess(ctx);
        return req("GET", `/customers?${listQuery(args.limit, args.offset)}`);
      },
    }),

    adminCreateCustomer: action({
      args: {
        name: v.string(),
        cpfCnpj: v.string(),
        email: v.optional(v.string()),
        mobilePhone: v.optional(v.string()),
        phone: v.optional(v.string()),
        company: v.optional(v.string()),
      },
      handler: async (ctx, args): Promise<Record<string, unknown>> => {
        const userId = await requireCheckoutsAccess(ctx);
        const customer = await req<Record<string, unknown> & { id: string }>("POST", "/customers", {
          name: args.name,
          cpfCnpj: onlyDigits(args.cpfCnpj),
          email: args.email || undefined,
          mobilePhone: onlyDigits(args.mobilePhone),
          phone: onlyDigits(args.phone),
          company: args.company || undefined,
        });
        await audit(ctx, userId, "admin.create", "asaas_customer", customer.id, { label: args.name });
        return customer;
      },
    }),

    adminDeleteCustomer: action({
      args: { customerId: v.string() },
      handler: async (ctx, args): Promise<null> => {
        const userId = await requireCheckoutsAccess(ctx);
        await req("DELETE", `/customers/${encodeURIComponent(args.customerId)}`);
        await audit(ctx, userId, "admin.delete", "asaas_customer", args.customerId);
        return null;
      },
    }),

    listCharges: action({
      args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
      handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
        await requireCheckoutsAccess(ctx);
        return req("GET", `/payments?${listQuery(args.limit, args.offset)}`);
      },
    }),

    getCharge: action({
      args: { chargeId: v.string() },
      handler: async (ctx, args): Promise<Record<string, unknown>> => {
        await requireCheckoutsAccess(ctx);
        return req("GET", `/payments/${encodeURIComponent(args.chargeId)}`);
      },
    }),

    adminCreateCharge: action({
      args: {
        customer: v.string(),
        billingType: v.union(vBillingType, v.literal("UNDEFINED")),
        value: v.number(),
        dueDate: v.string(),
        description: v.optional(v.string()),
      },
      handler: async (ctx, args): Promise<Record<string, unknown>> => {
        const userId = await requireCheckoutsAccess(ctx);
        if (!(args.value > 0)) throw new Error("Informe um valor maior que zero.");
        const charge = await req<Record<string, unknown> & { id: string }>("POST", "/payments", {
          customer: args.customer,
          billingType: args.billingType,
          value: args.value,
          dueDate: args.dueDate,
          description: args.description?.slice(0, 500) || undefined,
        });
        await audit(ctx, userId, "admin.create", "asaas_charge", charge.id, { label: args.description ?? charge.id, value: args.value });
        return charge;
      },
    }),

    cancelCharge: action({
      args: { chargeId: v.string() },
      handler: async (ctx, args): Promise<null> => {
        const userId = await requireCheckoutsAccess(ctx);
        await req("DELETE", `/payments/${encodeURIComponent(args.chargeId)}`);
        await audit(ctx, userId, "admin.delete", "asaas_charge", args.chargeId);
        return null;
      },
    }),

    listInvoices: action({
      args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
      handler: async (ctx, args): Promise<AsaasList<Record<string, unknown>>> => {
        await requireCheckoutsAccess(ctx);
        return req("GET", `/invoices?${listQuery(args.limit, args.offset)}`);
      },
    }),
  };
}
