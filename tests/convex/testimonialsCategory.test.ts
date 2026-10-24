import { describe, it, expect, beforeEach, vi } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({ getAuthUserId: vi.fn() }));
vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({ auth: {}, signIn: vi.fn(), signOut: vi.fn(), store: vi.fn(), isAuthenticated: vi.fn() }),
  getAuthUserId,
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));
vi.mock("@convex-dev/auth/providers/Password", () => ({ Password: () => ({}) }));

import { createWithAvatar } from "../../convex/testimonials";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/testimonials · createWithAvatar category", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    ctx.db._seed("users", [{ _id: "u1", email: "u@x.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "admin" }]);
    getAuthUserId.mockResolvedValue("u1");
  });

  it("accepts category as an optional arg", () => {
    const args = JSON.parse((createWithAvatar as any).exportArgs()).value;
    expect(args.category.optional).toBe(true);
  });

  it("stores the category", async () => {
    const id = await handler(createWithAvatar)(ctx, { name: "X", role: "Y", text: "Z", category: "Tecnologia" });
    expect((await ctx.db.get(id))!.category).toBe("Tecnologia");
  });

  it("keeps category undefined when not given", async () => {
    const id = await handler(createWithAvatar)(ctx, { name: "X", role: "Y", text: "Z" });
    expect((await ctx.db.get(id))!.category).toBeUndefined();
  });
});
