/**
 * Blog como o da v1 (padrão e cyberpunk usam as mesmas páginas): a lista com o carrossel
 * "Em destaque", a busca e o filtro por etiquetas, cartões com 3 etiquetas + "+N" e "Ler
 * mais"; e o post com "Voltar para o blog", etiquetas, subtítulo, data e leitura com ícone,
 * a capa da largura do texto e, no fim, o cartão do autor e o case relacionado.
 *
 * Sem JavaScript: o carrossel rola com o dedo ou o trackpad (as setas são da ilha de busca)
 * e o filtro por etiqueta é CSS. A busca é a ilha do núcleo (campo "Busca por texto").
 */
import type { BlockProps, PostItem, PostTemplateProps, RenderContext } from "@rubrica/core";
import { Html, Img, LinkButton, Section, SectionHeader, postSearchText, safeId, tagFilterCss } from "@rubrica/core/components";
import type { ReactNode } from "react";

const PATHS = {
  rss: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
} satisfies Record<string, ReactNode>;

type BlogIconName = keyof typeof PATHS;

/** Ícones do Lucide (ISC), estáticos e decorativos. */
export function BlogIcon({ name, size = 16 }: { name: BlogIconName; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

/** Título no nível certo (o bloco pode estar sob um h2 de seção). */
function H({ level, className, id, children }: { level: number; className?: string; id?: string; children: ReactNode }) {
  const Tag = `h${Math.min(6, Math.max(2, level))}` as "h2";
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  );
}

/** Botão "RSS" no canto do título do blog, como na v1. */
export function RssLink({ ctx }: { ctx: RenderContext }) {
  if (!ctx.feeds.rss) return null;
  return (
    <a className="pd-rss" href={ctx.feeds.rss} aria-label={ctx.t("blog.rssSubscribe")} type="application/rss+xml">
      <BlogIcon name="rss" size={20} />
      <span className="pd-rss__label" aria-hidden="true">
        {ctx.t("blog.rss")}
      </span>
    </a>
  );
}

/** A página do blog no idioma: onde o hero "pagina" ganha o botão do RSS. */
export function isBlogIndex(ctx: RenderContext): boolean {
  return !!ctx.feeds.rss && ctx.path === ctx.href("/blog");
}

function Meta({ post, ctx }: { post: PostItem; ctx: RenderContext }) {
  return (
    <>
      <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt, "short")}</time>
      <span className="pd-dot" aria-hidden="true" />
      <span>{ctx.t("blog.readingTime", { minutes: post.readingMinutes })}</span>
    </>
  );
}

