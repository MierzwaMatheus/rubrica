// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { api, as, seedSettings, setup, type T } from "./_setup";

describe("posts", () => {
  let t: T;
  let editor: Awaited<ReturnType<typeof as>>;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
    editor = await as(t, "blog-editor");
  });

  const post = (title: string) => ({ title: { "pt-BR": title, en: `${title} (en)` }, content: { "pt-BR": "<p>Oi</p>" } });

  it("gera o slug do título no idioma principal, sem repetir", async () => {
    const a = await editor.mutation(api.rubrica.posts.create, post("Olá, Mundo!"));
    const b = await editor.mutation(api.rubrica.posts.create, post("Olá Mundo"));
    expect((await editor.query(api.rubrica.posts.get, { id: a }))?.slug).toBe("ola-mundo");
    expect((await editor.query(api.rubrica.posts.get, { id: b }))?.slug).toBe("ola-mundo-2");
  });

  it("slug estável: editar o título não muda o slug", async () => {
    const id = await editor.mutation(api.rubrica.posts.create, post("Primeiro título"));
    await editor.mutation(api.rubrica.posts.publish, { id });
    await editor.mutation(api.rubrica.posts.update, { id, patch: { title: { "pt-BR": "Título novo" } } });
    const doc = await editor.query(api.rubrica.posts.get, { id });
    expect(doc?.slug).toBe("primeiro-titulo");
    expect(doc?.title).toEqual({ "pt-BR": "Título novo" });
  });

  it("slug só muda quando pedido, com formato válido e livre", async () => {
    const a = await editor.mutation(api.rubrica.posts.create, { ...post("A"), slug: "post-a" });
    const b = await editor.mutation(api.rubrica.posts.create, post("B"));
    await expect(editor.mutation(api.rubrica.posts.create, { ...post("C"), slug: "post-a" })).rejects.toThrow(/já está em uso/);
    await expect(editor.mutation(api.rubrica.posts.create, { ...post("C"), slug: "Post C" })).rejects.toThrow(/Slug inválido/);
    await expect(editor.mutation(api.rubrica.posts.update, { id: b, patch: { slug: "post-a" } })).rejects.toThrow(/já está em uso/);
    await expect(editor.mutation(api.rubrica.posts.update, { id: b, patch: { slug: "x y" } })).rejects.toThrow(/Slug inválido/);
    await editor.mutation(api.rubrica.posts.update, { id: a, patch: { slug: "post-a" } });
    await editor.mutation(api.rubrica.posts.update, { id: b, patch: { slug: "novo-b" } });
    expect((await editor.query(api.rubrica.posts.get, { id: b }))?.slug).toBe("novo-b");
  });

  it("um slug na lixeira continua ocupado (restaurar não pode colidir)", async () => {
    const a = await editor.mutation(api.rubrica.posts.create, { ...post("A"), slug: "a" });
    await editor.mutation(api.rubrica.posts.remove, { id: a });
    await expect(editor.mutation(api.rubrica.posts.create, { ...post("A"), slug: "a" })).rejects.toThrow(/já está em uso/);
  });

  it("nasce rascunho; a data da primeira publicação fica ao republicar", async () => {
    const id = await editor.mutation(api.rubrica.posts.create, post("P"));
    let doc = await editor.query(api.rubrica.posts.get, { id });
    expect(doc?.published).toBe(false);
    expect(doc?.publishedAt).toBeUndefined();
    await editor.mutation(api.rubrica.posts.publish, { id });
    const first = (await editor.query(api.rubrica.posts.get, { id }))?.publishedAt;
    expect(typeof first).toBe("number");
    await editor.mutation(api.rubrica.posts.unpublish, { id });
    await new Promise((r) => setTimeout(r, 5));
    await editor.mutation(api.rubrica.posts.publish, { id });
    doc = await editor.query(api.rubrica.posts.get, { id });
    expect(doc?.published).toBe(true);
    expect(doc?.publishedAt).toBe(first);
  });

  it("sanitiza o HTML e guarda SEO por idioma", async () => {
    const id = await editor.mutation(api.rubrica.posts.create, {
      title: { "pt-BR": "SEO" },
      content: { "pt-BR": '<h2>Oi</h2><img src="https://cdn.exemplo.dev/a.png" onerror="alert(1)"><script>x()</script>', en: "<p>ok</p>" },
      seo: { title: { "pt-BR": "Título no Google", en: "" }, description: { "pt-BR": "Descrição" }, noindex: false },
    });
    const doc = await editor.query(api.rubrica.posts.get, { id });
    expect(doc?.content).toEqual({ "pt-BR": '<h2>Oi</h2><img src="https://cdn.exemplo.dev/a.png">', en: "<p>ok</p>" });
    expect(doc?.seo).toEqual({ title: { "pt-BR": "Título no Google" }, description: { "pt-BR": "Descrição" }, noindex: false });
    await editor.mutation(api.rubrica.posts.update, { id, patch: { content: { "pt-BR": "<p onclick='x'>a</p>" } } });
    expect((await editor.query(api.rubrica.posts.get, { id }))?.content).toEqual({ "pt-BR": "<p>a</p>" });
  });

  it("apaga campos opcionais com unset", async () => {
    const id = await editor.mutation(api.rubrica.posts.create, { ...post("U"), excerpt: { "pt-BR": "Resumo" } });
    await editor.mutation(api.rubrica.posts.update, { id, patch: {}, unset: ["excerpt"] });
    expect((await editor.query(api.rubrica.posts.get, { id }))?.excerpt).toBeUndefined();
    await expect(editor.mutation(api.rubrica.posts.update, { id, patch: {}, unset: ["title"] })).rejects.toThrow(/não pode ser apagado/);
  });

  it("título vazio em todos os idiomas é recusado", async () => {
    await expect(editor.mutation(api.rubrica.posts.create, { title: { "pt-BR": " " }, content: { "pt-BR": "x" } })).rejects.toThrow(/pelo menos um idioma/);
    await expect(editor.mutation(api.rubrica.posts.create, { title: { pt_BR: "x" }, content: { "pt-BR": "x" } })).rejects.toThrow(/código de idioma inválido/);
  });

  it("com o blog desligado, não grava posts", async () => {
    const root = await as(t, "root");
    await root.mutation(api.rubrica.settings.setPlugin, { id: "blog", enabled: false });
    await expect(editor.mutation(api.rubrica.posts.create, post("X"))).rejects.toThrow(/plugin "blog" está desligado/);
  });
});

