// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ROTEIRO, VERSAO, chaveArmazenamento } from "../../site/src/lib/voz";
import { UI, gerarMarkdown, type EstadoVoz } from "../../site/src/lib/voz-textos";

const estrutura = (lang: "pt" | "en") =>
  ROTEIRO[lang].map((b) => ({
    id: b.id,
    perguntas: b.perguntas.map((q) => ({
      id: q.id,
      tipo: q.tipo,
      uso: q.uso,
      opcional: !!q.opcional,
      polos: q.polos?.length ?? 0,
    })),
  }));

function textosVazios(valor: unknown, caminho: string, out: string[] = []): string[] {
  if (typeof valor === "string") {
    if (!valor.trim()) out.push(caminho);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => textosVazios(v, `${caminho}[${i}]`, out));
  } else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) textosVazios(v, `${caminho}.${k}`, out);
  }
  return out;
}

describe("roteiro da entrevista de voz", () => {
  it("tem as mesmas perguntas nos dois idiomas, na mesma ordem, com mesmos ids, tipo, uso e opcional", () => {
    expect(estrutura("en")).toEqual(estrutura("pt"));
  });

  it("não tem texto vazio no roteiro em inglês", () => {
    expect(textosVazios(ROTEIRO.en, "en")).toEqual([]);
    for (const b of ROTEIRO.en) {
      expect(b.titulo.trim()).not.toBe("");
      expect(b.intro.trim()).not.toBe("");
      for (const q of b.perguntas) expect(q.texto.trim(), q.id).not.toBe("");
    }
  });

  it("não tem texto vazio na interface em inglês e cobre as mesmas chaves do português", () => {
    expect(textosVazios(UI.en, "ui.en")).toEqual([]);
    expect(Object.keys(UI.en).sort()).toEqual(Object.keys(UI.pt).sort());
    expect(UI.en.ditadoPadrao).toBe("en-US");
  });

  it("guarda as respostas em chaves separadas, mantendo a original do português", () => {
    expect(chaveArmazenamento("pt")).toBe(`rubrica-voz-${VERSAO}`);
    expect(chaveArmazenamento("en")).not.toBe(chaveArmazenamento("pt"));
  });
});

describe("Markdown para o agente", () => {
  const estado: EstadoVoz = {
    respostas: { A1: "I make computers do the boring stuff", F2: "4" },
    modos: { A1: "ditado" },
    idioma: "en-US",
  };

  it("mantém em inglês a marcação que a skill rubrica-voz lê", () => {
    const md = gerarMarkdown("en", estado, "2026-10-25");
    const linhas = md.split("\n");
    expect(linhas[0]).toBe(`<!-- rubrica-voz ${VERSAO} -->`);
    expect(linhas[1]).toBe("<!-- idioma: en -->");
    expect(md).toContain("### A1. How do you explain");
    expect(md).toContain("<!-- uso: voz, apresentacao · tipo: aberta · modo: ditado -->");
    expect(md).toContain("<!-- uso: voz · tipo: escrita · modo: sem resposta -->");
    expect(md).toContain("<!-- uso: voz, pessoal:faq, pessoal:rotina · tipo: aberta · opcional · modo: sem resposta -->");
    expect(md).toContain("<!-- uso: voz · tipo: regua -->\n\n4/5 (1 = serious, 5 = playful)");
    expect(md).toContain("_(no answer)_");
    const ids = [...md.matchAll(/^### ([A-Z]\d+)\. /gm)].map((m) => m[1]);
    expect(ids).toEqual(ROTEIRO.pt.flatMap((b) => b.perguntas.map((q) => q.id)));
  });

  it("não muda o Markdown em português", () => {
    const md = gerarMarkdown("pt", { ...estado, idioma: "pt-BR" }, "2026-10-25");
    expect(md.split("\n").slice(0, 4)).toEqual([
      `<!-- rubrica-voz ${VERSAO} -->`,
      "# Entrevista de voz",
      "",
      "Respondida em 2026-10-25. Idioma do ditado: pt-BR.",
    ]);
    expect(md).not.toContain("idioma:");
    expect(md).toContain("_(sem resposta)_");
    expect(md).toContain("4/5 (1 = sério, 5 = bem-humorado)");
  });
});
