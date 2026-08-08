import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  generateContractHTML,
  printContractPDF,
  formatClauseContent,
  parseTemplateContent,
} from "@/utils/contractPDF";

const baseProposal = {
  client_name: "Acme",
  objective: "Build a website",
  scope: ["Item A"],
  timeline: [{ step: "Design", period: "2 weeks" }],
  delivery_date: "2024-12-31",
  investment_value: 1000,
  payment_methods: ["PIX 100%"],
  conditions: ["Cond A"],
  rescision_policy: "Custom rescission",
  slug: "acme",
  version: 3,
};

const baseAcceptance = {
  client_name: "John Doe",
  client_document: "12345678900",
  client_email: "john@x.com",
  accepted_at: "2024-06-15T10:00:00Z",
  ip_address: "1.2.3.4",
  user_agent: "Mozilla/5.0",
  content_hash: "abc123hash",
};

describe("contractPDF · generateContractHTML", () => {
  it("renders DOCTYPE html and Portuguese lang", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "data:image/png;base64,xxx");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toMatch(/<html lang="pt-BR"/);
  });

  it("includes the contract slug in the title", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    expect(html).toMatch(/<title>Contrato Eletrônico — ACME<\/title>/);
  });

  it("formats accepted_at in pt-BR with Sao Paulo timezone", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    // 2024-06-15T10:00:00Z = 07:00 in Sao Paulo (UTC-3, no DST in June)
    expect(html).toContain("15/06/2024");
    expect(html).toContain("07:00:00");
  });

  it("includes the signature data URL", () => {
    const html = generateContractHTML(
      baseProposal,
      baseAcceptance,
      "data:image/png;base64,SIGNATURE",
    );
    expect(html).toContain("data:image/png;base64,SIGNATURE");
  });

  it("renders empty contractor name when no contactInfo provided", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "", undefined, "");
    expect(html).not.toContain("MATHEUS MIERZWA");
    expect(html).not.toContain("57.900.589");
  });

  it("uses provided contactInfo name (uppercased) when present", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "", {
      name: "Custom Contractor",
      email: "custom@x.com",
      linkedinUrl: "https://www.linkedin.com/in/custom",
      githubUrl: "https://github.com/custom",
    });
    expect(html).toContain("CUSTOM CONTRACTOR");
    expect(html).toContain("custom@x.com");
    // strips http(s):// and www.
    expect(html).toContain("linkedin.com/in/custom");
    expect(html).toContain("github.com/custom");
  });

  it("converts markdown bold (**...**) to <strong> in clauses", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    // Cláusula 6 has **Transferência de Titularidade:** in source
    expect(html).toMatch(/<strong>Transferência de Titularidade:<\/strong>/);
  });

  it("converts list items (- item) to <ul><li>...</li></ul>", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    expect(html).toMatch(/<ul>[^]*<li>Item A<\/li>[^]*<\/ul>/);
  });

  it("renders all clauses present in the proposal", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    expect(html).toContain("CLÁUSULA 1");
    expect(html).toContain("CLÁUSULA 4");
    expect(html).toContain("CLÁUSULA 12");
  });

  it("includes audit info (IP, hash) in the metadata block", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    expect(html).toContain("1.2.3.4");
    expect(html).toContain("abc123hash");
  });

  it("converts numbered list items (1. item) to <ol><li>...</li></ol>", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    // Cláusulas 6–9 do template contêm itens "1. **texto**" que devem virar <ol><li>
    expect(html).toMatch(/<ol>[^]*<li>[^]*Transferência de Titularidade[^]*<\/li>[^]*<\/ol>/);
  });

  it("groups consecutive numbered items into a single <ol>", () => {
    const html = generateContractHTML(baseProposal, baseAcceptance, "");
    // Cláusula 6 tem itens "1. ..." e "2. ..." consecutivos — devem formar um único <ol>
    const olMatches = html.match(/<ol>/g) ?? [];
    expect(olMatches.length).toBeGreaterThanOrEqual(1);
    // O primeiro <ol> deve conter múltiplos <li> (não múltiplos <ol>)
    const firstOl = html.match(/<ol>([\s\S]*?)<\/ol>/)?.[0] ?? "";
    const liCount = (firstOl.match(/<li>/g) ?? []).length;
    expect(liCount).toBeGreaterThan(1);
  });

  it("handles bullet and numbered lists in same clause without mixing tags", () => {
    const html = generateContractHTML(
      { ...baseProposal, rescision_policy: "- Alpha\n1. Beta" },
      baseAcceptance,
      "",
    );
    expect(html).toMatch(/<ul>[^]*<li>Alpha<\/li>[^]*<\/ul>/);
    expect(html).toMatch(/<ol>[^]*<li>Beta<\/li>[^]*<\/ol>/);
  });

  it("uses contractId='—' fallback when slug missing", () => {
    const { slug: _slug, ...noSlug } = baseProposal as any;
    void _slug;
    const html = generateContractHTML(noSlug, baseAcceptance, "");
    expect(html).toContain("Contrato Eletrônico — —");
  });
});

