import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";

const { getAuthUserId } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({
    auth: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    store: vi.fn(),
    isAuthenticated: vi.fn(),
  }),
  getAuthUserId,
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import * as checkouts from "../../convex/checkouts";
import {
  getByLink,
  create,
  remove,
  permanentDelete,
  restore,
  markPaidByLink,
  markRefundedByLink,
  expireOldCheckouts,
  initiatePayment,
  _patchGatewayData,
  MAX_CHARGE_ATTEMPTS,
} from "../../convex/checkouts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRoot(ctx: MockCtx, userId = "root-1") {
  ctx.db._seed("users", [{ _id: userId, email: "root@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "root" }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const LINK = "abcdefghijklmnop1234";

const baseArgs = {
  uniqueLink: LINK,
  customerName: "Alice",
  customerEmail: "alice@x.com",
  customerCpfCnpj: "12345678900",
  customerMobilePhone: "11999999999",
  value: 1000,
  description: "Job Y",
  dueDate: "2099-12-31",
};

const FUTURE = Date.now() + 24 * 60 * 60 * 1000;

function seedCheckout(ctx: MockCtx, overrides: Record<string, unknown> = {}): string {
  return ctx.db._seed("checkouts", [
    {
      uniqueLink: LINK,
      customerName: "Alice",
      customerEmail: "alice@x.com",
      customerCpfCnpj: "123.456.789-00",
      customerMobilePhone: "11999999999",
      value: 1000,
      description: "Projeto",
      status: "pending",
      dueDate: "2099-12-31",
      createdAt: 1,
      expiresAt: FUTURE,
      ...overrides,
    },
  ])[0];
}

/** Erro de pagamento com código (ConvexError), como chega ao navegador. */
async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ConvexError);
  expect(err.data.code).toBe(code);
}

describe("convex/checkouts · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates with status=pending and 30-day default expiry", async () => {
    asRoot(ctx);
    const before = Date.now();
    const id = await handler(create)(ctx, baseArgs);
    const doc = await ctx.db.get(id);
    expect(doc!.status).toBe("pending");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(doc!.expiresAt).toBeGreaterThanOrEqual(before + thirtyDays - 5000);
  });

  it("respects custom expiresAt", async () => {
    asRoot(ctx);
    const custom = Date.now() + 1000;
    const id = await handler(create)(ctx, { ...baseArgs, expiresAt: custom });
    const doc = await ctx.db.get(id);
    expect(doc!.expiresAt).toBe(custom);
  });

  it("rejects duplicate uniqueLink", async () => {
    asRoot(ctx);
    await handler(create)(ctx, baseArgs);
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Link already in use");
  });

  it("rejects callers without role", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "a@b.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "blog-editor" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });

  it("valida valor mínimo, casas decimais, vencimento e tamanho do link", async () => {
    asRoot(ctx);
    await expect(handler(create)(ctx, { ...baseArgs, value: 4.99 })).rejects.toThrow("mínimo");
    await expect(handler(create)(ctx, { ...baseArgs, value: -10 })).rejects.toThrow("mínimo");
    await expect(handler(create)(ctx, { ...baseArgs, value: 10.555 })).rejects.toThrow("decimais");
    await expect(handler(create)(ctx, { ...baseArgs, dueDate: "31/12/2099" })).rejects.toThrow("Vencimento");
    await expect(handler(create)(ctx, { ...baseArgs, dueDate: "2099-02-30" })).rejects.toThrow("Vencimento");
    await expect(handler(create)(ctx, { ...baseArgs, uniqueLink: "abc123" })).rejects.toThrow("curto");
  });
});

