import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PLUGINS, ALL_PLUGINS, UNLISTED_PLUGINS, PLUGIN_PRESETS, pluginsRecord } from "../plugins.js";

const registrySource = readFileSync(
  fileURLToPath(new URL("../../../convex/pluginRegistry.ts", import.meta.url)),
  "utf-8"
);
const registryIds = [...registrySource.matchAll(/^\s*id: '([^']+)'/gm)].map((m) => m[1]);

describe("registro de plugins do CLI", () => {
  it("ALL_PLUGINS são os ids de PLUGINS, na mesma ordem", () => {
    expect(ALL_PLUGINS).toEqual(PLUGINS.map((p) => p.id));
  });

  it("ids são únicos e todo plugin tem nome e descrição", () => {
    expect(new Set(ALL_PLUGINS).size).toBe(ALL_PLUGINS.length);
    for (const p of PLUGINS) {
      expect(p.label.trim()).not.toBe("");
      expect(p.description.trim()).not.toBe("");
    }
  });

  it("todo plugin do backend (convex/pluginRegistry.ts) está no CLI ou em UNLISTED_PLUGINS", () => {
    // Plugin novo no backend sem entrada aqui = o CLI não oferece. Ver docs/cli/manutencao.md.
    expect([...ALL_PLUGINS, ...UNLISTED_PLUGINS].sort()).toEqual([...registryIds].sort());
  });
});

describe("pacotes de plugins (PLUGIN_PRESETS)", () => {
  it("todo pacote só usa plugins que existem", () => {
    for (const preset of PLUGIN_PRESETS) {
      for (const id of preset.plugins) expect(ALL_PLUGINS).toContain(id);
    }
  });

  it("todo pacote tem nome e explicação", () => {
    for (const preset of PLUGIN_PRESETS) {
      expect(preset.label.trim()).not.toBe("");
      expect(preset.hint.trim()).not.toBe("");
    }
  });

  it("nenhum pacote liga plugin que exige chave de serviço pago (IA, pagamentos)", () => {
    const needsKey = PLUGINS.filter((p) => p.needsKey).map((p) => p.id);
    expect(needsKey).toEqual(expect.arrayContaining(["payments", "ai-resumes", "i18n", "playground"]));
    for (const preset of PLUGIN_PRESETS) {
      for (const id of needsKey) expect(preset.plugins).not.toContain(id);
    }
  });

  it("o primeiro pacote é o recomendado e liga todos os plugins marcados como recomendados", () => {
    const recommended = PLUGINS.filter((p) => p.recommended).map((p) => p.id);
    expect(recommended.length).toBeGreaterThan(0);
    expect([...PLUGIN_PRESETS[0].plugins].sort()).toEqual([...recommended].sort());
  });

  it("pacotes têm ids únicos e conjuntos de plugins diferentes", () => {
    expect(new Set(PLUGIN_PRESETS.map((p) => p.id)).size).toBe(PLUGIN_PRESETS.length);
    const sets = PLUGIN_PRESETS.map((p) => [...p.plugins].sort().join(","));
    expect(new Set(sets).size).toBe(PLUGIN_PRESETS.length);
  });

  it("depoimentos públicos só vêm junto com depoimentos (o intake depende dele)", () => {
    for (const preset of PLUGIN_PRESETS) {
      if (preset.plugins.includes("testimonials-intake")) expect(preset.plugins).toContain("testimonials");
    }
  });
});

describe("pluginsRecord", () => {
  it("marca todos os plugins do CLI, true só para os escolhidos", () => {
    const record = pluginsRecord(["blog", "about"]);
    expect(Object.keys(record)).toEqual(ALL_PLUGINS);
    expect(Object.entries(record).filter(([, on]) => on).map(([id]) => id)).toEqual(["blog", "about"]);
  });

  it("ignora ids desconhecidos", () => {
    expect(Object.keys(pluginsRecord(["nao-existe"]))).not.toContain("nao-existe");
  });
});
