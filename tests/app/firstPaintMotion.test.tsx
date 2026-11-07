// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { m } from "framer-motion";
import { FirstPaintMotion } from "@/lib/firstPaintMotion";

const Hero = () => <m.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>Título</m.h1>;

describe("FirstPaintMotion — página pré-renderizada já visível", () => {
  it("no build, o componente animado sai no estado final (sem opacity 0)", () => {
    const html = renderToString(<FirstPaintMotion><Hero /></FirstPaintMotion>);
    expect(html).not.toMatch(/opacity:0/);
    expect(html).toContain("Título");
  });

  it("sem o contexto, sairia invisível até o JavaScript animar", () => {
    expect(renderToString(<Hero />)).toMatch(/opacity:0/);
  });
});