describe("coleções simples", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("acrescenta no fim e reordena", async () => {
    const c = await as(t, "admin");
    const a = await c.mutation(api.rubrica.services.create, { title: { "pt-BR": "A" } });
    const b = await c.mutation(api.rubrica.services.create, { title: { "pt-BR": "B" } });
    const d = await c.mutation(api.rubrica.services.create, { title: { "pt-BR": "C" } });
    expect((await c.query(api.rubrica.services.list, {})).map((s) => s.order)).toEqual([0, 1, 2]);
    await c.mutation(api.rubrica.services.reorder, { ids: [d, a, b] });
    expect((await c.query(api.rubrica.services.list, {})).map((s) => (s.title as Record<string, string>)["pt-BR"])).toEqual(["C", "A", "B"]);
  });

  it("nasce publicado; projetos nascem rascunho", async () => {
    const c = await as(t, "admin");
    const s = await c.mutation(api.rubrica.services.create, { title: { "pt-BR": "A" } });
    const p = await c.mutation(api.rubrica.projects.create, { title: { "pt-BR": "Case" } });
    expect((await c.query(api.rubrica.services.get, { id: s }))?.published).toBe(true);
    const project = await c.query(api.rubrica.projects.get, { id: p });
    expect(project?.published).toBe(false);
    expect(project?.slug).toBe("case");
  });

  it("sanitiza o corpo das seções do case", async () => {
    const c = await as(t, "admin");
    const id = await c.mutation(api.rubrica.projects.create, {
      title: { "pt-BR": "Case" },
      sections: [{ title: { "pt-BR": "Contexto" }, body: { "pt-BR": "<p>a</p><iframe src='x'></iframe>" } }],
    });
    expect((await c.query(api.rubrica.projects.get, { id }))?.sections).toEqual([{ title: { "pt-BR": "Contexto" }, body: { "pt-BR": "<p>a</p>" } }]);
  });

  it("projeto guarda a métrica opcional (valor e rótulo por idioma) e a apaga com unset", async () => {
    const c = await as(t, "admin");
    const id = await c.mutation(api.rubrica.projects.create, {
      title: { "pt-BR": "Case" },
      metric: { value: "~50", label: { "pt-BR": "skills em produção", en: "skills in production" } },
    });
    expect((await c.query(api.rubrica.projects.get, { id }))?.metric).toEqual({ value: "~50", label: { "pt-BR": "skills em produção", en: "skills in production" } });
    await c.mutation(api.rubrica.projects.update, { id, patch: {}, unset: ["metric"] });
    expect((await c.query(api.rubrica.projects.get, { id }))?.metric).toBeUndefined();
    await expect(c.mutation(api.rubrica.projects.create, { title: { "pt-BR": "X" }, metric: { value: 3 } as never })).rejects.toThrow();
  });

  it("projeto guarda a categoria opcional por idioma, junto das etiquetas", async () => {
    const c = await as(t, "admin");
    const id = await c.mutation(api.rubrica.projects.create, { title: { "pt-BR": "Case" }, category: { "pt-BR": "Produto", en: "Product" }, tags: ["fintech"] });
    expect(await c.query(api.rubrica.projects.get, { id })).toMatchObject({ category: { "pt-BR": "Produto", en: "Product" }, tags: ["fintech"] });
    await expect(c.mutation(api.rubrica.projects.create, { title: { "pt-BR": "X" }, category: { "pt-BR": 3 } as never })).rejects.toThrow();
  });

  it("item do currículo guarda o grupo opcional por idioma", async () => {
    const c = await as(t, "admin");
    const id = await c.mutation(api.rubrica.resume.create, { kind: "skill", title: { "pt-BR": "Figma" }, group: { "pt-BR": "Ferramentas" } });
    expect((await c.query(api.rubrica.resume.get, { id }))?.group).toEqual({ "pt-BR": "Ferramentas" });
  });

  it("aparência aceita o id do esquema de cor", async () => {
    const root = await as(t, "root");
    await root.mutation(api.rubrica.settings.update, { patch: { appearance: { colorMode: "dark", colorToggle: true, scheme: "paper-noir", fontSans: "Inter" } } });
    expect((await root.query(api.rubrica.settings.get, {}))?.appearance).toMatchObject({ scheme: "paper-noir", fontSans: "Inter" });
  });

  it("lista sem a lixeira, a não ser que peça", async () => {
    const c = await as(t, "admin");
    const id = await c.mutation(api.rubrica.faq.create, { question: { "pt-BR": "?" }, answer: { "pt-BR": "!" } });
    await c.mutation(api.rubrica.faq.remove, { id });
    expect(await c.query(api.rubrica.faq.list, {})).toHaveLength(0);
    expect(await c.query(api.rubrica.faq.list, { includeDeleted: true })).toHaveLength(1);
    await expect(c.mutation(api.rubrica.faq.publish, { id })).rejects.toThrow(/lixeira/);
  });
});