describe("convex/checkouts · getByLink", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("returns null for unknown link", async () => {
    expect(await handler(getByLink)(ctx, { uniqueLink: "ghost" })).toBeNull();
  });

  it("não devolve dados pessoais nem campos internos", async () => {
    seedCheckout(ctx, { customerPhone: "1133333333", customerCompany: "Acme", customerId: "cus_1", chargeAttempts: 2, paymentLockUntil: 5 });
    const result = await handler(getByLink)(ctx, { uniqueLink: LINK });
    expect(result).not.toBeNull();
    for (const key of ["customerCpfCnpj", "customerMobilePhone", "customerPhone", "customerCompany", "customerId", "chargeAttempts", "paymentLockUntil"]) {
      expect(result[key]).toBeUndefined();
    }
    expect(result.customerName).toBe("Alice");
  });

  it("link apagado deixa de funcionar", async () => {
    seedCheckout(ctx, { deletedAt: 1 });
    expect(await handler(getByLink)(ctx, { uniqueLink: LINK })).toBeNull();
  });

  it("plugin desligado devolve null", async () => {
    seedCheckout(ctx);
    ctx.db._seed("homeContent", [{ key: "plugin:payments:enabled", value: false }]);
    expect(await handler(getByLink)(ctx, { uniqueLink: LINK })).toBeNull();
  });
});

