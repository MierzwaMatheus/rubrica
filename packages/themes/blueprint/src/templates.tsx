/**
 * Templates do Blueprint: post (memorial), case (prancha com carimbo) e 404 (folha não
 * localizada). Moldura simples sobre o papel quadriculado, como as páginas compartilhadas
 * da v1; o título é o `h1` da página.
 */
import type { CaseTemplateProps, NotFoundProps, PostTemplateProps } from "@rubrica/core";
import { CaseMetrics, Html, Img } from "@rubrica/core/components";
import { Dim, Hatch, ProjectStamp, TitleBlock, drawnBy, isoDate, ownerName, pad2, stampDate, type StampCell } from "./parts";

export function BlueprintPost({ post, html, related, ctx }: PostTemplateProps) {
  return (
    <article className="bp-doc">
      <header>
        <p className="bp-small bp-small--first">
          {ctx.t("blueprint.post")} · <time dateTime={post.publishedAt}>{isoDate(post.publishedAt)}</time> · {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
        </p>
        <h1 className="bp-h1">{post.title}</h1>
        {post.excerpt && <p className="bp-lead">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="bp-tags bp-tags--row">
            {post.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        {post.cover && (
          <div className="bp-doc__cover">
            <Hatch image={post.cover} tall sizes="(min-width: 960px) 800px, 100vw" />
          </div>
        )}
      </header>
      <Html html={html} className="rb-prose bp-doc__body" />
      {related.length > 0 && (
        <aside className="bp-related">
          <h2 className="bp-block-title">{ctx.t("blog.related")}</h2>
          <ul className="bp-codes bp-codes--links">
            {related.map((p, i) => (
              <li key={p.id}>
                <span aria-hidden="true">R{pad2(i + 1)}</span>
                <a href={p.url}>{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <div className="bp-end">
        <ProjectStamp ctx={ctx} project={post.title} />
      </div>
    </article>
  );
}

/** Linhas de 3 colunas; a última célula de cada linha ocupa o que sobrar. */
function rowsOf(cells: StampCell[]): StampCell[][] {
  const rows: StampCell[][] = [];
  for (let i = 0; i < cells.length; i += 3) {
    const row = cells.slice(i, i + 3);
    rows.push(row.map((c, j) => (j === row.length - 1 ? { ...c, span: 3 - row.length + 1 } : c)));
  }
  return rows;
}

export function BlueprintCase({ project, related, ctx }: CaseTemplateProps) {
  const facts: StampCell[] = [
    ...(project.client ? [{ label: ctx.t("case.client"), value: project.client }] : []),
    ...(project.year ? [{ label: ctx.t("blueprint.year"), value: project.year }] : []),
    ...(project.role ? [{ label: ctx.t("case.role"), value: project.role }] : []),
    { label: ctx.t("blueprint.date"), value: stampDate() },
    { label: ctx.t("blueprint.drawn"), value: drawnBy(ownerName(ctx)) || "—" },
  ];
  return (
    <article className="bp-doc">
      <header>
        <p className="bp-small bp-small--first">{ctx.t("blueprint.plate")}</p>
        <h1 className="bp-h1">{project.title}</h1>
        {project.summary && <p className="bp-lead">{project.summary}</p>}
        {project.tags.length > 0 && (
          <ul className="bp-tags bp-tags--row">
            {project.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <div className="bp-doc__stamp">
          <TitleBlock ctx={ctx} rows={[[{ label: ctx.t("blueprint.project"), value: project.title, span: 3 }], ...rowsOf(facts)]} />
        </div>
        {project.cover && (
          <div className="bp-doc__cover">
            <Hatch image={project.cover} tall sizes="(min-width: 960px) 1000px, 100vw" />
          </div>
        )}
      </header>
      {project.content && <Html html={project.content} className="rb-prose bp-doc__body" />}
      {project.sections.map((s, i) => (
        <section key={i} className="bp-doc__section">
          <h2 className="bp-h2">
            <span className="bp-n" aria-hidden="true">
              {i + 1}
            </span>
            {s.title}
          </h2>
          <Html html={s.body} className="rb-prose bp-doc__body" />
          {s.image && <Img image={s.image} className="bp-doc__img" sizes="(min-width: 960px) 800px, 100vw" />}
        </section>
      ))}
      <CaseMetrics metrics={project.metrics} title={ctx.t("case.metrics")} className="bp-doc__metrics" />
      {project.links.length > 0 && (
        <div className="bp-row">
          {project.links.map((l) => (
            <a key={l.href} className="bp-btn" href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {l.label}
              {l.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
            </a>
          ))}
        </div>
      )}
      {related.length > 0 && (
        <aside className="bp-related">
          <h2 className="bp-block-title">{ctx.t("case.related")}</h2>
          <ul className="bp-codes bp-codes--links">
            {related.map((p, i) => (
              <li key={p.id}>
                <span aria-hidden="true">P{pad2(i + 1)}</span>
                <a href={p.url}>{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function BlueprintNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="bp-doc">
      <p className="bp-small bp-small--first">{ctx.t("blueprint.notFound")}</p>
      <Dim label="404" />
      <h1 className="bp-h1">{ctx.t("notFound.title")}</h1>
      <p className="bp-lead">{ctx.t("notFound.body")}</p>
      <div className="bp-row">
        <a className="bp-btn bp-btn--pri" href={ctx.href("/")}>
          {ctx.t("notFound.home")}
        </a>
      </div>
      <div className="bp-end">
        <ProjectStamp ctx={ctx} project="404" />
      </div>
    </section>
  );
}
