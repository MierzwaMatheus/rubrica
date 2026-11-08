/**
 * Blocos do tema Conversa. No layout `chat` da v1 toda seção é uma troca de mensagens
 * (a pergunta de quem visita e as respostas em balões), então o tema desenha os 17
 * blocos do catálogo; nenhum fica com o visual de grade/cartão do núcleo. Os blocos que
 * chegaram depois entram na conversa com o componente do núcleo num balão (`embedded.tsx`).
 *
 * O que na v1 dependia de estado vira estático:
 * - filtro de posts por etiqueta: botões de opção + CSS, e a escolha aparece como uma
 *   pergunta nova na conversa ("Só os de X"), como na v1;
 * - "mostrar experiências anteriores": todas aparecem (sem estado, nada fica escondido);
 * - formulários (contato, depoimento) e o PDF do currículo: as ilhas do núcleo, dentro
 *   de um balão.
 */
import type { BlockProps, CollectionItems, ResolvedLink } from "@rubrica/core";
import { Heading, Html, Img, digits, formatDays, safeId } from "@rubrica/core/components";
import { CHAT_CORE_BLOCKS } from "./embedded";
import { Ask, askFor, Avatar, Bubble, BubbleLink, ChatSection, FileDown, kindText, LinkCard, MapPin, Pill, splitBlocks } from "./chat";

type Project = CollectionItems["projects"];
type Post = CollectionItems["posts"];
type Service = CollectionItems["services"];
type Testimonial = CollectionItems["testimonials"];
type Faq = CollectionItems["faq"];
type Resume = CollectionItems["resume"];
type Routine = CollectionItems["routine"];
type Plan = CollectionItems["plans"];
type Member = CollectionItems["team"];

/** Campos comuns a quase todo bloco. */
interface Common {
  anchor?: string;
  title?: string;
  intro?: string;
}

const external = (l: ResolvedLink) => !!l.external;

/** Ações de um balão: links em pílula, o primeiro em destaque. */
function Actions({ links, big }: { links: (ResolvedLink | undefined)[]; big?: boolean }) {
  const list = links.filter((l): l is ResolvedLink => !!l?.href);
  if (!list.length) return null;
  return (
    <div className={big ? "ct-acts big" : "ct-acts"}>
      {list.map((l, i) => (
        <Pill key={`${i}-${l.href}`} href={l.href} external={external(l)} primary={i === 0}>
          {l.label}
        </Pill>
      ))}
    </div>
  );
}

// ---- hero ---------------------------------------------------------------------------------

/**
 * Apresentação: a saudação ("Oi! Eu sou Ana."), o cargo e a frase de valor (o h1 da
 * página) num balão; o apoio, as etiquetas e os dois caminhos no seguinte.
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const name = ctx.site.kind === "pessoal" ? (ctx.site.person?.name ?? ctx.site.name) : ctx.site.name;
  const hasSecond = fields.subtitle || fields.tags?.length || fields.primaryCta || fields.secondaryCta;
  return (
    <section id={`b-${id}`} className="rb-section rb-hero ct-sec" data-block="hero" data-variant={variant}>
      <Bubble className="ct-intro">
        <p className="ct-hi">{kindText(ctx, "hello", { name })}</p>
        {fields.showAvailability && (
          <p className="ct-status">
            <i className="ct-dot" aria-hidden="true" />
            {ctx.t("hero.available")}
          </p>
        )}
        {fields.eyebrow && <p className="ct-sub">{fields.eyebrow}</p>}
        {fields.title && (
          <Heading level={headingLevel} className="ct-lead">
            {fields.title}
          </Heading>
        )}
      </Bubble>
      {hasSecond && (
        <Bubble>
          {fields.subtitle && <p>{fields.subtitle}</p>}
          {!!fields.tags?.length && (
            <ul className="ct-chips">
              {fields.tags.map((t: { label: string }, i: number) => (
                <li key={`${i}-${t.label}`} className="ct-chip">
                  {t.label}
                </li>
              ))}
            </ul>
          )}
          <Actions links={[fields.primaryCta, fields.secondaryCta]} />
        </Bubble>
      )}
      {fields.image && (
        <Bubble className="ct-photo">
          <Img image={fields.image} priority sizes="(min-width: 768px) 470px, 92vw" />
        </Bubble>
      )}
    </section>
  );
}

// ---- texto --------------------------------------------------------------------------------

/**
 * Texto: um balão por parágrafo, como o "sobre" da v1. Na variação `pergunta` o título
 * do bloco é a pergunta de quem visita ("Quem é você?"); na padrão, é o assunto.
 */
