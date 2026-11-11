import { describe, expect, it } from "vitest";
import { formatSiteDate, siteTimeZone } from "../src/render/dates";
import { readingMinutes } from "../src/render/text";

describe("datas do site", () => {
  it("o fuso vem do país do idioma principal; sem país, UTC", () => {
    expect(siteTimeZone("pt-BR")).toBe("America/Sao_Paulo");
    expect(siteTimeZone("es-ES")).toBe("Europe/Madrid");
    expect(siteTimeZone("en")).toBe("UTC");
    expect(siteTimeZone("fr-FR")).toBe("UTC");
  });

  it("post publicado à noite no Brasil é do mesmo dia (não do seguinte, como em UTC)", () => {
    // 7/nov 21h30 em Brasília = 8/nov 00h30 em UTC.
    const iso = "2026-11-08T00:30:00.000Z";
    expect(formatSiteDate(iso, "pt-BR", "America/Sao_Paulo", "short")).toBe("07/11/2026");
    expect(formatSiteDate(iso, "pt-BR", "America/Sao_Paulo")).toBe("7 de novembro de 2026");
    expect(formatSiteDate(iso, "pt-BR", "UTC", "short")).toBe("08/11/2026");
  });

  it("data sem hora fica no dia do calendário, em qualquer fuso", () => {
    expect(formatSiteDate("2024-03-01", "pt-BR", "America/Sao_Paulo", "short")).toBe("01/03/2024");
    expect(formatSiteDate("2024-03-01", "en", "America/Sao_Paulo", "month")).toBe("Mar 2024");
  });
});

describe("tempo de leitura", () => {
  it("arredonda para cima, como a v1 (200 palavras por minuto)", () => {
    expect(readingMinutes(`<p>${"palavra ".repeat(3001)}</p>`)).toBe(16);
    expect(readingMinutes(`<p>${"palavra ".repeat(3000)}</p>`)).toBe(15);
    expect(readingMinutes("<p>curto</p>")).toBe(1);
  });
});
