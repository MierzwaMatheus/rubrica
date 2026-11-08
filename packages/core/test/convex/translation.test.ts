// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tagSequence } from "../../src/convex/lib/openrouter";
import { applyTranslations, collectTranslatable } from "../../src/convex/lib/translatable";
import { api, as, seedSettings, setup, type T } from "./_setup";

type Body = { model: string; messages: { role: string; content: string }[] };

/** OpenRouter falso: "traduz" pondo [en] na frente de cada trecho de texto. */
function mockOpenRouter(behavior: (body: Body) => Response | null = () => null) {
  const calls: Body[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as Body;
      calls.push(body);
      const custom = behavior(body);
      if (custom) return custom;
      const text = body.messages[1]!.content.replace(/(^|>)([^<]+)/g, (_m, a: string, b: string) => `${a}[en] ${b}`);
      return Response.json({ choices: [{ message: { content: text } }] });
    }),
  );
  return calls;
}

let t: T;
beforeEach(async () => {
  t = setup();
  await seedSettings(t, { plugins: { translation: true } });
  vi.stubEnv("OPENROUTER_API_KEY", "or-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("campos traduzíveis", () => {
  it("acha os mapas de idioma em qualquer nível e só os que faltam no destino", () => {
    const doc = {
      _id: "x",
      slug: "ola",
      title: { "pt-BR": "Olá", en: "Hello" },
      seo: { description: { "pt-BR": "Descrição" } },
      blocks: [{ id: "h", type: "hero", fields: { title: { "pt-BR": "Oi" }, image: { url: "u", alt: { "pt-BR": "Foto" } }, anchor: "topo" } }],
    };
    expect(collectTranslatable(doc, "pt-BR", "en").map((f) => f.path.join("."))).toEqual(["seo.description", "blocks.0.fields.title", "blocks.0.fields.image.alt"]);
    expect(collectTranslatable(doc, "pt-BR", "en", true)).toHaveLength(4);
    const { patch, applied } = applyTranslations(doc, [{ path: ["blocks", 0, "fields", "title"], value: "Hi" }, { path: ["slug"], value: "x" }], "en");
    expect(applied).toEqual(["blocks.0.fields.title"]);
    expect(Object.keys(patch)).toEqual(["blocks"]);
    expect((patch.blocks as { fields: { title: unknown } }[])[0]!.fields.title).toEqual({ "pt-BR": "Oi", en: "Hi" });
    expect(doc.blocks[0]!.fields.title).toEqual({ "pt-BR": "Oi" });
  });

  it("compara a sequência de tags do HTML", () => {
    expect(tagSequence('<p>a <a href="x">b</a></p>')).toEqual(["p", "a", "/a", "/p"]);
  });
});

describe("tradução com OpenRouter", () => {
  it("traduz textos soltos preservando o HTML, com a chave e o prompt certos", async () => {
    const calls = mockOpenRouter();
    const editor = await as(t, "content-editor");
    const res = await editor.action(api.rubrica.translation.translate, { texts: ["<p>Olá <strong>mundo</strong></p>", "Simples", ""], from: "pt-BR", to: "en" });
    expect(res.translations).toEqual(["<p>[en] Olá <strong>[en] mundo</strong></p>", "[en] Simples", ""]);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.model).toBe("google/gemini-2.0-flash-001");
    expect(calls[0]!.messages[0]!.content).toMatch(/from .*Portuguese.* \(pt-BR\) to English \(en\)/);
    const headers = (vi.mocked(fetch).mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer or-key");
  });

  it("modelo que falha ou muda o HTML dá lugar ao próximo; todos falharam → erro no item", async () => {
    let n = 0;
    mockOpenRouter((body) => {
      n++;
      if (body.model === "google/gemini-2.0-flash-001") return new Response("erro", { status: 500 });
      if (body.model === "google/gemini-2.5-flash-lite") return Response.json({ choices: [{ message: { content: "<p>sem o strong</p>" } }] });
      return null;
    });
    const editor = await as(t, "admin");
    const ok = await editor.action(api.rubrica.translation.translate, { texts: ["<p>Olá <strong>mundo</strong></p>"], from: "pt-BR", to: "en" });
    expect(ok.translations[0]).toBe("<p>[en] Olá <strong>[en] mundo</strong></p>");
    expect(n).toBe(3);

    mockOpenRouter(() => new Response("erro", { status: 400 }));
    const fail = await editor.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "en" });
    expect(fail.translations).toEqual([null]);
    expect(fail.errors[0]).toMatch(/Tradução falhou: anthropic\/claude-haiku-4.5: HTTP 400/);
  });

  it("sugere para uma página sem gravar, e grava com applyDocument (HTML sanitizado)", async () => {
    mockOpenRouter((body) =>
      body.messages[1]!.content.includes("<p>")
        ? Response.json({ choices: [{ message: { content: '<p onclick="x()">[en] Texto</p>' } }] })
        : null,
    );
    const editor = await as(t, "content-editor");
    const pageId = await editor.mutation(api.rubrica.pages.create, {
      path: "/sobre",
      title: { "pt-BR": "Sobre" },
      blocks: [{ id: "t1", type: "texto", visible: true, fields: { title: { "pt-BR": "Quem sou" }, body: { "pt-BR": "<p>Texto</p>" } } }],
    });
    const target = { kind: "page" as const, id: pageId };
    const draft = await editor.action(api.rubrica.translation.translateDocument, { target, from: "pt-BR", to: "en" });
    expect(Object.fromEntries(draft.fields.map((f) => [f.path, f.suggestion]))).toEqual({
      title: "[en] Sobre",
      "blocks.0.fields.title": "[en] Quem sou",
      "blocks.0.fields.body": "<p>[en] Texto</p>",
    });
    expect((await editor.query(api.rubrica.pages.get, { id: pageId }))?.title).toEqual({ "pt-BR": "Sobre" });

    const saved = await editor.action(api.rubrica.translation.applyDocument, { target, from: "pt-BR", to: "en", paths: ["title", "blocks.0.fields.body"] });
    expect(saved.applied.sort()).toEqual(["blocks.0.fields.body", "title"]);
    expect(saved.failed).toEqual([]);
    const page = await editor.query(api.rubrica.pages.get, { id: pageId });
    expect(page?.title).toEqual({ "pt-BR": "Sobre", en: "[en] Sobre" });
    expect(page?.blocks[0]!.fields.body).toEqual({ "pt-BR": "<p>Texto</p>", en: "<p>[en] Texto</p>" });
    expect(page?.blocks[0]!.fields.title).toEqual({ "pt-BR": "Quem sou" });
  });

  it("traduz um post (permissão do blog)", async () => {
    mockOpenRouter();
    const blog = await as(t, "blog-editor");
    const id = await blog.mutation(api.rubrica.posts.create, { title: { "pt-BR": "Post" }, content: { "pt-BR": "<p>Corpo</p>" } });
    const res = await blog.action(api.rubrica.translation.applyDocument, { target: { kind: "collection", collection: "posts", id }, from: "pt-BR", to: "en" });
    expect(res.applied.sort()).toEqual(["content", "title"]);
    expect((await blog.query(api.rubrica.posts.get, { id }))?.content).toEqual({ "pt-BR": "<p>Corpo</p>", en: "<p>[en] Corpo</p>" });
    await expect(blog.action(api.rubrica.translation.translateDocument, { target: { kind: "page", id: "x" }, from: "pt-BR", to: "en" })).rejects.toThrow(/Sem permissão/);
  });

  it("exige o plugin, a chave e um idioma do site", async () => {
    mockOpenRouter();
    const admin = await as(t, "admin");
    await expect(admin.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "fr" })).rejects.toThrow(/não está na lista do site/);
    await expect(admin.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "pt-BR" })).rejects.toThrow(/iguais/);
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(admin.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "en" })).rejects.toThrow(/OPENROUTER_API_KEY/);
    await admin.mutation(api.rubrica.settings.setPlugin, { id: "translation", enabled: false });
    await expect(admin.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "en" })).rejects.toThrow(/plugin "translation" está desligado/);
    const comercialSemTexto = await as(t, "proposal-editor");
    await expect(comercialSemTexto.action(api.rubrica.translation.translate, { texts: ["Oi"], from: "pt-BR", to: "en" })).rejects.toThrow(/Sem permissão/);
  });
});
