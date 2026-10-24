import { describe, it, expect } from "vitest";
import {
  mapTranslations,
  mapProject,
  mapBlogPost,
  mapContactInfo,
  mapSidebarContactInfo,
  mapService,
  mapTestimonial,
  mapDailyRoutineItem,
  mapFAQItem,
  mapResumeItem,
} from "@/repositories/mappers/convexMappers";

describe("mapTranslations", () => {
  it("returns undefined for null/undefined source", () => {
    expect(mapTranslations(null)).toBeUndefined();
    expect(mapTranslations(undefined)).toBeUndefined();
  });

  it("returns undefined for empty source", () => {
    expect(mapTranslations({})).toBeUndefined();
  });

  it("normalizes enUS / ptBR keys to en-US / pt-BR", () => {
    expect(mapTranslations({ enUS: "Hi", ptBR: "Oi" })).toEqual({
      "en-US": "Hi",
      "pt-BR": "Oi",
    });
  });

  it("preserves en-US / pt-BR keys when already normalized", () => {
    expect(mapTranslations({ "en-US": "Hi", "pt-BR": "Oi" })).toEqual({
      "en-US": "Hi",
      "pt-BR": "Oi",
    });
  });

  it("when both casings present, hyphenated wins (last write)", () => {
    const result = mapTranslations({
      enUS: "first",
      "en-US": "second",
    });
    expect(result?.["en-US"]).toBe("second");
  });

  it("ignores null fields", () => {
    expect(mapTranslations({ enUS: "Hi", ptBR: null as any })).toEqual({
      "en-US": "Hi",
    });
  });
});

describe("mapProject", () => {
  it("maps required fields with defaults for missing", () => {
    const result = mapProject({ _id: "p1" });
    expect(result.id).toBe("p1");
    expect(result.title).toBe("");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.images).toEqual([]);
    expect(result.demo_link).toBe("");
    expect(result.github_link).toBe("");
  });

  it("maps images as string[] when given strings", () => {
    expect(mapProject({ _id: "p", images: ["a", "b"] }).images).toEqual([
      "a",
      "b",
    ]);
  });

  it("maps images as {url} objects to url string array", () => {
    expect(
      mapProject({ _id: "p", images: [{ url: "u1" }, { url: "u2" }] }).images,
    ).toEqual(["u1", "u2"]);
  });

  it("filters out images without url", () => {
    expect(
      mapProject({ _id: "p", images: [{ url: "u1" }, {}, null, "u2"] }).images,
    ).toEqual(["u1", "u2"]);
  });

  it("supports both camelCase and snake_case sources", () => {
    const camel = mapProject({
      _id: "p",
      titleTranslations: { ptBR: "T" },
      longDescription: "long",
      demoLink: "d",
      githubLink: "g",
      orderIndex: 5,
    });
    expect(camel.title_translations).toEqual({ "pt-BR": "T" });
    expect(camel.long_description).toBe("long");
    expect(camel.demo_link).toBe("d");
    expect(camel.github_link).toBe("g");
    expect(camel.order_index).toBe(5);

    const snake = mapProject({
      _id: "p",
      title_translations: { ptBR: "T" },
      long_description: "long",
      demo_link: "d",
      github_link: "g",
      order_index: 7,
    });
    expect(snake.long_description).toBe("long");
    expect(snake.order_index).toBe(7);
  });

  it("uses id field when _id missing", () => {
    expect(mapProject({ id: "alt" }).id).toBe("alt");
  });
});

describe("mapBlogPost", () => {
  it("converts numeric createdAt/publishedAt to ISO string", () => {
    const ts = 1700000000000;
    const result = mapBlogPost({
      _id: "p",
      createdAt: ts,
      publishedAt: ts + 1000,
    });
    expect(result.created_at).toBe(new Date(ts).toISOString());
    expect(result.published_at).toBe(new Date(ts + 1000).toISOString());
  });

  it("preserves string createdAt/publishedAt as-is", () => {
    const result = mapBlogPost({
      _id: "p",
      createdAt: "2024-01-01T00:00:00Z",
      publishedAt: "2024-01-02T00:00:00Z",
    });
    expect(result.created_at).toBe("2024-01-01T00:00:00Z");
    expect(result.published_at).toBe("2024-01-02T00:00:00Z");
  });

  it("falls back to created_at/published_at snake_case", () => {
    const result = mapBlogPost({
      _id: "p",
      created_at: "2024-01-01T00:00:00Z",
    });
    expect(result.created_at).toBe("2024-01-01T00:00:00Z");
  });

  it("resolves image fallback chain (string > {url} > imageUrl > '')", () => {
    expect(mapBlogPost({ _id: "p", image: "direct" }).image).toBe("direct");
    expect(mapBlogPost({ _id: "p", image: { url: "obj" } }).image).toBe("obj");
    expect(mapBlogPost({ _id: "p", imageUrl: "fallback" }).image).toBe(
      "fallback",
    );
    expect(mapBlogPost({ _id: "p" }).image).toBe("");
  });

  it("coerces featured to boolean", () => {
    expect(mapBlogPost({ _id: "p", featured: 1 }).featured).toBe(true);
    expect(mapBlogPost({ _id: "p", featured: undefined }).featured).toBe(false);
  });

  it("defaults tags to empty array", () => {
    expect(mapBlogPost({ _id: "p" }).tags).toEqual([]);
  });
});

