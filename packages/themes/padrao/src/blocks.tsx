/**
 * Blocos que, na v1 padrão, têm visual diferente do padrão do núcleo. Os outros
 * blocos herdam os componentes do núcleo e ganham o visual só pelo CSS do tema.
 */
import type { BlockProps, ResolvedLink, ResumeItem } from "@rubrica/core";
import {
  groupResumeSkills,
  Heading,
  Img,
  LinkButton,
  ResumeDescription,
  ResumeHeading,
  ResumePeriod,
  Section,
  SectionHeader,
} from "@rubrica/core/components";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { isBlogIndex, RssLink } from "./blog";

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
        {/* No blog, o botão do RSS fica no canto do título, como na v1. */}
        {isBlogIndex(ctx) && <RssLink ctx={ctx} />}
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

/** Depoimentos: autor em cima (foto, nome, cargo na cor de destaque), citação em itálico. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-depoimentos__list">
          {items.map((t: any) => (
            <li key={t.id} className="rb-card rb-depoimento">
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
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
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
