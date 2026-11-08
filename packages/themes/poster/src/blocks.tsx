/**
 * Blocos do Pôster. Os campos são os do catálogo do núcleo; os textos de interface vêm de
 * `ctx.t("poster.*")` (declarados em `texts`) ou das chaves do núcleo. Tudo é React puro:
 * sem estado nem efeitos (a faixa rolante, o filtro e a gaveta usam CSS).
 */
import type { BlockProps, CollectionItems, ResolvedImage } from "@rubrica/core";
import { Heading, Html, Img } from "@rubrica/core/components";
import { LabelLink, PosterButton, PosterRow, PosterSection, Seal, Statement, Ticker } from "./parts";
import { K_CAPS, K_NUM, digits, fit, formatDays, pad2, plainText, resolveFreeHref, safeId, splitLead, tagFilterCss, yearOf } from "./util";

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

const external = (ctx: Props["ctx"]) => <span className="rb-sr-only"> {ctx.t("common.external")}</span>;

/** Seção "vazia": só o título e o aviso do núcleo. */
function Empty({ ctx }: { ctx: Props["ctx"] }) {
  return <p className="poster-empty">{ctx.t("common.empty")}</p>;
}

// ---- hero ---------------------------------------------------------------------------

/**
 * Abertura. O título é o nome (ou a frase) em tipografia do tamanho de um cartaz: com 2 ou
 * 3 palavras, a primeira vai cheia e o resto em contorno (como nome e sobrenome na v1); uma
 * frase longa vai inteira, dimensionada para caber em cerca de três linhas. O disco é
 * decorativo; o selo marca a disponibilidade e a imagem, quando existe, entra no disco.
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const title: string = (fields.title ?? "").trim();
  const words = title.split(/\s+/).filter(Boolean);
  const nameLike = words.length >= 2 && words.length <= 3;
  const first = words[0] ?? "";
  const rest = words.slice(1).join(" ");
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-hero poster-hero" data-block="hero" data-variant={variant}>
      <div className="poster-wrap poster-hero-grid">
        <div className="poster-hero-name poster-fit">
          {title && (
            <Heading level={headingLevel} className="poster-h">
              {nameLike ? (
                <>
                  <span className="poster-giant poster-up poster-hero-first" style={fit(first, 280, K_CAPS)}>
                    {first}
                  </span>{" "}
                  <span className="poster-giant poster-up poster-outline poster-hero-rest" style={fit(rest, 168, 0.86)}>
                    {rest}
                  </span>
                </>
              ) : (
                <span className="poster-giant poster-up poster-hero-first" style={fit(title, 220, K_CAPS, 3)}>
                  {title}
                </span>
              )}
            </Heading>
          )}
        </div>

        <div className="poster-hero-deco">
          <span className="poster-disc" aria-hidden="true" />
          {fields.image && <Img image={fields.image} className="poster-hero-img" priority sizes="(min-width: 860px) 330px, 100vw" />}
          {fields.showAvailability && <Seal label={ctx.t("hero.available")} />}
        </div>

        <div className="poster-hero-text">
          {fields.subtitle && <p className="poster-hero-sub">{fields.subtitle}</p>}
          {!!fields.tags?.length && (
            <ul className="poster-hero-tags">
              {fields.tags.map((t: { label: string }, i: number) => (
                <li key={`${i}-${t.label}`}>{t.label}</li>
              ))}
            </ul>
          )}
          {fields.eyebrow && <span className="poster-hero-role">{fields.eyebrow}</span>}
        </div>

        {(fields.primaryCta || fields.secondaryCta) && (
          <div className="poster-hero-acts poster-btns">
            {fields.primaryCta && <PosterButton link={fields.primaryCta} pri ctx={ctx} />}
            {fields.secondaryCta && <PosterButton link={fields.secondaryCta} ctx={ctx} />}
          </div>
        )}
      </div>
    </section>
  );
}

// ---- texto e chamada ----------------------------------------------------------------

/**
 * Texto. Na variação padrão o primeiro parágrafo (se curto) vira declaração grande com
 * marca-texto, como o "sobre" da v1, e o resto segue em texto corrido; `corrido` deixa
 * tudo em texto corrido (política de privacidade, textos longos).
 */
