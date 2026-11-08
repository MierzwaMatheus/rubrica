/**
 * Blocos do Jardim Digital. Substitui os que na v1 têm visual próprio: apresentação
 * (hero), números ("estado do jardim"), cases ("árvores"), posts ("notas" por estágio),
 * serviços ("canteiros"), depoimentos ("livro de visitas"), chamada final, galeria
 * (fotos do dia a dia) e currículo (linha do tempo). Os outros herdam o núcleo e ganham
 * o visual pelo CSS.
 *
 * O que na v1 dependia de estado vira estático:
 * - filtro por canteiro (cases) e por etiqueta (posts): botões de opção + CSS;
 * - "mostrar experiências anteriores": todas aparecem (sem estado nada fica escondido);
 * - formulário de depoimento e PDF do currículo: ilhas do núcleo.
 */
import type { BlockProps, CollectionItems, ResolvedLink } from "@rubrica/core";
import { Heading, Img, LinkButton, safeId } from "@rubrica/core/components";
import { barePath, cls, Crumb, currentLabel, experienceStage, ownerName, postStage, projectStage, RECENT_DAYS, SectionHead, StageDot, StageLabel, type Stage } from "./garden";

type Project = CollectionItems["projects"];
type Post = CollectionItems["posts"];
type Service = CollectionItems["services"];
type Testimonial = CollectionItems["testimonials"];
type Routine = CollectionItems["routine"];
type Resume = CollectionItems["resume"];

/** Identificador seguro para `id` e seletores CSS. */

function Frame({ id, anchor, type, variant, className, children }: { id: string; anchor?: string; type: string; variant: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={anchor || `b-${id}`} className={cls("rb-section", `rb-${type}`, "gd-sec", className)} data-block={type} data-variant={variant}>
      {children}
    </section>
  );
}

/** Link "ver todos →" ao lado do título da seção. */
function SeeAll({ link }: { link?: ResolvedLink }) {
  if (!link?.href) return null;
  return (
    <a href={link.href} className="gd-link" {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label} <span aria-hidden="true">→</span>
    </a>
  );
}

function Actions({ links }: { links: (ResolvedLink | undefined)[] }) {
  const list = links.filter((l): l is ResolvedLink => !!l?.href);
  if (!list.length) return null;
  return (
    <div className="gd-row">
      {list.map((l, i) => (
        <LinkButton key={`${i}-${l.href}`} link={l} variant={i === 0 ? "primary" : "secondary"} />
      ))}
    </div>
  );
}

// ---- hero ---------------------------------------------------------------------------------

/**
 * Entrada do jardim. Na home, a saudação ("Oi! Eu sou Ana.") abre a página e a frase de
 * valor (o h1) vem logo abaixo, como na v1; nas outras páginas o título é o próprio h1.
 * O primeiro bloco com h1 leva a migalha "jardim / página".
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const home = barePath(ctx, ctx.path) === "/";
  const greet = headingLevel === 1 && home;
  const name = ownerName(ctx);
  return (
    <Frame id={id} type="hero" variant={variant} className="gd-hero">
      {headingLevel === 1 && <Crumb ctx={ctx} page={currentLabel(ctx)} />}
      {fields.showAvailability && (
        <div className="gd-chips">
          <span className="gd-chip">
            <span className="gd-pulse" aria-hidden="true" />
            {ctx.t("hero.available")}
          </span>
        </div>
      )}
      {greet && <p className="gd-h1">{ctx.t(ctx.site.kind === "empresa" ? "garden.org.hello" : "garden.hello", { name })}</p>}
      {fields.title && (
        <Heading level={headingLevel} className={greet ? "gd-lead" : headingLevel === 1 ? "gd-h1" : "gd-h2"}>
          {fields.title}
        </Heading>
      )}
      {fields.eyebrow && <p className="gd-p gd-muted">{fields.eyebrow}</p>}
      {fields.subtitle && <p className="gd-p">{fields.subtitle}</p>}
      {!!fields.tags?.length && (
        <ul className="gd-chips">
          {fields.tags.map((t: { label: string }, i: number) => (
            <li key={`${i}-${t.label}`} className="gd-chip">
              {t.label}
            </li>
          ))}
        </ul>
      )}
      <Actions links={[fields.primaryCta, fields.secondaryCta]} />
      {fields.image && <Img image={fields.image} className="gd-hero-img" priority sizes="(min-width: 960px) 520px, 100vw" />}
    </Frame>
  );
}

// ---- números ------------------------------------------------------------------------------

/** "Estado do jardim": os números como cartões pequenos. */
export function NumerosBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  return (
    <Frame id={id} anchor={fields.anchor} type="numeros" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel} />
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 && (
        <dl className="gd-met">
          {items.map((m, i) => (
            <div key={`${i}-${m.label}`}>
              <dt className="gd-met-l">{m.label}</dt>
              <dd className="gd-met-v">{m.value}</dd>
              {m.description && <dd className="gd-met-d">{m.description}</dd>}
            </div>
          ))}
        </dl>
      )}
    </Frame>
  );
}

