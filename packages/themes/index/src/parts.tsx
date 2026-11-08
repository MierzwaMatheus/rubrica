/**
 * Peças compartilhadas do tema Índice: a seção rotulada (rótulo à esquerda, conteúdo à
 * direita), o índice em tabela com a imagem que surge no hover (só CSS) e os links
 * sublinhados. Tudo é React puro: só props, sem estado nem efeitos.
 */
import type { ReactNode } from "react";
import type { RenderContext, ResolvedImage, ResolvedLink } from "@rubrica/core";
import { Heading, Img } from "@rubrica/core/components";

/** Número de catálogo com três dígitos: 1 → "001". */
export const catalogNumber = (n: number) => String(n).padStart(3, "0");

/** Texto sem tags HTML, para medir o tamanho de um trecho. */
export const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

interface IndexSectionProps {
  /** Tipo do bloco (vira `data-block` e a classe `rb-<tipo>`). */
  type: string;
  id: string;
  anchor?: string;
  variant: string;
  /** Rótulo em caixa alta na coluna da esquerda. Sem ele, a coluna fica vazia. */
  label?: ReactNode;
  /** `1` ou `2` faz do rótulo o título da seção; `0` para rótulos decorativos (div). */
  level?: 0 | 1 | 2;
  /** Conteúdo extra abaixo do rótulo (contagem, texto de apoio). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Linha do catálogo: rótulo à esquerda (~180px), conteúdo à direita, linha fina embaixo. */
export function IndexSection({ type, id, anchor, variant, label, level = 2, aside, className, children }: IndexSectionProps) {
  return (
    <section id={anchor || `b-${id}`} className={`rb-section rb-${type} ix-s${className ? ` ${className}` : ""}`} data-block={type} data-variant={variant}>
      <IndexRow label={label} level={level} aside={aside}>
        {children}
      </IndexRow>
    </section>
  );
}

/** A linha em si (rótulo + corpo), para blocos que empilham várias dentro de uma seção. */
export function IndexRow({ label, level = 2, aside, className, children }: { label?: ReactNode; level?: 0 | 1 | 2; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={`ix-row${className ? ` ${className}` : ""}`}>
      <div className="ix-lab-col">
        {label ? level === 0 ? <div className="ix-lab">{label}</div> : <Heading level={level} className="ix-lab">{label}</Heading> : null}
        {aside ? <div className="ix-aside">{aside}</div> : null}
      </div>
      <div className="ix-body">{children}</div>
    </div>
  );
}

/** Seta decorativa de um link: ↓ para âncora da página, ↗ para externo, → para o resto. */
export function arrowFor(link: Pick<ResolvedLink, "href" | "external">): string {
  if (link.external) return "↗";
  return link.href.startsWith("#") ? "↓" : "→";
}

/** Link sublinhado com a cor de destaque, no estilo da v1. */
export function UnderLink({ link, ctx, className }: { link: ResolvedLink; ctx: RenderContext; className?: string }) {
  return (
    <a href={link.href} className={`ix-u${className ? ` ${className}` : ""}`} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label} <span aria-hidden="true">{arrowFor(link)}</span>
      {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
    </a>
  );
}

export interface IndexColumn<T> {
  key: string;
  header: string;
  /** A coluna do título: ganha o link da linha (que cobre a linha inteira). */
  title?: boolean;
  muted?: boolean;
  num?: boolean;
  width?: string;
  cell: (row: T, index: number) => ReactNode;
}

interface IndexTableProps<T> {
  caption: string;
  rows: T[];
  columns: IndexColumn<T>[];
  getKey: (row: T) => string;
  getHref: (row: T) => string;
  /** Imagem e legenda da pré-visualização que aparece na coluna do rótulo, no hover. */
  getPreview?: (row: T, index: number) => { image?: ResolvedImage; caption: string };
  /** Atributo `data-tags` de cada linha (filtro por etiqueta em CSS). */
  getTags?: (row: T) => string | undefined;
}

/**
 * Tabela do índice. No hover ou no foco a linha inverte as cores e a imagem surge na
 * coluna do rótulo, na altura da linha (posicionada em CSS: a linha é o referencial).
 * O link do título cobre a linha toda. No celular a tabela vira cartões.
 */
export function IndexTable<T>({ caption, rows, columns, getKey, getHref, getPreview, getTags }: IndexTableProps<T>) {
  return (
    <table className="ix-t">
      <caption className="rb-sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" style={c.width ? { width: c.width } : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const preview = getPreview?.(row, i);
          return (
            <tr key={getKey(row)} data-tags={getTags?.(row)}>
              {columns.map((c, ci) => {
                const content = c.cell(row, i);
                return (
                  <td key={c.key} data-label={c.title ? undefined : c.header} data-title={c.title ? "" : undefined} className={c.muted ? "ix-muted" : undefined}>
                    {ci === 0 && preview && (
                      <span className="ix-prev" aria-hidden="true">
                        {preview.image ? <Img image={{ ...preview.image, alt: "" }} sizes="168px" /> : <span className="ix-prev-ph">{preview.caption.slice(0, 1)}</span>}
                        <span className="ix-prev-cap">{preview.caption}</span>
                      </span>
                    )}
                    {c.title ? (
                      <a href={getHref(row)} className="ix-row-link">
                        {content}
                      </a>
                    ) : c.num ? (
                      <span className="ix-num">{content}</span>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
