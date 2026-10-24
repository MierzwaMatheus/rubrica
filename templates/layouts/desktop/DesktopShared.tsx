/**
 * Desktop Retrô — peças compartilhadas pelo Layout, pela barra de menu e pelas 5 páginas.
 *
 * O site é um sistema operacional de 1998: cada seção é uma janela com barra de título
 * listrada, caixa de fechar decorativa e sombra dura. Tudo vem das variáveis do esquema
 * (--bg, --surface, --text, --primary…); as variáveis próprias começam com --desktop-.
 *
 * Regra de ouro: nenhuma janela cobre texto. As janelas ficam numa coluna, desencontradas
 * só na horizontal (`offset`), e nunca se sobrepõem.
 */
import { useId } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { usePlugins } from "@/contexts/PluginsContext";
import { highlightNumbers } from "@/utils/homeContent";
import { cn } from "@/lib/utils";

// ---- textos próprios do layout (pt-BR e en-US) -----------------------------------------

const COPY = {
  "pt-BR": {
    os: "OS",
    desktop: "Área de trabalho",
    mainNav: "Navegação principal",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
    trash: "Lixeira",
    contact: "Contato",
    readme: "Leia-me.txt",
    hello: "Olá! Aqui é",
    numbers: "Números.app",
    items: (n: number) => `${n} ${n === 1 ? "item" : "itens"}`,
    openCase: "Abrir case",
    openProject: "Abrir projeto",
    aboutFile: "Sobre.txt",
    colName: "Nome",
    colDescription: "Descrição",
    inbox: (n: number) => `Depoimentos · Caixa de entrada (${n})`,
    inboxEmpty: "Caixa de entrada vazia por enquanto.",
    from: "De",
    newProject: "Novo projeto?",
    resumeFile: "Currículo.txt",
    colPeriod: "Período",
    colRole: "Cargo",
    colCompany: "Empresa",
    controlPanel: "Painel de Controle — Habilidades",
    portfolioWindow: "Portfólio",
    places: "Locais",
    viewIcons: "Ícones",
    viewList: "Lista",
    viewMode: "Modo de exibição",
    colCategory: "Categoria",
    colResult: "Resultado",
    colAction: "Ação",
    noCategory: "Sem categoria",
    featured: "Destaque",
    noProjects: "Esta pasta está vazia.",
    preferences: "Preferências do Sistema — Como eu trabalho",
    personalFile: "Pessoal.txt",
    photos: "Fotos — Meu dia a dia",
    interests: "Interesses",
    help: "Ajuda — Perguntas frequentes",
    notes: "Notas",
    notesCount: (n: number) => `${n} ${n === 1 ? "nota" : "notas"}`,
    rss: "Assinar o RSS",
    open: "Aberto",
    shared: {
      case: "Case.doc",
      post: "Post.txt",
      testimonials: "Depoimentos",
      proposal: "Proposta.doc",
      checkout: "Pagamento",
      other: "Janela",
    },
  },
  "en-US": {
    os: "OS",
    desktop: "Desktop",
    mainNav: "Main navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    trash: "Trash",
    contact: "Contact",
    readme: "ReadMe.txt",
    hello: "Hi! This is",
    numbers: "Numbers.app",
    items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    openCase: "Open case",
    openProject: "Open project",
    aboutFile: "About.txt",
    colName: "Name",
    colDescription: "Description",
    inbox: (n: number) => `Testimonials · Inbox (${n})`,
    inboxEmpty: "Inbox is empty for now.",
    from: "From",
    newProject: "New project?",
    resumeFile: "Resume.txt",
    colPeriod: "Period",
    colRole: "Role",
    colCompany: "Company",
    controlPanel: "Control Panel — Skills",
    portfolioWindow: "Portfolio",
    places: "Places",
    viewIcons: "Icons",
    viewList: "List",
    viewMode: "View mode",
    colCategory: "Category",
    colResult: "Result",
    colAction: "Action",
    noCategory: "No category",
    featured: "Featured",
    noProjects: "This folder is empty.",
    preferences: "System Preferences — How I work",
    personalFile: "Personal.txt",
    photos: "Photos — My day to day",
    interests: "Interests",
    help: "Help — Frequently asked questions",
    notes: "Notes",
    notesCount: (n: number) => `${n} ${n === 1 ? "note" : "notes"}`,
    rss: "Subscribe via RSS",
    open: "Open",
    shared: {
      case: "Case.doc",
      post: "Post.txt",
      testimonials: "Testimonials",
      proposal: "Proposal.doc",
      checkout: "Payment",
      other: "Window",
    },
  },
};