// ---- filtro por etiqueta (sem JavaScript) -------------------------------------------------

/**
 * Botões de opção antes da lista e uma folha de estilo do bloco que esconde o que não tem
 * a etiqueta marcada. Sem CSS, tudo aparece. Os ids vêm do índice, nunca do texto.
 */
function filterCss(scope: string, count: number, hide: string, extra?: (radio: string) => string): string {
  const rules: string[] = [];
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ ${hide.replace(/\$T/g, `t${i}`)}{display:none}`);
    rules.push(`${radio}:checked ~ .gd-filter label[for="${scope}-t${i}"]{background:var(--rb-accent);color:var(--rb-accent-fg);border-color:var(--rb-accent)}`);
    rules.push(`${radio}:focus-visible ~ .gd-filter label[for="${scope}-t${i}"]{outline:2px solid var(--rb-fg);outline-offset:2px}`);
    if (extra) rules.push(extra(radio));
  }
  rules.push(`#${scope}-all:checked ~ .gd-filter label[for="${scope}-all"]{background:var(--rb-accent);color:var(--rb-accent-fg);border-color:var(--rb-accent)}`);
  rules.push(`#${scope}-all:focus-visible ~ .gd-filter label[for="${scope}-all"]{outline:2px solid var(--rb-fg);outline-offset:2px}`);
  return rules.join("\n");
}

function Filter({ scope, tags, ctx }: { scope: string; tags: string[]; ctx: BlockProps["ctx"] }) {
  return (
    <>
      <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
      {tags.map((t, i) => (
        <input key={t} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
      ))}
      <div className="gd-filter" role="group" aria-label={ctx.t("garden.filterBeds")}>
        <label htmlFor={`${scope}-all`}>{ctx.t("garden.all")}</label>
        {tags.map((t, i) => (
          <label key={t} htmlFor={`${scope}-t${i}`}>
            {t}
          </label>
        ))}
      </div>
    </>
  );
}

const distinct = (lists: string[][], locale: string) => [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b, locale));

// ---- cases --------------------------------------------------------------------------------

function ProjectCard({ project, wide, tagCode, ctx }: { project: Project; wide: boolean; tagCode?: string; ctx: BlockProps["ctx"] }) {
  const stage = projectStage(project);
  return (
    <li className={cls("gd-card", "gd-card-link", wide && "gd-wide")} data-tags={tagCode}>
      <div className="gd-thumb">
        {project.cover ? (
          <Img image={{ ...project.cover, alt: "" }} sizes="(min-width: 960px) 360px, 100vw" />
        ) : (
          <span className="gd-thumb-i" aria-hidden="true">
            {project.title.slice(0, 1)}
          </span>
        )}
      </div>
      <StageLabel ctx={ctx} stage={stage} extra={project.tags[0]} />
      <Heading level={3} className="gd-card-t">
        <a href={project.url} className="gd-card-a">
          {project.title}
        </a>
      </Heading>
      {project.summary && <p className="gd-card-d">{project.summary}</p>}
      <span className="gd-more" aria-hidden="true">
        {ctx.t("garden.readCase")} →
      </span>
    </li>
  );
}

