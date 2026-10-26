import { describe, it, expect } from "vitest";
import {
  localizeMetrics,
  metricFieldsToTranslate,
  buildTranslatedMetrics,
} from "@/utils/caseStudyMetrics";

const base = [
  { label: "ordens de serviço emitidas", value: "365", icon: "clipboard" },
  { label: "fotos em cada ordem", value: "Entrada + saída", icon: "camera" },
];

describe("localizeMetrics", () => {
  it("troca label e value pela tradução e mantém o ícone", () => {
    const out = localizeMetrics(base, [
      { label: "service orders issued", value: "365" },
      { label: "photos in each order", value: "Check-in + check-out" },
    ]);
    expect(out).toEqual([
      { label: "service orders issued", value: "365", icon: "clipboard" },
      { label: "photos in each order", value: "Check-in + check-out", icon: "camera" },
    ]);
  });

  it("cai no original quando falta a tradução de um card", () => {
    const out = localizeMetrics(base, [{ label: "service orders issued", value: "" }]);
    expect(out[0]).toEqual({ label: "service orders issued", value: "365", icon: "clipboard" });
    expect(out[1]).toEqual(base[1]);
  });

  it("devolve o original sem tradução", () => {
    expect(localizeMetrics(base, undefined)).toBe(base);
  });
});

describe("metricFieldsToTranslate", () => {
  it("pede tradução só do texto com letras", () => {
    expect(metricFieldsToTranslate(base)).toEqual({
      "metric.0.label": "ordens de serviço emitidas",
      "metric.1.label": "fotos em cada ordem",
      "metric.1.value": "Entrada + saída",
    });
  });

  it("pula o que não mudou e já tem tradução salva", () => {
    const fields = metricFieldsToTranslate(base, base, [
      { label: "service orders issued", value: "365" },
    ]);
    expect(fields).toEqual({
      "metric.1.label": "fotos em cada ordem",
      "metric.1.value": "Entrada + saída",
    });
  });
});

describe("buildTranslatedMetrics", () => {
  it("monta a lista traduzida, reaproveitando a salva e copiando números", () => {
    const out = buildTranslatedMetrics(
      base,
      { "metric.1.label": "photos in each order", "metric.1.value": "Check-in + check-out" },
      base,
      [{ label: "service orders issued", value: "365" }],
    );
    expect(out).toEqual([
      { label: "service orders issued", value: "365" },
      { label: "photos in each order", value: "Check-in + check-out" },
    ]);
  });
});