export type DesktopCopy = (typeof COPY)["pt-BR"];

/** Textos próprios do layout no idioma atual. */
export function useDesktopCopy(): DesktopCopy {
  const { locale } = useI18n();
  return locale === "en-US" ? COPY["en-US"] : COPY["pt-BR"];
}

// ---- navegação ---------------------------------------------------------------------------

type NavPlugin = "resume" | "portfolio" | "about" | "blog";

const NAV: Array<{ key: "home" | NavPlugin; href: string; plugin?: NavPlugin }> = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", plugin: "resume" },
  { key: "portfolio", href: "/portfolio", plugin: "portfolio" },
  { key: "about", href: "/sobre", plugin: "about" },
  { key: "blog", href: "/blog", plugin: "blog" },
];

export type DesktopNavItem = (typeof NAV)[number];

/** Itens de navegação com os plugins desligados já removidos. */
export function useDesktopNav(): DesktopNavItem[] {
  const { isEnabled } = usePlugins();
  return NAV.filter((item) => !item.plugin || isEnabled(item.plugin));
}

export function isActivePath(location: string, href: string): boolean {
  return href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);
}

// ---- utilidades de texto -----------------------------------------------------------------

/** Data curta no idioma atual ("12 mar. 2026"). Data inválida vira texto vazio. */
export function formatDate(value: string | number | undefined, locale: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

/** Minutos de leitura (200 palavras por minuto), ignorando as tags HTML. */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Corta um texto longo no limite de palavras, com reticências. */
export function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max).trimEnd()}…`;
}

/** Parágrafo com os números de resultado em destaque. */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((segment, i) =>
        segment.highlight ? <strong key={i}>{segment.text}</strong> : <span key={i}>{segment.text}</span>,
      )}
    </>
  );
}

// ---- peças visuais -----------------------------------------------------------------------

/** Cores de marca em rodízio para ícones e marcadores decorativos. */
export const ICON_COLORS = ["var(--primary)", "var(--accent)", "var(--accent-2)"] as const;

type IconKind = "folder" | "doc" | "trash";

/** Ícone desenhado em CSS (pasta, documento, lixeira). Sempre decorativo. */
export function DeskIcon({ kind, color }: { kind: IconKind; color?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`dk-glyph dk-glyph-${kind}`}
      style={color ? ({ "--desktop-ic": color } as React.CSSProperties) : undefined}
    />
  );
}

type HeadingTag = "h1" | "h2" | "h3" | "div";

interface WindowProps {
  /** Texto da barra de título. */
  title: React.ReactNode;
  /** Elemento da barra de título: um título de verdade ou só decoração ("div"). */
  titleAs?: HeadingTag;
  /** Janela em foco: barra de título na primária. */
  active?: boolean;
  /** Largura máxima em px (no celular, a largura toda). */
  width?: number;
  /** Deslocamento horizontal em px (some quando não cabe e no celular). */
  offset?: number;
  /** Deslocamento vertical em px, só dentro de um `WindowCluster` (janelas lado a lado). */
  drop?: number;
  id?: string;
  className?: string;
  /** Barra de status no rodapé da janela. */
  status?: React.ReactNode;
  children: React.ReactNode;
}

/** Uma janela do sistema: barra de título listrada, caixa de fechar decorativa e sombra dura. */
export function Window({
  title,
  titleAs = "h2",
  active = false,
  width,
  offset,
  drop,
  id,
  className,
  status,
  children,
}: WindowProps) {
  const titleId = useId();
  const Title = titleAs;
  const vars: Record<string, string> = {};
  if (width) vars["--desktop-w"] = `${width}px`;
  if (offset) vars["--desktop-x"] = `${offset}px`;
  if (drop) vars["--desktop-y"] = `${drop}px`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("dk-win", active && "on", className)}
      style={vars as React.CSSProperties}
    >
      <div className="dk-title">
        <span className="dk-x" aria-hidden="true" />
        <Title id={titleId} className="dk-title-text">
          {title}
        </Title>
      </div>
      <div className="dk-body">{children}</div>
      {status && <div className="dk-status">{status}</div>}
    </section>
  );
}

/** Coluna de janelas da página. */
export function WindowStack({ children }: { children: React.ReactNode }) {
  return <div className="dk-wins">{children}</div>;
}

/** Janelas menores lado a lado (quebram linha quando não cabem; nunca se sobrepõem). */
export function WindowCluster({ children }: { children: React.ReactNode }) {
  return <div className="dk-cluster">{children}</div>;
}

/** Luz de "disponível" do Leia-me. */
export function Led({ label }: { label: string }) {
  return (
    <span className="dk-led">
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

/** Números de destaque em caixas (a janela some quando não há números). */
export function MetricsGrid({ metrics }: { metrics: Array<{ value: string; label: string }> }) {
  return (
    <dl className="dk-met">
      {metrics.map((m) => (
        <div key={`${m.value}-${m.label}`}>
          <dt className="dk-sr">{m.label}</dt>
          <dd className="dk-met-value">{m.value}</dd>
          <dd className="dk-met-label" aria-hidden="true">
            {m.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---- estilos -----------------------------------------------------------------------------

/** Folha de estilos do layout, aplicada uma vez pelo Layout.tsx. */
export const DESKTOP_CSS = `
.dk {
  --desktop-shadow: color-mix(in srgb, var(--text) 85%, transparent);
  --desktop-dot: color-mix(in srgb, var(--text) 16%, transparent);
  --desktop-hover: color-mix(in srgb, var(--text) 8%, var(--surface));
  min-height: 100vh;
  background-color: var(--subtle);
  background-image: radial-gradient(var(--desktop-dot) 1px, transparent 1.5px);
  background-size: 14px 14px;
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 14.5px;
  line-height: 1.5;
}
.dk *, .dk *::before, .dk *::after { box-sizing: border-box; }
.dk :focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; }
.dk a { color: inherit; }
.dk h1, .dk h2, .dk h3, .dk h4 { letter-spacing: -0.01em; }
.dk-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.dk-mono { font-family: var(--font-mono); }
.dk-muted { color: var(--text-muted); }

