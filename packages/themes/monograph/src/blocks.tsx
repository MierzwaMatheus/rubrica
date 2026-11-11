/**
 * Blocos que, na v1, têm visual de livro diferente do padrão do núcleo: folha de rosto
 * (hero), "Em números" com linhas pontilhadas, sumário (cases e posts), prefácio (texto),
 * teses (lista de itens), ofícios (serviços), recepção (depoimentos), perguntas e
 * respostas (faq), pranchas (galeria), currículo com datas na margem e a correspondência
 * (cta). Os outros blocos herdam os do núcleo e ganham o visual pelo CSS.
 */
import type { ReactNode } from "react";
import type { BlockProps, RenderContext } from "@rubrica/core";
import { Heading, Html, Img, LinkButton, Section, SectionHeader, safeId, tagFilterCss as coreTagFilterCss, isHtmlText } from "@rubrica/core/components";
import { folios, joinAsSentence, toRoman } from "./util";

/** Linha de sumário: texto ……… valor. */
function Leader({ children, value, big = false }: { children: ReactNode; value?: ReactNode; big?: boolean }) {
  return (
    <span className={`mn-ld${big ? " mn-ld--big" : ""}`}>
      <span className="mn-ld__t">{children}</span>
      <span className="mn-ld__dots" aria-hidden="true" />
      {value !== undefined && value !== "" ? <span className="mn-ld__v">{value}</span> : null}
    </span>
  );
}

/** Ponto separador entre ações em versalete. */
function Dot() {
  return (
    <span className="mn-sep" aria-hidden="true">
      ·
    </span>
  );
}

type Link = { label: string; href: string; external?: boolean };

function ActLink({ link }: { link: Link }) {
  return (
    <a className="mn-act" href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
    </a>
  );
}

/** Ações em versalete sublinhadas, separadas por ponto. */
function Acts({ links, left = false }: { links: (Link | undefined)[]; left?: boolean }) {
  const list = links.filter((l): l is Link => !!l);
  if (!list.length) return null;
  return (
    <p className={`mn-links${left ? " mn-links--left" : ""}`}>
      {list.map((l, i) => (
        <span key={`${i}-${l.href}`} className="mn-links__item">
          {i > 0 && <Dot />}
          <ActLink link={l} />
        </span>
      ))}
    </p>
  );
}

// ---- hero ---------------------------------------------------------------------------

