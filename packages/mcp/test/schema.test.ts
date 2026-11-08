import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { siteSettingsFields } from "@rubrica/core/convex/validators";
import { validateFields } from "@rubrica/core";
import { v } from "convex/values";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { COLLECTION_SPECS, collectionFieldsSchema } from "../src/schema/collections";
import { anyBlockSchema, blockFieldsSchema, fieldMapToSchema, validatorsToSchema } from "../src/schema/json-schema";

const ajv = new Ajv({ strict: false, allErrors: true });
const block = (type: string) => CORE_BLOCKS.find((b) => b.type === type)!;

describe("JSON Schema dos blocos", () => {
  it("gera um schema compilável para todos os blocos do catálogo", () => {
    for (const def of CORE_BLOCKS) {
      expect(() => ajv.compile(blockFieldsSchema(def, { locales: ["pt-BR", "en"] })), def.type).not.toThrow();
    }
  });

  it("mapeia obrigatórios, limites e textos por idioma", () => {
    const schema = fieldMapToSchema(block("hero").fields, { locales: ["pt-BR", "en"] }) as any;
    expect(schema.required).toEqual(["title"]);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.title.properties["pt-BR"]).toEqual({ type: "string", maxLength: 160 });
    expect(schema.properties.title.description).toContain("Idiomas do site: pt-BR, en");
    expect(schema.properties.primaryCta.required).toEqual(["label", "href"]);
    expect(schema.properties.tags.maxItems).toBe(8);
  });

  it("aceita qualquer idioma quando os do site não são conhecidos", () => {
    const schema = fieldMapToSchema(block("hero").fields) as any;
    expect(schema.properties.title.additionalProperties).toEqual({ type: "string", maxLength: 160 });
  });

  it("texto não traduzível vira string; select vira enum; richText avisa do h1", () => {
    const num = fieldMapToSchema(block("numeros").fields) as any;
    expect(num.properties.items.items.properties.value.type).toBe("string");
    const texto = fieldMapToSchema(block("texto").fields) as any;
    expect(texto.properties.imagePosition.enum).toEqual(["start", "end"]);
    expect(texto.properties.body.description).toContain("o h1 é do hero");
  });

  it("concorda com validateFields: o que o schema aceita, o validador aceita", () => {
    const def = block("hero");
    const validate = ajv.compile(blockFieldsSchema(def, { locales: ["pt-BR", "en"] }));
    const ok = { title: { "pt-BR": "Olá", en: "Hi" }, tags: [{ label: { "pt-BR": "x" } }] };
    expect(validate(ok)).toBe(true);
    expect(validateFields(def.fields, ok)).toEqual([]);
    const bad = { title: { "pt-BR": "x".repeat(200) }, extra: 1 };
    expect(validate(bad)).toBe(false);
    expect(validateFields(def.fields, bad).length).toBeGreaterThan(0);
  });

  it("anyBlockSchema lista um ramo por tipo mais o genérico", () => {
    const schema = anyBlockSchema(CORE_BLOCKS) as any;
    expect(schema.anyOf).toHaveLength(CORE_BLOCKS.length + 1);
    expect(schema.anyOf[0].properties.type).toEqual({ const: "hero" });
    expect((anyBlockSchema(CORE_BLOCKS, {}, false) as any).anyOf).toBeUndefined();
  });
});

describe("JSON Schema das coleções (dos validadores do Convex)", () => {
  it("gera para todas as coleções, com slug só em posts e projetos", () => {
    for (const spec of Object.values(COLLECTION_SPECS)) {
      const schema = collectionFieldsSchema(spec, { locales: ["pt-BR", "en"] }) as any;
      expect(() => ajv.compile(schema), spec.name).not.toThrow();
      expect("slug" in schema.properties).toBe(!!spec.slug);
      for (const f of spec.requiredText) expect(schema.required, `${spec.name}.${f}`).toContain(f);
    }
  });

  it("reflete opcionais, enums, números e listas", () => {
    const plans = collectionFieldsSchema(COLLECTION_SPECS.plans) as any;
    expect(plans.required).toEqual(expect.arrayContaining(["name", "features"]));
    expect(plans.properties.period.enum).toEqual(["month", "year", "once", "hour", "project"]);
    expect(plans.properties.priceCents.type).toBe("number");
    expect(plans.properties.priceCents.description).toContain("centavos");
    expect(plans.properties.features.type).toBe("array");
    const partial = collectionFieldsSchema(COLLECTION_SPECS.plans, {}, true) as any;
    expect(partial.required).toBeUndefined();
  });

  it("recusa campo desconhecido e tipo errado", () => {
    const validate = ajv.compile(collectionFieldsSchema(COLLECTION_SPECS.faq, { locales: ["pt-BR"] }));
    expect(validate({ question: { "pt-BR": "a?" }, answer: { "pt-BR": "b" } })).toBe(true);
    expect(validate({ question: { "pt-BR": "a?" }, answer: { "pt-BR": "b" }, lixo: 1 })).toBe(false);
    expect(validate({ question: "a?", answer: { "pt-BR": "b" } })).toBe(false);
  });

  it("não confunde tokens de cor com texto traduzível", () => {
    const schema = validatorsToSchema(siteSettingsFields, { notLocalized: ["appearance.tokens"] }) as any;
    expect(schema.properties.appearance.properties.tokens.additionalProperties).toEqual({ type: "string" });
    expect(schema.properties.name.description).toContain("Um texto por idioma");
    expect(schema.properties.plugins.additionalProperties).toEqual({ type: "boolean" });
  });

  it("gera objeto, união de literais e opcionais a partir de um validador", () => {
    const schema = validatorsToSchema({ a: v.string(), b: v.optional(v.union(v.literal("x"), v.literal("y"))), c: v.array(v.number()) }) as any;
    expect(schema.required).toEqual(["a", "c"]);
    expect(schema.properties.b.enum).toEqual(["x", "y"]);
  });
});
