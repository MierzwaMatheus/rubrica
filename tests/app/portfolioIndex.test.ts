// @vitest-environment node
import { describe, it, expect } from "vitest";
import { compactImages, compactProject, projectIndexEntry } from "../../scripts/lib/portfolioIndex";

const full = {
  _id: "p1",
  title: "Projeto",
  slug: "projeto",
  description: "curta",
  longDescription: "uma descrição longa",
  longDescriptionTranslations: { ptBR: "uma descrição longa", enUS: "a long description!" },
  images: [{ url: "/media/a.webp", createdBy: "u1", folderId: "f1", tags: ["x"] }, "/media/b.webp", { url: "" }],
  imageIds: ["i1"],
  caseStudy: {
    problem: "problema",
    solution: "solução",
    results: "resultados",
    metrics: [{ value: "40%", label: "menos tempo" }],
    testimonial: { quote: "ótimo" },
  },
  caseStudyTranslations: {
    enUS: { problem: "problem", metrics: [{ value: "40%", label: "less time" }] },
    ptBR: { problem: "problema" },
  },
};

describe("portfolioIndex", () => {
  it("imagens só com a URL", () => {
    expect(compactImages(full.images)).toEqual(["/media/a.webp", "/media/b.webp"]);
    expect(compactProject(full).images).toEqual(["/media/a.webp", "/media/b.webp"]);
    expect(compactProject(full).caseStudy).toEqual(full.caseStudy); // arquivo completo mantém o case
  });

  it("índice: case só com as métricas, sem descrição longa e com o tamanho dela", () => {
    const entry = projectIndexEntry(full);
    expect(entry.caseStudy).toEqual({ metrics: [{ value: "40%", label: "menos tempo" }] });
    expect(entry.caseStudyTranslations).toEqual({ enUS: { metrics: [{ value: "40%", label: "less time" }] }, ptBR: {} });
    expect(entry).not.toHaveProperty("longDescription");
    expect(entry).not.toHaveProperty("longDescriptionTranslations");
    expect(entry).not.toHaveProperty("imageIds");
    expect(entry.longDescriptionChars).toEqual({ ptBR: 19, enUS: 19 });
    expect(entry.slug).toBe("projeto");
  });

  it("projeto sem case nem descrição longa", () => {
    const entry = projectIndexEntry({ _id: "p2", title: "Simples" });
    expect(entry).not.toHaveProperty("caseStudy");
    expect(entry.longDescriptionChars).toEqual({ ptBR: 0, enUS: 0 });
  });
});
