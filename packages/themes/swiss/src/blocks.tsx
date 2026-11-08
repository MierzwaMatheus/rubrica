/**
 * Blocos do Swiss que diferem do padrão do núcleo. Os cabeçalhos de seção reaproveitam
 * `SectionHeader` do núcleo: o CSS do tema o transforma no cabeçalho de "capítulo" (rótulo
 * numerado à esquerda, título grande). Os blocos que não aparecem aqui (faq, contato,
 * equipe, localização, logos, preços) herdam o componente padrão e só ganham o visual por CSS.
 * Textos de interface vêm de `ctx.t("swiss.*")`; sem texto fixo.
 */
import type { BlockProps, CollectionItems } from "@rubrica/core";
import { Heading, Html, Img, Section, SectionHeader } from "@rubrica/core/components";
import { safeId, splitName, tagFilterCss, two } from "./util";

type Props<F = any, I = any> = BlockProps<F, I>;
type PostItem = CollectionItems["posts"];
type ProjectItem = CollectionItems["projects"];
type RoutineItem = CollectionItems["routine"];
type ResumeItem = CollectionItems["resume"];
type ServiceItem = CollectionItems["services"];
type TestimonialItem = CollectionItems["testimonials"];

const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Botão quadrado de borda grossa, como na v1. */
function Btn({ link, kind }: { link: NonNullable<Props["fields"]["primaryCta"]>; kind: "solid" | "line" }) {
  return (
    <a href={link.href} className={`sw-btn sw-btn--${kind}`} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
      <span aria-hidden="true">{link.external ? "↗" : link.href.startsWith("#") ? "↓" : "→"}</span>
    </a>
  );
}

// ---- hero ---------------------------------------------------------------------------

/**
 * Faixa de abertura: kicker numerado, título enorme, nome e cargo em destaque, botões e,
 * à direita, o avatar com o texto de apresentação (o subtítulo).
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const { site } = ctx;
  const person = site.person;
  const name = person?.name ?? site.name;
  const first = splitName(name);
  const label = first.single ? first.initial : name.trim().split(/\s+/)[0]!;
  const role = person?.jobTitle;
  const avatar = fields.image ?? person?.photo;
  const personal = site.kind === "pessoal";
  return (
    <section id={`b-${id}`} className="rb-section rb-hero sw-hero sw-grid" data-block="hero" data-variant={variant}>
      <div className="sw-hero-in">
        <div className="sw-hero-main">
          {fields.showAvailability && (
            <p className="sw-av">
              <i aria-hidden="true" />
              {ctx.t("hero.available")}
            </p>
          )}
          <p className="sw-kicker sw-ch">— {fields.eyebrow || ctx.t("swiss.cover")}</p>
          {fields.title && (
            <Heading level={headingLevel} className="sw-hero-title">
              {fields.title}
            </Heading>
          )}
          <p className="sw-byline">
            <span className="sw-mark">{label}</span>
            {role ? <> — {role}</> : null}
          </p>
          {!!fields.tags?.length && (
            <ul className="sw-chips">
              {fields.tags.map((t: { label: string }, i: number) => (
                <li key={`${i}-${t.label}`}>{t.label}</li>
              ))}
            </ul>
          )}
          {(fields.primaryCta || fields.secondaryCta) && (
            <div className="sw-btns">
              {fields.primaryCta && <Btn link={fields.primaryCta} kind="solid" />}
              {fields.secondaryCta && <Btn link={fields.secondaryCta} kind="line" />}
            </div>
          )}
        </div>
        <div className="sw-hero-side">
          {avatar ? (
            <Img image={avatar} className={personal ? "sw-avatar" : "sw-figure"} priority sizes="(min-width: 960px) 30vw, 100vw" />
          ) : personal ? (
            <span className="sw-avatar sw-avatar--ph" aria-hidden="true">
              {name.trim()[0]}
            </span>
          ) : null}
          {fields.subtitle && <p className="sw-hero-text">{fields.subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

// ---- texto, cta ---------------------------------------------------------------------

/** Texto em colunas com capitular quando curto; coluna única e legível quando longo. */
export function TextoBlock({ id, variant, fields, headingLevel }: Props) {
  const long = plainText(fields.body ?? "").length > 1400;
  const image = fields.image && (
    <figure className="sw-figure-wrap">
      <Img image={fields.image} className="sw-figure" sizes="(min-width: 960px) 40vw, 100vw" />
    </figure>
  );
  return (
    <Section id={id} anchor={fields.anchor} type="texto" variant={variant} className={image ? "rb-texto--media" : undefined}>
      <SectionHeader title={fields.title} level={headingLevel} />
      <div className="sw-texto">
        {fields.imagePosition === "start" && image}
        {fields.body && <Html html={fields.body} className={`sw-prose${long ? " sw-prose--long" : ""}`} />}
        {fields.imagePosition !== "start" && image}
      </div>
    </Section>
  );
}

