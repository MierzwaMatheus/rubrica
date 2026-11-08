/**
 * Blocos que listam coleções, cada um como um programa do sistema: a pasta de cases
 * (ícones ou lista), as Notas (blog), a caixa de entrada (depoimentos), a Ajuda (FAQ),
 * a lista do Finder (serviços) e as Fotos (galeria).
 *
 * O que na v1 dependia de estado (a mensagem aberta na caixa de entrada, o filtro do
 * blog) virou CSS: botões de opção (`radio`) antes da lista e uma folha gerada para o
 * bloco, a mesma técnica do filtro de etiquetas do núcleo. Sem CSS, aparece tudo.
 */
import type { BlockProps, CollectionItems, ResolvedFields } from "@rubrica/core";
import type { cases as casesDef, depoimentos as depoimentosDef, faq as faqDef, galeria as galeriaDef, postsRecentes as postsDef, servicos as servicosDef } from "@rubrica/core/blocks";
import { Html, Img } from "@rubrica/core/components";
import { ButtonRow, DeskButton, Square, Window, iconColor, items, safeId, shorten } from "../window";

type ProjectItem = CollectionItems["projects"];
type PostItem = CollectionItems["posts"];
type TestimonialItem = CollectionItems["testimonials"];
type FaqItem = CollectionItems["faq"];
type ServiceItem = CollectionItems["services"];
type RoutineItem = CollectionItems["routine"];

type CasesFields = ResolvedFields<typeof casesDef.fields>;
type PostsFields = ResolvedFields<typeof postsDef.fields>;
type DepoimentosFields = ResolvedFields<typeof depoimentosDef.fields>;
type FaqFields = ResolvedFields<typeof faqDef.fields>;
type ServicosFields = ResolvedFields<typeof servicosDef.fields>;
type GaleriaFields = ResolvedFields<typeof galeriaDef.fields>;

type Ctx = BlockProps["ctx"];

/** Link "ver todos" da barra de status. */
function StatusLink({ link, ctx }: { link?: CasesFields["cta"]; ctx: Ctx }) {
  if (!link) return null;
  return (
    <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label} <span aria-hidden="true">→</span>
      {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
    </a>
  );
}

function Empty({ ctx }: { ctx: Ctx }) {
  return <p className="dk-empty">{ctx.t("desktop.empty")}</p>;
}

/** Miniatura do arquivo: a capa, ou a inicial sobre a cor da vez. */
function Thumb({ image, letter, color, badge }: { image?: ProjectItem["cover"]; letter: string; color: number; badge?: string }) {
  return (
    <span className="dk-thumb" style={iconColor(color)}>
      {image ? <Img image={{ ...image, alt: "" }} sizes="(min-width: 1024px) 280px, 100vw" /> : <span aria-hidden="true">{letter}</span>}
      {badge && <span className="dk-badge">★ {badge}</span>}
    </span>
  );
}

/**
 * Pasta de cases. Variações: `grade` (modo ícones, a padrão) e `lista` (modo lista do
 * Finder), os dois modos de exibição da pasta de portfólio da v1. Na página que lista
 * tudo (sem o link "ver todos"), o primeiro de três ou mais ocupa duas colunas.
 */
