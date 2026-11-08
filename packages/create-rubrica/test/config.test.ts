import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyConfigChange, swapThemeInFiles, updateSiteUrl } from "../src/commands/config";
import { astroConfig, packageJson } from "../src/project/files";
import { sampleState, tmp } from "./helpers";

describe("config (puro)", () => {
  it("troca o tema e manda só o que mudou para o Convex", () => {
    const r = applyConfigChange(sampleState(), { tema: "cyberpunk", esquema: "fosforo" });
    expect(r.state.tema).toBe("cyberpunk");
    expect(r.themeSwap).toEqual(["@rubrica/theme-padrao", "@rubrica/theme-cyberpunk"]);
    expect(r.patch).toEqual({ theme: "cyberpunk", appearance: { colorMode: "dark", colorToggle: true, scheme: "fosforo" } });
  });

  it("tema ainda não portado: fica no padrão e guarda a escolha", () => {
    const r = applyConfigChange(sampleState({ tema: "cyberpunk" }), { tema: "zine" });
    expect(r.state.tema).toBe("padrao");
    expect(r.state.temaDesejado).toBe("zine");
    expect(r.warnings.join(" ")).toMatch(/ainda não foi portado/);
  });

  it("idiomas: principal primeiro, aviso de tradução e de URLs", () => {
    const r = applyConfigChange(sampleState(), { idiomas: ["en", "pt-BR", "es"], idiomaPrincipal: "en" });
    expect(r.state.idiomas).toEqual({ lista: ["en", "pt-BR", "es"], principal: "en" });
    expect(r.patch.locales).toEqual({ locales: ["en", "pt-BR", "es"], default: "en" });
    expect(r.warnings.join(" ")).toMatch(/es/);
    expect(r.warnings.join(" ")).toMatch(/URLs mudam/);
    expect(() => applyConfigChange(sampleState(), { idiomas: ["pt-BR", "pt-PT", "en"] })).not.toThrow();
    expect(() => applyConfigChange(sampleState(), { idiomas: ["en", "pt-BR", "pt-PT"] })).toThrow(/mesmo prefixo/);
  });

  it("plugins com +/- e aviso de dependência", () => {
    const r = applyConfigChange(sampleState(), { plugins: ["-testimonials", "+testimonials-intake"] });
    expect(r.state.plugins.testimonials).toBe(false);
    expect(r.state.plugins["testimonials-intake"]).toBe(true);
    expect(r.warnings.join(" ")).toMatch(/testimonials-intake precisa de testimonials/);
    expect(() => applyConfigChange(sampleState(), { plugins: ["+pricing"] })).toThrow(/desconhecidos para sites do tipo pessoal: pricing/);
  });

  it("identidade validada e normalizada", () => {
    const r = applyConfigChange(sampleState(), { url: "novo.dev/", nome: " Ana S. " });
    expect(r.state.identidade.url).toBe("https://novo.dev");
    expect(r.patch).toMatchObject({ url: "https://novo.dev", name: { "pt-BR": "Ana S." } });
    expect(() => applyConfigChange(sampleState(), { email: "x" })).toThrow(/e-mail válido/);
  });

  it("trocar de tipo refaz os plugins do tipo novo", () => {
    const r = applyConfigChange(sampleState(), { tipo: "empresa" });
    expect(r.state.tipo).toBe("empresa");
    expect(r.state.plugins.resume).toBeUndefined();
    expect(r.state.plugins.pricing).toBe(false);
    expect(r.patch.kind).toBe("empresa");
  });
});

describe("config (arquivos)", () => {
  it("troca a dependência e o trecho do tema; troca a URL do site", () => {
    const dir = tmp();
    const state = sampleState();
    writeFileSync(join(dir, "package.json"), packageJson("x", state, { core: "^2.0.0", theme: "^2.0.0" }));
    writeFileSync(join(dir, "astro.config.ts"), astroConfig(state));
    const next = { ...state, tema: "cyberpunk" };
    swapThemeInFiles(dir, next, ["@rubrica/theme-padrao", "@rubrica/theme-cyberpunk"]);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    expect(pkg.dependencies["@rubrica/theme-padrao"]).toBeUndefined();
    expect(pkg.dependencies["@rubrica/theme-cyberpunk"]).toBe("^2.0.0");
    expect(readFileSync(join(dir, "astro.config.ts"), "utf-8")).toBe(astroConfig(next));
    updateSiteUrl(dir, "https://novo.dev");
    expect(readFileSync(join(dir, "astro.config.ts"), "utf-8")).toContain('site: "https://novo.dev",');
  });

  it("pacotes locais apontam para a pasta do tema novo", () => {
    const dir = tmp();
    const state = sampleState();
    writeFileSync(join(dir, "package.json"), packageJson("x", state, { core: "link:/m/packages/core", theme: "link:/m/packages/themes/padrao" }));
    writeFileSync(join(dir, "astro.config.ts"), astroConfig(state));
    swapThemeInFiles(dir, { ...state, tema: "cyberpunk" }, ["@rubrica/theme-padrao", "@rubrica/theme-cyberpunk"]);
    expect(JSON.parse(readFileSync(join(dir, "package.json"), "utf-8")).dependencies["@rubrica/theme-cyberpunk"]).toBe("link:/m/packages/themes/cyberpunk");
  });
});
