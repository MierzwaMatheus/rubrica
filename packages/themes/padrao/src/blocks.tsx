/**
 * Blocos que, na v1 padrão, têm visual diferente do padrão do núcleo. Os outros
 * blocos herdam os componentes do núcleo e ganham o visual só pelo CSS do tema.
 */
import type { BlockProps, FaqItem, ProjectItem, ResolvedLink, ResumeItem, RoutineItem, TestimonialItem } from "@rubrica/core";
import {
  groupResumeSkills,
  Heading,
  Html,
  Img,
  LinkButton,
  ResumeDescription,
  ResumeHeading,
  ResumePeriod,
  safeId,
  Section,
  SectionHeader,
  tagFilterCss,
} from "@rubrica/core/components";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

/**
 * Hero: chip de terminal (`$ <sobretítulo> → <nome>`), título, cargo, apoio com fio
 * lateral e botões com ícone. O nome e o cargo vêm do dono do site (`ctx.site.person`).
 */
/** Botão do hero: abre a janela de contato quando o link aponta para o contato; senão, é um link. */
function CtaLink({ link, className, icon }: { link: ResolvedLink; className: string; icon: IconName }) {
  if (link.dialog) {
    return (
      <button type="button" className={className} popoverTarget={link.dialog}>
        <Icon name={icon} />
        {link.label}
      </button>
    );
  }
  return (
    <a className={className} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <Icon name={icon} />
      {link.label}
    </a>
  );
}

export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  // Cabeçalho de página (currículo, portfólio...): só o título e o apoio, como as páginas da v1.
  if (variant === "pagina") {
    return (
      <Section id={id} type="hero" variant={variant}>
        <div className="rb-hero__body">
          <Heading level={headingLevel} className="rb-hero__title">
            {fields.title}
          </Heading>
          {fields.subtitle && <p className="rb-hero__lead">{fields.subtitle}</p>}
        </div>
      </Section>
    );
  }
  const person = ctx.site.person;
  const showChip = Boolean(fields.eyebrow || person);
  return (
    <Section id={id} type="hero" variant={variant}>
      <div className="rb-hero__body">
        {fields.showAvailability && (
          <p className="rb-hero__availability">
            <span className="rb-hero__dot" aria-hidden="true" />
            {ctx.t("hero.available")}
          </p>
        )}
        {showChip && (
          <p className="rb-hero__chip">
            <Icon name="terminal" size={12} />
            <span aria-hidden="true" className="rb-hero__prompt">$</span>
            {fields.eyebrow && <span>{fields.eyebrow}</span>}
            {fields.eyebrow && person && <span aria-hidden="true" className="rb-hero__arrow">→</span>}
            {person && <strong>{person.name}</strong>}
            <span className="rb-hero__caret" aria-hidden="true" />
          </p>
        )}
        {fields.title && (
          <Heading level={headingLevel} className="rb-hero__title">
            {fields.title}
          </Heading>
        )}
        {person?.jobTitle && <p className="rb-hero__role">{person.jobTitle}</p>}
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
            {fields.primaryCta && (
              <CtaLink link={fields.primaryCta} className="rb-button rb-button--primary" icon="folder" />
            )}
            {fields.secondaryCta && (
              <CtaLink link={fields.secondaryCta} className="rb-button rb-button--outline" icon="message" />
            )}
          </div>
        )}
      </div>
      {fields.image && <Img image={fields.image} className="rb-hero__image" priority sizes="(min-width: 960px) 40vw, 100vw" />}
    </Section>
  );
}

const SERVICE_ICONS: IconName[] = ["zap", "terminal", "layout", "cpu"];

