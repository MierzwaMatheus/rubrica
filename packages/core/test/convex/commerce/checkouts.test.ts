// @vitest-environment edge-runtime
/**
 * Checkouts, Asaas, webhook e links de pagamento de planos (port dos testes da v1 em
 * tests/convex/checkouts.test.ts e asaas.test.ts, no convex-test com o fetch simulado).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";
import type { Id } from "../../../src/convex/server";
import { as, seedSettings, setup, type T } from "../_setup";
import { api, internal, notifications, post, scheduled } from "./_commerce";

type Client = Awaited<ReturnType<typeof as>>;

const CHECKOUT = {
  customerName: "Alice",
  customerEmail: "Alice@Exemplo.dev",
  customerCpfCnpj: "123.456.789-00",
  customerMobilePhone: "(11) 99999-9999",
  value: 1000,
  description: "Projeto",
  dueDate: "2099-12-31",
};

let t: T;
let root: Client;
let asaas: ReturnType<typeof vi.fn>;
const calls = () => asaas.mock.calls.map(([url, init]) => `${(init as RequestInit | undefined)?.method ?? "GET"} ${String(url).replace("https://api-sandbox.asaas.com/v3", "")}`);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Asaas simulado: cliente, cobrança, QR code PIX, linha do boleto, exclusão. */
function asaasMock(overrides: Record<string, () => Response> = {}) {
  let n = 0;
  return vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url).replace("https://api-sandbox.asaas.com/v3", "");
    const key = `${init?.method ?? "GET"} ${path}`;
    for (const [pattern, respond] of Object.entries(overrides)) if (key.startsWith(pattern)) return respond();
    if (key === "POST /customers") return json({ id: "cus_1" });
    if (key === "POST /payments") {
      const body = JSON.parse(String(init!.body));
      return json({ id: `pay_${++n}`, status: "PENDING", invoiceUrl: "https://asaas.test/i", installment: body.installmentCount ? "ins_1" : null });
    }
    if (key.endsWith("/pixQrCode")) return json({ payload: "pix-copia-e-cola", encodedImage: "base64", expirationDate: "2099-01-01 23:59:59" });
    if (key.endsWith("/identificationField")) return json({ identificationField: "34191.79001" });
    if (init?.method === "DELETE") return json({ deleted: true });
    return json({ errors: [{ description: `rota não simulada: ${key}` }] }, 404);
  });
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  t = setup();
  await seedSettings(t);
  root = await as(t, "root");
  process.env.ASAAS_API_KEY = "$aact_hmlg_teste";
  process.env.ASAAS_WEBHOOK_TOKEN = "token-do-webhook";
  asaas = asaasMock();
  vi.stubGlobal("fetch", asaas);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.ASAAS_API_KEY;
  delete process.env.ASAAS_WEBHOOK_TOKEN;
});

async function createCheckout(extra: Record<string, unknown> = {}) {
  const id = await root.mutation(api.rubrica.checkouts.create, { ...CHECKOUT, ...extra } as never);
  const doc = (await t.run((ctx) => ctx.db.get(id)))!;
  return { id, link: doc.uniqueLink, doc };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ConvexError);
  expect((err as ConvexError<{ code: string }>).data.code).toBe(code);
}

function webhook(body: unknown, token = "token-do-webhook") {
  return t.fetch("/webhooks/asaas", {
    method: "POST",
    headers: { "Content-Type": "application/json", "asaas-access-token": token, "x-forwarded-for": "198.51.100.9" },
    body: JSON.stringify(body),
  });
}

