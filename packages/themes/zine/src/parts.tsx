/**
 * Peças da colagem do tema Zine: seção, título à mão, fita, polaroide, post-it, adesivo,
 * ingresso, carta e cupom. Tudo é React puro (só props, sem estado nem efeitos).
 *
 * Regra de ouro (herdada da v1): fita, adesivos, manchas e rotações nunca cobrem texto.
 * O que é absoluto (fita, manchas, adesivo de disponibilidade) fica só sobre áreas de
 * respiro ou de imagem; o resto é grid/flex no fluxo normal. No celular as rotações caem
 * para ~35% (`--zn-tilt`) e as manchas encolhem.
 */
import type { CSSProperties, ReactNode } from "react";
import type { RenderContext, ResolvedImage, ResolvedLink } from "@rubrica/core";
import { Img } from "@rubrica/core/components";

/** Inclinação de um elemento, multiplicada por `--zn-tilt` (menor no celular). */
export function tilt(deg: number, extra?: CSSProperties): CSSProperties {
  return { ["--zn-r" as string]: `${deg}deg`, ...extra } as CSSProperties;
}

/** Rotações "à mão" que se repetem pela lista. */
const TILTS = [-2, 1.5, -1, 2.2, -1.6, 1];
export const tiltAt = (i: number, scale = 1) => TILTS[i % TILTS.length]! * scale;

export type PaperTone = "tape" | "paper" | "primary" | "subtle" | "accent" | "ink";

export const STICKER_TONES: PaperTone[] = ["primary", "ink", "tape", "paper"];
export const POSTIT_TONES: PaperTone[] = ["tape", "paper", "primary", "subtle"];

/** Texto sem tags HTML. */
export const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

// ---- seção e títulos ----------------------------------------------------------------------

interface SectionProps {
  /** Tipo do bloco (vira `data-block` e a classe `rb-<tipo>`). */
  type: string;
  id: string;
  anchor?: string;
  variant: string;
  className?: string;
  children: ReactNode;
}

/** Seção do site: faixa com respiro e a coluna central do zine. */
export function ZSection({ type, id, anchor, variant, className, children }: SectionProps) {
  return (
    <section id={anchor || `b-${id}`} className={`rb-section rb-${type} zn-sec${className ? ` ${className}` : ""}`} data-block={type} data-variant={variant}>
      <div className="zn-wrap">{children}</div>
    </section>
  );
}

/** Título de seção em letra à mão, com marca-texto. `level` 1 vira o título grande da página. */
export function HandTitle({ level, children, deg = -2, className, id }: { level: 1 | 2 | 3; children: ReactNode; deg?: number; className?: string; id?: string }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return (
    <Tag id={id} className={`zn-hand-title zn-tilt${level === 1 ? " zn-hand-title--page" : ""}${className ? ` ${className}` : ""}`} style={tilt(deg)}>
      <span>{children}</span>
    </Tag>
  );
}

/** Cabeçalho de seção: título à mão e a chamada em fonte mono. Some sem título e sem chamada. */
export function ZHead({ title, intro, level, deg = -2 }: { title?: string; intro?: string; level: 1 | 2; deg?: number }) {
  if (!title && !intro) return null;
  return (
    <header className="zn-head">
      {title && (
        <HandTitle level={level} deg={deg}>
          {title}
        </HandTitle>
      )}
      {intro && <p className="zn-lead">{intro}</p>}
    </header>
  );
}

// ---- materiais -----------------------------------------------------------------------------

/** Pedaço de fita adesiva. Fica sobre a borda/respiro do papel, nunca sobre texto. */
export function Tape({ pos = "center" }: { pos?: "center" | "left" | "right" }) {
  return <span className="zn-tape" data-pos={pos} aria-hidden="true" />;
}

/** Carimbo de borracha: etiqueta torta com borda pontilhada. */
export function Stamp({ children, deg = -3 }: { children: ReactNode; deg?: number }) {
  return (
    <span className="zn-stamp zn-tilt" style={tilt(deg)}>
      {children}
    </span>
  );
}

/** Polaroide: foto em cima, legenda embaixo. A fita fica na margem de cima. */
export function Polaroid({
  image,
  deg = 0,
  tape = "center",
  halftone = false,
  children,
  className,
  as: Tag = "article",
  sizes = "(min-width: 900px) 30vw, 100vw",
  ratio,
}: {
  image?: ResolvedImage;
  deg?: number;
  tape?: "center" | "left" | "right" | null;
  halftone?: boolean;
  children?: ReactNode;
  className?: string;
  as?: "article" | "div" | "li" | "figure";
  sizes?: string;
  ratio?: string;
}) {
  return (
    <Tag className={`zn-pol zn-tilt zn-lift${className ? ` ${className}` : ""}`} style={tilt(deg)}>
      {tape && <Tape pos={tape} />}
      <div className={`zn-pol-img${image ? "" : " is-empty"}${halftone ? " zn-halftone" : ""}`} style={ratio ? ({ aspectRatio: ratio } as CSSProperties) : undefined}>
        {image ? <Img image={image} sizes={sizes} /> : null}
      </div>
      {children && <div className="zn-pol-body">{children}</div>}
    </Tag>
  );
}

