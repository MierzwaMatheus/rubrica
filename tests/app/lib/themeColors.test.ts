import { describe, it, expect } from "vitest";
import { adminColors, adminColorsCss, normalizeHex, readableOn, schemeColors } from "@/lib/themeColors";

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

describe("themeColors — cores do admin por modo", () => {
  it("sem a marca de cores por modo, as chaves theme_* valem nos dois modos (dados antigos)", () => {
    const c = adminColors(new Map([["theme_primary", "#ff0000"]]), isHex);
    expect(c.light.primary).toBe("#ff0000");
    expect(c.dark.primary).toBe("#ff0000");
  });

  it("com a marca, theme_* é o claro e theme_dark_* é o escuro", () => {
    const c = adminColors(
      new Map<string, unknown>([
        ["theme_colors_per_mode", true],
        ["theme_primary", "#ff0000"],
        ["theme_dark_primary", "#00ff00"],
      ]),
      isHex
    );
    expect(c.light.primary).toBe("#ff0000");
    expect(c.dark.primary).toBe("#00ff00");
  });

  it("cor vazia ou inválida fica de fora (vale a do esquema)", () => {
    const c = adminColors(new Map<string, unknown>([["theme_colors_per_mode", true], ["theme_background", ""], ["theme_accent", "red;x"]]), isHex);
    expect(c.light).toEqual({});
  });

  it("a folha não tem bloco para modo sem cores", () => {
    const css = adminColorsCss(new Map<string, unknown>([["theme_colors_per_mode", true], ["theme_dark_text", "#ffffff"], ["theme_dark_foreground", "#ffffff"]]), isHex);
    expect(css).not.toContain(":not(.dark)");
    expect(css).toContain("html:root.dark");
  });

  it("readableOn escolhe branco no escuro e quase preto no claro", () => {
    expect(readableOn("#000000")).toBe("#ffffff");
    expect(readableOn("#ffffff")).toBe("#111111");
    expect(readableOn("red")).toBeNull();
  });

  it("normalizeHex expande o hex curto do build", () => {
    expect(normalizeHex("#FFF")).toBe("#ffffff");
    expect(normalizeHex(" #A855F7 ")).toBe("#a855f7");
    expect(normalizeHex("rgb(0,0,0)")).toBeNull();
  });

  it("schemeColors lê o claro de :root e o escuro de .dark", () => {
    const style = document.createElement("style");
    style.textContent = ":root{--bg:#fff;--primary:#7e22ce}.dark{--bg:#141414;--primary:#a855f7}";
    document.head.appendChild(style);
    const s = schemeColors();
    style.remove();
    expect(s.light.bg).toBe("#ffffff");
    expect(s.light.primary).toBe("#7e22ce");
    expect(s.dark.bg).toBe("#141414");
  });
});
