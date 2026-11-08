import { describe, expect, it } from "vitest";
import { CORE_BLOCKS, cta, hero, numeros, cases } from "../../src/blocks/catalog";
import { field } from "../../src/blocks/fields";
import {
  availableBlocks,
  blockSummary,
  blockUnavailableReason,
  duplicateBlock,
  errorMessage,
  errorsAt,
  hasErrorUnder,
  initialFields,
  missingTranslations,
  missingUnder,
  moveItem,
  newBlock,
  newBlockId,
  parseBlockErrors,
  prune,
  sameDraft,
  setField,
  setLocalized,
} from "../../src/admin/editor/model";
import { formatBlockErrors, validatePageBlocks } from "../../src/convex/lib/blocks";

const locales = ["pt-BR", "en", "es"];

describe("valores dos campos", () => {
  it("texto por idioma: vazio tira o idioma, mapa vazio vira undefined", () => {
    expect(setLocalized(undefined, "pt-BR", "Oi")).toEqual({ "pt-BR": "Oi" });
    expect(setLocalized({ "pt-BR": "Oi", en: "Hi" }, "en", "  ")).toEqual({ "pt-BR": "Oi" });
    expect(setLocalized({ "pt-BR": "<p>Oi</p>" }, "pt-BR", "<p></p>")).toBeUndefined();
  });

  it("campo vazio some do objeto; false e 0 ficam", () => {
    expect(setField({ a: 1 }, "a", undefined)).toEqual({});
    expect(setField({}, "b", "")).toEqual({});
    expect(setField({}, "c", {})).toEqual({});
    expect(setField({}, "d", false)).toEqual({ d: false });
    expect(setField({}, "e", 0)).toEqual({ e: 0 });
    expect(setField({}, "f", [])).toEqual({ f: [] });
  });

  it("lista obrigatória nasce com o mínimo de itens", () => {
    expect(initialFields(numeros.fields)).toEqual({ items: [{}] });
    expect(initialFields(hero.fields)).toEqual({});
  });

  it("bloco novo: id válido e único, fonte padrão copiada", () => {
    // Primeira tentativa colide com um id existente; a segunda sai diferente.
    let n = 0;
    const seq = () => (n++ < 6 ? 0 : 0.5);
    expect(newBlockId(["baaaaaa"], seq)).toBe("bssssss");
    const block = newBlock(cases, []);
    expect(block.id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(block.source).toEqual(cases.source!.default);
    expect(block.source).not.toBe(cases.source!.default);
  });

  it("duplicar copia os campos, troca o id e tira a âncora", () => {
    const original = { id: "a", type: "texto", visible: true, fields: { anchor: "sobre", body: { "pt-BR": "<p>x</p>" } } };
    const copy = duplicateBlock(original, ["a"]);
    expect(copy.id).not.toBe("a");
    expect(copy.fields).toEqual({ body: { "pt-BR": "<p>x</p>" } });
    expect(original.fields.anchor).toBe("sobre");
  });

  it("mover itens", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 0, 9)).toEqual(["b", "a"]);
  });

  it("compara rascunhos ignorando undefined e ordem das chaves", () => {
    expect(sameDraft({ a: 1, b: undefined, c: { x: [1] } }, { c: { x: [1] }, a: 1 })).toBe(true);
    expect(sameDraft({ a: 1 }, { a: 2 })).toBe(false);
    expect(prune({ a: [1, undefined, { b: undefined }] })).toEqual({ a: [1, {}] });
  });
});

