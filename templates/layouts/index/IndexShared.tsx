/**
 * Peças compartilhadas do layout Índice: textos próprios (pt-BR e en-US), a folha de estilo,
 * a seção rotulada (rótulo à esquerda, conteúdo à direita) e o índice em tabela com a
 * pré-visualização que aparece na coluna do rótulo, alinhada à linha.
 *
 * Todas as cores vêm do esquema (var(--bg), var(--text)…). Nada aqui decide o modo.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import DOMPurify from "dompurify";
import { useI18n } from "@/i18n/context/I18nContext";
import { highlightNumbers } from "@/utils/homeContent";

// ---- textos próprios do layout ----------------------------------------------------------

const COPY = {
  "pt-BR": {
    skip: "Pular para o conteúdo",
    menu: "Menu",
    closeMenu: "Fechar",
    navLabel: "Navegação principal",
    archive: "Arquivo de trabalhos",
    sheet: "Nº",
    intro: "Apresentação",
    inNumbers: "Em números",
    contact: "Contato",
    colNumber: "Nº",
    colProject: "Projeto",
    colType: "Tipo",
    colField: "Área",
    colResult: "Resultado",
    colAction: "Ação",
    readCase: "Ler case",
    viewProject: "Ver projeto",
    opensNewTab: "(abre em nova aba)",
    projects: (n: number) => (n === 1 ? "1 projeto" : `${n} projetos`),
    posts: (n: number) => (n === 1 ? "1 texto" : `${n} textos`),
    index: "Índice",
    category: "Categoria",
    featured: "Em destaque",
    sortBy: "Ordenar por",
    sortAsc: "crescente",
    sortDesc: "decrescente",
    sortHint: "Clique em Nº ou Projeto para reordenar.",
    period: "Período",
    role: "Cargo",
    company: "Empresa",
    summary: "Resumo",
    showDetails: "Mostrar detalhes",
    institution: "Instituição",
    level: "Nível",
    interests: "Interesses",
    figure: "Fig.",
    colDate: "Data",
    colTitle: "Título",
    colTags: "Tags",
    colReading: "Leitura",
    minutes: (n: number) => `${n} min`,
    rss: "Assinar o RSS",
    allRights: "Todos os direitos reservados",
    noResult: "—",
    emptyCategory: "Nenhum projeto nesta categoria.",
  },
  "en-US": {
    skip: "Skip to content",
    menu: "Menu",
    closeMenu: "Close",
    navLabel: "Main navigation",
    archive: "Archive of work",
    sheet: "No.",
    intro: "Introduction",
    inNumbers: "By the numbers",
    contact: "Contact",
    colNumber: "No.",
    colProject: "Project",
    colType: "Type",
    colField: "Field",
    colResult: "Result",
    colAction: "Action",
    readCase: "Read case",
    viewProject: "View project",
    opensNewTab: "(opens in a new tab)",
    projects: (n: number) => (n === 1 ? "1 project" : `${n} projects`),
    posts: (n: number) => (n === 1 ? "1 post" : `${n} posts`),
    index: "Index",
    category: "Category",
    featured: "Featured",
    sortBy: "Sort by",
    sortAsc: "ascending",
    sortDesc: "descending",
    sortHint: "Click No. or Project to reorder.",
    period: "Period",
    role: "Role",
    company: "Company",
    summary: "Summary",
    showDetails: "Show details",
    institution: "Institution",
    level: "Level",
    interests: "Interests",
    figure: "Fig.",
    colDate: "Date",
    colTitle: "Title",
    colTags: "Tags",
    colReading: "Reading",
    minutes: (n: number) => `${n} min`,
    rss: "Subscribe to RSS",
    allRights: "All rights reserved",
    noResult: "—",
    emptyCategory: "No projects in this category.",
  },
} as const;

export type IndexCopy = (typeof COPY)[keyof typeof COPY];

/** Textos do layout no idioma atual. */
export function useIndexCopy(): IndexCopy {
  const { locale } = useI18n();
  return COPY[locale === "en-US" ? "en-US" : "pt-BR"];
}

/** Número de catálogo com três dígitos: 1 → "001". */
export const catalogNumber = (n: number) => String(n).padStart(3, "0");

/** Endereço do feed RSS gerado no build (scripts/generate-rss-feed.ts). */
export const RSS_URL = "/rss.xml";