export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  const asQuestion = variant === "pergunta" && fields.title;
  const pieces = fields.body ? splitBlocks(fields.body) : [];
  const image = fields.image && (
    <Bubble className="ct-photo">
      <Img image={fields.image} sizes="(min-width: 768px) 470px, 92vw" />
    </Bubble>
  );
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-texto ct-sec" data-block="texto" data-variant={variant}>
      {fields.title &&
        (asQuestion ? (
          <Heading level={headingLevel} className="ct-m out">
            {fields.title}
          </Heading>
        ) : (
          <Heading level={headingLevel} className="ct-topic">
            {fields.title}
          </Heading>
        ))}
      {fields.imagePosition === "start" && image}
      {pieces.map((html, i) => (
        <Bubble key={i}>
          <Html html={html} className="ct-html" />
        </Bubble>
      ))}
      {fields.imagePosition !== "start" && image}
    </section>
  );
}

// ---- números ------------------------------------------------------------------------------

export function NumerosBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  if (!items.length) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="numeros" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "numeros")}>
      <Bubble>
        {fields.intro && <p>{fields.intro}</p>}
        <dl className="ct-met">
          {items.map((m, i) => (
            <div key={`${i}-${m.label}`}>
              <dt>{m.label}</dt>
              <dd className="ct-met-v">{m.value}</dd>
              {m.description && <dd className="ct-met-d">{m.description}</dd>}
            </div>
          ))}
        </dl>
      </Bubble>
    </ChatSection>
  );
}

// ---- lista de itens -----------------------------------------------------------------------

/** Princípios e valores: uma resposta só, numa lista (numerada quando o bloco pede). */
export function ListaItensBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <ChatSection id={id} anchor={fields.anchor} type="lista-itens" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "lista-itens")}>
      <Bubble wide>
        {fields.intro && <p>{fields.intro}</p>}
        {items.length > 0 && (
          <List className="ct-list">
            {items.map((item, i) => (
              <li key={`${i}-${item.title}`}>
                <Heading level={3} className="ct-t">
                  {fields.numbered && <span className="ct-n">{i + 1}. </span>}
                  {item.title}
                </Heading>
                {item.body && <span>{item.body}</span>}
              </li>
            ))}
          </List>
        )}
      </Bubble>
    </ChatSection>
  );
}

// ---- cases --------------------------------------------------------------------------------