describe("o que falta traduzir", () => {
  it("texto, link, imagem e itens de lista, só quando há algum idioma preenchido", () => {
    const fields = {
      title: field.text({ label: "Título" }),
      code: field.text({ label: "Código", localized: false }),
      cta: field.link({ label: "Botão" }),
      image: field.image({ label: "Imagem" }),
      items: field.list({ label: "Itens", of: { label: field.text({ label: "Rótulo" }) } }),
      empty: field.text({ label: "Vazio" }),
    };
    const result = missingTranslations(
      fields,
      {
        title: { "pt-BR": "Oi", en: "Hi" },
        code: "x",
        cta: { label: { "pt-BR": "Ver" }, href: "/x" },
        image: { url: "u", alt: { en: "Photo" } },
        items: [{ label: { "pt-BR": "a", en: "a", es: "a" } }, { label: { es: "b" } }],
        empty: {},
      },
      locales,
    );
    expect(result).toEqual([
      { path: "title", label: "Título", missing: ["es"] },
      { path: "cta.label", label: "Botão (rótulo)", missing: ["en", "es"] },
      { path: "image.alt", label: "Imagem (texto alternativo)", missing: ["pt-BR", "es"] },
      { path: "items.1.label", label: "Rótulo", missing: ["pt-BR", "en"] },
    ]);
    expect(missingUnder(result, "items")).toEqual(["pt-BR", "en"]);
  });

  it("texto rico só com tags vazias conta como não traduzido", () => {
    const fields = { body: field.richText({ label: "Texto" }) };
    expect(missingTranslations(fields, { body: { "pt-BR": "<p>Oi</p>", en: "<p> </p>" } }, ["pt-BR", "en"])).toEqual([
      { path: "body", label: "Texto", missing: ["en"] },
    ]);
  });

  it("site de um idioma só não tem o que traduzir", () => {
    expect(missingTranslations(hero.fields, { title: { "pt-BR": "Oi" } }, ["pt-BR"])).toEqual([]);
  });
});

describe("erros por campo", () => {
  const errors = [
    { path: "title.en", message: "Título: até 160 caracteres" },
    { path: "items", message: "Números: pelo menos 1 itens" },
    { path: "items.0.label", message: "Rótulo: obrigatório" },
  ];

  it("campo simples pega os do idioma; lista só os dela", () => {
    expect(errorsAt(errors, "title")).toHaveLength(1);
    expect(errorsAt(errors, "items", "list")).toEqual([errors[1]]);
    expect(errorsAt(errors, "items.0.label")).toEqual([errors[2]]);
    expect(hasErrorUnder(errors, "items.0")).toBe(true);
    expect(hasErrorUnder(errors, "items.1")).toBe(false);
  });

  it("lê a mensagem do backend de volta para erros por bloco e campo", () => {
    const catalog = { blocks: CORE_BLOCKS, kind: "pessoal" as const, enabledPlugins: new Set<string>() };
    const original = validatePageBlocks(
      [
        { id: "h1", type: "hero", visible: true, fields: {} },
        { id: "c", type: "cta", visible: true, fields: { title: { "pt-BR": "x" }, primary: { href: "/x", label: 3 } } },
      ],
      catalog,
    );
    const message = `[CONVEX M(rubrica/pages:update)] [Request ID: 1] Server Error\nUncaught Error: Página inválida: ${formatBlockErrors(original)}\n    at handler (pages.ts:1)`;
    expect(parseBlockErrors(message)).toEqual(original);
  });

  it("mensagem legível dos erros do Convex", () => {
    expect(errorMessage(new Error("[CONVEX M(x)] [Request ID: 1] Server Error\nUncaught Error: Já existe uma página em \"/x\"\n    at y"))).toBe('Já existe uma página em "/x"');
    expect(errorMessage(new Error("[CONVEX M(x)] [Request ID: 1] Server Error"))).toMatch(/servidor recusou/);
    expect(errorMessage(Object.assign(new Error("x"), { data: "Mensagem do ConvexError" }))).toBe("Mensagem do ConvexError");
  });
});

describe("catálogo e resumo", () => {
  it("filtra por tipo de site e plugin", () => {
    const pessoal = availableBlocks(CORE_BLOCKS, "pessoal", new Set(["blog"])).map((b) => b.type);
    expect(pessoal).toContain("posts-recentes");
    expect(pessoal).not.toContain("cases");
    expect(pessoal).not.toContain("precos");
    expect(availableBlocks(CORE_BLOCKS, "empresa", new Set()).map((b) => b.type)).toContain("precos");
    expect(blockUnavailableReason(cases, "pessoal", new Set())).toMatch(/portfolio/);
    expect(blockUnavailableReason(undefined, "pessoal", new Set())).toMatch(/desconhecido/);
  });

  it("resumo do bloco no idioma, sem HTML", () => {
    expect(blockSummary({ id: "a", type: "cta", visible: true, fields: { title: { "pt-BR": "Vamos?", en: "Shall we?" } } }, cta, "en")).toBe("Shall we?");
    expect(blockSummary({ id: "a", type: "cta", visible: true, fields: { title: { "pt-BR": "Vamos?" } } }, cta, "en")).toBe("Vamos?");
    expect(blockSummary({ id: "a", type: "texto", visible: true, fields: { body: { en: "<p>Hello <b>world</b></p>" } } }, undefined, "en")).toBe("Hello world");
  });
});
