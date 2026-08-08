import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateEditor } from "@/components/admin/TemplateEditor";

const TEMPLATE_VARIABLES = [
  { key: "client_name", label: "Nome do cliente" },
  { key: "objective", label: "Objetivo" },
];

describe("TemplateEditor", () => {
  it("exibe a seção de preview ao lado do editor em desktop", () => {
    const { container } = render(
      <TemplateEditor
        content="Olá **mundo**"
        onChange={vi.fn()}
        variables={TEMPLATE_VARIABLES}
      />,
    );
    expect(container.querySelector("[data-testid='editor-pane']")).toBeTruthy();
    expect(container.querySelector("[data-testid='preview-pane']")).toBeTruthy();
  });

  it("exibe abas Editor e Preview para navegação mobile", () => {
    render(
      <TemplateEditor
        content=""
        onChange={vi.fn()}
        variables={TEMPLATE_VARIABLES}
      />,
    );
    expect(screen.getByRole("tab", { name: /editor/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /preview/i })).toBeTruthy();
  });

  it("o guia de sintaxe está visível acima do editor", () => {
    const { container } = render(
      <TemplateEditor
        content=""
        onChange={vi.fn()}
        variables={TEMPLATE_VARIABLES}
      />,
    );
    expect(container.textContent?.toLowerCase()).toContain("markdown");
  });

  it("a toolbar de variáveis está presente", () => {
    render(
      <TemplateEditor
        content=""
        onChange={vi.fn()}
        variables={TEMPLATE_VARIABLES}
      />,
    );
    expect(screen.getAllByText("{{client_name}}").length).toBeGreaterThan(0);
    expect(screen.getAllByText("{{objective}}").length).toBeGreaterThan(0);
  });

  it("preview atualiza ao alterar conteúdo", () => {
    const { rerender, container } = render(
      <TemplateEditor content="" onChange={vi.fn()} variables={[]} />,
    );
    rerender(
      <TemplateEditor content={"**negrito**"} onChange={vi.fn()} variables={[]} />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("negrito");
  });

  it("chama onChange ao digitar na textarea", () => {
    const onChange = vi.fn();
    render(
      <TemplateEditor content="" onChange={onChange} variables={[]} />,
    );
    const textarea = screen.getAllByRole("textbox")[0];
    fireEvent.change(textarea, { target: { value: "novo conteúdo" } });
    expect(onChange).toHaveBeenCalledWith("novo conteúdo");
  });
});
