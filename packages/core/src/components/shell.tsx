/** Casca e templates padrão do núcleo. Temas substituem o que quiserem. */
import type { CaseTemplateProps, NotFoundProps, PostTemplateProps, ShellProps } from "../theme/contract";
import { Html, Img, LinkButton, Logo } from "./primitives";

export function DefaultShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const year = new Date().getUTCFullYear();
  return (
    <>
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="rb-header">
        <div className="rb-container rb-header__inner">
          <a className="rb-brand" href={ctx.href("/")}>
            {site.logo ? <Logo logo={site.logo} priority /> : site.name}
          </a>
          <nav className="rb-nav" aria-label={ctx.t("nav.menu")}>
            <details className="rb-nav__mobile">
              <summary>{ctx.t("nav.menu")}</summary>
              <NavList ctx={ctx} />
            </details>
            <NavList ctx={ctx} className="rb-nav__desktop" />
          </nav>
          <div className="rb-header__tools">
            {localeSwitcher}
            {colorToggle}
          </div>
        </div>
      </header>
      <main id="conteudo" className="rb-main">
        {children}
      </main>
      <footer className="rb-footer">
        <div className="rb-container rb-footer__inner">
          <p>
            © {year} {site.organization?.legalName ?? site.name}. {ctx.t("footer.rights")}
          </p>
          {site.social.length > 0 && (
            <ul className="rb-footer__social">
              {site.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="me noopener noreferrer" target="_blank">
                    {s.network}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </footer>
    </>
  );
}

function NavList({ ctx, className }: { ctx: ShellProps["ctx"]; className?: string }) {
  return (
    <ul className={className}>
      {ctx.site.navigation.map((n) => (
        <li key={n.href}>
          <a href={n.href} aria-current={n.current ? "page" : undefined}>
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Seletor de idioma sem JavaScript: links para a mesma página nos outros idiomas. */
/**
 * Código curto do idioma para o seletor compacto: "pt-BR" → "PT", "en" → "EN". Se dois
 * idiomas do seletor têm a mesma língua (pt-BR e pt-PT), mostra o código inteiro.
 */
export function localeCode(locale: string, all: readonly string[] = [locale]): string {
  const base = (l: string) => l.split("-")[0]!.toLowerCase();
  const clash = all.filter((l) => base(l) === base(locale)).length > 1;
  return (clash ? locale : base(locale)).toUpperCase();
}

/**
 * Seletor de idioma (links para a mesma página nos outros idiomas). `compact` mostra só o
 * código ("EN") para cabeçalhos estreitos; o nome completo continua no nome acessível do
 * link (leitor de tela), antes do código visível.
 */
export function LocaleLinks({ ctx, compact = false, className }: { ctx: ShellProps["ctx"]; compact?: boolean; className?: string }) {
  if (ctx.alternates.length < 2) return null;
  const all = ctx.alternates.map((a) => a.locale);
  return (
    <ul className={`rb-locales${compact ? " rb-locales--compact" : ""}${className ? ` ${className}` : ""}`} aria-label={ctx.t("nav.language")}>
      {ctx.alternates.map((a) => (
        <li key={a.locale}>
          <a href={a.href} hrefLang={a.locale} lang={a.locale} aria-current={a.current ? "true" : undefined}>
            {compact ? (
              <>
                <span className="rb-sr-only">{a.label} </span>
                {localeCode(a.locale, all)}
              </>
            ) : (
              a.label
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DefaultPost({ post, html, related, ctx }: PostTemplateProps) {
  return (
    <article className="rb-post rb-container">
      <header className="rb-post__header">
        <h1 className="rb-post__title">{post.title}</h1>
        <p className="rb-post__meta">
          <time dateTime={post.publishedAt}>{ctx.t("blog.publishedAt", { date: ctx.formatDate(post.publishedAt) })}</time>
          {" · "}
          {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
        </p>
        {post.cover && <Img image={post.cover} className="rb-post__cover" priority sizes="(min-width: 960px) 800px, 100vw" />}
      </header>
      <Html html={html} className="rb-prose" />
      {related.length > 0 && (
        <aside className="rb-related">
          <h2>{ctx.t("blog.related")}</h2>
          <ul>
            {related.map((p) => (
              <li key={p.id}>
                <a href={p.url}>{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function DefaultCase({ project, related, ctx }: CaseTemplateProps) {
  return (
    <article className="rb-case rb-container">
      <header className="rb-case__header">
        <h1 className="rb-case__title">{project.title}</h1>
        {project.summary && <p className="rb-case__summary">{project.summary}</p>}
        <dl className="rb-case__facts">
          {project.client && (
            <>
              <dt>{ctx.t("case.client")}</dt>
              <dd>{project.client}</dd>
            </>
          )}
          {project.year && (
            <>
              <dt>{ctx.t("case.year")}</dt>
              <dd>{project.year}</dd>
            </>
          )}
          {project.role && (
            <>
              <dt>{ctx.t("case.role")}</dt>
              <dd>{project.role}</dd>
            </>
          )}
        </dl>
        {project.cover && <Img image={project.cover} className="rb-case__cover" priority sizes="(min-width: 960px) 1000px, 100vw" />}
      </header>
      {project.content && <Html html={project.content} className="rb-prose" />}
      {project.sections.map((s, i) => (
        <section key={i} className="rb-case__section">
          <h2>{s.title}</h2>
          <Html html={s.body} className="rb-prose" />
          {s.image && <Img image={s.image} />}
        </section>
      ))}
      {project.links.length > 0 && (
        <div className="rb-actions">
          {project.links.map((l) => (
            <LinkButton key={l.href} link={l} variant="secondary" />
          ))}
        </div>
      )}
      {related.length > 0 && (
        <aside className="rb-related">
          <h2>{ctx.t("case.related")}</h2>
          <ul>
            {related.map((p) => (
              <li key={p.id}>
                <a href={p.url}>{p.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

export function DefaultNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="rb-notfound rb-container">
      <h1>{ctx.t("notFound.title")}</h1>
      <p>{ctx.t("notFound.body")}</p>
      <LinkButton link={{ label: ctx.t("notFound.home"), href: ctx.href("/"), external: false }} />
    </section>
  );
}
