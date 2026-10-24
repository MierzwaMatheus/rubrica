import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyAppearance, type Appearance } from "../transforms/applyAppearance.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

const HTML_PATH = "/project/index.html";

/** Aplica a aparência sobre um index.html em memória e devolve a tag <html> e o arquivo inteiro. */
async function run(html: string, appearance: Appearance) {
  const vol = Volume.fromJSON({ [HTML_PATH]: html });
  await applyAppearance(appearance, HTML_PATH, makeFsModule(vol));
  const result = vol.readFileSync(HTML_PATH, "utf-8") as string;
  return { result, tag: result.match(/<html\b[^>]*>/)?.[0] ?? "", vol };
}

const PLAIN = `<!doctype html>\n<html lang="pt-BR">\n<head></head>\n<body></body>\n</html>`;

describe("applyAppearance", () => {
  it("acrescenta data-color-mode, data-color-toggle e data-texture no <html>", async () => {
    const { tag } = await run(PLAIN, { colorMode: "dark", colorModeToggle: true, texture: "grain" });
    expect(tag).toContain('lang="pt-BR"');
    expect(tag).toContain('data-color-mode="dark"');
    expect(tag).toContain('data-color-toggle="true"');
    expect(tag).toContain('data-texture="grain"');
  });

  it("modo escuro põe a classe dark; modo automático também (a página abre escura até o script decidir)", async () => {
    expect((await run(PLAIN, { colorMode: "dark", colorModeToggle: false, texture: "none" })).tag).toContain('class="dark"');
    expect((await run(PLAIN, { colorMode: "system", colorModeToggle: false, texture: "none" })).tag).toContain('class="dark"');
  });

  it("modo claro tira a classe dark e preserva as outras classes", async () => {
    const html = `<html lang="en" class="antialiased dark" data-color-mode="dark" data-color-toggle="false" data-texture="none">`;
    const { tag } = await run(html, { colorMode: "light", colorModeToggle: false, texture: "paper" });
    expect(tag).toContain('class="antialiased"');
    expect(tag).not.toMatch(/\bdark\b/);
    expect(tag).toContain('data-color-mode="light"');
    expect(tag).toContain('data-texture="paper"');
  });

  it("modo claro remove o atributo class quando dark era a única classe", async () => {
    const { tag } = await run(`<html class="dark">`, { colorMode: "light", colorModeToggle: true, texture: "none" });
    expect(tag).not.toContain("class=");
  });

  it("troca os atributos existentes em vez de duplicar e não duplica a classe dark", async () => {
    const html = `<html lang="pt-BR" class="dark" data-color-mode="light" data-color-toggle="true" data-texture="scanlines">`;
    const { tag } = await run(html, { colorMode: "dark", colorModeToggle: false, texture: "none" });
    expect(tag.match(/data-color-mode=/g)).toHaveLength(1);
    expect(tag.match(/data-texture=/g)).toHaveLength(1);
    expect(tag.match(/\bdark\b/g)).toHaveLength(2); // a classe e o valor de data-color-mode
    expect(tag).toContain('data-color-toggle="false"');
  });

  it("é idempotente: aplicar duas vezes dá o mesmo arquivo", async () => {
    const appearance: Appearance = { colorMode: "system", colorModeToggle: true, texture: "grain" };
    const { result: first } = await run(PLAIN, appearance);
    const { result: second } = await run(first, appearance);
    expect(second).toBe(first);
  });

  it("não mexe no resto do documento", async () => {
    const { result } = await run(PLAIN, { colorMode: "light", colorModeToggle: false, texture: "none" });
    expect(result.replace(/<html\b[^>]*>/, "")).toBe(PLAIN.replace(/<html\b[^>]*>/, ""));
  });
});
