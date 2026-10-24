/**
 * Peças compartilhadas do layout Conversa: textos próprios (pt-BR e en-US), a folha de estilo
 * do layout e os componentes da conversa (balões, perguntas, cartões de link, anexos…).
 *
 * As cores vêm só do esquema (`var(--bg)`, `var(--surface)`, `var(--primary)`…), então o layout
 * funciona em qualquer esquema e nos dois modos. Texto sobre a primária usa `--on-primary`.
 */
import { useId } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ChevronRight, FileDown } from "lucide-react";
import { useI18n } from "@/i18n/context/I18nContext";
import { highlightNumbers } from "@/utils/homeContent";

// ---- textos do layout ---------------------------------------------------------------------

export interface ChatText {
  today: string;
  hello: (name: string) => string;
  sectionIntro: string;
  sectionNumbers: string;
  qNumbers: string;
  qCases: string;
  casesIntro: (n: number) => string;
  qAbout: string;
  moreAbout: string;
  qServices: string;
  qTestimonials: string;
  testimonialsIntro: string;
  forwarded: string;
  qResume: string;
  cvIntro: string;
  cvFile: string;
  cvHint: string;
  cvDownload: string;
  qResumeNumbers: string;
  qExperience: string;
  qSkills: string;
  qSoft: string;
  qLanguages: string;
  qEducation: string;
  qCourses: string;
  qVolunteer: string;
  qProjects: string;
  projectsIntro: (n: number) => string;
  filterLabel: string;
  filterAsk: (category: string) => string;
  filterAll: string;
  filterAnswer: (n: number) => string;
  noProjects: string;
  featured: string;
  readCase: string;
  openProject: string;
  qWho: string;
  qPrinciples: string;
  qPersonal: string;
  qRoutine: string;
  qInterests: string;
  qBlog: string;
  blogIntro: (n: number) => string;
  rss: string;
  quickReplies: string;
  qrHome: string;
  qrPortfolio: string;
  qrResume: string;
  qrAbout: string;
  qrBlog: string;
  navLabel: string;
  switchLanguage: string;
  langShort: string;
}

const PT: ChatText = {
  today: "hoje",
  hello: (name) => (name ? `Oi! Eu sou ${name}.` : "Oi!"),
  sectionIntro: "Apresentação",
  sectionNumbers: "Números",
  qNumbers: "Me mostra uns números",
  qCases: "Quais projetos você destaca?",
  casesIntro: (n) => (n === 1 ? "Este aqui:" : n === 2 ? "Esses dois:" : "Esses três:"),
  qAbout: "Me conta mais sobre você",
  moreAbout: "mais sobre mim",
  qServices: "O que você faz?",
  qTestimonials: "Quem já trabalhou com você?",
  testimonialsIntro: "Algumas mensagens que recebi:",
  forwarded: "encaminhada",
  qResume: "Me conta sua trajetória",
  cvIntro: "Deixo meu currículo completo aqui também:",
  cvFile: "CV.pdf",
  cvHint: "PDF · gerado na hora · toque para baixar",
  cvDownload: "Baixar o currículo em PDF",
  qResumeNumbers: "E em números?",
  qExperience: "Onde você já trabalhou?",
  qSkills: "Com o que você trabalha?",
  qSoft: "E fora da parte técnica?",
  qLanguages: "Quais idiomas você fala?",
  qEducation: "Onde você estudou?",
  qCourses: "Fez cursos ou certificações?",
  qVolunteer: "Faz algum trabalho voluntário?",
  qProjects: "Me mostra seus projetos",
  projectsIntro: (n) =>
    n === 1 ? "Tenho 1 projeto publicado por aqui." : `Tenho ${n} projetos publicados por aqui. Quer ver de alguma área?`,
  filterLabel: "Filtrar projetos por área",
  filterAsk: (c) => `Só os de ${c}`,
  filterAll: "Pode mostrar todos",
  filterAnswer: (n) => (n === 1 ? "Tenho este:" : `Separei ${n}:`),
  noProjects: "Ainda não publiquei projetos por aqui. Volta em breve!",
  featured: "destaque",
  readCase: "ler o case",
  openProject: "abrir o projeto",
  qWho: "Quem é você?",
  qPrinciples: "Como você trabalha?",
  qPersonal: "E fora do trabalho?",
  qRoutine: "Como é o seu dia a dia?",
  qInterests: "No que você mais gosta de trabalhar?",
  qBlog: "O que você tem escrito?",
  blogIntro: (n) => (n === 1 ? "Por enquanto, um texto:" : `${n} textos até agora. Começa por este:`),
  rss: "assinar o RSS",
  quickReplies: "Respostas rápidas",
  qrHome: "Voltar ao início",
  qrPortfolio: "Ver projetos",
  qrResume: "Ver currículo",
  qrAbout: "Quem é você?",
  qrBlog: "Ler o blog",
  navLabel: "Navegação principal",
  switchLanguage: "Mudar o idioma para inglês",
  langShort: "EN",
};