/** Serviços: cartão com ícone num quadro, título na segunda cor; o último ocupa a linha se sobrar. */
export function ServicosBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-servicos__list">
          {items.map((s: { id: string; title: string; description?: string; priceLabel?: string }, i: number) => (
            <li key={s.id} className="rb-card rb-servico">
              <span className="rb-servico__icon">
                <Icon name={SERVICE_ICONS[i % SERVICE_ICONS.length]!} size={24} />
              </span>
              <Heading level={3} className="rb-card__title rb-servico__title">
                {s.title}
              </Heading>
              {s.description && <p className="rb-card__text">{s.description}</p>}
              {s.priceLabel && <p className="rb-card__meta">{s.priceLabel}</p>}
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

/** Cartão do depoimento: autor em cima (foto, nome, cargo na cor de destaque), citação em itálico. */
function DepoimentoCard({ t }: { t: TestimonialItem }) {
  return (
    <li className="rb-card rb-depoimento">
      <Icon name="quote" size={32} className="rb-depoimento__mark" />
      <figure className="rb-quote">
        <figcaption className="rb-quote__author">
          {t.avatar && <Img image={t.avatar} className="rb-quote__avatar" sizes="48px" />}
          <span>
            <strong>{t.author}</strong>
            {(t.role || t.company) && <span className="rb-quote__role">{[t.role, t.company].filter(Boolean).join(", ")}</span>}
          </span>
        </figcaption>
        <blockquote className="rb-quote__text">
          <p>{t.quote}</p>
        </blockquote>
      </figure>
    </li>
  );
}

/** Agrupa pela primeira etiqueta (a categoria), na ordem em que cada uma aparece; sem etiqueta, no fim. */
function byCategory(items: TestimonialItem[]): { category?: string; items: TestimonialItem[] }[] {
  const groups = new Map<string, TestimonialItem[]>();
  const rest: TestimonialItem[] = [];
  for (const item of items) {
    const key = item.tags?.[0]?.trim();
    if (!key) rest.push(item);
    else groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const out: { category?: string; items: TestimonialItem[] }[] = [...groups].map(([category, list]) => ({ category, items: list }));
  if (rest.length) out.push({ items: rest });
  return out;
}

/**
 * Depoimentos como os da v1. Na home: título com ícone de balão (sem o `/* *\/`), a grade,
 * o link "Ver todos" (campo `cta`) e o botão de enviar. Na variação `categorias` (a página de
 * depoimentos): a contagem e um grupo por categoria (`// CLIENTES`), em colunas.
 */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, TestimonialItem>) {
  const grouped = variant === "categorias";
  const groups = grouped ? byCategory(items) : [{ items }];
  const groupLevel = Math.min(fields.title ? headingLevel + 1 : headingLevel, 3) as 2 | 3;
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      {(fields.title || fields.intro) && (
        <header className="rb-section__header">
          {fields.title && (
            <Heading level={headingLevel} className="rb-section__title rb-depoimentos__title">
              <Icon name="message" size={20} />
              {fields.title}
            </Heading>
          )}
          {fields.intro && <p className="rb-section__intro">{fields.intro}</p>}
        </header>
      )}
      {grouped && items.length > 0 && (
        <p className="rb-depoimentos__count">({items.length === 1 ? ctx.t("testimonials.countOne") : ctx.t("testimonials.count", { count: items.length })})</p>
      )}
      {groups.map((g, i) =>
        g.items.length > 0 ? (
          <div key={g.category ?? `sem-${i}`} className="rb-depoimentos__group">
            {g.category && (
              <Heading level={groupLevel} className="rb-depoimentos__category">
                <span aria-hidden="true">// </span>
                {g.category}
              </Heading>
            )}
            <ul className="rb-grid rb-depoimentos__list">
              {g.items.map((t) => (
                <DepoimentoCard key={t.id} t={t} />
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {fields.cta && (
        <p className="rb-depoimentos__all">
          <a href={fields.cta.href}>{fields.cta.label}</a>
        </p>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
    </Section>
  );
}

/** Fechamento (cta) com ícone nos botões, como o da v1: balão no principal, maleta no secundário. */
export function CtaBlock({ id, variant, fields, headingLevel }: BlockProps<any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.body} level={headingLevel} />
      <div className="rb-actions">
        {fields.primary && <CtaLink link={fields.primary} className="rb-button rb-button--primary" icon="message" />}
        {fields.secondary && <CtaLink link={fields.secondary} className="rb-button rb-button--secondary" icon="briefcase" />}
      </div>
    </Section>
  );
}

/**
 * Galeria do dia a dia como o mosaico da v1: 3 colunas no desktop e 2 no celular, linhas de
 * 200 px, cada foto com o tamanho do item (`span`: 1x2, 2x1, 2x2). Só a imagem; a legenda
 * aparece por cima no hover, no foco e no toque (sem JavaScript: a foto recebe foco).
 */
export function GaleriaBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, RoutineItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-mosaic">
          {items.map((item) => (
            <li key={item.id} className="rb-mosaic__item" data-span={item.span && item.span !== "1x1" ? item.span : undefined}>
              <figure className="rb-mosaic__figure" tabIndex={0}>
                {item.image && <Img image={{ ...item.image, alt: item.image.alt || "" }} className="rb-mosaic__img" sizes="(min-width: 1024px) 30vw, 50vw" />}
                {item.tags.length > 0 && (
                  <ul className="rb-mosaic__tags">
                    {item.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                <figcaption className="rb-mosaic__caption">
                  <span className="rb-mosaic__title">{item.title}</span>
                  {item.description && <span className="rb-mosaic__text">{item.description}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Perguntas como as da v1: um cartão só, ícone "?" em cada pergunta e seta para baixo. */
export function FaqBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, FaqItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="rb-faq__list rb-faq__card">
          {items.map((q) => (
            <details key={q.id} className="rb-faq__item">
              <summary className="rb-faq__question">
                <Icon name="help" size={20} className="rb-faq__icon" />
                <span>{q.question}</span>
                <Icon name="chevronDown" size={16} className="rb-faq__chevron" />
              </summary>
              <Html html={q.answer} className="rb-faq__answer rb-prose" />
            </details>
          ))}
        </div>
      )}
    </Section>
  );
}

type Level = 2 | 3 | 4 | 5;

/** Título de seção do currículo com ícone (o ícone é decorativo). */
function ResumeGroup({ id, kind, icon, level, ctx, side, children }: { id: string; kind: string; icon: IconName; level: Level; ctx: BlockProps["ctx"]; side?: boolean; children: ReactNode }) {
  return (
    <section className={`rb-resume__group rb-resume__group--${kind}`} aria-labelledby={`${id}-${kind}`} data-side={side ? "" : undefined}>
      <ResumeHeading level={level} id={`${id}-${kind}`} className="rb-resume__heading">
        <Icon name={icon} size={24} />
        {ctx.t(`resume.${kind}`)}
      </ResumeHeading>
      {children}
    </section>
  );
}

/** Cartão de experiência ou formação: cargo, organização, período e a descrição rica. */
function ResumeCard({ item, level, ctx }: { item: ResumeItem; level: Level; ctx: BlockProps["ctx"] }) {
  return (
    <li className="rb-card rb-resume__item">
      <ResumeHeading level={level} className="rb-card__title">
        {item.title}
      </ResumeHeading>
      {(item.organization || item.location) && <p className="rb-card__meta rb-resume__org">{[item.organization, item.location].filter(Boolean).join(" · ")}</p>}
      <ResumePeriod item={item} ctx={ctx} className="rb-card__meta rb-resume__period" />
      <ResumeDescription text={item.description} />
    </li>
  );
}

/** Item simples (curso, voluntariado, idioma): uma caixa com o título e, se houver, o detalhe. */
function ResumeLine({ item, level, accent }: { item: ResumeItem; level: Level; accent?: boolean }) {
  return (
    <li className="rb-resume__line">
      {accent ? (
        <ResumeHeading level={level} className="rb-resume__lineTitle">
          {item.title}
        </ResumeHeading>
      ) : (
        <p className="rb-resume__lineTitle">{item.title}</p>
      )}
      {item.organization && <p className="rb-resume__lineMeta">{item.organization}</p>}
      {item.description && (accent ? <p className="rb-resume__lineMeta">{item.description}</p> : <ResumeDescription text={item.description} />)}
    </li>
  );
}

/**
 * Currículo como a página da v1: download no topo e duas colunas. À esquerda, a
 * experiência (as duas mais recentes abertas; as anteriores num <details>, sem JavaScript),
 * a formação, os cursos e o voluntariado; à direita, as competências por grupo, as
 * comportamentais e os idiomas.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, ResumeItem>) {
  const by = (kind: ResumeItem["kind"]) => items.filter((i) => i.kind === kind);
  const level = (fields.title ? headingLevel + 1 : headingLevel) as Level;
  const itemLevel = (level + 1) as Level;
  const experience = by("experience");
  const recent = experience.slice(0, 2);
  const older = experience.slice(2);
  const education = by("education");
  const certifications = by("certification");
  const volunteer = by("volunteer");
  const skills = by("skill");
  const softSkills = by("soft-skill");
  const languages = by("language");
  const hasSide = skills.length + softSkills.length + languages.length > 0;
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island rb-resume__download">{island}</div> : null}
      <div className="rb-resume__cols" data-side={hasSide ? "" : undefined}>
        <div className="rb-resume__main">
          {experience.length > 0 && (
            <ResumeGroup id={id} kind="experience" icon="briefcase" level={level} ctx={ctx}>
              <ul className="rb-resume__list">
                {recent.map((i) => (
                  <ResumeCard key={i.id} item={i} level={itemLevel} ctx={ctx} />
                ))}
              </ul>
              {older.length > 0 && (
                <details className="rb-resume__older">
                  <summary>
                    <Icon name="chevronDown" />
                    <span className="rb-resume__show">{ctx.t("resume.showOlder", { count: String(older.length) })}</span>
                    <span className="rb-resume__hide">{ctx.t("resume.hideOlder")}</span>
                  </summary>
                  <ul className="rb-resume__list">
                    {older.map((i) => (
                      <ResumeCard key={i.id} item={i} level={itemLevel} ctx={ctx} />
                    ))}
                  </ul>
                </details>
              )}
            </ResumeGroup>
          )}
          {education.length > 0 && (
            <ResumeGroup id={id} kind="education" icon="graduation" level={level} ctx={ctx}>
              <ul className="rb-resume__list">
                {education.map((i) => (
                  <ResumeCard key={i.id} item={i} level={itemLevel} ctx={ctx} />
                ))}
              </ul>
            </ResumeGroup>
          )}
          {certifications.length > 0 && (
            <ResumeGroup id={id} kind="certification" icon="award" level={level} ctx={ctx}>
              <ul className="rb-resume__lines">
                {certifications.map((i) => (
                  <ResumeLine key={i.id} item={i} level={itemLevel} />
                ))}
              </ul>
            </ResumeGroup>
          )}
          {volunteer.length > 0 && (
            <ResumeGroup id={id} kind="volunteer" icon="heart" level={level} ctx={ctx}>
              <ul className="rb-resume__lines">
                {volunteer.map((i) => (
                  <ResumeLine key={i.id} item={i} level={itemLevel} />
                ))}
              </ul>
            </ResumeGroup>
          )}
        </div>
        {hasSide && (
          <div className="rb-resume__side">
            {skills.length > 0 && (
              <ResumeGroup id={id} kind="skill" icon="code" level={level} ctx={ctx}>
                <div className="rb-resume__skillGroups">
                  {groupResumeSkills(skills).map((g) => (
                    <div key={g.name ?? ""} className="rb-resume__skillGroup">
                      {g.name && (
                        <ResumeHeading level={itemLevel} className="rb-resume__groupName">
                          {g.name}
                        </ResumeHeading>
                      )}
                      <ul className="rb-resume__chips">
                        {g.items.map((i) => (
                          <li key={i.id}>{i.title}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ResumeGroup>
            )}
            {softSkills.length > 0 && (
              <ResumeGroup id={id} kind="soft-skill" icon="heart" level={level} ctx={ctx}>
                <ul className="rb-resume__chips rb-resume__chips--outline">
                  {softSkills.map((i) => (
                    <li key={i.id}>{i.title}</li>
                  ))}
                </ul>
              </ResumeGroup>
            )}
            {languages.length > 0 && (
              <ResumeGroup id={id} kind="language" icon="languages" level={level} ctx={ctx}>
                <ul className="rb-resume__lines">
                  {languages.map((i) => (
                    <ResumeLine key={i.id} item={i} level={itemLevel} accent />
                  ))}
                </ul>
              </ResumeGroup>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/** Etiquetas que o cartão do portfólio mostra; o resto vira "+N", como na v1. */
export const CASE_TAGS_SHOWN = 3;

/** Projeto com página de case (seções), como o `hasCaseStudy` da v1. */
const hasCase = (p: ProjectItem) => p.sections.length > 0;

function CaseMetric({ metric }: { metric: ProjectItem["metric"] }) {
  return metric ? (
    <p className="rb-card__metric">
      <strong>{metric.value}</strong> <span>{metric.label}</span>
    </p>
  ) : null;
}

/** Cartão da home (grade/lista): o cartão inteiro é o link, com o número e "$ cat case.md". */
function HomeCaseCard({ p, ctx }: { p: ProjectItem; ctx: BlockProps["ctx"] }) {
  return (
    <li className="rb-card rb-card--link">
      {p.cover && <Img image={p.cover} className="rb-card__image" sizes="(min-width: 960px) 30vw, 100vw" />}
      <div className="rb-card__body">
        <Heading level={3} className="rb-card__title">
          <a href={p.url} className="rb-card__link">
            {p.title}
          </a>
        </Heading>
        {p.summary && <p className="rb-card__text">{p.summary}</p>}
        <CaseMetric metric={p.metric} />
        <span className="rb-card__more" aria-hidden="true">
          {ctx.t("case.view")}
        </span>
      </div>
    </li>
  );
}

/**
 * Cartão da página do portfólio: capa, título, resumo, até 3 etiquetas e "+N", o número e um
 * botão de largura total, "$ cat case.md" para quem tem case e "$ view --details" para quem não
 * tem (os dois levam à página do projeto).
 */
function ListCaseCard({ p, ctx, category }: { p: ProjectItem; ctx: BlockProps["ctx"]; category?: number }) {
  const extra = p.tags.length - CASE_TAGS_SHOWN;
  const withCase = hasCase(p);
  return (
    <li className="rb-card rb-case-card" data-tags={category === undefined ? undefined : `t${category}`}>
      {p.cover ? <Img image={{ ...p.cover, alt: "" }} className="rb-card__image" sizes="(min-width: 768px) 40vw, 100vw" /> : <span className="rb-case-card__noimage" aria-hidden="true" />}
      <div className="rb-card__body">
        <Heading level={3} className="rb-card__title">
          {p.title}
        </Heading>
        {p.summary && <p className="rb-card__text">{p.summary}</p>}
        {p.tags.length > 0 && (
          <ul className="rb-tags rb-case-card__tags">
            {p.tags.slice(0, CASE_TAGS_SHOWN).map((t) => (
              <li key={t}>{t}</li>
            ))}
            {extra > 0 && <li>+{extra}</li>}
          </ul>
        )}
        <CaseMetric metric={p.metric} />
        <a href={p.url} className={`rb-case-card__action${withCase ? " rb-case-card__action--case" : ""}`}>
          {ctx.t(withCase ? "case.view" : "case.details")}
          <span className="rb-sr-only">: {p.title}</span>
        </a>
      </div>
    </li>
  );
}

/**
 * Cases como na v1. Na home (grade ou lista): o "ver todos" é um link pequeno ao lado do título,
 * e o cartão mostra o número e "$ cat case.md". Na variação `pagina` (a página do portfólio):
 * filtro por categoria sem JavaScript (botões de opção e CSS, como o filtro do blog) e os
 * cartões com etiquetas e botão.
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, ProjectItem>) {
  const page = variant === "pagina";
  const categories = page ? [...new Set(items.map((p) => p.category).filter((c): c is string => !!c))] : [];
  const scope = `c-${safeId(id)}`;
  const filter = categories.length > 0;
  const cta: ResolvedLink | undefined = fields.cta;
  const head = fields.title || fields.intro || cta;
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      {head && (
        <div className="rb-cases__head">
          <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
          {cta && (
            <a className="rb-cases__all" href={cta.href} {...(cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {cta.label}
            </a>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      ) : page ? (
        <div className="rb-cases__page">
          {filter && (
            <>
              <style dangerouslySetInnerHTML={{ __html: tagFilterCss(scope, categories.length, { items: ".rb-cases__list > .rb-case-card" }) }} />
              <input type="radio" name={scope} id={`${scope}-all`} className="rb-sr-only" defaultChecked />
              {categories.map((c, i) => (
                <input key={c} type="radio" name={scope} id={`${scope}-t${i}`} className="rb-sr-only" />
              ))}
              <div className="rb-filter" role="group" aria-label={ctx.t("cases.filter")}>
                <label htmlFor={`${scope}-all`}>{ctx.t("cases.all")}</label>
                {categories.map((c, i) => (
                  <label key={c} htmlFor={`${scope}-t${i}`}>
                    {c}
                  </label>
                ))}
              </div>
            </>
          )}
          <ul className="rb-grid rb-cases__list">
            {items.map((p) => (
              <ListCaseCard key={p.id} p={p} ctx={ctx} category={p.category ? categories.indexOf(p.category) : undefined} />
            ))}
          </ul>
        </div>
      ) : (
        <ul className="rb-grid rb-cases__list">
          {items.map((p) => (
            <HomeCaseCard key={p.id} p={p} ctx={ctx} />
          ))}
        </ul>
      )}
    </Section>
  );
}
