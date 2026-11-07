import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const i18n = vi.hoisted(() => ({ locale: "pt-BR" }));
vi.mock("@/i18n/context/I18nContext", () => ({ useI18n: () => ({ locale: i18n.locale }) }));

import { useBlogPosts } from "@/hooks/useBlog";
import { mapBlogPost } from "@/repositories/mappers/convexMappers";

function setup(locale: string, raw: unknown[]) {
  i18n.locale = locale;
  const repo = { list: async () => raw.map(mapBlogPost), getBySlug: async () => null };
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return renderHook(() => useBlogPosts(repo), { wrapper });
}

describe("useBlogPosts — tempo de leitura", () => {
  it("usa a contagem de palavras do build, no idioma da página", async () => {
    const { result } = setup("en-US", [{ _id: "a", title: "A", slug: "a", wordCount: { ptBR: 1000, enUS: 401 } }]);
    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    expect(result.current.posts[0].reading_minutes).toBe(3);
  });

  it("sem contagem (lista do Convex em desenvolvimento), calcula pelo texto", async () => {
    const texto = `<p>${"palavra ".repeat(450)}</p>`;
    const { result } = setup("pt-BR", [{ _id: "b", title: "B", slug: "b", content: texto }]);
    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    expect(result.current.posts[0].reading_minutes).toBe(3);
  });
});
