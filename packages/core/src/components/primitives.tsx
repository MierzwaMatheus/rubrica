/** Peças comuns dos componentes padrão (e úteis para temas). */
import type { ReactNode } from "react";
import type { ResolvedImage, ResolvedLink } from "../blocks/fields";

export function Heading({ level, className, children, id }: { level: 1 | 2 | 3; className?: string; children: ReactNode; id?: string }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  );
}

/** HTML que já vem sanitizado do backend (texto rico, conteúdo de post). */
export function Html({ html, className, as = "div" }: { html: string; className?: string; as?: "div" | "p" | "span" }) {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Img({ image, className, sizes, priority }: { image: ResolvedImage; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <img
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={className}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}

export function LinkButton({ link, variant = "primary", className }: { link: ResolvedLink; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  return (
    <a
      href={link.href}
      className={`rb-button rb-button--${variant}${className ? ` ${className}` : ""}`}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
    </a>
  );
}

/** Cabeçalho padrão de seção: título (h1/h2) e texto de apoio. */
export function SectionHeader({ title, intro, level }: { title?: string; intro?: string; level: 1 | 2 }) {
  if (!title && !intro) return null;
  return (
    <header className="rb-section__header">
      {title && <Heading level={level} className="rb-section__title">{title}</Heading>}
      {intro && <p className="rb-section__intro">{intro}</p>}
    </header>
  );
}

export function Section({ id, anchor, type, variant, children, className }: { id: string; anchor?: string; type: string; variant: string; children: ReactNode; className?: string }) {
  return (
    <section id={anchor || `b-${id}`} className={`rb-section rb-${type}${className ? ` ${className}` : ""}`} data-block={type} data-variant={variant}>
      <div className="rb-container">{children}</div>
    </section>
  );
}

/** Botão de tema claro/escuro, estático. O script do núcleo faz a troca (sem React no navegador). */
export function ColorToggleButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={`rb-color-toggle${className ? ` ${className}` : ""}`} data-rb-color-toggle="" aria-label={label} aria-pressed="false">
      <span aria-hidden="true" className="rb-color-toggle__icon" />
    </button>
  );
}