const EN: ChatText = {
  today: "today",
  hello: (name) => (name ? `Hi! I'm ${name}.` : "Hi!"),
  sectionIntro: "Introduction",
  sectionNumbers: "Numbers",
  qNumbers: "Show me some numbers",
  qCases: "Which projects would you highlight?",
  casesIntro: (n) => (n === 1 ? "This one:" : n === 2 ? "These two:" : "These three:"),
  qAbout: "Tell me more about yourself",
  moreAbout: "more about me",
  qServices: "What do you do?",
  qTestimonials: "Who has worked with you?",
  testimonialsIntro: "A few messages I got:",
  forwarded: "forwarded",
  qResume: "Walk me through your career",
  cvIntro: "Here's my full résumé too:",
  cvFile: "CV.pdf",
  cvHint: "PDF · generated on the spot · tap to download",
  cvDownload: "Download the résumé as PDF",
  qResumeNumbers: "And in numbers?",
  qExperience: "Where have you worked?",
  qSkills: "What do you work with?",
  qSoft: "And beyond the technical side?",
  qLanguages: "Which languages do you speak?",
  qEducation: "Where did you study?",
  qCourses: "Any courses or certifications?",
  qVolunteer: "Do you do any volunteer work?",
  qProjects: "Show me your projects",
  projectsIntro: (n) =>
    n === 1 ? "I have 1 project published here." : `I have ${n} projects published here. Want to see a specific area?`,
  filterLabel: "Filter projects by area",
  filterAsk: (c) => `Just ${c}`,
  filterAll: "Show me all of them",
  filterAnswer: (n) => (n === 1 ? "Here it is:" : `Here are ${n}:`),
  noProjects: "No projects published here yet. Check back soon!",
  featured: "featured",
  readCase: "read the case",
  openProject: "open the project",
  qWho: "Who are you?",
  qPrinciples: "How do you work?",
  qPersonal: "And outside work?",
  qRoutine: "What does your day look like?",
  qInterests: "What do you enjoy working on most?",
  qBlog: "What have you been writing?",
  blogIntro: (n) => (n === 1 ? "So far, one piece:" : `${n} pieces so far. Start with this one:`),
  rss: "subscribe via RSS",
  quickReplies: "Quick replies",
  qrHome: "Back to start",
  qrPortfolio: "See projects",
  qrResume: "See résumé",
  qrAbout: "Who are you?",
  qrBlog: "Read the blog",
  navLabel: "Main navigation",
  switchLanguage: "Switch language to Portuguese",
  langShort: "PT",
};

export const CHAT_TEXT: Record<"pt-BR" | "en-US", ChatText> = { "pt-BR": PT, "en-US": EN };

/** Textos do layout no idioma atual. */
export function useChatText(): ChatText {
  const { locale } = useI18n();
  return CHAT_TEXT[locale === "en-US" ? "en-US" : "pt-BR"];
}

