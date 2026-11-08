/**
 * Blocos que, na v1 do Blueprint, têm visual diferente do padrão do núcleo: apresentação
 * (hero com carimbo), especificações (números), pranchas (cases), detalhes (serviços),
 * pareceres (depoimentos), memorial (texto), normas (lista de itens), notas gerais (FAQ),
 * cronograma (galeria), registro de revisões (posts), ordem de serviço (chamada) e a ficha
 * técnica do currículo. Os outros blocos usam o componente do núcleo, só dentro da folha
 * (ver `index.tsx`).
 *
 * Cada componente devolve a folha inteira (`Sheet`) com o `Section` do núcleo dentro, que
 * leva o `id`/âncora do bloco.
 */
import type { CSSProperties } from "react";
import type { BlockProps, CollectionItems } from "@rubrica/core";
import { Heading, Html, Img, Section, SectionHeader, safeId, tagFilterCss as coreTagFilterCss } from "@rubrica/core/components";
import { Btn, Dim, Hatch, Num, Sheet, TitleBlock, count, drawnBy, isoDate, ownerName, pad2, stampDate, stripTags, wordCount } from "./parts";

type Project = CollectionItems["projects"];
type Post = CollectionItems["posts"];
type Service = CollectionItems["services"];
type Testimonial = CollectionItems["testimonials"];
type FaqEntry = CollectionItems["faq"];
type Routine = CollectionItems["routine"];
type Resume = CollectionItems["resume"];

const Arrow = () => <span aria-hidden="true">→</span>;

// ---- hero ----------------------------------------------------------------------------

/**
 * Hero. Variação `apresentacao` (padrão): "Oi! Eu sou", cota com o tamanho do nome, o nome
 * grande, o cargo e o carimbo de disponibilidade. Variação `folha`: a ficha de uma página
 * interna (cota, título e apoio).
 */
export function HeroBlock({ id, variant, fields, headingLevel, index, total, ctx }: BlockProps<any>) {
  const { site } = ctx;
  const person = site.person;
  const presentation = variant !== "folha";
  const showPerson = presentation && Boolean(person);
  const dimOf: string = showPerson ? person!.name : fields.title ?? "";
  const role = showPerson ? person!.jobTitle ?? fields.eyebrow : undefined;
  const small = !presentation ? fields.eyebrow : showPerson ? ctx.t("blueprint.hello") : fields.eyebrow;
  const stamped = presentation && Boolean(fields.showAvailability);
  const hasAside = Boolean(fields.image) || stamped;

  return (
    <Sheet ctx={ctx} index={index} total={total} type="hero" label={presentation ? undefined : ctx.t("blueprint.sheet.page")}>
      <Section id={id} type="hero" variant={variant}>
        <div className={`bp-hero${hasAside ? "" : " bp-hero--solo"}${showPerson ? " bp-hero--person" : ""}`}>
          <div>
            {small && <p className="bp-small bp-small--first">{small}</p>}
            {dimOf && <Dim label={count(ctx, "blueprint.characters", Array.from(dimOf).length)} className="bp-hero-dim" />}
            {showPerson && <p className="bp-name">{person!.name}</p>}
            {role && <p className="bp-role">{role}</p>}
            {fields.title && (
              <Heading level={headingLevel} className={showPerson ? "bp-lead bp-lead--title" : "bp-h1"}>
                {fields.title}
              </Heading>
            )}
            {fields.subtitle && <p className="bp-p">{fields.subtitle}</p>}
            {!!fields.tags?.length && (
              <ul className="bp-tags bp-tags--row">
                {fields.tags.map((t: { label: string }, i: number) => (
                  <li key={`${i}-${t.label}`}>{t.label}</li>
                ))}
              </ul>
            )}
            {(fields.primaryCta || fields.secondaryCta) && (
              <div className="bp-row">
                {fields.primaryCta && (
                  <Btn link={fields.primaryCta} primary ctx={ctx} trail={<Arrow />} />
                )}
                {fields.secondaryCta && <Btn link={fields.secondaryCta} ctx={ctx} />}
              </div>
            )}
          </div>
          {hasAside && (
            <div className="bp-hero-aside">
              {fields.image && <Hatch image={fields.image} tall sizes="(min-width: 960px) 30vw, 100vw" />}
              {stamped && (
                <p className="bp-stamp">
                  <span className="bp-stamp-dot" aria-hidden="true" />
                  {ctx.t("hero.available")}
                  <small>
                    {ctx.t("blueprint.rev")} {stampDate()}
                  </small>
                </p>
              )}
            </div>
          )}
        </div>
      </Section>
    </Sheet>
  );
}

