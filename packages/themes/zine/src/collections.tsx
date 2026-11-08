/**
 * Blocos do Zine, parte 2: os que listam coleções. Cases como polaroides presas com
 * fita, posts como recortes de jornal, depoimentos como bilhetes, galeria e equipe como
 * polaroides e preços como papéis soltos com carimbo.
 */
import { Heading, Img } from "@rubrica/core/components";
import { HandLink, PostIt, Polaroid, Stamp, Tape, TicketLink, ZHead, ZSection, tilt, tiltAt, truncate } from "./parts";
import { safeId, tagFilterCss } from "./util";
import type { CollectionItems } from "@rubrica/core";
import type { Props } from "./blocks";

type PlanItem = CollectionItems["plans"];
type PostItem = CollectionItems["posts"];
type ProjectItem = CollectionItems["projects"];
type RoutineItem = CollectionItems["routine"];
type TeamItem = CollectionItems["team"];
type TestimonialItem = CollectionItems["testimonials"];

// ---- cases ---------------------------------------------------------------------------------

/**
 * Cases. Variações: `grade` (padrão: polaroides numa grade), `destaque` (a primeira
 * polaroide ocupa duas colunas, como no portfólio da v1) e `lista` (uma por linha).
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, ProjectItem>) {
  return (
    <ZSection type="cases" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <ul className="zn-polgrid">
          {items.map((p, i) => {
            const featured = variant === "destaque" && i === 0;
            const meta = [p.client, p.year].filter(Boolean).join(" · ");
            return (
              <Polaroid
                key={p.id}
                as="li"
                image={p.cover}
                deg={tiltAt(i, featured ? 0.5 : 1.3)}
                tape={i % 3 === 1 ? "right" : "center"}
                className={featured ? "zn-featured" : undefined}
                sizes={featured ? "(min-width: 900px) 60vw, 100vw" : "(min-width: 900px) 30vw, 100vw"}
                ratio={featured ? "16 / 9" : undefined}
              >
                {featured && (
                  <Stamp deg={-4}>
                    <span aria-hidden="true">★</span> {ctx.t("zine.featured")}
                  </Stamp>
                )}
                <Heading level={3} className="zn-pol-title">
                  {p.title}
                </Heading>
                {meta && <p className="zn-pol-meta">{meta}</p>}
                {p.summary && <p className="zn-pol-desc">{truncate(p.summary, featured ? 260 : 160)}</p>}
                {p.tags.length > 0 && (
                  <ul className="zn-tags">
                    {p.tags.slice(0, 4).map((tag) => (
                      <li key={tag}>#{tag}</li>
                    ))}
                  </ul>
                )}
                <div className="zn-pol-action">
                  <a href={p.url} className="zn-handlink zn-stretch">
                    {ctx.t("case.view")} <span aria-hidden="true">→</span>
                    <span className="rb-sr-only">: {p.title}</span>
                  </a>
                </div>
              </Polaroid>
            );
          })}
        </ul>
      ) : (
        <p className="zn-lead">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="zn-handlinks">
          <HandLink link={fields.cta} ctx={ctx} />
        </div>
      )}
    </ZSection>
  );
}

// ---- posts ---------------------------------------------------------------------------------

function ClipMeta({ post, ctx }: { post: PostItem; ctx: Props["ctx"] }) {
  return (
    <p className="zn-clip-meta">
      <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt, "short")}</time>
      <span>{ctx.t("blog.readingTime", { minutes: post.readingMinutes })}</span>
    </p>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="zn-tags">
      {tags.slice(0, 5).map((tag) => (
        <li key={tag}>#{tag}</li>
      ))}
    </ul>
  );
}

/**
 * Posts. Variações: `recortes` (padrão: recortes de jornal numa grade) e `destaque` (o
 * primeiro vira um recorte grande, em duas colunas). O filtro por etiqueta não usa JS:
 * as etiquetas são abas de fita ligadas a botões de opção escondidos.
 */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, PostItem>) {
  const featured = variant === "destaque" ? items[0] : undefined;
  const rest = featured ? items.slice(1) : items;
  const allTags = fields.showTagFilter ? [...new Set(rest.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  return (
    <ZSection type="posts-recentes" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length === 0 && <p className="zn-lead">{ctx.t("common.empty")}</p>}
      {featured && (
        <article className="zn-clip zn-clip-feature zn-tilt" style={tilt(-0.6)}>
          <Tape pos="left" />
          <div className="zn-clip-main">
            <Stamp deg={-3}>
              <span aria-hidden="true">★</span> {ctx.t("zine.featured")}
            </Stamp>
            <Heading level={3} className="zn-clip-title">
              <a href={featured.url} className="zn-clip-link">
                {featured.title}
              </a>
            </Heading>
            <ClipMeta post={featured} ctx={ctx} />
            {featured.excerpt && <p className="zn-clip-cols">{featured.excerpt}</p>}
            <Tags tags={featured.tags} />
          </div>
          {featured.cover && (
            <div className="zn-clip-img">
              <Img image={{ ...featured.cover, alt: "" }} priority sizes="(min-width: 900px) 40vw, 100vw" />
            </div>
          )}
        </article>
      )}
      {rest.length > 0 && (
        <div className="zn-posts">
          {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
          {filter && (
            <>
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {allTags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="zn-tabs" role="group" aria-label={ctx.t("blog.filter")}>
                <label htmlFor={`${scope}-all`} className="zn-tab zn-tilt" style={tilt(-1.5)}>
                  {ctx.t("blog.allTags")}
                </label>
                {allTags.map((t, i) => (
                  <label key={t} htmlFor={`${scope}-t${i}`} className="zn-tab zn-tilt" style={tilt(i % 2 ? -1.5 : 1.5)}>
                    {t}
                  </label>
                ))}
              </div>
            </>
          )}
          <ul className="zn-clips">
            {rest.map((post, i) => (
              <li key={post.id} className="zn-clip-item" data-tags={filter ? post.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined}>
                <article className="zn-clip zn-tilt zn-lift" style={tilt(tiltAt(i, 0.8))}>
                  {i % 3 === 1 && <Tape />}
                  {post.cover && (
                    <div className="zn-clip-img">
                      <Img image={{ ...post.cover, alt: "" }} sizes="(min-width: 900px) 30vw, 100vw" />
                    </div>
                  )}
                  <Heading level={3} className="zn-clip-title">
                    <a href={post.url} className="zn-clip-link zn-stretch">
                      {post.title}
                    </a>
                  </Heading>
                  <ClipMeta post={post} ctx={ctx} />
                  {post.excerpt && <p>{truncate(post.excerpt, 180)}</p>}
                  <Tags tags={post.tags} />
                </article>
              </li>
            ))}
          </ul>
        </div>
      )}
      {fields.cta && (
        <div className="zn-handlinks">
          <HandLink link={fields.cta} ctx={ctx} />
        </div>
      )}
    </ZSection>
  );
}

// ---- depoimentos, galeria, equipe ----------------------------------------------------------

/** Depoimentos como bilhetes colados com fita, a citação em letra à mão. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: Props<any, TestimonialItem>) {
  return (
    <ZSection type="depoimentos" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-notes">
          {items.map((t, i) => (
            <li key={t.id} className="zn-tilt" style={tilt(tiltAt(i, 1.1))}>
              <figure className="zn-note zn-note--quote">
                <Tape pos={i % 2 ? "right" : "center"} />
                <blockquote>
                  <p>“{t.quote}”</p>
                </blockquote>
                <figcaption>
                  {t.author}
                  {(t.role || t.company) && ` · ${[t.role, t.company].filter(Boolean).join(", ")}`}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island zn-island">{island}</div> : null}
    </ZSection>
  );
}

/** Galeria (o dia a dia) como polaroides com legenda à mão. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel }: Props<any, RoutineItem>) {
  return (
    <ZSection type="galeria" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-polgrid zn-polgrid--small">
          {items.map((item, i) => (
            <Polaroid key={item.id} as="li" image={item.image} deg={tiltAt(i, 1.5)} tape={i % 2 ? "right" : "center"} ratio="1" sizes="(min-width: 900px) 22vw, 100vw">
              <Heading level={3} className="zn-pol-title zn-pol-title--small">
                {item.title}
              </Heading>
              {item.description && <p className="zn-pol-desc">{item.description}</p>}
              {item.tags.length > 0 && (
                <ul className="zn-tags">
                  {item.tags.map((t) => (
                    <li key={t}>#{t}</li>
                  ))}
                </ul>
              )}
            </Polaroid>
          ))}
        </ul>
      )}
    </ZSection>
  );
}

/** Equipe como polaroides: retrato, nome à mão, cargo e links. */
export function EquipeBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, TeamItem>) {
  return (
    <ZSection type="equipe" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-polgrid zn-polgrid--small">
          {items.map((m, i) => (
            <Polaroid key={m.id} as="li" image={m.photo} deg={tiltAt(i, 1.4)} tape={i % 2 ? "right" : "center"} ratio="1" halftone sizes="(min-width: 900px) 22vw, 100vw">
              <Heading level={3} className="zn-pol-title zn-pol-title--small">
                {m.name}
              </Heading>
              <p className="zn-pol-meta">{m.role}</p>
              {m.bio && <p className="zn-pol-desc">{m.bio}</p>}
              {m.links.length > 0 && (
                <ul className="zn-links-inline">
                  {m.links.map((l) => (
                    <li key={l.href}>
                      <HandLink link={l} ctx={ctx} className="zn-handlink--small" />
                    </li>
                  ))}
                </ul>
              )}
            </Polaroid>
          ))}
        </ul>
      )}
    </ZSection>
  );
}