/** Fechamento: faixa na cor de destaque, título grande e dois caminhos. */
export function CtaBlock({ id, variant, fields, headingLevel }: Props) {
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-cta sw-cta" data-block="cta" data-variant={variant}>
      <div className="sw-cta-in">
        <div className="sw-cta-text">
          <p className="sw-kicker sw-ch" aria-hidden="true" />
          {fields.title && (
            <Heading level={headingLevel} className="sw-cta-title">
              {fields.title}
            </Heading>
          )}
          {fields.body && <p className="sw-cta-body">{fields.body}</p>}
        </div>
        {(fields.primary || fields.secondary) && (
          <div className="sw-btns">
            {fields.primary && <Btn link={fields.primary} kind="solid" />}
            {fields.secondary && <Btn link={fields.secondary} kind="line" />}
          </div>
        )}
      </div>
    </section>
  );
}

// ---- números, listas ----------------------------------------------------------------

/** Faixa de números: o primeiro invertido, linhas verticais entre eles. */
export function NumerosBlock({ id, variant, fields, headingLevel }: Props) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  if (!items.length) return null;
  const hasHeader = !!(fields.title || fields.intro);
  return (
    <Section id={id} anchor={fields.anchor} type="numeros" variant={variant} className={hasHeader ? undefined : "sw-bare"}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <dl className="sw-met">
        {items.map((m, i) => (
          <div key={`${i}-${m.label}`} className="sw-met-i">
            <dt className="sw-met-l">{m.label}</dt>
            <dd className="sw-met-v">{m.value}</dd>
            {m.description && <dd className="sw-met-d">{m.description}</dd>}
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** Células numeradas em grade com borda; a primeira na cor de destaque (princípios, valores). */
export function ListaItensBlock({ id, variant, fields, headingLevel }: Props) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <Section id={id} anchor={fields.anchor} type="lista-itens" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <List className="sw-cells">
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`}>
              <span className="sw-cell-n" aria-hidden="true">
                {two(i + 1)}
              </span>
              <Heading level={3} className="sw-cell-t">
                {item.title}
              </Heading>
              {item.body && <p>{item.body}</p>}
            </li>
          ))}
        </List>
      )}
    </Section>
  );
}

/** Serviços: quatro células com número grande; a primeira na cor de destaque. */
export function ServicosBlock({ id, variant, fields, items, headingLevel }: Props<any, ServiceItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="sw-cells">
          {items.map((s, i) => (
            <li key={s.id}>
              <span className="sw-cell-n" aria-hidden="true">
                {two(i + 1)}
              </span>
              <Heading level={3} className="sw-cell-t">
                {s.title}
              </Heading>
              {s.description && <p>{s.description}</p>}
              {s.priceLabel && <p className="sw-cell-meta">{s.priceLabel}</p>}
            </li>
          ))}
        </ul>
      )}
      {fields.cta && (
        <div className="sw-btns">
          <Btn link={fields.cta} kind="line" />
        </div>
      )}
    </Section>
  );
}

// ---- cases e posts ------------------------------------------------------------------

/** Cases: grade de fichas com 1px de linha entre elas e imagem em preto e branco. `lista` = uma por linha. */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, ProjectItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <ul className="sw-tiles">
          {items.map((p, i) => (
            <li key={p.id} className="sw-tile">
              <div className="sw-tile-img">{p.cover && <Img image={p.cover} sizes="(min-width: 960px) 30vw, 100vw" />}</div>
              <div className="sw-tile-body">
                <span className="sw-tile-n">
                  .{two(i + 1)}
                  {p.tags[0] ? ` / ${p.tags[0]}` : ""}
                </span>
                <Heading level={3} className="sw-tile-t">
                  <a href={p.url} className="sw-cover-link">
                    {p.title}
                  </a>
                </Heading>
                {p.summary && <p className="sw-tile-s">{p.summary}</p>}
                <span className="sw-tile-more" aria-hidden="true">
                  {ctx.t("case.view")} →
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="sw-btns">
          <Btn link={fields.cta} kind="line" />
        </div>
      )}
    </Section>
  );
}

function PostTile({ post, index, ctx, tags }: { post: PostItem; index: number; ctx: Props["ctx"]; tags?: string }) {
  return (
    <li className="sw-tile sw-post" data-tags={tags}>
      {post.cover && (
        <div className="sw-tile-img">
          <Img image={post.cover} sizes="(min-width: 960px) 30vw, 100vw" />
        </div>
      )}
      <div className="sw-tile-body">
        <span className="sw-tile-n">
          .{two(index + 1)} / <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt)}</time> · {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
        </span>
        <Heading level={3} className="sw-tile-t">
          <a href={post.url} className="sw-cover-link">
            {post.title}
          </a>
        </Heading>
        {post.excerpt && <p className="sw-tile-s">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="sw-chips">
            {post.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <span className="sw-tile-more" aria-hidden="true">
          {ctx.t("common.readMore")} →
        </span>
      </div>
    </li>
  );
}

/** Posts: grade de fichas; `destaque` abre com o primeiro post em duas colunas. Filtro por etiqueta em CSS. */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, PostItem>) {
  const allTags = fields.showTagFilter ? [...new Set(items.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const tagsOf = (p: PostItem) => (filter ? p.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined);
  return (
    <Section id={id} anchor={fields.anchor} type="posts-recentes" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 ? (
        <div className="sw-posts">
          {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
          {filter && (
            <>
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {allTags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="sw-filter" role="group" aria-label={ctx.t("blog.filter")}>
                <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
                {allTags.map((t, i) => (
                  <label key={t} htmlFor={`${scope}-t${i}`}>
                    {t}
                  </label>
                ))}
              </div>
            </>
          )}
          <ul className="sw-tiles sw-posts-list">
            {items.map((p, i) => (
              <PostTile key={p.id} post={p} index={i} ctx={ctx} tags={tagsOf(p)} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
      {fields.cta && (
        <div className="sw-btns">
          <Btn link={fields.cta} kind="line" />
        </div>
      )}
    </Section>
  );
}

// ---- depoimentos --------------------------------------------------------------------

/** Depoimentos: o primeiro em bloco invertido com aspas enormes; os outros numa coluna de fichas. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: Props<any, TestimonialItem>) {
  const [first, ...rest] = items;
  const who = (t: TestimonialItem) => [t.author, [t.role, t.company].filter(Boolean).join(", ")].filter(Boolean);
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {first && (
        <div className={`sw-voices${rest.length ? "" : " sw-voices--one"}`}>
          <figure className="sw-quote">
            <span className="sw-quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>
              <p>{first.quote}</p>
            </blockquote>
            <figcaption>
              {first.avatar && <Img image={first.avatar} className="sw-quote-avatar" sizes="48px" />}— {who(first).join(" / ")}
            </figcaption>
          </figure>
          {rest.length > 0 && (
            <ul className="sw-voices-list">
              {rest.map((t, i) => (
                <li key={t.id}>
                  <figure>
                    <p className="sw-voice-head">
                      <span>{t.author}</span>
                      <span aria-hidden="true">.{two(i + 2)}</span>
                    </p>
                    <blockquote>
                      <p>“{t.quote}”</p>
                    </blockquote>
                    {(t.role || t.company) && <figcaption>{[t.role, t.company].filter(Boolean).join(", ")}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
    </Section>
  );
}

// ---- galeria ------------------------------------------------------------------------

/** Galeria: contato de fotos 4:5 em grade com linhas finas. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel }: Props<any, RoutineItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="sw-gal">
          {items.map((item) => (
            <li key={item.id}>
              {item.image && <Img image={item.image} sizes="(min-width: 960px) 17vw, 50vw" />}
              <div className="sw-gal-cap">
                <Heading level={3} className="sw-gal-t">
                  {item.title}
                </Heading>
                {item.description && <p>{item.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ---- currículo ----------------------------------------------------------------------

const KINDS = ["experience", "education", "certification", "language", "skill"] as const;

function period(item: ResumeItem, ctx: Props["ctx"]) {
  if (!item.start && !item.end) return null;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return (
    <>
      {item.start && <time dateTime={item.start}>{month(item.start)}</time>}
      {" – "}
      {item.end ? <time dateTime={item.end}>{month(item.end)}</time> : ctx.t("resume.present")}
    </>
  );
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="sw-cv-bullets">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="sw-cv-text">{lines.join(" ")}</p>;
}

/** Currículo: cada grupo é uma faixa com o rótulo à esquerda e as linhas (período | cargo | descrição). */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: Props<any, ResumeItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island sw-cv-download">{island}</div> : null}
      {KINDS.map((kind) => {
        const list = items.filter((i) => i.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} className={`sw-cv sw-cv--${kind}`} aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="sw-cv-h">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            {kind === "skill" ? (
              <ul className="sw-chips sw-chips--big">
                {list.map((i) => (
                  <li key={i.id}>{i.title}</li>
                ))}
              </ul>
            ) : (
              <ul className="sw-cv-list">
                {list.map((i) => (
                  <li key={i.id} className="sw-cv-item">
                    <p className="sw-cv-when">{period(i, ctx)}</p>
                    <div className="sw-cv-what">
                      <h4>{i.title}</h4>
                      {(i.organization || i.location) && <p>{[i.organization, i.location].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <div className="sw-cv-desc">
                      <Description text={i.description} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </Section>
  );
}
