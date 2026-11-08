/**
 * Peças da conversa (como o `ChatShared` da v1), todas puras: seção com pergunta,
 * balões, cartões de "prévia de link", miniaturas, avatar e ícones.
 *
 * Classes `ct-*` (do layout da v1) para o visual; `rb-section rb-<tipo>` e `data-block`
 * continuam na seção, para âncoras, a prévia do painel e projetos que estilizam por bloco.
 */
import type { ReactNode } from "react";
import type { RenderContext, ResolvedImage } from "@rubrica/core";
import { Heading, Img } from "@rubrica/core/components";

/** Pergunta de quem visita para o tipo de bloco, no tratamento do tipo de site. */
export function askFor(ctx: RenderContext, key: string): string {
  return ctx.t(ctx.site.kind === "empresa" ? `chat.org.ask.${key}` : `chat.ask.${key}`);
}

/** Texto do tipo de site: `chat.org.<chave>` na empresa, `chat.<chave>` no pessoal. */
export function kindText(ctx: RenderContext, key: string, vars?: Record<string, string | number>): string {
  return ctx.t(ctx.site.kind === "empresa" ? `chat.org.${key}` : `chat.${key}`, vars);
}

/** Até duas iniciais do nome ("Ana Souza" → "AS"). */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "·"
  );
}

const cls = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

interface ChatSectionProps {
  id: string;
  anchor?: string;
  type: string;
  variant: string;
  /** Título do bloco: vira o "assunto" da conversa (separador centralizado, h2). */
  title?: string;
  level: 1 | 2;
  /** Pergunta de quem visita (balão à direita). Sem título, a pergunta é o h2. */
  ask?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Uma seção da conversa: o assunto (título do bloco, como os separadores de data de um
 * aplicativo de mensagens), a pergunta de quem visita e as respostas.
 */
export function ChatSection({ id, anchor, type, variant, title, level, ask, className, children }: ChatSectionProps) {
  return (
    <section id={anchor || `b-${id}`} className={cls("rb-section", `rb-${type}`, "ct-sec", className)} data-block={type} data-variant={variant}>
      {title ? (
        <>
          <Heading level={level} className="ct-topic">
            {title}
          </Heading>
          {ask && <p className="ct-m out">{ask}</p>}
        </>
      ) : (
        ask && (
          <Heading level={level} className="ct-m out">
            {ask}
          </Heading>
        )
      )}
      {children}
    </section>
  );
}

/** Resposta do dono do site (balão à esquerda). */
export function Bubble({ children, wide, className, as: Tag = "div" }: { children: ReactNode; wide?: boolean; className?: string; as?: "div" | "article" | "li" | "figure" }) {
  return <Tag className={cls("ct-m in", wide && "wide", className)}>{children}</Tag>;
}

/** Pergunta de quem visita (balão à direita, na cor de destaque). */
export function Ask({ children, as: Tag = "p", className }: { children: ReactNode; as?: "p" | "h3"; className?: string }) {
  return <Tag className={cls("ct-m out", className)}>{children}</Tag>;
}

/** Miniatura do cartão: imagem quando existe, senão a inicial do título. */
export function Thumb({ image, label }: { image?: ResolvedImage; label: string }) {
  return (
    <span className="ct-th" aria-hidden="true">
      {image ? <Img image={{ ...image, alt: "" }} sizes="(min-width: 768px) 600px, 100vw" /> : (label.trim()[0] ?? "·").toUpperCase()}
    </span>
  );
}

/** Avatar redondo: foto quando existe, senão as iniciais na cor de destaque. */
export function Avatar({ name, photo, className, priority }: { name: string; photo?: ResolvedImage; className?: string; priority?: boolean }) {
  return (
    <span className={cls("ct-av", className)} aria-hidden="true">
      {photo ? <Img image={{ ...photo, alt: "" }} sizes="48px" priority={priority} /> : initialsOf(name)}
    </span>
  );
}

interface LinkCardProps {
  href?: string;
  external?: boolean;
  image?: ResolvedImage;
  title: string;
  big?: boolean;
  badge?: string;
  /** Texto para leitores de tela quando o link abre em outra aba. */
  externalHint?: string;
  children?: ReactNode;
}

/**
 * Cartão no estilo "prévia de link" de aplicativo de mensagens. O cartão inteiro é o
 * link; o título é um h3 para a navegação por títulos.
 */
export function LinkCard({ href, external, image, title, big, badge, externalHint, children }: LinkCardProps) {
  const body = (
    <>
      <Thumb image={image} label={title} />
      <div className="ct-card-b">
        {badge && <span className="ct-badge">{badge}</span>}
        <Heading level={3} className="ct-card-t">
          {title}
        </Heading>
        {children}
      </div>
      {href && (
        <span className="ct-go" aria-hidden="true">
          {external ? <ArrowUpRight /> : <ChevronRight />}
        </span>
      )}
      {href && external && externalHint && <span className="rb-sr-only"> {externalHint}</span>}
    </>
  );
  const className = cls("ct-card", big && "big");
  if (!href) return <div className={className}>{body}</div>;
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  );
}

/** Link sublinhado na cor de destaque, dentro do balão ("ver todos →"). */
export function BubbleLink({ href, external, children }: { href: string; external?: boolean; children: ReactNode }) {
  return (
    <a href={href} className="ct-a" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      <span aria-hidden="true"> →</span>
    </a>
  );
}

/** Botão em pílula (resposta ou ação). */
export function Pill({ href, external, primary, children }: { href: string; external?: boolean; primary?: boolean; children: ReactNode }) {
  return (
    <a href={href} className={cls("ct-pill", primary && "pri")} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

/**
 * Corta o HTML (já sanitizado) nos elementos do primeiro nível, para cada parágrafo virar
 * um balão, como na v1. Um título (h2 a h6) fica no mesmo balão do elemento seguinte.
 * Sem elementos reconhecíveis, devolve o HTML inteiro num pedaço só.
 */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
export function splitBlocks(html: string): string[] {
  const parts: string[] = [];
  const tag = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/)?>/g;
  let depth = 0;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(html))) {
    const [, closing, rawName, selfClosing] = match;
    if (!rawName) continue; // comentário
    const name = rawName.toLowerCase();
    if (closing) {
      depth = Math.max(0, depth - 1);
    } else if (!VOID.has(name) && !selfClosing) {
      depth++;
      continue;
    }
    if (depth === 0) {
      const piece = html.slice(start, tag.lastIndex).trim();
      if (piece) parts.push(piece);
      start = tag.lastIndex;
    }
  }
  const rest = html.slice(start).trim();
  if (rest) parts.push(rest);
  if (parts.length < 2) return parts.length ? parts : [];
  const groups: string[] = [];
  let pending = "";
  for (const part of parts) {
    if (/^<h[2-6]\b/i.test(part)) {
      pending += part;
      continue;
    }
    groups.push(pending + part);
    pending = "";
  }
  if (pending) groups.push(pending);
  return groups;
}

// ---- ícones (SVG em linha, decorativos) -------------------------------------------------

function Svg({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
export const ChevronRight = () => <Svg><path d="m9 18 6-6-6-6" /></Svg>;
export const ArrowUpRight = () => <Svg><path d="M7 17 17 7M7 7h10v10" /></Svg>;
export const FileDown = () => (
  <Svg size={20}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
  </Svg>
);
export const MapPin = () => (
  <Svg size={22}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
