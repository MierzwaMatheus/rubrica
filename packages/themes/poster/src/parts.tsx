/**
 * Peças compartilhadas do Pôster: a seção (rótulo em mono ou cabeçalho gigante), a linha
 * de cartaz, a faixa rolante, a declaração com marca-texto e o selo. Tudo é React puro:
 * só props, sem estado nem efeitos (a pausa da faixa e o filtro usam `checkbox`/`radio` + CSS).
 */
import type { CSSProperties, ReactNode } from "react";
import type { RenderContext, ResolvedLink } from "@rubrica/core";
import { Heading, Html } from "@rubrica/core/components";
import { K_CAPS, fit, markStatement, pad2 } from "./util";

interface PosterSectionProps {
  /** Tipo do bloco (vira `data-block` e a classe `rb-<tipo>`). */
  type: string;
  id: string;
  anchor?: string;
  variant: string;
  title?: string;
  intro?: string;
  /** Nível do título (`headingLevel` do bloco). */
  level?: 1 | 2;
  /** Posição do bloco na página: o primeiro (que não é hero) abre a página com título gigante. */
  index?: number;
  /** Rótulo mono de apoio acima do título gigante (ex.: contagem). */
  kicker?: ReactNode;
  /** Link ou ação alinhada à direita do rótulo. */
  action?: ReactNode;
  /** Rótulo quando o bloco não tem título (ex.: "Em números"). */
  fallbackLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Seção de largura total, com o fio grosso embaixo. No primeiro bloco da página o título
 * vira o cabeçalho gigante (como as páginas internas da v1); nos demais, um rótulo em mono.
 */
export function PosterSection({ type, id, anchor, variant, title, intro, level = 2, index = 1, kicker, action, fallbackLabel, className, children }: PosterSectionProps) {
  const opening = index === 0 && !!title;
  const label = title || fallbackLabel;
  return (
    <section id={anchor || `b-${id}`} className={`rb-section rb-${type} poster-sec${opening ? " poster-sec--open" : ""}${className ? ` ${className}` : ""}`} data-block={type} data-variant={variant}>
      <div className="poster-wrap">
        {opening ? (
          <header className="poster-head">
            <div className="poster-head-grid">
              <div className="poster-fit">
                {kicker && <span className="poster-head-kicker">{kicker}</span>}
                <Heading level={level} className="poster-h">
                  <span style={fit(title!, 200, K_CAPS)} className="poster-giant poster-up poster-head-title">
                    {title}
                  </span>
                </Heading>
              </div>
              {(intro || action) && (
                <div className="poster-head-aside">
                  {intro && <p>{intro}</p>}
                  {action}
                </div>
              )}
            </div>
          </header>
        ) : (
          <>
            {label && (
              <div className="poster-lab">
                <Heading level={level}>{label}</Heading>
                {action}
              </div>
            )}
            {intro && <p className="poster-intro">{intro}</p>}
          </>
        )}
        {children}
      </div>
    </section>
  );
}

/** Link de texto sublinhado para o rótulo da seção ("Ver todos →"). */
export function LabelLink({ link }: { link: ResolvedLink }) {
  return (
    <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label} <span aria-hidden="true">{link.external ? "↗" : "→"}</span>
    </a>
  );
}

