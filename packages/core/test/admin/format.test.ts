import { describe, expect, it } from "vitest";
import {
  centsToInput,
  countState,
  diffVersions,
  formatBRL,
  formatCents,
  formatPlanPrice,
  googlePreview,
  parseMoney,
  planPayability,
  templateVariables,
  timeAgo,
  truncate,
} from "../../src/admin/lib/format";

const nb = (s: string) => s.replace(/ /g, " ");

describe("preço", () => {
  it("formata centavos e reais em pt-BR", () => {
    expect(nb(formatCents(9900))).toBe("R$ 99,00");
    expect(nb(formatBRL(1500))).toBe("R$ 1.500,00");
    expect(nb(formatBRL(0.5))).toBe("R$ 0,50");
  });

  it("lê o que a pessoa digita", () => {
    expect(parseMoney("1.234,56")).toBe(1234.56);
    expect(parseMoney("1234,56")).toBe(1234.56);
    expect(parseMoney("1234.56")).toBe(1234.56);
    expect(parseMoney("R$ 99")).toBe(99);
    expect(parseMoney("1.500")).toBe(1500);
    expect(parseMoney("1,5")).toBe(1.5);
    expect(parseMoney("1.234.567,8")).toBe(1234567.8);
    expect(parseMoney("")).toBeUndefined();
    expect(parseMoney("abc")).toBeUndefined();
    expect(parseMoney("-5")).toBeUndefined();
  });

  it("volta a centavos para o campo", () => {
    expect(centsToInput(9900)).toBe("99,00");
    expect(centsToInput(undefined)).toBe("");
  });

  it("monta o texto do plano com período, ou o texto livre", () => {
    expect(nb(formatPlanPrice({ priceCents: 9900, period: "month" }))).toBe("R$ 99,00 por mês");
    expect(nb(formatPlanPrice({ priceCents: 250000 }))).toBe("R$ 2.500,00");
    expect(formatPlanPrice({ priceLabel: "A partir de R$ 500" })).toBe("A partir de R$ 500");
    expect(formatPlanPrice({})).toBe("Sob consulta");
  });

  it("diz por que o plano não vira link de pagamento", () => {
    expect(planPayability({ priceCents: 9900, period: "once" })).toEqual({ ok: true });
    expect(planPayability({ priceCents: 9900 })).toEqual({ ok: true });
    expect(planPayability({})).toMatchObject({ ok: false });
    expect(planPayability({ priceCents: 100 })).toMatchObject({ ok: false, reason: expect.stringContaining("mínimo") });
    expect(planPayability({ priceCents: 9900, period: "month" })).toMatchObject({ ok: false });
    expect(planPayability({ priceCents: 9900, currency: "USD" })).toMatchObject({ ok: false });
  });
});

describe("SEO", () => {
  it("situação do contador", () => {
    const range = { min: 30, max: 60 };
    expect(countState(0, range)).toBe("empty");
    expect(countState(10, range)).toBe("short");
    expect(countState(45, range)).toBe("good");
    expect(countState(61, range)).toBe("long");
  });

  it("corta como o Google e mostra o caminho", () => {
    expect(truncate("a".repeat(70), 60)).toHaveLength(60);
    expect(truncate("  um   texto  ", 60)).toBe("um texto");
    const g = googlePreview({ title: "t".repeat(80), description: "d".repeat(200), url: "https://exemplo.com/blog/meu-post", siteName: "Exemplo" });
    expect(g.title.endsWith("…")).toBe(true);
    expect(g.description).toHaveLength(160);
    expect(g.breadcrumb).toBe("exemplo.com › blog › meu-post");
    expect(g.site).toBe("Exemplo");
  });
});

describe("versões de proposta", () => {
  const v1 = {
    clientName: "Acme",
    title: { "pt-BR": "Site novo" },
    scope: [{ "pt-BR": "Design" }, { "pt-BR": "Código" }],
    investmentValue: 5000,
    paymentMethods: [{ "pt-BR": "PIX" }],
  };

  it("lista só o que mudou, com valores legíveis", () => {
    const v2 = { ...v1, investmentValue: 4500, originalValue: 5000, scope: [{ "pt-BR": "Design" }, { "pt-BR": "Código" }, { "pt-BR": "Treinamento" }] };
    const changes = diffVersions(v1, v2);
    expect(changes.map((c) => c.field)).toEqual(["scope", "investmentValue", "originalValue"]);
    const value = changes.find((c) => c.field === "investmentValue")!;
    expect(nb(value.before)).toBe("R$ 5.000,00");
    expect(nb(value.after)).toBe("R$ 4.500,00");
    expect(changes.find((c) => c.field === "originalValue")!.before).toBe("—");
    expect(changes.find((c) => c.field === "scope")!.after).toBe("Design · Código · Treinamento");
  });

  it("versões iguais não têm diferença", () => {
    expect(diffVersions(v1, structuredClone(v1))).toEqual([]);
  });
});

describe("contrato e datas", () => {
  it("acha as variáveis do modelo", () => {
    expect(templateVariables("Contrato de {{client_name}} no valor de {{ value }}. {{client_name}}")).toEqual(["client_name", "value"]);
  });

  it("tempo relativo", () => {
    const now = new Date("2026-03-10T12:00:00Z").getTime();
    expect(timeAgo(now - 10_000, now)).toBe("agora");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("há 5 min");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("há 3 h");
    expect(timeAgo(now - 30 * 3_600_000, now)).toBe("ontem");
    expect(timeAgo(now - 3 * 86_400_000, now)).toBe("há 3 dias");
  });
});

describe("atividades e contrato", () => {
  it("descreve a atividade em português", async () => {
    const { describeAudit, unknownVariables } = await import("../../src/admin/lib/format");
    expect(describeAudit({ eventType: "admin.update", targetType: "posts" })).toBe("editou · post");
    expect(describeAudit({ eventType: "admin.publish", targetType: "page" })).toBe("publicou · página");
    expect(describeAudit({ eventType: "testimonial.approved", targetType: "testimonials" })).toBe("aprovou um depoimento enviado");
    expect(describeAudit({ eventType: "outra.coisa", success: false })).toBe("outra.coisa (falhou)");
    expect(unknownVariables("{{client_name}} {{foo_bar}} {{scope}}")).toEqual(["foo_bar"]);
  });
});