describe("checkouts: painel", () => {
  it("cria pendente, com 30 dias de validade, link aleatório e e-mail normalizado", async () => {
    const before = Date.now();
    const { doc } = await createCheckout();
    expect(doc).toMatchObject({ status: "pending", customerEmail: "alice@exemplo.dev" });
    expect(doc.uniqueLink).toMatch(/^[a-z0-9]{24}$/);
    expect(doc.expiresAt).toBeGreaterThanOrEqual(before + 30 * 24 * 60 * 60 * 1000 - 5000);
  });

  it("valida valor mínimo, casas decimais, vencimento, link e e-mail", async () => {
    await expect(createCheckout({ value: 4.99 })).rejects.toThrow(/valor mínimo/);
    await expect(createCheckout({ value: 10.123 })).rejects.toThrow(/2 casas/);
    await expect(createCheckout({ dueDate: "31/12/2099" })).rejects.toThrow(/Vencimento/);
    await expect(createCheckout({ uniqueLink: "curto" })).rejects.toThrow(/Link de checkout inválido/);
    await expect(createCheckout({ customerEmail: "x" })).rejects.toThrow(/E-mail/);
    await createCheckout({ uniqueLink: "abcdefghijklmnop1234" });
    await expect(createCheckout({ uniqueLink: "abcdefghijklmnop1234" })).rejects.toThrow(/em uso/);
  });

  it("apagar cancela no Asaas a cobrança de PIX/cartão, mas não a de boleto; pago não se apaga", async () => {
    const pix = await createCheckout();
    await t.run((ctx) => ctx.db.patch(pix.id, { asaasChargeId: "pay_x", paymentMethod: "pix" }));
    await root.mutation(api.rubrica.checkouts.remove, { id: pix.id });
    const boleto = await createCheckout();
    await t.run((ctx) => ctx.db.patch(boleto.id, { asaasChargeId: "pay_b", paymentMethod: "boleto" }));
    await root.mutation(api.rubrica.checkouts.remove, { id: boleto.id });
    expect((await scheduled(t)).filter((n) => n.includes("asaas:deleteCharge"))).toHaveLength(1);
    const paid = await createCheckout();
    await t.run((ctx) => ctx.db.patch(paid.id, { status: "paid" }));
    await expect(root.mutation(api.rubrica.checkouts.remove, { id: paid.id })).rejects.toThrow(/pago não pode/);
  });
});

describe("checkouts: página pública e pagamento", () => {
  it("getByLink não devolve dados pessoais nem campos internos; apagado ou plugin desligado some", async () => {
    const { id, link } = await createCheckout();
    const pub = await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: link });
    expect(pub).toMatchObject({ kind: "checkout", customerName: "Alice", value: 1000 });
    for (const field of ["customerCpfCnpj", "customerMobilePhone", "customerId", "paymentLockUntil", "chargeAttempts"]) expect(pub).not.toHaveProperty(field);
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: "nao-existe" })).toBeNull();
    await seedSettings(t, { plugins: { payments: false } });
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: link })).toBeNull();
    await seedSettings(t);
    await root.mutation(api.rubrica.checkouts.remove, { id });
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: link })).toBeNull();
  });

  it("PIX: cria cliente (só dígitos) e cobrança, devolve o QR code e não confirma pagamento", async () => {
    const { id } = await createCheckout();
    const result = await t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "PIX" });
    expect(result).toMatchObject({ status: "payment_selected", billingType: "PIX", pixPayload: "pix-copia-e-cola", totalValue: 1000 });
    expect(calls()).toEqual(["POST /customers", "POST /payments", "GET /payments/pay_1/pixQrCode"]);
    const customer = JSON.parse(String((asaas.mock.calls[0]![1] as RequestInit).body));
    expect(customer).toMatchObject({ cpfCnpj: "12345678900", mobilePhone: "11999999999", notificationDisabled: true });
    const doc = await t.run((ctx) => ctx.db.get(id));
    expect(doc).toMatchObject({ status: "payment_selected", customerId: "cus_1", asaasChargeId: "pay_1", chargeAttempts: 1 });
    expect(doc!.paymentLockUntil).toBeUndefined();
    // Mesma forma de novo: devolve a cobrança existente sem chamar o Asaas.
    await t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "PIX" });
    expect(asaas).toHaveBeenCalledTimes(3);
  });

  it("cartão parcelado: total com juros calculado no servidor e ID do parcelamento guardado", async () => {
    const { id } = await createCheckout();
    const result = await t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "CREDIT_CARD", installmentCount: 4 });
    expect(result).toMatchObject({ totalValue: 1035.39, installmentCount: 4, invoiceUrl: "https://asaas.test/i" });
    const charge = JSON.parse(String((asaas.mock.calls[1]![1] as RequestInit).body));
    expect(charge).toMatchObject({ installmentCount: 4, totalValue: 1035.39, callback: { successUrl: expect.stringMatching(/^https:\/\/exemplo\.dev\/payment-success\//) } });
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({ asaasInstallmentId: "ins_1", installmentCount: 4 });
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "CREDIT_CARD", installmentCount: 13 }), "INVALID_INSTALLMENTS");
  });

  it("trocar de forma cancela a anterior; boleto gerado não se troca; forma restrita é respeitada", async () => {
    const { id } = await createCheckout();
    await t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "PIX" });
    await t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "BOLETO" });
    expect(calls()).toContain("DELETE /payments/pay_1");
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "PIX" }), "BOLETO_ISSUED");
    const onlyPix = await createCheckout({ billingType: "PIX" });
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id: onlyPix.id, billingType: "BOLETO" }), "METHOD_NOT_ALLOWED");
  });

  it("recusa checkout pago, vencido ou com geração em andamento; sem chave: NOT_CONFIGURED", async () => {
    const paid = await createCheckout();
    await t.run((ctx) => ctx.db.patch(paid.id, { status: "paid" }));
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id: paid.id, billingType: "PIX" }), "ALREADY_PAID");
    const old = await createCheckout({ expiresAt: Date.now() - 1 });
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id: old.id, billingType: "PIX" }), "EXPIRED");
    const busy = await createCheckout();
    await t.run((ctx) => ctx.db.patch(busy.id, { paymentLockUntil: Date.now() + 60_000 }));
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id: busy.id, billingType: "PIX" }), "IN_PROGRESS");
    delete process.env.ASAAS_API_KEY;
    const free = await createCheckout();
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id: free.id, billingType: "PIX" }), "NOT_CONFIGURED");
    expect((await t.run((ctx) => ctx.db.get(free.id)))!.paymentLockUntil).toBeUndefined();
  });

  it("status expõe só se o Asaas está configurado, sem vazar a chave", async () => {
    expect(await root.query(api.rubrica.checkouts.status, {})).toEqual({ asaasConfigured: true });
    delete process.env.ASAAS_API_KEY;
    const off = await root.query(api.rubrica.checkouts.status, {});
    expect(off).toEqual({ asaasConfigured: false });
    process.env.ASAAS_API_KEY = "   ";
    expect(await root.query(api.rubrica.checkouts.status, {})).toEqual({ asaasConfigured: false });
  });

  it("limita quantas cobranças um link pode gerar", async () => {
    const { id } = await createCheckout();
    await t.run((ctx) => ctx.db.patch(id, { chargeAttempts: 8 }));
    await expectCode(t.action(api.rubrica.checkouts.initiatePayment, { id, billingType: "PIX" }), "TOO_MANY_ATTEMPTS");
  });

  it("vence só pending e payment_selected e cancela a cobrança aberta (menos boleto)", async () => {
    const a = await createCheckout({ expiresAt: Date.now() - 1 });
    const b = await createCheckout({ expiresAt: Date.now() - 1 });
    await t.run((ctx) => ctx.db.patch(b.id, { status: "payment_selected", asaasChargeId: "pay_b", paymentMethod: "pix" }));
    const c = await createCheckout({ expiresAt: Date.now() + 60_000 });
    expect(await t.mutation(internal.rubrica.checkouts.expireOldCheckouts, {})).toEqual({ expired: 2 });
    const status = async (id: Id<"checkouts">) => (await t.run((ctx) => ctx.db.get(id)))!.status;
    expect([await status(a.id), await status(b.id), await status(c.id)]).toEqual(["expired", "expired", "pending"]);
    expect((await scheduled(t)).filter((n) => n.includes("asaas:deleteCharge"))).toHaveLength(1);
  });
});

