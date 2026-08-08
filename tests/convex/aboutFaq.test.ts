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

import { seed } from "../../convex/aboutFaq";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/aboutFaq · seed", () => {
  let ctx: MockCtx;

  const seedAndAll = async () => {
    await handler(seed)(ctx, {});
    return ctx.db._all("aboutFaq");
  };

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente 3 itens em tabela vazia", async () => {
    const docs = await seedAndAll();
    expect(docs.length).toBe(3);
  });

  it("preenche os 3 pares pergunta+resposta esperados em ptBR", async () => {
    const docs = await seedAndAll();
    const pairs = docs
      .map((d) => ({ question: d.question, answer: d.answer }))
      .sort((a, b) => a.question.localeCompare(b.question));
    expect(pairs).toEqual([
      {
        question: "Aceita projetos remotos?",
        answer: "Sim, trabalho 100% remoto com clientes de qualquer região.",
      },
      {
        question: "Como é o seu processo de trabalho?",
        answer:
          "Começo com um briefing detalhado, defino escopo e entregas, itero com feedback frequente.",
      },
      {
        question: "Qual é o seu stack preferido?",
        answer: "React no frontend, Node.js ou Convex no backend, com TypeScript em tudo.",
      },
    ]);
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

  it("não define questionTranslations nem answerTranslations (serão preenchidos pela equipe via admin)", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(d.questionTranslations).toBeUndefined();
      expect(d.answerTranslations).toBeUndefined();
    }
  });

  it("é no-op quando a tabela já está completa (3 itens)", async () => {
    await handler(seed)(ctx, {});
    const before = ctx.db._all("aboutFaq").length;
    await handler(seed)(ctx, {});
    expect(ctx.db._all("aboutFaq").length).toBe(before);
  });

  it("é fill-only: com tabela parcialmente populada completa até 3", async () => {
    ctx.db._seed("aboutFaq", [
      {
        question: "Existente?",
        answer: "Sim",
        displayOrder: 0,
        createdAt: 1,
      },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("aboutFaq");
    expect(docs.length).toBe(3);
    expect(docs.filter((d) => d.question === "Existente?").length).toBe(1);
  });

  it("é idempotente: rodar 2× não duplica itens", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    expect(ctx.db._all("aboutFaq").length).toBe(3);
  });
});
