import { describe, it, expect } from "vitest";
import {
  localizeTestimonial,
  testimonialTargetLocale,
  testimonialFieldsToTranslate,
  buildTranslatedTestimonial,
} from "@/utils/caseStudyTestimonial";

const ptTestimonial = { text: "Mudou nosso dia a dia.", author: "Ana", role: "Diretora" };
const translations = {
  "en-US": { testimonial: { text: "It changed our routine.", role: "Director" } },
};

describe("localizeTestimonial", () => {
  it("no idioma original devolve o depoimento como está", () => {
    expect(localizeTestimonial(ptTestimonial, translations, "pt-BR")).toBe(ptTestimonial);
  });

  it("no outro idioma mostra a tradução e guarda o original", () => {
    expect(localizeTestimonial(ptTestimonial, translations, "en-US")).toEqual({
      text: "It changed our routine.",
      author: "Ana",
      role: "Director",
      original: { text: "Mudou nosso dia a dia.", role: "Diretora", lang: "pt-BR" },
    });
  });

  it("depoimento original em inglês é traduzido para o português", () => {
    const en = { text: "Great work.", author: "John", lang: "en-US" as const };
    const out = localizeTestimonial(en, { "pt-BR": { testimonial: { text: "Ótimo trabalho." } } }, "pt-BR");
    expect(out?.text).toBe("Ótimo trabalho.");
    expect(out?.original).toEqual({ text: "Great work.", role: undefined, lang: "en-US" });
  });

  it("sem tradução salva mostra o original sem aviso", () => {
    expect(localizeTestimonial(ptTestimonial, undefined, "en-US")).toBe(ptTestimonial);
  });

  it("sem depoimento devolve undefined", () => {
    expect(localizeTestimonial(undefined, translations, "en-US")).toBeUndefined();
  });
});

describe("testimonialTargetLocale", () => {
  it("traduz para o idioma que não é o original", () => {
    expect(testimonialTargetLocale(undefined)).toBe("en-US");
    expect(testimonialTargetLocale("pt-BR")).toBe("en-US");
    expect(testimonialTargetLocale("en-US")).toBe("pt-BR");
  });
});

describe("testimonialFieldsToTranslate", () => {
  it("pede texto e cargo quando é novo", () => {
    expect(testimonialFieldsToTranslate(ptTestimonial)).toEqual({
      testimonialText: "Mudou nosso dia a dia.",
      testimonialRole: "Diretora",
    });
  });

  it("não pede nada se nada mudou e a tradução já existe", () => {
    expect(testimonialFieldsToTranslate(ptTestimonial, ptTestimonial, translations["en-US"].testimonial)).toEqual({});
  });

  it("pede de novo quando o idioma original mudou", () => {
    const now = { ...ptTestimonial, lang: "en-US" as const };
    expect(Object.keys(testimonialFieldsToTranslate(now, ptTestimonial, translations["en-US"].testimonial))).toEqual([
      "testimonialText",
      "testimonialRole",
    ]);
  });
});

describe("buildTranslatedTestimonial", () => {
  it("usa a tradução nova ou reaproveita a salva", () => {
    expect(buildTranslatedTestimonial(ptTestimonial, { testimonialText: "New." }, ptTestimonial, translations["en-US"].testimonial))
      .toEqual({ text: "New.", role: "Director" });
  });
});
