/**
 * Bibliotecas puras do comercial (port dos testes da v1: asaas.test.ts,
 * asaasWebhook.test.ts e lib/security.test.ts).
 */
import { describe, expect, it, vi } from "vitest";
import { asaasConfig, asaasRequest, AsaasError, effectiveDueDate, isIsoDate, onlyDigits, todayInSaoPaulo } from "../../../src/convex/commerce/lib/asaasClient";
import { installmentOptions, installmentPlan, maxInstallmentsFor } from "../../../src/convex/commerce/lib/installments";
import { handleAsaasWebhook } from "../../../src/convex/commerce/lib/asaasWebhook";
import { escapeTgHtml, hashPassword, randomId, randomToken, sha256Hex, timingSafeEqual, verifyPassword } from "../../../src/convex/commerce/lib/security";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("asaasConfig", () => {
  it("exige ASAAS_API_KEY", () => {
    expect(() => asaasConfig({})).toThrow("ASAAS_API_KEY");
  });

  it("detecta produção pelo prefixo da chave e sandbox nos demais casos", () => {
    expect(asaasConfig({ ASAAS_API_KEY: "$aact_prod_abc" }).baseUrl).toBe("https://api.asaas.com/v3");
    expect(asaasConfig({ ASAAS_API_KEY: "$aact_hmlg_abc" }).baseUrl).toBe("https://api-sandbox.asaas.com/v3");
  });

  it("ASAAS_ENV sobrepõe a detecção", () => {
    expect(asaasConfig({ ASAAS_API_KEY: "$aact_prod_abc", ASAAS_ENV: "sandbox" }).env).toBe("sandbox");
  });
});

describe("asaasRequest", () => {
  const config = { apiKey: "$aact_hmlg_k", env: "sandbox" as const, baseUrl: "https://api-sandbox.asaas.com/v3" };

  it("envia a chave no header access_token e o corpo em JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "cus_1" }));
    const result = await asaasRequest("POST", "/customers", { name: "Ana" }, { config, fetch: fetchMock });
    expect(result).toEqual({ id: "cus_1" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api-sandbox.asaas.com/v3/customers");
    expect(init.headers.access_token).toBe("$aact_hmlg_k");
    expect(JSON.parse(init.body)).toEqual({ name: "Ana" });
  });

  it("transforma os erros do Asaas em mensagem legível", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ errors: [{ code: "invalid_cpfCnpj", description: "O CPF/CNPJ informado é inválido." }] }, 400));
    const err: AsaasError = await asaasRequest<never>("POST", "/customers", {}, { config, fetch: fetchMock }).catch((e: AsaasError) => e);
    expect(err).toBeInstanceOf(AsaasError);
    expect(err.message).toBe("O CPF/CNPJ informado é inválido.");
    expect(err.codes).toEqual(["invalid_cpfCnpj"]);
  });

  it("erro de rede vira mensagem amigável", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(asaasRequest("GET", "/payments", undefined, { config, fetch: fetchMock })).rejects.toThrow("Não foi possível falar com o Asaas");
  });
});

describe("datas e dígitos", () => {
  it("usa a data de São Paulo", () => {
    expect(todayInSaoPaulo(new Date("2026-03-02T01:00:00Z"))).toBe("2026-03-01");
  });

  it("vencimento no passado vira hoje; no futuro, é mantido", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(effectiveDueDate("2026-03-01", now)).toBe("2026-03-10");
    expect(effectiveDueDate("2026-04-01", now)).toBe("2026-04-01");
  });

  it("isIsoDate e onlyDigits", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("28/02/2026")).toBe(false);
    expect(onlyDigits("123.456.789-00")).toBe("12345678900");
    expect(onlyDigits("--")).toBeUndefined();
  });
});

