import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => []),
  useAction: vi.fn(() => vi.fn()),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    siteTexts: {
      getAll: "siteTexts:getAll",
      update: "siteTexts:update",
      translateAllMissing: "siteTexts:translateAllMissing",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/pages/admin/Dashboard", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useQuery, useMutation } from "convex/react";
import AdminTextos from "@/pages/admin/Textos";

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

describe("Textos — Ciclo 1: estrutura básica da página", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([] as any);
  });

  it("renderiza o heading 'Textos do Site'", () => {
    render(<AdminTextos />);
    expect(screen.getByText("Textos do Site")).toBeInTheDocument();
  });

  it("renderiza campo de busca", () => {
    render(<AdminTextos />);
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  });
});

describe("Textos — Ciclo 2: agrupamento por namespace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "2", key: "home.title", page: "home", ptBR: "Título", enUS: "Title" },
      { _id: "3", key: "about.intro", page: "about", ptBR: "Sobre", enUS: "About" },
    ] as any);
  });

  it("renderiza seção agrupada para namespace 'home'", () => {
    render(<AdminTextos />);
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("renderiza seção agrupada para namespace 'about'", () => {
    render(<AdminTextos />);
    expect(screen.getAllByText("about").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe a chave de cada item dentro da seção correta", () => {
    render(<AdminTextos />);
    expect(screen.getByText("home.greeting")).toBeInTheDocument();
    expect(screen.getByText("about.intro")).toBeInTheDocument();
  });
});

describe("Textos — Ciclo 3: badge 'sem tradução EN'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "2", key: "home.missing", page: "home", ptBR: "Sem tradução" },
    ] as any);
  });

  it("exibe badge para item sem enUS", () => {
    render(<AdminTextos />);
    expect(screen.getByText(/sem tradução en/i)).toBeInTheDocument();
  });

  it("não exibe badge para item com enUS preenchido", () => {
    render(<AdminTextos />);
    const badges = screen.queryAllByText(/sem tradução en/i);
    expect(badges).toHaveLength(1);
  });
});

describe("Textos — Ciclo 4: busca/filtro em tempo real", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá mundo", enUS: "Hello world" },
      { _id: "2", key: "about.intro", page: "about", ptBR: "Sobre mim", enUS: "About me" },
      { _id: "3", key: "blog.title", page: "blog", ptBR: "Blog", enUS: "Blog" },
    ] as any);
  });

  it("filtrar por chave oculta itens que não correspondem", () => {
    render(<AdminTextos />);
    const input = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: "home" } });
    expect(screen.getByText("home.greeting")).toBeInTheDocument();
    expect(screen.queryByText("about.intro")).not.toBeInTheDocument();
  });

  it("filtrar por valor PT-BR mostra item correspondente", () => {
    render(<AdminTextos />);
    const input = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(input, { target: { value: "sobre" } });
    expect(screen.getByText("about.intro")).toBeInTheDocument();
    expect(screen.queryByText("home.greeting")).not.toBeInTheDocument();
  });
});

describe("Textos — Ciclo 5: salvar via mutation + toast", () => {
  const mockUpdate = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
    ] as any);
    mockUseMutation.mockReturnValue(mockUpdate as any);
  });

  it("renderiza botão 'Salvar' por item", () => {
    render(<AdminTextos />);
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("clicar em Salvar chama a mutation update", async () => {
    render(<AdminTextos />);
    const btn = screen.getByRole("button", { name: /salvar/i });
    fireEvent.click(btn);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ key: "home.greeting" }),
    );
  });
});

describe("Textos — Ciclo 6: label de origem por chave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe label do componente quando chave está no manifesto", () => {
    mockUseQuery.mockReturnValue([
      { _id: "1", key: "home.availability.label", page: "home", ptBR: "Disponível", enUS: "Available" },
    ] as any);
    render(<AdminTextos />);
    expect(screen.getByText("AvailabilityBadge")).toBeInTheDocument();
  });

  it("exibe namespace como label quando chave não está no manifesto", () => {
    mockUseQuery.mockReturnValue([
      { _id: "2", key: "home.unknownKey", page: "home", ptBR: "Texto", enUS: "Text" },
    ] as any);
    render(<AdminTextos />);
    expect(screen.getAllByText("home").length).toBeGreaterThanOrEqual(2);
  });
});
