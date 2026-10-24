import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { highlightNumbers } from "@/utils/homeContent";

/*
 * Zine: peças compartilhadas pelo layout (estilos, textos próprios e os "materiais" da
 * colagem: fita, polaroide, post-it, adesivo, ingresso, carta).
 *
 * Regra de ouro: fita, adesivos, manchas e rotações nunca cobrem texto. Por isso tudo é
 * montado em grid/flex no fluxo normal; o que é absoluto (fita, manchas, adesivo de
 * disponibilidade) fica só sobre áreas de respiro ou de imagem. No celular as rotações
 * caem para ~35% (variável --zine-tilt) e as manchas encolhem.
 */

// ---- textos próprios do layout ---------------------------------------------------------

const COPY = {
  "pt-BR": {
    skip: "Pular para o conteúdo",
    nav: "Navegação principal",
    hello: "oi, eu sou",
    numbers: "em números",
    cases: "coisas que fiz",
    about: "uma cartinha",
    services: "o que eu faço",
    testimonials: "o que dizem por aí",
    dear: "Pessoa querida,",
    moreAbout: "mais sobre mim",
    readCase: "ler case",
    seeProject: "ver projeto",
    featured: "destaque",
    couponNote: "recorte, marque e mande",
    couponTo: "para",
    madeBy: "feito à mão por",
    resumeKicker: "folha datilografada",
    experience: "por onde andei",
    portfolioKicker: "o mural",
    projectsCount: (n: number) => (n === 1 ? "1 projeto colado aqui" : `${n} projetos colados aqui`),
    filter: "Filtrar por categoria",
    noProjects: "Nenhum projeto nesta categoria.",
    aboutKicker: "quem escreve",
    interests: "interesses",
    blogKicker: "recortes",
    postsCount: (n: number) => (n === 1 ? "1 texto" : `${n} textos`),
    rss: "assinar o RSS",
    photoAlt: (name: string) => `Foto de ${name}`,
  },
  "en-US": {
    skip: "Skip to content",
    nav: "Main navigation",
    hello: "hi, I'm",
    numbers: "in numbers",
    cases: "things I made",
    about: "a little letter",
    services: "what I do",
    testimonials: "what people say",
    dear: "Dear reader,",
    moreAbout: "more about me",
    readCase: "read case",
    seeProject: "see project",
    featured: "featured",
    couponNote: "cut, tick and send",
    couponTo: "to",
    madeBy: "handmade by",
    resumeKicker: "typewritten sheet",
    experience: "where I've been",
    portfolioKicker: "the wall",
    projectsCount: (n: number) => (n === 1 ? "1 project pinned here" : `${n} projects pinned here`),
    filter: "Filter by category",
    noProjects: "No projects in this category.",
    aboutKicker: "who's writing",
    interests: "interests",
    blogKicker: "clippings",
    postsCount: (n: number) => (n === 1 ? "1 post" : `${n} posts`),
    rss: "subscribe via RSS",
    photoAlt: (name: string) => `Photo of ${name}`,
  },
} as const;

export type ZineCopy = (typeof COPY)[keyof typeof COPY];

/** Textos do layout no idioma atual (cai para o português). */
export function useZineCopy(): ZineCopy {
  const { locale } = useI18n();
  return locale === "en-US" ? COPY["en-US"] : COPY["pt-BR"];
}

// ---- utilitários -------------------------------------------------------------------------

/** Inclinação de um elemento. Multiplicada por --zine-tilt (menor no celular). */
export function tilt(deg: number, extra?: CSSProperties): CSSProperties {
  return { ["--zine-r" as string]: `${deg}deg`, ...extra } as CSSProperties;
}

/** Rotações "à mão" que se repetem pela lista. */
export const TILTS = [-2, 1.5, -1, 2.2, -1.6, 1];
export const tiltAt = (i: number, scale = 1) => TILTS[i % TILTS.length] * scale;