// ---- números -------------------------------------------------------------------------

/** Especificações: cada número com o código E1, E2… */
export function NumerosBlock({ id, variant, fields, headingLevel, index, total, ctx }: BlockProps<any>) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  return (
    <Sheet ctx={ctx} index={index} total={total} type="numeros">
      <Section id={id} anchor={fields.anchor} type="numeros" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <dl className="bp-spec">
            {items.map((m, i) => (
              <div key={`${i}-${m.label}`}>
                <dt>
                  <span className="bp-spec-code" aria-hidden="true">
                    E{i + 1}
                  </span>
                  <span className="bp-spec-l">{m.label}</span>
                </dt>
                <dd className="bp-spec-v">{m.value}</dd>
                {m.description && <dd className="bp-spec-d">{m.description}</dd>}
              </div>
            ))}
          </dl>
        )}
      </Section>
    </Sheet>
  );
}

// ---- cases ---------------------------------------------------------------------------

/** Pranchas: cada case numerado. Variações `grade` (3 colunas) e `destaque` (a primeira ocupa duas). */
export function CasesBlock({ id, variant, fields, items, headingLevel, index, total, ctx }: BlockProps<any, Project>) {
  return (
    <Sheet ctx={ctx} index={index} total={total} type="cases">
      <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 ? (
          <>
            <Dim label={count(ctx, "blueprint.plates", items.length)} />
            <ul className={`bp-plates${variant === "destaque" ? " bp-plates--feature" : ""}`}>
              {items.map((p, i) => {
                const facts = [p.category, p.client, p.year].filter(Boolean).join(" · ");
                return (
                  <li key={p.id} className="bp-card">
                    <Hatch image={p.cover} sizes="(min-width: 960px) 30vw, 100vw" />
                    <div className="bp-card-txt">
                      <span className="bp-card-cap">
                        <Num>{i + 1}</Num>
                        {ctx.t("blueprint.plate")} {pad2(i + 1)}
                      </span>
                      <Heading level={3} className="bp-h3">
                        <a href={p.url} className="bp-stretch">
                          {p.title}
                        </a>
                      </Heading>
                      {p.summary && <p>{p.summary}</p>}
                      {facts && <span className="bp-metric">{facts}</span>}
                      {p.tags.length > 0 && (
                        <ul className="bp-tags">
                          {p.tags.slice(0, 4).map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                      <span className="bp-btn" aria-hidden="true">
                        {ctx.t("blueprint.viewPlate")} <Arrow />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="bp-empty">{ctx.t("common.empty")}</p>
        )}
        {fields.cta && (
          <div className="bp-all">
            <a className="bp-link" href={fields.cta.href}>
              {fields.cta.label} →
            </a>
          </div>
        )}
      </Section>
    </Sheet>
  );
}

// ---- serviços ------------------------------------------------------------------------

/** Detalhes: cada serviço como um detalhe D1, D2… */
export function ServicosBlock({ id, variant, fields, items, headingLevel, index, total, ctx }: BlockProps<any, Service>) {
  return (
    <Sheet ctx={ctx} index={index} total={total} type="servicos">
      <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <>
            <Dim label={count(ctx, "blueprint.details", items.length)} />
            <ul className="bp-det">
              {items.map((s, i) => (
                <li key={s.id}>
                  <Num size="lg">D{i + 1}</Num>
                  <Heading level={3}>{s.title}</Heading>
                  <div>
                    {s.description && <p>{s.description}</p>}
                    {s.priceLabel && <p className="bp-metric">{s.priceLabel}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        {fields.cta && (
          <div className="bp-row">
            <Btn link={fields.cta} primary ctx={ctx} />
          </div>
        )}
      </Section>
    </Sheet>
  );
}

// ---- depoimentos ---------------------------------------------------------------------

/** Pareceres: a citação, a linha de assinatura e quem assina. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, index, total, ctx, island }: BlockProps<any, Testimonial>) {
  return (
    <Sheet ctx={ctx} index={index} total={total} type="depoimentos">
      <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <>
            <Dim label={count(ctx, "blueprint.opinions", items.length)} />
            <ul className="bp-par">
              {items.map((t) => (
                <li key={t.id}>
                  <figure>
                    <blockquote>
                      <p>“{t.quote}”</p>
                    </blockquote>
                    <span className="bp-sig" aria-hidden="true" />
                    <figcaption>
                      {t.avatar && <Img image={t.avatar} className="bp-avatar" sizes="40px" />}
                      <span>
                        <b>{t.author}</b>
                        {(t.role || t.company) && <small>{[t.role, t.company].filter(Boolean).join(", ")}</small>}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </>
        )}
        {fields.allowSubmission && island ? <div className="rb-island bp-all">{island}</div> : null}
      </Section>
    </Sheet>
  );
}

// ---- texto ---------------------------------------------------------------------------

/**
 * Memorial descritivo: o texto em duas colunas (a partir de três parágrafos), cada
 * parágrafo numerado pela folha (3.1, 3.2…) por contadores de CSS, e a cota com a
 * contagem de parágrafos e palavras. A imagem fica numa área hachurada ao lado.
 */
export function TextoBlock({ id, variant, fields, headingLevel, index, total, ctx }: BlockProps<any>) {
  const body: string = fields.body ?? "";
  const paragraphs = (body.match(/<p[\s>]/g) ?? []).length;
  const words = wordCount(stripTags(body));
  const image = fields.image && <Hatch image={fields.image} tall sizes="(min-width: 960px) 40vw, 100vw" />;
  return (
    <Sheet ctx={ctx} index={index} total={total} type="texto">
      <Section id={id} anchor={fields.anchor} type="texto" variant={variant} className={image ? "bp-texto--media" : undefined}>
        {fields.imagePosition === "start" && image}
        <div className="bp-texto__body" style={{ "--bp-sheet": `"${index}"` } as CSSProperties}>
          {fields.title && (
            <Heading level={headingLevel} className="bp-h2">
              {fields.title}
            </Heading>
          )}
          {paragraphs > 0 && <Dim label={count(ctx, "blueprint.paragraphs", paragraphs, { w: words })} />}
          {body && (
            <Html html={body} className="bp-memo" />
          )}
        </div>
        {fields.imagePosition !== "start" && image}
      </Section>
    </Sheet>
  );
}

// ---- lista de itens ------------------------------------------------------------------

/** Normas: itens em caixas; numerados, cada um leva o código N-01, N-02… */
export function ListaItensBlock({ id, variant, fields, headingLevel, index, total, ctx }: BlockProps<any>) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <Sheet ctx={ctx} index={index} total={total} type="lista-itens">
      <Section id={id} anchor={fields.anchor} type="lista-itens" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <>
            <Dim label={count(ctx, "blueprint.standards", items.length)} />
            <List className="bp-norms">
              {items.map((item, i) => (
                <li key={`${i}-${item.title}`}>
                  {fields.numbered && (
                    <span className="bp-norm-code" aria-hidden="true">
                      N-{pad2(i + 1)}
                    </span>
                  )}
                  <Heading level={3}>{item.title}</Heading>
                  {item.body && <p>{item.body}</p>}
                </li>
              ))}
            </List>
          </>
        )}
      </Section>
    </Sheet>
  );
}

// ---- FAQ -----------------------------------------------------------------------------

/** Notas gerais: perguntas e respostas à vista, numeradas. */
export function FaqBlock({ id, variant, fields, items, headingLevel, index, total, ctx }: BlockProps<any, FaqEntry>) {
  return (
    <Sheet ctx={ctx} index={index} total={total} type="faq">
      <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <>
            <Dim label={count(ctx, "blueprint.notes", items.length)} />
            <ol className="bp-notes">
              {items.map((q, i) => (
                <li key={q.id}>
                  <Num>{i + 1}</Num>
                  <Heading level={3}>{q.question}</Heading>
                  <Html html={q.answer} className="bp-notes__answer" />
                </li>
              ))}
            </ol>
          </>
        )}
      </Section>
    </Sheet>
  );
}

// ---- galeria -------------------------------------------------------------------------

/** Cronograma: cada item numerado, com a imagem numa área hachurada. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel, index, total, ctx }: BlockProps<any, Routine>) {
  return (
    <Sheet ctx={ctx} index={index} total={total} type="galeria">
      <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {items.length > 0 && (
          <>
            <Dim label={count(ctx, "blueprint.steps", items.length)} />
            <ol className="bp-steps">
              {items.map((item, i) => (
                <li key={item.id}>
                  {item.image && <Hatch image={item.image} sizes="(min-width: 960px) 25vw, 100vw" />}
                  <div className="bp-steps-txt">
                    <Num>{i + 1}</Num>
                    <div>
                      <Heading level={3}>{item.title}</Heading>
                      {item.description && <p>{item.description}</p>}
                      {item.tags.length > 0 && (
                        <ul className="bp-tags">
                          {item.tags.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </Section>
    </Sheet>
  );
}

// ---- chamada -------------------------------------------------------------------------

/** Ordem de serviço: a chamada com os botões e, ao lado, o carimbo do projeto. */
export function CtaBlock({ id, variant, fields, headingLevel, index, total, ctx }: BlockProps<any>) {
  const owner = ownerName(ctx);
  return (
    <Sheet ctx={ctx} index={index} total={total} type="cta">
      <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
        <div className="bp-os">
          <div>
            <Heading level={headingLevel} className="bp-h2">
              {fields.title}
            </Heading>
            {fields.body && <p className="bp-p">{fields.body}</p>}
            {(fields.primary || fields.secondary) && (
              <div className="bp-row">
                {fields.primary && (
                  <Btn link={fields.primary} primary ctx={ctx}>
                    <span aria-hidden="true">□ </span>
                  </Btn>
                )}
                {fields.secondary && (
                  <Btn link={fields.secondary} ctx={ctx}>
                    <span aria-hidden="true">□ </span>
                  </Btn>
                )}
              </div>
            )}
          </div>
          <TitleBlock
            ctx={ctx}
            rows={[
              [
                { label: ctx.t("blueprint.client"), value: ctx.t("blueprint.toBeDefined"), span: 2 },
                { label: ctx.t("blueprint.sheet"), value: pad2(index) },
              ],
              [
                { label: ctx.t("blueprint.scale"), value: "1:1" },
                { label: ctx.t("blueprint.date"), value: stampDate() },
                { label: ctx.t("blueprint.drawn"), value: drawnBy(owner) || "—" },
              ],
            ]}
          />
        </div>
      </Section>
    </Sheet>
  );
}

// ---- posts ---------------------------------------------------------------------------

/**
 * Filtro por etiqueta SEM JavaScript (o do núcleo): botões de opção antes da lista e uma
 * folha de estilo por bloco que esconde o que não tem a etiqueta marcada.
 */
const tagFilterCss = (scope: string, count: number) =>
  coreTagFilterCss(scope, count, {
    items: ".bp-posts .bp-post",
    filter: ".bp-layers",
    checked: "background:var(--rb-fg);color:var(--rb-bg)",
    focus: "outline:2px dashed var(--rb-fg);outline-offset:3px",
  });

/**
 * Registro de revisões: o primeiro post vira prancha em destaque e os outros entram numa
 * tabela REV · DATA · TÍTULO · LEITURA (que vira lista no celular).
 */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, index, total, ctx }: BlockProps<any, Post>) {
  const allTags: string[] = fields.showTagFilter ? [...new Set(items.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, ctx.locale)) : [];
  const filter = allTags.length > 0;
  const tagIndexes = new Map(allTags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const tagsOf = (p: Post) => (filter ? p.tags.map((t) => `t${tagIndexes.get(t)}`).join(" ") : undefined);
  const rev = (i: number) => `R${pad2(items.length - i)}`;
  const [featured, ...rest] = items;

  return (
    <Sheet ctx={ctx} index={index} total={total} type="posts-recentes">
      <Section id={id} anchor={fields.anchor} type="posts-recentes" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {featured ? (
          <>
            <Dim label={count(ctx, "blueprint.revisions", items.length)} />
            {filter && <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, allTags.length) }} />}
            {filter && (
              <>
                <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
                {allTags.map((t, i) => (
                  <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
                ))}
                <div className="bp-layers" role="group" aria-label={ctx.t("blog.filter")}>
                  <label htmlFor={`${scope}-all`}>{ctx.t("blog.allTags")}</label>
                  {allTags.map((t, i) => (
                    <label key={t} htmlFor={`${scope}-t${i}`}>
                      {t}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="bp-posts">
              {/* O destaque como prancha grande no topo */}
              <article className="bp-feature bp-post" data-tags={tagsOf(featured)}>
                <Hatch image={featured.cover} tall sizes="(min-width: 960px) 40vw, 100vw" />
                <div className="bp-feature-txt">
                  <span className="bp-card-cap">
                    {ctx.t("blueprint.revCol")} {rev(0)} · {ctx.t("blueprint.featured")}
                  </span>
                  <Heading level={3} className="bp-h3 bp-h3--lg">
                    <a href={featured.url} className="bp-stretch">
                      {featured.title}
                    </a>
                  </Heading>
                  {featured.excerpt && <p>{featured.excerpt}</p>}
                  <div className="bp-meta">
                    <time dateTime={featured.publishedAt}>{isoDate(featured.publishedAt)}</time>
                    <span>{ctx.t("blog.readingTime", { minutes: featured.readingMinutes })}</span>
                  </div>
                  {featured.tags.length > 0 && (
                    <ul className="bp-tags">
                      {featured.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  <span className="bp-btn bp-btn--pri" aria-hidden="true">
                    {ctx.t("common.readMore")} <Arrow />
                  </span>
                </div>
              </article>

              {/* Registro de revisões: REV | DATA | TÍTULO | LEITURA */}
              {rest.length > 0 && (
                <table className="bp-table bp-table--stack">
                  <caption>{ctx.t("blueprint.sheet.posts-recentes")}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{ctx.t("blueprint.revCol")}</th>
                      <th scope="col">{ctx.t("blueprint.date")}</th>
                      <th scope="col">{ctx.t("blueprint.titleCol")}</th>
                      <th scope="col" className="bp-num">
                        {ctx.t("blueprint.readingCol")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((p, i) => (
                      <tr key={p.id} className="bp-post" data-tags={tagsOf(p)}>
                        <td data-label={ctx.t("blueprint.revCol")} className="bp-half">
                          {rev(i + 1)}
                        </td>
                        <td data-label={ctx.t("blueprint.date")} className="bp-half">
                          <time dateTime={p.publishedAt}>{isoDate(p.publishedAt)}</time>
                        </td>
                        <td data-label={ctx.t("blueprint.titleCol")}>
                          <a href={p.url}>{p.title}</a>
                          {p.excerpt && <p className="bp-excerpt">{p.excerpt}</p>}
                          {p.tags.length > 0 && (
                            <ul className="bp-tags">
                              {p.tags.slice(0, 4).map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td data-label={ctx.t("blueprint.readingCol")} className="bp-num">
                          {ctx.t("blog.readingTime", { minutes: p.readingMinutes })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <p className="bp-empty">{ctx.t("common.empty")}</p>
        )}
        {fields.cta && (
          <div className="bp-all">
            <a className="bp-link" href={fields.cta.href}>
              {fields.cta.label} →
            </a>
          </div>
        )}
      </Section>
    </Sheet>
  );
}

// ---- currículo -----------------------------------------------------------------------

const yearOf = (v?: string) => (v && /^\d{4}/.test(v) ? Number(v.slice(0, 4)) : undefined);

/** Marcas do eixo: todos os anos, ou de 2 em 2 / 5 em 5 quando o período é longo. */
function axisTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span > 24 ? 5 : span > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let y = min; y <= max; y += step) ticks.push(y);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <div className="bp-rich">
        <ul>
          {bullets.map((l, i) => (
            <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
          ))}
        </ul>
      </div>
    );
  }
  return <div className="bp-rich">{lines.join(" ")}</div>;
}

/** Ficha técnica: experiências num eixo cotado, habilidades em códigos, formação em tabela. */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, index, total, ctx, island }: BlockProps<any, Resume>) {
  const byKind = (kind: Resume["kind"]) => items.filter((i) => i.kind === kind);
  const experiences = byKind("experience");
  const skills = byKind("skill");
  const languages = byKind("language");
  const education = byKind("education");
  const certifications = byKind("certification");

  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  const period = (i: Resume) => (i.start || i.end ? `${i.start ? month(i.start) : ""} – ${i.end ? month(i.end) : ctx.t("resume.present")}` : "");

  // Eixo cotado: só entra quando os períodos têm ano.
  const now = new Date().getUTCFullYear();
  const spans = experiences.map((e) => {
    const start = yearOf(e.start);
    return start === undefined ? null : { start, end: Math.max(e.end ? (yearOf(e.end) ?? now) : now, start) };
  });
  const known = spans.filter((s): s is { start: number; end: number } => s !== null);
  const min = known.length ? Math.min(...known.map((s) => s.start)) : 0;
  const max = known.length ? Math.max(...known.map((s) => s.end)) : 0;
  const range = Math.max(max - min, 1);
  const ticks = known.length ? axisTicks(min, max) : [];
  const pct = (year: number) => ((year - min) / range) * 100;

  const codes = (list: Resume[], prefix: string, withDetail?: boolean) => (
    <ul className="bp-codes">
      {list.map((s, i) => (
        <li key={s.id}>
          <span aria-hidden="true">
            {prefix}-{pad2(i + 1)}
          </span>
          <span>
            {s.title}
            {withDetail && s.description ? <em> · {s.description}</em> : null}
            {s.organization ? <em> · {s.organization}</em> : null}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <Sheet ctx={ctx} index={index} total={total} type="curriculo">
      <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
        <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
        {fields.showDownload && island ? <div className="rb-island bp-all bp-all--start">{island}</div> : null}

        {experiences.length > 0 && (
          <section className="bp-block" aria-labelledby={`${id}-experience`}>
            <Heading level={3} id={`${id}-experience`} className="bp-block-title">
              {ctx.t("resume.experience")}
            </Heading>
            <Dim label={`${count(ctx, "blueprint.positions", experiences.length)} · ${skills.length} skills`} />
            {known.length > 0 && (
              <div className="bp-axis" aria-hidden="true">
                <Dim label={`${min} — ${max} · ${count(ctx, "blueprint.years", max - min)}`} />
                {spans.map((s, i) => (
                  <div className="bp-axis-row" key={experiences[i]!.id}>
                    <Num>{i + 1}</Num>
                    <div className="bp-axis-track">
                      {s && <span className="bp-axis-bar" style={{ left: `${pct(s.start)}%`, width: `${Math.max(pct(s.end) - pct(s.start), 1.5)}%` }} />}
                    </div>
                  </div>
                ))}
                <div className="bp-axis-scale">
                  <span />
                  <div className="bp-axis-ticks">
                    {ticks.map((y, i) => (
                      <span key={y} className={`bp-axis-tick ${i === 0 ? "bp-axis-tick--first" : i === ticks.length - 1 ? "bp-axis-tick--last" : "bp-axis-tick--mid"}`} style={{ left: `${pct(y)}%` }}>
                        <span>{y}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <ol className="bp-exp">
              {experiences.map((e, i) => (
                <li key={e.id}>
                  <Num>{i + 1}</Num>
                  <div>
                    <h4 className="bp-h3">{e.title}</h4>
                    {(e.organization || e.location) && <p className="bp-exp-company">{[e.organization, e.location].filter(Boolean).join(" · ")}</p>}
                    <Description text={e.description} />
                  </div>
                  {period(e) && <span className="bp-exp-period">{period(e)}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {(skills.length > 0 || languages.length > 0) && (
          <div className="bp-split bp-block">
            {skills.length > 0 && (
              <section aria-labelledby={`${id}-skill`}>
                <Heading level={3} id={`${id}-skill`} className="bp-block-title">
                  {ctx.t("resume.skill")}
                </Heading>
                {codes(skills, "S")}
              </section>
            )}
            {languages.length > 0 && (
              <section aria-labelledby={`${id}-language`}>
                <Heading level={3} id={`${id}-language`} className="bp-block-title">
                  {ctx.t("resume.language")}
                </Heading>
                {codes(languages, "L", true)}
              </section>
            )}
          </div>
        )}

        {education.length > 0 && (
          <section className="bp-block" aria-labelledby={`${id}-education`}>
            <Heading level={3} id={`${id}-education`} className="bp-block-title">
              {ctx.t("resume.education")}
            </Heading>
            <table className="bp-table bp-table--stack">
              <thead>
                <tr>
                  <th scope="col">{ctx.t("blueprint.course")}</th>
                  <th scope="col">{ctx.t("blueprint.institution")}</th>
                  <th scope="col" className="bp-num">
                    {ctx.t("resume.period")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {education.map((e) => (
                  <tr key={e.id}>
                    <td data-label={ctx.t("blueprint.course")} className="bp-sans">
                      {e.title}
                    </td>
                    <td data-label={ctx.t("blueprint.institution")}>{e.organization}</td>
                    <td data-label={ctx.t("resume.period")} className="bp-num">
                      {period(e)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {certifications.length > 0 && (
          <section className="bp-block" aria-labelledby={`${id}-certification`}>
            <Heading level={3} id={`${id}-certification`} className="bp-block-title">
              {ctx.t("resume.certification")}
            </Heading>
            {codes(certifications, "C")}
          </section>
        )}
      </Section>
    </Sheet>
  );
}
