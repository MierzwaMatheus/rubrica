import { describe, it, expect } from "vitest";
import {
  generatePaymentMethods,
  generateContractContent,
  applyProposalToTemplate,
  resolveTemplateContent,
} from "@/utils/contractGenerator";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";

describe("contractGenerator · generatePaymentMethods", () => {
  it("returns 4 payment methods with PIX 10% discount, 3x and 12x", () => {
    const methods = generatePaymentMethods(1000);
    expect(methods).toHaveLength(4);
    expect(methods[0]).toContain("PIX");
    expect(methods[0]).toContain("900,00"); // 10% off
    expect(methods[1]).toContain("50/50");
    expect(methods[2]).toContain("3x sem juros");
    expect(methods[2]).toContain("333,33");
    expect(methods[3]).toContain("12x com juros");
  });

  it("formats values with pt-BR locale (period thousands, comma decimals)", () => {
    const methods = generatePaymentMethods(15000);
    expect(methods[0]).toContain("13.500,00");
    expect(methods[2]).toContain("5.000,00");
  });

  it("handles small values without errors", () => {
    const methods = generatePaymentMethods(10);
    expect(methods[0]).toContain("9,00");
    expect(methods[2]).toContain("3,33");
  });
});

const baseProposal = {
  client_name: "Acme",
  objective: "Build a website",
  investment_value: 1000,
};

const baseAcceptance = {
  client_name: "John Doe",
  client_document: "12345678900",
  client_email: "john@x.com",
  accepted_at: "2024-01-01T00:00:00Z",
};