// ---- utilitários -------------------------------------------------------------------------

/** Converte data do banco (ISO, milissegundos ou texto numérico) em Date; null se inválida. */
export function parseDate(value: string | number | undefined | null): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : /^\d+$/.test(value) ? Number(value) : NaN;
  const d = new Date(Number.isNaN(n) ? (value as string) : n);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Data no idioma atual: `numeric` para colunas de tabela ("12/01/2026"), `long` para textos
 * ("12 de jan. de 2026"). Vazio se não houver data válida.
 */
export function formatDate(
  value: string | number | undefined | null,
  locale: string,
  style: "numeric" | "long" = "numeric",
): string {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString(
    locale,
    style === "numeric" ? { day: "2-digit", month: "2-digit", year: "numeric" } : { day: "2-digit", month: "short", year: "numeric" },
  );
}

/** Texto puro de um trecho HTML (sem tags), para contagens e resumos. */
export function htmlToText(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Primeiro marcador de uma lista HTML, ou a primeira frase do texto. */
export function firstBullet(html: string): string {
  if (!html) return "";
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const li = doc.querySelector("li")?.textContent?.trim();
    if (li) return li;
  }
  const text = htmlToText(html);
  return text.split(/(?<=[.!?])\s/)[0] ?? text;
}

/** Minutos de leitura (200 palavras por minuto, no mínimo 1). */
export function readingMinutes(html: string): number {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ---- peças de texto ------------------------------------------------------------------------

/** Parágrafo com os números de resultado em destaque. */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? <strong key={i} className="ix-hl">{seg.text}</strong> : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}

/** HTML vindo do admin (descrições de experiência, formação), sempre sanitizado. */
export function RichText({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html ?? ""), [html]);
  if (!clean.trim()) return null;
  return <div className={["ix-rich", className].filter(Boolean).join(" ")} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/** Números de destaque como lista de definição. Some sem números. */
