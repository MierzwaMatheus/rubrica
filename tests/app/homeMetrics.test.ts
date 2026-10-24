import { describe, it, expect } from "vitest";
import { parseHomeMetrics, localizeMetric } from "@/utils/homeMetrics";

describe("parseHomeMetrics", () => {
  it("keeps items with value and label, in order", () => {
    const raw = [
      { value: "8+", label: "anos de experiência" },
      { value: "", label: "sem valor" },
      { value: "40", label: "" },
      { value: "1.200", label: "agendamentos por mês" },
    ];
    expect(parseHomeMetrics(raw).map(m => m.value)).toEqual(["8+", "1.200"]);
  });

  it("returns an empty list for anything that is not an array", () => {
    expect(parseHomeMetrics(undefined)).toEqual([]);
    expect(parseHomeMetrics({ value: "1" })).toEqual([]);
  });

  it("caps the list at 4, the size of the strip", () => {
    const raw = Array.from({ length: 6 }, (_, i) => ({ value: `${i}`, label: `m${i}` }));
    expect(parseHomeMetrics(raw)).toHaveLength(4);
  });
});

describe("localizeMetric", () => {
  const m = { value: "8+", label: "anos", labelTranslations: { ptBR: "anos de experiência", enUS: "years of experience" } };

  it("uses the label in the current language", () => {
    expect(localizeMetric(m, "en-US")).toEqual({ value: "8+", label: "years of experience" });
  });

  it("falls back to Portuguese, then to the base label", () => {
    expect(localizeMetric({ ...m, labelTranslations: { ptBR: "anos de experiência" } }, "en-US").label).toBe("anos de experiência");
    expect(localizeMetric({ value: "8+", label: "anos" }, "en-US").label).toBe("anos");
  });
});

import { buildHomeMetricsValue } from "@/components/admin/HomeMetricsEditor";

describe("buildHomeMetricsValue", () => {
  it("drops rows without number or Portuguese label and keeps EN when filled", () => {
    const value = buildHomeMetricsValue([
      { value: " 8+ ", labelPT: "anos", labelEN: "years" },
      { value: "", labelPT: "vazio", labelEN: "" },
      { value: "3", labelPT: " ", labelEN: "x" },
      { value: "30", labelPT: "produtos", labelEN: "" },
    ]);
    expect(value).toEqual([
      { value: "8+", label: "anos", labelTranslations: { ptBR: "anos", enUS: "years" } },
      { value: "30", label: "produtos", labelTranslations: { ptBR: "produtos" } },
    ]);
  });
});
