/**
 * Textos de interface do tema Terminal Brutalista (prefixo `brutalist.`), nos três idiomas
 * de partida. São só os rótulos das peças que imitam um terminal; o site pode trocar
 * qualquer um em "Textos".
 */
type Tr = { pt: string; en: string; es: string };
const tr = (pt: string, en: string, es: string): Tr => ({ pt, en, es });

export const BRUTALIST_TEXTS: Record<string, Tr> = {
  /** Cabeçalho de cada depoimento ("de: Fulana <cargo>"). */
  "brutalist.from": tr("de", "from", "de"),
  /** Prefixos de pergunta e resposta nas perguntas frequentes (P01. / R.). */
  "brutalist.question": tr("P", "Q", "P"),
  "brutalist.answer": tr("R", "A", "R"),
  /** Linha de total do índice de projetos ("total 3"). */
  "brutalist.total": tr("total {count}", "total {count}", "total {count}"),
  /** Rótulo acessível da barra de título que imita a janela do terminal. */
  "brutalist.window": tr("Janela do terminal", "Terminal window", "Ventana de terminal"),
};