/* ---- barra de menu ---- */
.dk-bar { position: sticky; top: 0; z-index: 40; min-height: 34px; display: flex; align-items: center; gap: 4px; padding: 0 10px; background: var(--surface); border-bottom: 2px solid var(--text); font-size: 13.5px; }
.dk-brand { font-weight: 700; font-size: 14px; padding: 3px 8px; white-space: nowrap; text-decoration: none; }
.dk-brand:hover { background: var(--subtle); }
.dk-nav { display: flex; align-items: center; gap: 2px; margin: 0; padding: 0; list-style: none; }
.dk-nav a { display: block; padding: 3px 10px; text-decoration: none; white-space: nowrap; }
.dk-nav a:hover { background: var(--subtle); }
.dk-nav a[aria-current="page"] { background: var(--text); color: var(--bg); }
.dk-bar-end { margin-left: auto; display: flex; align-items: center; gap: 14px; font-family: var(--font-mono); font-size: 12.5px; white-space: nowrap; }
.dk-clock { font-variant-numeric: tabular-nums; }
.dk-menu-btn { display: none; align-items: center; gap: 6px; background: none; border: 2px solid transparent; color: inherit; font: inherit; padding: 2px 6px; cursor: pointer; }
.dk-menu-btn[aria-expanded="true"] { background: var(--text); color: var(--bg); }
.dk-menu { position: absolute; top: calc(100% + 2px); right: 8px; min-width: 210px; margin: 0; padding: 4px 0; list-style: none; background: var(--surface); border: 2px solid var(--text); box-shadow: 4px 4px 0 var(--desktop-shadow); font-family: var(--font-sans); font-size: 15px; }
.dk-menu a { display: block; padding: 9px 16px; text-decoration: none; }
.dk-menu a:hover, .dk-menu a[aria-current="page"] { background: var(--primary); color: var(--on-primary); }

