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

import { list, getDefault, create, setDefault, remove } from "../../convex/contractTemplates";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

function enablePlugin(ctx: MockCtx, pluginId: string, enabled: boolean) {
  ctx.db._seed("homeContent", [
    { key: `plugin:${pluginId}:enabled`, value: enabled },
  ]);
}

describe("convex/contractTemplates · getDefault", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna null quando nenhum template tem isDefault: true", async () => {
    enablePlugin(ctx, "contract-templates", true);
    ctx.db._seed("contractTemplates", [
      {
        _id: "t1",
        name: "Template A",
        content: "Conteúdo",
        isDefault: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    const result = await handler(getDefault)(ctx, {});
    expect(result).toBeNull();
  });

  it("retorna o template com isDefault: true quando existe", async () => {
    enablePlugin(ctx, "contract-templates", true);
    ctx.db._seed("contractTemplates", [
      {
        _id: "t1",
        name: "Padrão",
        content: "Conteúdo padrão",
        isDefault: true,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        _id: "t2",
        name: "Outro",
        content: "Outro conteúdo",
        isDefault: false,
        createdAt: 2,
        updatedAt: 2,
      },
    ]);
    const result = await handler(getDefault)(ctx, {});
    expect(result).not.toBeNull();
    expect(result.name).toBe("Padrão");
    expect(result.isDefault).toBe(true);
  });
});

describe("convex/contractTemplates · remove", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("exclui o registro pelo id", async () => {
    enablePlugin(ctx, "contract-templates", true);
    asRole(ctx, "admin");
    ctx.db._seed("contractTemplates", [
      { _id: "t1", name: "Para Remover", content: "x", isDefault: false, createdAt: 1, updatedAt: 1 },
    ]);
    await handler(remove)(ctx, { id: "t1" });
    const all = ctx.db._all("contractTemplates");
    expect(all).toHaveLength(0);
  });
});

describe("convex/contractTemplates · setDefault", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("marca o template alvo como isDefault: true e desmarca todos os outros", async () => {
    enablePlugin(ctx, "contract-templates", true);
    asRole(ctx, "admin");
    ctx.db._seed("contractTemplates", [
      { _id: "t1", name: "A", content: "x", isDefault: true, createdAt: 1, updatedAt: 1 },
      { _id: "t2", name: "B", content: "y", isDefault: false, createdAt: 2, updatedAt: 2 },
    ]);
    await handler(setDefault)(ctx, { id: "t2" });
    const all = ctx.db._all("contractTemplates");
    const t1 = all.find((t: any) => t._id === "t1");
    const t2 = all.find((t: any) => t._id === "t2");
    expect(t1.isDefault).toBe(false);
    expect(t2.isDefault).toBe(true);
  });
});

describe("convex/contractTemplates · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("lança erro de autorização quando plugin contract-templates está desativado", async () => {
    enablePlugin(ctx, "contract-templates", false);
    asRole(ctx, "admin");
    await expect(
      handler(create)(ctx, { name: "Novo", content: "Conteúdo", isDefault: false })
    ).rejects.toThrow("PLUGIN_DISABLED:contract-templates");
  });
});

describe("convex/contractTemplates · list", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna array vazio quando plugin contract-templates está desativado", async () => {
    enablePlugin(ctx, "contract-templates", false);
    ctx.db._seed("contractTemplates", [
      {
        _id: "t1",
        name: "Template A",
        content: "Conteúdo",
        isDefault: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result).toEqual([]);
  });
});
