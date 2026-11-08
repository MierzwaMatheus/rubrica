import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { LAYOUTS, getLayout, TEMPLATE_PAGES, COLOR_MODES, TEXTURES } from "../layouts.js";
import { SCHEMES } from "../themes/schemes.js";
import { SANS_FONTS, MONO_FONTS } from "../themes/fonts.js";

const TEMPLATES_DIR = resolve(import.meta.dirname, "../../../templates/layouts");
const PAGES = ["Home.tsx", "Resume.tsx", "Portfolio.tsx", "About.tsx", "Blog.tsx"];

describe("registro de layouts (LAYOUTS)", () => {
  it("tem os 5 originais marcados como legacy e os 8 novos", () => {
    expect(LAYOUTS.filter((l) => l.legacy).map((l) => l.id)).toEqual([
      "cyberpunk", "brutalist", "swiss", "bento", "magazine",
    ]);
    expect(LAYOUTS.filter((l) => !l.legacy).map((l) => l.id)).toEqual([
      "desktop", "index", "monograph", "zine", "blueprint", "garden", "chat", "poster",
    ]);
  });

  it("ids são únicos e getLayout encontra cada um", () => {
    const ids = LAYOUTS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(getLayout(id)?.id).toBe(id);
    expect(getLayout("nao-existe")).toBeUndefined();
  });

  it("todo layout tem label e hint", () => {
    for (const l of LAYOUTS) {
      expect(l.label, l.id).toBeTruthy();
      expect(l.hint, l.id).toBeTruthy();
    }
  });

  it("todo layout novo copia Layout.tsx e traz as 5 páginas", () => {
    expect(TEMPLATE_PAGES).toEqual(PAGES);
    for (const l of LAYOUTS.filter((x) => !x.legacy)) {
      expect(l.copy, l.id).toContain("Layout.tsx");
      expect(l.pages, l.id).toEqual(PAGES);
    }
  });

  it("nenhum layout apaga um arquivo que ele mesmo copia", () => {
    for (const l of LAYOUTS) {
      for (const f of l.remove) expect(l.copy, `${l.id} copia e apaga ${f}`).not.toContain(f);
    }
  });

  it("todo esquema recomendado existe em SCHEMES", () => {
    const ids = new Set(SCHEMES.map((s) => s.id));
    for (const l of LAYOUTS) expect(ids.has(l.recommended.scheme), `${l.id} → ${l.recommended.scheme}`).toBe(true);
  });

  it("modo e textura recomendados são opções válidas", () => {
    const modes = COLOR_MODES.map((m) => m.value);
    const textures = TEXTURES.map((t) => t.value);
    for (const l of LAYOUTS) {
      expect(modes, l.id).toContain(l.recommended.mode);
      expect(textures, l.id).toContain(l.recommended.texture);
    }
  });

  it("toda fonte recomendada existe em SANS_FONTS / MONO_FONTS", () => {
    const sans = new Set(SANS_FONTS.map((f) => f.family));
    const mono = new Set(MONO_FONTS.map((f) => f.family));
    for (const l of LAYOUTS) {
      expect(l.fonts.sans.length, l.id).toBeGreaterThan(0);
      for (const f of l.fonts.sans) expect(sans.has(f), `${l.id} → ${f}`).toBe(true);
      if (l.fonts.mono !== "") expect(mono.has(l.fonts.mono), `${l.id} → ${l.fonts.mono}`).toBe(true);
    }
  });

  // Os arquivos dos layouts novos podem ainda não existir: só confere os diretórios presentes.
  const present = LAYOUTS.filter((l) => existsSync(resolve(TEMPLATES_DIR, l.id)));

  it("há pelo menos os 5 layouts originais em templates/layouts/", () => {
    for (const id of ["cyberpunk", "brutalist", "swiss", "bento", "magazine"]) {
      expect(present.map((l) => l.id)).toContain(id);
    }
  });

  for (const l of present) {
    it(`${l.id}: os arquivos de copy e pages existem em templates/layouts/${l.id}/`, () => {
      for (const f of l.copy) expect(existsSync(resolve(TEMPLATES_DIR, l.id, f)), f).toBe(true);
      for (const p of l.pages ?? []) expect(existsSync(resolve(TEMPLATES_DIR, l.id, "pages", p)), `pages/${p}`).toBe(true);
    });
  }
});
