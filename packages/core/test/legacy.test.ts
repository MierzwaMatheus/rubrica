/** Corpo do case no formato antigo (`content` + `sections`) convertido em blocos `texto`. */
import { describe, expect, it } from "vitest";
import { needsSectionsMigration, sectionsToBlocks, sectionToBlock } from "../src/content/legacy";
import type { RawProject } from "../src/content/types";

const project: Pick<RawProject, "blocks" | "content" | "sections"> = {
  content: { "pt-BR": "<p>Resumo.</p>", en: "<p>Summary.</p>" },
  sections: [
    { title: { "pt-BR": "Problema" }, body: { "pt-BR": "<p>a</p>" } },
    { title: { "pt-BR": "Solução" }, body: { "pt-BR": "<p>b</p>" }, image: { url: "/b.png", alt: { "pt-BR": "Tela" } } },
  ],
};

describe("sectionsToBlocks", () => {
  it("content vira o primeiro texto, sem título; cada seção vira um texto", () => {
    const blocks = sectionsToBlocks(project);
    expect(blocks.map((b) => [b.id, b.type, b.visible])).toEqual([
      ["conteudo", "texto", true],
      ["secao-1", "texto", true],
      ["secao-2", "texto", true],
    ]);
    expect(blocks[0]!.fields).toEqual({ body: project.content });
    expect(blocks[2]!.fields).toEqual({ title: { "pt-BR": "Solução" }, body: { "pt-BR": "<p>b</p>" }, image: { url: "/b.png", alt: { "pt-BR": "Tela" } } });
  });

  it("ids estáveis: a mesma entrada gera os mesmos ids", () => {
    expect(sectionsToBlocks(project)).toEqual(sectionsToBlocks(project));
    // Sem content, as seções continuam com os mesmos ids.
    expect(sectionsToBlocks({ sections: project.sections }).map((b) => b.id)).toEqual(["secao-1", "secao-2"]);
    expect(sectionToBlock(project.sections![0]!, 4).id).toBe("secao-5");
  });

  it("é idempotente: projeto com blocos devolve os próprios blocos", () => {
    const once = sectionsToBlocks(project);
    const migrated = { ...project, blocks: once };
    expect(sectionsToBlocks(migrated)).toBe(once);
    expect(sectionsToBlocks({ ...migrated, blocks: sectionsToBlocks(migrated) })).toEqual(once);
    // Blocos vazios também são a escolha do projeto: não volta às seções.
    expect(sectionsToBlocks({ ...project, blocks: [] })).toEqual([]);
  });

  it("content vazio ou só espaços não vira bloco", () => {
    expect(sectionsToBlocks({ content: { "pt-BR": "  " } })).toEqual([]);
    expect(sectionsToBlocks({})).toEqual([]);
  });
});

describe("needsSectionsMigration", () => {
  it("só projetos sem blocos e com corpo antigo", () => {
    expect(needsSectionsMigration(project)).toBe(true);
    expect(needsSectionsMigration({ content: { "pt-BR": "<p>x</p>" } })).toBe(true);
    expect(needsSectionsMigration({ ...project, blocks: [] })).toBe(false);
    expect(needsSectionsMigration({})).toBe(false);
  });
});