describe("mapContactInfo", () => {
  // b80ccdc ampliou ContactInfo com nome/email/telefone (usados no contrato da proposta)
  const emptyContact = {
    name: "",
    role: "",
    role_translations: undefined,
    email: "",
    show_email: false,
    phone: "",
    show_phone: false,
  };

  it("maps role and translations with defaults", () => {
    expect(mapContactInfo({ role: "Dev" })).toEqual({ ...emptyContact, role: "Dev" });
    expect(mapContactInfo(null)).toEqual(emptyContact);
  });

  it("maps name, email and phone with both casings", () => {
    expect(
      mapContactInfo({ name: "Ana", email: "a@b.com", showEmail: true, phone: "123", show_phone: true }),
    ).toEqual({
      ...emptyContact,
      name: "Ana",
      email: "a@b.com",
      show_email: true,
      phone: "123",
      show_phone: true,
    });
  });

  it("maps translations with both casings", () => {
    expect(
      mapContactInfo({ role: "Dev", roleTranslations: { ptBR: "Desenvolvedor" } })
        .role_translations,
    ).toEqual({ "pt-BR": "Desenvolvedor" });
  });
});

describe("mapSidebarContactInfo", () => {
  it("returns empty defaults for null source", () => {
    const r = mapSidebarContactInfo(null);
    expect(r.name).toBe("");
    expect(r.email).toBe("");
    expect(r.show_email).toBe(false);
    expect(r.show_phone).toBe(false);
    expect(r.avatar_url).toBe("");
  });

  it("supports camelCase show_email / showEmail interchange", () => {
    expect(
      mapSidebarContactInfo({ showEmail: true, showPhone: true }).show_email,
    ).toBe(true);
    expect(
      mapSidebarContactInfo({ show_email: true }).show_email,
    ).toBe(true);
  });

  it("resolves avatar_url priority: avatarUrl > avatar_url > avatar.url", () => {
    expect(
      mapSidebarContactInfo({ avatarUrl: "1", avatar_url: "2", avatar: { url: "3" } })
        .avatar_url,
    ).toBe("1");
    expect(mapSidebarContactInfo({ avatar_url: "2" }).avatar_url).toBe("2");
    expect(mapSidebarContactInfo({ avatar: { url: "3" } }).avatar_url).toBe("3");
  });
});

describe("mapService / mapTestimonial / mapDailyRoutineItem / mapFAQItem / mapResumeItem", () => {
  it("mapService maps both casings and i18n", () => {
    const s = mapService({
      _id: "s1",
      title: "T",
      titleTranslations: { ptBR: "T-pt" },
      description: "D",
    });
    expect(s.id).toBe("s1");
    expect(s.title_translations).toEqual({ "pt-BR": "T-pt" });
  });

  it("mapTestimonial resolves image_url chain", () => {
    expect(mapTestimonial({ _id: "t", imageUrl: "a" }).image_url).toBe("a");
    expect(mapTestimonial({ _id: "t", image_url: "b" }).image_url).toBe("b");
    expect(mapTestimonial({ _id: "t", image: { url: "c" } }).image_url).toBe("c");
    expect(mapTestimonial({ _id: "t" }).image_url).toBe("");
  });

  it("mapDailyRoutineItem defaults span_size to '1x1' and display_order to 0", () => {
    const r = mapDailyRoutineItem({ _id: "d" });
    expect(r.span_size).toBe("1x1");
    expect(r.display_order).toBe(0);
  });

  it("mapDailyRoutineItem image_url priority: image.url > imageUrl > image_url", () => {
    expect(
      mapDailyRoutineItem({ _id: "d", image: { url: "a" }, imageUrl: "b" }).image_url,
    ).toBe("a");
    expect(mapDailyRoutineItem({ _id: "d", image_url: "c" }).image_url).toBe("c");
  });

  it("mapFAQItem maps question and answer with translations", () => {
    const r = mapFAQItem({
      _id: "f",
      question: "Q",
      answer: "A",
      questionTranslations: { ptBR: "Q-pt" },
      answerTranslations: { ptBR: "A-pt" },
      displayOrder: 3,
    });
    expect(r.id).toBe("f");
    expect(r.question_translations).toEqual({ "pt-BR": "Q-pt" });
    expect(r.answer_translations).toEqual({ "pt-BR": "A-pt" });
    expect(r.display_order).toBe(3);
  });

  it("mapResumeItem preserves content and translations object", () => {
    const r = mapResumeItem({
      _id: "r",
      type: "skill",
      content: { name: "TS" },
      contentTranslations: { ptBR: { name: "TS" }, enUS: { name: "TS" } },
      orderIndex: 5,
    });
    expect(r.content).toEqual({ name: "TS" });
    expect(r.content_translations).toEqual({
      "pt-BR": { name: "TS" },
      "en-US": { name: "TS" },
    });
    expect(r.order_index).toBe(5);
  });
});