export function IndexMetrics({ metrics }: { metrics: Array<{ value: string; label: string }> }) {
  if (!metrics.length) return null;
  return (
    <dl className="ix-met">
      {metrics.map((m) => (
        <div key={`${m.value}-${m.label}`}>
          <dt className="ix-sr">{m.label}</dt>
          <dd className="ix-met-v">{m.value}</dd>
          <dd className="ix-met-l" aria-hidden="true">{m.label}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---- seção rotulada ----------------------------------------------------------------------

interface IndexSectionProps {
  /** Rótulo em caixa alta na coluna da esquerda. */
  label: ReactNode;
  /** `h2` (padrão) faz do rótulo o título da seção; `div` para rótulos decorativos. */
  labelAs?: "h2" | "div";
  /** Conteúdo extra abaixo do rótulo (contagem, dica). */
  aside?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Linha do catálogo: rótulo à esquerda (~180px), conteúdo à direita, linha fina embaixo. */
export function IndexSection({ label, labelAs = "h2", aside, id, className, children }: IndexSectionProps) {
  const Label = labelAs;
  return (
    <section id={id} className={["ix-s", className].filter(Boolean).join(" ")}>
      <div className="ix-lab-col">
        <Label className="ix-lab">{label}</Label>
        {aside && <div className="ix-aside">{aside}</div>}
      </div>
      <div className="ix-body">{children}</div>
    </section>
  );
}

// ---- índice em tabela com pré-visualização -----------------------------------------------

export interface IndexColumn<T> {
  key: string;
  header: ReactNode;
  /** Rótulo do campo no cartão (celular). Padrão: o próprio cabeçalho, se for texto. */
  cardLabel?: string;
  cell: (row: T, index: number) => ReactNode;
  /** A coluna do título: recebe o link da linha e vira o destaque do cartão no celular. */
  title?: boolean;
  /** Coluna da ação (alinhada à direita). */
  action?: boolean;
  muted?: boolean;
  width?: string;
  sort?: { direction: "asc" | "desc" | null; onToggle: () => void };
}

export interface IndexRowLink {
  href: string;
  external?: boolean;
}

interface IndexTableSectionProps<T> {
  label: ReactNode;
  aside?: ReactNode;
  id?: string;
  /** Legenda da tabela, lida por leitores de tela. */
  caption: string;
  rows: T[];
  columns: IndexColumn<T>[];
  getKey: (row: T) => string;
  getLink: (row: T) => IndexRowLink | null;
  getPreview: (row: T) => { image?: string; caption: string } | null;
  /** Conteúdo depois da tabela (ex.: "ver todos"). */
  footer?: ReactNode;
  empty?: ReactNode;
}

const PREVIEW_GAP = 12;

/**
 * Seção com um índice em tabela. No hover ou no foco do teclado a linha inverte as cores e a
 * imagem aparece na coluna do rótulo, na altura da linha — nunca por cima da tabela ou do
 * rótulo. No celular a tabela vira cartões e a pré-visualização some.
 */
export function IndexTableSection<T>({
  label,
  aside,
  id,
  caption,
  rows,
  columns,
  getKey,
  getLink,
  getPreview,
  footer,
  empty,
}: IndexTableSectionProps<T>) {
  const [, navigate] = useLocation();
  const [active, setActive] = useState<string | null>(null);
  const [top, setTop] = useState(0);
  const colRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const activeRow = active ? rows.find((r) => getKey(r) === active) : undefined;
  const preview = activeRow ? getPreview(activeRow) : null;
  const sortable = columns.some((c) => c.sort);

  // Posiciona a imagem na altura da linha ativa, entre o fim do rótulo e o fim da seção.
  const place = useCallback(() => {
    const col = colRef.current;
    const row = active ? rowRefs.current.get(active) : undefined;
    const prev = previewRef.current;
    if (!col || !row || !prev) return;
    const colBox = col.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const h = prev.offsetHeight;
    const min = (labelRef.current?.offsetHeight ?? 0) + PREVIEW_GAP;
    const max = Math.max(min, col.offsetHeight - h);
    const centered = rowBox.top - colBox.top + rowBox.height / 2 - h / 2;
    setTop(Math.min(max, Math.max(min, centered)));
  }, [active]);

  useLayoutEffect(() => {
    place();
  }, [place, preview?.image]);

  const onRowClick = (row: T) => (e: React.MouseEvent<HTMLTableRowElement>) => {
    const link = getLink(row);
    if (!link) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    if (link.external) window.open(link.href, "_blank", "noopener,noreferrer");
    else navigate(link.href);
  };

  return (
    <section id={id} className="ix-s ix-s--index">
      <div className="ix-lab-col" ref={colRef}>
        <div ref={labelRef}>
          <h2 className="ix-lab">{label}</h2>
          {aside && <div className="ix-aside">{aside}</div>}
        </div>
        <div
          ref={previewRef}
          className="ix-prev"
          data-show={preview ? "" : undefined}
          style={{ top }}
          aria-hidden="true"
        >
          {preview?.image ? (
            <img src={preview.image} alt="" loading="lazy" onLoad={place} />
          ) : (
            <span className="ix-prev-ph">{preview?.caption.slice(0, 1) ?? ""}</span>
          )}
          {preview && <span className="ix-prev-cap">{preview.caption}</span>}
        </div>
      </div>
      <div className="ix-body ix-body--index">
        {rows.length === 0 ? (
          empty ?? null
        ) : (
          <table className={sortable ? "ix-t ix-t--sortable" : "ix-t"} onMouseLeave={() => setActive(null)}>
            <caption className="ix-sr">{caption}</caption>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    style={c.width ? { width: c.width } : undefined}
                    className={c.action ? "ix-th-action" : undefined}
                    data-sortable={c.sort ? "" : undefined}
                    aria-sort={c.sort ? (c.sort.direction === "asc" ? "ascending" : c.sort.direction === "desc" ? "descending" : "none") : undefined}
                  >
                    {c.sort ? (
                      <button type="button" className="ix-sort" onClick={c.sort.onToggle} data-on={c.sort.direction ? "" : undefined}>
                        {c.header}
                        <span aria-hidden="true" className="ix-sort-arrow">
                          {c.sort.direction === "asc" ? "↑" : c.sort.direction === "desc" ? "↓" : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const key = getKey(row);
                const link = getLink(row);
                return (
                  <tr
                    key={key}
                    ref={(el) => {
                      if (el) rowRefs.current.set(key, el);
                      else rowRefs.current.delete(key);
                    }}
                    data-active={active === key ? "" : undefined}
                    data-link={link ? "" : undefined}
                    onMouseEnter={() => setActive(key)}
                    onFocus={() => setActive(key)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null);
                    }}
                    onClick={onRowClick(row)}
                  >
                    {columns.map((c) => {
                      const content = c.cell(row, i);
                      const cardLabel = c.cardLabel ?? (typeof c.header === "string" ? c.header : undefined);
                      return (
                        <td
                          key={c.key}
                          data-label={cardLabel}
                          data-title={c.title ? "" : undefined}
                          data-action={c.action ? "" : undefined}
                          className={c.muted ? "ix-muted" : undefined}
                        >
                          {c.title && link ? <RowLink link={link}>{content}</RowLink> : content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {footer}
      </div>
    </section>
  );
}

function RowLink({ link, children }: { link: IndexRowLink; children: ReactNode }) {
  const copy = useIndexCopy();
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="ix-row-link">
        {children}
        <span className="ix-sr"> {copy.opensNewTab}</span>
      </a>
    );
  }
  return (
    <Link href={link.href} className="ix-row-link">
      {children}
    </Link>
  );
}

// ---- folha de estilo do layout ------------------------------------------------------------

/**
 * Estilos do Índice. Ficam numa folha só (renderizada pelo Layout) porque hover, foco,
 * media queries e `prefers-reduced-motion` não cabem em estilo inline.
 */
export const INDEX_CSS = `
.ix {
  --index-gutter: 40px;
  --index-label: 180px;
  --index-invert-muted: color-mix(in srgb, var(--bg) 78%, var(--text));
  --index-shadow: color-mix(in srgb, var(--text) 24%, transparent);
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
}
.ix-wrap { max-width: 1320px; margin: 0 auto; padding: 0 var(--index-gutter); }
.ix main:focus { outline: none; }
.ix-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ix :focus-visible { outline: 2px solid var(--text); outline-offset: 3px; }
.ix-skip { position: absolute; left: 16px; top: -60px; z-index: 60; background: var(--text); color: var(--bg); padding: 8px 12px; font-size: 13px; }
.ix-skip:focus { top: 12px; }

/* cabeçalho fixo em 3 colunas */
.ix-h { position: sticky; top: 0; z-index: 40; background: var(--bg); border-bottom: 1px solid var(--text); }
.ix-h-in {
  display: grid;
  grid-template-columns: var(--index-label) minmax(0, 1fr) minmax(0, auto) auto;
  grid-template-areas: "name role nav tools";
  gap: 4px 24px;
  align-items: start;
  padding-top: 22px;
  padding-bottom: 14px;
}
.ix-h-name { grid-area: name; font-weight: 600; color: var(--text); text-decoration: none; }
.ix-h-role { grid-area: role; margin: 0; color: var(--text-muted); line-height: 1.35; }
.ix-h-nav { grid-area: nav; }
.ix-h-nav ul { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 16px; margin: 0; padding: 0; list-style: none; }
.ix-h-nav a { color: var(--text); text-decoration: none; }
.ix-h-nav a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px; }
.ix-h-nav a[aria-current="page"] { text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--primary); text-decoration-thickness: 2px; }
.ix-h-tools { grid-area: tools; display: flex; align-items: center; gap: 14px; padding-top: 2px; }
.ix-h-menu { display: none; background: none; border: 0; padding: 0; color: var(--text); font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--primary); text-decoration-thickness: 2px; }

/* seções rotuladas */
.ix-s {
  position: relative;
  display: grid;
  grid-template-columns: var(--index-label) minmax(0, 1fr);
  gap: 24px;
  padding: 36px 0;
  border-bottom: 1px solid var(--line);
  scroll-margin-top: 96px;
}
.ix-s:last-child { border-bottom: 0; }
.ix-lab-col { position: relative; min-width: 0; }
.ix-lab { margin: 0; padding-top: 5px; font-size: 11px; font-weight: 500; line-height: 1.4; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
.ix-aside { margin-top: 10px; font-size: 12.5px; color: var(--text-muted); line-height: 1.45; }
.ix-body { min-width: 0; }
.ix-body--index { min-height: 150px; }
.ix-av { display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; letter-spacing: 0; text-transform: none; color: var(--text); }
.ix-av i { flex: none; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--primary); }
.ix-code { font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; }

/* tipografia */
.ix-lede { margin: 0; font-size: clamp(34px, 4.2vw, 58px); font-weight: 500; line-height: 1.04; letter-spacing: -.02em; text-wrap: balance; color: var(--text-strong, var(--text)); max-width: 22ch; }
.ix-lede--cta { font-size: clamp(28px, 3vw, 40px); max-width: 26ch; }
.ix-title { margin: 0; font-size: 28px; font-weight: 500; line-height: 1.15; letter-spacing: -.01em; color: var(--text-strong, var(--text)); }
.ix-desc { margin: 14px 0 0; font-size: 16px; color: var(--text-muted); max-width: 600px; }
.ix-links { margin: 18px 0 0; display: flex; flex-wrap: wrap; gap: 10px 22px; font-size: 14px; }
.ix-links--big { font-size: 18px; }
.ix-u { color: var(--text); background: none; border: 0; padding: 0; font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--primary); text-decoration-thickness: 2px; }
.ix-u:hover { text-decoration-color: currentColor; }
.ix-hl { font-weight: 600; color: var(--text-strong, var(--text)); }
.ix-muted { color: var(--text-muted); }
.ix-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--text); background: transparent; color: var(--text); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; }
.ix-btn:hover:not(:disabled) { background: var(--text); color: var(--bg); }
.ix-btn:disabled { opacity: .5; cursor: not-allowed; }
.ix-rich { color: var(--text-muted); font-size: 14px; }
.ix-rich ul, .ix-rich ol { margin: 0; padding-left: 1.2em; list-style: disc; }
.ix-rich ol { list-style: decimal; }
.ix-rich li { margin: 4px 0; padding-left: 2px; }
.ix-rich p { margin: 0 0 8px; }
.ix-rich strong { color: var(--text); }

/* números */
.ix-met { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; margin: 0; }
.ix-met > div { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ix-met dd { margin: 0; }
.ix-met-v { font-size: 40px; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -.02em; color: var(--text-strong, var(--text)); overflow-wrap: anywhere; }
.ix-met-l { font-size: 12.5px; color: var(--text-muted); max-width: 170px; }

/* índice em tabela */
.ix-t { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.ix-t th { padding: 0 8px 8px; text-align: left; font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); white-space: nowrap; }
.ix-t td { padding: 11px 8px; border-top: 1px solid var(--line); vertical-align: baseline; }
.ix-t tbody tr:last-child td { border-bottom: 1px solid var(--line); }
.ix-t tr[data-link] { cursor: pointer; }
.ix-t tbody tr[data-active], .ix-t tbody tr:hover, .ix-t tbody tr:focus-within { background: var(--text); color: var(--bg); }
.ix-t tbody tr[data-active] .ix-muted, .ix-t tbody tr:hover .ix-muted, .ix-t tbody tr:focus-within .ix-muted { color: var(--index-invert-muted); }
.ix-t tbody tr[data-active] :focus-visible, .ix-t tbody tr:focus-within :focus-visible { outline-color: var(--bg); }
.ix-t tbody tr[data-active] .ix-u, .ix-t tbody tr:hover .ix-u, .ix-t tbody tr:focus-within .ix-u { color: var(--bg); text-decoration-color: currentColor; }
.ix-t td[data-title] { font-weight: 500; }
.ix-t td[data-action], .ix-t .ix-th-action { text-align: right; white-space: nowrap; }
.ix-t .ix-num { font-family: var(--font-mono); font-size: 12px; }
.ix-row-link { color: inherit; text-decoration: none; }
.ix-row-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.ix-sort { display: inline-flex; gap: 6px; align-items: baseline; background: none; border: 0; padding: 0; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; }
.ix-sort[data-on] { color: var(--text); }
.ix-sort-arrow { font-family: var(--font-mono); letter-spacing: 0; }
.ix-more { margin: 16px 0 0; }

/* pré-visualização na coluna do rótulo */
.ix-prev {
  position: absolute;
  left: 0;
  width: min(168px, 100%);
  aspect-ratio: 16 / 11;
  overflow: hidden;
  background: var(--subtle);
  box-shadow: 0 14px 30px var(--index-shadow);
  transform: rotate(-1.5deg) translateY(4px);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
}
.ix-prev[data-show] { opacity: 1; transform: rotate(-1.5deg); }
.ix-prev img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ix-prev-ph { display: flex; align-items: center; justify-content: center; height: 100%; padding-bottom: 26px; font-size: 44px; font-weight: 500; color: var(--text-muted); }
.ix-prev-cap { position: absolute; left: 0; right: 0; bottom: 0; height: 26px; display: flex; align-items: center; padding: 0 10px; background: var(--surface); color: var(--text); font-family: var(--font-mono); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (prefers-reduced-motion: no-preference) {
  .ix-prev { transition: opacity .18s ease, top .2s ease, transform .2s ease; }
  .ix-t tbody tr { transition: background-color .12s ease, color .12s ease; }
}

/* listas de definição, linhas de serviço, depoimentos */
.ix-sv { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 20px; padding: 12px 0; border-top: 1px solid var(--line); }
.ix-sv:first-child { border-top: 0; padding-top: 0; }
.ix-sv h3, .ix-sv dt { margin: 0; font-size: 17px; font-weight: 500; }
.ix-sv p, .ix-sv dd { margin: 0; color: var(--text-muted); font-size: 15px; }
.ix-cols { columns: 2; column-gap: 32px; font-size: 17px; line-height: 1.55; }
.ix-cols p { margin: 0 0 12px; }
.ix-tq { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin: 0; }
.ix-tq figure { margin: 0; }
.ix-tq blockquote { margin: 0; font-size: 15.5px; line-height: 1.45; }
.ix-tq figcaption { margin-top: 10px; display: flex; flex-direction: column; font-size: 12.5px; }
.ix-tq figcaption b { font-weight: 600; }
.ix-tq figcaption span { color: var(--text-muted); }
.ix-inline { display: flex; flex-wrap: wrap; margin: 0; padding: 0; list-style: none; }
.ix-inline li:not(:last-child)::after { content: "·"; margin: 0 8px; color: var(--text-muted); }

/* currículo: fichas que expandem */
.ix-xp { margin: 0; padding: 0; list-style: none; border-bottom: 1px solid var(--line); }
.ix-xp-grid { display: grid; grid-template-columns: 130px minmax(0, 1.1fr) minmax(0, .9fr) minmax(0, 1.6fr) 20px; gap: 16px; align-items: baseline; }
.ix-xp-head { padding: 0 8px 8px; font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
.ix-xp-row { width: 100%; padding: 12px 8px; border: 0; border-top: 1px solid var(--line); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.ix-xp-row:hover { background: var(--text); color: var(--bg); }
.ix-xp-row:hover .ix-muted { color: var(--index-invert-muted); }
.ix-xp-row:hover:focus-visible { outline-color: var(--bg); outline-offset: -4px; }
.ix-xp-row[aria-expanded="true"]:not(:hover) { background: var(--subtle); }
.ix-xp-role { font-weight: 500; }
.ix-xp-sum { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ix-xp-sign { font-family: var(--font-mono); text-align: right; }
.ix-xp-panel { padding: 4px 8px 18px calc(130px + 24px); }
.ix-xp-static { padding: 12px 8px; border-top: 1px solid var(--line); }

/* sobre e blog */
.ix-pr { margin: 0; padding: 0; list-style: none; }
.ix-pr li { display: grid; grid-template-columns: 48px 240px minmax(0, 1fr); gap: 16px; padding: 14px 0; border-top: 1px solid var(--line); }
.ix-pr li:first-child { border-top: 0; padding-top: 0; }
.ix-pr h3 { margin: 0; font-size: 17px; font-weight: 500; }
.ix-pr p { margin: 0; color: var(--text-muted); font-size: 15px; }
.ix-figs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 28px 24px; margin: 0; padding: 0; list-style: none; }
.ix-figs figure { margin: 0; }
.ix-figs img, .ix-figs .ix-fig-ph { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; background: var(--subtle); }
.ix-figs figcaption { margin-top: 10px; font-size: 13.5px; line-height: 1.45; }
.ix-figs figcaption small { display: block; margin-top: 4px; color: var(--text-muted); font-size: 12px; }
.ix-feat { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 32px; align-items: start; }
.ix-feat-meta { margin: 0 0 10px; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.ix-feat h2, .ix-feat h3 { margin: 0; font-size: 26px; font-weight: 500; line-height: 1.2; letter-spacing: -.01em; }
.ix-feat h2 a, .ix-feat h3 a { color: var(--text); text-decoration: none; }
.ix-feat h2 a:hover, .ix-feat h3 a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--primary); text-decoration-thickness: 2px; }
.ix-feat-img { margin: 0; }
.ix-feat-img img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; background: var(--subtle); }
.ix-filter { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0; padding: 0; list-style: none; padding-top: 3px; }
.ix-filter button { background: none; border: 0; padding: 0; color: var(--text-muted); font: inherit; cursor: pointer; }
.ix-filter button:hover { color: var(--text); }
.ix-filter button[aria-pressed="true"] { color: var(--text); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--primary); text-decoration-thickness: 2px; }
.ix-filter sup { margin-left: 2px; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }

/* rodapé */
.ix-f { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 24px; padding-top: 18px; padding-bottom: 26px; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--text); }
.ix-f a { color: inherit; }

/* tablet: a tabela vira cartões e a pré-visualização some */
@media (max-width: 899px) {
  .ix-prev { display: none; }
  .ix-body--index { min-height: 0; }
  .ix-t, .ix-t tbody, .ix-t tr, .ix-t td, .ix-t caption { display: block; width: auto; }
  .ix-t thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .ix-t--sortable thead { position: static; width: auto; height: auto; overflow: visible; clip: auto; display: block; }
  .ix-t--sortable thead tr { display: flex; flex-wrap: wrap; gap: 4px 18px; }
  .ix-t--sortable thead th { display: none; padding: 0 0 10px; }
  .ix-t--sortable thead th[data-sortable] { display: block; width: auto !important; }
  .ix-t tbody tr { padding: 12px 8px; border-top: 1px solid var(--line); }
  .ix-t tbody tr:last-child { border-bottom: 1px solid var(--line); }
  .ix-t td, .ix-t tbody tr:last-child td { border: 0; padding: 2px 0; display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 12px; text-align: left; white-space: normal; }
  .ix-t td::before { content: attr(data-label); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); padding-top: 2px; }
  .ix-t tbody tr[data-active] td::before, .ix-t tbody tr:hover td::before, .ix-t tbody tr:focus-within td::before { color: var(--index-invert-muted); }
  .ix-t tbody tr td[data-title] { display: block; font-size: 16px; margin-bottom: 4px; }
  .ix-t td[data-title]::before, .ix-t td[data-action]::before { display: none; }
  .ix-t tbody tr td[data-action] { display: block; margin-top: 8px; text-align: left; }
  .ix-t td:empty, .ix-t td[data-empty] { display: none; }
  .ix-xp-head { display: none; }
  .ix-xp-grid { grid-template-columns: minmax(0, 1fr) 20px; gap: 2px 12px; }
  .ix-xp-grid > * { grid-column: 1; }
  .ix-xp-grid > .ix-xp-sign { grid-column: 2; grid-row: 1; }
  .ix-xp-sum { white-space: normal; }
  .ix-xp-panel { padding: 4px 8px 18px; }
  .ix-feat { grid-template-columns: minmax(0, 1fr); gap: 20px; }
  .ix-feat-img { order: -1; }
  .ix-tq { grid-template-columns: minmax(0, 1fr); }
}

/* celular: rótulo sobe para cima do conteúdo */
@media (max-width: 759px) {
  .ix { --index-gutter: 16px; }
  .ix-h-in { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name tools" "role role" "nav nav"; padding-top: 14px; padding-bottom: 10px; }
  .ix-h-role { font-size: 12.5px; }
  .ix-h-menu { display: inline-block; }
  .ix-h-nav { display: none; }
  .ix-h-nav[data-open] { display: block; padding-top: 8px; }
  .ix-h-nav ul { flex-direction: column; justify-content: flex-start; gap: 0; }
  .ix-h-nav li a { display: block; padding: 10px 0; border-top: 1px solid var(--line); font-size: 16px; }
  .ix-s { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 28px 0; scroll-margin-top: 110px; }
  .ix-lab { padding-top: 0; }
  .ix-met { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 16px; }
  .ix-met-v { font-size: 32px; }
  .ix-sv, .ix-pr li { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .ix-pr li { grid-template-columns: 36px minmax(0, 1fr); }
  .ix-pr li > p { grid-column: 2; }
  .ix-cols { columns: 1; font-size: 16px; }
  .ix-desc { font-size: 15px; }
  .ix-figs { grid-template-columns: minmax(0, 1fr); }
  .ix-title { font-size: 24px; }
}
`;

/** Folha de estilo do layout. Renderizada uma vez, pelo Layout. */
export function IndexStyles() {
  return <style>{INDEX_CSS}</style>;
}
