/**
 * Peças da área de trabalho: a janela (barra de título listrada, caixa de fechar
 * decorativa, sombra dura), os ícones desenhados em CSS e utilidades de texto.
 *
 * Regra de ouro da v1: nenhuma janela cobre texto. As janelas ficam numa coluna,
 * desencontradas só na horizontal (pelo CSS, conforme a posição), e nunca se sobrepõem.
 */
import type { CSSProperties, ReactNode } from "react";
import type { RenderContext, ResolvedLink } from "@rubrica/core";

/** Identificador seguro para `id` e seletores. */
export function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** "3 itens" no idioma (singular e plural pelas chaves do tema). */
export function items(ctx: RenderContext, count: number): string {
  return ctx.t(count === 1 ? "desktop.items.one" : "desktop.items.other", { count });
}

/** Corta um texto longo no limite, sem partir palavra, com reticências. */
export function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).trimEnd()}…`;
}

/** Cores de marca em rodízio para ícones e marcadores decorativos. */
export const ICON_COLORS = ["var(--rb-accent)", "var(--rb-accent-2)", "var(--rb-accent-3)"] as const;

export function iconColor(i: number): CSSProperties {
  return { "--dk-ic": ICON_COLORS[i % ICON_COLORS.length] } as CSSProperties;
}

export type GlyphKind = "folder" | "doc" | "trash" | "mail";

/** Ícone desenhado em CSS (pasta, documento, lixeira, carta). Sempre decorativo. */
export function Glyph({ kind, color }: { kind: GlyphKind; color?: number }) {
  return <span aria-hidden="true" className={`dk-glyph dk-glyph--${kind}`} style={color === undefined ? undefined : iconColor(color)} />;
}

/** Quadradinho colorido das listas do Finder. */
export function Square({ color }: { color: number }) {
  return <span className="dk-sq" aria-hidden="true" style={iconColor(color)} />;
}

type Level = 1 | 2 | 3;

export interface WindowProps {
  /** `id` do bloco (vira `b-<id>` quando não há âncora). */
  id: string;
  anchor?: string;
  /** Tipo do bloco (`data-block`): o CSS dá a largura de cada um. */
  type: string;
  variant?: string;
  /**
   * Título de verdade da janela, na barra de título. Sem ele, a barra mostra `bar`
   * (nome de arquivo decorativo) e o título, se houver, vai no corpo.
   */
  title?: ReactNode;
  level?: Level;
  /** Texto antes do título, só visual ("Preferências do Sistema — "). */
  prefix?: string;
  /** Texto depois do título, só visual (".txt"). */
  suffix?: string;
  /** Barra de título sem título: nome de arquivo ("Leia-me.txt"). */
  bar?: string;
  /** Barra de status no rodapé da janela. */
  status?: ReactNode;
  /** Id do título que está no corpo (quando a barra só mostra `bar`). */
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** Uma janela do sistema. É uma `<section>` com a barra de título como rótulo. */
export function Window({ id, anchor, type, variant, title, level = 2, prefix, suffix, bar, status, labelledBy, className, children }: WindowProps) {
  const titleId = `${safeId(id)}-t`;
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  const hasTitle = title !== undefined && title !== null && title !== "";
  return (
    <section
      id={anchor || `b-${id}`}
      className={`dk-win${className ? ` ${className}` : ""}`}
      data-block={type}
      data-variant={variant}
      aria-labelledby={hasTitle ? titleId : labelledBy}
      aria-label={!hasTitle && !labelledBy && bar ? bar : undefined}
    >
      <div className="dk-title">
        <span className="dk-x" aria-hidden="true" />
        {hasTitle ? (
          <Tag id={titleId} className="dk-title__text">
            {prefix && <span aria-hidden="true">{prefix} — </span>}
            {title}
            {suffix && <span aria-hidden="true">{suffix}</span>}
          </Tag>
        ) : (
          <span className="dk-title__text" aria-hidden="true">
            {bar}
          </span>
        )}
      </div>
      <div className="dk-body">{children}</div>
      {status && <div className="dk-status">{status}</div>}
    </section>
  );
}

/** Janelas menores lado a lado (quebram linha quando não cabem; nunca se sobrepõem). */
export function Cluster({ children }: { children: ReactNode }) {
  return <div className="dk-cluster">{children}</div>;
}

/** Botão no estilo do sistema: `primary` é o botão padrão (com o contorno duplo). */
export function DeskButton({ link, ctx, primary }: { link: ResolvedLink; ctx: RenderContext; primary?: boolean }) {
  return (
    <a href={link.href} className={`dk-btn${primary ? " dk-btn--primary" : ""}`} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
      {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
    </a>
  );
}

/** Fila de botões (alinhada à direita nas caixas de diálogo). */
export function ButtonRow({ end, children }: { end?: boolean; children: ReactNode }) {
  return <div className={`dk-row${end ? " dk-row--end" : ""}`}>{children}</div>;
}