export function TextoBlock({ id, variant, fields, headingLevel, index, ctx }: Props) {
  const body: string = fields.body ?? "";
  const split = variant === "corrido" ? { rest: body } : splitLead(body);
  const lead = split.lead && split.lead.text.length <= 420 ? split.lead : undefined;
  const rest = lead ? split.rest : body;
  const image = fields.image && (
    <figure className="poster-texto-img">
      <Img image={fields.image} sizes="(min-width: 960px) 40vw, 100vw" />
    </figure>
  );
  const long = plainText(body).length > 1400;
  return (
    <PosterSection type="texto" id={id} anchor={fields.anchor} variant={variant} title={fields.title} level={headingLevel} index={index} className={image ? "poster-texto--media" : undefined}>
      {fields.imagePosition === "start" && image}
      <div className="poster-texto-body">
        {lead && <Statement lead={lead} size={lead.text.length > 220 ? "m" : "l"} />}
        {rest && <Html html={rest} className={`poster-prose${lead ? " poster-prose--after" : ""}${long ? " poster-prose--long" : ""}`} />}
      </div>
      {fields.imagePosition !== "start" && image}
    </PosterSection>
  );
}

/** Fechamento em tamanho de cartaz: frase gigante, apoio e até dois botões. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const title: string = fields.title ?? "";
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-cta poster-sec poster-cta" data-block="cta" data-variant={variant}>
      <div className="poster-wrap">
        <div className="poster-fit">
          <Heading level={headingLevel} className="poster-h">
            <span className="poster-giant poster-up" style={fit(title, 150, K_CAPS, 3)}>
              {title}
            </span>
          </Heading>
        </div>
        {fields.body && <p className="poster-cta-sub">{fields.body}</p>}
        <div className="poster-btns">
          {fields.primary && <PosterButton link={fields.primary} pri ctx={ctx} />}
          {fields.secondary && <PosterButton link={fields.secondary} ctx={ctx} />}
        </div>
      </div>
    </section>
  );
}

// ---- números e listas ---------------------------------------------------------------

/** Números do tamanho de um cartaz, em duas colunas; o valor acima do rótulo. */
export function NumerosBlock({ id, variant, fields, headingLevel, index, ctx }: Props) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  if (!items.length) return null;
  return (
    <PosterSection type="numeros" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index} fallbackLabel={ctx.t("poster.inNumbers")}>
      <dl className="poster-met">
        {items.map((m, i) => (
          <div key={`${i}-${m.label}`} className="poster-fit poster-met-item">
            <dt className="poster-met-label">{m.label}</dt>
            <dd className="poster-giant poster-met-value" style={fit(m.value, 150, K_NUM)}>
              {m.value}
            </dd>
            {m.description && <dd className="poster-met-desc">{m.description}</dd>}
          </div>
        ))}
      </dl>
    </PosterSection>
  );
}

/**
 * Itens com título e texto. Numerados (princípios de trabalho) são linhas com o número em
 * contorno e o título em caixa alta gigante; sem numeração, ficam sem o número.
 */