// ---- preços --------------------------------------------------------------------------------

/** Planos como papéis soltos; o mais escolhido ganha a cor de destaque e um carimbo. */
export function PrecosBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, PlanItem>) {
  return (
    <ZSection type="precos" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-plans">
          {items.map((plan, i) => (
            <PostIt key={plan.id} as="li" tone={plan.highlighted ? "primary" : "paper"} deg={plan.highlighted ? -0.8 : tiltAt(i, 0.8)} className={`zn-plan${plan.highlighted ? " zn-plan--on" : ""}`}>
              {plan.highlighted && (
                <Stamp deg={4}>
                  <span aria-hidden="true">★</span> {ctx.t("pricing.highlighted")}
                </Stamp>
              )}
              <Heading level={3} className="zn-plan-name">
                {plan.name}
              </Heading>
              {plan.price && <p className="zn-plan-price">{plan.price}</p>}
              {plan.description && <p className="zn-plan-desc">{plan.description}</p>}
              {plan.features.length > 0 && (
                <ul className="zn-plan-features" aria-label={ctx.t("plans.included")}>
                  {plan.features.map((f, n) => (
                    <li key={`${n}-${f}`}>{f}</li>
                  ))}
                </ul>
              )}
              {plan.cta && (
                <div className="zn-plan-cta">
                  <TicketLink link={plan.cta} ctx={ctx} tone={plan.highlighted ? "paper" : "primary"} deg={-1.5} />
                </div>
              )}
            </PostIt>
          ))}
        </ul>
      )}
      {fields.note && <p className="zn-note-text">{fields.note}</p>}
    </ZSection>
  );
}
