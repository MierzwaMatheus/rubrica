/**
 * Templates do Pôster: post, case e 404 com o mesmo cabeçalho gigante das páginas
 * internas (rótulo em mono, título em caixa alta e um bloco ao lado). Na v1 essas páginas
 * eram compartilhadas por todos os layouts; aqui ganham a moldura do tema.
 */
import type { CaseTemplateProps, NotFoundProps, PostTemplateProps } from "@rubrica/core";
import { CaseMetrics, Html, Img } from "@rubrica/core/components";
import { PosterButton, PosterRow } from "./parts";
import { K_CAPS, fit } from "./util";

function Head({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="poster-head">
      <div className="poster-head-grid">
        <div className="poster-fit">
          {kicker && <span className="poster-head-kicker">{kicker}</span>}
          <h1 className="poster-h">
            <span className="poster-giant poster-up poster-head-title poster-head-title--long" style={fit(title, 160, K_CAPS, 4)}>
              {title}
            </span>
          </h1>
        </div>
        {children && <div className="poster-head-aside">{children}</div>}
      </div>
    </header>
  );
}

export function PosterPost({ post, html, related, ctx }: PostTemplateProps) {
  return (
    <article className="poster-wrap poster-sec poster-article">
      <Head kicker={ctx.t("blog.readingTime", { minutes: post.readingMinutes })} title={post.title}>
        <p>
          <time dateTime={post.publishedAt}>{ctx.t("blog.publishedAt", { date: ctx.formatDate(post.publishedAt) })}</time>
        </p>
        {post.excerpt && <p>{post.excerpt}</p>}
      </Head>
      {post.cover && <Img image={post.cover} className="poster-article-cover" priority sizes="(min-width: 960px) 1000px, 100vw" />}
      <Html html={html} className="poster-prose poster-article-body" />
      {related.length > 0 && (
        <aside className="poster-related" aria-labelledby="poster-related">
          <h2 id="poster-related" className="poster-lab">
            {ctx.t("blog.related")}
          </h2>
          <ul className="poster-rows">
            {related.map((p, i) => (
              <PosterRow key={p.id} uid={`rel-${i}`} index={i + 1} title={p.title} max={48} href={p.url} action={ctx.t("common.readMore")} />
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function PosterCase({ project, related, ctx }: CaseTemplateProps) {
  const facts = [
    [ctx.t("case.client"), project.client],
    [ctx.t("case.year"), project.year],
    [ctx.t("case.role"), project.role],
  ].filter(([, v]) => v !== undefined && v !== "");
  return (
    <article className="poster-wrap poster-sec poster-article">
      <Head title={project.title}>
        {project.summary && <p>{project.summary}</p>}
        {facts.length > 0 && (
          <dl className="poster-facts">
            {facts.map(([k, v]) => (
              <div key={String(k)}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Head>
      {project.cover && <Img image={project.cover} className="poster-article-cover" priority sizes="(min-width: 960px) 1000px, 100vw" />}
      {project.content && <Html html={project.content} className="poster-prose poster-article-body" />}
      {project.sections.map((s, i) => (
        <section key={i} className="poster-case-sec">
          <h2 className="poster-lab">{s.title}</h2>
          <Html html={s.body} className="poster-prose" />
          {s.image && <Img image={s.image} className="poster-article-cover" sizes="(min-width: 960px) 1000px, 100vw" />}
        </section>
      ))}
      <CaseMetrics metrics={project.metrics} title={ctx.t("case.metrics")} className="poster-case-sec" />
      {project.links.length > 0 && (
        <div className="poster-btns poster-after">
          {project.links.map((l, i) => (
            <PosterButton key={l.href} link={l} pri={i === 0} ctx={ctx} />
          ))}
        </div>
      )}
      {related.length > 0 && (
        <aside className="poster-related" aria-labelledby="poster-related">
          <h2 id="poster-related" className="poster-lab">
            {ctx.t("case.related")}
          </h2>
          <ul className="poster-rows">
            {related.map((p, i) => (
              <PosterRow key={p.id} uid={`rel-${i}`} index={i + 1} title={p.title} max={48} href={p.url} action={ctx.t("case.view")} />
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function PosterNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="poster-wrap poster-sec poster-notfound">
      <div className="poster-fit">
        <h1 className="poster-h">
          <span className="poster-giant poster-up" style={fit(ctx.t("notFound.title"), 220, K_CAPS, 3)}>
            {ctx.t("notFound.title")}
          </span>
        </h1>
      </div>
      <p className="poster-cta-sub">{ctx.t("notFound.body")}</p>
      <div className="poster-btns">
        <PosterButton link={{ label: ctx.t("notFound.home"), href: ctx.href("/"), external: false }} pri ctx={ctx} />
      </div>
    </section>
  );
}
