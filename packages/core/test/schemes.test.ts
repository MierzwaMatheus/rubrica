import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCHEMES, SCHEME_TOKENS, contrastRatio, getScheme, schemeCss, type SchemeMode } from "../src/theme/schemes";

const base = readFileSync(fileURLToPath(new URL("../src/styles/base.css", import.meta.url)), "utf-8");
const tokens = (block: string) => Object.fromEntries([...block.matchAll(/(--rb-[a-z-0-9]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]));
const baseDark = tokens(base.slice(base.indexOf(":root {"), base.indexOf('\n[data-color-mode="light"] {')));
const baseLight = tokens(base.slice(base.indexOf('\n[data-color-mode="light"] {'), base.indexOf("@media (prefers-color-scheme")));

describe("esquemas de cor", () => {
  it("traz os 15 esquemas da v1, com neon", () => {
    expect(SCHEMES).toHaveLength(15);
    expect(getScheme("neon")?.dark.primary).toBe("#A855F7");
    expect(new Set(SCHEMES.map((s) => s.id)).size).toBe(SCHEMES.length);
  });

  it("todo papel vira um token --rb-* definido no base.css (ou documentado no topo)", () => {
    for (const token of Object.values(SCHEME_TOKENS)) expect(base, token).toContain(token);
  });

  it("gera CSS com escuro por padrão, claro e sistema", () => {
    const css = schemeCss(getScheme("neon")!);
    expect(css).toContain(":root[data-scheme]{--rb-bg:#141414");
    expect(css).toContain('[data-color-mode="light"]{--rb-bg:#F7F7F8');
    expect(css).toContain('@media (prefers-color-scheme:light){:root[data-scheme][data-color-mode="system"]');
  });

  for (const scheme of SCHEMES) {
    for (const [name, mode, fallback] of [["escuro", scheme.dark, baseDark], ["claro", scheme.light, baseLight]] as const) {
      it(`${scheme.id} (${name}): texto com contraste AA (4,5:1)`, () => {
        const m: SchemeMode = mode;
        const danger = m.danger ?? fallback["--rb-danger"]!;
        const success = m.success ?? fallback["--rb-success"]!;
        const pairs: [string, string, string][] = [];
        for (const [bgName, bg] of [["bg", m.bg], ["surface", m.surface], ["subtle", m.subtle]] as const) {
          // accent2 (--rb-accent-3) é só decorativo (fio, preenchimento): fora do teste de texto.
          for (const [fgName, fg] of [["text", m.text], ["textMuted", m.textMuted], ["primary", m.primary], ["accent", m.accent], ["danger", danger], ["success", success]] as const) {
            if (bgName === "subtle" && fgName !== "text" && fgName !== "textMuted") continue; // sobre o "subtle" só se garante o texto
            pairs.push([`${fgName} sobre ${bgName}`, fg, bg]);
          }
        }
        pairs.push(["onPrimary sobre primary", m.onPrimary, m.primary], ["onAccent sobre accent", m.onAccent, m.accent]);
        const failures = pairs.filter(([, fg, bg]) => contrastRatio(fg, bg) < 4.5).map(([label, fg, bg]) => `${label} (${fg} em ${bg}): ${contrastRatio(fg, bg).toFixed(2)}`);
        expect(failures).toEqual([]);
      });
    }
  }
});