export const firstName = (name?: string | null) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/** Tempo de leitura aproximado (200 palavras por minuto), sem contar as tags HTML. */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// ---- materiais da colagem ----------------------------------------------------------------

/** Pedaço de fita adesiva. Fica sobre a borda/respiro do papel, nunca sobre texto. */
export function Tape({ pos = "center" }: { pos?: "center" | "left" | "right" }) {
  return <span className="zn-tape" data-pos={pos} aria-hidden="true" />;
}

/** Trecho com os números de resultado passados no marca-texto. */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className="zn-mark">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/** Título de seção em letra à mão, com marca-texto. */
export function HandTitle({
  as: Tag = "h2",
  children,
  deg = -2,
  id,
  className,
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  deg?: number;
  id?: string;
  className?: string;
}) {
  return (
    <Tag id={id} className={`zn-hand-title zn-tilt ${className ?? ""}`} style={tilt(deg)}>
      <span>{children}</span>
    </Tag>
  );
}

export type PaperTone = "tape" | "paper" | "primary" | "subtle" | "accent" | "ink";

/** Post-it (ou papel solto). O tom define fundo e cor do texto, sempre em par do esquema. */
export function PostIt({
  tone = "tape",
  deg = 0,
  children,
  className,
  as: Tag = "div",
}: {
  tone?: PaperTone;
  deg?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <Tag className={`zn-postit zn-tilt ${className ?? ""}`} data-tone={tone} style={tilt(deg)}>
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
  hidden,
}: {
  tone?: PaperTone;
  deg?: number;
  size?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "span";
  hidden?: boolean;
}) {
  const style = tilt(deg, size ? ({ ["--zine-size" as string]: `${size}px` } as CSSProperties) : undefined);
  return (
    <Tag className={`zn-sticker zn-tilt ${className ?? ""}`} data-tone={tone} style={style} aria-hidden={hidden || undefined}>
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

/** Ingresso recortado: miolo com picotes laterais e canhoto. Use em <a>, <button> ou <Link>. */
export function TicketFace({
  tone = "paper",
  stub,
  children,
}: {
  tone?: "primary" | "paper";
  stub?: ReactNode;
  children: ReactNode;
}) {
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

/** Polaroide: foto em cima, legenda embaixo. A fita fica na margem de cima. */
export function Polaroid({
  image,
  alt = "",
  deg = 0,
  tape = "center",
  halftone = false,
  children,
  className,
  as: Tag = "article",
}: {
  image?: string | null;
  alt?: string;
  deg?: number;
  tape?: "center" | "left" | "right" | null;
  halftone?: boolean;
  children?: ReactNode;
  className?: string;
  as?: "article" | "div" | "li" | "figure";
}) {
  return (
    <Tag className={`zn-pol zn-tilt zn-lift ${className ?? ""}`} style={tilt(deg)}>
      {tape && <Tape pos={tape} />}
      <div className={`zn-pol-img${image ? "" : " is-empty"}${halftone ? " zn-halftone" : ""}`}>
        {image ? <img src={image} alt={alt} loading="lazy" /> : null}
      </div>
      {children && <div className="zn-pol-body">{children}</div>}
    </Tag>
  );
}

/** Carta datilografada em papel pautado com margem colorida. */
export function Letter({ children, deg = 0.6, className }: { children: ReactNode; deg?: number; className?: string }) {
  return (
    <div className={`zn-letter zn-tilt ${className ?? ""}`} style={tilt(deg)}>
      {children}
    </div>
  );
}

// ---- estilos ---------------------------------------------------------------------------

/** Folha de estilos do layout, injetada uma vez pelo Layout.tsx. Só usa variáveis do esquema. */
export const ZINE_CSS = `
.zn-root {
  --zine-hand: "Caveat", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
  --zine-tape: color-mix(in srgb, var(--accent-2) 55%, transparent);
  --zine-tape-solid: color-mix(in srgb, var(--accent-2) 32%, var(--surface));
  --zine-hl: color-mix(in srgb, var(--accent-2) 36%, transparent);
  --zine-shadow: 0 8px 18px color-mix(in srgb, var(--text) 16%, transparent);
  --zine-blend: multiply;
  --zine-tilt: 1;
  --zine-gutter: 44px;
  overflow-x: clip;
}
.dark .zn-root {
  --zine-tape-solid: color-mix(in srgb, var(--accent-2) 24%, var(--surface));
  --zine-hl: color-mix(in srgb, var(--accent-2) 30%, transparent);
  --zine-blend: screen;
  --zine-shadow: 0 0 0 1px var(--line), 0 12px 24px color-mix(in srgb, var(--bg) 85%, transparent);
}
@media (max-width: 767px) {
  .zn-root { --zine-tilt: 0.35; --zine-gutter: 16px; }
}

/* base */
.zn-root :focus-visible { outline: 3px solid var(--text); outline-offset: 3px; }
.zn-skip { position: absolute; left: 12px; top: -60px; z-index: 60; background: var(--surface); color: var(--text); padding: 8px 14px; border: 2px solid var(--text); font-weight: 700; }
.zn-skip:focus { top: 12px; }
.zn-wrap { max-width: 1120px; margin: 0 auto; padding: 0 var(--zine-gutter); box-sizing: border-box; }
.zn-sec { padding: 52px 0; }
.zn-tilt { transform: rotate(calc(var(--zine-r, 0deg) * var(--zine-tilt))); }
.zn-hand { font-family: var(--zine-hand); font-weight: 700; }
.zn-mono { font-family: var(--font-mono); }
.zn-muted { color: var(--text-muted); }
.zn-kicker { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 6px; }
.zn-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.zn-list { list-style: none; margin: 0; padding: 0; }

.zn-hand-title { font-family: var(--zine-hand); font-weight: 700; font-size: clamp(36px, 4.6vw, 50px); line-height: 1; margin: 0 0 30px; width: fit-content; max-width: 100%; color: var(--text-strong, var(--text)); }
.zn-hand-title > span { background: linear-gradient(transparent 58%, var(--zine-hl) 58%); padding: 0 6px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
h1.zn-hand-title { font-size: clamp(52px, 7vw, 92px); margin-bottom: 14px; }

.zn-mark { background: linear-gradient(transparent 50%, var(--zine-hl) 50%); color: inherit; font-weight: 700; padding: 0 2px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }

.zn-handlink { font-family: var(--zine-hand); font-weight: 700; font-size: 26px; line-height: 1.1; color: var(--text); text-decoration: underline; text-decoration-color: var(--primary); text-decoration-thickness: 2px; text-underline-offset: 5px; background: none; border: 0; padding: 0; cursor: pointer; }
.zn-handlink:hover { text-decoration-style: wavy; }
.zn-handlinks { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px 32px; margin-top: 36px; }

/* navegação: tira de fita adesiva */
.zn-header { padding-top: 22px; }
.zn-header .zn-wrap { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; }
.zn-strip-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 20px; background: var(--zine-tape-solid); color: var(--text); padding: 6px 20px; box-shadow: var(--zine-shadow); max-width: 100%; box-sizing: border-box; }
.zn-strip-nav ul { display: flex; flex-wrap: wrap; gap: 2px 20px; list-style: none; margin: 0; padding: 0; }
.zn-strip-nav a { font-family: var(--zine-hand); font-weight: 700; font-size: 25px; line-height: 1.2; color: var(--text); text-decoration: none; text-transform: lowercase; }
.zn-strip-nav a:hover { text-decoration: underline; text-decoration-color: var(--primary); text-decoration-thickness: 2px; text-underline-offset: 5px; }
.zn-strip-nav a[aria-current="page"] { text-decoration: underline wavy; text-decoration-color: var(--primary); text-decoration-thickness: 2px; text-underline-offset: 6px; }
.zn-toggle { padding: 6px !important; margin-left: 2px; border-radius: 999px; }
.zn-toggle:hover { background: color-mix(in srgb, var(--text) 10%, transparent) !important; }
.zn-brand { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); text-decoration: none; }
@media (max-width: 767px) {
  .zn-strip-nav { padding: 6px 14px; gap: 0 14px; }
  .zn-strip-nav ul { gap: 0 14px; }
  .zn-strip-nav a { font-size: 22px; }
  .zn-brand { display: none; }
}

/* rodapé */
.zn-footer { padding: 40px 0 56px; }
.zn-footer .zn-wrap { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px 28px; border-top: 2px dashed var(--line); padding-top: 26px; }
.zn-footer p { margin: 0; font-family: var(--zine-hand); font-weight: 700; font-size: 26px; }
.zn-footer ul { display: flex; flex-wrap: wrap; gap: 8px 18px; list-style: none; margin: 0; padding: 0; font-family: var(--font-mono); font-size: 13px; }
.zn-footer a { color: var(--text); display: inline-flex; align-items: center; gap: 6px; }

/* fita */
.zn-tape { position: absolute; top: -12px; left: 50%; width: 96px; height: 24px; transform: translateX(-50%) rotate(-4deg); background: var(--zine-tape); pointer-events: none; z-index: 2; }
/* nas quinas, a fita atravessa só o triângulo do canto (respiro ou imagem, nunca texto) */
.zn-tape[data-pos="left"], .zn-tape[data-pos="right"] { --zine-w: 80px; width: var(--zine-w); height: 22px; top: -3px; }
.zn-tape[data-pos="left"] { left: calc(8px - var(--zine-w) / 2); transform: rotate(-45deg); }
.zn-tape[data-pos="right"] { left: auto; right: calc(8px - var(--zine-w) / 2); transform: rotate(45deg); }
@media (max-width: 767px) {
  .zn-tape { width: 76px; }
  .zn-tape[data-pos="left"], .zn-tape[data-pos="right"] { --zine-w: 58px; }
}

/* ingresso recortado */
.zn-ticket { display: inline-flex; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-decoration: none; color: inherit; font: inherit; }
.zn-ticket-face {
  display: inline-flex; align-items: stretch; font-weight: 700; font-size: 15px; line-height: 1.2;
  background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 2px var(--text);
  -webkit-mask: radial-gradient(circle 9px at 0 50%, transparent 97%, var(--text) 100%) left / 51% 100% no-repeat, radial-gradient(circle 9px at 100% 50%, transparent 97%, var(--text) 100%) right / 51% 100% no-repeat;
  mask: radial-gradient(circle 9px at 0 50%, transparent 97%, var(--text) 100%) left / 51% 100% no-repeat, radial-gradient(circle 9px at 100% 50%, transparent 97%, var(--text) 100%) right / 51% 100% no-repeat;
}
.zn-ticket-face[data-tone="primary"] { background: var(--primary); color: var(--on-primary); box-shadow: inset 0 0 0 2px var(--on-primary); }
.zn-ticket-stub { display: inline-flex; align-items: center; padding: 13px 12px 13px 20px; border-right: 2px dashed currentColor; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; }
.zn-ticket-label { display: inline-flex; align-items: center; gap: 8px; padding: 13px 24px 13px 16px; }
.zn-ticket-face:not(:has(.zn-ticket-stub)) .zn-ticket-label { padding-left: 24px; }
.zn-ticket[disabled] { cursor: not-allowed; opacity: 0.55; }
@media (prefers-reduced-motion: no-preference) {
  .zn-ticket { transition: transform 0.2s ease; }
  .zn-ticket:not([disabled]):hover { transform: rotate(0deg) translateY(-2px); }
  .zn-lift { transition: transform 0.25s ease; }
  .zn-lift:hover, .zn-lift:focus-within { transform: rotate(0deg) translateY(-4px); }
}

/* adesivo redondo */
.zn-sticker {
  --zine-size: 170px;
  width: var(--zine-size); min-height: var(--zine-size); box-sizing: border-box; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  text-align: center; padding: 26px 20px; box-shadow: var(--zine-shadow); flex: none;
}
.zn-sticker[data-tone="primary"] { background: var(--primary); color: var(--on-primary); }
.zn-sticker[data-tone="accent"] { background: var(--accent); color: var(--on-accent); }
.zn-sticker[data-tone="ink"] { background: var(--text); color: var(--bg); }
.zn-sticker[data-tone="tape"] { background: var(--zine-tape-solid); color: var(--text); }
.zn-sticker[data-tone="paper"], .zn-sticker[data-tone="subtle"] { background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 2.5px var(--text), var(--zine-shadow); }
.zn-sticker b { font-family: var(--font-sans); font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
.zn-sticker small { font-size: 12.5px; line-height: 1.25; }
.zn-stickers { display: flex; flex-wrap: wrap; align-items: center; gap: 28px 36px; }
@media (max-width: 767px) {
  .zn-stickers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); justify-items: center; gap: 20px 12px; }
  .zn-stickers .zn-sticker { --zine-size: min(150px, 42vw); padding: 20px 14px; }
}

/* polaroide */
.zn-pol { position: relative; display: flex; flex-direction: column; background: var(--surface); color: var(--text); padding: 12px 12px 18px; box-shadow: var(--zine-shadow); box-sizing: border-box; min-width: 0; }
.zn-pol-img { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--subtle); }
.zn-pol-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.zn-pol-img.is-empty { background-color: color-mix(in srgb, var(--accent) 40%, var(--surface)); background-image: radial-gradient(color-mix(in srgb, var(--primary) 70%, transparent) 30%, transparent 34%); background-size: 12px 12px; }
.zn-halftone img { filter: grayscale(1) contrast(1.1); }
.zn-halftone::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(var(--primary) 30%, transparent 34%); background-size: 7px 7px; mix-blend-mode: var(--zine-blend); opacity: 0.55; }
.zn-halftone.is-empty::after { display: none; }
.zn-pol-body { display: flex; flex-direction: column; gap: 6px; padding: 12px 4px 0; min-width: 0; }
.zn-pol-title { font-family: var(--zine-hand); font-weight: 700; font-size: 30px; line-height: 1; margin: 0; overflow-wrap: anywhere; }
.zn-pol-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); margin: 0; }
.zn-pol-desc { font-size: 14px; line-height: 1.5; margin: 2px 0 0; }
.zn-pol-metric { align-self: flex-start; font-size: 14px; line-height: 1.4; margin: 4px 0 0; }
.zn-pol-action { margin-top: auto; padding-top: 10px; }
.zn-polgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr)); gap: 48px 36px; padding-top: 14px; list-style: none; margin: 0; padding-left: 0; }

/* post-it e papéis soltos */
.zn-postit { position: relative; box-sizing: border-box; min-height: 180px; padding: 24px 20px 22px; box-shadow: var(--zine-shadow); display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.zn-postit[data-tone="tape"] { background: var(--zine-tape-solid); color: var(--text); }
.zn-postit[data-tone="paper"] { background: var(--surface); color: var(--text); }
.zn-postit[data-tone="subtle"] { background: var(--subtle); color: var(--text); }
.zn-postit[data-tone="primary"] { background: var(--primary); color: var(--on-primary); }
.zn-postit[data-tone="accent"] { background: var(--accent); color: var(--on-accent); }
.zn-postit[data-tone="ink"] { background: var(--text); color: var(--bg); }
.zn-postit h3 { font-size: 19px; line-height: 1.15; margin: 0; font-weight: 800; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.zn-postit p { font-size: 14px; line-height: 1.5; margin: 0; }
@media (max-width: 767px) { .zn-postit { min-height: 0; } }
.zn-postits { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 30px 28px; list-style: none; margin: 0; padding: 0; }

/* bilhete (depoimentos, fichas) */
.zn-note { position: relative; background: var(--surface); color: var(--text); padding: 28px 22px 20px; box-shadow: var(--zine-shadow); display: flex; flex-direction: column; gap: 12px; min-width: 0; box-sizing: border-box; }
.zn-note blockquote { margin: 0; font-family: var(--zine-hand); font-weight: 700; font-size: 23px; line-height: 1.15; }
.zn-note figcaption, .zn-note .zn-note-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); }
.zn-note h3 { font-family: var(--zine-hand); font-weight: 700; font-size: 30px; line-height: 1; margin: 0; }
.zn-notes { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 40px 34px; padding-top: 12px; list-style: none; margin: 0; padding-left: 0; }

/* carta datilografada */
.zn-letter {
  --zine-margin: 56px;
  position: relative; box-sizing: border-box; max-width: 760px;
  padding: 28px 40px 28px calc(var(--zine-margin) + 24px);
  font-family: var(--font-mono); font-size: 14px; line-height: 28px; color: var(--text);
  background:
    linear-gradient(90deg, transparent var(--zine-margin), var(--primary) var(--zine-margin) calc(var(--zine-margin) + 2px), transparent calc(var(--zine-margin) + 2px)),
    repeating-linear-gradient(to bottom, transparent 0 27px, var(--line) 27px 28px),
    var(--surface);
  box-shadow: var(--zine-shadow);
}
.zn-letter { display: flex; flex-direction: column; gap: 28px; }
.zn-letter :is(p, h3, ul, ol) { margin: 0; }
.zn-letter ul { padding-left: 20px; }
.zn-letter li { line-height: 28px; }
.zn-letter h3 { font-size: 14px; line-height: 28px; font-weight: 700; }
.zn-letter .zn-sign { font-family: var(--zine-hand); font-weight: 700; font-size: 34px; line-height: 28px; }
@media (max-width: 767px) {
  .zn-letter { --zine-margin: 26px; padding: 28px 16px 28px calc(var(--zine-margin) + 14px); font-size: 13.5px; }
}

/* cupom de recortar */
.zn-coupon { position: relative; max-width: 760px; box-sizing: border-box; border: 2.5px dashed var(--text); background: var(--surface); color: var(--text); padding: 40px 40px 30px; display: flex; flex-direction: column; gap: 14px; }
.zn-coupon h2 { font-size: clamp(28px, 3.4vw, 36px); line-height: 1.05; margin: 0; letter-spacing: -0.02em; }
.zn-coupon p { margin: 0; }
.zn-scissors { position: absolute; top: -15px; left: 26px; background: var(--bg); color: var(--text); padding: 0 6px; display: inline-flex; }
.zn-checks { display: flex; flex-wrap: wrap; gap: 12px 14px; margin-top: 6px; }
.zn-check { display: inline-flex; align-items: center; gap: 10px; padding: 11px 18px; border: 2px solid var(--text); background: var(--surface); color: var(--text); font: inherit; font-weight: 700; cursor: pointer; }
.zn-check[data-tone="primary"] { background: var(--primary); color: var(--on-primary); border-color: var(--text); }
.zn-check .on { display: none; }
.zn-check:hover .on, .zn-check:focus-visible .on { display: inline; }
.zn-check:hover .off, .zn-check:focus-visible .off { display: none; }
.zn-coupon small { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); overflow-wrap: anywhere; }
@media (max-width: 767px) { .zn-coupon { padding: 34px 18px 24px; } }

/* home: capa */
.zn-hero { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 64px; align-items: center; padding: 44px 0 36px; }
.zn-hero-text { display: flex; flex-direction: column; align-items: flex-start; gap: 22px; min-width: 0; }
.zn-hello { font-family: var(--zine-hand); font-weight: 700; font-size: clamp(54px, 7.4vw, 98px); line-height: 0.95; margin: 0; overflow-wrap: anywhere; color: var(--text-strong, var(--text)); }
.zn-role { display: inline; font-family: var(--font-mono); font-size: 13px; line-height: 1.95; background: var(--text); color: var(--bg); padding: 3px 9px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.zn-paperstrip { background: var(--surface); color: var(--text); padding: 16px 22px; font-size: clamp(22px, 2.4vw, 30px); font-weight: 800; line-height: 1.15; letter-spacing: -0.015em; box-shadow: var(--zine-shadow); margin: 0; max-width: 34ch; }
.zn-lead { font-family: var(--font-mono); font-size: 14px; line-height: 1.6; color: var(--text-muted); max-width: 52ch; margin: 0; }
.zn-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; padding-top: 4px; }
.zn-me { position: relative; justify-self: center; width: min(100%, 330px); padding: 28px 8px 8px; }
.zn-blob { position: absolute; border-radius: 50%; mix-blend-mode: var(--zine-blend); opacity: 0.85; pointer-events: none; aspect-ratio: 1; }
.zn-blob.a { width: 74%; left: -12%; top: -2%; background: var(--primary); }
.zn-blob.b { width: 62%; right: -12%; bottom: 4%; background: var(--accent); }
.zn-me .zn-pol { z-index: 1; }
.zn-me .zn-pol-img { aspect-ratio: 4 / 4.4; }
.zn-avail { position: absolute; z-index: 3; top: 52px; right: -22px; --zine-size: 128px; padding: 18px 14px; }
.zn-avail span { font-family: var(--zine-hand); font-weight: 700; font-size: 19px; line-height: 1.05; }
@media (max-width: 899px) {
  .zn-hero { grid-template-columns: minmax(0, 1fr); gap: 36px; padding-top: 30px; }
  .zn-me { width: min(100%, 300px); }
}
@media (max-width: 767px) {
  .zn-blob.a { left: -2%; }
  .zn-blob.b { right: -2%; }
  .zn-avail { right: -4px; top: 44px; --zine-size: 112px; }
  .zn-avail span { font-size: 17px; }
}

/* página: cabeçalho */
.zn-pagehead { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 24px 48px; padding: 40px 0 8px; }
.zn-pagehead-aside { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
@media (max-width: 767px) { .zn-pagehead { grid-template-columns: minmax(0, 1fr); } }

/* currículo */
.zn-exp { list-style: none; margin: 0; padding: 0; }
.zn-exp > li + li { margin-top: 28px; }
.zn-exp-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 18px; }
.zn-exp-head h3 { margin: 0; }
.zn-exp-desc :is(p, ul, ol) { margin: 0; }
.zn-exp-desc ul { padding-left: 20px; }
.zn-skill-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; font-size: 15px; line-height: 1.45; }
.zn-skill-list li::before { content: "– "; opacity: 0.6; }
.zn-chips { display: flex; flex-wrap: wrap; gap: 10px 12px; list-style: none; margin: 0; padding: 0; }
.zn-chip { display: inline-block; background: var(--zine-tape-solid); color: var(--text); padding: 4px 12px; font-family: var(--zine-hand); font-weight: 700; font-size: 21px; line-height: 1.2; }
.zn-note ul.zn-plain { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; line-height: 1.45; }
.zn-note .zn-sub { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.zn-rich :is(p, ul) { margin: 4px 0 0; }
.zn-rich ul { padding-left: 18px; }

/* portfólio: abas de fita */
.zn-tabs { display: flex; flex-wrap: wrap; gap: 12px 14px; list-style: none; margin: 0 0 40px; padding: 0; }
.zn-tab { font-family: var(--zine-hand); font-weight: 700; font-size: 23px; line-height: 1.1; padding: 5px 16px; border: 0; cursor: pointer; background: var(--zine-tape-solid); color: var(--text); box-shadow: var(--zine-shadow); }
.zn-tab[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.zn-tab[aria-pressed="false"]:hover { text-decoration: underline; text-underline-offset: 4px; }
@media (min-width: 900px) {
  .zn-polgrid .zn-featured { grid-column: span 2; }
  .zn-polgrid .zn-featured .zn-pol-img { aspect-ratio: 16 / 9; }
  .zn-polgrid .zn-featured .zn-pol-title { font-size: 40px; }
}
.zn-badge { align-self: flex-start; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; background: var(--text); color: var(--bg); padding: 2px 8px; }
.zn-tags { display: flex; flex-wrap: wrap; gap: 4px 10px; list-style: none; margin: 0; padding: 0; font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); }

/* sobre */
.zn-principles { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 26px 40px; }
.zn-principle { display: flex; align-items: flex-start; gap: 18px; min-width: 0; }
.zn-principle .zn-sticker { --zine-size: 66px; padding: 0; }
.zn-principle .zn-sticker b { font-size: 24px; }
.zn-principle h3 { font-size: 19px; line-height: 1.2; margin: 6px 0 6px; font-weight: 800; }
.zn-principle p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--text-muted); }
.zn-fold { position: relative; background: var(--surface); color: var(--text); box-shadow: var(--zine-shadow); padding: 18px 44px 18px 20px; }
.zn-fold::after { content: ""; position: absolute; top: 0; right: 0; width: 26px; height: 26px; background: linear-gradient(225deg, var(--bg) 50%, var(--subtle) 50%); pointer-events: none; }
.zn-fold summary { cursor: pointer; list-style: none; font-family: var(--zine-hand); font-weight: 700; font-size: 25px; line-height: 1.1; display: flex; gap: 10px; align-items: baseline; }
.zn-fold summary::-webkit-details-marker { display: none; }
.zn-fold summary::before { content: "+"; font-family: var(--font-mono); font-size: 18px; color: var(--primary); flex: none; width: 14px; }
.zn-fold[open] summary::before { content: "–"; }
.zn-fold p { margin: 12px 0 0 24px; font-size: 15px; line-height: 1.6; }
.zn-folds { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: 22px 28px; align-items: start; }
.zn-routine .zn-pol-img { aspect-ratio: 1; }
.zn-routine .zn-pol-body p { font-family: var(--zine-hand); font-weight: 700; font-size: 21px; line-height: 1.1; margin: 0; }
.zn-personal { flex: 1 1 420px; max-width: 640px; }
.zn-routine { grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); }

/* blog: recortes de jornal */
.zn-clip { position: relative; background: var(--surface); color: var(--text); box-shadow: var(--zine-shadow); padding: 20px 20px 22px; border-top: 4px double var(--text); display: flex; flex-direction: column; gap: 10px; min-width: 0; box-sizing: border-box; }
.zn-clip h2, .zn-clip h3 { margin: 0; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; overflow-wrap: anywhere; }
.zn-clip h3 { font-size: 21px; }
.zn-clip a.zn-clip-link { color: inherit; text-decoration: none; }
.zn-clip a.zn-clip-link:hover { text-decoration: underline; text-decoration-color: var(--primary); text-underline-offset: 4px; }
.zn-clip p { margin: 0; font-size: 14.5px; line-height: 1.55; }
.zn-clip-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 4px 12px; }
.zn-clip-img { aspect-ratio: 16 / 9; overflow: hidden; background: var(--subtle); }
.zn-clip-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(0.35); }
.zn-clip-feature { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 28px; padding: 26px; border-top-width: 6px; }
.zn-clip-feature h2 { font-size: clamp(28px, 3.6vw, 44px); }
.zn-clip-feature .zn-clip-cols { column-count: 2; column-gap: 24px; column-rule: 1px solid var(--line); }
.zn-clip-feature .zn-clip-img { aspect-ratio: auto; min-height: 240px; height: 100%; }
@media (max-width: 899px) {
  .zn-clip-feature { grid-template-columns: minmax(0, 1fr); padding: 20px; }
  .zn-clip-feature .zn-clip-cols { column-count: 1; }
  .zn-clip-feature .zn-clip-img { min-height: 0; aspect-ratio: 16 / 9; }
}
.zn-clips { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 40px 32px; align-items: start; list-style: none; margin: 0; padding: 14px 0 0; }
.zn-rss { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 13px; color: var(--text); background: var(--zine-tape-solid); padding: 6px 12px; text-decoration: none; }
.zn-rss:hover { text-decoration: underline; }
`;

export function ZineStyles() {
  return <style>{ZINE_CSS}</style>;
}