/**
 * Cases como prévias de link. Variações: `lista` (cartões compactos, a home da v1) e
 * `destaque` (o primeiro cartão grande com o selo "destaque", a página de projetos da v1).
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Project>) {
  const featured = variant === "destaque" && items.length > 2;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="cases" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "cases")}>
      <Bubble wide>
        {fields.intro && <p>{fields.intro}</p>}
        {items.length > 0 ? (
          <ul className="ct-cards">
            {items.map((p, i) => (
              <li key={p.id}>
                <LinkCard href={p.url} image={p.cover} title={p.title} big={featured && i === 0} badge={featured && i === 0 ? ctx.t("chat.featured") : undefined}>
                  {(p.client || p.year || p.role) && <small>{[p.client, p.role, p.year].filter(Boolean).join(" · ")}</small>}
                  {p.summary && <p>{p.summary}</p>}
                  {p.tags.length > 0 && (
                    <span className="ct-tags">
                      {p.tags.slice(0, 4).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                  )}
                  <span className="ct-act">{ctx.t("chat.readCase")}</span>
                </LinkCard>
              </li>
            ))}
          </ul>
        ) : (
          <p>{ctx.t("common.empty")}</p>
        )}
        {fields.cta && <BubbleLink href={fields.cta.href} external={fields.cta.external}>{fields.cta.label}</BubbleLink>}
      </Bubble>
    </ChatSection>
  );
}

// ---- serviços -----------------------------------------------------------------------------

/** Serviços: lista no balão (`lista`) ou etiquetas (`etiquetas`, os "interesses" do sobre da v1). */
export function ServicosBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Service>) {
  return (
    <ChatSection id={id} anchor={fields.anchor} type="servicos" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "servicos")}>
      <Bubble wide={variant !== "etiquetas"}>
        {fields.intro && <p>{fields.intro}</p>}
        {items.length > 0 &&
          (variant === "etiquetas" ? (
            <ul className="ct-chips">
              {items.map((s) => (
                <li key={s.id} className="ct-chip">
                  {s.title}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="ct-list">
              {items.map((s) => (
                <li key={s.id}>
                  <Heading level={3} className="ct-t">
                    {s.title}
                  </Heading>
                  {s.description && <span>{s.description}</span>}
                  {s.priceLabel && <span className="ct-price">{s.priceLabel}</span>}
                </li>
              ))}
            </ul>
          ))}
        <Actions links={[fields.cta]} />
      </Bubble>
    </ChatSection>
  );
}

// ---- depoimentos --------------------------------------------------------------------------

/** Depoimentos como mensagens encaminhadas; o envio de depoimento (ilha) fica no balão. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, Testimonial>) {
  const submit = fields.allowSubmission && island;
  if (!items.length && !submit) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="depoimentos" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "depoimentos")}>
      <Bubble wide>
        {items.length > 0 && <p>{fields.intro || kindText(ctx, "testimonialsIntro")}</p>}
        {items.map((t) => (
          <figure key={t.id} className="ct-fw">
            <small>{ctx.t("chat.forwarded")}</small>
            <blockquote>
              <p>“{t.quote}”</p>
            </blockquote>
            <figcaption>
              {t.avatar && <Img image={{ ...t.avatar, alt: "" }} className="ct-fw-av" sizes="28px" />}
              <b>{t.author}</b>
              {(t.role || t.company) && <span> · {[t.role, t.company].filter(Boolean).join(", ")}</span>}
            </figcaption>
          </figure>
        ))}
        {submit && <div className="rb-island ct-island">{island}</div>}
      </Bubble>
    </ChatSection>
  );
}

// ---- FAQ ----------------------------------------------------------------------------------

/** FAQ: cada pergunta é de quem visita, cada resposta é do dono do site (sem sanfona). */
export function FaqBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, Faq>) {
  if (!items.length) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="faq" variant={variant} title={fields.title} level={headingLevel}>
      {fields.intro && (
        <Bubble>
          <p>{fields.intro}</p>
        </Bubble>
      )}
      {items.map((q) => (
        <div key={q.id} className="ct-group">
          <Ask as="h3">{q.question}</Ask>
          <Bubble>
            <Html html={q.answer} className="ct-html" />
          </Bubble>
        </div>
      ))}
    </ChatSection>
  );
}

// ---- posts --------------------------------------------------------------------------------


/**
 * Filtro por etiqueta sem JavaScript: botões de opção antes da conversa e uma folha de
 * estilo do bloco que esconde os posts sem a etiqueta e mostra a pergunta da escolha.
 * Sem CSS, aparece tudo. Os ids vêm do índice, nunca do texto da etiqueta.
 */