/** Carrossel "Em destaque": capa de fundo, etiquetas, título, subtítulo, data, leitura e "Ler agora". */
function Featured({ posts, level, scope, ctx }: { posts: PostItem[]; level: number; scope: string; ctx: RenderContext }) {
  const many = posts.length > 1;
  return (
    <section className="pd-featured" aria-labelledby={`${scope}-feat`} {...(many ? { "data-rb-carousel": "" } : {})}>
      <H level={level} className="pd-featured__title" id={`${scope}-feat`}>
        {ctx.t("blog.featured")}
      </H>
      <div className="pd-featured__viewport">
        <ul className="pd-featured__track" data-rb-carousel-track="">
          {posts.map((post, i) => (
            <li key={post.id} className="pd-slide">
              {post.cover && <Img image={{ ...post.cover, alt: "" }} className="pd-slide__bg" priority={i === 0} sizes="(min-width: 1024px) 60rem, 100vw" />}
              <div className="pd-slide__body">
                {post.tags.length > 0 && (
                  <ul className="pd-chips">
                    {post.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                <H level={level + 1} className="pd-slide__title">
                  <a href={post.url} className="pd-slide__link">
                    {post.title}
                  </a>
                </H>
                {post.excerpt && <p className="pd-slide__text">{post.excerpt}</p>}
                <div className="pd-slide__foot">
                  <p className="pd-slide__meta">
                    <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt, "short")}</time>
                    <span className="pd-slide__time">
                      <BlogIcon name="clock" />
                      {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
                    </span>
                  </p>
                  <span className="pd-slide__cta" aria-hidden="true">
                    {ctx.t("blog.readNow")}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {many && (
          <>
            <button type="button" className="pd-featured__arrow pd-featured__arrow--prev" data-rb-carousel-prev="" aria-label={ctx.t("blog.featuredPrev")} hidden>
              <BlogIcon name="chevron-left" size={20} />
            </button>
            <button type="button" className="pd-featured__arrow pd-featured__arrow--next" data-rb-carousel-next="" aria-label={ctx.t("blog.featuredNext")} hidden>
              <BlogIcon name="chevron-right" size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/** Quantas etiquetas o cartão mostra; o resto vira "+N", como na v1. */
const CARD_TAGS = 3;

function PostCard({ post, level, tagIndexes, ctx }: { post: PostItem; level: number; tagIndexes?: Map<string, number>; ctx: RenderContext }) {
  const tags = tagIndexes ? post.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined;
  const extra = post.tags.length - CARD_TAGS;
  return (
    <li className="rb-card rb-card--link rb-post pd-card" data-tags={tags} data-search={postSearchText(post)}>
      {post.cover && <Img image={post.cover} className="rb-card__image" sizes="(min-width: 960px) 30vw, 100vw" />}
      <div className="rb-card__body">
        <p className="rb-card__meta">
          <Meta post={post} ctx={ctx} />
        </p>
        <H level={level} className="rb-card__title">
          <a href={post.url} className="rb-card__link">
            {post.title}
          </a>
        </H>
        {post.excerpt && <p className="rb-card__text">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="pd-chips pd-chips--small">
            {post.tags.slice(0, CARD_TAGS).map((t) => (
              <li key={t}>{t}</li>
            ))}
            {extra > 0 && <li>+{extra}</li>}
          </ul>
        )}
        <span className="pd-card__more" aria-hidden="true">
          {ctx.t("common.readMore")}
          <BlogIcon name="chevron-right" />
        </span>
      </div>
    </li>
  );
}

/**
 * Bloco `posts-recentes` do padrão. Com "Destaques no topo" e "Busca por texto" (a página do
 * blog), fica como a lista da v1; na home, são só os cartões.
 */
export function PostsBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, PostItem>) {
  const scope = `f-${safeId(id)}`;
  const blogMode = fields.showSearch === true || fields.showFeatured === true;
  const featured = fields.showFeatured === true ? items.filter((p) => p.featured) : [];
  const allTags: string[] = fields.showTagFilter ? [...new Set(items.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const sub = fields.title ? headingLevel + 1 : headingLevel;
  const cardLevel = featured.length > 0 ? sub + 1 : sub;
  const css = filter
    ? tagFilterCss(scope, allTags.length, { filter: ".pd-posts__toolbar" }) +
      // Com uma etiqueta escolhida, o botão do filtro fica aceso (a v1 mostrava a contagem).
      `\n#${scope}-all:not(:checked) ~ .pd-posts__toolbar .pd-filter > summary{border-color:var(--rb-accent);background:color-mix(in srgb,var(--rb-accent) 10%,transparent)}`
    : "";
  return (
    <Section id={id} anchor={fields.anchor} type="posts-recentes" variant={variant} className={blogMode ? "pd-blog" : undefined}>
      {blogMode && fields.title ? (
        <div className="pd-blog__header">
          <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
          <RssLink ctx={ctx} />
        </div>
      ) : (
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      )}
      {featured.length > 0 && <Featured posts={featured} level={sub} scope={scope} ctx={ctx} />}
      {items.length > 0 ? (
        <div className="rb-posts">
          {filter && <style dangerouslySetInnerHTML={{ __html: css }} />}
          {filter && (
            <>
              {/* O rótulo visível fica no painel (fechado, ele some da árvore): o nome vai também aqui. */}
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" aria-label={ctx.t("blog.allTags")} defaultChecked />
              {allTags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" aria-label={t} />
              ))}
            </>
          )}
          {(filter || island) && (
            <div className="pd-posts__toolbar">
              {island && <div className="rb-island pd-posts__search">{island}</div>}
              {filter && (
                <details className="pd-filter">
                  <summary>
                    <BlogIcon name="filter" />
                    {ctx.t("blog.filter")}
                  </summary>
                  <div className="rb-filter pd-filter__panel" role="group" aria-label={ctx.t("blog.filter")}>
                    <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
                    {allTags.map((t, i) => (
                      <label key={t} htmlFor={`${scope}-t${i}`}>
                        {t}
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
          <ul className="rb-grid rb-posts__list">
            {items.map((p) => (
              <PostCard key={p.id} post={p} level={cardLevel} ctx={ctx} tagIndexes={filter ? tagIndexes : undefined} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="rb-actions">
          <LinkButton link={fields.cta} variant="secondary" />
        </div>
      )}
    </Section>
  );
}

/** A listagem do blog: o endereço do post sem o último trecho (`/en/blog/x` → `/en/blog`). */
function listingHref(url: string): string {
  return url.replace(/\/[^/]+\/?$/, "") || "/";
}

/** Fim do post: quem escreveu, como falar com a pessoa e o case que mostra aquilo na prática. */
function PostFooter({ relatedCase, ctx }: Pick<PostTemplateProps, "relatedCase" | "ctx">) {
  const person = ctx.site.person;
  const hasContact = ctx.site.plugins["contact-wizard"] === true;
  const talkHref = ctx.site.kind === "empresa" ? ctx.href("/contato") : `${ctx.href("/")}#contato`;
  if (!person && !relatedCase) return null;
  return (
    <footer className="pd-post__footer">
      {person && (
        <div className="pd-author">
          {person.photo ? (
            <Img image={{ ...person.photo, alt: "" }} className="pd-author__avatar" sizes="48px" />
          ) : (
            <span className="pd-author__avatar pd-author__avatar--initial" aria-hidden="true">
              {person.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="pd-author__body">
            <p className="pd-author__name">{person.name}</p>
            {person.jobTitle && <p className="pd-author__role">{person.jobTitle}</p>}
            <p className="pd-author__line">{ctx.t("blog.authorLine")}</p>
          </div>
          {hasContact &&
            (ctx.site.contactDialog ? (
              <button type="button" className="pd-author__cta" popoverTarget={ctx.site.contactDialog}>
                <BlogIcon name="message" />
                {ctx.t("blog.authorCta")}
              </button>
            ) : (
              <a className="pd-author__cta" href={talkHref}>
                <BlogIcon name="message" />
                {ctx.t("blog.authorCta")}
              </a>
            ))}
        </div>
      )}
      {relatedCase && (
        <a className="pd-related-case" href={relatedCase.url}>
          <span className="pd-related-case__label">{ctx.t("blog.relatedCase")}</span>
          <span className="pd-related-case__title">{relatedCase.title}</span>
          {relatedCase.summary && <span className="pd-related-case__text">{relatedCase.summary}</span>}
          <span className="pd-related-case__more">
            {ctx.t("padrao.readCase")}
            <BlogIcon name="arrow-right" size={14} />
          </span>
        </a>
      )}
    </footer>
  );
}

/** Post como o da v1: coluna de ~56rem centrada, a capa da largura do texto. */
export function PadraoPost({ post, html, relatedCase, ctx }: PostTemplateProps) {
  return (
    <article className="pd-post">
      <a className="pd-post__back" href={listingHref(post.url)}>
        <BlogIcon name="arrow-left" />
        {ctx.t("blog.back")}
      </a>
      <header className="pd-post__header">
        {post.tags.length > 0 && (
          <ul className="pd-chips pd-chips--accent">
            {post.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <h1 className="pd-post__title">{post.title}</h1>
        {post.excerpt && <p className="pd-post__subtitle">{post.excerpt}</p>}
        <p className="pd-post__meta">
          <span>
            <BlogIcon name="calendar" />
            <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt)}</time>
          </span>
          <span>
            <BlogIcon name="clock" />
            {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
          </span>
        </p>
      </header>
      {post.cover && <Img image={post.cover} className="pd-post__cover" priority sizes="(min-width: 1024px) 56rem, 100vw" />}
      <Html html={html} className="rb-prose pd-post__content" />
      <PostFooter relatedCase={relatedCase} ctx={ctx} />
    </article>
  );
}
