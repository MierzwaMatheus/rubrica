import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

import { CommandPalette } from "@/components/admin/CommandPalette";

const items = [
  { label: "Dashboard", description: "Métricas e atividade recente", path: "/admin/dashboard" },
  { label: "Blog", description: "Posts, tags e busca", path: "/admin/blog" },
  { label: "Projetos", description: "Portfólio", path: "/admin/projects" },
];

describe("CommandPalette — Ciclo 1: renderiza items", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe cada item quando aberto", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Projetos")).toBeInTheDocument();
  });

  it("não exibe items quando fechado", () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={vi.fn()}
        items={items}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});

describe("CommandPalette — Ciclo 7: renderiza grupo de siteTexts", () => {
  const siteTexts = [
    { key: "common.loading", ptBR: "Carregando...", enUS: "Loading..." },
    { key: "common.error", ptBR: "Erro", enUS: undefined },
  ];

  it("exibe heading 'Textos' quando siteTexts é fornecido", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={[]}
        siteTexts={siteTexts}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Textos")).toBeInTheDocument();
  });

  it("exibe a chave de cada siteText como item", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={[]}
        siteTexts={siteTexts}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("common.loading")).toBeInTheDocument();
    expect(screen.getByText("common.error")).toBeInTheDocument();
  });
});

describe("CommandPalette — Ciclo 1b: grupo Criar", () => {
  const createActions = [
    { label: "Nova Proposta", description: "Criar nova proposta comercial", path: "/admin/proposals?create=true" },
    { label: "Novo Projeto", description: "Adicionar projeto ao portfólio", path: "/admin/projects?create=true" },
  ];

  it("exibe grupo 'Criar' com ações quando createActions é passado", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        createActions={createActions}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Criar")).toBeInTheDocument();
    expect(screen.getByText("Nova Proposta")).toBeInTheDocument();
    expect(screen.getByText("Novo Projeto")).toBeInTheDocument();
  });

  it("não exibe grupo 'Criar' quando createActions não é passado", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.queryByText("Criar")).not.toBeInTheDocument();
  });

  it("chama onNavigate com path correto ao selecionar ação de criação", () => {
    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={true}
        onOpenChange={onOpenChange}
        items={items}
        createActions={createActions}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText("Nova Proposta"));
    expect(onNavigate).toHaveBeenCalledWith("/admin/proposals?create=true");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("CommandPalette — Ciclo 2: filtragem de ações de criação", () => {
  const createActions = [
    { label: "Nova Proposta", description: "Criar nova proposta comercial", path: "/admin/proposals?create=true" },
    { label: "Novo Projeto", description: "Adicionar projeto ao portfólio", path: "/admin/projects?create=true" },
  ];

  it("filtrando por 'proposta' mostra Nova Proposta no grupo Criar", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={[]}
        createActions={createActions}
        onNavigate={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "proposta" },
    });
    expect(screen.getByText("Nova Proposta")).toBeInTheDocument();
  });
});

describe("CommandPalette — Ciclo 3: seleção navega e fecha", () => {
  it("chama onNavigate com o path correto ao clicar num item", async () => {
    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={true}
        onOpenChange={onOpenChange}
        items={items}
        onNavigate={onNavigate}
      />
    );
    fireEvent.click(screen.getByText("Blog"));
    expect(onNavigate).toHaveBeenCalledWith("/admin/blog");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// Issue #58: busca cross-content na paleta
const contentGroups = [
  {
    heading: "Conteúdo: Posts",
    items: [
      { label: "Introdução ao TDD", path: "/admin/blog" },
      { label: "Clean Architecture", path: "/admin/blog" },
    ],
  },
  {
    heading: "Conteúdo: Projetos",
    items: [{ label: "Portfolio App", path: "/admin/projects" }],
  },
];

describe("CommandPalette — Ciclo 8: label de origem nos siteTexts", () => {
  const siteTexts = [
    { key: "home.availability.label", ptBR: "Disponível", enUS: "Available" },
    { key: "home.unknownKey", ptBR: "Texto", enUS: "Text" },
  ];

  const manifest = {
    "home.availability.label": [{ file: "components/AvailabilityBadge.tsx", line: 10 }],
  };

  it("exibe label do componente quando chave existe no manifesto", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={[]}
        siteTexts={siteTexts}
        manifest={manifest}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("AvailabilityBadge")).toBeInTheDocument();
  });

  it("exibe namespace como label quando chave não está no manifesto", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={[]}
        siteTexts={siteTexts}
        manifest={manifest}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});

describe("CommandPalette — Ciclo 6: busca cross-content com contentGroups", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe headings dos grupos quando há texto no input", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        contentGroups={contentGroups}
        onNavigate={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "tdd" },
    });
    expect(screen.getByText("Conteúdo: Posts")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo: Projetos")).toBeInTheDocument();
  });

  it("não exibe grupos de conteúdo quando o input está vazio", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        contentGroups={contentGroups}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.queryByText("Conteúdo: Posts")).not.toBeInTheDocument();
    expect(screen.queryByText("Conteúdo: Projetos")).not.toBeInTheDocument();
  });

  it("exibe itens do grupo quando há query", () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={vi.fn()}
        items={items}
        contentGroups={contentGroups}
        onNavigate={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "tdd" },
    });
    expect(screen.getByText("Introdução ao TDD")).toBeInTheDocument();
  });

  it("ao clicar num item de contentGroup chama onNavigate e fecha", () => {
    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandPalette
        open={true}
        onOpenChange={onOpenChange}
        items={items}
        contentGroups={contentGroups}
        onNavigate={onNavigate}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Buscar página..."), {
      target: { value: "port" },
    });
    fireEvent.click(screen.getByText("Portfolio App"));
    expect(onNavigate).toHaveBeenCalledWith("/admin/projects");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
