/**
 * Blocos do Índice. Todos viram "linhas de catálogo": rótulo à esquerda, conteúdo à
 * direita. Os campos são os do catálogo do núcleo; os textos de interface vêm de
 * `ctx.t("index.*")` (declarados em `texts`).
 */
import type { BlockProps, CollectionItems, ResolvedImage } from "@rubrica/core";
import { Heading, Html, Img } from "@rubrica/core/components";
import { IndexRow, IndexSection, IndexTable, UnderLink, catalogNumber, plainText, type IndexColumn } from "./parts";
import { digits, formatDays, resolveFreeHref, safeId, tagFilterCss } from "./util";

type Props<F = any, I = any> = BlockProps<F, I>;
type PlanItem = CollectionItems["plans"];
type PostItem = CollectionItems["posts"];
type ProjectItem = CollectionItems["projects"];
type RoutineItem = CollectionItems["routine"];
type ResumeItem = CollectionItems["resume"];
type ServiceItem = CollectionItems["services"];
type TeamItem = CollectionItems["team"];
type TestimonialItem = CollectionItems["testimonials"];
type FaqItem = CollectionItems["faq"];

const DASH = "—";

// ---- hero e texto -------------------------------------------------------------------

/** Abertura: a frase de valor é o único momento de tipografia grande. */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const label = fields.showAvailability ? (
    <span className="ix-av">
      <i aria-hidden="true" />
      {ctx.t("hero.available")}
    </span>
  ) : (
    <span className="ix-code">
      {ctx.t("index.sheet")} 001 — {fields.eyebrow || ctx.t("index.intro")}
    </span>
  );
  return (
    <IndexSection type="hero" id={id} variant={variant} label={label} level={0}>
      {fields.title && (
        <Heading level={headingLevel} className="ix-lede">
          {fields.title}
        </Heading>
      )}
      {fields.subtitle && <p className="ix-desc">{fields.subtitle}</p>}
      {!!fields.tags?.length && (
        <ul className="ix-inline ix-muted ix-hero-tags">
          {fields.tags.map((t: { label: string }, i: number) => (
            <li key={`${i}-${t.label}`}>{t.label}</li>
          ))}
        </ul>
      )}
      {(fields.primaryCta || fields.secondaryCta) && (
        <p className="ix-links">
          {fields.primaryCta && <UnderLink link={fields.primaryCta} ctx={ctx} />}
          {fields.secondaryCta && <UnderLink link={fields.secondaryCta} ctx={ctx} />}
        </p>
      )}
      {fields.image && (
        <figure className="ix-hero-img">
          <Img image={fields.image} priority sizes="(min-width: 900px) 60vw, 100vw" />
        </figure>
      )}
    </IndexSection>
  );
}

/** Texto: curto vai em duas colunas (como o "sobre" da v1); longo, em uma coluna legível. */
export function TextoBlock({ id, variant, fields, headingLevel }: Props) {
  const long = plainText(fields.body ?? "").length > 1400;
  const image = fields.image && (
    <figure className="ix-texto-img">
      <Img image={fields.image} sizes="(min-width: 900px) 40vw, 100vw" />
    </figure>
  );
  return (
    <IndexSection type="texto" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel}>
      {fields.imagePosition === "start" && image}
      {fields.body && <Html html={fields.body} className={`ix-rich${long ? " ix-rich--long" : " ix-cols"}`} />}
      {fields.imagePosition !== "start" && image}
    </IndexSection>
  );
}

/** Fechamento: frase grande e um caminho em links sublinhados. O rótulo é decorativo. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  return (
    <IndexSection type="cta" id={id} anchor={fields.anchor} variant={variant} label={ctx.t("index.contact")} level={0}>
      {fields.title && (
        <Heading level={headingLevel} className="ix-lede ix-lede--cta">
          {fields.title}
        </Heading>
      )}
      {fields.body && <p className="ix-desc">{fields.body}</p>}
      {(fields.primary || fields.secondary) && (
        <p className="ix-links ix-links--big">
          {fields.primary && <UnderLink link={fields.primary} ctx={ctx} />}
          {fields.secondary && <UnderLink link={fields.secondary} ctx={ctx} />}
        </p>
      )}
    </IndexSection>
  );
}

// ---- números, listas ----------------------------------------------------------------

/** Números de destaque como lista de definição, o valor acima do rótulo. */
export function NumerosBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  if (!items.length) return null;
  return (
    <IndexSection type="numeros" id={id} anchor={fields.anchor} variant={variant} label={fields.title || ctx.t("index.inNumbers")} level={headingLevel} aside={fields.intro}>
      <dl className="ix-met">
        {items.map((m, i) => (
          <div key={`${i}-${m.label}`}>
            <dt className="ix-met-l">{m.label}</dt>
            <dd className="ix-met-v">{m.value}</dd>
            {m.description && <dd className="ix-met-d">{m.description}</dd>}
          </div>
        ))}
      </dl>
    </IndexSection>
  );
}

