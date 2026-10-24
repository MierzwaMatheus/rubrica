import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import { Pause, Play } from "lucide-react";
import { useI18n } from "@/i18n/context/I18nContext";
import { highlightNumbers } from "@/utils/homeContent";

/*
 * Pôster Cinético — peças compartilhadas pelas páginas do layout.
 *
 * Tudo aqui usa só as variáveis do esquema de cores (--bg, --text, --primary…) e
 * variáveis próprias com o prefixo --poster-. A tipografia gigante se ajusta à largura
 * do próprio bloco com unidades de contêiner (cqi): o tamanho sai do comprimento da
 * palavra mais longa, então nenhum nome ou título estoura a largura da tela.
 */

// ---- Textos próprios do layout (pt-BR e en-US) ---------------------------------------

const LABELS = {
  "pt-BR": {
    navPrincipal: "Navegação principal",
    abrirMenu: "Abrir menu",
    fecharMenu: "Fechar menu",
    emNumeros: "Em números",
    faixaProjetos: "Projetos",
    pausarFaixa: "Pausar a faixa de projetos",
    retomarFaixa: "Retomar a faixa de projetos",
    maisSobreMim: "Mais sobre mim",
    lerCase: "Ler o case",
    verProjeto: "Ver projeto",
    destaque: "Destaque",
    projetos: (n: number) => (n === 1 ? "1 projeto" : `${n} projetos`),
    textos: (n: number) => (n === 1 ? "1 texto" : `${n} textos`),
    categorias: "Categorias",
    semProjetos: "Nenhum projeto nesta categoria.",
    interesses: "Interesses",
    certificacoes: "Certificações",
    voltarAoTopo: "Voltar ao topo",
    redes: "Redes",
  },
  "en-US": {
    navPrincipal: "Main navigation",
    abrirMenu: "Open menu",
    fecharMenu: "Close menu",
    emNumeros: "In numbers",
    faixaProjetos: "Projects",
    pausarFaixa: "Pause the projects ticker",
    retomarFaixa: "Resume the projects ticker",
    maisSobreMim: "More about me",
    lerCase: "Read the case",
    verProjeto: "View project",
    destaque: "Featured",
    projetos: (n: number) => (n === 1 ? "1 project" : `${n} projects`),
    textos: (n: number) => (n === 1 ? "1 post" : `${n} posts`),
    categorias: "Categories",
    semProjetos: "No projects in this category.",
    interesses: "Interests",
    certificacoes: "Certifications",
    voltarAoTopo: "Back to top",
    redes: "Social",
  },
} as const;

export type PosterLabels = (typeof LABELS)["pt-BR"] | (typeof LABELS)["en-US"];

/** Textos decorativos do layout no idioma atual. */
export function usePosterLabels(): PosterLabels {
  const { locale } = useI18n();
  return locale === "en-US" ? LABELS["en-US"] : LABELS["pt-BR"];
}

// ---- Utilitários ---------------------------------------------------------------------

/** Comprimento da palavra mais longa (mínimo 2, para números curtos não explodirem). */
export function longestWord(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(2, ...words.map((w) => [...w].length));
}

/** Largura média de um caractere (em `em`) na fonte principal em peso 800: caixa alta e números. */
export const K_CAPS = 0.82;
export const K_NUM = 0.76;

/**
 * Variáveis que dimensionam um texto gigante dentro de um `.poster-fit`.
 * `max` é o tamanho máximo em px; `k` é a largura média de um caractere em `em`.
 */
export function fit(text: string, max: number, k = K_CAPS): CSSProperties {
  return {
    ["--poster-n" as string]: longestWord(text),
    ["--poster-max" as string]: `${max}px`,
    ["--poster-k" as string]: k,
  } as CSSProperties;
}