/* ---- área de trabalho ---- */
.dk-desk { display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 24px; max-width: 1440px; margin: 0 auto; padding: 28px 24px 80px; }
.dk-icons { position: sticky; top: 62px; align-self: start; display: flex; flex-direction: column; align-items: center; gap: 14px; margin: 0; padding: 0; list-style: none; }
.dk-ic { width: 96px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 4px 0; background: none; border: 0; color: var(--text); font: inherit; font-size: 12px; line-height: 1.2; text-align: center; text-decoration: none; cursor: pointer; }
.dk-ic-label { background: var(--surface); padding: 1px 5px; border-radius: 2px; }
.dk-ic[aria-current="page"] .dk-ic-label, .dk-ic:hover .dk-ic-label { background: var(--primary); color: var(--on-primary); }
.dk-ic-static { cursor: default; }
.dk-ic-static:hover .dk-ic-label { background: var(--surface); color: var(--text); }

.dk-glyph { display: block; flex: none; }
.dk-glyph-folder { width: 54px; height: 38px; margin-top: 10px; position: relative; background: var(--desktop-ic, var(--primary)); border: 2px solid var(--text); border-radius: 0 3px 3px 3px; }
.dk-glyph-folder::before { content: ""; position: absolute; left: -2px; top: -10px; width: 22px; height: 8px; background: var(--desktop-ic, var(--primary)); border: 2px solid var(--text); border-bottom: 0; border-radius: 3px 3px 0 0; }
.dk-glyph-doc { width: 40px; height: 50px; padding: 8px 6px; background-color: var(--surface); background-image: repeating-linear-gradient(transparent 0 7px, var(--line) 7px 9px); background-clip: content-box; border: 2px solid var(--text); }
.dk-glyph-trash { width: 38px; height: 42px; margin-top: 10px; position: relative; padding: 6px 4px 6px 6px; border: 2px solid var(--text); border-radius: 0 0 6px 6px; background: repeating-linear-gradient(90deg, transparent 0 8px, var(--text) 8px 10px) content-box, var(--surface); }
.dk-glyph-trash::before { content: ""; position: absolute; top: -10px; left: -7px; width: 46px; height: 5px; border: 2px solid var(--text); background: var(--surface); }

