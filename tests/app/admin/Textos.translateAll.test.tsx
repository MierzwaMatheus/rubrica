import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/textos"]),
  useSearch: vi.fn(() => ""),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), checkRole: () => true }),
}));

vi.mock("@/contexts/PluginsContext", () => ({
  usePlugins: () => ({ isEnabled: () => true }),
}));

const mockTranslateAllMissing = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => [
    { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá" },
    { _id: "s2", key: "home.title", page: "home", ptBR: "Título", enUS: "Title" },
  ]),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => mockTranslateAllMissing),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteTexts: {
      getAll: "siteTexts:getAll",
      update: "siteTexts:update",
      translateAllMissing: "siteTexts:translateAllMissing",
    },
    siteConfig: { getAll: "siteConfig:getAll" },
    posts: { listAdmin: "posts:listAdmin" },
    projects: { list: "projects:list" },
    proposals: { listAdmin: "proposals:listAdmin" },
    services: { list: "services:list" },
    contactInfo: { get: "contactInfo:get" },
  },
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import AdminTextos from "@/pages/admin/Textos";

describe("AdminTextos — botão Traduzir tudo com IA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe o botão 'Traduzir tudo com IA' na tela", () => {
    render(<AdminTextos />);
    expect(
      screen.getByRole("button", { name: /traduzir tudo com ia/i })
    ).toBeInTheDocument();
  });

  it("botão fica desabilitado e exibe 'Traduzindo...' durante a execução", async () => {
    let resolveAction!: () => void;
    mockTranslateAllMissing.mockReturnValue(
      new Promise<void>((res) => { resolveAction = res; })
    );

    const { getByRole } = render(<AdminTextos />);
    const btn = getByRole("button", { name: /traduzir tudo com ia/i });

    btn.click();

    await vi.waitFor(() => {
      expect(getByRole("button", { name: /traduzindo/i })).toBeInTheDocument();
    });
    expect(btn).toBeDisabled();

    resolveAction();
  });
});
