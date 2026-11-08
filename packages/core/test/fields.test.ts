import { describe, expect, it } from "vitest";
import { validateBlock } from "../src/blocks/define";
import { CORE_BLOCKS, cases, hero, numeros } from "../src/blocks/catalog";
import { resolveFields } from "../src/render/resolve";
import { defineLocales } from "../src/i18n";

const locales = defineLocales({ locales: ["pt-BR", "en"], default: "pt-BR" });

describe("contrato de blocos", () => {
  it("catálogo tem tipos únicos", () => {
    const types = CORE_BLOCKS.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
    expect(types.length).toBeGreaterThanOrEqual(16);
  });

  it("valida obrigatórios, tipos e campos desconhecidos", () => {
    expect(validateBlock(hero, { fields: { title: { "pt-BR": "Oi" } } })).toEqual([]);
    const errors = validateBlock(hero, { fields: { title: "texto cru", extra: 1 } });
    expect(errors.map((e) => e.path)).toEqual(["title", "extra"]);
    expect(validateBlock(hero, { fields: {} })[0]?.path).toBe("title");
  });

  it("valida listas item a item", () => {
    const errors = validateBlock(numeros, { fields: { items: [{ value: "10", label: { "pt-BR": "anos" } }, { label: { "pt-BR": "sem valor" } }] } });
    expect(errors.map((e) => e.path)).toEqual(["items.1.value"]);
  });

  it("valida a fonte da coleção", () => {
    expect(validateBlock(cases, { fields: {}, source: { collection: "posts" } })[0]?.path).toBe("source.collection");
    expect(validateBlock(cases, { fields: {}, source: { collection: "projects", limit: 0 } })[0]?.path).toBe("source.limit");
  });

  it("resolve no idioma, com links localizados e padrões", () => {
    const raw = {
      title: { "pt-BR": "Olá", en: "Hi" },
      primaryCta: { label: { "pt-BR": "Ver", en: "See" }, href: "/portfolio" },
      secondaryCta: { label: { "pt-BR": "Só pt" }, href: "https://x.dev" },
      tags: [{ label: { "pt-BR": "a", en: "a" } }, { label: { "pt-BR": "só pt" } }],
    };
    const en = resolveFields(hero.fields, raw, { locale: "en", locales });
    expect(en.title).toBe("Hi");
    expect(en.primaryCta).toEqual({ label: "See", href: "/en/portfolio", external: false });
    expect(en.secondaryCta).toBeUndefined();
    expect(en.tags).toEqual([{ label: "a" }]);
    expect(en.showAvailability).toBe(false);
  });
});