/* ---- janelas ---- */
.dk-wins { display: flex; flex-direction: column; align-items: flex-start; gap: 32px; min-width: 0; padding-right: 8px; }
.dk-cluster { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 28px 32px; width: 100%; }
.dk-win {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, var(--desktop-w, 100%));
  margin-left: clamp(0px, var(--desktop-x, 0px), calc(100% - min(100%, var(--desktop-w, 100%))));
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--text);
  box-shadow: 5px 5px 0 var(--desktop-shadow);
  animation: dk-open 0.24s steps(4, end) both;
}
.dk-cluster > .dk-win { margin-left: 0; margin-top: var(--desktop-y, 0px); }
.dk-win[id] { scroll-margin-top: 60px; }
.dk-title { position: relative; flex: none; min-height: 28px; display: flex; align-items: center; justify-content: center; padding: 3px 30px; border-bottom: 2px solid var(--text); background: repeating-linear-gradient(var(--surface) 0 3px, var(--line) 3px 5px); }
.dk-title-text { margin: 0; padding: 0 10px; background: var(--surface); font-family: var(--font-sans); font-size: 13px; font-weight: 600; line-height: 1.4; letter-spacing: 0; text-align: center; }
.dk-win.on .dk-title { background: var(--primary); color: var(--on-primary); }
.dk-win.on .dk-title-text { background: var(--primary); }
.dk-x { position: absolute; left: 8px; top: 7px; width: 12px; height: 12px; border: 2px solid currentColor; }
.dk-body { min-width: 0; flex: 1; }
.dk-pad { padding: 22px 26px; }
.dk-status { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px 14px; padding: 4px 10px; border-top: 2px solid var(--text); font-family: var(--font-mono); font-size: 12px; }
.dk-status a, .dk-status button { color: inherit; text-decoration: underline; text-underline-offset: 3px; background: none; border: 0; padding: 0; font: inherit; cursor: pointer; }
.dk-empty { padding: 26px; color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; }

/* ---- botões ---- */
.dk-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
.dk-row.end { justify-content: flex-end; }
.dk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 16px; border: 2px solid var(--text); border-radius: 6px; background: var(--surface); color: var(--text); box-shadow: inset -2px -2px 0 var(--line); font: inherit; font-size: 13.5px; font-weight: 600; line-height: 1.35; text-decoration: none; cursor: pointer; }
.dk-btn:hover { background: var(--desktop-hover); }
.dk-btn:active { box-shadow: inset 2px 2px 0 var(--line); }
.dk-btn.pri { background: var(--primary); color: var(--on-primary); box-shadow: none; }
.dk-btn.pri:hover { background: color-mix(in srgb, var(--primary) 86%, var(--text)); }
.dk-btn.def { outline: 2px solid var(--text); outline-offset: 2px; }
.dk-btn.def:focus-visible { outline: 3px solid var(--primary); }
.dk-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ---- Leia-me (hero) ---- */
.dk-hero { display: flex; flex-direction: column; gap: 10px; }
.dk-led { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; font-family: var(--font-mono); font-size: 12.5px; }
.dk-led i { width: 11px; height: 11px; border-radius: 50%; background: var(--accent-2); border: 2px solid var(--text); animation: dk-pulse 1.6s steps(2, jump-none) infinite; }
.dk-hi { margin: 0; font-size: 17px; }
.dk-role { margin: 0; font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); }
.dk-hero h1 { margin: 2px 0 0; font-size: clamp(28px, 3.2vw, 40px); line-height: 1.08; font-weight: 700; }
.dk-desc { margin: 0; color: var(--text-muted); }
.dk-caret { display: inline-block; width: 8px; height: 1em; margin-left: 3px; vertical-align: -2px; background: currentColor; animation: dk-blink 1s steps(1) infinite; }

/* ---- números ---- */
.dk-met { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 14px; }
.dk-met > div { display: flex; flex-direction: column; padding: 10px 12px; border: 2px solid var(--text); background: var(--bg); }
.dk-met dd { margin: 0; }
.dk-met-value { font-size: 28px; font-weight: 700; line-height: 1.1; color: var(--text-strong); }
.dk-met-label { font-size: 12.5px; color: var(--text-muted); line-height: 1.35; }

