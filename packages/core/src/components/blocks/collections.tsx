/** Blocos que listam coleções: cases, posts, depoimentos, perguntas e preços. */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { cases as casesDef, depoimentos as depoimentosDef, faq as faqDef, postsRecentes as postsDef, precos as precosDef } from "../../blocks/catalog";
import type { FaqItem, PlanItem, PostItem, ProjectItem, TestimonialItem } from "../../render/collections";
import { Heading, Html, Img, LinkButton, Section, SectionHeader } from "../primitives";
import { safeId } from "./util";

type CasesFields = ResolvedFields<typeof casesDef.fields>;
type PostsFields = ResolvedFields<typeof postsDef.fields>;
type DepoimentosFields = ResolvedFields<typeof depoimentosDef.fields>;
type FaqFields = ResolvedFields<typeof faqDef.fields>;
type PrecosFields = ResolvedFields<typeof precosDef.fields>;

function SeeAll({ link }: { link?: ResolvedFields<typeof casesDef.fields>["cta"] }) {
  return link ? (
    <div className="rb-actions">
      <LinkButton link={link} variant="secondary" />
    </div>
  ) : null;
}

/** Variações: `default` (grade) e `lista` (uma por linha), como o tema padrão declara. */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<CasesFields, ProjectItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <ul className="rb-grid rb-cases__list">
          {items.map((p) => (
            <li key={p.id} className="rb-card rb-card--link">
              {p.cover && <Img image={p.cover} className="rb-card__image" sizes="(min-width: 960px) 30vw, 100vw" />}
              <div className="rb-card__body">
                <Heading level={3} className="rb-card__title">
                  <a href={p.url} className="rb-card__link">
                    {p.title}
                  </a>
                </Heading>
                {p.summary && <p className="rb-card__text">{p.summary}</p>}
                {p.tags.length > 0 && (
                  <ul className="rb-tags">
                    {p.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                <span className="rb-card__more" aria-hidden="true">
                  {ctx.t("case.view")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      <SeeAll link={fields.cta} />
    </Section>
  );
}

function PostCard({ post, ctx, tagIndexes }: { post: PostItem; ctx: BlockProps["ctx"]; tagIndexes?: Map<string, number> }) {
  const tags = tagIndexes ? post.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined;
  return (
    <li className="rb-card rb-card--link rb-post" data-tags={tags}>
      {post.cover && <Img image={post.cover} className="rb-card__image" sizes="(min-width: 960px) 30vw, 100vw" />}
      <div className="rb-card__body">
        <p className="rb-card__meta">
          <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt)}</time>
          {" · "}
          {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
        </p>
        <Heading level={3} className="rb-card__title">
          <a href={post.url} className="rb-card__link">
            {post.title}
          </a>
        </Heading>
        {post.excerpt && <p className="rb-card__text">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="rb-tags">
            {post.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Filtro por etiqueta SEM JavaScript: botões de opção (`radio`) antes da lista e uma
 * folha de estilo gerada para o bloco esconde os posts que não têm a etiqueta marcada.
 * Sem CSS, a lista aparece inteira. Os ids vêm do índice, nunca do texto da etiqueta.
 */
function tagFilterCss(scope: string, count: number): string {
  const rules: string[] = [];
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ .rb-posts__list > .rb-post:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked ~ .rb-filter label[for="${scope}-t${i}"]{background:var(--rb-accent);color:var(--rb-accent-fg);border-color:var(--rb-accent)}`);
    rules.push(`${radio}:focus-visible ~ .rb-filter label[for="${scope}-t${i}"]{outline:2px solid var(--rb-accent);outline-offset:2px}`);
  }
  rules.push(`#${scope}-all:checked ~ .rb-filter label[for="${scope}-all"]{background:var(--rb-accent);color:var(--rb-accent-fg);border-color:var(--rb-accent)}`);
  rules.push(`#${scope}-all:focus-visible ~ .rb-filter label[for="${scope}-all"]{outline:2px solid var(--rb-accent);outline-offset:2px}`);
  return rules.join("\n");
}

export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<PostsFields, PostItem>) {
  const allTags = fields.showTagFilter ? [...new Set(items.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  return (
    <Section id={id} anchor={fields.anchor} type="posts-recentes" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <div className="rb-posts">
          {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
          {filter && (
            <>
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {allTags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="rb-filter" role="group" aria-label={ctx.t("blog.filter")}>
                <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
                {allTags.map((t, i) => (
                  <label key={t} htmlFor={`${scope}-t${i}`}>
                    {t}
                  </label>
                ))}
              </div>
            </>
          )}
          <ul className="rb-grid rb-posts__list">
            {items.map((p) => (
              <PostCard key={p.id} post={p} ctx={ctx} tagIndexes={filter ? tagIndexes : undefined} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      <SeeAll link={fields.cta} />
    </Section>
  );
}

export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<DepoimentosFields, TestimonialItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-depoimentos__list">
          {items.map((t) => (
            <li key={t.id} className="rb-card">
              <figure className="rb-quote">
                <blockquote className="rb-quote__text">
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className="rb-quote__author">
                  {t.avatar && <Img image={t.avatar} className="rb-quote__avatar" sizes="48px" />}
                  <span>
                    <strong>{t.author}</strong>
                    {(t.role || t.company) && <span className="rb-quote__role">{[t.role, t.company].filter(Boolean).join(", ")}</span>}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
    </Section>
  );
}

export function FaqBlock({ id, variant, fields, items, headingLevel }: BlockProps<FaqFields, FaqItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="rb-faq__list">
          {items.map((q) => (
            <details key={q.id} className="rb-faq__item">
              <summary className="rb-faq__question">{q.question}</summary>
              <Html html={q.answer} className="rb-faq__answer rb-prose" />
            </details>
          ))}
        </div>
      )}
    </Section>
  );
}

export function PrecosBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<PrecosFields, PlanItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="precos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-precos__list">
          {items.map((plan) => (
            <li key={plan.id} className={`rb-card rb-plan${plan.highlighted ? " rb-plan--highlighted" : ""}`}>
              {plan.highlighted && <p className="rb-plan__badge">{ctx.t("pricing.highlighted")}</p>}
              <Heading level={3} className="rb-card__title">{plan.name}</Heading>
              {plan.price && <p className="rb-plan__price">{plan.price}</p>}
              {plan.description && <p className="rb-card__text">{plan.description}</p>}
              {plan.features.length > 0 && (
                <ul className="rb-plan__features" aria-label={ctx.t("plans.included")}>
                  {plan.features.map((f, i) => (
                    <li key={`${i}-${f}`}>{f}</li>
                  ))}
                </ul>
              )}
              {plan.cta && <LinkButton link={plan.cta} variant={plan.highlighted ? "primary" : "secondary"} className="rb-plan__cta" />}
            </li>
          ))}
        </ul>
      )}
      {fields.note && <p className="rb-note">{fields.note}</p>}
    </Section>
  );
}