describe("formatClauseContent", () => {
  it("converte **bold** para <strong>", () => {
    expect(formatClauseContent("**negrito**")).toContain("<strong>negrito</strong>");
  });

  it("converte ### Título para <strong>", () => {
    expect(formatClauseContent("### Meu Título")).toContain("<strong>Meu Título</strong>");
  });

  it("converte - item para <ul><li>", () => {
    const result = formatClauseContent("- Alpha\n- Beta");
    expect(result).toMatch(/<ul>[^]*<li>Alpha<\/li>[^]*<\/ul>/);
    expect(result).toContain("<li>Beta</li>");
  });

  it("converte 1. item para <ol><li>", () => {
    const result = formatClauseContent("1. Primeiro\n2. Segundo");
    expect(result).toMatch(/<ol>[^]*<li>Primeiro<\/li>[^]*<\/ol>/);
  });

  it("mantém {{variavel}} literalmente sem interpolar", () => {
    const result = formatClauseContent("Assinado por {{client_name}}.");
    expect(result).toContain("{{client_name}}");
  });

  it("converte \\n\\n em quebra de parágrafo", () => {
    const result = formatClauseContent("Parágrafo A\n\nParágrafo B");
    expect(result).toContain("</p><p>");
  });
});

describe("parseTemplateContent", () => {
  it("separa header de cláusulas pelo marcador ###", () => {
    const content = "Cabeçalho\n### CLÁUSULA 1\nCorpo 1\n### CLÁUSULA 2\nCorpo 2";
    const { header, clauses } = parseTemplateContent(content);
    expect(header).toContain("Cabeçalho");
    expect(clauses).toHaveLength(2);
    expect(clauses[0]).toContain("CLÁUSULA 1");
    expect(clauses[1]).toContain("CLÁUSULA 2");
  });

  it("retorna header vazio e array vazio para conteúdo sem ###", () => {
    const { header, clauses } = parseTemplateContent("Só cabeçalho");
    expect(header).toContain("Só cabeçalho");
    expect(clauses).toHaveLength(0);
  });
});

describe("contractPDF · printContractPDF", () => {
  let openSpy: any;
  let revokeSpy: any;
  let createSpy: any;

  beforeEach(() => {
    openSpy = vi.spyOn(window, "open");
    revokeSpy = vi.fn();
    createSpy = vi.fn(() => "blob:mock-url");
    Object.defineProperty(window, "URL", {
      value: { createObjectURL: createSpy, revokeObjectURL: revokeSpy },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens a new window with the blob URL", async () => {
    const fakeWin = { onload: null as any, print: vi.fn() };
    openSpy.mockReturnValue(fakeWin as any);

    await printContractPDF(baseProposal, baseAcceptance, "");

    expect(createSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith("blob:mock-url", "_blank");
  });

  it("throws when popup is blocked and revokes the URL", async () => {
    openSpy.mockReturnValue(null);

    await expect(
      printContractPDF(baseProposal, baseAcceptance, ""),
    ).rejects.toThrow("Popup bloqueado");
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock-url");
  });
});