describe("webhook do Asaas", () => {
  const paidEvent = (link: string, extra: Record<string, unknown> = {}) => ({
    id: "evt_1",
    event: "PAYMENT_CONFIRMED",
    payment: { id: "pay_1", externalReference: link, value: 1000, ...extra },
  });

  it("token inválido: 401, nada muda e a tentativa fica registrada", async () => {
    const { id, link } = await createCheckout();
    const res = await webhook(paidEvent(link), "token-errado");
    expect(res.status).toBe(401);
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("pending");
    const log = await t.run((ctx) => ctx.db.query("auditLog").collect());
    expect(log.some((l) => l.eventType === "webhook.unauthorized" && l.ipAddress === "198.51.100.9")).toBe(true);
    const limits = await t.run((ctx) => ctx.db.query("rateLimits").collect());
    expect(limits[0]).toMatchObject({ type: "webhook_invalid", attemptCount: 1 });
  });

  it("sem ASAAS_WEBHOOK_TOKEN: 500", async () => {
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    expect((await webhook({})).status).toBe(500);
  });

  it("pago: marca como pago com a cobrança e o valor, e avisa", async () => {
    const { id, link } = await createCheckout();
    await t.run((ctx) => ctx.db.patch(id, { asaasChargeId: "pay_1", paymentMethod: "pix", totalValue: 1000 }));
    const res = await webhook(paidEvent(link));
    expect(res.status).toBe(200);
    expect(await t.run((ctx) => ctx.db.get(id))).toMatchObject({ status: "paid", paidChargeId: "pay_1", paidValue: 1000 });
    const msgs = await notifications(t);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toContain("Pagamento confirmado");
    expect(msgs[0]).not.toContain("Confira");
  });

  it("evento repetido (mesmo id): não processa de novo nem avisa outra vez", async () => {
    const { id, link } = await createCheckout();
    await t.run((ctx) => ctx.db.patch(id, { asaasChargeId: "pay_1", paymentMethod: "pix" }));
    expect((await webhook(paidEvent(link))).status).toBe(200);
    expect((await webhook(paidEvent(link))).status).toBe(200);
    expect(await t.mutation(internal.rubrica.checkouts.markPaidByLink, { uniqueLink: link, eventId: "evt_1", paymentId: "pay_1" })).toBe("duplicate");
    // Sem id de evento, o estado segura: já pago, mesma cobrança, sem alerta.
    expect(await t.mutation(internal.rubrica.checkouts.markPaidByLink, { uniqueLink: link, paymentId: "pay_1" })).toBe("already_paid");
    expect(await notifications(t)).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("paymentEvents").collect())).toHaveLength(1);
  });

  it("pagamento de outra cobrança ou com valor menor: marca pago, mas pede conferência; pagamento extra avisa", async () => {
    const { id, link } = await createCheckout();
    await t.run((ctx) => ctx.db.patch(id, { asaasChargeId: "pay_atual" }));
    await webhook(paidEvent(link, { id: "pay_velho", value: 900 }));
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("paid");
    expect((await notifications(t))[0]).toMatch(/Confira: a cobrança paga não é a atual.*menor que o esperado/);
    await webhook({ ...paidEvent(link, { id: "pay_outro" }), id: "evt_2" });
    expect((await notifications(t))[1]).toContain("Pagamento extra");
  });

  it("estorno da cobrança paga marca como estornado; de outra cobrança, não mexe", async () => {
    const { id, link } = await createCheckout();
    await t.run((ctx) => ctx.db.patch(id, { status: "paid", paidChargeId: "pay_1", asaasChargeId: "pay_1" }));
    await webhook({ id: "evt_r0", event: "PAYMENT_REFUNDED", payment: { id: "pay_x", externalReference: link } });
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("paid");
    await webhook({ id: "evt_r1", event: "PAYMENT_REFUNDED", payment: { id: "pay_1", externalReference: link } });
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("refunded");
  });

  it("outros eventos: 200 sem mexer (o Asaas não pausa a fila)", async () => {
    const { id, link } = await createCheckout();
    const res = await webhook({ event: "PAYMENT_CREATED", payment: { id: "p", externalReference: link } });
    expect(await res.text()).toBe("ignored");
    expect((await t.run((ctx) => ctx.db.get(id)))!.status).toBe("pending");
  });
});

