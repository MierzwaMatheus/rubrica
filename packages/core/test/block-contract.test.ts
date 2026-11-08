/** Ganchos do contrato de blocos: validação entre campos e variações herdadas do núcleo. */
import { describe, expect, it } from "vitest";
import { defineBlock, validateBlock } from "../src/blocks/define";
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
