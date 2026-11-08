/**
 * Faixa de texto em arte ASCII (fonte "Big" do figlet), como o nome do topo da home na v1.
 * Síncrono e puro: dá o mesmo resultado no build e na prévia do painel.
 */
import figlet from "figlet";
import BigFont from "figlet/importable-fonts/Big.js";

let parsed = false;

/** Acima disto a arte fica larga demais para a tela; vale só o texto simples. */
export const MAX_ART_CHARS = 16;

export interface Banner {
  /** Arte pronta, sem linhas em branco no fim. */
  art: string;
  /** Largura em colunas da linha mais longa. */
  cols: number;
}

export function banner(text: string): Banner | undefined {
  const name = text.trim().toUpperCase();
  if (!name || [...name].length > MAX_ART_CHARS) return undefined;
  try {
    if (!parsed) {
      figlet.parseFont("Big", BigFont);
      parsed = true;
    }
    const art = figlet.textSync(name, { font: "Big" }).replace(/\s+$/, "");
    if (!art) return undefined;
    return { art, cols: Math.max(...art.split("\n").map((l) => l.length)) };
  } catch {
    return undefined;
  }
}