describe("planos → link de pagamento", () => {
  const PLAN = { name: { "pt-BR": "Site básico", en: "Basic site" }, features: [{ "pt-BR": "5 páginas" }], priceCents: 150000, period: "once" as const };

  beforeEach(async () => {
    await seedSettings(t, { kind: "empresa" });
  });

  async function createPlan(extra: Record<string, unknown> = {}) {
    return (await root.mutation(api.rubrica.plans.create, { ...PLAN, ...extra } as never)) as Id<"plans">;
  }

  it("um plano com preço vira link; o botão do plano aponta para ele", async () => {
    const planId = await createPlan();
    const { uniqueLink, href } = await root.mutation(api.rubrica.checkouts.linkPlan, { planId });
    expect(href).toBe(`/checkout/${uniqueLink}`);
    const plan = await root.query(api.rubrica.plans.get, { id: planId });
    expect(plan).toMatchObject({ cta: { href, label: { "pt-BR": "Contratar", en: "Get started" } } });
    // O botão também vai para o site.
    const snapshot = await t.query(api.rubrica.site.snapshot, {});
    expect(JSON.stringify(snapshot)).toContain(href);
    // Linkar de novo reaproveita o mesmo link e mantém o rótulo que já existia.
    await root.mutation(api.rubrica.plans.update, { id: planId, patch: { cta: { label: { "pt-BR": "Quero" }, href } } });
    expect((await root.mutation(api.rubrica.checkouts.linkPlan, { planId })).uniqueLink).toBe(uniqueLink);
    expect(await root.query(api.rubrica.plans.get, { id: planId })).toMatchObject({ cta: { label: { "pt-BR": "Quero" } } });
  });

  it("recusa plano sem preço, abaixo de R$ 5, em outra moeda ou recorrente", async () => {
    for (const extra of [{ priceCents: undefined }, { priceCents: 400 }, { currency: "USD" }, { period: "month" }]) {
      const planId = await createPlan(extra);
      await expect(root.mutation(api.rubrica.checkouts.linkPlan, { planId })).rejects.toThrow(/preço em reais/);
    }
  });

  it("visitante informa os dados e ganha um checkout próprio, com o preço atual do plano", async () => {
    const planId = await createPlan();
    const { uniqueLink } = await root.mutation(api.rubrica.checkouts.linkPlan, { planId, billingType: "PIX" });
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink })).toMatchObject({ kind: "plan", value: 1500, billingType: "PIX", plan: { name: PLAN.name } });

    await root.mutation(api.rubrica.plans.update, { id: planId, patch: { priceCents: 180000 } });
    const res = await post(t, "/api/checkout/start", { uniqueLink, customerName: "Bia", customerEmail: "bia@exemplo.dev", customerCpfCnpj: "12.345.678/0001-90" });
    expect(res.status).toBe(200);
    const { uniqueLink: own } = (await res.json()) as { uniqueLink: string };
    expect(own).not.toBe(uniqueLink);
    const checkout = await t.query(api.rubrica.checkouts.getByLink, { uniqueLink: own });
    expect(checkout).toMatchObject({ kind: "checkout", value: 1800, billingType: "PIX", description: "Site básico", status: "pending", planId });
    const stored = await t.run((ctx) => ctx.db.query("checkouts").collect());
    expect(stored[0]).toMatchObject({ customerCpfCnpj: "12345678000190" });
  });

  it("dados inválidos, link desativado ou plano despublicado: recusa", async () => {
    const planId = await createPlan();
    const { uniqueLink } = await root.mutation(api.rubrica.checkouts.linkPlan, { planId });
    const start = (body: Record<string, unknown>) => post(t, "/api/checkout/start", { uniqueLink, customerName: "Bia", customerEmail: "bia@exemplo.dev", customerCpfCnpj: "12345678900", ...body });
    expect(await (await start({ customerCpfCnpj: "123" })).json()).toMatchObject({ error: "INVALID_INPUT" });
    await root.mutation(api.rubrica.plans.unpublish, { id: planId });
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink })).toBeNull();
    expect(await (await start({})).json()).toMatchObject({ error: "NOT_FOUND" });
    await root.mutation(api.rubrica.plans.publish, { id: planId });
    await root.mutation(api.rubrica.checkouts.unlinkPlan, { planId });
    expect(await t.query(api.rubrica.checkouts.getByLink, { uniqueLink })).toBeNull();
    expect((await root.query(api.rubrica.plans.get, { id: planId }))!.cta).toBeUndefined();
  });

  it("limita os checkouts abertos por IP (10 por hora)", async () => {
    const planId = await createPlan();
    const { uniqueLink } = await root.mutation(api.rubrica.checkouts.linkPlan, { planId });
    const body = { uniqueLink, customerName: "Bia", customerEmail: "bia@exemplo.dev", customerCpfCnpj: "12345678900" };
    for (let i = 0; i < 10; i++) expect((await post(t, "/api/checkout/start", body)).status).toBe(200);
    expect((await post(t, "/api/checkout/start", body)).status).toBe(429);
  });
});