describe("convex/checkouts · remove / permanentDelete / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("remove soft-deletes a non-paid checkout", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeGreaterThan(0);
  });

  it("remove cancela no Asaas a cobrança de PIX/cartão, mas não a de boleto", async () => {
    asRoot(ctx);
    const pix = seedCheckout(ctx, { uniqueLink: "pix-link-0000000000", paymentMethod: "pix", asaasChargeId: "pay_pix" });
    const bol = seedCheckout(ctx, { uniqueLink: "bol-link-0000000000", paymentMethod: "boleto", asaasChargeId: "pay_bol" });
    await handler(remove)(ctx, { id: pix });
    await handler(remove)(ctx, { id: bol });
    const scheduled = ctx.scheduler.runAfter.mock.calls.map((c: any[]) => c[2]);
    expect(scheduled).toEqual([{ chargeId: "pay_pix", installmentId: undefined }]);
  });

  it("remove rejects paid checkouts", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await ctx.db.patch(id, { status: "paid" });
    await expect(handler(remove)(ctx, { id })).rejects.toThrow("Cannot delete paid checkout");
  });

  it("permanentDelete removes when not paid", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("permanentDelete rejects paid", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await ctx.db.patch(id, { status: "paid" });
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Cannot delete paid checkout");
  });

  it("restore clears deletedAt", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/checkouts · initiatePayment", () => {
  let ctx: MockCtx;
  /** Respostas falsas do Asaas, por action interna. */
  let asaas: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    ctx = createMockCtx();
    asaas = {
      "asaas:createCustomer": vi.fn().mockResolvedValue({ customerId: "cus_new" }),
      "asaas:createCharge": vi.fn(),
      "asaas:deleteCharge": vi.fn().mockResolvedValue(undefined),
    };
    // Mutations internas rodam de verdade contra o banco simulado; só o Asaas é falso.
    ctx.runMutation = vi.fn(async (ref: any, args: any) => {
      const name = getFunctionName(ref).split(":")[1]!;
      return handler((checkouts as any)[name])(ctx, args);
    });
    ctx.runAction = vi.fn(async (ref: any, args: any) => {
      const fn = asaas[getFunctionName(ref)];
      if (!fn) throw new Error(`action inesperada: ${getFunctionName(ref)}`);
      return fn(args);
    });
  });

  const run = (id: string, args: Record<string, unknown>) => handler(initiatePayment)(ctx, { id, ...args });
  const doc = async (id: string) => (await ctx.db.get(id))!;

  it("rejeita checkout inexistente, apagado ou com o plugin desligado", async () => {
    const gone = seedCheckout(ctx, { uniqueLink: "apagado-de-vez-0000" });
    await ctx.db.delete(gone);
    await expectCode(run(gone, { billingType: "PIX" }), "NOT_FOUND");
    const deleted = seedCheckout(ctx, { deletedAt: 1 });
    await expectCode(run(deleted, { billingType: "PIX" }), "NOT_FOUND");
    const ok = seedCheckout(ctx, { uniqueLink: "outro-link-000000000" });
    ctx.db._seed("homeContent", [{ key: "plugin:payments:enabled", value: false }]);
    await expectCode(run(ok, { billingType: "PIX" }), "NOT_FOUND");
    expect(ctx.runAction).not.toHaveBeenCalled();
  });

  it("rejeita checkout já pago, estornado ou vencido", async () => {
    await expectCode(run(seedCheckout(ctx, { status: "paid" }), { billingType: "PIX" }), "ALREADY_PAID");
    await expectCode(run(seedCheckout(ctx, { status: "refunded" }), { billingType: "PIX" }), "ALREADY_PAID");
    await expectCode(run(seedCheckout(ctx, { expiresAt: Date.now() - 1 }), { billingType: "PIX" }), "EXPIRED");
    await expectCode(run(seedCheckout(ctx, { status: "expired" }), { billingType: "PIX" }), "EXPIRED");
  });

  it("PIX: cria cliente e cobrança e devolve o QR code, sem confirmar pagamento", async () => {
    const id = seedCheckout(ctx);
    asaas["asaas:createCharge"].mockResolvedValue({ chargeId: "pay_1", pixPayload: "000201", pixImage: "iVBOR", pixExpiresAt: FUTURE });

    const result = await run(id, { billingType: "PIX" });

    expect(asaas["asaas:createCharge"].mock.calls[0][0]).toMatchObject({
      customerId: "cus_new",
      value: 1000,
      billingType: "PIX",
      externalReference: LINK,
      successUrl: undefined,
    });
    expect(result).toMatchObject({ status: "payment_selected", pixPayload: "000201", totalValue: 1000 });
    const saved = await doc(id);
    expect(saved).toMatchObject({ status: "payment_selected", asaasChargeId: "pay_1", customerId: "cus_new", chargeAttempts: 1 });
    expect(saved.paymentLockUntil).toBeUndefined();
  });

  it("grava o cliente do Asaas mesmo se a cobrança falhar (não cria outro na próxima)", async () => {
    const id = seedCheckout(ctx);
    asaas["asaas:createCharge"].mockRejectedValueOnce(new ConvexError({ code: "GATEWAY", message: "Valor inválido" }));

    await expectCode(run(id, { billingType: "PIX" }), "GATEWAY");

    const saved = await doc(id);
    expect(saved.customerId).toBe("cus_new");
    expect(saved.paymentLockUntil).toBeUndefined();
  });

  it("cartão nunca é confirmado na hora: devolve a página do Asaas e manda URL de retorno", async () => {
    vi.stubEnv("SITE_URL", "https://ana.dev/");
    const id = seedCheckout(ctx, { customerId: "cus_1" });
    asaas["asaas:createCharge"].mockResolvedValue({ chargeId: "pay_2", invoiceUrl: "https://sandbox.asaas.com/i/pay_2" });

    const result = await run(id, { billingType: "CREDIT_CARD", installmentCount: 1 });

    expect(result).toMatchObject({ status: "payment_selected", invoiceUrl: "https://sandbox.asaas.com/i/pay_2" });
    expect(asaas["asaas:createCharge"].mock.calls[0][0].successUrl).toBe(`https://ana.dev/payment-success/${LINK}`);
    expect((await doc(id)).status).toBe("payment_selected");
    vi.unstubAllEnvs();
  });

  it("cartão parcelado: total com juros calculado no servidor e ID do parcelamento guardado", async () => {
    const id = seedCheckout(ctx, { customerId: "cus_1" });
    asaas["asaas:createCharge"].mockResolvedValue({ chargeId: "pay_3", installmentId: "ins_3", invoiceUrl: "https://x" });

    const result = await run(id, { billingType: "CREDIT_CARD", installmentCount: 6 });

    // 1000 + 3,49% + 0,49 = 1035,39
    expect(asaas["asaas:createCharge"].mock.calls[0][0]).toMatchObject({ value: 1035.39, installmentCount: 6 });
    expect(result.totalValue).toBe(1035.39);
    expect(await doc(id)).toMatchObject({ installmentCount: 6, totalValue: 1035.39, asaasInstallmentId: "ins_3" });
  });

  it("rejeita parcelas inválidas ou com parcela abaixo do mínimo do Asaas", async () => {
    const id = seedCheckout(ctx, { value: 20 });
    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 13 }), "INVALID_INSTALLMENTS");
    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 0 }), "INVALID_INSTALLMENTS");
    // R$ 20 em 6x daria parcelas abaixo de R$ 5
    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 6 }), "INVALID_INSTALLMENTS");
    expect(ctx.runAction).not.toHaveBeenCalled();
    expect((await doc(id)).paymentLockUntil).toBeUndefined();
  });

  it("respeita a forma de pagamento restrita no checkout", async () => {
    const id = seedCheckout(ctx, { billingType: "PIX" });
    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 1 }), "METHOD_NOT_ALLOWED");
  });

  it("idempotência: mesma forma devolve a cobrança existente sem chamar o Asaas", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_old", paymentMethod: "pix", pixQrCode: "qr", pixExpirationDate: FUTURE });
    const result = await run(id, { billingType: "PIX" });
    expect(result.pixPayload).toBe("qr");
    expect(ctx.runAction).not.toHaveBeenCalled();
  });

  it("QR code PIX vencido: cancela a cobrança e gera outra", async () => {
    const id = seedCheckout(ctx, {
      status: "payment_selected",
      asaasChargeId: "pay_old",
      paymentMethod: "pix",
      pixQrCode: "velho",
      pixExpirationDate: Date.now() - 1000,
      customerId: "cus_1",
    });
    asaas["asaas:createCharge"].mockResolvedValue({ chargeId: "pay_new", pixPayload: "novo", pixExpiresAt: FUTURE });

    const result = await run(id, { billingType: "PIX" });

    expect(asaas["asaas:deleteCharge"]).toHaveBeenCalledWith({ chargeId: "pay_old", installmentId: undefined });
    expect(result.pixPayload).toBe("novo");
  });

  it("trocar de forma cancela a anterior (inclusive o parcelamento inteiro) antes de criar outra", async () => {
    const id = seedCheckout(ctx, {
      status: "payment_selected",
      asaasChargeId: "pay_old",
      asaasInstallmentId: "ins_old",
      paymentMethod: "credit_card",
      installmentCount: 6,
      customerId: "cus_1",
    });
    asaas["asaas:createCharge"].mockResolvedValue({ chargeId: "pay_new", pixPayload: "p" });

    await run(id, { billingType: "PIX" });

    expect(asaas["asaas:deleteCharge"]).toHaveBeenCalledWith({ chargeId: "pay_old", installmentId: "ins_old" });
    const saved = await doc(id);
    expect(saved).toMatchObject({ asaasChargeId: "pay_new", paymentMethod: "pix" });
    expect(saved.asaasInstallmentId).toBeUndefined();
    expect(saved.installmentCount).toBeUndefined();
  });

  it("se a cobrança nova falhar depois de cancelar a antiga, o checkout não aponta para a cancelada", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_old", paymentMethod: "pix", pixQrCode: "qr", customerId: "cus_1" });
    asaas["asaas:createCharge"].mockRejectedValueOnce(new ConvexError({ code: "GATEWAY", message: "falhou" }));

    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 1 }), "GATEWAY");

    const saved = await doc(id);
    expect(saved.asaasChargeId).toBeUndefined();
    expect(saved.pixQrCode).toBeUndefined();
    expect(saved.status).toBe("pending");
  });

  it("não troca um boleto já gerado (pode ter sido pago e estar compensando)", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_bol", paymentMethod: "boleto", customerId: "cus_1" });
    await expectCode(run(id, { billingType: "PIX" }), "BOLETO_ISSUED");
    expect(asaas["asaas:deleteCharge"]).not.toHaveBeenCalled();
  });

  it("se não conseguir cancelar a cobrança anterior, não cria outra", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_old", paymentMethod: "pix", customerId: "cus_1" });
    asaas["asaas:deleteCharge"].mockRejectedValueOnce(new Error("já recebida"));

    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 1 }), "SWITCH_FAILED");
    expect(asaas["asaas:createCharge"]).not.toHaveBeenCalled();
    expect((await doc(id)).asaasChargeId).toBe("pay_old");
  });

  it("limita quantas cobranças um link pode gerar", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_old", paymentMethod: "pix", chargeAttempts: MAX_CHARGE_ATTEMPTS });
    await expectCode(run(id, { billingType: "CREDIT_CARD", installmentCount: 1 }), "TOO_MANY_ATTEMPTS");
    expect(ctx.runAction).not.toHaveBeenCalled();
  });

  it("duas gerações ao mesmo tempo: a segunda é recusada pela trava", async () => {
    const id = seedCheckout(ctx, { customerId: "cus_1" });
    let release!: () => void;
    asaas["asaas:createCharge"].mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ chargeId: "pay_1", pixPayload: "p" }); }),
    );

    const first = run(id, { billingType: "PIX" });
    await vi.waitFor(() => expect(asaas["asaas:createCharge"]).toHaveBeenCalled());
    await expectCode(run(id, { billingType: "BOLETO" }), "IN_PROGRESS");
    release();
    await first;

    expect(asaas["asaas:createCharge"]).toHaveBeenCalledTimes(1);
    expect((await doc(id)).paymentLockUntil).toBeUndefined();
  });

  it("checkout que venceu durante a geração: cancela a cobrança recém-criada", async () => {
    const id = seedCheckout(ctx, { customerId: "cus_1" });
    asaas["asaas:createCharge"].mockImplementation(async () => {
      await ctx.db.patch(id, { status: "expired" });
      return { chargeId: "pay_late", pixPayload: "p" };
    });

    await expectCode(run(id, { billingType: "PIX" }), "EXPIRED");
    expect(asaas["asaas:deleteCharge"]).toHaveBeenCalledWith({ chargeId: "pay_late", installmentId: undefined });
  });
});

