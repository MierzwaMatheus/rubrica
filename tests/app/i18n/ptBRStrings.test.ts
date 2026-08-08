import { describe, it, expect } from "vitest";
import { ptBR } from "../../../src/i18n/translations/pt-BR";

describe("pt-BR — strings devem estar em português", () => {
  it("portfolio.liveDemo não está em inglês", () => {
    expect(ptBR.portfolio.liveDemo).not.toBe("Live Demo");
  });

  it("portfolio.caseStudy não está em inglês", () => {
    expect(ptBR.portfolio.caseStudy).not.toBe("Case Study");
  });

  it("sidebar.terminalHint não está em inglês", () => {
    expect(ptBR.sidebar.terminalHint).not.toBe("Press ~ for terminal");
  });
});