/**
 * "Árvores e brotos": cartões com miniatura, estágio, título e uma ação só. Variações:
 * `grade` (padrão) e `destaque`, em que o primeiro cartão é largo e as etiquetas dos
 * projetos viram o filtro por canteiro, como o portfólio da v1.
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Project>) {
  const featured = variant === "destaque";
  const tags = featured ? distinct(items.map((p) => p.tags), ctx.locale) : [];
  const filter = tags.length > 1;
  const index = new Map(tags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const wide = featured && items.length > 2;
  return (
    <Frame id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel}>
        <SeeAll link={fields.cta} />
      </SectionHead>
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 ? (
        <div className="gd-list-wrap">
          {filter && (
            <>
              <style dangerouslySetInnerHTML={{ __html: filterCss(scope, tags.length, `.gd-cards > .gd-card:not([data-tags~="$T"])`, (radio) => `${radio}:checked ~ .gd-cards > .gd-wide{grid-column:auto;display:flex}`) }} />
              <Filter scope={scope} tags={tags} ctx={ctx} />
            </>
          )}
          <ul className="gd-cards">
            {items.map((p, i) => (
              <ProjectCard key={p.id} project={p} wide={wide && i === 0} tagCode={filter ? p.tags.map((t) => `t${index.get(t)}`).join(" ") : undefined} ctx={ctx} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="gd-p gd-muted">{ctx.t("common.empty")}</p>
      )}
    </Frame>
  );
}

// ---- posts --------------------------------------------------------------------------------

const STAGE_ORDER: Stage[] = ["tree", "seed", "sprout"];

function PostNote({ post, stage, tagCode, ctx }: { post: Post; stage: Stage; tagCode?: string; ctx: BlockProps["ctx"] }) {
  return (
    <li className="gd-note-li" data-tags={tagCode}>
      <div className="gd-note-row">
        <div className="gd-note-main">
          <p className="gd-meta">
            <StageLabel ctx={ctx} stage={stage} />
            <time dateTime={post.publishedAt}>{ctx.formatDate(post.publishedAt, "short")}</time>
            <span>{ctx.t("blog.readingTime", { minutes: post.readingMinutes })}</span>
          </p>
          <Heading level={3} className="gd-note-t">
            <a href={post.url}>{post.title}</a>
          </Heading>
          {post.excerpt && <p className="gd-note-s">{post.excerpt}</p>}
          {post.tags.length > 0 && (
            <ul className="gd-tags">
              {post.tags.map((t) => (
                <li key={t} className="gd-tag">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
        {post.cover && <Img image={{ ...post.cover, alt: "" }} className="gd-note-img" sizes="120px" />}
      </div>
    </li>
  );
}

/**
 * Notas do jardim. Variações: `notas` (padrão), agrupadas por estágio (árvores, sementes
 * recentes, brotos), e `lista`, uma lista só por data. O filtro por etiqueta vale nas duas.
 */
