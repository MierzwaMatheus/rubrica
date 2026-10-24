import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({ auth: {}, signIn: vi.fn(), signOut: vi.fn(), store: vi.fn(), isAuthenticated: vi.fn() }),
  getAuthUserId: vi.fn(),
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));
vi.mock("@convex-dev/auth/providers/Password", () => ({ Password: () => ({}) }));

import {
  asaasConfig,
  asaasRequest,
  AsaasError,
  effectiveDueDate,
  todayInSaoPaulo,
} from "../../convex/lib/asaasClient";
import { installmentPlan, installmentOptions, maxInstallmentsFor } from "../../convex/lib/installments";
import { ConvexError } from "convex/values";
import {
  createCharge,
  createCustomer,
  deleteCharge,
  listCustomers,
  adminCreateCharge,
  parseAsaasDateTime,
} from "../../convex/asaas";

const handler = (fn: any) => fn._handler ?? fn;

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
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api-sandbox.asaas.com/v3/customers");
    expect(init.headers.access_token).toBe("$aact_hmlg_k");
    expect(init.headers["User-Agent"]).toBeTruthy();
    expect(JSON.parse(init.body)).toEqual({ name: "Ana" });
  });

  it("transforma os erros do Asaas em mensagem legível", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ errors: [{ code: "invalid_cpfCnpj", description: "O CPF/CNPJ informado é inválido." }] }, 400),
    );
    const err = await asaasRequest("POST", "/customers", {}, { config, fetch: fetchMock }).catch((e) => e);
    expect(err).toBeInstanceOf(AsaasError);
    expect(err.message).toBe("O CPF/CNPJ informado é inválido.");
    expect(err.codes).toEqual(["invalid_cpfCnpj"]);
  });

  it("erro de rede vira mensagem amigável", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(asaasRequest("GET", "/payments", undefined, { config, fetch: fetchMock })).rejects.toThrow(
      "Não foi possível falar com o Asaas",
    );
  });
});

describe("vencimento", () => {
  it("usa a data de São Paulo", () => {
    // 01:00 UTC de 2 de março = 22:00 de 1º de março em São Paulo
    expect(todayInSaoPaulo(new Date("2026-03-02T01:00:00Z"))).toBe("2026-03-01");
  });

  it("vencimento no passado vira hoje; no futuro, é mantido", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(effectiveDueDate("2026-03-01", now)).toBe("2026-03-10");
    expect(effectiveDueDate("2026-04-01", now)).toBe("2026-04-01");
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

  it("lista as 12 opções quando o valor permite", () => {
    expect(installmentOptions(1000).map((o) => o.count)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("não oferece parcela abaixo de R$ 5 (mínimo do Asaas)", () => {
    expect(maxInstallmentsFor(20)).toBe(4);
    expect(installmentOptions(20).every((o) => o.value >= 5)).toBe(true);
    expect(maxInstallmentsFor(5)).toBe(1);
  });
});

describe("convex/asaas · ações internas", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("ASAAS_API_KEY", "$aact_hmlg_test");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("createCustomer manda só dígitos do CPF e do celular", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "cus_9" }));
    const result = await handler(createCustomer)({}, { name: "Ana", email: "a@a.dev", cpfCnpj: "123.456.789-00", phone: "(11) 99999-0000" });
    expect(result).toEqual({ customerId: "cus_9" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ cpfCnpj: "12345678900", mobilePhone: "11999990000" });
  });

  it("createCharge PIX busca o QR code e converte a validade do horário de Brasília", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "pay_1", status: "PENDING", invoiceUrl: "https://i" }))
      .mockResolvedValueOnce(jsonResponse({ encodedImage: "iVBOR", payload: "000201", expirationDate: "2099-01-01 23:59:59" }));

    const result = await handler(createCharge)({}, {
      customerId: "cus_1",
      value: 150,
      description: "Projeto",
      billingType: "PIX",
      dueDate: "2099-01-01",
      externalReference: "link1",
    });

    expect(fetchMock.mock.calls[1][0]).toBe("https://api-sandbox.asaas.com/v3/payments/pay_1/pixQrCode");
    expect(result).toMatchObject({ chargeId: "pay_1", pixPayload: "000201", pixImage: "iVBOR" });
    expect(result.pixExpiresAt).toBe(Date.parse("2099-01-02T02:59:59Z"));
  });

  it("createCharge boleto busca a linha digitável", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "pay_2", status: "PENDING", bankSlipUrl: "https://b" }))
      .mockResolvedValueOnce(jsonResponse({ identificationField: "34191.79001" }));

    const result = await handler(createCharge)({}, {
      customerId: "cus_1",
      value: 150,
      description: "Projeto",
      billingType: "BOLETO",
      dueDate: "2099-01-01",
      externalReference: "link1",
    });

    expect(result).toMatchObject({ bankSlipUrl: "https://b", bankSlipLine: "34191.79001" });
  });

  it("createCharge cartão parcelado manda totalValue + installmentCount e a URL de retorno", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "pay_3", status: "PENDING", invoiceUrl: "https://i/pay_3" }));

    const result = await handler(createCharge)({}, {
      customerId: "cus_1",
      value: 1035.39,
      description: "Projeto",
      billingType: "CREDIT_CARD",
      dueDate: "2099-01-01",
      externalReference: "link1",
      installmentCount: 6,
      successUrl: "https://ana.dev/payment-success/link1",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      billingType: "CREDIT_CARD",
      installmentCount: 6,
      totalValue: 1035.39,
      callback: { successUrl: "https://ana.dev/payment-success/link1", autoRedirect: true },
    });
    expect(body.value).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.invoiceUrl).toBe("https://i/pay_3");
  });
});

