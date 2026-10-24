import { describe, it, expect } from "vitest";
import { parseWorkPrinciples, localizePrinciple, splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";

describe("parseWorkPrinciples", () => {
  it("returns an empty list for anything that is not an array", () => {
    expect(parseWorkPrinciples(undefined)).toEqual([]);
    expect(parseWorkPrinciples({ title: "x" })).toEqual([]);
  });

  it("drops items without a title and fills a missing description", () => {
    const out = parseWorkPrinciples([{ title: "A" }, { title: "  " }, null, { description: "no title" }]);
    expect(out).toEqual([{ title: "A", description: "" }]);
  });
});

describe("localizePrinciple", () => {
  const p = {
    title: "Base",
    description: "Base desc",
    titleTranslations: { ptBR: "Título", enUS: "Title" },
    descriptionTranslations: { ptBR: "Descrição" },
  };

  it("uses the English text when available", () => {
    expect(localizePrinciple(p, "en-US").title).toBe("Title");
  });

  it("falls back to Portuguese, then to the base text", () => {
    expect(localizePrinciple(p, "en-US").description).toBe("Descrição");
    expect(localizePrinciple({ title: "Só base", description: "d" }, "en-US")).toEqual({ title: "Só base", description: "d" });
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(splitParagraphs("a\n\n  b \n \nc")).toEqual(["a", "b", "c"]);
  });
});

describe("groupSkills", () => {
  const skill = (name: string, group?: string) => ({ translatedContent: { name, group } });

  it("groups by group keeping first-seen order, loose items last", () => {
    const out = groupSkills([skill("React", "Front-end"), skill("Git"), skill("Claude Code", "IA"), skill("Vite", "Front-end")]);
    expect(out.map(g => g.name)).toEqual(["Front-end", "IA", "Stack"]);
    expect(out[0].items.map(i => i.translatedContent.name)).toEqual(["React", "Vite"]);
  });

  it("reads the group from content when there is no translated content", () => {
    expect(groupSkills([{ content: { name: "X", group: "Infra" } }])[0].name).toBe("Infra");
  });

  it("does not create an empty fallback group", () => {
    expect(groupSkills([skill("A", "G")]).map(g => g.name)).toEqual(["G"]);
  });
});

describe("splitExperiences", () => {
  it("keeps the first N visible and the rest collapsed", () => {
    expect(splitExperiences([1, 2, 3, 4])).toEqual({ recent: [1, 2], older: [3, 4] });
    expect(splitExperiences([1])).toEqual({ recent: [1], older: [] });
  });
});

import { moveItem, buildWorkPrinciplesValue } from "@/utils/aboutContent";

describe("moveItem", () => {
  it("swaps with the neighbour", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });
  it("ignores moves past the edges", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
  });
});

describe("buildWorkPrinciplesValue", () => {
  it("uses Portuguese as base, drops empty rows and omits empty English", () => {
    const out = buildWorkPrinciplesValue([
      { titlePT: " Documento antes do código ", descriptionPT: "PRD", titleEN: "Docs first", descriptionEN: "" },
      { titlePT: "  ", descriptionPT: "x", titleEN: "", descriptionEN: "" },
    ]);
    expect(out).toEqual([
      {
        title: "Documento antes do código",
        description: "PRD",
        titleTranslations: { ptBR: "Documento antes do código", enUS: "Docs first" },
        descriptionTranslations: { ptBR: "PRD" },
      },
    ]);
  });

  it("round-trips through parse and localize", () => {
    const value = buildWorkPrinciplesValue([{ titlePT: "A", descriptionPT: "B", titleEN: "C", descriptionEN: "D" }]);
    expect(localizePrinciple(parseWorkPrinciples(value)[0], "en-US")).toEqual({ title: "C", description: "D" });
  });
});
