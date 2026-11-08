/** Auxiliares puros do tema (o núcleo não exporta os dele). */
import type { CSSProperties } from "react";
import type { RenderContext } from "@rubrica/core";

/** Só dígitos, para `wa.me` e `tel:`. */
export const digits = (value: string) => value.replace(/\D+/g, "");

/** Identificador seguro para `id` e seletores CSS. */
export const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

/** Dois dígitos: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Texto sem tags HTML, para medir um trecho. */
export const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Link do campo de texto livre (`href` de logos): interno ganha o prefixo do idioma. */
export function resolveFreeHref(href: string | undefined, ctx: RenderContext): { href: string; external: boolean } | undefined {
  if (!href) return undefined;
  if (/^(https?:|\/\/)/i.test(href)) return { href, external: true };
  if (/^(mailto:|tel:|#)/i.test(href)) return { href, external: false };
  return { href: ctx.href(href), external: false };
}

const WEEKDAYS: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

/** "Mo-Fr" (schema.org) → "seg. – sex." no idioma. Formato desconhecido volta como veio. */
export function formatDays(days: string, locale: string): string {
  const name = (code: string): string | undefined => {
    const n = WEEKDAYS[code];
    if (n === undefined) return undefined;
    // 2024-01-07 foi um domingo.
    return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + n)));
  };
  const parts = days.split(",").map((part) => {
    const [a, b] = part.trim().split("-");
    const first = a && name(a);
    if (!first) return undefined;
    if (!b) return first;
    const last = name(b);
    return last ? `${first} – ${last}` : undefined;
  });
  return parts.every(Boolean) ? parts.join(", ") : days;
}

// ---- tipografia gigante --------------------------------------------------------------

/** Largura média de um caractere (em `em`) na fonte principal em peso 800: caixa alta e números. */
export const K_CAPS = 0.8;
export const K_NUM = 0.76;

/** Comprimento da palavra mais longa (mínimo 2, para números curtos não explodirem). */
export function longestWord(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(2, ...words.map((w) => [...w].length));
}

/**
 * Variáveis que dimensionam um texto gigante dentro de um `.poster-fit` (o contêiner):
 * o tamanho sai da palavra mais longa, então nenhum título estoura a largura.
 * `max` é o tamanho máximo em px; `k` é a largura média de um caractere em `em`.
 * `lines` limita a altura de frases longas: o texto é dimensionado para caber em
 * aproximadamente essa quantidade de linhas (0 desliga).
 */
export function fit(text: string, max: number, k = K_CAPS, lines = 0): CSSProperties {
  let n = longestWord(text);
  if (lines > 0) n = Math.max(n, Math.ceil([...text].length / lines));
  return { ["--poster-n" as string]: n, ["--poster-max" as string]: `${max}px`, ["--poster-k" as string]: k } as CSSProperties;
}

/** Ano de 4 dígitos de uma data "2021-03" ou "2021"; senão, null. */
export function yearOf(value: string | undefined): string | null {
  return value?.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

// ---- marca-texto nas declarações -----------------------------------------------------

export interface Segment {
  text: string;
  mark: boolean;
}

// Número seguido de unidade que indica resultado ("50 skills", "3 horas"). Anos e versões
// soltas não entram por não terem unidade.
const UNITS = [
  "skills", "automações", "áreas", "chamados", "horas", "minutos", "meses", "anos", "iniciativas", "pessoas", "times", "sistemas", "projetos", "clientes",
  "automations", "areas", "tickets", "hours", "minutes", "months", "years", "initiatives", "people", "teams", "systems", "projects", "clients",
  "automatizaciones", "áreas", "horas", "minutos", "meses", "años", "personas", "equipos", "sistemas", "proyectos",
];
const NUMBER_WITH_UNIT = new RegExp(`(?<![\\p{L}\\d.])~?\\d+(?:[.,]\\d+)*\\+?\\s(?:${[...new Set(UNITS)].join("|")})(?![\\p{L}])`, "gu");

/** Quebra o texto marcando os números com unidade. */
export function highlightNumbers(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER_WITH_UNIT)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: text.slice(last, start), mark: false });
    out.push({ text: m[0], mark: true });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), mark: false });
  return out;
}

/**
 * Trechos de uma declaração com marca-texto: os números com unidade quando houver;
 * senão, o que vem depois de dois-pontos ou travessão; senão, as três últimas palavras.
 */
export function markStatement(text: string): Segment[] {
  const byNumbers = highlightNumbers(text);
  if (byNumbers.some((s) => s.mark)) return byNumbers;
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

/**
 * Separa o primeiro parágrafo de um HTML de texto livre. Se ele for texto puro (sem tags),
 * devolve só o texto (vira declaração com marca-texto); com tags, devolve o HTML dele.
 */
export function splitLead(html: string): { lead?: { text: string; plain: boolean }; rest: string } {
  const m = html.trim().match(/^<p[^>]*>([\s\S]*?)<\/p>\s*/i);
  if (!m) return { rest: html };
  const inner = m[1]!;
  const plain = !/<[a-z]/i.test(inner);
  return { lead: { text: plain ? decodeEntities(inner.trim()) : inner, plain }, rest: html.trim().slice(m[0].length) };
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
}

/**
 * Regras CSS do filtro por etiqueta sem JavaScript: botões de opção antes da lista e uma
 * folha gerada esconde os itens sem a etiqueta marcada. `scope` e índices, nunca o texto.
 */
export function tagFilterCss(scope: string, count: number): string {
  const rules: string[] = [];
  const on = "background:var(--rb-fg);color:var(--rb-bg);text-decoration:none";
  const ring = "outline:3px solid var(--rb-fg);outline-offset:3px";
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ .poster-rows > li:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked ~ .poster-filter label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible ~ .poster-filter label[for="${scope}-t${i}"]{${ring}}`);
  }
  rules.push(`#${scope}-all:checked ~ .poster-filter label[for="${scope}-all"]{${on}}`);
  rules.push(`#${scope}-all:focus-visible ~ .poster-filter label[for="${scope}-all"]{${ring}}`);
  return rules.join("\n");
}
