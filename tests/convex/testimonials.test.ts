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

import {
  list,
  create,
  update,
  remove,
  permanentDelete,
  restore,
  toggleShowOnHome,
  setTranslations,
  unpublish,
  createWithAvatar,
  seed,
} from "../../convex/testimonials";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/testimonials · list", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("excludes soft-deleted by default", async () => {
    ctx.db._seed("testimonials", [
      { name: "A", role: "x", text: "1", showOnHome: false, orderIndex: 1, createdAt: 1 },
      { name: "B", role: "x", text: "2", showOnHome: false, orderIndex: 2, createdAt: 2, deletedAt: 100 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result.map((t: any) => t.name)).toEqual(["A"]);
  });

  it("filters by showOnHome when onlyHome=true", async () => {
    ctx.db._seed("testimonials", [
      { name: "Home", role: "x", text: "1", showOnHome: true, orderIndex: 1, createdAt: 1 },
      { name: "Hidden", role: "x", text: "2", showOnHome: false, orderIndex: 2, createdAt: 2 },
    ]);
    const result = await handler(list)(ctx, { onlyHome: true });
    expect(result.map((t: any) => t.name)).toEqual(["Home"]);
  });

  it("returns all in orderIndex ascending", async () => {
    ctx.db._seed("testimonials", [
      { name: "Z", role: "x", text: "1", showOnHome: false, orderIndex: 5, createdAt: 1 },
      { name: "A", role: "x", text: "2", showOnHome: false, orderIndex: 1, createdAt: 2 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result.map((t: any) => t.name)).toEqual(["Z", "A"]);
  });
});

describe("convex/testimonials · create / update / remove", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("create stores with showOnHome=false default", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    expect((await ctx.db.get(id))!.showOnHome).toBe(false);
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(update)(ctx, { id, name: "X2" });
    expect((await ctx.db.get(id))!.name).toBe("X2");
  });

  it("remove soft-deletes; permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(remove)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeGreaterThan(0);

    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("restore (root only) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/testimonials · toggleShowOnHome", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("flips showOnHome and returns new value", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    expect(await handler(toggleShowOnHome)(ctx, { id })).toBe(true);
    expect((await ctx.db.get(id))!.showOnHome).toBe(true);
    expect(await handler(toggleShowOnHome)(ctx, { id })).toBe(false);
  });

  it("rejects when testimonial not found", async () => {
    asRole(ctx, "admin");
    await expect(
      handler(toggleShowOnHome)(ctx, { id: "ghost" as any }),
    ).rejects.toThrow("Not found");
  });
});

describe("convex/testimonials · setTranslations", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("patches both textTranslations and roleTranslations", async () => {
    const [id] = ctx.db._seed("testimonials", [
      { name: "X", role: "Y", text: "Z", showOnHome: false, orderIndex: 1, createdAt: 1 },
    ]);
    await handler(setTranslations)(ctx, {
      id,
      textTranslations: { ptBR: "Z", enUS: "Z-en" },
      roleTranslations: { ptBR: "Y", enUS: "Y-en" },
    });
    const doc = await ctx.db.get(id);
    expect(doc!.textTranslations.enUS).toBe("Z-en");
    expect(doc!.roleTranslations.enUS).toBe("Y-en");
  });
});

describe("convex/testimonials · unpublish", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects non-published submissions", async () => {
    asRole(ctx, "admin");
    const [subId] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "approved", createdAt: 1 },
    ]);
    await expect(
      handler(unpublish)(ctx, { submissionId: subId }),
    ).rejects.toThrow(/não está publicado/);
  });

  it("removes the testimonial and reverts submission to approved", async () => {
    asRole(ctx, "admin");
    const [tid] = ctx.db._seed("testimonials", [
      { name: "X", role: "Y", text: "Z", showOnHome: false, orderIndex: 1, createdAt: 1 },
    ]);
    const [subId] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "published", testimonialId: tid, createdAt: 1 },
    ]);
    await handler(unpublish)(ctx, { submissionId: subId });
    expect(await ctx.db.get(tid)).toBeNull();
    const sub = await ctx.db.get(subId);
    expect(sub!.status).toBe("approved");
    expect(sub!.testimonialId).toBeUndefined();
  });
});

describe("convex/testimonials · createWithAvatar", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates folder + image metadata then testimonial when avatar provided", async () => {
    asRole(ctx, "admin");
    const id = await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
      avatarStorageId: "storage_1" as any,
      avatarFileSize: 1234,
    });
    const t = await ctx.db.get(id);
    expect(t!.imageId).toBeTruthy();
    const folder = ctx.db._all("imageFolders").find((f) => f.path === "testimonials");
    expect(folder).toBeTruthy();
    const meta = ctx.db._all("imageMetadata")[0];
    expect(meta.storageId).toBe("storage_1");
    expect(meta.fileSize).toBe(1234);
  });

  it("reuses existing folder when present", async () => {
    asRole(ctx, "admin");
    ctx.db._seed("imageFolders", [
      { _id: "folder_1", path: "testimonials", name: "Depoimentos", createdAt: 1 },
    ]);
    await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
      avatarStorageId: "storage_1" as any,
    });
    const folders = ctx.db._all("imageFolders");
    expect(folders).toHaveLength(1);
    expect(folders[0]._id).toBe("folder_1");
  });

  it("creates testimonial without imageId when no avatar", async () => {
    asRole(ctx, "admin");
    const id = await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
    });
    expect((await ctx.db.get(id))!.imageId).toBeUndefined();
  });
});

