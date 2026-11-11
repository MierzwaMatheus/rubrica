// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PostsBusca from "../src/islands/posts-busca";

const texts = { "blog.search": "Buscar artigos...", "blog.searchEmpty": "Nenhum artigo encontrado." };

function mount() {
  document.body.innerHTML = `
    <section data-block="posts-recentes">
      <div data-rb-carousel>
        <div data-rb-carousel-track></div>
        <button type="button" data-rb-carousel-prev hidden>‹</button>
        <button type="button" data-rb-carousel-next hidden>›</button>
      </div>
      <div id="slot"></div>
      <ul>
        <li data-search="gestao de ia governanca">A</li>
        <li data-search="carreira em design">B</li>
      </ul>
    </section>`;
  return render(<PostsBusca texts={texts} />, { container: document.getElementById("slot")! });
}

afterEach(cleanup);

describe("ilha de busca do blog", () => {
  it("esconde os cartões que não batem, sem diferenciar acento nem maiúscula", () => {
    mount();
    const [a, b] = [...document.querySelectorAll<HTMLElement>("[data-search]")];
    fireEvent.change(screen.getByLabelText("Buscar artigos..."), { target: { value: "GESTÃO" } });
    expect(a!.hidden).toBe(false);
    expect(b!.hidden).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("");
    fireEvent.change(screen.getByLabelText("Buscar artigos..."), { target: { value: "xyz" } });
    expect(a!.hidden && b!.hidden).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Nenhum artigo encontrado.");
    fireEvent.change(screen.getByLabelText("Buscar artigos..."), { target: { value: "" } });
    expect(a!.hidden || b!.hidden).toBe(false);
  });

  it("mostra as setas do carrossel de destaques", () => {
    mount();
    expect(document.querySelector<HTMLButtonElement>("[data-rb-carousel-prev]")!.hidden).toBe(false);
    expect(document.querySelector<HTMLButtonElement>("[data-rb-carousel-next]")!.hidden).toBe(false);
  });
});
