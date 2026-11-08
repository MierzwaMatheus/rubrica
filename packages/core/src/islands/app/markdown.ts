/**
 * Markdown do contrato e da política de rescisão → HTML, sem biblioteca. Só o que esses
 * textos usam: títulos, parágrafos, listas (`-`, `*`, `•`, `1.`), citação, linha (`---`),
 * **negrito** e *itálico*. Todo texto é escapado antes; nenhum HTML do Markdown passa.
 */

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;

/**
 * `baseLevel`: nível do maior título do texto (os outros descem junto), para encaixar na
 * hierarquia da página (ex.: 3 dentro de uma seção com h2).
 */
export function markdownToHtml(markdown: string, baseLevel = 2): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const levels = lines.map((l) => HEADING.exec(l)?.[1]!.length).filter((n): n is number => n !== undefined);
  const shift = levels.length ? baseLevel - Math.min(...levels) : 0;
  const out: string[] = [];
  let paragraph: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = HEADING.exec(line.trim());
    if (heading) {
      flush();
      const level = Math.min(6, Math.max(1, heading[1]!.length + shift));
      out.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      continue;
    }
    if (RULE.test(line)) {
      flush();
      out.push("<hr>");
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      const tag = bullet ? "ul" : "ol";
      if (paragraph.length || quote.length || (list && list.tag !== tag)) flush();
      list ??= { tag, items: [] };
      list.items.push((bullet ?? numbered)![1]!);
      continue;
    }
    const q = QUOTE.exec(line);
    if (q) {
      if (paragraph.length || list) flush();
      quote.push(q[1]!);
      continue;
    }
    // Linha que continua o item da lista (recuada) ou o parágrafo.
    if (list && /^\s+/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    if (list || quote.length) flush();
    paragraph.push(line.trim());
  }
  flush();
  return out.join("\n");
}
