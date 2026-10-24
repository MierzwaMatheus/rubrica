import { describe, it, expect } from "vitest";
import { selectFeaturedCases, highlightNumbers } from "@/utils/homeContent";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

const project = (over: Partial<Project>): Project => ({
  id: 1,
  title: "P",
  description: "",
  long_description: "",
  tags: [],
  images: [],
  demo_link: "",
  github_link: "",
  ...over,
});

const caseStudy = { problem: "p", solution: "s", results: "r", metrics: [] };

describe("selectFeaturedCases", () => {
  it("keeps only projects that have a slug and a case study", () => {
    const list = [
      project({ id: 1, slug: "a", case_study: caseStudy }),
      project({ id: 2, slug: "b" }),
      project({ id: 3, case_study: caseStudy }),
      project({ id: 4, slug: "d", case_study: caseStudy }),
    ];
    expect(selectFeaturedCases(list).map(p => p.id)).toEqual([1, 4]);
  });

  it("respects the order of the list and the limit", () => {
    const list = [5, 6, 7, 8].map(id => project({ id, slug: `s${id}`, case_study: caseStudy }));
    expect(selectFeaturedCases(list, 3).map(p => p.id)).toEqual([5, 6, 7]);
  });

  it("returns an empty list when nothing qualifies", () => {
    expect(selectFeaturedCases([project({})])).toEqual([]);
  });
});

describe("highlightNumbers", () => {
  const marked = (text: string) =>
    highlightNumbers(text).filter(s => s.highlight).map(s => s.text);

  it("marks numbers with their unit", () => {
    expect(marked("cerca de 50 skills e automações em produção para 8 áreas")).toEqual([
      "50 skills",
      "8 áreas",
    ]);
  });

  it("handles thousands separators and time units", () => {
    expect(marked("mais de 1.800 chamados; de 3 horas em 13 minutos")).toEqual([
      "1.800 chamados",
      "3 horas",
      "13 minutos",
    ]);
  });

  it("keeps the full text when joined back", () => {
    const text = "Em 4 meses, entregamos cerca de 50 skills.";
    expect(highlightNumbers(text).map(s => s.text).join("")).toBe(text);
  });

  it("does not mark numbers glued to words, like InTable 2.0 or WCAG", () => {
    expect(marked("o site 2026, o InTable 2.0 com acessibilidade WCAG")).toEqual([]);
  });
});
