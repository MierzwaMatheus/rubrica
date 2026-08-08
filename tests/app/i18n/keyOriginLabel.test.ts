import { describe, it, expect } from "vitest";
import { formatPathToLabel, getKeyOriginLabel } from "@/i18n/utils/keyOriginLabel";

describe("formatPathToLabel — Ciclo 1: caminho → label legível", () => {
  it("retorna nome do componente sem extensão para caminho simples em components/", () => {
    expect(formatPathToLabel("components/AvailabilityBadge.tsx")).toBe("AvailabilityBadge");
  });

  it("retorna 'Pasta → Componente' quando há pasta intermediária não genérica", () => {
    expect(formatPathToLabel("components/home/Hero.tsx")).toBe("Home → Hero");
  });

  it("retorna nome do componente sem extensão para caminho em pages/", () => {
    expect(formatPathToLabel("pages/Login.tsx")).toBe("Login");
  });

  it("remove extensão .ts (sem x)", () => {
    expect(formatPathToLabel("utils/helper.ts")).toBe("helper");
  });

  it("capitaliza a pasta intermediária no label", () => {
    expect(formatPathToLabel("components/about/Section.tsx")).toBe("About → Section");
  });
});

describe("getKeyOriginLabel — Ciclo 2: manifesto → label por chave", () => {
  const manifest = {
    "home.availability.label": [{ file: "components/AvailabilityBadge.tsx", line: 10 }],
    "home.hero.title": [{ file: "components/home/Hero.tsx", line: 5 }],
  };

  it("retorna label formatado quando chave existe no manifesto", () => {
    expect(getKeyOriginLabel("home.availability.label", manifest)).toBe("AvailabilityBadge");
  });

  it("usa o primeiro arquivo quando há múltiplas entradas no manifesto", () => {
    expect(getKeyOriginLabel("home.hero.title", manifest)).toBe("Home → Hero");
  });

  it("retorna o namespace (primeiro segmento) quando chave não existe no manifesto", () => {
    expect(getKeyOriginLabel("home.title", manifest)).toBe("home");
  });

  it("retorna o namespace quando manifesto está vazio", () => {
    expect(getKeyOriginLabel("contactWizard.step", {})).toBe("contactWizard");
  });
});
