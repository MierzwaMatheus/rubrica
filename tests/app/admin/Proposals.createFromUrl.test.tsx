import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/proposals", vi.fn()]),
  useSearch: vi.fn(() => ""),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), checkRole: () => true, roles: [] }),
}));

vi.mock("@/contexts/PluginsContext", () => ({
  usePlugins: () => ({ isEnabled: () => true }),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteConfig: { getAll: "siteConfig:getAll" },
    siteTexts: { getAll: "siteTexts:getAll" },
    posts: { listAdmin: "posts:listAdmin" },
    projects: { list: "projects:list" },
    proposals: { listAdmin: "proposals:listAdmin", create: "proposals:create", update: "proposals:update", remove: "proposals:remove", permanentDelete: "proposals:permanentDelete", restore: "proposals:restore" },
    contactInfo: { get: "contactInfo:get" },
    contractTemplates: { list: "contractTemplates:list", getDefault: "contractTemplates:getDefault" },
    services: { list: "services:list" },
  },
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@radix-ui/react-dialog")>();
  return {
    ...actual,
    Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      <div data-open={open ? "true" : "false"}>{open ? <div role="dialog">{children}</div> : children}</div>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Description: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import { useSearch } from "wouter";
import AdminProposals from "@/pages/admin/Proposals";

describe("Proposals — Ciclo 4 (issue#56): abre modal via ?create=true", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não abre o modal de criação quando URL não tem ?create=true", () => {
    vi.mocked(useSearch).mockReturnValue("");
    render(<AdminProposals />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre o modal de criação quando URL tem ?create=true", () => {
    vi.mocked(useSearch).mockReturnValue("?create=true");
    render(<AdminProposals />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