describe("convex/testimonials · seed", () => {
  let ctx: MockCtx;

  const seedAndAll = async () => {
    await handler(seed)(ctx, {});
    return ctx.db._all("testimonials");
  };

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente 3 depoimentos em tabela vazia", async () => {
    const docs = await seedAndAll();
    expect(docs.length).toBe(3);
  });

  it("primeiro item é Carlos Mendes (CEO, Agência Digital X) com o texto correto", async () => {
    const docs = await seedAndAll();
    const carlos = docs.find((d) => d.name === "Carlos Mendes");
    expect(carlos).toBeTruthy();
    expect(carlos.role).toBe("CEO, Agência Digital X");
    expect(carlos.roleTranslations).toEqual({ ptBR: "CEO, Agência Digital X" });
    expect(carlos.text).toBe(
      "A Ana entregou o projeto dentro do prazo com qualidade acima do esperado. Recomendo sem reservas.",
    );
    expect(carlos.textTranslations).toEqual({
      ptBR: "A Ana entregou o projeto dentro do prazo com qualidade acima do esperado. Recomendo sem reservas.",
    });
  });

  it("último item é Ricardo Alves (CTO, SaaS Z) com o texto correto", async () => {
    const docs = await seedAndAll();
    const ricardo = docs.find((d) => d.name === "Ricardo Alves");
    expect(ricardo).toBeTruthy();
    expect(ricardo.role).toBe("CTO, SaaS Z");
    expect(ricardo.roleTranslations).toEqual({ ptBR: "CTO, SaaS Z" });
    expect(ricardo.text).toBe(
      "Expertise técnica impressionante. O código entregue era limpo, bem estruturado e fácil de manter.",
    );
    expect(ricardo.textTranslations).toEqual({
      ptBR: "Expertise técnica impressionante. O código entregue era limpo, bem estruturado e fácil de manter.",
    });
  });

  it("meio do array é Patrícia Lima (Product Owner, Fintech Y)", async () => {
    const docs = await seedAndAll();
    const patricia = docs.find((d) => d.name === "Patrícia Lima");
    expect(patricia).toBeTruthy();
    expect(patricia.role).toBe("Product Owner, Fintech Y");
    expect(patricia.roleTranslations).toEqual({ ptBR: "Product Owner, Fintech Y" });
    expect(patricia.text).toBe(
      "Comunicação excelente durante todo o projeto. Sempre proativa em reportar impedimentos e propor soluções.",
    );
    expect(patricia.textTranslations).toEqual({
      ptBR: "Comunicação excelente durante todo o projeto. Sempre proativa em reportar impedimentos e propor soluções.",
    });
  });

  it("todos os 3 itens têm showOnHome === true", async () => {
    const docs = await seedAndAll();
    expect(docs).toHaveLength(3);
    for (const d of docs) {
      expect(d.showOnHome).toBe(true);
    }
  });

  it("orderIndex é 0, 1, 2 (sem repetições)", async () => {
    const docs = await seedAndAll();
    const idxs = docs.map((d) => d.orderIndex).sort((a, b) => a - b);
    expect(idxs).toEqual([0, 1, 2]);
  });

  it("todos os 3 itens têm imageUrl preenchido com picsum determinístico", async () => {
    const docs = await seedAndAll();
    expect(docs).toHaveLength(3);
    for (const d of docs) {
      expect(typeof d.imageUrl).toBe("string");
      expect(d.imageUrl.length).toBeGreaterThan(0);
      expect(d.imageUrl).toMatch(/^https:\/\/picsum\.photos\/seed\/[a-z0-9-]+\/256\/256$/);
    }
  });

  it("todo item tem createdAt numérico", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(typeof d.createdAt).toBe("number");
      expect(Number.isFinite(d.createdAt)).toBe(true);
    }
  });

  it("é idempotente: rodar 2× não duplica", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    expect(ctx.db._all("testimonials").length).toBe(3);
  });

  it("com tabela parcialmente populada insere a partir do começo do seed sem duplicar itens pré-existentes que não estão no seed", async () => {
    ctx.db._seed("testimonials", [
      {
        name: "Pré-existente",
        role: "Outro",
        text: "Outro",
        orderIndex: 0,
        showOnHome: true,
        createdAt: 1,
      },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("testimonials");
    // existing.length=1, remaining=3-1=2 → insere seed[0] (Carlos) e seed[1] (Patrícia).
    // Total final: 1 (pré-existente) + 2 = 3.
    expect(docs.length).toBe(3);
    expect(docs.some((d) => d.name === "Pré-existente")).toBe(true);
    expect(docs.some((d) => d.name === "Carlos Mendes")).toBe(true);
    expect(docs.some((d) => d.name === "Patrícia Lima")).toBe(true);
    expect(docs.some((d) => d.name === "Ricardo Alves")).toBe(false);
  });

  it("não persiste campo rating (não existe no schema)", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(d.rating).toBeUndefined();
    }
  });
});
