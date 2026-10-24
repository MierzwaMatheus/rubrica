import { describe, it, expect } from "vitest";
import { listCategories, filterByCategory, nextCase, hasCaseStudy } from "@/utils/portfolioContent";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

const cs = { problem: "p", solution: "s", results: "r", metrics: [] };
const p = (id: number, over: Partial<Project> = {}): Project => ({
  id, title: `P${id}`, description: "", long_description: "", tags: [], images: [], demo_link: "", github_link: "", ...over,
});

describe("listCategories", () => {
  it("returns distinct categories in project order", () => {
    const list = [p(1, { category: "IA" }), p(2, { category: "Marca" }), p(3, { category: "IA" }), p(4)];
    expect(listCategories(list)).toEqual(["IA", "Marca"]);
  });
  it("ignores blank categories", () => {
    expect(listCategories([p(1, { category: "  " }), p(2)])).toEqual([]);
  });
});

describe("filterByCategory", () => {
  const list = [p(1, { category: "IA" }), p(2, { category: "Marca" })];
  it("returns all when category is null", () => {
    expect(filterByCategory(list, null)).toHaveLength(2);
  });
  it("keeps only the chosen category", () => {
    expect(filterByCategory(list, "Marca").map(x => x.id)).toEqual([2]);
  });
});

describe("hasCaseStudy", () => {
  it("needs both slug and case study", () => {
    expect(hasCaseStudy(p(1, { slug: "a", case_study: cs }))).toBe(true);
    expect(hasCaseStudy(p(1, { slug: "a" }))).toBe(false);
    expect(hasCaseStudy(p(1, { case_study: cs }))).toBe(false);
  });
});

describe("nextCase", () => {
  const list = [
    p(1, { slug: "a", case_study: cs }),
    p(2, { slug: "b" }),
    p(3, { slug: "c", case_study: cs }),
    p(4, { slug: "d", case_study: cs }),
  ];
  it("returns the next project with a case study, skipping others", () => {
    expect(nextCase(list, "a")?.slug).toBe("c");
  });
  it("wraps around to the first", () => {
    expect(nextCase(list, "d")?.slug).toBe("a");
  });
  it("returns null when there is no other case", () => {
    expect(nextCase([p(1, { slug: "a", case_study: cs })], "a")).toBeNull();
  });
  it("returns the first case when the current slug is unknown", () => {
    expect(nextCase(list, "zzz")?.slug).toBe("a");
  });
});