describe("convex/checkouts · _patchGatewayData", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("grava a cobrança, deixa aguardando pagamento e conta a tentativa", async () => {
    const id = seedCheckout(ctx, { chargeAttempts: 2 });
    await handler(_patchGatewayData)(ctx, { id, paymentMethod: "credit_card", asaasChargeId: "ch1", invoiceUrl: "https://x" });
    expect(await ctx.db.get(id)).toMatchObject({ status: "payment_selected", asaasChargeId: "ch1", invoiceUrl: "https://x", chargeAttempts: 3 });
  });

  it("limpa os dados da cobrança anterior", async () => {
    const id = seedCheckout(ctx, { paymentMethod: "pix", pixQrCode: "qr", pixQrCodeImage: "img" });
    await handler(_patchGatewayData)(ctx, { id, paymentMethod: "boleto", bankSlipUrl: "https://b" });
    const saved = (await ctx.db.get(id))!;
    expect(saved.pixQrCode).toBeUndefined();
    expect(saved.bankSlipUrl).toBe("https://b");
  });

  it("recusa checkout pago, vencido ou apagado", async () => {
    await expectCode(handler(_patchGatewayData)(ctx, { id: seedCheckout(ctx, { status: "paid" }), paymentMethod: "pix" }), "ALREADY_PAID");
    await expectCode(handler(_patchGatewayData)(ctx, { id: seedCheckout(ctx, { expiresAt: 1 }), paymentMethod: "pix" }), "EXPIRED");
    await expectCode(handler(_patchGatewayData)(ctx, { id: seedCheckout(ctx, { deletedAt: 1 }), paymentMethod: "pix" }), "NOT_FOUND");
  });
});