/**
 * Folha de rosto (`folha-de-rosto`): disponibilidade em itálico, título, fio, autoria e
 * subtítulo em itálico. Abertura de capítulo (`capitulo`): "Capítulo II" no sobretítulo,
 * título, fio e subtítulo. O h1 é o título do bloco; a autoria vem do dono do site.
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const chapter = variant === "capitulo";
  const byline = ctx.site.person?.name ?? ctx.site.name;
  const role = ctx.site.person?.jobTitle;
  return (
    <Section id={id} type="hero" variant={variant}>
      <div className={`rb-hero__body mn-title${chapter ? " mn-title--ch" : ""}`}>
        {!chapter && fields.showAvailability && <p className="mn-av">{ctx.t("hero.available")}</p>}
        {fields.eyebrow && <p className={chapter ? "mn-sc mn-ch-n" : "mn-av"}>{fields.eyebrow}</p>}
        {fields.title && (
          <Heading level={headingLevel} className="rb-hero__title">
            {fields.title}
          </Heading>
        )}
        <hr aria-hidden="true" />
        {!chapter && (
          <p className="mn-sc mn-byline">
            {byline}
            {role && <span className="mn-byline__role"> · {role}</span>}
          </p>
        )}
        {fields.subtitle && <p className="mn-dek rb-hero__subtitle">{fields.subtitle}</p>}
        {!!fields.tags?.length && <p className="mn-entry-meta">{fields.tags.map((t: { label: string }) => t.label).join(" · ")}</p>}
        <Acts links={[fields.primaryCta, fields.secondaryCta]} />
      </div>
      {fields.image && (
        <figure className="mn-fig mn-fig--hero">
          <Img image={fields.image} className="rb-hero__image" priority sizes="(min-width: 960px) 540px, 100vw" />
        </figure>
      )}
    </Section>
  );
}

// ---- números ------------------------------------------------------------------------

/** "Em números": rótulo ……… valor. Sem título, usa o texto padrão do tema. */
export function NumerosBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const items: { label: string; value: string; description?: string }[] = fields.items ?? [];
  return (
    <Section id={id} anchor={fields.anchor} type="numeros" variant={variant}>
      <SectionHeader title={fields.title || ctx.t("monograph.numbers")} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <dl className="mn-m mn-nums">
          {items.map((item, i) => (
            <div key={`${i}-${item.label}`} className="mn-nums__row">
              <dt>
                <span className="mn-ld__t">{item.label}</span>
                <span className="mn-ld__dots" aria-hidden="true" />
              </dt>
              <dd className="mn-nums__value">{item.value}</dd>
              {item.description && <dd className="mn-nums__desc">{item.description}</dd>}
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}

// ---- cases e posts como sumário ----------------------------------------------------

function SeeAll({ link }: { link?: Link }) {
  return link ? (
    <div className="mn-m">
      <Acts links={[{ ...link, label: `${link.label} →` }]} left />
    </div>
  ) : null;
}

/**
 * Cases. `sumario` (padrão): capítulos de um sumário (numeral, título, linha pontilhada e
 * página), com o resumo em itálico. `pranchas`: grade de figuras com legenda.
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  const pages = folios(items.map((p: any) => (p.summary?.length ?? 0) + (p.title?.length ?? 0) * 8));
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length === 0 ? (
        <p className="mn-m mn-entry-sum">{ctx.t("common.empty")}</p>
      ) : variant === "pranchas" ? (
        <ul className="mn-plates mn-wide">
          {items.map((p: any, i: number) => (
            <li key={p.id} className="mn-fig mn-fig--link">
              {p.cover && <Img image={p.cover} sizes="(min-width: 960px) 360px, 100vw" />}
              <div className="mn-fig__cap">
                <p className="mn-sc mn-fig__n">
                  {ctx.t("monograph.plate")} {toRoman(i + 1)}
                  {p.category && ` · ${p.category}`}
                </p>
                <Heading level={3} className="mn-fig__title">
                  <a href={p.url} className="mn-entry-link">
                    {p.title}
                  </a>
                </Heading>
                {p.summary && <p className="mn-entry-sum">{p.summary}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ol className="mn-m mn-toc-list">
          {items.map((p: any, i: number) => (
            <li key={p.id} className="mn-entry">
              <Heading level={3}>
                <a href={p.url} className="mn-entry-link">
                  <Leader big value={`${ctx.t("monograph.page")} ${pages[i]}`}>
                    <em>{toRoman(i + 1)}.</em>
                    {p.title}
                  </Leader>
                </a>
              </Heading>
              {p.summary && <p className="mn-entry-sum">{p.summary}</p>}
              {(p.category || p.tags.length > 0) && <p className="mn-entry-meta">{[p.category, ...p.tags.slice(0, 3)].filter(Boolean).join(" · ")}</p>}
            </li>
          ))}
        </ol>
      )}
      <SeeAll link={fields.cta} />
    </Section>
  );
}

/** Folha de estilo do filtro por etiqueta (botões de opção + `~`), a do núcleo. */
const tagFilterCss = (scope: string, count: number) =>
  coreTagFilterCss(scope, count, {
    items: ".mn-toc-list > .mn-entry",
    filter: ".mn-filter",
    checked: "color:var(--rb-accent);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px",
  });

/** Posts como "Ensaios": sumário com numeral, título, tempo de leitura, subtítulo e data. */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  const allTags: string[] = fields.showTagFilter ? [...new Set<string>(items.flatMap((p: any) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const index = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  return (
    <Section id={id} anchor={fields.anchor} type="posts-recentes" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length === 0 ? (
        <p className="mn-m mn-entry-sum">{ctx.t("common.empty")}</p>
      ) : (
        <div className="mn-m mn-posts">
          {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
          {filter && (
            <>
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {allTags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="mn-filter" role="group" aria-label={ctx.t("blog.filter")}>
                <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
                {allTags.map((t, i) => (
                  <label key={t} htmlFor={`${scope}-t${i}`}>
                    {t}
                  </label>
                ))}
              </div>
            </>
          )}
          <ol className="mn-toc-list">
            {items.map((p: any, i: number) => (
              <li key={p.id} className="mn-entry" data-tags={filter ? p.tags.map((t: string) => `t${index.get(t)}`).join(" ") : undefined}>
                {i === 0 && p.cover && (
                  <figure className="mn-fig">
                    <Img image={p.cover} sizes="(min-width: 960px) 540px, 100vw" />
                    <figcaption>
                      <b>
                        {ctx.t("monograph.plate")} {toRoman(1)}
                      </b>
                      {p.title}
                    </figcaption>
                  </figure>
                )}
                <Heading level={3}>
                  <a href={p.url} className="mn-entry-link" aria-label={`${p.title}, ${ctx.t("blog.readingTime", { minutes: p.readingMinutes })}`}>
                    <Leader big={i === 0} value={ctx.t("monograph.min", { minutes: p.readingMinutes })}>
                      <em>{toRoman(i + 1)}.</em>
                      {p.title}
                    </Leader>
                  </a>
                </Heading>
                {p.excerpt && <p className="mn-entry-sum">{p.excerpt}</p>}
                <p className="mn-entry-meta">
                  <time dateTime={p.publishedAt}>{ctx.formatDate(p.publishedAt)}</time>
                  {p.tags.length > 0 && ` · ${p.tags.slice(0, 3).join(", ")}`}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <SeeAll link={fields.cta} />
    </Section>
  );
}

// ---- texto, lista de itens, serviços ----------------------------------------------

/** Texto como prefácio: título na coluna do rótulo, capitular no primeiro parágrafo, imagem na margem. */
export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="texto" variant={variant}>
      <SectionHeader title={fields.title} level={headingLevel} />
      <div className="mn-m rb-texto__body">{fields.body && <Html html={fields.body} className="rb-prose mn-prose" />}</div>
      {fields.image && (
        <aside className="mn-n">
          <figure className="mn-fig">
            <Img image={fields.image} sizes="(min-width: 960px) 190px, 100vw" />
          </figure>
        </aside>
      )}
    </Section>
  );
}

/** Lista de itens como teses: "§ 1. Título. Texto." (numerada) ou parágrafos com o título em versalete. */
export function ListaItensBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  return (
    <Section id={id} anchor={fields.anchor} type="lista-itens" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ol className="mn-m mn-plain mn-theses">
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`} className="mn-sv">
              {fields.numbered && (
                <span className="mn-sv__n" aria-hidden="true">
                  § {i + 1}
                </span>
              )}
              <b>{item.title}.</b> {item.body}
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/** Serviços como "Ofícios": parágrafos corridos com o nome em versalete. */
export function ServicosBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="mn-m mn-plain">
          {items.map((s: any) => (
            <li key={s.id} className="mn-sv">
              <b>{s.title}.</b> {s.description}
              {s.priceLabel && <i className="mn-sv__price"> — {s.priceLabel}</i>}
            </li>
          ))}
        </ul>
      )}
      {fields.cta && (
        <div className="mn-m">
          <Acts links={[{ ...fields.cta, label: `${fields.cta.label} →` }]} left />
        </div>
      )}
    </Section>
  );
}

// ---- depoimentos, faq, galeria -----------------------------------------------------

/** Depoimentos como "Recepção": citações com aspas grandes na margem. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="mn-m mn-quotes">
          {items.map((t: any) => (
            <figure key={t.id} className="mn-q">
              <blockquote>
                <p>{t.quote}</p>
              </blockquote>
              <figcaption>
                — {t.author}
                {(t.role || t.company) && `, ${[t.role, t.company].filter(Boolean).join(", ")}`}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {fields.allowSubmission && island ? <div className="rb-island mn-m">{island}</div> : null}
    </Section>
  );
}

/** FAQ como perguntas e respostas (P. / R.), sempre abertas, como num catecismo. */
export function FaqBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <dl className="mn-m mn-qa">
          {items.map((q: any) => (
            <div key={q.id}>
              <dt>
                <span className="mn-qa__m" aria-hidden="true">
                  {ctx.t("monograph.question")}
                </span>
                <span>{q.question}</span>
              </dt>
              <dd>
                <span className="mn-qa__m" aria-hidden="true">
                  {ctx.t("monograph.answer")}
                </span>
                <Html html={q.answer} className="mn-qa__a" />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}

/** Galeria como "Pranchas": figuras numeradas em romano com legenda. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="mn-m mn-plates mn-plates--pair">
          {items.map((item: any, i: number) => (
            <li key={item.id}>
              <figure className="mn-fig">
                {item.image && <Img image={item.image} sizes="(min-width: 960px) 260px, 50vw" />}
                <figcaption>
                  <b>
                    {ctx.t("monograph.plate")} {toRoman(i + 1)}
                  </b>
                  {item.title}
                  {item.description ? `. ${item.description}` : ""}
                  {item.tags.length > 0 && <span className="mn-fig__tags"> — {item.tags.join(", ")}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ---- currículo ---------------------------------------------------------------------

const ENTRY_KINDS = ["experience", "education", "certification"] as const;
const SENTENCE_KINDS = ["skill", "language"] as const;

function period(item: any, ctx: RenderContext): string {
  if (!item.start && !item.end) return "";
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return `${item.start ? month(item.start) : ""} – ${item.end ? month(item.end) : ctx.t("resume.present")}`;
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  if (isHtmlText(text)) return <Html html={text} className="rb-prose rb-resume__desc" />;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length && bullets.length === lines.length) {
    return (
      <ul className="mn-list">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="mn-rich">{lines.join(" ")}</p>;
}

/** Currículo: entradas com as datas na margem; competências e idiomas em parágrafos corridos. */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, any>) {
  const byKind = (kind: string) => items.filter((i: any) => i.kind === kind);
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island rb-resume__download mn-m">{island}</div> : null}
      {ENTRY_KINDS.map((kind) => {
        const list = byKind(kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="mn-group" aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="mn-k">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            {list.map((i: any) => {
              const date = period(i, ctx);
              return (
                <div key={i.id} className="mn-cv-entry">
                  <div className="mn-m mn-cv">
                    {date && <p className="mn-cv__date">{date}</p>}
                    <div>
                      <h4 className="mn-cv__role">{i.title}</h4>
                      {(i.organization || i.location) && <p className="mn-cv__org">{[i.organization, i.location].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <Description text={i.description} />
                  </div>
                  {date && (
                    <aside className="mn-n mn-n--date">
                      <p>{date}</p>
                    </aside>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
      {SENTENCE_KINDS.map((kind) => {
        const list = byKind(kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="mn-group" aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="mn-k">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            <p className="mn-m mn-sv">{joinAsSentence(list.map((i: any) => i.title), ctx.locale)}.</p>
          </section>
        );
      })}
    </Section>
  );
}

// ---- cta ---------------------------------------------------------------------------

/** Chamada final como "Correspondência": título centralizado, texto e botões. */
export function CtaBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
      <div className="mn-title mn-title--end">
        {fields.title && (
          <Heading level={headingLevel} className="mn-cta__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <p className="mn-desc">{fields.body}</p>}
        {(fields.primary || fields.secondary) && (
          <div className="mn-btns">
            {fields.primary && <LinkButton link={fields.primary} />}
            {fields.secondary && <LinkButton link={fields.secondary} variant="secondary" />}
          </div>
        )}
      </div>
    </Section>
  );
}