/* ---- pasta em modo ícones ---- */
.dk-icongrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 18px; margin: 0; padding: 18px; list-style: none; }
.dk-file { display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 6px; border: 2px dashed transparent; text-decoration: none; font-size: 13px; }
a.dk-file:hover, .dk-file:focus-within { border-color: var(--text); }
.dk-file h2, .dk-file h3 { margin: 4px 0 0; font-size: 15.5px; font-weight: 700; line-height: 1.25; }
.dk-file p { margin: 0; }
.dk-thumb { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 16 / 10; margin-bottom: 6px; overflow: hidden; border: 2px solid var(--text); background: color-mix(in srgb, var(--desktop-ic, var(--primary)) 30%, var(--surface)); font-size: 34px; font-weight: 700; color: var(--text); }
.dk-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dk-tag { align-self: flex-start; display: inline-flex; flex-wrap: wrap; gap: 0 6px; padding: 1px 6px; border: 1.5px solid var(--text); background: var(--bg); font-family: var(--font-mono); font-size: 11.5px; line-height: 1.45; }
.dk-tag b { font-weight: 700; }
.dk-link { align-self: flex-start; margin-top: auto; padding-top: 4px; font-size: 13px; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }

/* ---- texto (.txt) ---- */
.dk-txt { display: flex; flex-direction: column; gap: 12px; font-family: var(--font-mono); font-size: 13.5px; line-height: 1.7; }
.dk-txt p { margin: 0; }
.dk-txt strong, .dk-strong strong { font-weight: 700; text-decoration: underline; text-decoration-color: var(--primary); text-decoration-thickness: 2px; text-underline-offset: 3px; }

/* ---- lista do Finder ---- */
.dk-list { margin: 0; padding: 0; list-style: none; }
.dk-lh, .dk-li { display: grid; grid-template-columns: var(--desktop-cols, 200px minmax(0, 1fr)); gap: 6px 18px; padding: 9px 14px; font-size: 13.5px; }
.dk-lh { padding: 4px 14px; background: var(--subtle); border-bottom: 2px solid var(--text); font-size: 12px; font-weight: 600; }
.dk-li { border-bottom: 1px solid var(--line); align-items: start; }
.dk-li:last-child { border-bottom: 0; }
.dk-li-name { display: flex; align-items: flex-start; gap: 8px; margin: 0; font-size: inherit; font-weight: 600; line-height: 1.4; }
.dk-li-full { grid-column: 1 / -1; }
.dk-sq { flex: none; width: 12px; height: 12px; margin-top: 4px; border: 1.5px solid var(--text); background: var(--desktop-ic, var(--primary)); }
.dk-li-desc { color: var(--text-muted); }
.dk-li-desc p, .dk-li-desc ul { margin: 0; }
.dk-li-desc ul { padding-left: 18px; list-style: disc; }
.dk-li-desc li + li { margin-top: 2px; }

