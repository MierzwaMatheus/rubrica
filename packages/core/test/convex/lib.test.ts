import { describe, expect, it } from "vitest";
import { can, isRole, PERMISSIONS, ROLES } from "../../src/convex/lib/roles";
import { isValidSlug, slugify, uniqueSlug } from "../../src/convex/lib/slug";
import { anyText, cleanLocalized, fromV1Translations } from "../../src/convex/lib/text";
import { sanitizeFields, sanitizeHtml } from "../../src/convex/lib/sanitize";
import { assertValidPagePath, preparePageBlocks, validatePageBlocks, type BlockCatalog } from "../../src/convex/lib/blocks";
import { CORE_BLOCKS, texto } from "../../src/blocks/catalog";
import type { BlockInstance } from "../../src/content/types";

describe("papéis", () => {
  it("tem os seis papéis, com o comercial novo", () => {
    expect(ROLES).toEqual(["root", "admin", "content-editor", "blog-editor", "proposal-editor", "comercial"]);
    expect(isRole("comercial")).toBe(true);
    expect(isRole("dono")).toBe(false);
  });

  it("proposal-editor fica só com propostas; comercial junta o atendimento", () => {
    expect(can("proposal-editor", "proposals")).toBe(true);
    for (const p of ["contacts", "contracts", "checkouts", "content", "blog", "pages"] as const) {
      expect(can("proposal-editor", p)).toBe(false);
    }
    for (const p of ["proposals", "contacts", "contracts", "checkouts", "plans"] as const) {
      expect(can("comercial", p)).toBe(true);
    }
    expect(can("comercial", "pages")).toBe(false);
  });

  it("usuários e registros são só da agência (root)", () => {
    expect(PERMISSIONS.users).toEqual(["root"]);
    expect(can("admin", "users")).toBe(false);
    expect(can("admin", "audit")).toBe(false);
    expect(can("admin", "settings")).toBe(true);
    expect(can("admin", "technical")).toBe(false);
    expect(can(null, "panel")).toBe(false);
  });

  it("blog-editor mexe no blog e na mídia, não nas páginas", () => {
    expect(can("blog-editor", "blog")).toBe(true);
    expect(can("blog-editor", "media")).toBe(true);
    expect(can("blog-editor", "pages")).toBe(false);
    expect(can("blog-editor", "content")).toBe(false);
  });
});

describe("slug", () => {
  it("gera a partir do título sem acentos nem pontuação", () => {
    expect(slugify("Olá, Mundo! Ação & Reação")).toBe("ola-mundo-acao-reacao");
    expect(slugify("  --Título--  ")).toBe("titulo");
  });

  it("valida o formato", () => {
    expect(isValidSlug("meu-post_2")).toBe(true);
    expect(isValidSlug("Meu-Post")).toBe(false);
    expect(isValidSlug("-post")).toBe(false);
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("a".repeat(121))).toBe(false);
  });

  it("acha o primeiro livre", async () => {
    const taken = new Set(["post", "post-2"]);
    expect(await uniqueSlug("Post", async (s) => taken.has(s))).toBe("post-3");
    expect(await uniqueSlug("!!!", async () => false)).toBe("item");
  });
});

describe("textos por idioma", () => {
  it("tira idiomas vazios e recusa códigos inválidos", () => {
    expect(cleanLocalized({ "pt-BR": "Oi", en: "  ", es: "" })).toEqual({ "pt-BR": "Oi" });
    expect(() => cleanLocalized({ ptBR: "Oi" })).toThrow(/código de idioma inválido/);
    expect(() => cleanLocalized({ "pt BR": "Oi" })).toThrow();
  });

  it("converte o formato da v1 para o mapa por idioma", () => {
    expect(fromV1Translations("Olá", { ptBR: "Olá!", enUS: "Hello" })).toEqual({ "pt-BR": "Olá!", en: "Hello" });
    expect(fromV1Translations("Olá", undefined)).toEqual({ "pt-BR": "Olá" });
    expect(fromV1Translations("Olá", { ptBR: "", enUS: "" })).toEqual({ "pt-BR": "Olá" });
    expect(fromV1Translations("Olá", { enUS: "Hi" }, { ptBR: "pt", enUS: "en-US" })).toEqual({ pt: "Olá", "en-US": "Hi" });
    expect(fromV1Translations(undefined, null)).toEqual({});
  });

  it("escolhe um texto para rótulos", () => {
    expect(anyText({ en: "Hi", "pt-BR": "Oi" }, "pt-BR")).toBe("Oi");
    expect(anyText({ en: "Hi" }, "pt-BR")).toBe("Hi");
    expect(anyText(undefined)).toBe("");
  });
});

