/**
 * Página de case do cyberpunk, como a da v1: cabeçalho com a capa de fundo (sob uma
 * camada da cor da página, para o texto ter contraste), título, etiquetas em chips e os
 * links do projeto como botões; "Voltar ao portfólio" acima; o papel e o corpo do case
 * (os blocos do núcleo, cada um num cartão; o tom do cartão vem da posição, em CSS);
 * "Resultados em números" com ícones, sem cartão em volta; as telas num carrossel
 * (ilha do núcleo, que começa pela capa) e, no fim, o convite "Precisa de algo parecido?" com o
 * próximo case.
 */
import type { CaseTemplateProps, ResolvedLink } from "@rubrica/core";
import { CaseMetrics, Img } from "@rubrica/core/components";
import { CaseIcon, type CaseIconName } from "./icons";

/** Ícone do botão do link: repositório de código ou endereço externo. */
function linkIcon(link: ResolvedLink): CaseIconName {
  return /github\.com|gitlab\.com|bitbucket\.org|codeberg\.org/i.test(link.href) ? "github" : "external-link";
}

/** A listagem dos projetos: o endereço do case sem o último trecho (`/en/portfolio/x` → `/en/portfolio`). */
function listingHref(url: string): string {
  return url.replace(/\/[^/]+\/?$/, "") || "/";
}

export function CyberpunkCase({ project, next, carousel, blocks, ctx }: CaseTemplateProps) {
  const hasContact = ctx.site.plugins["contact-wizard"] === true;
  const talkHref = ctx.site.kind === "empresa" ? ctx.href("/contato") : `${ctx.href("/")}#contato`;
  // Como na v1: com corpo de case, o resumo não aparece (o case conta a história);
  // a categoria não repete como etiqueta na capa.
  const hasCase = project.hasCase;
  const tags = project.tags.filter((t) => t !== project.category);
  return (
    <article className="cp-case">
      <a className="cp-case__back" href={listingHref(project.url)}>
        <CaseIcon name="arrow-left" size={16} />
        {ctx.t("case.back")}
      </a>

      <header className={`cp-case__hero${project.cover ? " cp-case__hero--cover" : ""}`}>
        {project.cover && <Img image={{ ...project.cover, alt: "" }} className="cp-case__bg" priority sizes="(min-width: 1024px) 56rem, 100vw" />}
        <div className="cp-case__heroBody">
          <h1 className="cp-case__title">{project.title}</h1>
          {tags.length > 0 && (
            <ul className="cp-case__tags">
              {tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {project.links.length > 0 && (
            <div className="cp-case__links">
              {project.links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`cp-case__link${i === 0 ? " cp-case__link--primary" : ""}`}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <CaseIcon name={linkIcon(l)} size={16} />
                  {l.label}
                  {l.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      {!hasCase && project.summary && <p className="cp-case__summary">{project.summary}</p>}

      {project.role && (
        <section className="cp-case__card" data-tone="role">
          <h2 className="cp-case__cardTitle">
            <CaseIcon name="user-cog" />
            {ctx.t("case.myRole")}
          </h2>
          <p className="cp-case__role">{project.role}</p>
        </section>
      )}

      {/* Corpo em blocos do núcleo: cada bloco vira um cartão (styles.css); o tom é a posição. */}
      {blocks && <div className="rb-case__body cp-case__blocks">{blocks}</div>}

      <CaseMetrics metrics={project.metrics} title={ctx.t("case.metrics")} className="cp-case__metrics" />
      {carousel && (
        <section className="cp-case__gallery">
          <h2 className="cp-case__heading">{ctx.t("case.gallery")}</h2>
          {carousel}
        </section>
      )}

      {(next || hasContact) && (
        <aside className="cp-case__next">
          <p className="cp-case__prompt">
            <span aria-hidden="true">$</span>
            {ctx.t("cyberpunk.case.prompt")}
          </p>
          <h2 className="cp-case__heading">{ctx.t("case.ctaTitle")}</h2>
          <p className="cp-case__ctaBody">{ctx.t("case.ctaBody")}</p>
          <div className="cp-case__links">
            {hasContact &&
              (ctx.site.contactDialog ? (
                <button type="button" className="cp-case__link cp-case__link--primary" popoverTarget={ctx.site.contactDialog}>
                  <CaseIcon name="message" size={16} />
                  {ctx.t("case.ctaButton")}
                </button>
              ) : (
                <a className="cp-case__link cp-case__link--primary" href={talkHref}>
                  <CaseIcon name="message" size={16} />
                  {ctx.t("case.ctaButton")}
                </a>
              ))}
            {next && (
              <a className="cp-case__link cp-case__nextLink" href={next.url}>
                <span>
                  {ctx.t("case.next")}: <strong>{next.title}</strong>
                </span>
                <CaseIcon name="arrow-right" size={16} />
              </a>
            )}
          </div>
        </aside>
      )}
    </article>
  );
}
