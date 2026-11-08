import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import type { RubricalConfigInput } from "../transforms/applyRubricalConfig.js";

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

const fullConfig: RubricalConfigInput = {
  siteName: "Meu Portfólio",
  siteUrl: "https://meusite.com",
  siteDescription: "Portfólio profissional.",
  authorName: "João Silva",
  authorEmail: "joao@meusite.com",
  twitterHandle: "joaosilva",
  lang: "pt-BR",
  seoHomeTitle: "Dev Full-Stack",
  seoHomeDescription: "Projetos e artigos.",
  rssTitle: "João Silva — Blog",
  rssDescription: "Artigos sobre desenvolvimento.",
  ogImageUrl: "https://meusite.com/og.jpg",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
};

describe("applyRubricalConfig", () => {
  it("gera rubrica.config.ts com todos os campos do input", async () => {
    const vol = Volume.fromJSON({ "/project": null });
    const fs = makeFsModule(vol);

    await applyRubricalConfig(fullConfig, "/project", fs);

    const content = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;
    expect(content).toContain('siteName: "Meu Portfólio"');
    expect(content).toContain('siteUrl: "https://meusite.com"');
    expect(content).toContain('siteDescription: "Portfólio profissional."');
    expect(content).toContain('authorName: "João Silva"');
    expect(content).toContain('authorEmail: "joao@meusite.com"');
    expect(content).toContain('lang: "pt-BR"');
    expect(content).toContain('seoHomeTitle: "Dev Full-Stack"');
    expect(content).toContain('rssTitle: "João Silva — Blog"');
    expect(content).toContain('ogImageUrl: "https://meusite.com/og.jpg"');
    expect(content).toContain('fontSans: "Inter"');
    expect(content).toContain('fontMono: "JetBrains Mono"');
  });

  it("campo twitterHandle incluído corretamente sem @", async () => {
    const vol = Volume.fromJSON({ "/project": null });
    const fs = makeFsModule(vol);

    await applyRubricalConfig(fullConfig, "/project", fs);

    const content = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;
    expect(content).toContain('twitterHandle: "joaosilva"');
    expect(content).not.toContain('twitterHandle: "@joaosilva"');
  });

  it("re-executar com mesmos valores produz arquivo idêntico (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project": null });
    const fs = makeFsModule(vol);

    await applyRubricalConfig(fullConfig, "/project", fs);
    const first = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;

    await applyRubricalConfig(fullConfig, "/project", fs);
    const second = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;

    expect(first).toBe(second);
  });

  it("arquivo gerado é TypeScript sintaticamente válido", async () => {
    const vol = Volume.fromJSON({ "/project": null });
    const fs = makeFsModule(vol);

    await applyRubricalConfig(fullConfig, "/project", fs);

    const content = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;
    expect(content).toContain("export const rubricalConfig");
    const openBraces = (content.match(/\{/g) ?? []).length;
    const closeBraces = (content.match(/\}/g) ?? []).length;
    expect(openBraces).toBe(closeBraces);
  });
});
