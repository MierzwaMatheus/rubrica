/**
 * Página de case do cyberpunk, como a da v1: cabeçalho com a capa de fundo (sob uma
 * camada da cor da página, para o texto ter contraste), título, etiquetas em chips e os
 * links do projeto como botões; "Voltar ao portfólio" acima; o papel e cada seção do case
 * em cartões com ícone e cor pelo assunto (antes, problema, solução, decisões,
 * resultados...). Sem JavaScript: a galeria é uma grade de imagens.
 */
import type { CaseTemplateProps, ResolvedLink } from "@rubrica/core";
import { Html, Img } from "@rubrica/core/components";
import { CaseIcon, type CaseIconName } from "./icons";

/** Assunto da seção, pelo título (em qualquer idioma base): dá o ícone e a cor do cartão. */
export type CaseTone = "context" | "problem" | "solution" | "decisions" | "metrics" | "results" | "learnings" | "testimonial" | "other";

const TONES: { tone: CaseTone; test: RegExp; icon: CaseIconName }[] = [
  { tone: "metrics", test: /numer|number|metric|indicador/, icon: "chart" },
  { tone: "context", test: /^antes\b|before|contexto|context|antecedente|background/, icon: "history" },
  { tone: "problem", test: /problem|desafio|challenge|reto\b|dor\b|pain/, icon: "alert" },
  { tone: "solution", test: /soluc|solution|abordagem|approach|enfoque/, icon: "lightbulb" },
  { tone: "decisions", test: /decis|trade.?off|escolha|choice/, icon: "git-branch" },
  { tone: "results", test: /result|impacto|impact|outcome/, icon: "trending-up" },
  { tone: "learnings", test: /aprend|learn|licao|lesson|leccion/, icon: "graduation" },
  { tone: "testimonial", test: /depoiment|testimon/, icon: "quote" },
];

export function caseTone(title: string): { tone: CaseTone; icon: CaseIconName } {
  const t = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const hit = TONES.find((x) => x.test.test(t));
  return hit ? { tone: hit.tone, icon: hit.icon } : { tone: "other", icon: "file" };
}

/** Ícone do botão do link: repositório de código ou endereço externo. */
function linkIcon(link: ResolvedLink): CaseIconName {
  return /github\.com|gitlab\.com|bitbucket\.org|codeberg\.org/i.test(link.href) ? "github" : "external-link";
}

/** A listagem dos projetos: o endereço do case sem o último trecho (`/en/portfolio/x` → `/en/portfolio`). */
function listingHref(url: string): string {
  return url.replace(/\/[^/]+\/?$/, "") || "/";
}

export function CyberpunkCase({ project, related, ctx }: CaseTemplateProps) {
  const hasContact = ctx.site.plugins["contact-wizard"] === true;
  const talkHref = ctx.site.kind === "empresa" ? ctx.href("/contato") : `${ctx.href("/")}#contato`;
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
          {project.tags.length > 0 && (
            <ul className="cp-case__tags">
              {project.tags.map((t) => (
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

      {project.summary && <p className="cp-case__summary">{project.summary}</p>}

      {project.role && (
        <section className="cp-case__card" data-tone="role">
          <h2 className="cp-case__cardTitle">
            <CaseIcon name="user-cog" />
            {ctx.t("case.myRole")}
          </h2>
          <p className="cp-case__role">{project.role}</p>
        </section>
      )}

      {project.content && <Html html={project.content} className="rb-prose cp-case__content" />}

      {project.sections.map((s, i) => {
        const { tone, icon } = caseTone(s.title);
        return (
          <section key={i} className="cp-case__card" data-tone={tone}>
            <h2 className="cp-case__cardTitle">
              <CaseIcon name={icon} />
              {s.title}
            </h2>
            <Html html={s.body} className="rb-prose cp-case__body" />
            {s.image && <Img image={s.image} className="cp-case__sectionImg" sizes="(min-width: 1024px) 52rem, 100vw" />}
          </section>
        );
      })}

      {project.gallery.length > 0 && (
        <section className="cp-case__gallery">
          <h2 className="cp-case__heading">{ctx.t("case.gallery")}</h2>
          <ul>
            {project.gallery.map((img, i) => (
              <li key={`${img.src}-${i}`}>
                <Img image={img} sizes="(min-width: 768px) 28rem, 100vw" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {(related.length > 0 || hasContact) && (
        <aside className="cp-case__next">
          {related.length > 0 && (
            <>
              <h2 className="cp-case__heading">{ctx.t("case.related")}</h2>
              <ul className="cp-case__related">
                {related.map((p) => (
                  <li key={p.id}>
                    <a href={p.url}>
                      <span>{p.title}</span>
                      <CaseIcon name="arrow-right" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {hasContact && (
            <a className="cp-case__link cp-case__link--primary" href={talkHref}>
              <CaseIcon name="message" size={16} />
              {ctx.t("sidebar.talk")}
            </a>
          )}
        </aside>
      )}
    </article>
  );
}
