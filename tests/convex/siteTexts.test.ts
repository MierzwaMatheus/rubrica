import { describe, it, expect, beforeEach, vi } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({
    auth: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    store: vi.fn(),
    isAuthenticated: vi.fn(),
  }),
  getAuthUserId,
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import { getAll, getByPage, seed, update, updateInternal, translateAllMissing } from "../../convex/siteTexts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/siteTexts · getAll", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna array vazio quando não há registros", async () => {
    const result = await handler(getAll)(ctx, {});
    expect(result).toEqual([]);
  });

  it("retorna todos os registros presentes na tabela", async () => {
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "s2", key: "about.title", page: "about", ptBR: "Sobre", enUS: "About" },
    ]);
    const result = await handler(getAll)(ctx, {});
    expect(result).toHaveLength(2);
    expect(result.map((r: any) => r.key)).toEqual(
      expect.arrayContaining(["home.greeting", "about.title"])
    );
  });
});

describe("convex/siteTexts · getByPage", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "s2", key: "home.title", page: "home", ptBR: "Título", enUS: "Title" },
      { _id: "s3", key: "about.title", page: "about", ptBR: "Sobre", enUS: "About" },
    ]);
  });

  it("retorna apenas os registros da página solicitada", async () => {
    const result = await handler(getByPage)(ctx, { page: "home" });
    expect(result).toHaveLength(2);
    expect(result.every((r: any) => r.page === "home")).toBe(true);
  });

  it("retorna array vazio para página sem registros", async () => {
    const result = await handler(getByPage)(ctx, { page: "blog" });
    expect(result).toEqual([]);
  });
});

describe("convex/siteTexts · seed", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("popula a tabela com todas as chaves dos arquivos de tradução (295 chaves)", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("siteTexts");
    expect(docs.length).toBe(295);
  });

  it("é idempotente — rodar duas vezes não duplica registros", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("siteTexts");
    expect(docs.length).toBe(295);
  });

  it("cada registro tem key em dot-notation e page igual ao primeiro segmento", async () => {
    await handler(seed)(ctx, {});
    const homeGreeting = ctx.db._all("siteTexts").find((d: any) => d.key === "home.greeting");
    expect(homeGreeting).toBeDefined();
    expect(homeGreeting?.page).toBe("home");
    expect(homeGreeting?.ptBR).toBeTruthy();
  });

  it("inclui chaves home.hero.technologies.* com page=home e ptBR não-vazio", async () => {
    await handler(seed)(ctx, {});
    const techKeys = ctx.db._all("siteTexts").filter((d: any) =>
      d.key.startsWith("home.hero.technologies."),
    );
    expect(techKeys.length).toBeGreaterThan(0);
    for (const k of techKeys) {
      expect(k.page).toBe("home");
      expect(typeof k.ptBR).toBe("string");
      expect(k.ptBR.length).toBeGreaterThan(0);
    }
  });
});

describe("convex/siteTexts · update", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
    ]);
  });

  it("admin pode atualizar ptBR e enUS de um registro existente", async () => {
    asRole(ctx, "admin");
    await handler(update)(ctx, { key: "home.greeting", ptBR: "Novo valor", enUS: "New value" });
    const doc = ctx.db._all("siteTexts").find((d: any) => d.key === "home.greeting");
    expect(doc?.ptBR).toBe("Novo valor");
    expect(doc?.enUS).toBe("New value");
  });

  it("lança erro quando usuário não autenticado tenta atualizar", async () => {
    await expect(
      handler(update)(ctx, { key: "home.greeting", ptBR: "Tentativa" })
    ).rejects.toThrow();
  });

  it("lança erro quando chave não existe", async () => {
    asRole(ctx, "admin");
    await expect(
      handler(update)(ctx, { key: "home.inexistente", ptBR: "Valor" })
    ).rejects.toThrow("siteTexts key not found: home.inexistente");
  });
});

describe("convex/siteTexts · updateInternal", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá" },
    ]);
  });

  it("salva enUS em registro existente sem verificação de role", async () => {
    await handler(updateInternal)(ctx, { key: "home.greeting", enUS: "Hello" });
    const doc = ctx.db._all("siteTexts").find((d: any) => d.key === "home.greeting");
    expect(doc?.enUS).toBe("Hello");
  });

  it("lança erro quando chave não existe", async () => {
    await expect(
      handler(updateInternal)(ctx, { key: "home.inexistente", enUS: "Hello" })
    ).rejects.toThrow("siteTexts key not found: home.inexistente");
  });
});