function filterCss(scope: string, count: number): string {
  const on = "background:var(--rb-accent);color:var(--rb-accent-fg)";
  const rules: string[] = [`#${scope}-all:checked~.ct-m label[for="${scope}-all"]{${on}}`, `#${scope}-all:focus-visible~.ct-m label[for="${scope}-all"]{outline:2px solid var(--rb-fg);outline-offset:2px}`];
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked~.ct-m .ct-cards>li:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked~.ct-ask-t${i}{display:block}`);
    rules.push(`${radio}:checked~.ct-m label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible~.ct-m label[for="${scope}-t${i}"]{outline:2px solid var(--rb-fg);outline-offset:2px}`);
  }
  return rules.join("\n");
}

/** Posts como prévias de link; `destaque` aumenta o primeiro (a página do blog da v1). */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Post>) {
  const tags = fields.showTagFilter ? [...new Set(items.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = tags.length > 1;
  const index = new Map(tags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const featured = variant === "destaque" && items.length > 1;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="posts-recentes" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "posts-recentes")}>
      {filter && (
        <>
          <style dangerouslySetInnerHTML={{ __html: filterCss(scope, tags.length) }} />
          <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
          {tags.map((t, i) => (
            <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
          ))}
        </>
      )}
      {(fields.intro || filter) && (
        <Bubble>
          {fields.intro && <p>{fields.intro}</p>}
          {filter && (
            <div className="ct-acts ct-filter" role="group" aria-label={ctx.t("blog.filter")}>
              <label htmlFor={`${scope}-all`} className="ct-pill">
                {ctx.t("blog.allTags")}
              </label>
              {tags.map((t, i) => (
                <label key={t} htmlFor={`${scope}-t${i}`} className="ct-pill">
                  {t}
                </label>
              ))}
            </div>
          )}
        </Bubble>
      )}
      {filter &&
        tags.map((t, i) => (
          <p key={t} className={`ct-m out ct-ask-tag ct-ask-t${i}`}>
            {ctx.t("chat.filterAsk", { tag: t })}
          </p>
        ))}
      <Bubble wide>
        {items.length > 0 ? (
          <ul className="ct-cards">
            {items.map((p, i) => (
              <li key={p.id} data-tags={filter ? p.tags.map((t) => `t${index.get(t)}`).join(" ") : undefined}>
                <LinkCard href={p.url} image={p.cover} title={p.title} big={featured && i === 0} badge={featured && i === 0 ? ctx.t("chat.featured") : undefined}>
                  {p.excerpt && <p>{p.excerpt}</p>}
                  <small>
                    <time dateTime={p.publishedAt}>{ctx.formatDate(p.publishedAt, "short")}</time> · {ctx.t("blog.readingTime", { minutes: p.readingMinutes })}
                  </small>
                  {p.tags.length > 0 && (
                    <span className="ct-tags">
                      {p.tags.slice(0, 4).map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </span>
                  )}
                </LinkCard>
              </li>
            ))}
          </ul>
        ) : (
          <p>{ctx.t("common.empty")}</p>
        )}
        {fields.cta && <BubbleLink href={fields.cta.href} external={fields.cta.external}>{fields.cta.label}</BubbleLink>}
      </Bubble>
    </ChatSection>
  );
}

// ---- cta ----------------------------------------------------------------------------------

/** Fechamento: um balão largo com o título grande e os dois caminhos em pílulas grandes. */
export function CtaBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-cta ct-sec" data-block="cta" data-variant={variant}>
      <Bubble wide className="ct-close">
        <Heading level={headingLevel} className="ct-hi">
          {fields.title}
        </Heading>
        {fields.body && <p>{fields.body}</p>}
        <Actions links={[fields.primary, fields.secondary]} big />
      </Bubble>
    </section>
  );
}

// ---- contato ------------------------------------------------------------------------------


/** Contato: o assistente (ilha) dentro do balão e os canais numa lista de "rótulo → link". */
export function ContatoBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<any>) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone ?? ctx.site.person?.phone;
  const whatsapp = org?.whatsapp ?? ctx.site.person?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const showChannels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  const form = mode !== "channels" && island;
  const ext = <span className="rb-sr-only"> {ctx.t("common.external")}</span>;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="contato" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "contato")}>
      {fields.intro && (
        <Bubble>
          <p>{fields.intro}</p>
        </Bubble>
      )}
      {form && (
        <Bubble wide className="ct-form">
          <div className="rb-island ct-island">{island}</div>
        </Bubble>
      )}
      {showChannels && (
        <Bubble>
          <ul className="ct-list row" aria-label={ctx.t("contact.channels")}>
            {email && (
              <li>
                <span>{ctx.t("contact.email")}</span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {phone && (
              <li>
                <span>{ctx.t("contact.phone")}</span>
                <a href={`tel:+${digits(phone)}`}>{phone}</a>
              </li>
            )}
            {whatsapp && (
              <li>
                <span>{ctx.t("contact.whatsapp")}</span>
                <a href={`https://wa.me/${digits(whatsapp)}`} target="_blank" rel="noopener noreferrer">
                  {whatsapp}
                  {ext}
                </a>
              </li>
            )}
            {social.map((s) => (
              <li key={s.url}>
                <span>{ctx.t("contact.social")}</span>
                <a href={s.url} target="_blank" rel="me noopener noreferrer">
                  {s.network}
                  {ext}
                </a>
              </li>
            ))}
          </ul>
        </Bubble>
      )}
    </ChatSection>
  );
}

// ---- galeria ------------------------------------------------------------------------------

