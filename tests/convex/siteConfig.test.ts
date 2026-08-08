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

import { getPublic, getByKey, set, setBatch, getAll, setOgImage, PUBLIC_KEYS } from "../../convex/siteConfig";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/siteConfig · getPublic", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna apenas chaves públicas sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Meu Site", createdAt: 1 },
      { key: "og_image_storage_id", value: "store123", createdAt: 2 },
    ]);
    const result = await handler(getPublic)(ctx, {});
    const keys = result.map((r: any) => r.key);
    expect(keys).toContain("site_title");
    expect(keys).not.toContain("og_image_storage_id");
  });

  it("retorna array vazio quando banco está vazio", async () => {
    const result = await handler(getPublic)(ctx, {});
    expect(result).toEqual([]);
  });

  it("não requer autenticação", async () => {
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "T", createdAt: 1 },
    ]);
    await expect(handler(getPublic)(ctx, {})).resolves.toBeDefined();
  });
});

describe("convex/siteConfig · getByKey", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("lança Unauthorized para chave interna sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "og_image_storage_id", value: "s123", createdAt: 1 },
    ]);
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(getByKey)(ctx, { key: "og_image_storage_id" }))
      .rejects.toThrow(/[Uu]nauthorized/);
  });

  it("retorna valor de chave interna quando autenticado", async () => {
    asRole(ctx, "admin");
    ctx.db._seed("siteConfig", [
      { key: "og_image_storage_id", value: "s123", createdAt: 1 },
    ]);
    const result = await handler(getByKey)(ctx, { key: "og_image_storage_id" });
    expect(result?.value).toBe("s123");
  });

  it("retorna chave pública sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Meu Site", createdAt: 1 },
    ]);
    const result = await handler(getByKey)(ctx, { key: "site_title" });
    expect(result?.value).toBe("Meu Site");
  });
});

describe("convex/siteConfig · set", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("lança Forbidden para role content-editor", async () => {
    asRole(ctx, "content-editor");
    await expect(handler(set)(ctx, { key: "site_title", value: "X" }))
      .rejects.toThrow(/[Ff]orbidden/);
  });

  it("lança Unauthorized sem autenticação", async () => {
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(set)(ctx, { key: "site_title", value: "X" }))
      .rejects.toThrow(/[Uu]nauthorized/);
  });

  it("cria chave quando não existe com role admin", async () => {
    asRole(ctx, "admin");
    await handler(set)(ctx, { key: "site_title", value: "Novo Título" });
    const docs = ctx.db._all("siteConfig");
    expect(docs.find((d) => d.key === "site_title")?.value).toBe("Novo Título");
  });

  it("atualiza chave existente sem duplicar com role root", async () => {
    asRole(ctx, "root");
    ctx.db._seed("siteConfig", [{ key: "site_title", value: "Antigo", createdAt: 1 }]);
    await handler(set)(ctx, { key: "site_title", value: "Novo" });
    const docs = ctx.db._all("siteConfig").filter((d) => d.key === "site_title");
    expect(docs).toHaveLength(1);
    expect(docs[0].value).toBe("Novo");
  });
});

describe("convex/siteConfig · setBatch", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("insere múltiplas chaves em lote", async () => {
    await handler(setBatch)(ctx, {
      items: [
        { key: "site_title", value: "T" },
        { key: "lang", value: "pt-BR" },
      ],
    });
    expect(ctx.db._all("siteConfig")).toHaveLength(2);
  });

  it("chamado duas vezes não duplica registros (idempotente)", async () => {
    const items = [{ key: "site_title", value: "T" }];
    await handler(setBatch)(ctx, { items });
    await handler(setBatch)(ctx, { items });
    expect(ctx.db._all("siteConfig").filter((d) => d.key === "site_title")).toHaveLength(1);
  });

  it("atualiza valor quando chave já existe", async () => {
    ctx.db._seed("siteConfig", [{ key: "lang", value: "en-US", createdAt: 1 }]);
    await handler(setBatch)(ctx, { items: [{ key: "lang", value: "pt-BR" }] });
    const docs = ctx.db._all("siteConfig").filter((d) => d.key === "lang");
    expect(docs).toHaveLength(1);
    expect(docs[0].value).toBe("pt-BR");
  });
});

describe("convex/siteConfig · getAll", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("lança Forbidden para role content-editor", async () => {
    asRole(ctx, "content-editor");
    await expect(handler(getAll)(ctx, {})).rejects.toThrow(/[Ff]orbidden/);
  });

  it("lança Unauthorized sem autenticação", async () => {
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(getAll)(ctx, {})).rejects.toThrow(/[Uu]nauthorized/);
  });

  it("retorna todas as chaves incluindo internas com role root", async () => {
    asRole(ctx, "root");
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "T", createdAt: 1 },
      { key: "og_image_storage_id", value: "s", createdAt: 2 },
    ]);
    const result = await handler(getAll)(ctx, {});
    expect(result).toHaveLength(2);
  });

  it("retorna todas as chaves com role admin", async () => {
    asRole(ctx, "admin");
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "T", createdAt: 1 },
    ]);
    const result = await handler(getAll)(ctx, {});
    expect(result).toHaveLength(1);
  });
});

describe("convex/siteConfig · PUBLIC_KEYS — esquema de 4 cores", () => {
  it("contém theme_background, theme_foreground, theme_primary, theme_accent", () => {
    expect(PUBLIC_KEYS).toContain("theme_background");
    expect(PUBLIC_KEYS).toContain("theme_foreground");
    expect(PUBLIC_KEYS).toContain("theme_primary");
    expect(PUBLIC_KEYS).toContain("theme_accent");
  });

  it("não contém theme_radius", () => {
    expect(PUBLIC_KEYS).not.toContain("theme_radius");
  });
});

describe("convex/siteConfig · setOgImage", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    (ctx.storage as any).getUrl = vi.fn().mockResolvedValue("https://exemplo.com/og.jpg");
  });

  it("lança Unauthorized sem autenticação", async () => {
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(setOgImage)(ctx, { storageId: "store1" }))
      .rejects.toThrow(/[Uu]nauthorized/);
  });

  it("salva og_image_storage_id com role root", async () => {
    asRole(ctx, "root");
    await handler(setOgImage)(ctx, { storageId: "store1" });
    const docs = ctx.db._all("siteConfig");
    const storageDoc = docs.find((d) => d.key === "og_image_storage_id");
    expect(storageDoc?.value).toBe("store1");
  });

  it("salva og_image_url derivada do storage com role admin", async () => {
    asRole(ctx, "admin");
    await handler(setOgImage)(ctx, { storageId: "store1" });
    const docs = ctx.db._all("siteConfig");
    const urlDoc = docs.find((d) => d.key === "og_image_url");
    expect(urlDoc?.value).toBe("https://exemplo.com/og.jpg");
  });
});
