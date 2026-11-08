/**
 * Blocos que, na v1 magazine, têm visual diferente do padrão do núcleo: capa, cases,
 * serviços, depoimentos, texto, cta, FAQ ("A Entrevista"), posts (sumário), galeria e
 * currículo. Os outros herdam o componente do núcleo e ganham o visual pelo CSS.
 * Componentes puros: só props, sem estado.
 */
import type { ReactNode } from "react";
import type { BlockProps, RenderContext } from "@rubrica/core";
import { Heading, Html, Img, LinkButton, Section, SectionHeader, safeId, tagFilterCss as coreTagFilterCss } from "@rubrica/core/components";

const num = (i: number) => String(i + 1).padStart(2, "0");

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/* ---------- capa ---------- */

/** Capa: sobretítulo, manchete gigante e, abaixo, o apoio em itálico com os botões. */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const role = fields.eyebrow || ctx.site.person?.jobTitle;
  return (
    <Section id={id} type="hero" variant={variant}>
      <div className="rb-hero__body">
        <p className="rb-hero__kicker">
          <span aria-hidden="true">↘ </span>
          {ctx.t("magazine.hero.cover")}
          {role ? ` · ${role}` : ""}
        </p>
        {fields.showAvailability && (
          <p className="rb-hero__availability">
            <span className="rb-hero__dot" aria-hidden="true" />
            {ctx.t("hero.available")}
          </p>
        )}
        {fields.title && (
          <Heading level={headingLevel} className="rb-hero__title">
            {fields.title}
          </Heading>
        )}
      </div>
      <div className="rb-hero__deck">
        {fields.subtitle && <p className="rb-hero__subtitle">{fields.subtitle}</p>}
        {!!fields.tags?.length && (
          <ul className="rb-hero__tags">
            {fields.tags.map((t: { label: string }, i: number) => (
              <li key={`${i}-${t.label}`}>{t.label}</li>
            ))}
          </ul>
        )}
        {(fields.primaryCta || fields.secondaryCta) && (
          <div className="rb-actions">
            {fields.primaryCta && <LinkButton link={fields.primaryCta} />}
            {fields.secondaryCta && <LinkButton link={fields.secondaryCta} variant="secondary" />}
          </div>
        )}
      </div>
      {fields.image && <Img image={fields.image} className="rb-hero__image" priority sizes="(min-width: 960px) 40vw, 100vw" />}
    </Section>
  );
}

/* ---------- texto ---------- */

