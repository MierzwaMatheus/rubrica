/** Texto puro a partir de HTML (para contagem de palavras e descrições). */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(" ").length : 0;
}

/** Minutos de leitura a 200 palavras por minuto, arredondados para cima (como a v1), no mínimo 1. */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.ceil(countWords(html) / 200));
}

/**
 * Texto para busca: minúsculas e sem acento ("Gestão" acha "gestao"). Os cartões de post
 * guardam o deles em `data-search`, e a ilha de busca compara com o que a pessoa digita.
 */
export function searchText(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta no limite sem partir palavra, com reticências. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