describe("convex/checkouts · markPaidByLink (webhook)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  const telegram = () => ctx.scheduler.runAfter.mock.calls.map((c: any[]) => c[2].message as string);

  it("marca como pago, guarda a cobrança e o valor, e avisa", async () => {
    const id = seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_1" });
    await handler(markPaidByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_1", value: 1000 });
    expect(await ctx.db.get(id)).toMatchObject({ status: "paid", paidChargeId: "pay_1", paidValue: 1000 });
    expect(telegram()[0]).toContain("Pagamento confirmado");
    expect(telegram()[0]).not.toContain("Confira");
  });

  it("parcelado: reconhece a parcela pelo ID do parcelamento e mostra o total", async () => {
    seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_1", asaasInstallmentId: "ins_1", installmentCount: 6, installmentValue: 172.57, totalValue: 1035.39 });
    await handler(markPaidByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_1b", installmentId: "ins_1", value: 172.57 });
    expect(telegram()[0]).toContain("R$ 1035,39 em 6x");
    expect(telegram()[0]).not.toContain("Confira");
  });

  it("pagamento de outra cobrança, de link apagado ou com valor menor: marca pago, mas pede conferência", async () => {
    seedCheckout(ctx, { status: "payment_selected", asaasChargeId: "pay_1", deletedAt: 1 });
    await handler(markPaidByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_outra", value: 10 });
    const msg = telegram()[0];
    expect(msg).toContain("Confira");
    expect(msg).toContain("não é a atual");
    expect(msg).toContain("apagado");
    expect(msg).toContain("menor que o esperado");
  });

  it("parcelas seguintes do mesmo parcelamento não geram alerta", async () => {
    seedCheckout(ctx, { status: "paid", asaasInstallmentId: "ins_1", paidChargeId: "pay_1" });
    await handler(markPaidByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_2", installmentId: "ins_1" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it("segundo pagamento em checkout já pago gera alerta de pagamento extra", async () => {
    seedCheckout(ctx, { status: "paid", paidChargeId: "pay_1" });
    await handler(markPaidByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_2" });
    expect(telegram()[0]).toContain("Pagamento extra");
  });

  it("is no-op when checkout not found", async () => {
    await handler(markPaidByLink)(ctx, { uniqueLink: "ghost" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });
});

describe("convex/checkouts · markRefundedByLink (webhook)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("estorno da cobrança paga marca como estornado e avisa", async () => {
    const id = seedCheckout(ctx, { status: "paid", paidChargeId: "pay_1" });
    await handler(markRefundedByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_1", event: "PAYMENT_REFUNDED" });
    expect((await ctx.db.get(id))!.status).toBe("refunded");
    expect(ctx.scheduler.runAfter.mock.calls[0][2].message).toContain("estornado");
  });

  it("estorno de outra cobrança não mexe no checkout", async () => {
    const id = seedCheckout(ctx, { status: "paid", paidChargeId: "pay_1", asaasChargeId: "pay_1" });
    await handler(markRefundedByLink)(ctx, { uniqueLink: LINK, paymentId: "pay_x", event: "PAYMENT_REFUNDED" });
    expect((await ctx.db.get(id))!.status).toBe("paid");
  });
});

describe("convex/checkouts · expireOldCheckouts", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("expira só pending e payment_selected vencidos", async () => {
    const past = Date.now() - 10_000;
    seedCheckout(ctx, { uniqueLink: "a", status: "pending", expiresAt: past });
    seedCheckout(ctx, { uniqueLink: "b", status: "payment_selected", expiresAt: past });
    seedCheckout(ctx, { uniqueLink: "c", status: "paid", expiresAt: past });
    seedCheckout(ctx, { uniqueLink: "d", status: "pending", expiresAt: FUTURE });
    await handler(expireOldCheckouts)(ctx, {});
    const byLink = (link: string) => ctx.db._all("checkouts").find((c) => c.uniqueLink === link)!;
    expect(byLink("a").status).toBe("expired");
    expect(byLink("b").status).toBe("expired");
    expect(byLink("c").status).toBe("paid");
    expect(byLink("d").status).toBe("pending");
  });

  it("cancela no Asaas a cobrança de PIX/cartão (com parcelamento) do link vencido, mas não a de boleto", async () => {
    const past = Date.now() - 10_000;
    seedCheckout(ctx, { uniqueLink: "card", status: "payment_selected", expiresAt: past, paymentMethod: "credit_card", asaasChargeId: "pay_c", asaasInstallmentId: "ins_c" });
    seedCheckout(ctx, { uniqueLink: "bol", status: "payment_selected", expiresAt: past, paymentMethod: "boleto", asaasChargeId: "pay_b" });
    await handler(expireOldCheckouts)(ctx, {});
    const scheduled = ctx.scheduler.runAfter.mock.calls.map((c: any[]) => c[2]);
    expect(scheduled).toEqual([{ chargeId: "pay_c", installmentId: "ins_c" }]);
  });
});
