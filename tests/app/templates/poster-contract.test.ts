import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getLayout } from "../../../cli/src/layouts";
import {
  fit,
  formatDate,
  longestWord,
  markStatement,
  readingMinutes,
  yearOf,
} from "../../../templates/layouts/poster/PosterShared";

// Pôster Cinético: tipografia gigante que nunca estoura a largura, decoração que nunca
// cobre texto e a faixa rolante acessível.

const ROOT = resolve(import.meta.dirname, "../../..");
const DIR = resolve(ROOT, "templates/layouts/poster");
const read = (rel: string) => readFileSync(resolve(DIR, rel), "utf-8");
const PAGES = ["Home", "Resume", "Portfolio", "About", "Blog"];

describe("poster — arquivos do registro", () => {
  const spec = getLayout("poster");

  it("existe no registro com os arquivos da raiz", () => {
    expect(spec?.copy).toEqual(["Layout.tsx", "PosterNav.tsx", "PosterShared.tsx"]);
  });

  it.each(["Layout.tsx", "PosterNav.tsx", "PosterShared.tsx", ...PAGES.map((p) => `pages/${p}.tsx`)])(
    "%s existe",
    (file) => expect(existsSync(resolve(DIR, file))).toBe(true),
  );
});

describe("poster — estrutura e acessibilidade", () => {
  it("a navegação tem o botão de modo de cor", () => {
    expect(read("PosterNav.tsx")).toMatch(/<ColorModeToggle\b/);
  });

  it.each(PAGES)("a página %s tem exatamente um h1", (page) => {
    const src = read(`pages/${page}.tsx`);
    // As páginas internas usam o PageHead, que desenha o h1.
    const h1 = (src.match(/<h1\b/g) ?? []).length + (src.match(/<PageHead\b/g) ?? []).length;
    expect(h1).toBe(1);
  });

  it("a faixa rolante esconde a cópia duplicada do leitor de tela e respeita movimento reduzido", () => {
    const src = read("PosterShared.tsx");
    expect(src).toMatch(/aria-hidden=\{hidden \|\| undefined\}/);
    expect(src).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.poster-marq-track \{ animation: none/);
  });

  it("o contorno tem alternativa preenchida quando o navegador não suporta text-stroke", () => {
    const src = read("PosterShared.tsx");
    expect(src).toMatch(/\.poster-outline \{ color: var\(--poster-ink\); \}\s*\n[\s\S]*@supports \(-webkit-text-stroke: 1px\)/);
  });

  it("o texto gigante se ajusta ao contêiner e pode quebrar palavra", () => {
    const src = read("PosterShared.tsx");
    expect(src).toMatch(/container-type: inline-size/);
    expect(src).toMatch(/overflow-wrap: anywhere/);
    expect(src).toMatch(/100cqi/);
  });
});

describe("poster — utilitários", () => {
  it("longestWord mede a palavra mais longa, com mínimo 2", () => {
    expect(longestWord("Maria Eduarda Albuquerque")).toBe(11);
    expect(longestWord("9")).toBe(2);
    expect(longestWord("")).toBe(2);
  });

  it("fit gera as variáveis do layout", () => {
    expect(fit("Albuquerque", 160, 0.8)).toEqual({ "--poster-n": 11, "--poster-max": "160px", "--poster-k": 0.8 });
  });

  it("yearOf pega o primeiro ano do período", () => {
    expect(yearOf("2021 - 2024")).toBe("2021");
    expect(yearOf("jan/2019 – atual")).toBe("2019");
    expect(yearOf("atual")).toBeNull();
    expect(yearOf(undefined)).toBeNull();
  });

  it("readingMinutes ignora as tags e nunca devolve zero", () => {
    expect(readingMinutes("<p>oi</p>")).toBe(1);
    expect(readingMinutes(`<p>${"palavra ".repeat(401)}</p>`)).toBe(3);
  });

  it("formatDate devolve vazio para data inválida", () => {
    expect(formatDate("não é data", "pt-BR")).toBe("");
    expect(formatDate(undefined, "pt-BR")).toBe("");
    expect(formatDate("2026-01-14T12:00:00Z", "pt-BR")).toMatch(/2026/);
  });

  describe("markStatement", () => {
    const marked = (text: string) => markStatement(text).filter((s) => s.mark).map((s) => s.text);
    const joined = (text: string) => markStatement(text).map((s) => s.text).join("");

    it("prefere os números com unidade", () => {
      expect(marked("Lidero 9 times há 8 anos.")).toEqual(["9 times", "8 anos"]);
    });

    it("sem números, marca o trecho depois dos dois-pontos", () => {
      const text = "Desenho produtos de ponta a ponta: da pesquisa ao código.";
      expect(marked(text)).toEqual(["da pesquisa ao código"]);
      expect(joined(text)).toBe(text);
    });

    it("sem números nem dois-pontos, marca as três últimas palavras", () => {
      const text = "Gosto de problemas difíceis e interfaces claras.";
      expect(marked(text)).toEqual(["e interfaces claras"]);
      expect(joined(text)).toBe(text);
    });

    it("frase curta fica sem marca", () => {
      expect(marked("Olá, mundo.")).toEqual([]);
    });
  });
});