/** Post-it (ou papel solto). O tom define fundo e cor do texto, sempre em par do esquema. */
export function PostIt({ tone = "tape", deg = 0, children, className, as: Tag = "div" }: { tone?: PaperTone; deg?: number; children: ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  return (
    <Tag className={`zn-postit zn-tilt${className ? ` ${className}` : ""}`} data-tone={tone} style={tilt(deg)}>
      {children}
    </Tag>
  );
}

/** Adesivo redondo (números, disponibilidade, princípios). Cresce com o texto. */
export function Sticker({
  tone = "primary",
  deg = 0,
  size,
  children,
  className,
  as: Tag = "div",
}: {
  tone?: PaperTone;
  deg?: number;
  size?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "span";
}) {
  const style = tilt(deg, size ? ({ ["--zn-size" as string]: `${size}px` } as CSSProperties) : undefined);
  return (
    <Tag className={`zn-sticker zn-tilt${className ? ` ${className}` : ""}`} data-tone={tone} style={style}>
      {children}
    </Tag>
  );
}

/** Tamanho do número no adesivo conforme o comprimento, para nunca vazar do círculo. */
export function stickerValueSize(value: string): number {
  if (value.length <= 4) return 40;
  if (value.length <= 6) return 32;
  if (value.length <= 9) return 25;
  return 20;
}

/** Ingresso recortado: miolo com picotes laterais e canhoto. */
export function TicketFace({ tone = "paper", stub, children }: { tone?: "primary" | "paper"; stub?: ReactNode; children: ReactNode }) {
  return (
    <span className="zn-ticket-face" data-tone={tone}>
      {stub !== undefined && (
        <span className="zn-ticket-stub" aria-hidden="true">
          {stub}
        </span>
      )}
      <span className="zn-ticket-label">{children}</span>
    </span>
  );
}

const external = (link: Pick<ResolvedLink, "external">) => (link.external ? { target: "_blank", rel: "noopener noreferrer" } : {});

/** Seta decorativa: ↓ para âncora da página, ↗ para externo, → para o resto. */
export function arrowFor(link: Pick<ResolvedLink, "href" | "external">): string {
  if (link.external) return "↗";
  return link.href.startsWith("#") ? "↓" : "→";
}

/** Link no formato de ingresso (botão do zine). */
export function TicketLink({ link, ctx, tone = "primary", stub, deg = -2 }: { link: ResolvedLink; ctx: RenderContext; tone?: "primary" | "paper"; stub?: ReactNode; deg?: number }) {
  return (
    <a href={link.href} className="zn-ticket zn-tilt" style={tilt(deg)} {...external(link)}>
      <TicketFace tone={tone} stub={stub}>
        {link.label} <span aria-hidden="true">{arrowFor(link)}</span>
        {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
      </TicketFace>
    </a>
  );
}

/** Link sublinhado em letra à mão. `hint` vira texto só para leitor de tela. */
export function HandLink({ link, ctx, hint, className }: { link: ResolvedLink; ctx: RenderContext; hint?: string; className?: string }) {
  return (
    <a href={link.href} className={`zn-handlink${className ? ` ${className}` : ""}`} {...external(link)}>
      {link.label} <span aria-hidden="true">{arrowFor(link)}</span>
      {hint && <span className="rb-sr-only">: {hint}</span>}
      {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
    </a>
  );
}

/** Carta datilografada em papel pautado com margem colorida. */
export function Letter({ children, deg = 0.6, className }: { children: ReactNode; deg?: number; className?: string }) {
  return (
    <div className={`zn-letter zn-tilt${className ? ` ${className}` : ""}`} style={tilt(deg)}>
      {children}
    </div>
  );
}

/** Tesoura do cupom (decorativa). */
export function Scissors() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.1 15.9" />
      <path d="M14.5 14.5 20 20" />
      <path d="M8.1 8.1 12 12" />
    </svg>
  );
}

/** Caixa de seleção do cupom: vazia e marcada (a marcada surge no hover e no foco). */
export function CheckBoxes() {
  return (
    <>
      <svg className="off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
      <svg className="on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m8 12.5 3 3 5-6" />
      </svg>
    </>
  );
}