describe("convex/siteTexts · translateAllMissing", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "s2", key: "home.title", page: "home", ptBR: "Título" },
      { _id: "s3", key: "about.desc", page: "about", ptBR: "Descrição" },
    ]);
  });

  it("chama runAction apenas com os textos dos itens sem enUS", async () => {
    asRole(ctx, "admin");
    const allDocs = ctx.db._all("siteTexts");
    ctx.runQuery
      .mockResolvedValueOnce({ userId: "u1" }) // requireAuthQuery
      .mockResolvedValueOnce(allDocs);           // getAllInternal
    ctx.runAction.mockResolvedValue({ translatedTexts: ["Title", "Description"] });
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(translateAllMissing)(ctx, {});

    const actionCall = ctx.runAction.mock.calls[0];
    expect(actionCall[1].texts).toEqual(["Título", "Descrição"]);
  });

  it("não chama runAction quando todos os itens já têm enUS", async () => {
    asRole(ctx, "admin");
    const onlyTranslated = [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
    ];
    ctx.runQuery
      .mockResolvedValueOnce({ userId: "u1" })
      .mockResolvedValueOnce(onlyTranslated);

    await handler(translateAllMissing)(ctx, {});

    expect(ctx.runAction).not.toHaveBeenCalled();
  });

  it("erros individuais não travam o processo — salva os demais itens", async () => {
    asRole(ctx, "admin");
    const allDocs = ctx.db._all("siteTexts");
    ctx.runQuery
      .mockResolvedValueOnce({ userId: "u1" })
      .mockResolvedValueOnce(allDocs);
    ctx.runAction.mockResolvedValue({ translatedTexts: ["Title", "Description"] });
    ctx.runMutation
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("falha simulada ao salvar item 2"));

    await expect(handler(translateAllMissing)(ctx, {})).resolves.not.toThrow();
    expect(ctx.runMutation).toHaveBeenCalledTimes(2);
  });
});

describe("convex/siteTexts · update marca publicação pendente", () => {
  it("depois de editar um texto, o site fica com mudanças pendentes", async () => {
    const ctx = createMockCtx();
    asRole(ctx, "admin");
    ctx.db._seed("siteTexts", [{ key: "home.title", page: "home", ptBR: "Olá", updatedAt: 1 }]);
    await handler(update)(ctx, { key: "home.title", ptBR: "Oi", enUS: "Hi" });
    expect(ctx.db._all("deployStatus")[0]?.pendingChanges).toBe(true);
  });
});

describe("convex/siteTexts · seed preserva textos personalizados", () => {
  it("não sobrescreve um texto que já existe (rodar o setup de novo não apaga a personalização)", async () => {
    const ctx = createMockCtx();
    ctx.db._seed("siteTexts", [
      { key: "home.greeting", page: "home", ptBR: "Oi, pessoal", enUS: "Hey, folks", updatedAt: 1 },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("siteTexts").filter((d: any) => d.key === "home.greeting");
    expect(docs).toHaveLength(1);
    expect(docs[0].ptBR).toBe("Oi, pessoal");
    expect(docs[0].enUS).toBe("Hey, folks");
  });

  it("preenche só o inglês que faltava, sem mexer no português", async () => {
    const ctx = createMockCtx();
    ctx.db._seed("siteTexts", [{ key: "home.greeting", page: "home", ptBR: "Oi, pessoal", updatedAt: 1 }]);
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("siteTexts").find((d: any) => d.key === "home.greeting");
    expect(doc.ptBR).toBe("Oi, pessoal");
    expect(typeof doc.enUS).toBe("string");
    expect(doc.enUS.length).toBeGreaterThan(0);
  });

  it("cria as chaves novas que ainda não existem", async () => {
    const ctx = createMockCtx();
    ctx.db._seed("siteTexts", [{ key: "home.greeting", page: "home", ptBR: "Oi", enUS: "Hi", updatedAt: 1 }]);
    await handler(seed)(ctx, {});
    expect(ctx.db._all("siteTexts").length).toBe(295);
  });
});