export function ListaItensBlock({ id, variant, fields, headingLevel, index }: Props) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <PosterSection type="lista-itens" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <List className={`poster-pr${fields.numbered ? "" : " poster-pr--plain"}`}>
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`}>
              {fields.numbered && (
                <span className="poster-pr-n poster-outline" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
              )}
              <div className="poster-fit">
                <Heading level={3} className="poster-h">
                  <span className="poster-giant poster-up poster-pr-t" style={fit(item.title, 72)}>
                    {item.title}
                  </span>
                </Heading>
                {item.body && <p>{item.body}</p>}
              </div>
            </li>
          ))}
        </List>
      )}
    </PosterSection>
  );
}

/** Serviços em caixa alta gigante, com a descrição ao lado. */
export function ServicosBlock({ id, variant, fields, items, headingLevel, index, ctx }: Props<any, ServiceItem>) {
  return (
    <PosterSection type="servicos" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <ul className="poster-svl">
          {items.map((s) => (
            <li key={s.id} className="poster-sv">
              <div className="poster-fit">
                <Heading level={3} className="poster-h">
                  <span className="poster-giant poster-up poster-sv-t" style={fit(s.title, 64)}>
                    {s.title}
                  </span>
                </Heading>
              </div>
              {(s.description || s.priceLabel) && (
                <div>
                  {s.description && <p>{s.description}</p>}
                  {s.priceLabel && <p className="poster-sv-price">{s.priceLabel}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {fields.cta && (
        <div className="poster-btns poster-after">
          <PosterButton link={fields.cta} pri ctx={ctx} />
        </div>
      )}
    </PosterSection>
  );
}

// ---- cases e posts ------------------------------------------------------------------

/** Etiquetas únicas, em ordem alfabética do idioma. */
const uniqueTags = (lists: string[][], locale: string) => [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b, locale));

/**
 * Filtro por etiqueta SEM JavaScript: botões de opção (`radio`) antes da lista e uma folha
 * gerada esconde as linhas sem a etiqueta marcada. Sem CSS, a lista aparece inteira.
 */
function Filter({ scope, tags, ctx, children }: { scope: string; tags: string[]; ctx: Props["ctx"]; children: React.ReactNode }) {
  return (
    <div className="poster-filterwrap">
      <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, tags.length) }} />
      <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
      {tags.map((t, i) => (
        <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
      ))}
      <div className="poster-filter" role="group" aria-label={ctx.t("blog.filter")}>
        <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
        {tags.map((t, i) => (
          <label key={t} htmlFor={`${scope}-t${i}`}>
            {t}
          </label>
        ))}
      </div>
      {children}
    </div>
  );
}

/**
 * Cases. Variações: `cartaz` (linhas de cartaz; padrão), `catalogo` (linhas com as
 * etiquetas como filtro em palavras grandes; as três primeiras em destaque) e `faixa` (só
 * a faixa rolante com os nomes, que vai logo depois da abertura da home).
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, index, ctx }: Props<any, ProjectItem>) {
  if (variant === "faixa") {
    if (!items.length) return null;
    return (
      <section id={fields.anchor || `b-${id}`} className="rb-section rb-cases poster-ticker" data-block="cases" data-variant={variant}>
        <Ticker id={safeId(id)} items={items.map((p) => p.title)} label={fields.title || ctx.t("poster.projects")} pauseLabel={ctx.t("poster.pauseTicker")} />
      </section>
    );
  }
  const catalog = variant === "catalogo";
  const tags = catalog ? uniqueTags(items.map((p) => p.tags), ctx.locale) : [];
  const tagIndex = new Map(tags.map((t, i) => [t, i] as const));
  const filter = tags.length > 0;
  const rows = (
    <ul className="poster-rows">
      {items.map((p, i) => {
        const featured = catalog && index === 0 && i < 3;
        return (
          <PosterRow
            key={p.id}
            uid={`${safeId(id)}-${i}`}
            index={i + 1}
            title={p.title}
            max={featured ? 96 : 64}
            description={catalog ? p.summary : undefined}
            tag={[featured ? ctx.t("poster.featured") : null, p.tags[0]].filter(Boolean).join(" · ") || undefined}
            meta={
              (p.year || p.client) && (
                <>
                  {p.year && <b>{p.year}</b>}
                  {p.client && <span>{p.client}</span>}
                </>
              )
            }
            action={ctx.t("case.view")}
            href={p.url}
            tags={filter ? p.tags.map((t) => `t${tagIndex.get(t)}`).join(" ") : undefined}
          />
        );
      })}
    </ul>
  );
  return (
    <PosterSection
      type="cases"
      id={id}
      anchor={fields.anchor}
      variant={variant}
      title={fields.title}
      intro={fields.intro}
      level={headingLevel}
      index={index}
      kicker={items.length ? ctx.t("poster.total", { label: ctx.t("poster.projects"), n: items.length }) : undefined}
      fallbackLabel={ctx.t("poster.projects")}
      action={fields.cta ? <LabelLink link={fields.cta} /> : undefined}
      className="poster-sec--rows"
    >
      {items.length === 0 ? <Empty ctx={ctx} /> : filter ? <Filter scope={`f-${safeId(id)}`} tags={tags} ctx={ctx}>{rows}</Filter> : rows}
    </PosterSection>
  );
}

/** Posts em linhas de cartaz: data e tempo de leitura à direita; o filtro por etiqueta é CSS. */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, index, ctx }: Props<any, PostItem>) {
  const tags = fields.showTagFilter ? uniqueTags(items.map((p) => p.tags), ctx.locale) : [];
  const tagIndex = new Map(tags.map((t, i) => [t, i] as const));
  const filter = tags.length > 0;
  const rows = (
    <ul className="poster-rows">
      {items.map((post, i) => {
        const latest = index === 0 && i === 0;
        return (
          <PosterRow
            key={post.id}
            uid={`${safeId(id)}-${i}`}
            index={i + 1}
            title={post.title}
            max={latest ? 104 : 60}
            description={post.excerpt}
            tag={latest ? ctx.t("poster.latest") : undefined}
            meta={
              <>
                <span className="poster-post-meta">
                  <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt, "short")}</time>
                  {" · "}
                  {ctx.t("blog.readingTime", { minutes: post.readingMinutes })}
                </span>
                {post.tags.length > 0 && (
                  <span className="poster-post-tags">
                    {post.tags.slice(0, 3).map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </span>
                )}
              </>
            }
            action={ctx.t("common.readMore")}
            href={post.url}
            tags={filter ? post.tags.map((t) => `t${tagIndex.get(t)}`).join(" ") : undefined}
          />
        );
      })}
    </ul>
  );
  return (
    <PosterSection
      type="posts-recentes"
      id={id}
      anchor={fields.anchor}
      variant={variant}
      title={fields.title}
      intro={fields.intro}
      level={headingLevel}
      index={index}
      kicker={items.length ? ctx.t("poster.total", { label: ctx.t("poster.posts"), n: items.length }) : undefined}
      fallbackLabel={ctx.t("poster.posts")}
      action={fields.cta ? <LabelLink link={fields.cta} /> : undefined}
      className="poster-sec--rows"
    >
      {items.length === 0 ? <Empty ctx={ctx} /> : filter ? <Filter scope={`f-${safeId(id)}`} tags={tags} ctx={ctx}>{rows}</Filter> : rows}
    </PosterSection>
  );
}

// ---- depoimentos, perguntas, galeria ------------------------------------------------

/** Tamanho da citação conforme o comprimento: frases curtas ficam do tamanho de um cartaz. */
const quoteSize = (text: string) => (text.length <= 140 ? "l" : text.length <= 280 ? "m" : "s");

function Cite({ t, style }: { t: TestimonialItem; style?: React.CSSProperties }) {
  return (
    <figcaption className="poster-cite" style={style}>
      {t.avatar && <Img image={t.avatar} className="poster-avatar" sizes="48px" />}
      <span>
        {t.author}
        {(t.role || t.company) && ` · ${[t.role, t.company].filter(Boolean).join(", ")}`}
      </span>
    </figcaption>
  );
}

/** Depoimentos: uma citação enorme e as demais menores, em duas colunas. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, index, ctx, island }: Props<any, TestimonialItem>) {
  const [lead, ...others] = items;
  return (
    <PosterSection type="depoimentos" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {lead && (
        <figure className="poster-fig">
          <blockquote className={`poster-q poster-q--${quoteSize(lead.quote)}`}>
            <p>“{lead.quote}”</p>
          </blockquote>
          <Cite t={lead} />
        </figure>
      )}
      {others.length > 0 && (
        <div className="poster-qs">
          {others.map((q) => (
            <figure key={q.id} className="poster-fig">
              <blockquote>
                <p>“{q.quote}”</p>
              </blockquote>
              <Cite t={q} />
            </figure>
          ))}
        </div>
      )}
      {fields.allowSubmission && island ? <div className="rb-island poster-after">{island}</div> : null}
    </PosterSection>
  );
}

/** Perguntas frequentes: o acordeão nativo (`details`), perguntas em letras grandes. */
export function FaqBlock({ id, variant, fields, items, headingLevel, index }: Props<any, FaqItem>) {
  return (
    <PosterSection type="faq" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <div className="poster-faq">
          {items.map((q) => (
            <details key={q.id}>
              <summary>
                <span>{q.question}</span>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path d="M12 4v16M4 12h16" />
                </svg>
              </summary>
              <Html html={q.answer} className="poster-prose poster-faq-a" />
            </details>
          ))}
        </div>
      )}
    </PosterSection>
  );
}

/** Dia a dia: linhas numeradas com a frase grande e a imagem pequena à direita. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel, index }: Props<any, RoutineItem>) {
  return (
    <PosterSection type="galeria" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <ol className="poster-day">
          {items.map((item, i) => (
            <li key={item.id}>
              <span className="poster-day-n" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <div>
                <Heading level={3} className="poster-h poster-day-t">
                  {item.title}
                </Heading>
                {item.description && <p className="poster-day-d">{item.description}</p>}
                {item.tags.length > 0 && <p className="poster-day-tags">{item.tags.join(" / ")}</p>}
              </div>
              {item.image ? <Img image={{ ...item.image, alt: item.image.alt || "" }} className="poster-day-img" sizes="96px" /> : <span aria-hidden="true" />}
            </li>
          ))}
        </ol>
      )}
    </PosterSection>
  );
}

// ---- contato ------------------------------------------------------------------------

/** Contato: o formulário (ilha) e os canais como linhas grandes. */
export function ContatoBlock({ id, variant, fields, headingLevel, index, ctx, island }: Props) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone;
  const whatsapp = org?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const channels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  const form = mode !== "channels" && island;
  return (
    <PosterSection type="contato" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index} fallbackLabel={ctx.t("contact.channels")}>
      <div className={`poster-contato${form && channels ? " poster-contato--two" : ""}`}>
        {form ? <div className="rb-island poster-contato-form">{island}</div> : null}
        {channels && (
          <ul className="poster-channels" aria-label={ctx.t("contact.channels")}>
            {email && (
              <li>
                <span className="poster-channel-l">{ctx.t("contact.email")}</span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {phone && (
              <li>
                <span className="poster-channel-l">{ctx.t("contact.phone")}</span>
                <a href={`tel:+${digits(phone)}`}>{phone}</a>
              </li>
            )}
            {whatsapp && (
              <li>
                <span className="poster-channel-l">{ctx.t("contact.whatsapp")}</span>
                <a href={`https://wa.me/${digits(whatsapp)}`} target="_blank" rel="noopener noreferrer">
                  {whatsapp}
                  {external(ctx)}
                </a>
              </li>
            )}
            {social.map((s) => (
              <li key={s.url}>
                <span className="poster-channel-l">{ctx.t("contact.social")}</span>
                <a href={s.url} target="_blank" rel="me noopener noreferrer">
                  {s.network}
                  {external(ctx)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PosterSection>
  );
}

// ---- currículo ----------------------------------------------------------------------

const KINDS = ["experience", "education", "skill", "language", "certification"] as const;

/**
 * Currículo. Experiência e formação são linhas do tempo com o ano gigante como âncora;
 * competências viram palavras grandes separadas por barra; idiomas e certificações, listas.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, index, ctx, island }: Props<any, ResumeItem>) {
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  const period = (i: ResumeItem) =>
    i.start || i.end ? (
      <>
        {i.start ? <time dateTime={i.start}>{month(i.start)}</time> : null}
        {" – "}
        {i.end ? <time dateTime={i.end}>{month(i.end)}</time> : ctx.t("resume.present")}
      </>
    ) : null;
  const timeline = (list: ResumeItem[]) => (
    <ol className="poster-tl">
      {list.map((i) => {
        const year = yearOf(i.start) ?? "";
        const lines = (i.description ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
        const bullets = lines.length > 0 && lines.every((l) => /^[-•]\s/.test(l));
        return (
          <li key={i.id} className="poster-tl-item">
            <div className="poster-fit">
              {year && (
                <span className="poster-giant poster-tl-year" style={fit(year, 140, K_NUM)} aria-hidden="true">
                  {year}
                </span>
              )}
              {period(i) && <span className="poster-tl-period">{period(i)}</span>}
            </div>
            <div>
              <h4 className="poster-h poster-tl-role">{i.title}</h4>
              {(i.organization || i.location) && <span className="poster-tl-org">{[i.organization, i.location].filter(Boolean).join(" · ")}</span>}
              {bullets ? (
                <ul className="poster-tl-bullets">
                  {lines.map((l, n) => (
                    <li key={`${n}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
                  ))}
                </ul>
              ) : (
                lines.length > 0 && <p className="poster-tl-desc">{lines.join(" ")}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
  return (
    <PosterSection type="curriculo" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index} action={fields.showDownload && island ? <div className="rb-island poster-cv-dl">{island}</div> : undefined}>
      {KINDS.map((kind) => {
        const list = items.filter((i) => i.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="poster-cv-group" aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="poster-lab poster-cv-h">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            {kind === "experience" || kind === "education" ? (
              timeline(list)
            ) : kind === "skill" ? (
              <ul className="poster-words">
                {list.map((s, n) => (
                  <li key={s.id}>
                    {s.title}
                    {n < list.length - 1 && (
                      <span className="poster-sep" aria-hidden="true">
                        {" "}
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="poster-list">
                {list.map((i) => (
                  <li key={i.id}>
                    <b>{i.title}</b>
                    {(i.description || i.organization) && <span>{i.description || i.organization}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </PosterSection>
  );
}

// ---- empresa ------------------------------------------------------------------------

/** Planos lado a lado em caixas de borda grossa; o destacado inverte as cores. */
export function PrecosBlock({ id, variant, fields, items, headingLevel, index, ctx }: Props<any, PlanItem>) {
  return (
    <PosterSection type="precos" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <ul className="poster-plans">
          {items.map((plan) => (
            <li key={plan.id} className={`poster-plan${plan.highlighted ? " poster-plan--hl" : ""}`}>
              {plan.highlighted && <p className="poster-plan-badge">{ctx.t("pricing.highlighted")}</p>}
              <div className="poster-fit">
                <Heading level={3} className="poster-h">
                  <span className="poster-giant poster-up poster-plan-name" style={fit(plan.name, 48)}>
                    {plan.name}
                  </span>
                </Heading>
              </div>
              {plan.price && (
                <p className="poster-fit poster-plan-price">
                  <span className="poster-giant" style={fit(plan.price, 56, K_NUM)}>
                    {plan.price}
                  </span>
                </p>
              )}
              {plan.description && <p className="poster-plan-desc">{plan.description}</p>}
              {plan.features.length > 0 && (
                <ul className="poster-plan-features" aria-label={ctx.t("plans.included")}>
                  {plan.features.map((f, i) => (
                    <li key={`${i}-${f}`}>{f}</li>
                  ))}
                </ul>
              )}
              {plan.cta && <PosterButton link={plan.cta} pri={!plan.highlighted} ctx={ctx} />}
            </li>
          ))}
        </ul>
      )}
      {fields.note && <p className="poster-note">{fields.note}</p>}
    </PosterSection>
  );
}

