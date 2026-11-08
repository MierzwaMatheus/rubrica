import { describe, expect, it } from "vitest";
import { dateToInput, formToProposal, inputToDate, proposalStatus, proposalToForm, proposalUrl, validateProposalForm } from "../../src/admin/proposals/model";

const loc = (pt: string) => ({ "pt-BR": pt });
const base = {
  clientName: "Acme",
  title: loc("Site"),
  objective: loc("Objetivo"),
  scope: [loc("Design"), loc("Código")],
  timeline: [{ step: loc("Descoberta"), period: loc("Semana 1") }],
  deliveryDate: "6 semanas",
  investmentValue: 8000,
  paymentMethods: [loc("PIX")],
  conditions: [loc("Duas rodadas")],
  rescissionPolicy: loc("15 dias"),
};

describe("formulário da proposta", () => {
  it("junta escopo, preço e cortesia num item só e separa de volta", () => {
    const content = { ...base, originalValue: 10000, scopePrices: [2000, 3000], giftIndexes: [0] };
    const form = proposalToForm(content);
    expect(form.scope).toEqual([{ text: loc("Design"), price: 2000, gift: true }, { text: loc("Código"), price: 3000 }]);
    expect(formToProposal(form)).toEqual(content);
  });

  it("sem preços, não manda scopePrices nem giftIndexes", () => {
    const out = formToProposal(proposalToForm(base));
    expect(out.scopePrices).toBeUndefined();
    expect(out.giftIndexes).toBeUndefined();
    expect(out.scope).toEqual(base.scope);
  });

  it("preço só em alguns itens vira null nos outros", () => {
    const form = proposalToForm(base);
    (form.scope as { price?: number }[])[1]!.price = 500;
    expect(formToProposal(form).scopePrices).toEqual([null, 500]);
  });

  it("valida o schema e as regras de desconto do backend", () => {
    expect(validateProposalForm(proposalToForm(base))).toEqual({ fields: [] });
    const empty = validateProposalForm({});
    expect(empty.fields.map((e) => e.path)).toContain("clientName");
    const noDiscount = validateProposalForm(proposalToForm({ ...base, originalValue: 7000 }));
    expect(noDiscount.discount).toMatchObject({ path: "originalValue", message: expect.stringContaining("maior") });
    const gift = proposalToForm({ ...base, originalValue: 9000, scopePrices: [1500, 500], giftIndexes: [0] });
    expect(validateProposalForm(gift).discount?.message).toMatch(/brindes passa do desconto/);
    const giftNoPrice = proposalToForm({ ...base, originalValue: 9000, giftIndexes: [0] });
    expect(validateProposalForm(giftNoPrice).discount).toMatchObject({ path: "scope" });
  });
});

describe("estado e link", () => {
  const now = new Date("2026-05-10T12:00:00").getTime();
  it("aceita, expirada, aguardando e lixeira", () => {
    expect(proposalStatus({ isAccepted: true, expiresAt: now - 1 }, now)).toBe("accepted");
    expect(proposalStatus({ isAccepted: false, expiresAt: now - 1 }, now)).toBe("expired");
    expect(proposalStatus({ isAccepted: false, expiresAt: now + 1 }, now)).toBe("pending");
    expect(proposalStatus({ isAccepted: false, expiresAt: now + 1, deletedAt: 1 }, now)).toBe("trash");
  });

  it("monta o link público sem barra duplicada", () => {
    expect(proposalUrl("https://exemplo.com/", "acme-123")).toBe("https://exemplo.com/proposta/acme-123");
  });

  it("converte a data do campo ida e volta (fim do dia)", () => {
    const ms = inputToDate("2026-12-31")!;
    expect(dateToInput(ms)).toBe("2026-12-31");
    expect(new Date(ms).getHours()).toBe(23);
    expect(inputToDate("31/12/2026")).toBeUndefined();
  });
});
