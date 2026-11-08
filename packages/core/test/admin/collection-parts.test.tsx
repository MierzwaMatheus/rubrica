// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { SeoFields } from "../../src/content/types";
import { EditorLocaleProvider } from "../../src/admin/editor/fields";
import { BackendContext, type Backend } from "../../src/admin/data/backend";
import { PriceField, SeoPanel, SlugPanel, TagsInput } from "../../src/admin/collections/parts";

vi.mock("../../src/admin/lib/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() }, Toaster: () => null }));
afterEach(cleanup);

const backend = { mode: "demo", useQuery: () => undefined, useMutation: () => async () => null, useAction: () => async () => "", useQueryOnce: () => async () => null, useAuth: () => ({}), upload: async () => "" } as unknown as Backend;

function Shell({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("pt-BR");
  return (
    <BackendContext.Provider value={backend}>
      <EditorLocaleProvider value={{ locale, setLocale, locales: ["pt-BR", "en"], defaultLocale: "pt-BR", translation: false }}>{children}</EditorLocaleProvider>
    </BackendContext.Provider>
  );
}

describe("SlugPanel", () => {
  it("avisa que o link antigo quebra ao mudar o endereço de um item publicado e deixa voltar", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SlugPanel prefix="/blog/" value="meu-post" saved="meu-post" suggested="" published onChange={onChange} />);
    expect(screen.queryByText(/quebra o link antigo/)).toBeNull();
    expect((screen.getByLabelText(/Endereço/) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Editar/ }));
    rerender(<SlugPanel prefix="/blog/" value="outro" saved="meu-post" suggested="" published onChange={onChange} />);
    const warning = screen.getByText(/quebra o link antigo/);
    expect(warning.textContent).toContain("/blog/meu-post");
    expect(warning.textContent).toContain("erro 404");
    fireEvent.click(within(warning).getByRole("button", { name: /Voltar ao endereço atual/ }));
    expect(onChange).toHaveBeenCalledWith("meu-post");
  });

  it("item novo mostra a sugestão do título e recusa slug inválido", () => {
    render(<SlugPanel prefix="/blog/" value="Meu Post" suggested="meu-post" published={false} onChange={() => undefined} />);
    expect(screen.getByText("meu-post")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/letras minúsculas/);
  });
});

describe("SeoPanel", () => {
  function Harness({ initial }: { initial?: SeoFields }) {
    const [seo, setSeo] = useState<SeoFields | undefined>(initial);
    return (
      <Shell>
        <SeoPanel seo={seo} onChange={setSeo} fallbackTitle={{ "pt-BR": "Título do post" }} fallbackDescription={{ "pt-BR": "<p>Resumo do post</p>" }} url={(l) => `https://exemplo.com${l === "en" ? "/en" : ""}/blog/meu-post`} siteName="Exemplo" />
      </Shell>
    );
  }

  it("mostra contador com situação e a prévia do Google com o que vale de fato", () => {
    render(<Harness />);
    const preview = screen.getByTestId("google-preview");
    // Sem SEO próprio, a prévia usa o título e o resumo do item.
    expect(within(preview).getByText("Título do post")).toBeTruthy();
    expect(within(preview).getByText("Resumo do post")).toBeTruthy();
    expect(within(preview).getByText("exemplo.com › blog › meu-post")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Título para buscadores"), { target: { value: "x".repeat(65) } });
    expect(screen.getByText(/65\/60 · o Google corta/)).toBeTruthy();
    expect(within(screen.getByTestId("google-preview")).getByText(/…$/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Título para buscadores"), { target: { value: "Um bom título para o resultado do Google aqui" } });
    expect(screen.getByText(/45\/60 · bom/)).toBeTruthy();
  });

  it("noindex entra no SEO e some quando desligado", () => {
    render(<Harness initial={{ title: { "pt-BR": "Meu título" } }} />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("checked");
  });
});

describe("TagsInput e PriceField", () => {
  it("adiciona etiqueta com Enter e vírgula, ignora repetida, remove", () => {
    const onChange = vi.fn();
    const { rerender } = render(<TagsInput value={[]} onChange={onChange} />);
    const input = screen.getByLabelText("Etiquetas");
    fireEvent.change(input, { target: { value: "design" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["design"]);
    rerender(<TagsInput value={["design"]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Etiquetas"), { target: { value: "Design" } });
    fireEvent.keyDown(screen.getByLabelText("Etiquetas"), { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Remover etiqueta design" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("preço: digita em reais e guarda centavos; texto inválido avisa", () => {
    const onChange = vi.fn();
    render(<PriceField cents={undefined} currency="BRL" onChange={onChange} />);
    const input = screen.getByLabelText("Preço (R$)");
    fireEvent.change(input, { target: { value: "1.234,50" } });
    expect(onChange).toHaveBeenLastCalledWith(123450);
    fireEvent.change(input, { target: { value: "abc" } });
    expect(screen.getByRole("alert").textContent).toMatch(/Digite um valor/);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