describe("Asaas: ações do painel", () => {
  it("exigem a permissão de checkouts e o plugin; com permissão, consultam e registram auditoria", async () => {
    const editor = await as(t, "proposal-editor");
    await expect(editor.action(api.rubrica.asaas.listCharges, {})).rejects.toThrow(/Sem permissão/);
    const comercial = await as(t, "comercial");
    asaas.mockImplementation(async () => json({ object: "list", hasMore: false, totalCount: 0, limit: 10, offset: 0, data: [] }));
    expect(await comercial.action(api.rubrica.asaas.listCharges, { limit: 500 })).toMatchObject({ data: [] });
    expect(String(asaas.mock.calls[0]![0])).toContain("/payments?limit=100&offset=0");
    asaas.mockImplementation(async () => json({ id: "cus_9" }));
    await comercial.action(api.rubrica.asaas.adminCreateCustomer, { name: "Ana", cpfCnpj: "123.456.789-00" });
    const log = await t.run((ctx) => ctx.db.query("auditLog").collect());
    expect(log.some((l) => l.targetType === "asaas_customer" && l.targetId === "cus_9")).toBe(true);
    await seedSettings(t, { plugins: { payments: false } });
    await expect(comercial.action(api.rubrica.asaas.listCharges, {})).rejects.toThrow(/desligado/);
  });
});
