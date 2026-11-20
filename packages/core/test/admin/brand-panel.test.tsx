// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { CaseBrand } from "../../src/content/types";
import { BackendContext, type Backend } from "../../src/admin/data/backend";
import { EditorLocaleProvider } from "../../src/admin/editor/fields";
import { BrandPanel } from "../../src/admin/collections/BrandPanel";

afterEach(cleanup);

function setup(initial?: CaseBrand) {
  let latest: CaseBrand | undefined = initial;
  function Harness() {
    const [brand, setBrand] = useState<CaseBrand | undefined>(initial);
    latest = brand;
    return (
      <BackendContext.Provider value={{} as Backend}>
        <EditorLocaleProvider value={{ locale: "pt-BR", setLocale: () => {}, locales: ["pt-BR"], defaultLocale: "pt-BR", translation: false }}>
          <BrandPanel brand={brand} onChange={setBrand} title="Case de teste" />
        </EditorLocaleProvider>
      </BackendContext.Provider>
    );
  }
  render(<Harness />);
  return { latest: () => latest };
}

describe("painel da cara do cliente", () => {
  it("ligar cria a marca com cores que passam; desligar guarda as cores sem aplicar", () => {
    const { latest } = setup();
    expect(screen.queryByText("Modo claro")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: /Usar a cara do cliente/ }));
    expect(latest()).toMatchObject({ enabled: true, light: { background: "#ffffff" } });
    expect(screen.getByText("Modo claro")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: /Usar a cara do cliente/ }));
    expect(latest()?.enabled).toBe(false);
    expect(latest()?.light).toBeTruthy();
  });

  it("mostra a amostra e os selos; contraste ruim mostra a mensagem do núcleo", () => {
    const { latest } = setup({ enabled: true, light: { background: "#ffffff", foreground: "#111111", accent: "#7a1f2b" } });
    const sample = screen.getByTestId("brand-sample");
    expect(sample.getAttribute("style")).toMatch(/rgb\(255, 255, 255\)|#ffffff/);
    expect(within(screen.getByLabelText("Contraste, modo claro")).getAllByText(/contraste suficiente/)).toHaveLength(2);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(screen.getByLabelText("Texto"), { target: { value: "#cccccc" } });
    expect(latest()?.light.foreground).toBe("#cccccc");
    expect(screen.getByRole("alert").textContent).toMatch(/texto sobre o fundo com contraste/);
    expect(within(screen.getByLabelText("Contraste, modo claro")).getByText(/contraste insuficiente/)).toBeTruthy();
  });

  it("modo escuro opcional e fonte dos títulos", () => {
    const { latest } = setup({ enabled: true, light: { background: "#ffffff", foreground: "#111111", accent: "#7a1f2b" } });
    fireEvent.click(screen.getByRole("switch", { name: /modo escuro/ }));
    expect(latest()?.dark).toBeTruthy();
    expect(screen.getByText("Modo escuro")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Fonte dos títulos"), { target: { value: "Playfair Display" } });
    expect(latest()?.fontDisplay).toBe("Playfair Display");
    fireEvent.change(screen.getByLabelText("Fonte dos títulos"), { target: { value: "Fonte; má" } });
    expect(screen.getByRole("alert").textContent).toMatch(/fonte/);
    fireEvent.click(screen.getByRole("switch", { name: /modo escuro/ }));
    expect(latest()?.dark).toBeUndefined();
  });
});
