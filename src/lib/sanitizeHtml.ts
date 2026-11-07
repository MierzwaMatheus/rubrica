import DOMPurify from "dompurify";

type Purifier = Pick<typeof DOMPurify, "sanitize">;

/**
 * O DOMPurify precisa de um DOM. No navegador usa o da página; na pré-renderização
 * (Node, sem DOM) o entry-server injeta um feito com jsdom.
 */
let purifier: Purifier = DOMPurify;

export function setHtmlSanitizer(next: Purifier) {
  purifier = next;
}

/** Limpa HTML vindo do conteúdo (posts, currículo) antes de ir para dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string): string {
  return purifier.sanitize(html ?? "");
}
