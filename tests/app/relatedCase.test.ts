import { describe, it, expect } from "vitest";
import { findRelatedCase } from "@/utils/relatedCase";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

const cs = { problem: "p", solution: "s", results: "r", metrics: [] };
const project = (over: Partial<Project>): Project => ({
  id: 1, title: "P", description: "", long_description: "", tags: [], images: [], demo_link: "", github_link: "", ...over,
});

describe("findRelatedCase", () => {
  it("returns the first case sharing a tag, ignoring case", () => {
    const list = [
      project({ id: 1, slug: "a", case_study: cs, tags: ["React"] }),
      project({ id: 2, slug: "b", case_study: cs, tags: ["Governança de IA"] }),
      project({ id: 3, slug: "c", case_study: cs, tags: ["governança de ia"] }),
    ];
    expect(findRelatedCase(["GOVERNANÇA DE IA"], list)?.id).toBe(2);
  });

  it("skips projects without slug or case study", () => {
    const list = [
      project({ id: 1, tags: ["IA"], case_study: cs }),
      project({ id: 2, slug: "b", tags: ["IA"] }),
      project({ id: 3, slug: "c", case_study: cs, tags: ["IA"] }),
    ];
    expect(findRelatedCase(["IA"], list)?.id).toBe(3);
  });

  it("returns undefined without tags or matches", () => {
    const list = [project({ slug: "a", case_study: cs, tags: ["React"] })];
    expect(findRelatedCase([], list)).toBeUndefined();
    expect(findRelatedCase(undefined, list)).toBeUndefined();
    expect(findRelatedCase(["Vue"], list)).toBeUndefined();
  });
});
