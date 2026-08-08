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

import { getPublic, getAll, set, setBatch } from "../../convex/siteConfig";
import { seedSiteConfig } from "../../convex/seed";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("integração: setBatch → getAll (deduplicação)", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("getAll retorna exatamente 5 registros após setBatch com 5 chaves", async () => {
    const items = [
      { key: "site_title", value: "T" },
      { key: "site_description", value: "D" },
      { key: "site_url", value: "https://exemplo.com" },
      { key: "lang", value: "pt-BR" },
      { key: "twitter_handle", value: "usuario" },
    ];
    await handler(setBatch)(ctx, { items });
    await handler(setBatch)(ctx, { items });

    asRole(ctx, "admin");
    const result = await handler(getAll)(ctx, {});
    expect(result).toHaveLength(5);
  });

  it("getAll retorna os valores corretos após setBatch duplo", async () => {
    const items = [
      { key: "site_title", value: "Meu Portfolio" },
      { key: "lang", value: "en-US" },
      { key: "theme_radius", value: "0.5rem" },
      { key: "theme_font_sans", value: "Inter" },
      { key: "theme_font_mono", value: "JetBrains Mono" },
    ];
    await handler(setBatch)(ctx, { items });
    await handler(setBatch)(ctx, { items });

    asRole(ctx, "root");
    const result = await handler(getAll)(ctx, {});
    const map = Object.fromEntries(result.map((r: any) => [r.key, r.value]));
    expect(map["site_title"]).toBe("Meu Portfolio");
    expect(map["lang"]).toBe("en-US");
    expect(result).toHaveLength(5);
  });
});

describe("integração: set → getPublic (atualização em tempo real)", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("getPublic retorna novo valor após set atualizar site_title", async () => {
    await handler(setBatch)(ctx, { items: [{ key: "site_title", value: "Titulo Original" }] });

    const before = await handler(getPublic)(ctx, {});
    expect(before.find((r: any) => r.key === "site_title")?.value).toBe("Titulo Original");

    asRole(ctx, "admin");
    await handler(set)(ctx, { key: "site_title", value: "Titulo Novo" });

    getAuthUserId.mockResolvedValue(null);
    const after = await handler(getPublic)(ctx, {});
    expect(after.find((r: any) => r.key === "site_title")?.value).toBe("Titulo Novo");
  });

  it("getPublic não tem registros duplicados após set sobrescrever", async () => {
    asRole(ctx, "root");
    await handler(set)(ctx, { key: "site_title", value: "V1" });
    await handler(set)(ctx, { key: "site_title", value: "V2" });

    getAuthUserId.mockResolvedValue(null);
    const result = await handler(getPublic)(ctx, {});
    const matches = result.filter((r: any) => r.key === "site_title");
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe("V2");
  });
});

describe("integração: seedSiteConfig → getPublic", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("getPublic retorna todas as chaves inseridas pelo seed", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const result = await handler(getPublic)(ctx, {});
    const keys = result.map((r: any) => r.key);
    expect(keys).toContain("site_title");
    expect(keys).toContain("site_url");
    expect(keys).toContain("theme_accent_color");
    expect(keys).toContain("lang");
    expect(keys).toContain("theme_font_sans");
    expect(keys).toContain("theme_font_mono");
  });

  it("getPublic retorna exatamente as chaves públicas inseridas pelo seed (sem internas)", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const result = await handler(getPublic)(ctx, {});
    const keys = result.map((r: any) => r.key);
    expect(keys).not.toContain("og_image_storage_id");
    expect(result.length).toBeGreaterThan(0);
  });
});