describe("contractGenerator · generateContractContent", () => {
  it("formats CPF (11 digits) into masked CPF", () => {
    const { header } = generateContractContent(baseProposal, baseAcceptance);
    expect(header).toContain("123.456.789-00");
    expect(header).toContain("CPF");
  });

  it("formats CNPJ (14 digits) into masked CNPJ", () => {
    const { header } = generateContractContent(baseProposal, {
      ...baseAcceptance,
      client_document: "12345678000190",
    });
    expect(header).toContain("12.345.678/0001-90");
    expect(header).toContain("CNPJ");
  });

  it("preserves an already-formatted document as-is", () => {
    const { header } = generateContractContent(baseProposal, {
      ...baseAcceptance,
      client_document: "123.456.789-00",
    });
    expect(header).toContain("123.456.789-00");
  });

  it("omits CONTRATANTE document segment when not provided", () => {
    const { header } = generateContractContent(baseProposal, {
      ...baseAcceptance,
      client_document: "",
    });
    // CONTRATANTE block should not have a document
    expect(header).toMatch(/CONTRATANTE:\*\* John Doe,/);
    expect(header).not.toMatch(/CONTRATANTE:\*\* John Doe, inscrito/);
  });

  it("includes email in header when present, omits otherwise", () => {
    const { header } = generateContractContent(baseProposal, baseAcceptance);
    expect(header).toContain("john@x.com");

    const { header: noEmail } = generateContractContent(baseProposal, {
      ...baseAcceptance,
      client_email: "",
    });
    expect(noEmail).not.toContain("e-mail");
  });

  it("Cláusula 1: handles objective as string", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    expect(clauses[0]).toContain("CLÁUSULA 1");
    expect(clauses[0]).toContain("Build a website");
  });

  it("Cláusula 1: joins objective array with double newlines", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, objective: ["Goal A", "Goal B"] },
      baseAcceptance,
    );
    expect(clauses[0]).toContain("Goal A");
    expect(clauses[0]).toContain("Goal B");
  });

  it("Cláusula 2: omitted when scope is undefined", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    const allText = clauses.join("");
    expect(allText).not.toContain("CLÁUSULA 2");
  });

  it("Cláusula 2: includes when scope is array", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, scope: ["Item A", "Item B"] },
      baseAcceptance,
    );
    const allText = clauses.join("");
    expect(allText).toContain("CLÁUSULA 2");
    expect(allText).toContain("- Item A");
    expect(allText).toContain("- Item B");
  });

  it("Cláusula 3: omitted when timeline is empty/undefined", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    expect(clauses.join("")).not.toContain("CLÁUSULA 3");

    const { clauses: c2 } = generateContractContent(
      { ...baseProposal, timeline: [] },
      baseAcceptance,
    );
    expect(c2.join("")).not.toContain("CLÁUSULA 3");
  });

  it("Cláusula 3: formats timeline items and adds delivery_date", () => {
    const { clauses } = generateContractContent(
      {
        ...baseProposal,
        timeline: [{ step: "Design", period: "2 weeks" }],
        delivery_date: "2024-12-31",
      },
      baseAcceptance,
    );
    const allText = clauses.join("");
    expect(allText).toContain("CLÁUSULA 3");
    expect(allText).toContain("- Design - 2 weeks");
    expect(allText).toMatch(/Entrega prevista/);
  });

  it("Cláusula 4: uses provided payment_methods when present", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, payment_methods: ["Custom A", "Custom B"] },
      baseAcceptance,
    );
    const c4 = clauses.find((c) => c.includes("CLÁUSULA 4"))!;
    expect(c4).toContain("- Custom A");
    expect(c4).toContain("- Custom B");
  });

  it("Cláusula 4: falls back to default generated payment methods (4 items)", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    const c4 = clauses.find((c) => c.includes("CLÁUSULA 4"))!;
    expect(c4).toContain("PIX");
    expect(c4).toContain("50/50");
  });

  it("Cláusula 4: formats investment value as pt-BR currency", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, investment_value: 12345.67 },
      baseAcceptance,
    );
    const c4 = clauses.find((c) => c.includes("CLÁUSULA 4"))!;
    expect(c4).toContain("12.345,67");
  });

  it("Cláusula 5: omitted when conditions empty", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    expect(clauses.join("")).not.toContain("CLÁUSULA 5");
  });

  it("Cláusula 5: lists conditions when provided", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, conditions: ["Cond A"] },
      baseAcceptance,
    );
    expect(clauses.join("")).toContain("CLÁUSULA 5");
    expect(clauses.join("")).toContain("- Cond A");
  });

  it("Cláusula 10: uses custom rescision_policy when provided", () => {
    const { clauses } = generateContractContent(
      { ...baseProposal, rescision_policy: "Custom rescission text" },
      baseAcceptance,
    );
    const c10 = clauses.find((c) => c.includes("CLÁUSULA 10"))!;
    expect(c10).toContain("Custom rescission text");
  });

  it("Cláusula 10: falls back to DEFAULT_RESCISION_POLICY", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    const c10 = clauses.find((c) => c.includes("CLÁUSULA 10"))!;
    expect(c10).toContain(DEFAULT_RESCISION_POLICY);
  });

  it("includes Cláusulas 6, 7, 8, 9, 11, 12 always", () => {
    const { clauses } = generateContractContent(baseProposal, baseAcceptance);
    const text = clauses.join("");
    expect(text).toContain("CLÁUSULA 6");
    expect(text).toContain("CLÁUSULA 7");
    expect(text).toContain("CLÁUSULA 8");
    expect(text).toContain("CLÁUSULA 9");
    expect(text).toContain("CLÁUSULA 11");
    expect(text).toContain("CLÁUSULA 12");
  });

  it("does not include hardcoded contractor personal data in header", () => {
    const { header } = generateContractContent(baseProposal, baseAcceptance);
    expect(header).not.toContain("MATHEUS MIERZWA");
    expect(header).not.toContain("57.900.589");
  });
});