/** Primeiro ano (4 dígitos) de um período como "2021 - 2024"; senão, null. */
export function yearOf(period: string | undefined): string | null {
  return period?.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

/** Minutos de leitura de um HTML, a 200 palavras por minuto. */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Data curta no idioma atual; vazio se a data for inválida. */
export function formatDate(value: string | undefined, locale: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

// ---- Folha de estilo do layout -------------------------------------------------------

const CSS = `
.poster-root {
  --poster-gutter: clamp(16px, 3.2vw, 44px);
  --poster-rule: 3px;
  --poster-ink: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  overflow-x: clip;
}
.poster-root ::selection { background: var(--primary); color: var(--on-primary); }
.poster-root :where(a, button, summary):focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 3px;
}
.poster-main { flex: 1; width: 100%; }
.poster-wrap { max-width: 1440px; margin-inline: auto; padding-inline: var(--poster-gutter); }
.poster-mono { font-family: var(--font-mono); }

/* Barra fixa */
.poster-bar { position: sticky; top: 0; z-index: 40; background: var(--bg); border-bottom: 5px solid var(--text); }
.poster-bar-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 60px; }
.poster-brand {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 16px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase;
  color: inherit; text-decoration: none;
}
.poster-links { display: flex; align-items: center; gap: 2px; }
.poster-link {
  padding: 8px 10px; font-size: 12px; font-weight: 700; letter-spacing: .12em;
  text-transform: uppercase; color: inherit; text-decoration: none; white-space: nowrap;
}
.poster-link:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 5px; }
.poster-link[aria-current="page"] { background: var(--text); color: var(--bg); text-decoration: none; }
.poster-toggle { width: 38px; height: 38px; justify-content: center; margin-left: 6px; border: 2px solid var(--text) !important; }
.poster-toggle:hover { background: var(--text) !important; color: var(--bg) !important; }
.poster-menu-btn {
  display: none; align-items: center; gap: 8px; height: 40px; padding: 0 12px;
  border: 3px solid var(--text); background: var(--bg); color: var(--text);
  font: inherit; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
}
.poster-bar-tools { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.poster-drawer { border-top: 3px solid var(--text); padding-block: 8px 20px; }
.poster-drawer a {
  display: block; padding: 10px 0; border-bottom: 2px solid var(--text);
  font-size: clamp(28px, 9vw, 44px); font-weight: 800; line-height: 1; letter-spacing: -.02em;
  text-transform: uppercase; color: inherit; text-decoration: none; overflow-wrap: anywhere;
}
.poster-drawer a[aria-current="page"] { color: var(--primary); }
@media (max-width: 900px) {
  .poster-links { display: none; }
  .poster-menu-btn { display: inline-flex; }
}
@media (min-width: 901px) { .poster-drawer { display: none; } }

/* Tipografia gigante: o bloco .poster-fit é o contêiner; o texto mede a palavra mais longa */
.poster-fit { container-type: inline-size; min-width: 0; }
.poster-giant {
  display: block; margin: 0;
  font-size: clamp(36px, 9vw, var(--poster-max, 160px));
  font-weight: 800; line-height: .9; letter-spacing: -.035em;
  overflow-wrap: anywhere; hyphens: manual;
}
@supports (font-size: 1cqi) {
  .poster-giant { font-size: min(var(--poster-max, 160px), calc(100cqi / (var(--poster-n, 6) * var(--poster-k, .66)))); }
}
.poster-up { text-transform: uppercase; }
.poster-outline { color: var(--poster-ink); }
/* Contorno: o traço é pintado antes do preenchimento (na cor do fundo), assim as sobreposições
   internas dos glifos da fonte variável não aparecem. Sem suporte, o texto fica preenchido. */
@supports (-webkit-text-stroke: 1px) {
  .poster-outline {
    color: var(--poster-paper, var(--bg)); paint-order: stroke fill;
    -webkit-text-stroke: max(2.5px, .045em) var(--poster-ink);
  }
}

/* Seções */
.poster-sec { border-bottom: var(--poster-rule) solid var(--text); padding-block: clamp(44px, 6vw, 80px); }
.poster-sec:last-child { border-bottom: 0; }
.poster-sec:has(> .poster-wrap > .poster-rows:first-child) { padding-top: clamp(20px, 3vw, 32px); }
.poster-lab {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 8px 24px;
  margin: 0 0 clamp(24px, 3vw, 36px); font-family: var(--font-mono); font-size: 12px; font-weight: 500;
  letter-spacing: .14em; text-transform: uppercase;
}
.poster-lab h2 { margin: 0; font: inherit; }
.poster-lab a, .poster-lab button {
  color: inherit; font: inherit; background: none; border: 0; padding: 0; cursor: pointer;
  text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px;
}
.poster-lab a:hover, .poster-lab button:hover { color: var(--primary); }

/* Botões em bloco */
.poster-btns { display: flex; flex-wrap: wrap; gap: 12px; }
.poster-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px 24px; border: 3px solid var(--text); background: var(--bg); color: var(--text);
  font: inherit; font-size: 15px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase;
  text-decoration: none; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease;
}
.poster-btn:hover { transform: translate(-3px, -3px); box-shadow: 6px 6px 0 var(--primary); }
.poster-btn--pri { background: var(--text); color: var(--bg); }
.poster-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
@media (max-width: 560px) {
  .poster-btns { flex-direction: column; }
  .poster-btn { width: 100%; }
}

/* Selo e disco */
.poster-seal {
  position: absolute; z-index: 2; display: flex; align-items: center; justify-content: center;
  width: clamp(118px, 10vw, 148px); aspect-ratio: 1; padding: 16px; border-radius: 50%;
  background: var(--primary); color: var(--on-primary); text-align: center;
  font-size: 12px; font-weight: 800; line-height: 1.15; letter-spacing: .04em; text-transform: uppercase;
  overflow-wrap: anywhere; transform: rotate(-12deg);
}
.poster-seal--long { font-size: 10px; }
.poster-seal-dot { display: block; width: 8px; height: 8px; margin: 0 auto 6px; border-radius: 50%; background: currentColor; }
.poster-disc { position: absolute; border-radius: 50%; background: var(--accent); mix-blend-mode: multiply; }
.dark .poster-disc { mix-blend-mode: screen; }

/* Faixa rolante */
.poster-marq { display: flex; align-items: stretch; background: var(--text); color: var(--bg); border-bottom: var(--poster-rule) solid var(--text); }
.poster-marq-view { flex: 1; min-width: 0; overflow: hidden; }
.poster-marq-track { display: flex; width: max-content; animation: poster-marq 32s linear infinite; }
.poster-marq:hover .poster-marq-track,
.poster-marq[data-paused="true"] .poster-marq-track { animation-play-state: paused; }
.poster-marq-group { display: flex; flex-shrink: 0; align-items: center; margin: 0; padding: 14px 0; list-style: none; }
.poster-marq-item {
  display: flex; align-items: center; gap: 28px; padding-right: 28px; white-space: nowrap;
  font-size: clamp(20px, 2.4vw, 30px); font-weight: 800; letter-spacing: -.01em; text-transform: uppercase;
}
.poster-marq-star { color: color-mix(in srgb, var(--bg) 55%, var(--text)); }
.poster-marq-pause {
  display: inline-flex; align-items: center; justify-content: center; width: 56px; flex-shrink: 0;
  border: 0; border-left: 2px solid color-mix(in srgb, var(--bg) 40%, var(--text));
  background: var(--text); color: var(--bg); cursor: pointer;
}
.poster-marq-pause:focus-visible { outline: 3px solid var(--bg) !important; outline-offset: -6px !important; }
@keyframes poster-marq { to { transform: translateX(-50%); } }

/* Números gigantes */
.poster-met { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(28px, 4vw, 48px) clamp(20px, 4vw, 48px); margin: 0; padding: 0; list-style: none; }
.poster-met li { min-width: 0; }
.poster-met-label { display: block; max-width: 320px; margin-top: 12px; font-size: clamp(14px, 1.3vw, 16px); line-height: 1.4; }

/* Linhas de cartaz */
.poster-rows { margin: 0; padding: 0; list-style: none; border-bottom: var(--poster-rule) solid var(--text); }
.poster-row-link {
  display: grid; grid-template-columns: clamp(64px, 8vw, 120px) minmax(0, 1fr) minmax(180px, 280px);
  align-items: center; gap: 12px clamp(16px, 2.4vw, 32px);
  margin-inline: calc(-1 * var(--poster-gutter)); padding: clamp(16px, 2vw, 24px) var(--poster-gutter);
  border-top: var(--poster-rule) solid var(--text); color: inherit; text-decoration: none;
  transition: background-color .2s ease, color .2s ease;
}
.poster-rows:not(:hover):not(:focus-within) > li:first-child > .poster-row-link,
a.poster-row-link:hover, a.poster-row-link:focus-visible {
  background: var(--primary); color: var(--on-primary); --poster-ink: var(--on-primary); --poster-paper: var(--primary);
}
a.poster-row-link:focus-visible { outline: 3px solid var(--on-primary) !important; outline-offset: -9px !important; }
.poster-row-i { font-size: clamp(40px, 5vw, 68px); font-weight: 800; line-height: 1; letter-spacing: -.03em; }
.poster-row-title { line-height: 1.02; letter-spacing: -.03em; padding-top: .04em; }
.poster-row-desc { margin: 10px 0 0; max-width: 62ch; font-size: 15px; line-height: 1.45; opacity: .85; }
.poster-row-meta { font-size: 14px; line-height: 1.45; text-align: right; overflow-wrap: anywhere; }
.poster-row-meta > span:not(.poster-row-go) { display: block; }
.poster-row-meta b { display: block; font-size: clamp(22px, 2.2vw, 30px); font-weight: 800; letter-spacing: -.02em; line-height: 1.05; }
.poster-row-tag { display: block; margin-bottom: 6px; font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
.poster-row-go { display: table; margin: 10px 0 0 auto; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; border-bottom: 2px solid currentColor; }
@media (max-width: 760px) {
  .poster-row-link { grid-template-columns: auto minmax(0, 1fr); align-items: start; }
  .poster-row-meta { grid-column: 1 / -1; text-align: left; }
  .poster-row-go { margin-left: 0; }
  .poster-row-i { font-size: 40px; }
}

/* Declaração com marca-texto */
.poster-stmt { margin: 0; max-width: 30ch; font-size: clamp(28px, 4vw, 54px); font-weight: 700; line-height: 1.08; letter-spacing: -.02em; overflow-wrap: anywhere; }
.poster-stmt--m { max-width: 34ch; font-size: clamp(24px, 3vw, 40px); }
.poster-stmt mark {
  padding: 0 .12em; background: color-mix(in srgb, var(--accent-2) 38%, var(--bg)); color: var(--text);
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
.poster-body { max-width: 62ch; margin: 24px 0 0; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.6; }
.poster-body + .poster-body { margin-top: 14px; }
.poster-body strong { font-weight: 800; }

/* Serviços */
.poster-sv { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 360px); align-items: center; gap: 12px clamp(20px, 3vw, 40px); padding-block: 18px; border-top: var(--poster-rule) solid var(--text); }
.poster-sv:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-sv p { margin: 0; font-size: 16px; line-height: 1.5; }
@media (max-width: 760px) { .poster-sv { grid-template-columns: minmax(0, 1fr); } }

/* Depoimentos */
.poster-q { margin: 0; font-weight: 700; line-height: 1.1; letter-spacing: -.015em; overflow-wrap: anywhere; }
.poster-q--l { font-size: clamp(28px, 4.2vw, 56px); }
.poster-q--m { font-size: clamp(22px, 3vw, 40px); }
.poster-q--s { font-size: clamp(19px, 2.1vw, 28px); }
.poster-cite { display: block; margin-top: 18px; font-family: var(--font-mono); font-size: 12px; font-style: normal; letter-spacing: .1em; text-transform: uppercase; }
.poster-qs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; margin-top: 44px; padding-top: 24px; border-top: var(--poster-rule) solid var(--text); }
.poster-qs blockquote { margin: 0; }
.poster-qs p { margin: 0; font-size: 18px; line-height: 1.45; }
@media (max-width: 760px) { .poster-qs { grid-template-columns: minmax(0, 1fr); } }

/* Cabeçalho das páginas internas */
.poster-head { border-bottom: var(--poster-rule) solid var(--text); padding-block: clamp(32px, 5vw, 64px); }
.poster-head-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(240px, 380px); align-items: end; gap: 24px clamp(24px, 4vw, 56px); }
.poster-head-kicker { display: block; margin-bottom: 16px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
.poster-head-aside { font-size: 16px; line-height: 1.5; }
.poster-head-aside p { margin: 0 0 18px; }
@media (max-width: 860px) { .poster-head-grid { grid-template-columns: minmax(0, 1fr); } }

/* Listas de palavras grandes */
.poster-words { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; margin: 0; padding: 0; list-style: none; }
.poster-words li { font-size: clamp(24px, 3.4vw, 46px); font-weight: 800; line-height: 1.05; letter-spacing: -.02em; text-transform: uppercase; overflow-wrap: anywhere; }
.poster-words--m li { font-size: clamp(20px, 2.4vw, 32px); }
.poster-words .poster-sep { color: var(--primary); font-weight: 400; }

/* Rodapé */
.poster-foot { border-top: 5px solid var(--text); padding-block: 28px 36px; }
.poster-foot-in { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px 28px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
.poster-foot a { color: inherit; text-underline-offset: 4px; }
.poster-foot-links { display: flex; flex-wrap: wrap; gap: 8px 20px; }

/* Texto rico das experiências */
.poster-prose { font-size: 16px; line-height: 1.55; }
.poster-prose :where(ul, ol) { margin: 10px 0 0; padding-left: 1.2em; }
.poster-prose li + li { margin-top: 4px; }
.poster-prose p { margin: 8px 0 0; }

@media (prefers-reduced-motion: reduce) {
  .poster-root *, .poster-root *::before, .poster-root *::after { transition: none !important; }
  .poster-btn:hover { transform: none; }
  .poster-marq-track { animation: none; width: auto; }
  .poster-marq-group { flex-wrap: wrap; row-gap: 6px; padding-inline: var(--poster-gutter); }
  .poster-marq-item { white-space: normal; }
  .poster-marq-dup, .poster-marq-pause { display: none !important; }
}
`;

/** Folha de estilo do layout (uma vez, no Layout). */
export function PosterStyles() {
  return <style>{CSS}</style>;
}

// ---- Componentes ---------------------------------------------------------------------

/** Rótulo de seção em mono: título (h2) à esquerda e uma ação opcional à direita. */
export function SectionLabel({ id, title, action }: { id?: string; title: string; action?: ReactNode }) {
  return (
    <div className="poster-lab">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
}

/** Seção de largura total com o fio grosso embaixo e o conteúdo centralizado. */
export function Section({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`poster-sec ${className ?? ""}`} style={{ scrollMarginTop: 72 }}>
      <div className="poster-wrap">{children}</div>
    </section>
  );
}

/** Selo redondo e inclinado (disponibilidade). Fica sempre em área própria, nunca sobre texto. */
export function Seal({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <p className={`poster-seal${label.length > 34 ? " poster-seal--long" : ""}`} style={{ margin: 0, ...style }}>
      <span>
        <span className="poster-seal-dot" aria-hidden="true" />
        {label}
      </span>
    </p>
  );
}

/**
 * Faixa rolante com nomes. A primeira cópia é lida pelo leitor de tela; as repetições
 * (que só servem para o laço visual) ficam escondidas dele. Pausa no hover e no botão;
 * com movimento reduzido vira uma lista parada que quebra linha.
 */
export function Ticker({ items }: { items: string[] }) {
  const labels = usePosterLabels();
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;

  // Repete a lista até a faixa ser mais larga que a tela, para o laço não mostrar buraco.
  const reps = Math.max(1, Math.ceil(8 / items.length));
  const filled = Array.from({ length: reps }, () => items).flat();

  const group = (hidden: boolean) => (
    <ul className={`poster-marq-group${hidden ? " poster-marq-dup" : ""}`} aria-hidden={hidden || undefined}>
      {filled.map((name, i) => {
        const extra = i >= items.length;
        return (
          <li
            key={`${name}-${i}`}
            className={`poster-marq-item${extra ? " poster-marq-dup" : ""}`}
            aria-hidden={!hidden && extra ? true : undefined}
          >
            {name}
            <span className="poster-marq-star" aria-hidden="true">
              ✶
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="poster-marq" data-paused={paused} role="region" aria-label={labels.faixaProjetos}>
      <div className="poster-marq-view">
        <div className="poster-marq-track">
          {group(false)}
          {group(true)}
        </div>
      </div>
      <button
        type="button"
        className="poster-marq-pause"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? labels.retomarFaixa : labels.pausarFaixa}
        aria-pressed={paused}
      >
        {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

/** Números de destaque em 2 colunas, cada valor do tamanho de um cartaz. */
export function BigNumbers({ items }: { items: Array<{ value: string; label: string }> }) {
  if (!items.length) return null;
  return (
    <ul className="poster-met">
      {items.map((m) => (
        <li key={`${m.value}-${m.label}`} className="poster-fit">
          <strong className="poster-giant" style={{ ...fit(m.value, 150, K_NUM), lineHeight: 0.85 }}>
            {m.value}
          </strong>
          <span className="poster-met-label">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Uma linha de cartaz: número em contorno, nome gigante, metadados à direita. */
export interface PosterRowProps {
  index: number;
  title: string;
  /** Tamanho máximo do título em px. */
  max?: number;
  description?: string;
  tag?: string;
  meta?: ReactNode;
  action?: string;
  /** Rota interna (Link) ou endereço externo (abre em nova aba). Sem nenhum, a linha não é clicável. */
  href?: string;
  external?: string;
  umamiEvent?: string;
  umamiCase?: string;
  headingLevel?: "h2" | "h3";
}

export function PosterRow({
  index,
  title,
  max = 76,
  description,
  tag,
  meta,
  action,
  href,
  external,
  umamiEvent,
  umamiCase,
  headingLevel = "h3",
}: PosterRowProps) {
  const Heading = headingLevel;
  const body = (
    <>
      <span className="poster-row-i poster-outline" aria-hidden="true">
        {pad2(index)}
      </span>
      <div className="poster-fit">
        <Heading className="poster-giant poster-up poster-row-title" style={fit(title, max, K_CAPS)}>
          {title}
        </Heading>
        {description && <p className="poster-row-desc">{description}</p>}
      </div>
      <div className="poster-row-meta">
        {tag && <span className="poster-row-tag">{tag}</span>}
        {meta}
        {action && (
          <span className="poster-row-go">
            {action} {external ? "↗" : "→"}
          </span>
        )}
      </div>
    </>
  );

  const tracking = umamiEvent ? { "data-umami-event": umamiEvent, "data-umami-event-case": umamiCase } : {};

  if (href) {
    return (
      <li>
        <Link href={href} className="poster-row-link" {...tracking}>
          {body}
        </Link>
      </li>
    );
  }
  if (external) {
    return (
      <li>
        <a href={external} target="_blank" rel="noopener noreferrer" className="poster-row-link" {...tracking}>
          {body}
        </a>
      </li>
    );
  }
  return (
    <li>
      <div className="poster-row-link">{body}</div>
    </li>
  );
}

/**
 * Trechos de uma declaração com marca-texto: os números com unidade quando houver;
 * senão, o que vem depois de dois-pontos ou travessão; senão, as três últimas palavras.
 */
export function markStatement(text: string): Array<{ text: string; mark: boolean }> {
  const byNumbers = highlightNumbers(text);
  if (byNumbers.some((s) => s.highlight)) return byNumbers.map((s) => ({ text: s.text, mark: s.highlight }));

  const cut = text.search(/[:—–]\s/);
  if (cut > 0 && cut < text.length - 4) {
    const head = text.slice(0, cut + 2);
    const tail = text.slice(cut + 2).replace(/[.!?]+$/, "");
    const end = text.slice(cut + 2 + tail.length);
    return [
      { text: head, mark: false },
      { text: tail, mark: true },
      { text: end, mark: false },
    ].filter((s) => s.text);
  }

  const words = text.replace(/[.!?]+$/, "").split(" ");
  if (words.length < 6) return [{ text, mark: false }];
  const head = words.slice(0, -3).join(" ") + " ";
  const tail = words.slice(-3).join(" ");
  return [
    { text: head, mark: false },
    { text: tail, mark: true },
    { text: text.slice(head.length + tail.length), mark: false },
  ].filter((s) => s.text);
}

/** Declaração grande com marca-texto. */
export function Statement({ text, size = "l" }: { text: string; size?: "l" | "m" }) {
  return (
    <p className={`poster-stmt${size === "m" ? " poster-stmt--m" : ""}`}>
      {markStatement(text).map((s, i) => (s.mark ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </p>
  );
}

/** Parágrafo comum com os números de resultado em negrito. */
export function BodyText({ text }: { text: string }) {
  return (
    <p className="poster-body">
      {highlightNumbers(text).map((s, i) => (s.highlight ? <strong key={i}>{s.text}</strong> : <span key={i}>{s.text}</span>))}
    </p>
  );
}

/** Cabeçalho das páginas internas: rótulo em mono, título gigante (h1) e um bloco ao lado. */
export function PageHead({
  kicker,
  title,
  max = 220,
  children,
}: {
  kicker: string;
  title: string;
  max?: number;
  children?: ReactNode;
}) {
  return (
    <header className="poster-head">
      <div className="poster-wrap poster-head-grid">
        <div className="poster-fit">
          <span className="poster-head-kicker">{kicker}</span>
          <h1 className="poster-giant poster-up" style={{ ...fit(title, max, K_CAPS), lineHeight: 0.86 }}>
            {title}
          </h1>
        </div>
        {children && <div className="poster-head-aside">{children}</div>}
      </div>
    </header>
  );
}
