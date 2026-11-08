import { describe, expect, it } from "vitest";
import { CONTENT_LABELS, contactDetail, contentLabel, humanizeKey } from "../../src/admin/lib/labels";
import { COLLECTIONS } from "../../src/content/types";

describe("rótulos do painel", () => {
  it("o assunto do contato sai como o texto do formulário", () => {
    expect(contactDetail("topic", "project")).toEqual({ label: "Assunto", value: "Tenho um projeto" });
    expect(contactDetail("topic", "job")).toEqual({ label: "Assunto", value: "Tenho uma vaga" });
    expect(contactDetail("topic", "talk")).toEqual({ label: "Assunto", value: "Quero trocar uma ideia" });
    expect(contactDetail("topic", "other")).toEqual({ label: "Assunto", value: "Outro assunto" });
  });

  it("assunto desconhecido sai como veio", () => {
    expect(contactDetail("topic", "vaga-interna")).toEqual({ label: "Assunto", value: "vaga-interna" });
  });

  it("campo de projeto e da migração têm rótulo", () => {
    expect(contactDetail("project", "Site novo")).toEqual({ label: "Projeto", value: "Site novo" });
    expect(contactDetail("atendidoPor", "Ana")).toEqual({ label: "Atendido por", value: "Ana" });
    expect(contactDetail("situacaoV1", "closed")).toEqual({ label: "Situação na v1", value: "closed" });
  });

  it("campo sem rótulo fixo é humanizado", () => {
    expect(humanizeKey("budgetRange")).toBe("Budget range");
    expect(humanizeKey("prazo_entrega")).toBe("Prazo entrega");
    expect(contactDetail("prazoEntrega", "1 mês").label).toBe("Prazo entrega");
  });

  it("todo nome de coleção tem rótulo em português (ou é tipo do sistema)", () => {
    const semRotulo = COLLECTIONS.filter((c) => !(c in CONTENT_LABELS));
    expect(semRotulo).toEqual([]);
  });

  it("tipo de uso da mídia em português; tipo desconhecido sai como veio", () => {
    expect(contentLabel("page")).toBe("página");
    expect(contentLabel("posts")).toBe("post");
    expect(contentLabel("outraCoisa")).toBe("outraCoisa");
  });
});
