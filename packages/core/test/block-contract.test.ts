/** Ganchos do contrato de blocos: validação entre campos e variações herdadas do núcleo. */
import { describe, expect, it } from "vitest";
import { defineBlock, serializeBlock, validateBlock, type BlockDefinition } from "../src/blocks/define";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { field } from "../src/blocks/fields";
import { CORE_VARIANTS, resolveVariant, variantsFor } from "../src/theme/contract";
import { showcaseBlocks } from "../src/data/showcase";

const withRule = defineBlock({
  type: "regra",
  label: "Regra",
  description: "",
  category: "comum",
  fields: { url: field.text({ label: "Endereço", localized: false, required: true }) },
  validate: (f) => (String(f.url).startsWith("https://") ? [] : [{ path: "url", message: "Endereço: use https" }]),
  sample: (mode) => ({ url: mode === "cheio" ? "https://example.com/a" : "https://example.com/b", label: { "*": "Exemplo" } }),
});

describe("validate do bloco", () => {
  it("roda depois da validação dos campos e entra nos erros do bloco", () => {
    expect(validateBlock(withRule, { fields: { url: "https://a" } })).toEqual([]);
    expect(validateBlock(withRule, { id: "b1", fields: { url: "http://a" } })).toEqual([{ path: "url", message: "Endereço: use https", blockId: "b1" }]);
  });

  it("não roda se o schema já recusou (campo faltando, tipo errado)", () => {
    const errors = validateBlock(withRule, { fields: {} });
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain("obrigatório");
  });
});

describe("variações herdadas", () => {
  const core = { value: "x", label: "X" };
  const type = "cases";

  it("tema que declara vale o que declarou", () => {
    expect(variantsFor({ variants: { cases: [core] } }, type)).toEqual([core]);
  });

  it("tema sem declaração herda as do núcleo quando usa o componente padrão", () => {
    expect(variantsFor({}, type)).toEqual(CORE_VARIANTS.cases);
    expect(resolveVariant({}, type, undefined)).toBe(CORE_VARIANTS.cases![0]!.value);
    expect(resolveVariant({}, type, "lista")).toBe("lista");
  });

  it("tema com componente próprio e sem declaração não tem variações", () => {
    const theme = { blocks: { cases: () => null } };
    expect(variantsFor(theme, type)).toEqual([]);
    expect(resolveVariant(theme, type, "lista")).toBe("default");
  });

  it("a vitrine usa o exemplo do bloco por cima do gerado, com os textos em todos os idiomas", () => {
    const blocks = showcaseBlocks(withRule, {}, ["pt-BR", "en"]);
    expect(blocks.map((b) => b.fields.url)).toEqual(["https://example.com/a", "https://example.com/b"]);
    expect(blocks[0]!.fields.label).toEqual({ "pt-BR": "Exemplo", en: "Exemplo" });
  });
});

describe("orientação de uso (guidance)", () => {
  const types = new Set(CORE_BLOCKS.map((b) => b.type as string));

  it.each(CORE_BLOCKS.map((b) => [b.type, b] as const))("%s tem quando usar, quando não usar e com o que combina", (_type, def) => {
    const g = (def as BlockDefinition).guidance;
    expect(g, "guidance").toBeDefined();
    expect(g!.use.trim().length).toBeGreaterThan(20);
    expect(g!.avoid?.trim().length ?? 0).toBeGreaterThan(20);
    expect(g!.pairsWith?.length ?? 0).toBeGreaterThan(0);
    for (const t of g!.pairsWith ?? []) {
      expect(types.has(t), `${def.type} combina com "${t}", que não é bloco do núcleo`).toBe(true);
      expect(t).not.toBe(def.type);
    }
  });
});

describe("serializeBlock", () => {
  it("só dados: sem funções nem undefined, com a orientação e o aviso de regra própria", () => {
    const data = serializeBlock(withRule);
    expect(data).toEqual({ type: "regra", label: "Regra", description: "", category: "comum", fields: withRule.fields, customValidation: true });
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  it("todo bloco do núcleo atravessa sem perder campos", () => {
    for (const def of CORE_BLOCKS as readonly BlockDefinition[]) {
      const data = serializeBlock(def);
      expect(data.fields).toEqual(JSON.parse(JSON.stringify(def.fields)));
      expect(data.guidance).toEqual(def.guidance);
      expect(Object.values(data).some((v) => typeof v === "function")).toBe(false);
    }
  });
});
