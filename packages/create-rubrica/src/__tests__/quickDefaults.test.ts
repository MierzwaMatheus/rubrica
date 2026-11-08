import { describe, it, expect } from "vitest";
import { LAYOUTS, recommendedAppearance } from "../layouts.js";
import { packageManagerFromUserAgent } from "../utils/packageManager.js";

describe("recommendedAppearance", () => {
  it("cyberpunk: esquema, modo, textura e fontes recomendados, com o botão de alternar ligado", () => {
    expect(recommendedAppearance("cyberpunk")).toEqual({
      theme: "neon",
      colorMode: "dark",
      colorModeToggle: true,
      texture: "none",
      fontSans: "Chakra Petch",
      fontMono: "JetBrains Mono",
    });
  });

  it("layout sem fonte mono (swiss) devolve fontMono vazio", () => {
    expect(recommendedAppearance("swiss").fontMono).toBe("");
  });

  it.each(LAYOUTS.map((l) => [l.id, l] as const))("%s segue o próprio registro", (id, layout) => {
    const a = recommendedAppearance(id);
    expect(a.theme).toBe(layout.recommended.scheme);
    expect(a.colorMode).toBe(layout.recommended.mode);
    expect(a.texture).toBe(layout.recommended.texture);
    expect(a.fontSans).toBe(layout.fonts.sans[0]);
    expect(a.fontMono).toBe(layout.fonts.mono);
  });

  it("layout desconhecido lança erro com o id", () => {
    expect(() => recommendedAppearance("nao-existe")).toThrow(/nao-existe/);
  });
});

describe("packageManagerFromUserAgent", () => {
  it.each([
    ["pnpm/9.12.0 npm/? node/v22.0.0 linux x64", "pnpm"],
    ["npm/10.8.0 node/v22.0.0 darwin arm64 workspaces/false", "npm"],
    ["yarn/1.22.0 npm/? node/v20.0.0 win32 x64", "npm"],
    ["", "npm"],
    [undefined, "npm"],
  ])("%j → %s", (ua, expected) => {
    expect(packageManagerFromUserAgent(ua)).toBe(expected);
  });
});
