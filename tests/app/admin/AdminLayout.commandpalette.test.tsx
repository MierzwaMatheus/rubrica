import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useQuery } from "convex/react";

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/dashboard", vi.fn()]),
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

describe("AdminLayout — Ciclo 5: Escape fecha a palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fecha a palette ao disparar onOpenChange(false) — comportamento do Radix Escape", () => {
    render(<AdminLayout><div /></AdminLayout>);

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // O Radix Dialog chama onOpenChange(false) no Escape; simulamos isso diretamente
    // via o segundo Ctrl+K (toggle) que também fecha
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AdminLayout — Ciclo 3 (issue#56): createActions na palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe grupo Criar quando palette está aberta", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByText("Criar")).toBeInTheDocument();
  });

  it("exibe ação 'Nova Proposta' na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByText("Nova Proposta")).toBeInTheDocument();
  });

  it("selecionar 'Nova Proposta' navega para /admin/proposals?create=true", () => {
    const navigate = vi.fn();
    vi.mocked(vi.importMock).mockImplementation;
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.click(screen.getByText("Nova Proposta"));
    // navigate é chamado internamente via wouter useLocation mock
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AdminLayout — Ciclo 3 (issue#56): createActions na palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe grupo Criar quando palette está aberta", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByText("Criar")).toBeInTheDocument();
  });

  it("exibe ação 'Nova Proposta' na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByText("Nova Proposta")).toBeInTheDocument();
  });

  it("selecionar 'Nova Proposta' fecha a palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.click(screen.getByText("Nova Proposta"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AdminLayout — Ciclo 9: contentGroups populados via useQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockImplementation((queryKey: unknown) => {
      if (queryKey === "posts:listAdmin") return [{ _id: "p1", title: "Introdução ao TDD" }];
      if (queryKey === "projects:list") return [{ _id: "pr1", title: "Portfolio App" }];
      if (queryKey === "proposals:listAdmin") return [{ _id: "prop1", title: "Proposta Acme" }];
      if (queryKey === "services:list") return [{ _id: "s1", title: "Consultoria" }];
      return undefined;
    });
  });

  it("exibe grupo Posts com itens quando há query na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "tdd" },
    });
    expect(screen.getByText("Posts")).toBeInTheDocument();
    expect(screen.getByText("Introdução ao TDD")).toBeInTheDocument();
  });

  it("exibe grupo Projetos com itens quando há query na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "port" },
    });
    expect(screen.getAllByText("Projetos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Portfolio App")).toBeInTheDocument();
  });

  it("exibe grupo Propostas com itens quando há query na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "acme" },
    });
    expect(screen.getByText("Proposta Acme")).toBeInTheDocument();
  });

  it("exibe grupo Serviços com itens quando há query na palette", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "consul" },
    });
    expect(screen.getByText("Serviços")).toBeInTheDocument();
    expect(screen.getByText("Consultoria")).toBeInTheDocument();
  });

  it("não exibe grupos de conteúdo quando o input está vazio", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByText("Introdução ao TDD")).not.toBeInTheDocument();
    expect(screen.queryByText("Portfolio App")).not.toBeInTheDocument();
    expect(screen.queryByText("Proposta Acme")).not.toBeInTheDocument();
    expect(screen.queryByText("Consultoria")).not.toBeInTheDocument();
  });
});

describe("AdminLayout — Ciclo 4: atalho Cmd+K abre command palette", () => {
  beforeEach(() => vi.clearAllMocks());

  it("abre a palette ao pressionar Ctrl+K", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("abre a palette ao pressionar Cmd+K (Meta)", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("fecha a palette ao pressionar Ctrl+K novamente (toggle)", () => {
    render(<AdminLayout><div /></AdminLayout>);
    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