describe("sanitização", () => {
  it("remove script, eventos, estilos e javascript:", () => {
    const html = sanitizeHtml(
      '<p onclick="x()" style="color:red">Oi <a href="javascript:alert(1)">a</a> <a href="/blog" target="_blank" rel="noopener">b</a></p><script>bad()</script><iframe src="//x"></iframe>',
    );
    expect(html).toBe('<p>Oi <a href>a</a> <a href="/blog" target="_blank" rel="noopener">b</a></p>');
  });

  it("mantém a estrutura do texto rico e tira o h1", () => {
    const html = sanitizeHtml('<h1>Título</h1><h2 id="x">Seção</h2><ul><li><strong>a</strong></li></ul><pre class="language-ts"><code class="evil">x</code></pre><img src="https://x/y.png" alt="y" onerror="e()">');
    expect(html).toBe('Título<h2 id="x">Seção</h2><ul><li><strong>a</strong></li></ul><pre class="language-ts"><code>x</code></pre><img src="https://x/y.png" alt="y">');
  });

  it("sanitiza só os campos richText do bloco", () => {
    const out = sanitizeFields(texto.fields, { title: { "pt-BR": "<b>t</b>" }, body: { "pt-BR": "<p>ok</p><script>x</script>", en: "<img src=x onerror=y>" } });
    expect(out.title).toEqual({ "pt-BR": "<b>t</b>" });
    expect(out.body).toEqual({ "pt-BR": "<p>ok</p>", en: "<img src>" });
  });
});

describe("blocos da página", () => {
  const catalog: BlockCatalog = { blocks: CORE_BLOCKS, kind: "pessoal", enabledPlugins: new Set(["blog", "portfolio"]) };
  const hero = (id = "b1"): BlockInstance => ({ id, type: "hero", visible: true, fields: { title: { "pt-BR": "Oi" } } });

  it("aceita blocos válidos do catálogo", () => {
    expect(validatePageBlocks([hero(), { id: "b2", type: "posts-recentes", visible: true, fields: {}, source: { collection: "posts", limit: 3 } }], catalog)).toEqual([]);
  });

  it("recusa tipo desconhecido, de outro tipo de site e de plugin desligado", () => {
    const errors = validatePageBlocks(
      [
        { id: "a", type: "carrossel", visible: true, fields: {} },
        { id: "b", type: "precos", visible: true, fields: {} },
        { id: "c", type: "depoimentos", visible: true, fields: {} },
      ],
      catalog,
    );
    expect(errors.map((e) => e.message)).toEqual([
      'tipo de bloco desconhecido: "carrossel"',
      "o bloco precos é só de sites do tipo empresa",
      'o bloco depoimentos precisa do plugin "testimonials" ligado',
    ]);
  });

  it("recusa campos inválidos, ids repetidos e coleção não permitida", () => {
    const errors = validatePageBlocks(
      [hero(), { ...hero(), fields: { title: "sem idioma" } }, { id: "c", type: "hero", visible: true, fields: { title: { "pt-BR": "x" } }, source: { collection: "posts" } }],
      catalog,
    );
    expect(errors.map((e) => `${e.index}:${e.path}`)).toEqual(["1:id", "1:title", "2:source"]);
  });

  it("devolve os blocos sanitizados ou lança com a lista de erros", () => {
    const [b] = preparePageBlocks([{ id: "t", type: "texto", visible: true, fields: { body: { "pt-BR": "<p>a</p><script>x</script>" } } }], catalog);
    expect(b!.fields.body).toEqual({ "pt-BR": "<p>a</p>" });
    expect(() => preparePageBlocks([{ id: "x", type: "nada", visible: true, fields: {} }], catalog)).toThrow(/bloco 1 \(x\) type: tipo de bloco desconhecido/);
  });

  it("valida o caminho da página", () => {
    expect(() => assertValidPagePath("/")).not.toThrow();
    expect(() => assertValidPagePath("/sobre")).not.toThrow();
    expect(() => assertValidPagePath("/servicos/design")).not.toThrow();
    expect(() => assertValidPagePath("sobre")).toThrow();
    expect(() => assertValidPagePath("/Sobre")).toThrow();
    expect(() => assertValidPagePath("/sobre/")).toThrow();
    expect(() => assertValidPagePath("/admin")).toThrow(/reservado/);
    expect(() => assertValidPagePath("/blog/x", ["/blog"])).toThrow(/reservado/);
  });
});