/** Botão em bloco com a borda grossa. `pri` inverte as cores. */
export function PosterButton({ link, pri, ctx }: { link: ResolvedLink; pri?: boolean; ctx: RenderContext }) {
  return (
    <a href={link.href} className={`poster-btn${pri ? " poster-btn--pri" : ""}`} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
      <span aria-hidden="true">{link.href.startsWith("#") ? "↓" : link.external ? "↗" : "→"}</span>
      {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
    </a>
  );
}

/** Selo redondo e inclinado (disponibilidade). Fica em área própria, nunca sobre texto. */
export function Seal({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <p className={`poster-seal${label.length > 34 ? " poster-seal--long" : ""}`} style={style}>
      <span>
        <span className="poster-seal-dot" aria-hidden="true" />
        {label}
      </span>
    </p>
  );
}

export interface RowProps {
  /** Identificador único da linha na página (o link se nomeia pelo título). */
  uid: string;
  index: number;
  title: string;
  /** Tamanho máximo do título em px. */
  max?: number;
  description?: string;
  tag?: string;
  meta?: ReactNode;
  action?: string;
  href: string;
  tags?: string;
  headingLevel?: 2 | 3;
}

/**
 * Uma linha de cartaz: número em contorno, nome gigante, metadados à direita. A linha
 * inteira é o link (nomeado pelo título) e, no hover/foco, inverte as cores.
 */
export function PosterRow({ uid, index, title, max = 76, description, tag, meta, action, href, tags, headingLevel = 3 }: RowProps) {
  const titleId = `${uid}-t`;
  return (
    <li data-tags={tags}>
      <a href={href} className="poster-row" aria-labelledby={titleId}>
        <span className="poster-row-i poster-outline" aria-hidden="true">
          {pad2(index)}
        </span>
        <div className="poster-fit">
          <Heading level={headingLevel} id={titleId} className="poster-h">
            <span className="poster-giant poster-up poster-row-title" style={fit(title, max, K_CAPS)}>
              {title}
            </span>
          </Heading>
          {description && <p className="poster-row-desc">{description}</p>}
        </div>
        <div className="poster-row-meta">
          {tag && <span className="poster-row-tag">{tag}</span>}
          {meta}
          {action && (
            <span className="poster-row-go" aria-hidden="true">
              {action} →
            </span>
          )}
        </div>
      </a>
    </li>
  );
}

/** Declaração grande com marca-texto. Texto com tags (HTML) entra sem marcação. */
export function Statement({ lead, size = "l" }: { lead: { text: string; plain: boolean }; size?: "l" | "m" }) {
  const cls = `poster-stmt${size === "m" ? " poster-stmt--m" : ""}`;
  if (!lead.plain) return <Html as="p" html={lead.text} className={cls} />;
  return (
    <p className={cls}>
      {markStatement(lead.text).map((s, i) => (s.mark ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </p>
  );
}

/**
 * Faixa rolante com nomes. A primeira cópia é lida pelo leitor de tela; as repetições (só
 * para o laço visual) ficam escondidas dele. Pausa no hover/foco e pela caixa de seleção
 * (sem JavaScript). Com movimento reduzido vira uma lista parada que quebra linha.
 */
export function Ticker({ id, items, label, pauseLabel }: { id: string; items: string[]; label: string; pauseLabel: string }) {
  if (!items.length) return null;
  // Repete a lista até a faixa ser mais larga que a tela, para o laço não mostrar buraco.
  const reps = Math.max(1, Math.ceil(8 / items.length));
  const filled = Array.from({ length: reps }, () => items).flat();
  const group = (hidden: boolean) => (
    <ul className={`poster-marq-group${hidden ? " poster-marq-dup" : ""}`} aria-hidden={hidden || undefined}>
      {filled.map((name, i) => {
        const extra = i >= items.length;
        return (
          <li key={`${i}-${name}`} className={`poster-marq-item${extra ? " poster-marq-dup" : ""}`} aria-hidden={!hidden && extra ? true : undefined}>
            {name}
            <span className="poster-marq-star" aria-hidden="true">
              ✶
            </span>
          </li>
        );
      })}
    </ul>
  );
  const check = `marq-${id}`;
  return (
    <div className="poster-marq" role="region" aria-label={label}>
      <input type="checkbox" id={check} className="poster-marq-check rb-sr-only" aria-label={pauseLabel} />
      <div className="poster-marq-view">
        <div className="poster-marq-track">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <label htmlFor={check} className="poster-marq-pause" aria-hidden="true">
        <span className="poster-marq-ico" />
      </label>
    </div>
  );
}