describe("textos de interface e configurações", () => {
  it("grava, normaliza e volta ao padrão", async () => {
    const t = setup();
    await seedSettings(t);
    const c = await as(t, "content-editor");
    await c.mutation(api.rubrica.texts.set, { key: "nav.home", value: { "pt-BR": "Casa", en: "" } });
    expect(await c.query(api.rubrica.texts.list, {})).toEqual({ "nav.home": { "pt-BR": "Casa" } });
    await c.mutation(api.rubrica.texts.set, { key: "nav.home", value: { "pt-BR": "" } });
    expect(await c.query(api.rubrica.texts.list, {})).toEqual({});
    await expect(c.mutation(api.rubrica.texts.set, { key: "chave com espaço", value: { en: "x" } })).rejects.toThrow(/Chave inválida/);
  });

  it("valida idiomas e URL ao configurar", async () => {
    const t = setup();
    await seedSettings(t);
    const root = await as(t, "root");
    await expect(root.mutation(api.rubrica.settings.update, { patch: { locales: { locales: ["en"], default: "pt-BR" } } })).rejects.toThrow(/não está na lista/);
    await expect(root.mutation(api.rubrica.settings.update, { patch: { url: "https://exemplo.dev/" } })).rejects.toThrow(/URL/);
    await root.mutation(api.rubrica.settings.update, { patch: { locales: { locales: ["en", "pt-BR"], default: "en" } } });
    expect((await root.query(api.rubrica.settings.get, {}))?.locales.default).toBe("en");
    const plugins = await root.query(api.rubrica.settings.plugins, {});
    expect(plugins.find((p) => p.id === "resume")?.enabled).toBe(true);
    expect(plugins.some((p) => p.id === "pricing")).toBe(false);
  });

  it("grava ícones, cor da barra, RSS, capa padrão e analytics, e recusa valor inválido", async () => {
    const t = setup();
    await seedSettings(t);
    const admin = await as(t, "admin");
    const image = { url: "/icone.png", width: 192, height: 192 };
    await admin.mutation(api.rubrica.settings.update, {
      patch: {
        icons: { svg: { url: "/favicon.svg" }, icon192: image },
        themeColor: { light: "#FAFAFA", dark: "#0a0a0a" },
        rss: { title: { "pt-BR": "Blog" } },
        defaultPostCover: { url: "/capa.png" },
        analytics: { scriptUrl: "https://cloud.umami.is/script.js", websiteId: "0e7c-abc" },
      },
    });
    const saved = await admin.query(api.rubrica.settings.get, {});
    expect(saved).toMatchObject({ icons: { icon192: image }, themeColor: { dark: "#0a0a0a" }, rss: { title: { "pt-BR": "Blog" } }, defaultPostCover: { url: "/capa.png" }, analytics: { websiteId: "0e7c-abc" } });
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { themeColor: { dark: "red;}" } } })).rejects.toThrow(/Cor da barra/);
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { analytics: { scriptUrl: "http://x.com/s.js" } } })).rejects.toThrow(/analytics inválido/);
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { analytics: { websiteId: "<x>" } } })).rejects.toThrow(/Id do site/);
    const plugins = await admin.query(api.rubrica.settings.plugins, {});
    expect(plugins.find((p) => p.id === "analytics")?.enabled).toBe(false);
  });
});
