import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TemplateContentPreview } from "@/components/admin/TemplateContentPreview";
import { TemplateSyntaxGuide } from "@/components/admin/TemplateSyntaxGuide";

describe("TemplateContentPreview", () => {
  it("renderiza bold (**texto**) como <strong>", () => {
    const { container } = render(
      <TemplateContentPreview content="**negrito**" />,
    );
    expect(container.querySelector("strong")).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("negrito");
  });

  it("renderiza ### Título como elemento em negrito", () => {
    const { container } = render(
      <TemplateContentPreview content="### Meu Título" />,
    );
    expect(container.querySelector("strong")?.textContent).toContain("Meu Título");
  });

  it("renderiza - item como lista <ul><li>", () => {
    const { container } = render(
      <TemplateContentPreview content={"- Alpha\n- Beta"} />,
    );
    expect(container.querySelector("ul")).toBeTruthy();
    const items = container.querySelectorAll("li");
    const texts = Array.from(items).map((li) => li.textContent);
    expect(texts).toContain("Alpha");
    expect(texts).toContain("Beta");
  });

  it("renderiza 1. item como lista <ol><li>", () => {
    const { container } = render(
      <TemplateContentPreview content={"1. Primeiro\n2. Segundo"} />,
    );
    expect(container.querySelector("ol")).toBeTruthy();
    expect(container.querySelector("ol li")?.textContent).toContain("Primeiro");
  });

  it("mantém {{variavel}} visível sem interpolar", () => {
    const { container } = render(
      <TemplateContentPreview content={"Assinado por {{client_name}}."} />,
    );
    expect(container.textContent).toContain("{{client_name}}");
  });

  it("exibe estado vazio para conteúdo vazio", () => {
    const { container } = render(<TemplateContentPreview content="" />);
    expect(container.textContent?.trim()).toBe("");
  });
});

describe("TemplateSyntaxGuide", () => {
  it("documenta **bold** como sintaxe suportada", () => {
    const { container } = render(<TemplateSyntaxGuide />);
    expect(container.textContent).toContain("**bold**");
  });

  it("documenta ### Título como sintaxe suportada", () => {
    const { container } = render(<TemplateSyntaxGuide />);
    expect(container.textContent).toContain("###");
  });

  it("documenta - item (bullet) como sintaxe suportada", () => {
    const { container } = render(<TemplateSyntaxGuide />);
    expect(container.textContent).toContain("- item");
  });

  it("documenta 1. item (numerado) como sintaxe suportada", () => {
    const { container } = render(<TemplateSyntaxGuide />);
    expect(container.textContent).toContain("1. item");
  });

  it("deixa claro que não é Markdown padrão", () => {
    const { container } = render(<TemplateSyntaxGuide />);
    expect(container.textContent?.toLowerCase()).toContain("markdown");
  });
});
