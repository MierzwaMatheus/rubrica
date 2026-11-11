import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ejectBlock, ejectedStatus } from "../src/commands/eject";
import { componentSegment, findBlockMapping, findComponentSource, hashText } from "../src/project/eject";
import { astroConfig } from "../src/project/files";
import { readState, writeState } from "../src/state";
import { repo, sampleState, tmp } from "./helpers";

/** Projeto com o núcleo e o tema do monorepo "instalados" (links em node_modules). */
function installedProject() {
  const dir = tmp();
  mkdirSync(join(dir, "node_modules/@rubrica"), { recursive: true });
  symlinkSync(repo("packages/core"), join(dir, "node_modules/@rubrica/core"));
  symlinkSync(repo("packages/themes/padrao"), join(dir, "node_modules/@rubrica/theme-padrao"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { "@rubrica/core": "*", "@rubrica/theme-padrao": "*" } }));
  const state = sampleState();
  writeState(dir, state);
  writeFileSync(join(dir, "astro.config.ts"), astroConfig(state));
  return dir;
}

describe("achar o componente", () => {
  it("lê o mapeamento tipo → componente", () => {
    expect(findBlockMapping('blocks: { hero: HeroX, "lista-itens": ListaX }', "hero")).toBe("HeroX");
    expect(findBlockMapping('blocks: { hero: HeroX, "lista-itens": ListaX }', "lista-itens")).toBe("ListaX");
    expect(findBlockMapping("fields: { hero: tr(\"a\") }", "hero")).toBeNull();
  });

  it("recorta só o componente para o hash", () => {
    const src = "export function A() { return 1; }\n\nexport function B() { return 2; }\n";
    expect(componentSegment(src, "B")).toBe("export function B() { return 2; }\n");
    expect(componentSegment(src, "A")).toBe("export function A() { return 1; }\n");
  });

  it("sem bloco no tema, usa o padrão do núcleo", () => {
    const dir = installedProject();
    const source = findComponentSource(dir, "@rubrica/theme-padrao", "faq");
    expect(source?.pkg).toBe("@rubrica/core");
    expect(source?.component).toBe("FaqBlock");
    expect(source?.file.endsWith("src/components/blocks/collections.tsx")).toBe(true);
  });
});

describe("ejetar", () => {
  it("copia o arquivo e os locais, troca os imports internos pelos públicos e registra", () => {
    const dir = installedProject();
    const { state, entry } = ejectBlock(dir, readState(dir), "faq");
    const copied = readFileSync(join(dir, "src/overrides/faq/blocks/collections.tsx"), "utf-8");
    expect(copied).not.toMatch(/from "\.\.\//);
    expect(copied).toContain('from "@rubrica/core/components"');
    expect(copied).toContain('from "@rubrica/core/blocks"');
    expect(copied).toContain('from "./util"');
    expect(readFileSync(join(dir, "src/overrides/faq/blocks/util.tsx"), "utf-8")).toContain('from "@rubrica/core/components"');
    expect(readFileSync(join(dir, "src/overrides/faq/index.tsx"), "utf-8")).toContain('export { FaqBlock as default } from "./blocks/collections";');
    expect(entry).toMatchObject({ tipo: "faq", origem: "@rubrica/core", componente: "FaqBlock", arquivo: "src/overrides/faq/index.tsx", arquivoOrigem: "src/components/blocks/collections.tsx" });
    expect(readState(dir).ejetados?.faq?.hash).toBe(entry.hash);
    expect(readFileSync(join(dir, "astro.config.ts"), "utf-8")).toBe(astroConfig(state));
    expect(readFileSync(join(dir, "astro.config.ts"), "utf-8")).toContain('"faq": "./src/overrides/faq/index.tsx"');
  });

  it("recusa ejetar de novo sem --forcar", () => {
    const dir = installedProject();
    ejectBlock(dir, readState(dir), "hero");
    expect(() => ejectBlock(dir, readState(dir), "hero")).toThrow(/já foi ejetado/);
    expect(() => ejectBlock(dir, readState(dir), "hero", true)).not.toThrow();
  });

  it("o update sabe quando o original mudou", () => {
    const dir = installedProject();
    ejectBlock(dir, readState(dir), "hero");
    expect(ejectedStatus(dir, readState(dir)).map((s) => s.status)).toEqual(["igual"]);
    const state = readState(dir);
    state.ejetados!.hero!.hash = hashText("versão antiga");
    writeState(dir, state);
    const [status] = ejectedStatus(dir, readState(dir));
    expect(status?.status).toBe("mudou");
    // O padrao desenha o próprio hero: o original é o do tema, não o do núcleo.
    expect(status?.original?.endsWith("src/blocks.tsx")).toBe(true);
    expect(status?.entry.origem).toBe("@rubrica/theme-padrao");
    state.ejetados!.hero!.componente = "NaoExiste";
    writeState(dir, state);
    expect(ejectedStatus(dir, readState(dir))[0]?.status).toBe("sumiu");
  });

  it("se o tema passa a implementar um bloco ejetado do núcleo, o original continua sendo o do núcleo", () => {
    const dir = installedProject();
    ejectBlock(dir, readState(dir), "faq");
    // Tema que agora desenha o bloco "faq" com outro componente.
    const theme = join(dir, "node_modules/@rubrica/theme-padrao");
    rmSync(theme);
    mkdirSync(join(theme, "src"), { recursive: true });
    writeFileSync(join(theme, "package.json"), JSON.stringify({ name: "@rubrica/theme-padrao", version: "9.9.9" }));
    writeFileSync(join(theme, "src/index.ts"), "export const theme = { blocks: { faq: TemaFaq } };\n");
    writeFileSync(join(theme, "src/faq.tsx"), "export function TemaFaq() { return null; }\n");
    const [status] = ejectedStatus(dir, readState(dir));
    expect(status?.status).toBe("igual");
    expect(status?.entry.origem).toBe("@rubrica/core");
  });
});