/** Data curta no idioma atual (ex.: "12 de mar. de 2026"). Vazio quando a data é inválida. */
export function formatChatDate(value: string | number | undefined, locale: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "en-US" ? "en-US" : "pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

/** Minutos de leitura, no mesmo cálculo das páginas do app (200 palavras por minuto). */
export function readingMinutes(content: string): number {
  return Math.max(1, Math.ceil(content.split(" ").length / 200));
}

/** Até duas iniciais do nome ("Alex Rocha" → "AR"). */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ---- estilo ---------------------------------------------------------------------------------

export const CHAT_CSS = `
.ct-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); color: var(--text); font-family: var(--font-sans); }
.ct-root *, .ct-root *::before, .ct-root *::after { box-sizing: border-box; }
.ct-root :where(a, button):focus-visible { outline: 2px solid var(--text); outline-offset: 2px; border-radius: 6px; }
.ct-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ct-main { flex: 1; min-width: 0; }

/* cabeçalho */
.ct-h { position: sticky; top: 0; z-index: 40; height: 64px; display: flex; align-items: center; gap: 12px; padding: 0 40px;
  background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line); }
.ct-who { display: flex; align-items: center; gap: 12px; min-width: 0; color: inherit; text-decoration: none; }
.ct-av { flex: none; width: 38px; height: 38px; border-radius: 50%; background: var(--primary); color: var(--on-primary);
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; overflow: hidden; }
.ct-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-id { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.ct-id b { font-weight: 700; color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-id small { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--primary);
  margin-right: 6px; vertical-align: 1px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent); }
.ct-nav { margin-left: auto; display: flex; align-items: center; gap: 2px; font-size: 13.5px; }
.ct-nav a { color: var(--text-muted); text-decoration: none; padding: 6px 10px; border-radius: 999px; white-space: nowrap; }
.ct-nav a:hover { color: var(--text); background: var(--subtle); }
.ct-nav a[aria-current="page"] { color: var(--text); background: var(--subtle); font-weight: 600; }
.ct-tools { display: flex; align-items: center; gap: 4px; margin-left: 8px; padding-left: 10px; border-left: 1px solid var(--line); flex: none; }
.ct-tool { width: 34px; height: 34px; border-radius: 50% !important; display: inline-flex !important; align-items: center; justify-content: center;
  color: var(--text-muted) !important; }
.ct-tool:hover { color: var(--text) !important; background: var(--subtle) !important; }
.ct-lang { font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; background: none; border: 0; cursor: pointer; }

/* conversa */
.ct-log { width: 100%; max-width: 652px; margin: 0 auto; padding: 26px 16px 36px; display: flex; flex-direction: column; gap: 10px; }
.ct-log > section, .ct-group { display: flex; flex-direction: column; gap: 10px; }
.ct-day { align-self: center; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); padding: 2px 10px;
  border-radius: 999px; background: var(--subtle); }
.ct-m { max-width: min(470px, 88%); padding: 10px 14px; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; margin: 0; }
.ct-m.wide { max-width: min(580px, 100%); }
.ct-m.in { align-self: flex-start; background: var(--surface); border: 1px solid var(--line); border-radius: 16px 16px 16px 4px; }
.ct-m.out { align-self: flex-end; background: var(--primary); color: var(--on-primary); border-radius: 16px 16px 4px 16px;
  margin-top: 10px; font-weight: 500; }
.ct-m p { margin: 0; }
.ct-m p + p { margin-top: 8px; }
.ct-m strong.ct-num { font-weight: 700; color: var(--text-strong); background: color-mix(in srgb, var(--primary) 16%, transparent);
  border-radius: 4px; padding: 0 3px; }
.ct-m ul { margin: 6px 0 0; padding-left: 18px; }
.ct-m li + li { margin-top: 2px; }
.ct-hi { font-size: 22px; line-height: 1.15; font-weight: 700; color: var(--text-strong); margin: 0 0 4px; letter-spacing: -0.01em; }
.ct-t { display: block; font-weight: 700; color: var(--text-strong); line-height: 1.3; }
.ct-sub { display: block; font-size: 13px; color: var(--text-muted); margin-top: 1px; }
.ct-lb { display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-muted); margin: 0 0 6px; }
.ct-html { font-size: 14px; margin-top: 6px; color: var(--text); }
.ct-html > :first-child { margin-top: 0; }

/* botões em pílula (respostas e ações) */
.ct-acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.ct-acts.big .ct-pill { padding: 10px 18px; font-size: 14.5px; }
.ct-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--primary);
  font: inherit; font-size: 13.5px; font-weight: 600; line-height: 1.2; color: var(--text); background: transparent; text-decoration: none;
  cursor: pointer; white-space: nowrap; transition: background-color .15s ease; }
.ct-pill:hover { background: color-mix(in srgb, var(--primary) 14%, transparent); }
.ct-pill.pri, .ct-pill[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.ct-pill.pri:hover, .ct-pill[aria-pressed="true"]:hover { background: color-mix(in srgb, var(--primary) 86%, var(--text)); }
.ct-pill:disabled { opacity: .5; cursor: not-allowed; }
.ct-a { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; color: var(--text); font-size: 13.5px; font-weight: 600;
  text-decoration: underline; text-decoration-color: var(--primary); text-decoration-thickness: 2px; text-underline-offset: 3px; }
.ct-a:hover { text-decoration-color: var(--text); }

/* números */
.ct-met { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0; }
.ct-met > div { background: var(--bg); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; }
.ct-met dd { order: -1; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.1; color: var(--text-strong); letter-spacing: -0.02em; }
.ct-met dt { font-size: 12px; color: var(--text-muted); line-height: 1.35; margin-top: 2px; }

/* cartões de link (cases, projetos, posts) */
.ct-cards { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.ct-card { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 12px; align-items: center; background: var(--bg);
  border: 1px solid var(--line); border-radius: 12px; padding: 8px; color: inherit; text-decoration: none; transition: border-color .15s ease; }
a.ct-card:hover { border-color: var(--primary); }
a.ct-card:hover .ct-go { color: var(--text); }
.ct-card.big { grid-template-columns: minmax(0, 1fr); padding: 0; overflow: hidden; }
.ct-card.big .ct-th { width: 100%; height: auto; aspect-ratio: 16 / 8; border-radius: 0; font-size: 44px; }
.ct-card.big .ct-card-b { padding: 4px 14px 14px; }
.ct-card.big .ct-go { display: none; }
.ct-th { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--primary) 22%, var(--surface)); color: var(--text-strong); font-size: 24px; font-weight: 700; }
.ct-th img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-card-b { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ct-card-b > b { color: var(--text-strong); line-height: 1.3; font-size: 15px; }
.ct-card-b > small { font-size: 12.5px; color: var(--text-muted); line-height: 1.4; }
.ct-card-b > p { font-size: 13.5px; color: var(--text); line-height: 1.45; margin: 0; }
.ct-mt { display: inline-flex; align-items: baseline; flex-wrap: wrap; gap: 6px; font-size: 12.5px; color: var(--text); margin-top: 2px; }
.ct-mt::before { content: ""; width: 7px; height: 7px; border-radius: 2px; background: var(--primary); align-self: center; flex: none; }
.ct-mt strong { font-size: 14px; font-weight: 700; color: var(--text-strong); }
.ct-act { font-size: 12.5px; font-weight: 600; color: var(--text); text-decoration: underline; text-decoration-color: var(--primary);
  text-decoration-thickness: 2px; text-underline-offset: 3px; margin-top: 4px; align-self: flex-start; }
.ct-go { color: var(--text-muted); padding-right: 6px; display: flex; }
.ct-badge { align-self: flex-start; margin: 6px 0 2px; font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em;
  padding: 2px 8px; border-radius: 999px; background: var(--primary); color: var(--on-primary); }
.ct-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.ct-tags span { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); padding: 1px 7px; border-radius: 999px;
  border: 1px solid var(--line); }

/* listas dentro do balão */
.ct-list { list-style: none; margin: 0 !important; padding: 0 !important; }
.ct-list > li { padding: 8px 0; border-top: 1px solid var(--line); display: flex; flex-direction: column; margin: 0 !important; }
.ct-list > li:first-child { border-top: 0; padding-top: 0; }
.ct-list > li:last-child { padding-bottom: 0; }
.ct-list > li > span { font-size: 13.5px; color: var(--text-muted); line-height: 1.45; }
.ct-list.row > li { flex-direction: row; justify-content: space-between; gap: 12px; align-items: baseline; }
.ct-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ct-chip { padding: 3px 10px; border-radius: 999px; background: var(--subtle); border: 1px solid var(--line); font-size: 13px; line-height: 1.4; }
.ct-grp + .ct-grp { margin-top: 12px; }

/* depoimentos encaminhados */
.ct-fw { border-left: 3px solid var(--primary); padding: 2px 0 2px 12px; margin-top: 12px; }
.ct-fw > small { display: block; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.ct-fw blockquote { margin: 0; font-style: italic; }
.ct-fw figcaption { margin-top: 4px; font-size: 13px; }
.ct-fw figcaption b { color: var(--text-strong); }
.ct-fw figcaption span { color: var(--text-muted); }

/* anexo (CV) */
.ct-file { display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 10px; padding: 10px; border-radius: 12px; border: 1px solid var(--line);
  background: var(--bg); color: inherit; font: inherit; text-align: left; cursor: pointer; transition: border-color .15s ease; }
.ct-file:hover { border-color: var(--primary); }
.ct-file:disabled { opacity: .55; cursor: not-allowed; }
.ct-file-ic { flex: none; width: 44px; height: 44px; border-radius: 10px; background: var(--primary); color: var(--on-primary);
  display: flex; align-items: center; justify-content: center; }
.ct-file b { display: block; color: var(--text-strong); }
.ct-file small { display: block; font-size: 12px; color: var(--text-muted); }

/* galeria (dia a dia) */
.ct-gal { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 8px 0 0 !important; padding: 0 !important; list-style: none; }
.ct-gal figure { margin: 0; }
.ct-gal img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; display: block; background: var(--subtle); }
.ct-gal figcaption { font-size: 11.5px; color: var(--text-muted); line-height: 1.35; margin-top: 4px; }

/* digitando… (decorativo) */
.ct-typing { display: flex !important; gap: 5px; padding: 14px 16px !important; }
.ct-typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); animation: ct-bob 1.2s infinite; }
.ct-typing i:nth-child(2) { animation-delay: .15s; }
.ct-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes ct-bob { 0%, 60%, 100% { transform: none; opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }

/* rodapé: respostas rápidas = navegação */
.ct-f { position: sticky; bottom: 0; z-index: 40; border-top: 1px solid var(--line); background: var(--surface); padding: 12px 16px; }
.ct-f-in { max-width: 860px; margin: 0 auto; display: flex; align-items: center; gap: 12px; min-width: 0; }
.ct-f-lb { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); white-space: nowrap; flex: none; }
.ct-qr { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; min-width: 0; }
.ct-qr li { flex: none; }
.ct-qr .ct-pill { font-weight: 500; font-size: 13px; padding: 7px 13px; }

/* páginas do app (post, case…) dentro da moldura */
.ct-shared { max-width: 72rem; margin: 0 auto; padding: 40px 16px 48px; }

@media (max-width: 767px) {
  .ct-h { padding: 0 16px; gap: 10px; }
  .ct-nav-links { display: none !important; }
  .ct-tools { margin-left: auto; border-left: 0; padding-left: 0; }
  .ct-log { padding: 20px 12px 28px; }
  .ct-m { max-width: 92%; font-size: 14.5px; }
  .ct-m.wide { max-width: 100%; }
  .ct-hi { font-size: 20px; }
  .ct-card { grid-template-columns: 56px minmax(0, 1fr); }
  .ct-card .ct-th { width: 56px; height: 56px; font-size: 20px; }
  .ct-card.big { grid-template-columns: minmax(0, 1fr); }
  .ct-card.big .ct-th { width: 100%; height: auto; font-size: 36px; }
  .ct-card .ct-go { display: none; }
  .ct-gal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ct-f { padding: 10px 0; }
  .ct-f-lb { display: none; }
  .ct-f-in { padding: 0; }
  .ct-qr { flex-wrap: nowrap; overflow-x: auto; padding: 2px 48px 2px 12px; scrollbar-width: none; scroll-padding-inline: 12px; }
  .ct-qr::-webkit-scrollbar { display: none; }
  .ct-qr { -webkit-mask-image: linear-gradient(90deg, black 88%, transparent); mask-image: linear-gradient(90deg, black 88%, transparent); }
  .ct-shared { padding: 24px 16px 40px; }
}

@media (prefers-reduced-motion: reduce) {
  .ct-typing i { animation: none; opacity: .7; }
  .ct-pill, .ct-card, .ct-file { transition: none; }
}
`;

export function ChatStyles() {
  return <style>{CHAT_CSS}</style>;
}

// ---- componentes da conversa ----------------------------------------------------------------

/** Coluna da conversa. `label` dá nome à lista para leitores de tela. */
export function ChatLog({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="ct-log" aria-label={label}>
      {children}
    </div>
  );
}

/** Marcador de dia ("hoje"), decorativo. */
export function DayChip() {
  const text = useChatText();
  return (
    <span className="ct-day" aria-hidden="true">
      {text.today}
    </span>
  );
}

type BubbleProps = {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
  id?: string;
  as?: "div" | "article" | "li";
};

/** Resposta da pessoa dona do portfólio (balão à esquerda). */
export function Bubble({ children, wide, className, id, as: Tag = "div" }: BubbleProps) {
  return (
    <Tag id={id} className={["ct-m in", wide ? "wide" : "", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}

/** Pergunta de quem visita (balão à direita, na primária). */
export function Ask({ children }: { children: React.ReactNode }) {
  return <p className="ct-m out">{children}</p>;
}

/**
 * Uma seção da conversa: título escondido (para navegar por seções no leitor de tela),
 * a pergunta de quem visita e as respostas.
 */
export function ChatSection({
  title,
  ask,
  children,
  id,
}: {
  title: string;
  ask?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} style={{ scrollMarginTop: 80 }}>
      <h2 id={headingId} className="ct-sr">
        {title}
      </h2>
      {ask && <Ask>{ask}</Ask>}
      {children}
    </section>
  );
}

/** Três pontinhos de "digitando…", só decoração (sem animação com movimento reduzido). */
export function Typing() {
  return (
    <div className="ct-m in ct-typing" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

/** Parágrafo com os números de resultado em destaque. */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? (
          <strong key={i} className="ct-num">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/** Avatar redondo: foto quando existe, senão as iniciais na primária. */
export function Avatar({ name, src, size }: { name: string; src?: string; size?: number }) {
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.36) } : undefined;
  return (
    <span className="ct-av" style={style} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initialsOf(name) || "·"}
    </span>
  );
}

/** Números de destaque em mini cartões (lista de definição). */
export function MetricGrid({ metrics }: { metrics: Array<{ value: string; label: string }> }) {
  return (
    <dl className="ct-met">
      {metrics.map((m) => (
        <div key={`${m.value}-${m.label}`}>
          <dt>{m.label}</dt>
          <dd>{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Primeira métrica de um case, com o marcador na primária. */
export function MetricLine({ metric }: { metric?: { value: string; label: string } }) {
  if (!metric) return null;
  return (
    <span className="ct-mt">
      <strong>{metric.value}</strong>
      <span>{metric.label}</span>
    </span>
  );
}

/** Miniatura do cartão: imagem quando existe, senão a inicial do título. */
export function Thumb({ src, label }: { src?: string; label: string }) {
  return (
    <span className="ct-th" aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" /> : (label.trim()[0] ?? "·").toUpperCase()}
    </span>
  );
}

type LinkCardProps = {
  /** Rota interna (`/portfolio/slug`) ou endereço externo (`https://…`). Sem link, vira um cartão estático. */
  href?: string;
  image?: string;
  title: string;
  big?: boolean;
  /** Selo acima do título (ex.: "destaque"). */
  badge?: string;
  children?: React.ReactNode;
  umamiEvent?: string;
  umamiCase?: string;
};

/** Cartão de link no estilo "prévia de link" de aplicativo de mensagens. */
export function LinkCard({ href, image, title, big, badge, children, umamiEvent, umamiCase }: LinkCardProps) {
  const className = big ? "ct-card big" : "ct-card";
  const body = (
    <>
      <Thumb src={image} label={title} />
      <div className="ct-card-b">
        {badge && <span className="ct-badge">{badge}</span>}
        <b>{title}</b>
        {children}
      </div>
      {href && (
        <span className="ct-go" aria-hidden="true">
          {href.startsWith("/") ? <ChevronRight size={18} /> : <ArrowUpRight size={18} />}
        </span>
      )}
    </>
  );
  if (!href) return <div className={className}>{body}</div>;
  const data = { "data-umami-event": umamiEvent, "data-umami-event-case": umamiCase };
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} {...data}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...data}>
      {body}
    </a>
  );
}

/** Depoimento como mensagem encaminhada. */
export function Forwarded({ text, name, role }: { text: string; name: string; role?: string }) {
  const label = useChatText().forwarded;
  return (
    <figure className="ct-fw" style={{ marginInline: 0, marginBottom: 0 }}>
      <small>{label}</small>
      <blockquote>“{text}”</blockquote>
      <figcaption>
        <b>{name}</b>
        {role && <span> · {role}</span>}
      </figcaption>
    </figure>
  );
}

/** Anexo de arquivo (o CV em PDF), que baixa ao clicar. */
export function FileCard({
  name,
  hint,
  label,
  onClick,
  disabled,
}: {
  name: string;
  hint: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="ct-file"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-umami-event="resume-download-cv"
    >
      <span className="ct-file-ic" aria-hidden="true">
        <FileDown size={20} />
      </span>
      <span>
        <b>{name}</b>
        <small>{hint}</small>
      </span>
    </button>
  );
}
