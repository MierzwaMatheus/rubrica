import { describe, it, expect } from "vitest";
import { buildProposalPrompt } from "@/utils/proposalPrompt";

describe("buildProposalPrompt", () => {
  it("contains the provided aiContext instead of hardcoded bio", () => {
    const prompt = buildProposalPrompt("Designer com 5 anos em branding.");
    expect(prompt).toContain("Designer com 5 anos em branding.");
    expect(prompt).not.toContain("Arquiteto de Soluções");
    expect(prompt).not.toContain("Tech Lead Frontend");
    expect(prompt).not.toContain("Keycloak");
  });

  it("uses generic fallback when aiContext is empty", () => {
    const prompt = buildProposalPrompt("");
    expect(prompt).not.toContain("Arquiteto de Soluções");
    expect(prompt).not.toContain("Matheus");
    expect(prompt).toContain("Profissional");
  });

  it("contains required JSON structure instructions", () => {
    const prompt = buildProposalPrompt("Qualquer contexto.");
    expect(prompt).toContain("client_name");
    expect(prompt).toContain("investment_value");
    expect(prompt).toContain("JSON");
  });
});
