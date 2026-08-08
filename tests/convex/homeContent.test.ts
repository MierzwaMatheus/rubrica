import { describe, it, expect, beforeEach } from "vitest";
import { seed } from "../../convex/homeContent";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

const EXPECTED_KEYS = [
  "about_text",
  "availability_status",
  "contact_wizard_enabled",
  "hero_title",
  "hero_subtitle",
  "about_short",
  "hero_tags",
];

describe("convex/homeContent · seed", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente 7 registros correspondentes às PUBLIC_HOME_KEYS em banco vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("homeContent");
    expect(docs.length).toBe(EXPECTED_KEYS.length);
    const keys = docs.map((d) => d.key).sort();
    expect(keys).toEqual([...EXPECTED_KEYS].sort());
  });

  it("popula hero_title com string não-vazia em ptBR", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "hero_title");
    expect(doc).toBeDefined();
    expect(typeof doc!.value).toBe("string");
    expect(doc!.value.length).toBeGreaterThan(0);
  });

  it("popula hero_subtitle com string não-vazia em ptBR", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "hero_subtitle");
    expect(doc).toBeDefined();
    expect(typeof doc!.value).toBe("string");
    expect(doc!.value.length).toBeGreaterThan(0);
  });

  it("popula about_short como string ptBR não-vazia", async () => {
    await handler(seed)(ctx, {});
    const aboutShort = ctx.db._all("homeContent").find((d) => d.key === "about_short");
    expect(aboutShort).toBeDefined();
    expect(typeof aboutShort!.value).toBe("string");
    expect(aboutShort!.value.length).toBeGreaterThan(0);
  });

  it("popula about_text como objeto translation-shaped com ptBR não-vazio", async () => {
    await handler(seed)(ctx, {});
    const aboutText = ctx.db._all("homeContent").find((d) => d.key === "about_text");
    expect(aboutText).toBeDefined();
    expect(typeof aboutText!.value).toBe("object");
    expect(aboutText!.value).not.toBeNull();
    expect(typeof aboutText!.value.ptBR).toBe("string");
    expect(aboutText!.value.ptBR.length).toBeGreaterThan(0);
  });

  it("popula hero_tags como array de objetos {label, color}", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "hero_tags");
    expect(doc).toBeDefined();
    expect(Array.isArray(doc!.value)).toBe(true);
    expect(doc!.value.length).toBeGreaterThan(0);
    for (const tag of doc!.value) {
      expect(typeof tag.label).toBe("string");
      expect(tag.label.length).toBeGreaterThan(0);
      expect(typeof tag.color).toBe("string");
      expect(tag.color).toMatch(/^#/);
    }
  });

  it("popula availability_status como objeto com flag available e label ptBR", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "availability_status");
    expect(doc).toBeDefined();
    expect(typeof doc!.value).toBe("object");
    expect(doc!.value.available).toBe(true);
    expect(doc!.value.label).toBeDefined();
    expect(typeof doc!.value.label.ptBR).toBe("string");
    expect(doc!.value.label.ptBR.length).toBeGreaterThan(0);
  });

  it("popula contact_wizard_enabled como boolean true", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "contact_wizard_enabled");
    expect(doc).toBeDefined();
    expect(doc!.value).toBe(true);
  });

  it("seta createdAt numérico positivo em cada registro", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("homeContent");
    for (const doc of docs) {
      expect(typeof doc.createdAt).toBe("number");
      expect(doc.createdAt).toBeGreaterThan(0);
    }
  });

  it("é idempotente: re-rodar atualiza valores sem duplicar chaves", async () => {
    await handler(seed)(ctx, {});
    const initialCount = ctx.db._all("homeContent").length;
    const heroTitleBefore = ctx.db._all("homeContent").find((d) => d.key === "hero_title")!.value;

    await handler(seed)(ctx, {});
    const finalCount = ctx.db._all("homeContent").length;
    const heroTitleAfter = ctx.db._all("homeContent").find((d) => d.key === "hero_title")!.value;

    expect(finalCount).toBe(initialCount);
    expect(heroTitleAfter).toBe(heroTitleBefore);
  });

  it("atualiza valor existente quando re-executado (sobrescreve)", async () => {
    ctx.db._seed("homeContent", [
      { key: "hero_title", value: "Valor Antigo", createdAt: 1 },
    ]);
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("homeContent").find((d) => d.key === "hero_title")!;
    expect(doc.value).not.toBe("Valor Antigo");
    expect(typeof doc.value).toBe("string");
    expect(doc.value.length).toBeGreaterThan(0);
    expect(doc.updatedAt).toBeGreaterThan(1);
  });
});