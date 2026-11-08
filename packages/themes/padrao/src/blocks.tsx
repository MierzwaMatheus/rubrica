/**
 * Blocos que, na v1 padrão, têm visual diferente do padrão do núcleo. Os outros
 * blocos herdam os componentes do núcleo e ganham o visual só pelo CSS do tema.
 */
import type { BlockProps } from "@rubrica/core";
import { Heading, Img, LinkButton, Section, SectionHeader } from "@rubrica/core/components";
import { Icon, type IconName } from "./icons";

/**
 * Hero: chip de terminal (`$ <sobretítulo> → <nome>`), título, cargo, apoio com fio
 * lateral e botões com ícone. O nome e o cargo vêm do dono do site (`ctx.site.person`).
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
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
              <a className="rb-button rb-button--primary" href={fields.primaryCta.href} {...(fields.primaryCta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <Icon name="folder" />
                {fields.primaryCta.label}
              </a>
            )}
            {fields.secondaryCta && (
              <a className="rb-button rb-button--outline" href={fields.secondaryCta.href} {...(fields.secondaryCta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <Icon name="message" />
                {fields.secondaryCta.label}
              </a>
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