describe("convex/asaas · erros, cancelamento e retorno", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const charge = {
    customerId: "cus_1",
    value: 150,
    description: "Projeto",
    dueDate: "2099-01-01",
    externalReference: "link1",
    successUrl: "https://ana.dev/payment-success/link1",
  };

  beforeEach(() => {
    vi.stubEnv("ASAAS_API_KEY", "$aact_hmlg_test");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("erros do Asaas chegam ao navegador como ConvexError com código", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errors: [{ code: "invalid_value", description: "Valor inválido." }] }, 400));
    const err = await handler(createCharge)({}, { ...charge, billingType: "PIX" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConvexError);
    expect(err.data).toEqual({ code: "GATEWAY", message: "Valor inválido." });
  });

  it("sem chave configurada: código NOT_CONFIGURED", async () => {
    vi.stubEnv("ASAAS_API_KEY", "");
    const err = await handler(createCharge)({}, { ...charge, billingType: "PIX" }).catch((e: unknown) => e);
    expect(err.data.code).toBe("NOT_CONFIGURED");
  });

  it("PIX e boleto não mandam a URL de retorno; cartão manda", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: "pay_1" }))
      .mockResolvedValueOnce(jsonResponse({ payload: "p", encodedImage: "i" }));
    await handler(createCharge)({}, { ...charge, billingType: "PIX" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).callback).toBeUndefined();

    fetchMock.mockReset().mockResolvedValueOnce(jsonResponse({ id: "pay_2", invoiceUrl: "https://i" }));
    await handler(createCharge)({}, { ...charge, billingType: "CREDIT_CARD" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).callback.successUrl).toBe(charge.successUrl);
  });

  it("se o Asaas recusar a URL de retorno, cria a cobrança de cartão sem ela", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ errors: [{ code: "invalid_callback", description: "Domínio não cadastrado." }] }, 400))
      .mockResolvedValueOnce(jsonResponse({ id: "pay_3", invoiceUrl: "https://i/pay_3" }));
    const result = await handler(createCharge)({}, { ...charge, billingType: "CREDIT_CARD" });
    expect(result.invoiceUrl).toBe("https://i/pay_3");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).callback).toBeUndefined();
  });

  it("guarda o ID do parcelamento devolvido pelo Asaas", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "pay_4", installment: "ins_4", invoiceUrl: "https://i" }));
    const result = await handler(createCharge)({}, { ...charge, billingType: "CREDIT_CARD", installmentCount: 3 });
    expect(result.installmentId).toBe("ins_4");
  });

  it("deleteCharge remove o parcelamento inteiro quando há um", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ deleted: true }));
    await handler(deleteCharge)({}, { chargeId: "pay_1", installmentId: "ins_1" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api-sandbox.asaas.com/v3/installments/ins_1");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    await handler(deleteCharge)({}, { chargeId: "pay_1" });
    expect(fetchMock.mock.calls[1][0]).toBe("https://api-sandbox.asaas.com/v3/payments/pay_1");
  });

  it("deleteCharge trata cobrança já removida (404) como sucesso, e propaga outros erros", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{ description: "Não encontrada" }] }, 404));
    await expect(handler(deleteCharge)({}, { chargeId: "pay_x" })).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{ description: "Cobrança já recebida" }] }, 400));
    await expect(handler(deleteCharge)({}, { chargeId: "pay_y" })).rejects.toBeInstanceOf(ConvexError);
  });

  it("parseAsaasDateTime lê horário de Brasília e aceita fuso explícito", () => {
    expect(parseAsaasDateTime("2099-01-01 23:59:59")).toBe(Date.parse("2099-01-02T02:59:59Z"));
    expect(parseAsaasDateTime("2099-01-01T10:00:00Z")).toBe(Date.parse("2099-01-01T10:00:00Z"));
    expect(parseAsaasDateTime(undefined)).toBeUndefined();
    expect(parseAsaasDateTime("lixo")).toBeUndefined();
  });
});

describe("convex/asaas · ações do admin", () => {
  let ctx: any;

  beforeEach(() => {
    vi.stubEnv("ASAAS_API_KEY", "$aact_hmlg_test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ object: "list", data: [] })));
    ctx = { runQuery: vi.fn(), runMutation: vi.fn() };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("exigem o plugin de pagamentos ligado", async () => {
    ctx.runQuery.mockResolvedValueOnce(false);
    await expect(handler(listCustomers)(ctx, {})).rejects.toThrow("PLUGIN_DISABLED");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("exigem papel root/admin", async () => {
    ctx.runQuery.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("Forbidden: insufficient permissions"));
    await expect(handler(listCustomers)(ctx, {})).rejects.toThrow("Forbidden");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("com permissão, consultam o Asaas e registram auditoria nas escritas", async () => {
    ctx.runQuery.mockResolvedValue(true).mockResolvedValueOnce(true).mockResolvedValueOnce({ userId: "u1" });
    (fetch as any).mockResolvedValueOnce(jsonResponse({ id: "pay_9" }));
    await handler(adminCreateCharge)(ctx, { customer: "cus_1", billingType: "PIX", value: 10, dueDate: "2099-01-01" });
    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "admin.create", targetType: "asaas_charge", targetId: "pay_9", actorId: "u1" }),
    );
  });
});