/** Dia a dia: as fotos chegam como uma galeria dentro do balão. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Routine>) {
  if (!items.length) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="galeria" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "galeria")}>
      <Bubble wide>
        {fields.intro && <p>{fields.intro}</p>}
        <ul className="ct-gal">
          {items.map((item) => (
            <li key={item.id}>
              <figure>
                {item.image ? <Img image={item.image} sizes="(min-width: 768px) 190px, 45vw" /> : <span className="ct-gal-ph" aria-hidden="true">{item.title.trim()[0]?.toUpperCase()}</span>}
                <figcaption>
                  <b>{item.title}</b>
                  {item.description && <span>{item.description}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Bubble>
    </ChatSection>
  );
}

// ---- currículo ----------------------------------------------------------------------------

const KINDS = ["experience", "education", "skill", "certification", "language"] as const;

function Period({ item, ctx }: { item: Resume; ctx: BlockProps["ctx"] }) {
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
  if (lines.every((l) => /^[-•]\s/.test(l))) {
    return (
      <ul className="ct-bullets">
        {lines.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="ct-desc">{lines.join(" ")}</p>;
}

/**
 * Currículo como entrevista: o anexo do CV (com a ilha que gera o PDF) e, para cada
 * grupo, a pergunta de quem visita ("Onde você já trabalhou?") e as respostas.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, Resume>) {
  return (
    <ChatSection id={id} anchor={fields.anchor} type="curriculo" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "curriculo")}>
      {fields.intro && (
        <Bubble>
          <p>{fields.intro}</p>
        </Bubble>
      )}
      {fields.showDownload && island && (
        <Bubble>
          <p>{ctx.t("chat.cvIntro")}</p>
          <div className="ct-file">
            <span className="ct-file-ic" aria-hidden="true">
              <FileDown />
            </span>
            <span className="ct-file-n">
              <b>{ctx.t("chat.cvFile")}</b>
              <small>{ctx.t("chat.cvHint")}</small>
            </span>
            <div className="rb-island ct-island">{island}</div>
          </div>
        </Bubble>
      )}
      {KINDS.map((kind) => {
        const list = items.filter((i) => i.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className={`ct-group ct-resume--${kind}`}>
            <Ask as="h3">{askFor(ctx, `resume.${kind}`)}</Ask>
            {kind === "skill" ? (
              <Bubble wide>
                <span className="ct-lb">{ctx.t("resume.skill")}</span>
                <ul className="ct-chips">
                  {list.map((i) => (
                    <li key={i.id} className="ct-chip">
                      {i.title}
                    </li>
                  ))}
                </ul>
              </Bubble>
            ) : kind === "language" || kind === "certification" ? (
              <Bubble>
                <ul className={kind === "language" ? "ct-list row" : "ct-list"}>
                  {list.map((i) => (
                    <li key={i.id}>
                      <b className="ct-t">{i.title}</b>
                      {(i.organization || i.description) && <span>{i.organization ?? i.description}</span>}
                    </li>
                  ))}
                </ul>
              </Bubble>
            ) : (
              list.map((i) => (
                <Bubble key={i.id} as="article">
                  <h4 className="ct-t">{i.title}</h4>
                  {(i.organization || i.location || i.start || i.end) && (
                    <p className="ct-sub">
                      {[i.organization, i.location].filter(Boolean).join(" · ")}
                      {(i.organization || i.location) && (i.start || i.end) ? " · " : null}
                      <Period item={i} ctx={ctx} />
                    </p>
                  )}
                  <Description text={i.description} />
                </Bubble>
              ))
            )}
          </div>
        );
      })}
    </ChatSection>
  );
}

// ---- preços -------------------------------------------------------------------------------

/** Preços: os planos como cartões dentro do balão, o destacado com o selo e borda. */
export function PrecosBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Plan>) {
  return (
    <ChatSection id={id} anchor={fields.anchor} type="precos" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "precos")}>
      <Bubble wide>
        {fields.intro && <p>{fields.intro}</p>}
        {items.length > 0 && (
          <ul className="ct-plans">
            {items.map((plan) => (
              <li key={plan.id} className={plan.highlighted ? "ct-plan hl" : "ct-plan"}>
                {plan.highlighted && <span className="ct-badge">{ctx.t("pricing.highlighted")}</span>}
                <Heading level={3} className="ct-t">
                  {plan.name}
                </Heading>
                {plan.price && <p className="ct-plan-p">{plan.price}</p>}
                {plan.description && <p className="ct-desc">{plan.description}</p>}
                {plan.features.length > 0 && (
                  <ul className="ct-feat" aria-label={ctx.t("plans.included")}>
                    {plan.features.map((f, i) => (
                      <li key={`${i}-${f}`}>{f}</li>
                    ))}
                  </ul>
                )}
                {plan.cta && (
                  <div className="ct-acts">
                    <Pill href={plan.cta.href} external={plan.cta.external} primary={plan.highlighted}>
                      {plan.cta.label}
                    </Pill>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {fields.note && <p className="ct-note">{fields.note}</p>}
      </Bubble>
    </ChatSection>
  );
}

// ---- equipe -------------------------------------------------------------------------------

/** Equipe: cada pessoa como um "contato compartilhado" (avatar, nome, cargo, links). */
export function EquipeBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Member>) {
  return (
    <ChatSection id={id} anchor={fields.anchor} type="equipe" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "equipe")}>
      <Bubble wide>
        {fields.intro && <p>{fields.intro}</p>}
        {items.length > 0 && (
          <ul className="ct-team">
            {items.map((m) => (
              <li key={m.id} className="ct-member">
                <Avatar name={m.name} photo={m.photo} className="lg" />
                <div className="ct-member-b">
                  <Heading level={3} className="ct-t">
                    {m.name}
                  </Heading>
                  <span className="ct-sub">{m.role}</span>
                  {m.bio && <p className="ct-desc">{m.bio}</p>}
                  {m.links.length > 0 && (
                    <ul className="ct-links">
                      {m.links.map((l) => (
                        <li key={l.href}>
                          <a href={l.href} className="ct-a" {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {l.label}
                            {l.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bubble>
    </ChatSection>
  );
}

// ---- localização --------------------------------------------------------------------------

/** Localização: o endereço como uma "localização enviada" e o horário numa lista. */
export function LocalizacaoBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const org = ctx.site.organization;
  const a = org?.address;
  const lines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  if (!lines.length && !hours.length) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="localizacao" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "localizacao")}>
      {fields.intro && (
        <Bubble>
          <p>{fields.intro}</p>
        </Bubble>
      )}
      {lines.length > 0 && (
        <Bubble className="ct-loc">
          <span className="ct-loc-ic" aria-hidden="true">
            <MapPin />
          </span>
          <div>
            <h3 className="ct-lb">{ctx.t("location.address")}</h3>
            <address>
              {lines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
            {mapUrl && (
              <a href={mapUrl} className="ct-a" target="_blank" rel="noopener noreferrer">
                {ctx.t("location.map")}
                <span className="rb-sr-only"> {ctx.t("common.external")}</span>
              </a>
            )}
          </div>
        </Bubble>
      )}
      {hours.length > 0 && (
        <Bubble>
          <h3 className="ct-lb">{ctx.t("location.hours")}</h3>
          <dl className="ct-list row ct-hours">
            {hours.map((h) => (
              <div key={`${h.days}-${h.opens}`}>
                <dt>{formatDays(h.days, ctx.locale)}</dt>
                <dd>
                  {h.opens} – {h.closes}
                </dd>
              </div>
            ))}
          </dl>
        </Bubble>
      )}
    </ChatSection>
  );
}

// ---- logos de clientes --------------------------------------------------------------------

function freeHref(href: string | undefined, ctx: BlockProps["ctx"]): { href: string; external: boolean } | undefined {
  if (!href) return undefined;
  if (/^(https?:|\/\/)/i.test(href)) return { href, external: true };
  if (/^(mailto:|tel:|#)/i.test(href)) return { href, external: false };
  return { href: ctx.href(href), external: false };
}

/** Logos: uma grade de "figurinhas" claras dentro do balão. */
export function LogosClientesBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const logos: { name?: string; image?: any; href?: string }[] = fields.logos ?? [];
  if (!logos.length) return null;
  return (
    <ChatSection id={id} anchor={fields.anchor} type="logos-clientes" variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, "logos-clientes")}>
      <Bubble wide>
        <ul className="ct-logos">
          {logos.map((logo, i) => {
            const link = freeHref(logo.href, ctx);
            const img = logo.image ? <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} sizes="140px" /> : <span>{logo.name}</span>;
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
      </Bubble>
    </ChatSection>
  );
}

export const CHAT_BLOCKS = {
  hero: HeroBlock,
  texto: TextoBlock,
  numeros: NumerosBlock,
  "lista-itens": ListaItensBlock,
  cases: CasesBlock,
  servicos: ServicosBlock,
  depoimentos: DepoimentosBlock,
  faq: FaqBlock,
  "posts-recentes": PostsRecentesBlock,
  cta: CtaBlock,
  contato: ContatoBlock,
  galeria: GaleriaBlock,
  curriculo: CurriculoBlock,
  precos: PrecosBlock,
  equipe: EquipeBlock,
  localizacao: LocalizacaoBlock,
  "logos-clientes": LogosClientesBlock,
  ...CHAT_CORE_BLOCKS,
};
