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

import { seed } from "../../convex/aboutDailyRoutine";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/aboutDailyRoutine · seed", () => {
  let ctx: MockCtx;

  const seedAndAll = async () => {
    await handler(seed)(ctx, {});
    return ctx.db._all("aboutDailyRoutine");
  };

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente 3 itens em tabela vazia", async () => {
    const docs = await seedAndAll();
    expect(docs.length).toBe(3);
  });

  it("preenche description com os 3 textos esperados em ptBR", async () => {
    const docs = await seedAndAll();
    const descriptions = docs.map((d) => d.description).sort();
    expect(descriptions).toEqual([
      "Manhã: leitura técnica e revisão de PRs",
      "Noite: projetos pessoais e estudo",
      "Tarde: desenvolvimento e pair programming",
    ]);
  });

  it("todo item usa spanSize '1x1' como default seguro", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(d.spanSize).toBe("1x1");
    }
  });

  it("todo item tem displayOrder monotônico e distinto começando em 0", async () => {
    const docs = await seedAndAll();
    const orders = docs.map((d) => d.displayOrder).sort((a, b) => a - b);
    expect(orders).toEqual([0, 1, 2]);
  });

  it("todo item tem createdAt numérico", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(typeof d.createdAt).toBe("number");
      expect(Number.isFinite(d.createdAt)).toBe(true);
    }
  });

  it("não define descriptionTranslations (será preenchido pela equipe via admin)", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(d.descriptionTranslations).toBeUndefined();
    }
  });

  it("não define imageId nem imageUrl (defaults seguros)", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(d.imageId).toBeUndefined();
      expect(d.imageUrl).toBeUndefined();
    }
  });

  it("é no-op quando a tabela já está completa (3 itens)", async () => {
    await handler(seed)(ctx, {});
    const before = ctx.db._all("aboutDailyRoutine").length;
    await handler(seed)(ctx, {});
    expect(ctx.db._all("aboutDailyRoutine").length).toBe(before);
  });

  it("é fill-only: com tabela parcialmente populada completa até 3", async () => {
    ctx.db._seed("aboutDailyRoutine", [
      { description: "Pré-existente", spanSize: "1x1", displayOrder: 0, createdAt: 1 },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("aboutDailyRoutine");
    expect(docs.length).toBe(3);
    expect(docs.filter((d) => d.description === "Pré-existente").length).toBe(1);
  });

  it("é idempotente: rodar 2× não duplica itens", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    expect(ctx.db._all("aboutDailyRoutine").length).toBe(3);
  });
});
