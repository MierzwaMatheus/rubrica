import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyConfigChange, swapThemeInFiles, updateSiteUrl } from "../src/commands/config";
import { astroConfig, packageJson } from "../src/project/files";
import { getTheme } from "../src/themes";
import { sampleState, tmp } from "./helpers";

describe("config (puro)", () => {
  it("troca o tema e manda só o que mudou para o Convex", () => {
    const r = applyConfigChange(sampleState(), { tema: "cyberpunk", esquema: "fosforo" });
    expect(r.state.tema).toBe("cyberpunk");
    expect(r.themeSwap).toEqual(["@rubrica/theme-padrao", "@rubrica/theme-cyberpunk"]);
    expect(r.patch).toEqual({ theme: "cyberpunk", appearance: { colorMode: "dark", colorToggle: true, scheme: "fosforo" } });
  });

  it("trocar de tema troca o esquema e as fontes que seguiam o anterior; o escolhido fica", () => {
    // padrao → cyberpunk: os dois recomendam neon, e nenhum grava fontes.
    const a = applyConfigChange(sampleState({ aparencia: { esquema: "neon", modo: "dark", alternancia: true } }), { tema: "cyberpunk" });
    expect(a.state.aparencia).toEqual({ esquema: "neon", modo: "dark", alternancia: true });
    // → zine (não portado): o esquema e as fontes do layout da v1.
    const b = applyConfigChange(a.state, { tema: "zine" });
    expect(b.state.aparencia.esquema).toBe(getTheme("zine")!.recommended.scheme);
    expect(b.state.aparencia.fonteSans).toBe(getTheme("zine")!.recommended.fontSans);
    expect(b.patch.appearance).toMatchObject({ scheme: getTheme("zine")!.recommended.scheme, fontSans: getTheme("zine")!.recommended.fontSans });
    // de volta ao cyberpunk: as fontes do zine saem (valem as do tema).
    const c = applyConfigChange(b.state, { tema: "cyberpunk" });
    expect(c.state.aparencia.fonteSans).toBeUndefined();
    expect(c.state.aparencia.esquema).toBe("neon");
    // esquema escolhido pela pessoa não muda com o tema.
    const d = applyConfigChange(sampleState({ aparencia: { esquema: "sumi", modo: "dark", alternancia: true } }), { tema: "zine" });
    expect(d.state.aparencia.esquema).toBe("sumi");
  });

  it("trocar de tema troca o modo de cor que seguia o recomendado do anterior; o escolhido fica", () => {
    // padrao (escuro) → magazine (o pacote declara colorMode: "light").
    const a = applyConfigChange(sampleState({ aparencia: { esquema: "neon", modo: "dark", alternancia: true } }), { tema: "magazine" });
    expect(a.state.aparencia.modo).toBe("light");
    expect(a.patch.appearance).toMatchObject({ colorMode: "light" });
    // de volta: o claro seguia o magazine, volta ao escuro do padrão.
    expect(applyConfigChange(a.state, { tema: "padrao" }).state.aparencia.modo).toBe("dark");
    // "automático" foi escolha da pessoa: não muda.
    expect(applyConfigChange(sampleState({ aparencia: { esquema: "neon", modo: "system", alternancia: true } }), { tema: "magazine" }).state.aparencia.modo).toBe("system");
    // --modo explícito vence o do tema.
    expect(applyConfigChange(sampleState(), { tema: "magazine", modo: "dark" }).state.aparencia.modo).toBe("dark");
  });

  it("--analytics liga o plugin, manda script e id ao Convex e pede a troca da CSP", () => {
    const r = applyConfigChange(sampleState(), { analytics: "https://cloud.umami.is/script.js", analyticsId: "abc-123" });
    expect(r.state.analytics).toEqual({ script: "https://cloud.umami.is/script.js", id: "abc-123" });
    expect(r.state.plugins.analytics).toBe(true);
    expect(r.patch.analytics).toEqual({ scriptUrl: "https://cloud.umami.is/script.js", websiteId: "abc-123" });
    expect(r.patch.plugins).toMatchObject({ analytics: true });
    expect(r.cspOrigin).toEqual({ to: "https://cloud.umami.is" });
    // Outra origem: sai a anterior.
    expect(applyConfigChange(r.state, { analytics: "https://stats.ana.dev/s.js" }).cspOrigin).toEqual({ from: "https://cloud.umami.is", to: "https://stats.ana.dev" });
    // Mesma origem, outro id: a CSP não muda.
    expect(applyConfigChange(r.state, { analyticsId: "def" }).cspOrigin).toBeUndefined();
    // Desligar tira a origem e desliga o plugin.
    const off = applyConfigChange(r.state, { analytics: "desligar" });
    expect(off.state.analytics).toBeUndefined();
    expect(off.state.plugins.analytics).toBe(false);
    expect(off.cspOrigin).toEqual({ from: "https://cloud.umami.is" });
    expect(() => applyConfigChange(sampleState(), { analytics: "http://x.com/s.js" })).toThrow(/https/);
    expect(() => applyConfigChange(sampleState(), { analytics: "https://x.com/s.js", analyticsId: "<x>" })).toThrow(/Id do site/);
    expect(applyConfigChange(sampleState(), { analytics: "https://x.com/s.js" }).warnings.join()).toMatch(/--analytics-id/);
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

describe("create: modo de cor recomendado pelo tema", () => {
  it("sem --modo, vale o colorMode do pacote do tema; com --modo, o escolhido", async () => {
    const { resolveCreateOptions } = await import("../src/commands/create");
    const parent = tmp("rubrica-modo-");
    const base = ["site", "--yes", "--tipo", "pessoal", "--nome", "Ana", "--url", "ana.dev", "--sem-git"];
    expect((await resolveCreateOptions([...base, "--tema", "magazine"], parent, {})).state.aparencia.modo).toBe("light");
    expect((await resolveCreateOptions([...base, "--tema", "padrao"], parent, {})).state.aparencia.modo).toBe("dark");
    expect((await resolveCreateOptions([...base, "--tema", "magazine", "--modo", "escuro"], parent, {})).state.aparencia.modo).toBe("dark");
  });
});
