/**
 * Markdown do repositório (docs e changelog) em HTML, com âncoras nos títulos no mesmo
 * formato do GitHub: os links "./cores.md#cyberpunk" continuam funcionando no site.
 */
import { Marked, type Tokens } from "marked";

export interface TocItem {
  id: string;
  text: string;
}

export function githubSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

const plain = (s: string) => s.replace(/`([^`]*)`/g, "$1").replace(/\*\*?|__?/g, "").replace(/<[^>]+>/g, "");

/** HTML do Markdown e a lista dos títulos ## (o índice "Nesta página"). */
export function renderMarkdown(md: string): { html: string; toc: TocItem[] } {
  const seen = new Map<string, number>();
  const toc: TocItem[] = [];
  const marked = new Marked({
    renderer: {
      heading(this: { parser: { parseInline: (t: Tokens.Heading["tokens"]) => string } }, token: Tokens.Heading) {
        const text = plain(token.text);
        const base = githubSlug(text);
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n ? `${base}-${n}` : base;
        if (token.depth === 2) toc.push({ id, text });
        return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
      },
    },
  });
  const html = marked.parse(md, { async: false });
  return { html, toc };
}