/** Itens com título e texto, em linhas numeradas (princípios de trabalho, valores). */
export function ListaItensBlock({ id, variant, fields, headingLevel }: Props) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <IndexSection type="lista-itens" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <List className={`ix-pr${fields.numbered ? "" : " ix-pr--plain"}`}>
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`}>
              {fields.numbered && <span className="ix-num ix-muted">{String(i + 1).padStart(2, "0")}</span>}
              <Heading level={3} className="ix-pr-t">
                {item.title}
              </Heading>
              {item.body && <p>{item.body}</p>}
            </li>
          ))}
        </List>
      )}
    </IndexSection>
  );
}

/** Serviços: título à esquerda, descrição à direita, como linhas de uma lista de definição. */
export function ServicosBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, ServiceItem>) {
  return (
    <IndexSection type="servicos" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <div>
          {items.map((s) => (
            <div key={s.id} className="ix-sv">
              <Heading level={3}>{s.title}</Heading>
              <div>
                {s.description && <p>{s.description}</p>}
                {s.priceLabel && <p className="ix-sv-price">{s.priceLabel}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {fields.cta && (
        <p className="ix-links">
          <UnderLink link={fields.cta} ctx={ctx} />
        </p>
      )}
    </IndexSection>
  );
}

/** Perguntas e respostas abertas, em linhas (sem acordeão: tudo legível de uma vez). */
export function FaqBlock({ id, variant, fields, items, headingLevel }: Props<any, FaqItem>) {
  return (
    <IndexSection type="faq" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <dl className="ix-faq">
          {items.map((q) => (
            <div key={q.id} className="ix-sv">
              <dt>{q.question}</dt>
              <dd>
                <Html html={q.answer} className="ix-rich" />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </IndexSection>
  );
}

// ---- cases e posts ------------------------------------------------------------------

function Ficha({ meta, title, href, text, image, link, tags }: { meta: string; title: string; href: string; text?: string; image?: ResolvedImage; link: string; tags?: string[] }) {
  return (
    <article className="ix-feat">
      <div>
        <p className="ix-feat-meta">{meta}</p>
        <h3>
          <a href={href}>{title}</a>
        </h3>
        {text && <p className="ix-desc">{text}</p>}
        {!!tags?.length && (
          <ul className="ix-inline ix-muted ix-feat-tags">
            {tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <p className="ix-links">
          <a href={href} className="ix-u" aria-hidden="true" tabIndex={-1}>
            {link} <span aria-hidden="true">→</span>
          </a>
        </p>
      </div>
      {image && (
        <figure className="ix-feat-img">
          <Img image={{ ...image, alt: "" }} sizes="(min-width: 900px) 40vw, 100vw" />
        </figure>
      )}
    </article>
  );
}

/**
 * Cases. Variações: `indice` (tabela com a imagem no hover; padrão), `destaque` (o
 * primeiro como ficha, e o índice completo abaixo) e `grade` (figuras com legenda).
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, ProjectItem>) {
  const columns: IndexColumn<ProjectItem>[] = [
    { key: "num", header: ctx.t("index.sheet"), width: "64px", num: true, cell: (_p, i) => catalogNumber(i + 1) },
    { key: "title", header: ctx.t("index.colProject"), title: true, width: "28%", cell: (p) => p.title },
    { key: "client", header: ctx.t("index.colClient"), muted: true, cell: (p) => [p.client, p.year].filter(Boolean).join(", ") || DASH },
    { key: "field", header: ctx.t("index.colField"), muted: true, cell: (p) => p.tags.slice(0, 2).join(", ") || DASH },
    { key: "summary", header: ctx.t("index.colSummary"), width: "26%", cell: (p) => <span className="ix-clamp">{p.summary || DASH}</span> },
  ];
  const table = (rows: ProjectItem[]) => (
    <IndexTable
      caption={fields.title || ctx.t("index.index")}
      rows={rows}
      columns={columns}
      getKey={(p) => p.id}
      getHref={(p) => p.url}
      getPreview={(p, i) => ({ image: p.cover, caption: `${catalogNumber(i + 1)} · ${p.title}` })}
    />
  );
  const more = fields.cta && (
    <p className="ix-more">
      <UnderLink link={fields.cta} ctx={ctx} />
    </p>
  );
  const common = { type: "cases", id, anchor: fields.anchor, variant } as const;
  const first = items[0];

  if (!items.length) {
    return (
      <IndexSection {...common} label={fields.title} level={headingLevel} aside={fields.intro}>
        <p className="ix-muted">{ctx.t("common.empty")}</p>
      </IndexSection>
    );
  }

  if (variant === "destaque" && first) {
    return (
      <section id={fields.anchor || `b-${id}`} className="rb-section rb-cases ix-stack" data-block="cases" data-variant={variant}>
        <IndexRow label={fields.title || ctx.t("index.featured")} level={headingLevel} aside={fields.intro}>
          <Ficha
            meta={[ctx.t("index.featured"), `${ctx.t("index.sheet")} ${catalogNumber(1)}`, first.client].filter(Boolean).join(" · ")}
            title={first.title}
            href={first.url}
            text={first.summary}
            image={first.cover}
            tags={first.tags}
            link={ctx.t("case.view")}
          />
        </IndexRow>
        <IndexRow label={ctx.t("index.index")} level={0} className="ix-row--index">
          <p className="ix-count">{ctx.t("index.total", { n: items.length })}</p>
          {table(items)}
          {more}
        </IndexRow>
      </section>
    );
  }

  if (variant === "grade") {
    return (
      <IndexSection {...common} label={fields.title} level={headingLevel} aside={fields.intro}>
        <ul className="ix-figs">
          {items.map((p, i) => (
            <li key={p.id}>
              <figure>
                {p.cover ? <Img image={p.cover} sizes="(min-width: 900px) 25vw, 100vw" /> : <div className="ix-fig-ph" aria-hidden="true" />}
                <figcaption>
                  <span className="ix-muted ix-fig-n">{catalogNumber(i + 1)} — </span>
                  <Heading level={3} className="ix-fig-t">
                    <a href={p.url} className="ix-row-link ix-fig-link">
                      {p.title}
                    </a>
                  </Heading>
                  {p.summary && <span className="ix-fig-d">{p.summary}</span>}
                  {p.tags.length > 0 && <small>{p.tags.join(", ")}</small>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        {more}
      </IndexSection>
    );
  }

  return (
    <IndexSection {...common} label={fields.title} level={headingLevel} className="ix-s--index">
      {fields.intro && <p className="ix-intro">{fields.intro}</p>}
      {table(items)}
      {more}
    </IndexSection>
  );
}

/**
 * Posts. Variações: `indice` (tabela de data, título, etiquetas e leitura; padrão) e
 * `destaque` (o primeiro como ficha, o resto no índice). O filtro por etiqueta não usa JS.
 */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, PostItem>) {
  const featured = variant === "destaque" ? items[0] : undefined;
  const rows = featured ? items.slice(1) : items;
  const allTags = fields.showTagFilter ? [...new Set(rows.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const columns: IndexColumn<PostItem>[] = [
    { key: "date", header: ctx.t("index.colDate"), width: "120px", num: true, cell: (p) => <time dateTime={p.publishedAt}>{ctx.formatDate(p.publishedAt, "short")}</time> },
    { key: "title", header: ctx.t("index.colTitle"), title: true, width: "46%", cell: (p) => p.title },
    { key: "tags", header: ctx.t("index.colTags"), muted: true, cell: (p) => p.tags.join(", ") || DASH },
    { key: "reading", header: ctx.t("index.colReading"), width: "96px", muted: true, cell: (p) => ctx.t("index.minutes", { minutes: p.readingMinutes }) },
  ];
  const more = fields.cta && (
    <p className="ix-more">
      <UnderLink link={fields.cta} ctx={ctx} />
    </p>
  );
  const tableBody = rows.length > 0 && (
    <>
      {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
      {filter && (
        <>
          <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
          {allTags.map((t, i) => (
            <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
          ))}
          <div className="ix-filter" role="group" aria-label={ctx.t("blog.filter")}>
            <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
            {allTags.map((t, i) => (
              <label key={t} htmlFor={`${scope}-t${i}`}>
                {t}
              </label>
            ))}
          </div>
        </>
      )}
      <div className="ix-tablewrap">
        <IndexTable
          caption={fields.title || ctx.t("index.index")}
          rows={rows}
          columns={columns}
          getKey={(p) => p.id}
          getHref={(p) => p.url}
          getPreview={(p) => ({ image: p.cover, caption: ctx.formatDate(p.publishedAt, "short") })}
          getTags={filter ? (p) => p.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined}
        />
      </div>
      {more}
    </>
  );

  if (!items.length) {
    return (
      <IndexSection type="posts-recentes" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
        <p className="ix-muted">{ctx.t("common.empty")}</p>
      </IndexSection>
    );
  }

  if (featured) {
    return (
      <section id={fields.anchor || `b-${id}`} className="rb-section rb-posts-recentes ix-stack" data-block="posts-recentes" data-variant={variant}>
        <IndexRow label={fields.title || ctx.t("index.featured")} level={headingLevel} aside={fields.intro}>
          <Ficha
            meta={[ctx.formatDate(featured.publishedAt, "long"), ctx.t("blog.readingTime", { minutes: featured.readingMinutes })].join(" · ")}
            title={featured.title}
            href={featured.url}
            text={featured.excerpt}
            image={featured.cover}
            tags={featured.tags}
            link={ctx.t("common.readMore")}
          />
        </IndexRow>
        {tableBody && (
          <IndexRow label={ctx.t("index.index")} level={0} className="ix-row--index">
            <p className="ix-count">{ctx.t("index.total", { n: rows.length })}</p>
            {tableBody}
          </IndexRow>
        )}
      </section>
    );
  }

  return (
    <IndexSection type="posts-recentes" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} className="ix-s--index">
      {fields.intro && <p className="ix-intro">{fields.intro}</p>}
      {tableBody}
    </IndexSection>
  );
}

// ---- depoimentos, galeria, equipe, logos ----------------------------------------------

/** Depoimentos: até três colunas, a citação em cima e o autor embaixo. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: Props<any, TestimonialItem>) {
  return (
    <IndexSection type="depoimentos" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <ul className="ix-tq">
          {items.map((t) => (
            <li key={t.id}>
              <figure>
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>
                  <b>{t.author}</b>
                  {(t.role || t.company) && <span>{[t.role, t.company].filter(Boolean).join(", ")}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
    </IndexSection>
  );
}

/** Galeria: figuras numeradas ("Fig. 01 — …") em grade. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, RoutineItem>) {
  return (
    <IndexSection type="galeria" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <ul className="ix-figs">
          {items.map((item, i) => (
            <li key={item.id}>
              <figure>
                {item.image ? <Img image={item.image} sizes="(min-width: 900px) 25vw, 100vw" /> : <div className="ix-fig-ph" aria-hidden="true" />}
                <figcaption>
                  <Heading level={3} className="ix-fig-t">
                    <span className="ix-muted ix-fig-n">
                      {ctx.t("index.figure")} {String(i + 1).padStart(2, "0")} —{" "}
                    </span>
                    {item.title}
                  </Heading>
                  {item.description && <span className="ix-fig-d">{item.description}</span>}
                  {item.tags.length > 0 && <small>{item.tags.join(", ")}</small>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </IndexSection>
  );
}

/** Equipe: retratos quadrados com nome, cargo, bio curta e links. */
export function EquipeBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, TeamItem>) {
  return (
    <IndexSection type="equipe" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <ul className="ix-figs ix-figs--team">
          {items.map((m) => (
            <li key={m.id}>
              <figure>
                {m.photo ? <Img image={m.photo} sizes="(min-width: 900px) 20vw, 50vw" /> : <div className="ix-fig-ph" aria-hidden="true" />}
                <figcaption>
                  <Heading level={3} className="ix-fig-t">
                    {m.name}
                  </Heading>
                  <span className="ix-muted ix-fig-role">{m.role}</span>
                  {m.bio && <span className="ix-fig-d">{m.bio}</span>}
                  {m.links.length > 0 && (
                    <ul className="ix-inline ix-fig-links">
                      {m.links.map((l) => (
                        <li key={l.href}>
                          <a href={l.href} className="ix-u" {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {l.label}
                            {l.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </IndexSection>
  );
}

/** Logos de clientes numa grade de células com fio fino. */
export function LogosClientesBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const logos: { name?: string; href?: string; image?: ResolvedImage }[] = fields.logos ?? [];
  return (
    <IndexSection type="logos-clientes" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel}>
      {logos.length > 0 && (
        <ul className="ix-logos">
          {logos.map((logo, i) => {
            const link = resolveFreeHref(logo.href, ctx);
            const img = logo.image && <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} sizes="160px" />;
            return (
              <li key={`${i}-${logo.name}`}>
                {link ? (
                  <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {img}
                    {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      )}
    </IndexSection>
  );
}

// ---- preços, contato, localização -----------------------------------------------------

/** Planos em colunas separadas por fio; o destacado inverte as cores. */
export function PrecosBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, PlanItem>) {
  return (
    <IndexSection type="precos" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      {items.length > 0 && (
        <ul className="ix-plans">
          {items.map((plan) => (
            <li key={plan.id} className={plan.highlighted ? "ix-plan ix-plan--on" : "ix-plan"}>
              {plan.highlighted && <p className="ix-plan-badge">{ctx.t("pricing.highlighted")}</p>}
              <Heading level={3} className="ix-plan-name">
                {plan.name}
              </Heading>
              {plan.price && <p className="ix-plan-price">{plan.price}</p>}
              {plan.description && <p className="ix-plan-desc">{plan.description}</p>}
              {plan.features.length > 0 && (
                <ul className="ix-plan-features" aria-label={ctx.t("plans.included")}>
                  {plan.features.map((f, i) => (
                    <li key={`${i}-${f}`}>{f}</li>
                  ))}
                </ul>
              )}
              {plan.cta && <UnderLink link={plan.cta} ctx={ctx} className="ix-plan-cta" />}
            </li>
          ))}
        </ul>
      )}
      {fields.note && <p className="ix-note">{fields.note}</p>}
    </IndexSection>
  );
}

/** Contato: o formulário (ilha) e os canais como linhas de uma lista de definição. */
export function ContatoBlock({ id, variant, fields, headingLevel, ctx, island }: Props) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone;
  const whatsapp = org?.whatsapp ?? ctx.site.person?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const channels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  const ext = <span className="rb-sr-only"> {ctx.t("common.external")}</span>;
  return (
    <IndexSection type="contato" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro} className={mode === "channels" ? "rb-contato--channels" : undefined}>
      {mode !== "channels" && island ? <div className="rb-island ix-form">{island}</div> : null}
      {channels && (
        <dl className="ix-chan" aria-label={ctx.t("contact.channels")}>
          {email && (
            <div className="ix-sv">
              <dt>{ctx.t("contact.email")}</dt>
              <dd>
                <a href={`mailto:${email}`} className="ix-u">
                  {email}
                </a>
              </dd>
            </div>
          )}
          {phone && (
            <div className="ix-sv">
              <dt>{ctx.t("contact.phone")}</dt>
              <dd>
                <a href={`tel:+${digits(phone)}`} className="ix-u">
                  {phone}
                </a>
              </dd>
            </div>
          )}
          {whatsapp && (
            <div className="ix-sv">
              <dt>{ctx.t("contact.whatsapp")}</dt>
              <dd>
                <a href={`https://wa.me/${digits(whatsapp)}`} target="_blank" rel="noopener noreferrer" className="ix-u">
                  {whatsapp}
                  {ext}
                </a>
              </dd>
            </div>
          )}
          {social.map((s) => (
            <div className="ix-sv" key={s.url}>
              <dt>{ctx.t("contact.social")}</dt>
              <dd>
                <a href={s.url} target="_blank" rel="me noopener noreferrer" className="ix-u">
                  {s.network}
                  {ext}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </IndexSection>
  );
}

/** Localização: endereço e horários como linhas de uma lista de definição. */
export function LocalizacaoBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const org = ctx.site.organization;
  const a = org?.address;
  const addressLines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  return (
    <IndexSection type="localizacao" id={id} anchor={fields.anchor} variant={variant} label={fields.title} level={headingLevel} aside={fields.intro}>
      <dl className="ix-chan">
        {addressLines.length > 0 && (
          <div className="ix-sv">
            <dt>{ctx.t("location.address")}</dt>
            <dd>
              <address className="ix-address">
                {addressLines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </address>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="ix-u">
                  {ctx.t("location.map")} <span aria-hidden="true">↗</span>
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              )}
            </dd>
          </div>
        )}
        {hours.length > 0 && (
          <div className="ix-sv">
            <dt>{ctx.t("location.hours")}</dt>
            <dd>
              <ul className="ix-hours">
                {hours.map((h: { days: string; opens: string; closes: string }) => (
                  <li key={`${h.days}-${h.opens}`}>
                    <span>{formatDays(h.days, ctx.locale)}</span>
                    <span className="ix-num">
                      {h.opens} – {h.closes}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </IndexSection>
  );
}

// ---- currículo ------------------------------------------------------------------------

function periodOf(item: ResumeItem, ctx: Props["ctx"]): string {
  if (!item.start && !item.end) return "";
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return `${item.start ? month(item.start) : ""} – ${item.end ? month(item.end) : ctx.t("resume.present")}`;
}

/** Primeira linha da descrição, sem o marcador, para o resumo da ficha. */
function firstLine(text?: string): string {
  const line = (text ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.replace(/^[-•]\s+/, "");
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="ix-bullets">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="ix-bullets-p">{lines.join(" ")}</p>;
}

/**
 * Currículo: uma linha de catálogo por grupo. A experiência é uma lista de fichas
 * (período | cargo | empresa | resumo) que abrem com `<details>`, sem JavaScript.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: Props<any, ResumeItem>) {
  const byKind = (kind: ResumeItem["kind"]) => items.filter((i) => i.kind === kind);
  const experience = byKind("experience");
  const education = byKind("education");
  const skills = byKind("skill");
  const certs = byKind("certification");
  const languages = byKind("language");
  const showHead = fields.title || (fields.showDownload && island);
  const head = (
    <div className="ix-xp-head ix-xp-grid" aria-hidden="true">
      <span>{ctx.t("index.colPeriod")}</span>
      <span>{ctx.t("index.colRole")}</span>
      <span>{ctx.t("index.colOrg")}</span>
      <span>{ctx.t("index.colSummary")}</span>
      <span />
    </div>
  );
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-curriculo ix-stack" data-block="curriculo" data-variant={variant}>
      {showHead && (
        <IndexRow label={fields.title} level={headingLevel} aside={fields.intro}>
          {fields.showDownload && island ? <div className="rb-island ix-download">{island}</div> : null}
        </IndexRow>
      )}
      {experience.length > 0 && (
        <IndexRow label={ctx.t("resume.experience")}>
          {head}
          <ol className="ix-xp">
            {experience.map((i) => {
              const cells = (
                <>
                  <span className="ix-num ix-muted">{periodOf(i, ctx)}</span>
                  <span className="ix-xp-role">{i.title}</span>
                  <span>{[i.organization, i.location].filter(Boolean).join(", ")}</span>
                  <span className="ix-xp-sum ix-muted">{firstLine(i.description)}</span>
                </>
              );
              return (
                <li key={i.id}>
                  {i.description ? (
                    <details className="ix-xp-item">
                      <summary className="ix-xp-row ix-xp-grid">
                        {cells}
                        <span className="ix-xp-sign" aria-hidden="true" />
                      </summary>
                      <div className="ix-xp-panel">
                        <Description text={i.description} />
                      </div>
                    </details>
                  ) : (
                    <div className="ix-xp-static ix-xp-grid">
                      {cells}
                      <span />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </IndexRow>
      )}
      {education.length > 0 && (
        <IndexRow label={ctx.t("resume.education")}>
          <ol className="ix-xp">
            {education.map((i) => (
              <li key={i.id} className="ix-xp-static ix-xp-grid">
                <span className="ix-num ix-muted">{periodOf(i, ctx)}</span>
                <span className="ix-xp-role">{i.title}</span>
                <span>{[i.organization, i.location].filter(Boolean).join(", ")}</span>
                <span className="ix-muted">{firstLine(i.description)}</span>
                <span />
              </li>
            ))}
          </ol>
        </IndexRow>
      )}
      {skills.length > 0 && (
        <IndexRow label={ctx.t("resume.skill")}>
          <ul className="ix-inline ix-inline--big">
            {skills.map((i) => (
              <li key={i.id}>{i.title}</li>
            ))}
          </ul>
        </IndexRow>
      )}
      {certs.length > 0 && (
        <IndexRow label={ctx.t("resume.certification")}>
          <ol className="ix-list-num">
            {certs.map((i, n) => (
              <li key={i.id}>
                <span className="ix-num ix-muted">{catalogNumber(n + 1)}</span>
                <span>{[i.title, i.organization].filter(Boolean).join(" — ")}</span>
              </li>
            ))}
          </ol>
        </IndexRow>
      )}
      {languages.length > 0 && (
        <IndexRow label={ctx.t("resume.language")}>
          <dl className="ix-chan">
            {languages.map((i) => (
              <div key={i.id} className="ix-sv">
                <dt>{i.title}</dt>
                <dd>{firstLine(i.description) || i.organization}</dd>
              </div>
            ))}
          </dl>
        </IndexRow>
      )}
    </section>
  );
}
