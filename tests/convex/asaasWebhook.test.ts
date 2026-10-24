import { describe, it, expect, vi } from "vitest";
import { handleAsaasWebhook } from "../../convex/lib/asaasWebhook";

function call(overrides: Partial<Parameters<typeof handleAsaasWebhook>[0]> = {}) {
  const markPaid = vi.fn().mockResolvedValue(undefined);
  const markRefunded = vi.fn().mockResolvedValue(undefined);
  const result = handleAsaasWebhook({
    expectedToken: "segredo",
    receivedToken: "segredo",
    body: JSON.stringify({ event: "PAYMENT_CONFIRMED", payment: { id: "pay_1", externalReference: "link1", value: 100, installment: null } }),
    markPaid,
    markRefunded,
    ...overrides,
  });
  return { result, markPaid, markRefunded };
}

describe("webhook do Asaas", () => {
  it("sem ASAAS_WEBHOOK_TOKEN configurado: 500", async () => {
    const { result, markPaid } = call({ expectedToken: undefined });
    expect((await result).status).toBe(500);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("token ausente ou errado: 401 e nada muda", async () => {
    for (const receivedToken of [null, "", "outro"]) {
      const { result, markPaid } = call({ receivedToken });
      expect((await result).status).toBe(401);
      expect(markPaid).not.toHaveBeenCalled();
    }
  });

  it("JSON inválido: 400", async () => {
    expect((await call({ body: "{" }).result).status).toBe(400);
  });

  it("PAYMENT_CONFIRMED e PAYMENT_RECEIVED marcam como pago com os dados da cobrança", async () => {
    for (const event of ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]) {
      const { result, markPaid } = call({
        body: JSON.stringify({ event, payment: { id: "pay_1", externalReference: "link1", value: 100, installment: "ins_1" } }),
      });
      expect((await result).status).toBe(200);
      expect(markPaid).toHaveBeenCalledWith({ uniqueLink: "link1", event, paymentId: "pay_1", installmentId: "ins_1", value: 100 });
    }
  });

  it("estorno e chargeback vão para markRefunded", async () => {
    for (const event of ["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]) {
      const { result, markPaid, markRefunded } = call({
        body: JSON.stringify({ event, payment: { id: "pay_1", externalReference: "link1" } }),
      });
      expect((await result).status).toBe(200);
      expect(markRefunded).toHaveBeenCalledWith(expect.objectContaining({ uniqueLink: "link1", event }));
      expect(markPaid).not.toHaveBeenCalled();
    }
  });

  it("outros eventos ou sem externalReference: 200 sem fazer nada (o Asaas não pausa a fila)", async () => {
    for (const body of [
      JSON.stringify({ event: "PAYMENT_CREATED", payment: { id: "p", externalReference: "link1" } }),
      JSON.stringify({ event: "PAYMENT_CONFIRMED", payment: { id: "p" } }),
    ]) {
      const { result, markPaid, markRefunded } = call({ body });
      expect((await result).status).toBe(200);
      expect(markPaid).not.toHaveBeenCalled();
      expect(markRefunded).not.toHaveBeenCalled();
    }
  });
});
