import { describe, it, expect } from "vitest";
import { countWords, minutesFromWords } from "@/utils/readingTime";
import { mapBlogPost } from "@/repositories/mappers/convexMappers";

describe("tempo de leitura", () => {
  it("conta palavras sem as tags do HTML", () => {
    expect(countWords("<p>Olá <strong>mundo</strong> bonito</p>")).toBe(3);
    expect(countWords("")).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });

  it("~200 palavras por minuto, no mínimo 1", () => {
    expect(minutesFromWords(0)).toBe(1);
    expect(minutesFromWords(200)).toBe(1);
    expect(minutesFromWords(201)).toBe(2);
  });

  it("o mapper lê a contagem do índice do blog", () => {
    expect(mapBlogPost({ _id: "p", wordCount: { ptBR: 400, enUS: 380 } }).word_count).toEqual({ "pt-BR": 400, "en-US": 380 });
    expect(mapBlogPost({ _id: "p", wordCount: { ptBR: 400 } }).word_count).toEqual({ "pt-BR": 400, "en-US": 400 });
  });
});