/** Texto: `coluna` (capitular e duas colunas) ou `ensaio` (centralizado, em itálico). */
export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  const image = fields.image && <Img image={fields.image} className="rb-texto__image" sizes="(min-width: 960px) 40vw, 100vw" />;
  return (
    <Section id={id} anchor={fields.anchor} type="texto" variant={variant} className={image ? "rb-texto--media" : undefined}>
      {fields.imagePosition === "start" && image}
      <div className="rb-texto__body">
        {fields.title && (
          <Heading level={headingLevel} className="rb-section__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <Html html={fields.body} className="rb-prose" />}
      </div>
      {fields.imagePosition !== "start" && image}
    </Section>
  );
}

/* ---------- cases ---------- */

/**
 * Cases. `grade`: colunas numeradas (a home da v1); `lista`: uma obra por linha, com a
 * imagem alternando de lado (o portfólio da v1). A "categoria" é a primeira etiqueta.
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <ol className="rb-mcases">
          {items.map((p: any, i: number) => {
            const category = p.tags[0] ?? p.client;
            return (
              <li key={p.id} className="rb-mcase">
                {p.cover && <Img image={p.cover} className="rb-mcase__cover" sizes="(min-width: 960px) 40vw, 100vw" />}
                <div className="rb-mcase__body">
                  <p className="rb-mcase__head">
                    <span className="rb-mcase__num" aria-hidden="true">
                      {num(i)}
                    </span>
                    {category && <span className="rb-mcase__cat">{category}</span>}
                  </p>
                  <Heading level={3} className="rb-mcase__title">
                    <a href={p.url} className="rb-mcase__link">
                      {p.title}
                    </a>
                  </Heading>
                  {p.summary && <p className="rb-mcase__summary">{p.summary}</p>}
                  <p className="rb-mcase__foot">
                    <span className="rb-mcase__more" aria-hidden="true">
                      {ctx.t("magazine.case.read")}
                    </span>
                    {p.tags.slice(1, 5).map((t: string) => (
                      <span key={t} className="rb-mcase__tag">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="rb-mcases__all">
          <a href={fields.cta.href} className="rb-mag-link">
            {fields.cta.label} →
          </a>
        </div>
      )}
    </Section>
  );
}

/* ---------- serviços ---------- */

/** Dossiê de capacidades: número grande ao lado de título e texto, com fio embaixo. */
export function ServicosBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-mservicos">
          {items.map((s: any, i: number) => (
            <li key={s.id} className="rb-mservico">
              <span className="rb-mservico__num" aria-hidden="true">
                {num(i)}
              </span>
              <div>
                <Heading level={3} className="rb-mservico__title">
                  {s.title}
                </Heading>
                {s.description && <p className="rb-mservico__text">{s.description}</p>}
                {s.priceLabel && <p className="rb-mservico__price">{s.priceLabel}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {fields.cta && (
        <div className="rb-actions">
          <LinkButton link={fields.cta} />
        </div>
      )}
    </Section>
  );
}

/* ---------- depoimentos ---------- */

/** Vozes do campo: a primeira citação em destaque (grande, centralizada); as outras em colunas. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: BlockProps<any, any>) {
  const [lead, ...rest] = items as any[];
  const who = (t: any) => [t.role, t.company].filter(Boolean).join(", ");
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {lead && (
        <figure className="rb-mlead">
          <blockquote className="rb-mlead__quote">
            <p>{lead.quote}</p>
          </blockquote>
          <figcaption className="rb-mlead__author">
            {lead.avatar && <Img image={lead.avatar} className="rb-quote__avatar" sizes="48px" />}
            <span>
              <strong>{lead.author}</strong>
              {who(lead) && <span className="rb-mlead__role">{who(lead)}</span>}
            </span>
          </figcaption>
        </figure>
      )}
      {rest.length > 0 && (
        <ul className="rb-mquotes">
          {rest.map((t) => (
            <li key={t.id}>
              <figure className="rb-mquote">
                <blockquote className="rb-mquote__text">
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption className="rb-mquote__author">
                  <strong>{t.author}</strong>
                  {who(t) && <span>{who(t)}</span>}
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

/* ---------- cta ---------- */

/** Carta ao leitor: fechamento centralizado entre dois fios. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
      <div className="rb-mcta">
        <p className="rb-mcta__kicker">
          <span aria-hidden="true">↘ </span>
          {ctx.t("magazine.cta.eyebrow")}
        </p>
        {fields.title && (
          <Heading level={headingLevel} className="rb-mcta__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <p className="rb-mcta__body">{fields.body}</p>}
        <div className="rb-actions">
          {fields.primary && <LinkButton link={fields.primary} />}
          {fields.secondary && <LinkButton link={fields.secondary} variant="secondary" />}
        </div>
      </div>
    </Section>
  );
}

/* ---------- faq ---------- */

/** A entrevista: perguntas numeradas (P 01) e respostas com fio lateral, tudo à vista. */
export function FaqBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="rb-mfaq">
          {items.map((q: any, i: number) => (
            <div key={q.id} className="rb-mfaq__item">
              <p className="rb-mfaq__label" aria-hidden="true">
                {ctx.t("magazine.faq.prefix")} {num(i)}
              </p>
              <Heading level={3} className="rb-mfaq__question">
                {q.question}
              </Heading>
              <Html html={q.answer} className="rb-mfaq__answer" />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- posts ---------- */

/**
 * Filtro por etiqueta sem JavaScript (o do núcleo): botões de opção antes da lista e uma
 * folha gerada esconde os posts sem a etiqueta marcada.
 */
const tagFilterCss = (scope: string, count: number) =>
  coreTagFilterCss(scope, count, { checked: "background:var(--rb-fg);color:var(--rb-bg);border-color:var(--rb-fg)" });

/**
 * Posts. `sumario`: o primeiro é a matéria de capa e os outros um índice numerado;
 * `colunas`: três colunas com imagem. A mesma lista serve às duas (o CSS muda o desenho).
 */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  const allTags: string[] = fields.showTagFilter ? [...new Set<string>(items.flatMap((p: any) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
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
          <ul className="rb-posts__list">
            {items.map((p: any) => (
              <li key={p.id} className="rb-post" data-tags={filter ? p.tags.map((t: string) => `t${tagIndexes.get(t)}`).join(" ") : undefined}>
                {p.cover && <Img image={p.cover} className="rb-post__image" sizes="(min-width: 960px) 40vw, 100vw" />}
                <div className="rb-post__main">
                  <p className="rb-post__kicker">
                    <span aria-hidden="true">↘ </span>
                    {ctx.t("magazine.blog.featured")}
                  </p>
                  <Heading level={3} className="rb-post__heading">
                    <a href={p.url} className="rb-post__link">
                      {p.title}
                    </a>
                  </Heading>
                  {p.excerpt && <p className="rb-post__excerpt">{p.excerpt}</p>}
                </div>
                {p.tags.length > 0 && <p className="rb-post__tags">{p.tags.slice(0, 3).join(" · ")}</p>}
                <p className="rb-post__date">
                  <time dateTime={p.publishedAt}>{ctx.formatDate(p.publishedAt, "short")}</time>
                  <span>{ctx.t("blog.readingTime", { minutes: p.readingMinutes })}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="rb-mcases__all">
          <a href={fields.cta.href} className="rb-mag-link">
            {fields.cta.label} →
          </a>
        </div>
      )}
    </Section>
  );
}

/* ---------- galeria (dia a dia) ---------- */

/** Dia a dia: texto em colunas de jornal, com a capitular na primeira entrada. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="rb-mgaleria">
          {items.map((item: any) => (
            <article key={item.id} className="rb-mgaleria__item">
              {item.image && <Img image={item.image} className="rb-mgaleria__image" sizes="(min-width: 960px) 30vw, 100vw" />}
              <Heading level={3} className="rb-mgaleria__title">
                {item.title}
              </Heading>
              {item.description && <p className="rb-mgaleria__text">{item.description}</p>}
              {item.tags.length > 0 && <p className="rb-mgaleria__tags">{item.tags.join(" · ")}</p>}
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- currículo ---------- */

type Item = { id: string; kind: string; title: string; organization?: string; location?: string; start?: string; end?: string; description?: string };

function period(item: Item, ctx: RenderContext) {
  if (!item.start && !item.end) return null;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return (
    <span className="rb-mres__period">
      {item.start && <time dateTime={item.start}>{month(item.start)}</time>}
      {" – "}
      {item.end ? <time dateTime={item.end}>{month(item.end)}</time> : ctx.t("resume.present")}
    </span>
  );
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="rb-mres__bullets">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="rb-mres__text">{lines.join(" ")}</p>;
}

/**
 * Currículo em seções numeradas (§ I, § II...): trajetória em linhas com período à
 * esquerda, competências em colunas, formação e idiomas lado a lado, certificações em
 * colunas de índice.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, Item>) {
  const by = (kind: string) => items.filter((i) => i.kind === kind);
  let n = 0;
  const Group = ({ kind, children, className }: { kind: string; children: ReactNode; className?: string }) => {
    const roman = ROMAN[n++] ?? String(n);
    return (
      <section className={`rb-mres__group rb-mres__group--${kind}${className ? ` ${className}` : ""}`} aria-labelledby={`${id}-${kind}`}>
        <Heading level={3} id={`${id}-${kind}`} className="rb-mres__heading">
          <span aria-hidden="true">§ {roman} · </span>
          {ctx.t(`resume.${kind}`)}
        </Heading>
        {children}
      </section>
    );
  };
  const experience = by("experience");
  const skills = by("skill");
  const education = by("education");
  const languages = by("language");
  const certs = by("certification");
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island rb-resume__download">{island}</div> : null}
      {experience.length > 0 && (
        <Group kind="experience">
          <ol className="rb-mres__list">
            {experience.map((item, i) => (
              <li key={item.id} className="rb-mres__row">
                <div className="rb-mres__side">
                  <span className="rb-mres__num" aria-hidden="true">
                    {num(i)}
                  </span>
                  {period(item, ctx)}
                  {item.organization && <span className="rb-mres__org">{item.organization}</span>}
                </div>
                <div>
                  <Heading level={3} className="rb-mres__role">
                    {item.title}
                  </Heading>
                  {item.location && <p className="rb-mres__where">{item.location}</p>}
                  <Description text={item.description} />
                </div>
              </li>
            ))}
          </ol>
        </Group>
      )}
      {skills.length > 0 && (
        <Group kind="skill">
          <ul className="rb-mres__skills">
            {skills.map((s) => (
              <li key={s.id}>{s.title}</li>
            ))}
          </ul>
        </Group>
      )}
      {(education.length > 0 || languages.length > 0) && (
        <div className="rb-mres__pair">
          {education.length > 0 && (
            <Group kind="education">
              <ul className="rb-mres__plain">
                {education.map((e) => (
                  <li key={e.id}>
                    <p className="rb-mres__degree">
                      {e.title}
                      {e.organization && <em> · {e.organization}</em>}
                    </p>
                    {period(e, ctx)}
                    <Description text={e.description} />
                  </li>
                ))}
              </ul>
            </Group>
          )}
          {languages.length > 0 && (
            <Group kind="language">
              <ul className="rb-mres__plain">
                {languages.map((l) => (
                  <li key={l.id}>
                    <p className="rb-mres__degree">{l.title}</p>
                    {l.description && <span className="rb-mres__level">{l.description}</span>}
                  </li>
                ))}
              </ul>
            </Group>
          )}
        </div>
      )}
      {certs.length > 0 && (
        <Group kind="certification">
          <ol className="rb-mres__index">
            {certs.map((c, i) => (
              <li key={c.id}>
                <span className="rb-mres__idx" aria-hidden="true">
                  {num(i)}
                </span>
                {c.title}
                {c.organization ? `, ${c.organization}` : ""}
              </li>
            ))}
          </ol>
        </Group>
      )}
    </Section>
  );
}
