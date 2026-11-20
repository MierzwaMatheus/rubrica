// @vitest-environment happy-dom
/** Ilhas de mídia depois de hidratar: capítulos do vídeo e o comparador do antes e depois. */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VideoIsland from "../src/islands/video";
import ComparadorIsland, { comparerRatio } from "../src/islands/comparador";
import { DEFAULT_UI_TEXTS } from "../src/i18n/ui-texts";

afterEach(cleanup);

const yt = "https://www.youtube.com/watch?v=M7lc1UVf-VE";
const texts: Record<string, string> = Object.fromEntries(
  Object.entries(DEFAULT_UI_TEXTS)
    .filter(([k]) => k.startsWith("video.") || k === "common.external")
    .map(([k, v]) => [k, String((v as Record<string, string>).pt)]),
);
const chapters = [
  { start: "0:00", label: "Abertura" },
  { start: "2:15", label: "Resultados" },
];

describe("ilha do vídeo: capítulos", () => {
  it("o capítulo remonta só o iframe, mantém o foco no botão e marca o último escolhido", () => {
    const { container } = render(<VideoIsland fields={{ url: yt, title: "Palestra", chapters }} texts={texts} />);
    const nav = screen.getByRole("navigation", { name: "Capítulos: Palestra" });
    const figure = container.querySelector("figure")!;
    const button = screen.getByRole("button", { name: "Ir para 2:15: Resultados" });
    button.focus();
    fireEvent.click(button);

    const first = container.querySelector("iframe")!;
    expect(first.getAttribute("src")).toContain("start=135");
    // A figura e a lista são as mesmas: nada além do iframe remontou.
    expect(container.querySelector("figure")).toBe(figure);
    expect(screen.getByRole("navigation", { name: "Capítulos: Palestra" })).toBe(nav);
    const chosen = screen.getByRole("button", { name: "Ir para 2:15: Resultados (último capítulo escolhido)" });
    expect(chosen).toBe(button);
    expect(chosen.getAttribute("aria-current")).toBe("true");
    expect(document.activeElement).toBe(button);

    // O mesmo capítulo de novo: o player recarrega no tempo (iframe novo).
    fireEvent.click(chosen);
    const second = container.querySelector("iframe")!;
    expect(second).not.toBe(first);
    expect(second.getAttribute("src")).toContain("start=135");
    expect(document.activeElement).toBe(button);
  });

  it("o play da miniatura leva o foco para o player", () => {
    const { container } = render(<VideoIsland fields={{ url: yt, title: "Palestra", chapters }} texts={texts} />);
    fireEvent.click(screen.getByRole("button", { name: /Reproduzir o vídeo/ }));
    expect(document.activeElement).toBe(container.querySelector("iframe"));
    expect(container.querySelector("[aria-current]")).toBeNull();
  });

  it("dois vídeos com capítulos na mesma página: listas com nomes diferentes", () => {
    render(
      <>
        <VideoIsland fields={{ url: yt, title: "Palestra", chapters }} texts={texts} />
        <VideoIsland fields={{ url: yt, caption: "Bastidores", chapters }} texts={texts} />
      </>,
    );
    expect(screen.getAllByRole("navigation").map((n) => n.getAttribute("aria-label"))).toEqual(["Capítulos: Palestra", "Capítulos: Bastidores"]);
  });
});

describe("ilha do comparador", () => {
  const before = { src: "/antes.png", alt: "Logo antigo", width: 1200, height: 800 };
  const after = { src: "/depois.png", alt: "Logo novo", width: 1200, height: 800 };

  it("altura reservada desde o primeiro quadro: medidas do antes, do depois ou 16:10", () => {
    expect(comparerRatio(before, after)).toBe("1200 / 800");
    expect(comparerRatio({}, after)).toBe("1200 / 800");
    expect(comparerRatio({}, {})).toBe("16 / 10");
    const { container } = render(<ComparadorIsland fields={{ before: { src: "/a.png", alt: "" }, after: { src: "/b.png", alt: "" } }} texts={{}} />);
    const comparer = container.querySelector<HTMLElement>(".rb-comparer")!;
    expect(comparer.style.getPropertyValue("--ratio")).toBe("16 / 10");
  });

  it("as imagens saem como as do par (mesmo src, sizes e carregamento)", () => {
    const { container } = render(<ComparadorIsland fields={{ before, after }} texts={{}} />);
    const imgs = [...container.querySelectorAll(".rb-comparer img")];
    expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["/antes.png", "/depois.png"]);
    for (const img of imgs) {
      expect(img.getAttribute("sizes")).toBe("(min-width: 48rem) 50vw, 100vw");
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("width")).toBe("1200");
    }
  });
});
