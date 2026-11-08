/**
 * Post, case e 404 como janelas: na v1, as páginas do app entravam numa janela genérica
 * ("Post.txt", "Case.doc"). O 404 é uma caixa de diálogo de erro.
 */
import type { CaseTemplateProps, NotFoundProps, PostTemplateProps, RenderContext } from "@rubrica/core";
import { Html, Img } from "@rubrica/core/components";
import { ButtonRow, DeskButton, Square, Window } from "./window";

function Related({ id, title, list }: { id: string; title: string; list: { id: string; url: string; title: string }[] }) {
  if (!list.length) return null;
  return (
    <Window id={id} type="related" title={title}>
      <ul className="dk-list">
        {list.map((p, i) => (
          <li key={p.id} className="dk-li dk-li--single">
            <a href={p.url} className="dk-li__name dk-li__link">
              <Square color={i} />
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </Window>
  );
}

export function DesktopPost({ post, html, related, ctx }: PostTemplateProps) {
  return (
    <>
      <Window id="post" type="post" bar={ctx.t("desktop.file.post")} labelledBy="post-h">
        <article className="dk-doc">
          <header className="dk-doc__header">
            <p className="dk-note__meta">
              <time dateTime={post.publishedAt}>{ctx.t("blog.publishedAt", { date: ctx.formatDate(post.publishedAt) })}</time>
              {" · "}
              {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
            </p>
            <h1 id="post-h" className="dk-doc__title">
              {post.title}
            </h1>
            {post.excerpt && <p className="dk-desc">{post.excerpt}</p>}
            {post.tags.length > 0 && (
              <ul className="dk-chips">
                {post.tags.map((t) => (
                  <li key={t} className="dk-chip dk-mono">
                    #{t}
                  </li>
                ))}
              </ul>
            )}
          </header>
          {post.cover && (
            <div className="dk-cover">
              <Img image={post.cover} priority sizes="(min-width: 1024px) 860px, 100vw" />
            </div>
          )}
          <Html html={html} className="rb-prose dk-prose" />
        </article>
      </Window>
      <Related id="post-related" title={ctx.t("blog.related")} list={related} />
    </>
  );
}

function Facts({ project, ctx }: { project: CaseTemplateProps["project"]; ctx: RenderContext }) {
  const rows = [
    project.client && { label: ctx.t("case.client"), value: project.client },
    project.year && { label: ctx.t("case.year"), value: String(project.year) },
    project.role && { label: ctx.t("case.role"), value: project.role },
  ].filter((r): r is { label: string; value: string } => !!r);
  if (!rows.length) return null;
  return (
    <dl className="dk-facts">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DesktopCase({ project, related, ctx }: CaseTemplateProps) {
  return (
    <>
      <Window id="case" type="case" bar={ctx.t("desktop.file.case")} labelledBy="case-h">
        <article className="dk-doc">
          <header className="dk-doc__header">
            <h1 id="case-h" className="dk-doc__title">
              {project.title}
            </h1>
            {project.summary && <p className="dk-desc">{project.summary}</p>}
            <Facts project={project} ctx={ctx} />
          </header>
          {project.cover && (
            <div className="dk-cover">
              <Img image={project.cover} priority sizes="(min-width: 1024px) 860px, 100vw" />
            </div>
          )}
          {project.content && <Html html={project.content} className="rb-prose dk-prose" />}
          {project.sections.map((s, i) => (
            <section key={i} className="dk-doc__section">
              <h2>{s.title}</h2>
              <Html html={s.body} className="rb-prose dk-prose" />
              {s.image && <Img image={s.image} className="dk-frame" sizes="(min-width: 1024px) 800px, 100vw" />}
            </section>
          ))}
          {project.links.length > 0 && (
            <ButtonRow>
              {project.links.map((l, i) => (
                <DeskButton key={l.href} link={l} ctx={ctx} primary={i === 0} />
              ))}
            </ButtonRow>
          )}
        </article>
      </Window>
      <Related id="case-related" title={ctx.t("case.related")} list={related} />
    </>
  );
}

export function DesktopNotFound({ ctx }: NotFoundProps) {
  return (
    <Window id="notfound" type="cta" bar={ctx.t("desktop.error")} labelledBy="notfound-h">
      <div className="dk-dlg">
        <i className="dk-bang dk-bang--error" aria-hidden="true">
          !
        </i>
        <div className="dk-dlg__body">
          <h1 id="notfound-h" className="dk-dlg__title">
            {ctx.t("notFound.title")}
          </h1>
          <p className="dk-dlg__text">{ctx.t("notFound.body")}</p>
          <ButtonRow end>
            <DeskButton link={{ label: ctx.t("notFound.home"), href: ctx.href("/"), external: false }} ctx={ctx} primary />
          </ButtonRow>
        </div>
      </div>
    </Window>
  );
}
