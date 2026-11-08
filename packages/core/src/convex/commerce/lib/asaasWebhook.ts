/**
 * Webhook do Asaas (POST /webhooks/asaas), separado da rota para ser testável (port da v1).
 *
 * - Autenticação: header `asaas-access-token` igual a ASAAS_WEBHOOK_TOKEN.
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED → marca o checkout como pago.
 * - Estorno e chargeback → marca como estornado e avisa.
 * - Demais eventos: 200 sem fazer nada (o Asaas pausa a fila se receber erros seguidos).
 * - O `id` do evento (`evt_...`) vai junto para a idempotência: o Asaas reenvia o
 *   mesmo evento quando não recebe 200 a tempo.
 */
import { timingSafeEqual } from "./security";

export const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
export const REFUND_EVENTS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_PARTIALLY_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
]);

export interface WebhookPayment {
  uniqueLink: string;
  eventId?: string;
  paymentId?: string;
  installmentId?: string;
  value?: number;
  event: string;
}

export interface WebhookDeps {
  expectedToken: string | undefined;
  receivedToken: string | null;
  body: string;
  markPaid: (payment: WebhookPayment) => Promise<void>;
  markRefunded: (payment: WebhookPayment) => Promise<void>;
  /** Token errado (para registrar e limitar tentativas). */
  onUnauthorized?: () => Promise<void>;
}

export async function handleAsaasWebhook(deps: WebhookDeps): Promise<{ status: number; body: string }> {
  if (!deps.expectedToken) return { status: 500, body: "ASAAS_WEBHOOK_TOKEN not configured" };
  if (!timingSafeEqual(deps.receivedToken ?? "", deps.expectedToken)) {
    await deps.onUnauthorized?.();
    return { status: 401, body: "Unauthorized" };
  }

  let event: { id?: unknown; event?: unknown; payment?: Record<string, unknown> };
  try {
    event = JSON.parse(deps.body);
  } catch {
    return { status: 400, body: "Invalid JSON" };
  }
  if (!event || typeof event !== "object") return { status: 400, body: "Invalid JSON" };

  const name = typeof event.event === "string" ? event.event : "";
  const payment = event.payment && typeof event.payment === "object" ? event.payment : {};
  const uniqueLink = typeof payment["externalReference"] === "string" ? payment["externalReference"] : "";
  if (!uniqueLink || (!PAID_EVENTS.has(name) && !REFUND_EVENTS.has(name))) {
    return { status: 200, body: "ignored" };
  }

  const data: WebhookPayment = {
    uniqueLink,
    event: name,
    eventId: typeof event.id === "string" && event.id ? event.id : undefined,
    paymentId: typeof payment["id"] === "string" ? payment["id"] : undefined,
    installmentId: typeof payment["installment"] === "string" ? payment["installment"] : undefined,
    value: typeof payment["value"] === "number" ? payment["value"] : undefined,
  };

  if (PAID_EVENTS.has(name)) await deps.markPaid(data);
  else await deps.markRefunded(data);
  return { status: 200, body: "ok" };
}
