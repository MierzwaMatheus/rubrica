/** Palavras de um texto ou HTML (sem as tags). */
export function countWords(html: string | undefined | null): number {
  return (html ?? "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

/** Minutos de leitura a ~200 palavras por minuto (no mínimo 1). */
export function minutesFromWords(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}