describe("parcelamento", () => {
  it("até 3x sem juros", () => {
    expect(installmentPlan(300, 3)).toMatchObject({ value: 100, totalValue: 300, isInterestFree: true });
  });

  it("4x a 6x: 3,49% + R$ 0,49; 7x a 12x: 3,99% + R$ 0,49", () => {
    expect(installmentPlan(1000, 4).totalValue).toBe(1035.39);
    expect(installmentPlan(1000, 12).totalValue).toBe(1040.39);
  });

  it("rejeita parcelas fora de 1 a 12", () => {
    expect(() => installmentPlan(100, 0)).toThrow();
    expect(() => installmentPlan(100, 13)).toThrow();
    expect(() => installmentPlan(100, 2.5)).toThrow();
  });

  it("lista as 12 opções quando o valor permite e não oferece parcela abaixo de R$ 5", () => {
    expect(installmentOptions(1000).map((o) => o.count)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(maxInstallmentsFor(20)).toBe(4);
    expect(installmentOptions(20).every((o) => o.value >= 5)).toBe(true);
    expect(maxInstallmentsFor(5)).toBe(1);
  });
});

describe("webhook do Asaas", () => {
  function call(overrides: Partial<Parameters<typeof handleAsaasWebhook>[0]> = {}) {
    const markPaid = vi.fn().mockResolvedValue(undefined);
    const markRefunded = vi.fn().mockResolvedValue(undefined);
    const onUnauthorized = vi.fn().mockResolvedValue(undefined);
    const result = handleAsaasWebhook({
      expectedToken: "segredo",
      receivedToken: "segredo",
      body: JSON.stringify({ id: "evt_1", event: "PAYMENT_CONFIRMED", payment: { id: "pay_1", externalReference: "link1", value: 100, installment: null } }),
      markPaid,
      markRefunded,
      onUnauthorized,
      ...overrides,
    });
    return { result, markPaid, markRefunded, onUnauthorized };
  }

  it("sem ASAAS_WEBHOOK_TOKEN configurado: 500", async () => {
    const { result, markPaid } = call({ expectedToken: undefined });
    expect((await result).status).toBe(500);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("token ausente ou errado: 401, registra a tentativa e nada muda", async () => {
    for (const receivedToken of [null, "", "outro"]) {
      const { result, markPaid, onUnauthorized } = call({ receivedToken });
      expect((await result).status).toBe(401);
      expect(markPaid).not.toHaveBeenCalled();
      expect(onUnauthorized).toHaveBeenCalledOnce();
    }
  });

  it("JSON inválido: 400", async () => {
    expect((await call({ body: "{" }).result).status).toBe(400);
    expect((await call({ body: "null" }).result).status).toBe(400);
  });

  it("PAYMENT_CONFIRMED e PAYMENT_RECEIVED marcam como pago com os dados da cobrança e o id do evento", async () => {
    for (const event of ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]) {
      const { result, markPaid } = call({
        body: JSON.stringify({ id: "evt_9", event, payment: { id: "pay_1", externalReference: "link1", value: 100, installment: "ins_1" } }),
      });
      expect((await result).status).toBe(200);
      expect(markPaid).toHaveBeenCalledWith({ uniqueLink: "link1", event, eventId: "evt_9", paymentId: "pay_1", installmentId: "ins_1", value: 100 });
    }
  });

  it("estorno e chargeback vão para markRefunded", async () => {
    for (const event of ["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]) {
      const { result, markPaid, markRefunded } = call({ body: JSON.stringify({ event, payment: { id: "pay_1", externalReference: "link1" } }) });
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

describe("segurança", () => {
  it("timingSafeEqual compara por bytes", () => {
    expect(timingSafeEqual("hello", "hello")).toBe(true);
    expect(timingSafeEqual("a", "ab")).toBe(false);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("olá", "ola")).toBe(false);
  });

  it("hash de senha no formato da v1, verificável e com sal", async () => {
    const a = await hashPassword("segredo");
    const b = await hashPassword("segredo");
    expect(a).toMatch(/^pbkdf2:[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword("segredo", a)).toBe(true);
    expect(await verifyPassword("errada", a)).toBe(false);
    expect(await verifyPassword("segredo", "texto-puro")).toBe(false);
  });

  it("tokens e ids aleatórios, sha256 e escape do Telegram", async () => {
    expect(randomToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(randomId()).toMatch(/^[a-z0-9]{24}$/);
    expect(randomId()).not.toBe(randomId());
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(escapeTgHtml(`<b>"a" & 'b'</b>`)).toBe("&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;");
  });
});