/** Equipe: foto quadrada com borda, nome em caixa alta e cargo em mono. */
export function EquipeBlock({ id, variant, fields, items, headingLevel, index, ctx }: Props<any, TeamItem>) {
  return (
    <PosterSection type="equipe" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index}>
      {items.length > 0 && (
        <ul className="poster-team">
          {items.map((m) => (
            <li key={m.id}>
              {m.photo && <Img image={m.photo} className="poster-team-photo" sizes="(min-width: 960px) 20vw, 50vw" />}
              <div className="poster-fit">
                <Heading level={3} className="poster-h">
                  <span className="poster-giant poster-up poster-team-name" style={fit(m.name, 40)}>
                    {m.name}
                  </span>
                </Heading>
              </div>
              <p className="poster-team-role">{m.role}</p>
              {m.bio && <p className="poster-team-bio">{m.bio}</p>}
              {m.links.length > 0 && (
                <ul className="poster-team-links">
                  {m.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {l.label}
                        {l.external && external(ctx)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </PosterSection>
  );
}

/** Endereço e horário em duas caixas de borda grossa. */
export function LocalizacaoBlock({ id, variant, fields, headingLevel, index, ctx }: Props) {
  const org = ctx.site.organization;
  const a = org?.address;
  const addressLines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  return (
    <PosterSection type="localizacao" id={id} anchor={fields.anchor} variant={variant} title={fields.title} intro={fields.intro} level={headingLevel} index={index} fallbackLabel={ctx.t("location.address")}>
      <div className="poster-loc">
        {addressLines.length > 0 && (
          <div className="poster-loc-box">
            <h3 className="poster-lab poster-loc-h">{ctx.t("location.address")}</h3>
            <address className="poster-loc-address">
              {addressLines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
            {mapUrl && (
              <p className="poster-loc-map">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  {ctx.t("location.map")} <span aria-hidden="true">↗</span>
                  {external(ctx)}
                </a>
              </p>
            )}
          </div>
        )}
        {hours.length > 0 && (
          <div className="poster-loc-box">
            <h3 className="poster-lab poster-loc-h">{ctx.t("location.hours")}</h3>
            <dl className="poster-loc-hours">
              {hours.map((h: { days: string; opens: string; closes: string }) => (
                <div key={`${h.days}-${h.opens}`}>
                  <dt>{formatDays(h.days, ctx.locale)}</dt>
                  <dd>
                    {h.opens} – {h.closes}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </PosterSection>
  );
}

/** Logos em células de borda grossa; sem imagem, o nome em caixa alta. */
export function LogosClientesBlock({ id, variant, fields, headingLevel, index, ctx }: Props) {
  const logos: { name: string; image?: ResolvedImage; href?: string }[] = fields.logos ?? [];
  return (
    <PosterSection type="logos-clientes" id={id} anchor={fields.anchor} variant={variant} title={fields.title} level={headingLevel} index={index}>
      {logos.length > 0 && (
        <ul className="poster-logos">
          {logos.map((logo, i) => {
            const link = resolveFreeHref(logo.href, ctx);
            const content = logo.image ? <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} className="poster-logo-img" sizes="160px" /> : <span className="poster-logo-name">{logo.name}</span>;
            return (
              <li key={`${i}-${logo.name}`}>
                {link ? (
                  <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {content}
                    {link.external && external(ctx)}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PosterSection>
  );
}