/* ---- caixa de entrada ---- */
.dk-mail { display: grid; grid-template-columns: 250px minmax(0, 1fr); min-height: 240px; }
.dk-mail-list { margin: 0; padding: 0; list-style: none; border-right: 2px solid var(--text); background: var(--bg); }
.dk-mail-item { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 10px 12px; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: inherit; font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; }
.dk-mail-item:hover { background: var(--subtle); }
.dk-mail-item small { color: var(--text-muted); font-size: 12px; line-height: 1.35; }
.dk-mail-item[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.dk-mail-item[aria-pressed="true"] small { color: inherit; opacity: 0.9; }
.dk-msg { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding: 16px 20px; }
.dk-msg-from { margin: 0; font-family: var(--font-mono); font-size: 12.5px; color: var(--text-muted); }
.dk-msg blockquote { margin: 0; font-size: 16px; line-height: 1.6; }

/* ---- caixa de diálogo ---- */
.dk-dlg { display: flex; gap: 18px; padding: 22px; }
.dk-bang { flex: none; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 2.5px solid var(--text); border-radius: 50%; background: var(--accent); color: var(--on-accent); font-weight: 800; font-size: 24px; font-style: normal; }
.dk-dlg-title { margin: 0 0 4px; font-size: 21px; font-weight: 700; line-height: 1.2; }
.dk-dlg p { margin: 0 0 14px; color: var(--text-muted); }

/* ---- painel de controle / preferências ---- */
.dk-panels { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; margin: 0; padding: 16px; list-style: none; }
.dk-panel { display: flex; gap: 12px; padding: 14px; border: 2px solid var(--text); background: var(--bg); }
.dk-panel-col { flex-direction: column; gap: 10px; }
.dk-panel-head { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 14px; font-weight: 700; line-height: 1.3; }
.dk-panel-ic { flex: none; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 2px solid var(--text); background: var(--primary); color: var(--on-primary); font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
.dk-panel-ic.alt { background: var(--accent); color: var(--on-accent); }
.dk-panel h3 { margin: 0; font-size: 14.5px; font-weight: 700; line-height: 1.3; }
.dk-panel p { margin: 4px 0 0; font-size: 13.5px; color: var(--text-muted); }
.dk-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.dk-chip { display: inline-block; padding: 2px 8px; border: 1.5px solid var(--text); border-radius: 3px; background: var(--surface); font-size: 12.5px; line-height: 1.45; }

/* ---- pasta do portfólio ---- */
.dk-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 14px; padding: 8px 12px; border-bottom: 2px solid var(--text); background: var(--subtle); font-size: 13px; }
.dk-seg { display: inline-flex; border: 2px solid var(--text); border-radius: 6px; overflow: hidden; }
.dk-seg button { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border: 0; background: var(--surface); color: var(--text); font: inherit; font-size: 12.5px; cursor: pointer; }
.dk-seg button + button { border-left: 2px solid var(--text); }
.dk-seg button[aria-pressed="true"] { background: var(--text); color: var(--bg); }
.dk-folder { display: grid; grid-template-columns: 190px minmax(0, 1fr); }
.dk-places { padding: 12px 0; border-right: 2px solid var(--text); background: var(--bg); }
.dk-places-title { margin: 0 0 6px; padding: 0 14px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
.dk-places ul { margin: 0; padding: 0; list-style: none; }
.dk-place { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 14px; border: 0; background: none; color: inherit; font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; }
.dk-place:hover { background: var(--subtle); }
.dk-place[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.dk-place .dk-sq { margin-top: 0; }
.dk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 20px; margin: 0; padding: 18px; list-style: none; }
.dk-grid > .big { grid-column: span 2; }
.dk-grid > .big .dk-thumb { aspect-ratio: 16 / 8; }
.dk-badge { position: absolute; top: 8px; left: 8px; padding: 1px 7px; border: 2px solid var(--text); background: var(--accent); color: var(--on-accent); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }

/* ---- notas (blog) ---- */
.dk-notes { display: grid; grid-template-columns: 310px minmax(0, 1fr); min-height: 440px; }
.dk-notes-list { margin: 0; padding: 0; list-style: none; border-right: 2px solid var(--text); background: var(--bg); }
.dk-note { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border-bottom: 1px solid var(--line); text-decoration: none; }
.dk-note:hover { background: var(--subtle); }
.dk-note.on { background: var(--primary); color: var(--on-primary); }
.dk-note.on .dk-muted { color: inherit; opacity: 0.9; }
.dk-note-title { font-weight: 700; font-size: 14px; line-height: 1.3; }
.dk-note-meta { font-family: var(--font-mono); font-size: 11.5px; }
.dk-view { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 22px 26px; }
.dk-view h2 { margin: 0; font-size: clamp(22px, 2.4vw, 30px); font-weight: 700; line-height: 1.15; }
.dk-view p { margin: 0; }
.dk-cover { aspect-ratio: 16 / 7; overflow: hidden; border: 2px solid var(--text); background: color-mix(in srgb, var(--accent) 30%, var(--surface)); }
.dk-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ---- fotos e ajuda (sobre) ---- */
.dk-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; margin: 0; padding: 16px; list-style: none; }
.dk-photos figure { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.dk-photos img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border: 2px solid var(--text); display: block; background: var(--subtle); }
.dk-photos figcaption { font-size: 13px; line-height: 1.45; }
.dk-help details { border-bottom: 1px solid var(--line); }
.dk-help details:last-child { border-bottom: 0; }
.dk-help summary { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; font-weight: 600; cursor: pointer; list-style: none; }
.dk-help summary::-webkit-details-marker { display: none; }
.dk-help summary:hover { background: var(--subtle); }
.dk-help-q { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 2px solid var(--text); border-radius: 50%; font-size: 12px; font-weight: 800; }
.dk-help details[open] .dk-help-q { background: var(--primary); color: var(--on-primary); }
.dk-help-a { margin: 0; padding: 0 16px 14px 46px; color: var(--text-muted); white-space: pre-wrap; }

/* ---- páginas do app (case, post, depoimentos…) ---- */
.dk-shared { padding: 24px 28px 32px; }

/* ---- animações ---- */
@keyframes dk-open { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes dk-blink { 50% { opacity: 0; } }
@keyframes dk-pulse { 50% { background: var(--surface); } }
@media (prefers-reduced-motion: reduce) {
  .dk *, .dk *::before, .dk *::after { animation: none !important; transition: none !important; }
}

/* ---- tablet ---- */
@media (max-width: 1023px) {
  .dk-folder { grid-template-columns: 160px minmax(0, 1fr); }
  .dk-notes { grid-template-columns: 250px minmax(0, 1fr); }
}

/* ---- celular ---- */
@media (max-width: 767px) {
  .dk { font-size: 15px; overflow-x: clip; }
  .dk-nav { display: none; }
  .dk-menu-btn { display: inline-flex; }
  .dk-weekday { display: none; }
  .dk-bar-end { gap: 10px; }
  .dk-desk { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 14px 16px 56px; }
  .dk-icons { position: static; flex-direction: row; align-items: flex-start; gap: 2px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
  .dk-icons > li { flex: none; }
  .dk-ic { width: 78px; font-size: 11.5px; }
  .dk-glyph-folder { transform: scale(0.85); }
  .dk-glyph-doc { transform: scale(0.85); }
  .dk-wins { gap: 22px; padding-right: 4px; }
  .dk-cluster { gap: 22px; }
  .dk-win, .dk-cluster > .dk-win { width: calc(100% - 4px); margin-left: 0; margin-top: 0; box-shadow: 4px 4px 0 var(--desktop-shadow); }
  .dk-pad { padding: 18px 16px; }
  .dk-shared { padding: 18px 14px 24px; }
  .dk-lh { display: none; }
  .dk-li { grid-template-columns: minmax(0, 1fr); gap: 3px; padding: 10px 14px; }
  .dk-mail, .dk-notes, .dk-folder { grid-template-columns: minmax(0, 1fr); }
  .dk-mail-list, .dk-notes-list { border-right: 0; border-bottom: 2px solid var(--text); }
  .dk-notes .dk-view { order: -1; border-bottom: 2px solid var(--text); }
  .dk-notes-list { border-bottom: 0; }
  .dk-places { display: flex; align-items: center; gap: 4px; padding: 8px; overflow-x: auto; border-right: 0; border-bottom: 2px solid var(--text); }
  .dk-places-title { margin: 0 6px 0 4px; padding: 0; flex: none; }
  .dk-places ul { display: flex; gap: 4px; }
  .dk-place { width: auto; white-space: nowrap; padding: 5px 10px; }
  .dk-grid, .dk-icongrid { grid-template-columns: minmax(0, 1fr); padding: 14px; gap: 18px; }
  .dk-grid > .big { grid-column: auto; }
  .dk-grid > .big .dk-thumb { aspect-ratio: 16 / 10; }
  .dk-dlg { flex-direction: column; gap: 12px; padding: 18px 16px; }
  .dk-row.end { justify-content: flex-start; }
  .dk-met { padding: 12px; gap: 8px; }
  .dk-met-value { font-size: 24px; }
  .dk-view { padding: 18px 16px; }
  .dk-panels { grid-template-columns: minmax(0, 1fr); padding: 12px; }
  .dk-photos { grid-template-columns: minmax(0, 1fr); }
  .dk-help-a { padding-left: 16px; }
}
`;