describe("contractGenerator · applyProposalToTemplate", () => {
  it("substitutes {{client_name}} with acceptance.client_name", () => {
    const result = applyProposalToTemplate(
      "Contrato para {{client_name}}.",
      baseProposal,
      baseAcceptance,
    );
    expect(result).toBe("Contrato para John Doe.");
  });

  it("substitutes {{scope}} with formatArrayAsList output", () => {
    const result = applyProposalToTemplate(
      "Escopo:\n{{scope}}",
      { ...baseProposal, scope: ["Item A", "Item B"] },
      baseAcceptance,
    );
    expect(result).toBe("Escopo:\n• Item A\n• Item B");
  });

  it("substitutes {{conditions}} with formatArrayAsList output", () => {
    const result = applyProposalToTemplate(
      "Condições:\n{{conditions}}",
      { ...baseProposal, conditions: ["Cond C"] },
      baseAcceptance,
    );
    expect(result).toBe("Condições:\n• Cond C");
  });

  it("returns empty string for empty template", () => {
    expect(applyProposalToTemplate("", baseProposal, baseAcceptance)).toBe("");
  });

  it("preserves {{unknown}} variable when not in map", () => {
    const result = applyProposalToTemplate(
      "{{unknown_var}} e {{client_name}}",
      baseProposal,
      baseAcceptance,
    );
    expect(result).toBe("{{unknown_var}} e John Doe");
  });

  it("substitutes {{client_document}} with CPF mask for 11 digits", () => {
    const result = applyProposalToTemplate(
      "Doc: {{client_document}}",
      baseProposal,
      { ...baseAcceptance, client_document: "12345678900" },
    );
    expect(result).toBe("Doc: 123.456.789-00");
  });

  it("substitutes {{client_document}} with CNPJ mask for 14 digits", () => {
    const result = applyProposalToTemplate(
      "Doc: {{client_document}}",
      baseProposal,
      { ...baseAcceptance, client_document: "12345678000190" },
    );
    expect(result).toBe("Doc: 12.345.678/0001-90");
  });

  it("substitutes {{investment_value}} with pt-BR currency format", () => {
    const result = applyProposalToTemplate(
      "Valor: {{investment_value}}",
      { ...baseProposal, investment_value: 1500 },
      baseAcceptance,
    );
    expect(result).toBe("Valor: R$ 1.500,00");
  });

  it("substitutes {{accepted_at}} with pt-BR date", () => {
    const result = applyProposalToTemplate(
      "Aceito em: {{accepted_at}}",
      baseProposal,
      { ...baseAcceptance, accepted_at: "2024-06-15T00:00:00Z" },
    );
    expect(result).toBe("Aceito em: 15/06/2024");
  });

  it("substitutes {{timeline}} with formatted step - period lines", () => {
    const result = applyProposalToTemplate(
      "Cronograma:\n{{timeline}}",
      {
        ...baseProposal,
        timeline: [
          { step: "Design", period: "1 semana" },
          { step: "Dev", period: "2 semanas" },
        ],
      },
      baseAcceptance,
    );
    expect(result).toBe("Cronograma:\n• Design – 1 semana\n• Dev – 2 semanas");
  });
});

describe("contractGenerator · resolveTemplateContent", () => {
  it("returns templateSnapshot when present", () => {
    const result = resolveTemplateContent(
      { templateSnapshot: "### CLÁUSULA\nConteúdo" },
      { content: "outro template" },
    );
    expect(result).toBe("### CLÁUSULA\nConteúdo");
  });

  it("falls back to defaultTemplate.content when templateSnapshot is absent", () => {
    const result = resolveTemplateContent(
      { templateSnapshot: null },
      { content: "default content" },
    );
    expect(result).toBe("default content");
  });

  it("returns undefined for legacy proposals with no template", () => {
    expect(resolveTemplateContent({}, null)).toBeUndefined();
    expect(resolveTemplateContent({ templateSnapshot: null }, null)).toBeUndefined();
    expect(resolveTemplateContent({}, undefined)).toBeUndefined();
  });
});
