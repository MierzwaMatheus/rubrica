import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteConfig: { getAll: "siteConfig:getAll" },
    posts: { listAdmin: "posts:listAdmin" },
    projects: { list: "projects:list" },
    proposals: { listAdmin: "proposals:listAdmin" },
    services: { list: "services:list" },
    siteTexts: { getAll: "siteTexts:getAll" },
    contactInfo: { get: "contactInfo:get" },
  },
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@radix-ui/react-dialog")>();
  return {
    ...actual,
    Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      open ? <div role="dialog">{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  };
});

import { AdminLayout } from "@/pages/admin/Dashboard";

describe("Dashboard — Ciclo 6: item 'Textos' no menu admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe link para /admin/textos na sidebar após expandir grupo 'Conteúdo'", async () => {
    const user = userEvent.setup();
    render(<AdminLayout><div /></AdminLayout>);
    await user.click(screen.getByRole("button", { name: /conteúdo/i }));
    expect(screen.getByRole("link", { name: /textos/i })).toBeInTheDocument();
  });

  it("o link aponta para /admin/textos", async () => {
    const user = userEvent.setup();
    render(<AdminLayout><div /></AdminLayout>);
    await user.click(screen.getByRole("button", { name: /conteúdo/i }));
    const link = screen.getByRole("link", { name: /textos/i });
    expect(link).toHaveAttribute("href", "/admin/textos");
  });
});