export function CasesBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<CasesFields, ProjectItem>) {
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  const meta = (p: ProjectItem) => [p.client, p.year].filter(Boolean).join(" · ") || p.tags[0];
  return (
    <Window
      id={id}
      anchor={fields.anchor}
      type="cases"
      variant={variant}
      title={fields.title}
      level={headingLevel}
      status={
        <>
          <span>{items(ctx, list.length)}</span>
          <StatusLink link={fields.cta} ctx={ctx} />
        </>
      }
    >
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length === 0 ? (
        <Empty ctx={ctx} />
      ) : variant === "lista" ? (
        <>
          <div className="dk-lh dk-lh--cases" aria-hidden="true">
            <span>{ctx.t("desktop.colName")}</span>
            <span>{ctx.t("desktop.colTags")}</span>
            <span>{ctx.t("desktop.colAction")}</span>
          </div>
          <ul className="dk-list">
            {list.map((p, i) => (
              <li key={p.id} className="dk-li dk-li--cases">
                <div>
                  <SubHeading className="dk-li__name">
                    <Square color={i} />
                    {p.title}
                  </SubHeading>
                  {p.summary && <p className="dk-li__desc">{shorten(p.summary, 160)}</p>}
                </div>
                <span className="dk-muted dk-mono">{p.tags.slice(0, 3).join(", ")}</span>
                <a href={p.url} className="dk-link">
                  {ctx.t("desktop.openCase")}
                  <span className="rb-sr-only">: {p.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="dk-grid">
          {list.map((p, i) => {
            const big = !fields.cta && i === 0 && list.length > 2;
            return (
              <li key={p.id} className={big ? "dk-grid__big" : undefined}>
                <article className="dk-file">
                  <Thumb image={p.cover} letter={p.title.charAt(0)} color={i} badge={big && p.featured ? ctx.t("desktop.featured") : undefined} />
                  <SubHeading className="dk-file__title">
                    <a href={p.url} className="dk-file__link">
                      {p.title}
                    </a>
                  </SubHeading>
                  {meta(p) && <p className="dk-muted dk-file__meta">{meta(p)}</p>}
                  {p.summary && <p className="dk-file__text">{shorten(p.summary, big ? 220 : 130)}</p>}
                  {p.tags.length > 0 && (
                    <ul className="dk-tags" aria-label={ctx.t("desktop.colTags")}>
                      {p.tags.slice(0, 3).map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  <span className="dk-link" aria-hidden="true">
                    {ctx.t("desktop.openCase")}
                  </span>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </Window>
  );
}

/** Folha do filtro de etiquetas das Notas: esconde as notas sem a etiqueta marcada. */
function noteFilterCss(scope: string, count: number): string {
  const rules: string[] = [];
  const on = "background:var(--rb-accent);color:var(--rb-accent-fg)";
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked~.dk-notes .dk-note:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked~.dk-notes .dk-view{display:none}`);
    rules.push(`${radio}:checked~.dk-places label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible~.dk-places label[for="${scope}-t${i}"]{outline:3px solid var(--rb-accent);outline-offset:-3px}`);
  }
  rules.push(`#${scope}-all:checked~.dk-places label[for="${scope}-all"]{${on}}`);
  rules.push(`#${scope}-all:focus-visible~.dk-places label[for="${scope}-all"]{outline:3px solid var(--rb-accent);outline-offset:-3px}`);
  return rules.join("\n");
}

function readMeta(post: PostItem, ctx: Ctx): string {
  return `${ctx.formatDate(post.publishedAt)} · ${ctx.t("blog.readingTime", { minutes: post.readingMinutes })}`;
}

/**
 * Notas: a lista de notas à esquerda (cada uma abre o post) e a primeira aberta à
 * direita, como no blog da v1. Com o filtro de etiquetas ligado, as etiquetas viram os
 * "Locais" da janela; filtrando, a nota aberta sai e a lista ocupa a janela.
 */
export function PostsRecentesBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<PostsFields, PostItem>) {
  const open = list[0];
  const tags = fields.showTagFilter ? [...new Set(list.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = tags.length > 0;
  const index = new Map(tags.map((t, i) => [t, i] as const));
  const scope = `n-${safeId(id)}`;
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  return (
    <Window
      id={id}
      anchor={fields.anchor}
      type="posts-recentes"
      variant={variant}
      title={fields.title}
      level={headingLevel}
      prefix={ctx.t("desktop.notes")}
      bar={ctx.t("desktop.notes")}
      status={
        <>
          <span>{items(ctx, list.length)}</span>
          <StatusLink link={fields.cta} ctx={ctx} />
        </>
      }
    >
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {!open ? (
        <Empty ctx={ctx} />
      ) : (
        <div className="dk-notes-wrap">
          {filter && <style dangerouslySetInnerHTML={{ __html: noteFilterCss(scope, tags.length) }} />}
          {filter && (
            <>
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {tags.map((t, i) => (
                <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="dk-places" role="group" aria-label={ctx.t("blog.filter")}>
                <span className="dk-places__title" aria-hidden="true">
                  {ctx.t("desktop.places")}
                </span>
                <label htmlFor={`${scope}-all`} className="dk-place">
                  <Square color={2} />
                  {ctx.t("blog.allTags")}
                </label>
                {tags.map((t, i) => (
                  <label key={t} htmlFor={`${scope}-t${i}`} className="dk-place">
                    <Square color={i} />
                    {t}
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="dk-notes">
            <ul className="dk-notes__list">
              {list.map((p) => (
                <li key={p.id} className="dk-note" data-tags={filter ? p.tags.map((t) => `t${index.get(t)}`).join(" ") : undefined}>
                  <a href={p.url} className={`dk-note__link${p === open ? " dk-note__link--on" : ""}`}>
                    <span className="dk-note__title">{p.title}</span>
                    <span className="dk-note__meta">{readMeta(p, ctx)}</span>
                    {p.excerpt && <span className="dk-note__excerpt">{shorten(p.excerpt, 80)}</span>}
                    {p.tags.length > 0 && <span className="dk-note__meta">{p.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}</span>}
                  </a>
                </li>
              ))}
            </ul>
            <article className="dk-view" aria-label={ctx.t("desktop.open")}>
              {open.cover && (
                <div className="dk-cover">
                  <Img image={{ ...open.cover, alt: "" }} sizes="(min-width: 1024px) 600px, 100vw" />
                </div>
              )}
              <p className="dk-note__meta">
                <time dateTime={open.publishedAt}>{ctx.formatDate(open.publishedAt)}</time> · {ctx.t("blog.readingTime", { minutes: open.readingMinutes })}
              </p>
              <SubHeading className="dk-view__title">{open.title}</SubHeading>
              {open.excerpt && <p className="dk-desc">{open.excerpt}</p>}
              {open.tags.length > 0 && (
                <ul className="dk-chips" aria-label={ctx.t("desktop.colTags")}>
                  {open.tags.map((t) => (
                    <li key={t} className="dk-chip dk-mono">
                      #{t}
                    </li>
                  ))}
                </ul>
              )}
              <ButtonRow>
                <a href={open.url} className="dk-btn dk-btn--primary">
                  {ctx.t("desktop.readNow")}
                  <span className="rb-sr-only">: {open.title}</span>
                </a>
              </ButtonRow>
            </article>
          </div>
        </div>
      )}
    </Window>
  );
}

/** Folha da caixa de entrada: mostra só a mensagem marcada (a primeira, de início). */
function inboxCss(scope: string, count: number): string {
  const rules: string[] = [`#${scope} .dk-msg{display:none}`];
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-m${i}`;
    rules.push(`${radio}:checked~.dk-mail__view .dk-msg[data-msg="${i}"]{display:flex}`);
    rules.push(`${radio}:checked~.dk-mail__list label[for="${scope}-m${i}"]{background:var(--rb-accent);color:var(--rb-accent-fg)}`);
    rules.push(`${radio}:focus-visible~.dk-mail__list label[for="${scope}-m${i}"]{outline:3px solid var(--rb-accent);outline-offset:-3px}`);
  }
  return rules.join("\n");
}

/**
 * Depoimentos como caixa de entrada: remetentes à esquerda, a mensagem aberta à direita.
 * Escolher outra mensagem é um botão de opção (sem JavaScript); sem CSS, todas aparecem.
 */
export function DepoimentosBlock({ id, variant, fields, items: list, headingLevel, ctx, island }: BlockProps<DepoimentosFields, TestimonialItem>) {
  const scope = `m-${safeId(id)}`;
  const role = (t: TestimonialItem) => [t.role, t.company].filter(Boolean).join(", ");
  const intake = fields.allowSubmission && island ? <div className="rb-island dk-mail__island">{island}</div> : null;
  return (
    <Window id={id} anchor={fields.anchor} type="depoimentos" variant={variant} title={fields.title} level={headingLevel} suffix={` · ${ctx.t("desktop.inbox", { count: list.length })}`} bar={ctx.t("desktop.inbox", { count: list.length })}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length === 0 ? (
        <div className="dk-msg dk-msg--empty">
          <p className="dk-muted">{ctx.t("desktop.inboxEmpty")}</p>
          {intake}
        </div>
      ) : (
        <>
          <style dangerouslySetInnerHTML={{ __html: inboxCss(scope, list.length) }} />
          <div className="dk-mail" id={scope}>
            {list.map((t, i) => (
              <input key={t.id} type="radio" name={scope} id={`${scope}-m${i}`} className="rb-sr-only" defaultChecked={i === 0} />
            ))}
            <div className="dk-mail__list" role="group" aria-label={ctx.t("desktop.messages")}>
              {list.map((t, i) => (
                <label key={t.id} htmlFor={`${scope}-m${i}`} className="dk-mail__item">
                  <b>{t.author}</b>
                  <small>{shorten(t.quote, 52)}</small>
                </label>
              ))}
            </div>
            <div className="dk-mail__view">
              {list.map((t, i) => (
                <figure key={t.id} className="dk-msg" data-msg={i}>
                  <figcaption className="dk-msg__from">
                    {t.avatar && <Img image={t.avatar} className="dk-msg__avatar" sizes="40px" />}
                    <span>
                      {ctx.t("desktop.from")}: <strong>{t.author}</strong>
                      {role(t) && <span className="dk-muted"> · {role(t)}</span>}
                    </span>
                  </figcaption>
                  <blockquote className="dk-msg__text">
                    <p>“{t.quote}”</p>
                  </blockquote>
                </figure>
              ))}
              {intake}
            </div>
          </div>
        </>
      )}
    </Window>
  );
}

/** Ajuda: cada pergunta abre e fecha (`details`), com o "?" do sistema. */
export function FaqBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<FaqFields, FaqItem>) {
  return (
    <Window id={id} anchor={fields.anchor} type="faq" variant={variant} title={fields.title} level={headingLevel} prefix={ctx.t("desktop.help")} bar={ctx.t("desktop.help")}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length > 0 && (
        <div className="dk-help">
          {list.map((q) => (
            <details key={q.id}>
              <summary>
                <span className="dk-help__q" aria-hidden="true">
                  ?
                </span>
                <span>{q.question}</span>
              </summary>
              <Html html={q.answer} className="dk-help__a" />
            </details>
          ))}
        </div>
      )}
    </Window>
  );
}

/** Serviços na lista do Finder: nome com o quadradinho colorido, descrição e preço. */
export function ServicosBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<ServicosFields, ServiceItem>) {
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  const priced = list.some((s) => s.priceLabel);
  return (
    <Window id={id} anchor={fields.anchor} type="servicos" variant={variant} title={fields.title} level={headingLevel} status={<span>{items(ctx, list.length)}</span>}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length === 0 ? (
        <Empty ctx={ctx} />
      ) : (
        <>
          <div className={`dk-lh${priced ? " dk-lh--priced" : ""}`} aria-hidden="true">
            <span>{ctx.t("desktop.colName")}</span>
            <span>{ctx.t("desktop.colDescription")}</span>
            {priced && <span />}
          </div>
          <ul className="dk-list">
            {list.map((s, i) => (
              <li key={s.id} className={`dk-li${priced ? " dk-li--priced" : ""}`}>
                <SubHeading className="dk-li__name">
                  <Square color={i} />
                  {s.title}
                </SubHeading>
                {s.description ? <p className="dk-li__desc">{s.description}</p> : <span />}
                {priced && <span className="dk-mono dk-li__price">{s.priceLabel}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
      {fields.cta && (
        <div className="dk-pad dk-pad--tight">
          <ButtonRow>
            <DeskButton link={fields.cta} ctx={ctx} primary />
          </ButtonRow>
        </div>
      )}
    </Window>
  );
}

/** Fotos: uma pasta de imagens com a legenda sempre visível. */
export function GaleriaBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<GaleriaFields, RoutineItem>) {
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  return (
    <Window id={id} anchor={fields.anchor} type="galeria" variant={variant} title={fields.title} level={headingLevel} prefix={ctx.t("desktop.photos")} bar={ctx.t("desktop.photos")} status={<span>{items(ctx, list.length)}</span>}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length === 0 ? (
        <Empty ctx={ctx} />
      ) : (
        <ul className="dk-photos">
          {list.map((item) => (
            <li key={item.id}>
              <figure>
                {item.image && <Img image={item.image} className="dk-photos__img" sizes="(min-width: 1024px) 280px, 100vw" />}
                <figcaption>
                  <SubHeading className="dk-photos__title">{item.title}</SubHeading>
                  {item.description && <p>{item.description}</p>}
                  {item.tags.length > 0 && (
                    <ul className="dk-chips">
                      {item.tags.map((t) => (
                        <li key={t} className="dk-chip dk-mono">
                          {t}
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
    </Window>
  );
}