export function PostsRecentesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Post>) {
  const now = Date.now();
  const tags = fields.showTagFilter ? distinct(items.map((p) => p.tags), ctx.locale) : [];
  const filter = tags.length > 0;
  const index = new Map(tags.map((t, i) => [t, i] as const));
  const scope = `f-${safeId(id)}`;
  const code = (p: Post) => (filter ? p.tags.map((t) => `t${index.get(t)}`).join(" ") : undefined);
  const grouped = variant !== "lista";
  const groups = STAGE_ORDER.map((stage) => ({ stage, list: items.filter((p) => postStage(p, now) === stage) })).filter((g) => g.list.length > 0);
  const groupLevel = fields.title ? 3 : 2;
  return (
    <Frame id={id} anchor={fields.anchor} type="posts-recentes" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel}>
        <SeeAll link={fields.cta} />
      </SectionHead>
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 ? (
        <div className="gd-posts">
          {filter && (
            <>
              <style
                dangerouslySetInnerHTML={{
                  __html:
                    filterCss(scope, tags.length, `.gd-posts-body .gd-note-li:not([data-tags~="$T"])`) +
                    "\n" +
                    tags.map((_, i) => `#${scope}-t${i}:checked ~ .gd-posts-body .gd-group:not(:has([data-tags~="t${i}"])){display:none}`).join("\n"),
                }}
              />
              <Filter scope={scope} tags={tags} ctx={ctx} />
            </>
          )}
          <div className="gd-posts-body">
            {grouped ? (
              groups.map(({ stage, list }) => (
                <section key={stage} className="gd-group" data-stage={stage}>
                  <Heading level={groupLevel as 2 | 3} className="gd-h2 gd-group-t">
                    {ctx.t(`garden.stageGroup.${stage}`, { days: RECENT_DAYS })}
                  </Heading>
                  <ul className="gd-notes">
                    {list.map((p) => (
                      <PostNote key={p.id} post={p} stage={stage} tagCode={code(p)} ctx={ctx} />
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              <ul className="gd-notes">
                {items.map((p) => (
                  <PostNote key={p.id} post={p} stage={postStage(p, now)} tagCode={code(p)} ctx={ctx} />
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="gd-p gd-muted">{ctx.t("common.empty")}</p>
      )}
    </Frame>
  );
}

// ---- serviços -----------------------------------------------------------------------------

/**
 * "Canteiros": cada serviço é um canteiro numerado. Na variação `etiquetas` os serviços
 * viram etiquetas curtas (os "interesses" da página Sobre na v1).
 */
export function ServicosBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, Service>) {
  return (
    <Frame id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel} />
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 &&
        (variant === "etiquetas" ? (
          <ul className="gd-tags">
            {items.map((s) => (
              <li key={s.id} className="gd-tag">
                {s.title}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="gd-beds">
            {items.map((s, i) => (
              <li key={s.id} className="gd-bed">
                <span className="gd-eyebrow">
                  {ctx.t("garden.bed")} {String(i + 1).padStart(2, "0")}
                </span>
                <Heading level={3}>{s.title}</Heading>
                {s.description && <p>{s.description}</p>}
                {s.priceLabel && <p className="gd-bed-price">{s.priceLabel}</p>}
              </li>
            ))}
          </ul>
        ))}
      <Actions links={[fields.cta]} />
    </Frame>
  );
}

// ---- depoimentos --------------------------------------------------------------------------

/** "Livro de visitas": cada depoimento é uma visita numerada. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, Testimonial>) {
  return (
    <Frame id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel} />
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 && (
        <ul className="gd-gb">
          {items.map((t, i) => (
            <li key={t.id}>
              <small>
                {ctx.t("garden.visit")} {String(i + 1).padStart(2, "0")}
              </small>
              <blockquote>“{t.quote}”</blockquote>
              <b>{t.author}</b>
              {(t.role || t.company) && <span>{[t.role, t.company].filter(Boolean).join(", ")}</span>}
            </li>
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island gd-island">{island}</div> : null}
    </Frame>
  );
}

// ---- chamada final ------------------------------------------------------------------------

/** "Plante uma conversa": o fechamento numa faixa suave. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  return (
    <section id={fields.anchor || `b-${id}`} className="rb-section rb-cta gd-cta" data-block="cta" data-variant={variant}>
      <span className="gd-eyebrow">{ctx.t("garden.plant")}</span>
      <Heading level={headingLevel} className="gd-h2">
        {fields.title}
      </Heading>
      {fields.body && <p className="gd-p">{fields.body}</p>}
      <Actions links={[fields.primary, fields.secondary]} />
    </section>
  );
}

// ---- galeria ------------------------------------------------------------------------------

/** Fotos do dia a dia, em retrato, com a legenda embaixo. */
export function GaleriaBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, Routine>) {
  return (
    <Frame id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel} />
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {items.length > 0 && (
        <ul className="gd-photos">
          {items.map((item) => (
            <li key={item.id}>
              <figure>
                {item.image ? <Img image={item.image} sizes="(min-width: 960px) 180px, 45vw" /> : <span className="gd-photo-ph" aria-hidden="true" />}
                <figcaption>
                  <b>{item.title}</b>
                  {item.description && <span>{item.description}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}

// ---- currículo ----------------------------------------------------------------------------

function Period({ item, ctx }: { item: Resume; ctx: BlockProps["ctx"] }) {
  if (!item.start && !item.end) return null;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return (
    <span>
      {item.start && <time dateTime={item.start}>{month(item.start)}</time>}
      {" – "}
      {item.end ? <time dateTime={item.end}>{month(item.end)}</time> : ctx.t("resume.present")}
    </span>
  );
}

/** Texto do item: linhas com "- " viram lista, o resto vira parágrafo. */
function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="gd-rich">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="gd-rich">{lines.join(" ")}</p>;
}

/**
 * Currículo como o jardim: a experiência numa linha do tempo com anéis (a atual é um
 * broto "em crescimento", as encerradas são árvores), as habilidades num canteiro de
 * etiquetas e formação, certificações e idiomas em listas. A v1 agrupava as habilidades
 * por "grupo"; o item de currículo do contrato não traz esse campo.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, Resume>) {
  const by = (kind: Resume["kind"]) => items.filter((i) => i.kind === kind);
  const experience = by("experience");
  const skills = by("skill");
  const lists: Resume["kind"][] = ["education", "certification", "language"];
  return (
    <Frame id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHead title={fields.title} level={headingLevel} />
      {fields.intro && <p className="gd-p gd-muted">{fields.intro}</p>}
      {fields.showDownload && island ? <div className="rb-island gd-island">{island}</div> : null}

      {experience.length > 0 && (
        <section className="gd-sub" aria-labelledby={`${id}-exp`}>
          <Heading level={3} id={`${id}-exp`} className="gd-h2">
            {ctx.t("garden.timeline")}
          </Heading>
          <p className="gd-p gd-muted">{ctx.t("resume.experience")}</p>
          <ol className="gd-tl">
            {experience.map((exp) => {
              const stage = experienceStage(exp);
              return (
                <li key={exp.id}>
                  <span className="gd-ring" data-stage={stage} aria-hidden="true">
                    <StageDot stage={stage} size={8} />
                  </span>
                  <div className="gd-tl-meta">
                    <Period item={exp} ctx={ctx} />
                    <StageLabel ctx={ctx} stage={stage} extra={stage === "sprout" ? ctx.t("garden.growing") : undefined} />
                  </div>
                  <Heading level={3} className="gd-h3">
                    {exp.title}
                  </Heading>
                  {(exp.organization || exp.location) && <p className="gd-tl-org">{[exp.organization, exp.location].filter(Boolean).join(" · ")}</p>}
                  <Description text={exp.description} />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {skills.length > 0 && (
        <section className="gd-sub" aria-labelledby={`${id}-skill`}>
          <Heading level={3} id={`${id}-skill`} className="gd-h2">
            {ctx.t("garden.skillBeds")}
          </Heading>
          <p className="gd-p gd-muted">{ctx.t("resume.skill")}</p>
          <div className="gd-beds">
            <div className="gd-bed">
              <ul className="gd-tags">
                {skills.map((s) => (
                  <li key={s.id} className="gd-tag">
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {lists.map((kind) => {
        const list = by(kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="gd-sub" aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="gd-h2">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            <ul className="gd-list">
              {list.map((i) => (
                <li key={i.id}>
                  <span className="gd-list-t">{i.title}</span>
                  {(i.organization || i.start || i.end) && (
                    <small>
                      {i.organization}
                      {i.organization && (i.start || i.end) ? " · " : ""}
                      {(i.start || i.end) && <Period item={i} ctx={ctx} />}
                    </small>
                  )}
                  {i.description && <Description text={i.description} />}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Frame>
  );
}

export const GARDEN_BLOCKS = {
  hero: HeroBlock,
  numeros: NumerosBlock,
  cases: CasesBlock,
  "posts-recentes": PostsRecentesBlock,
  servicos: ServicosBlock,
  depoimentos: DepoimentosBlock,
  cta: CtaBlock,
  galeria: GaleriaBlock,
  curriculo: CurriculoBlock,
};
