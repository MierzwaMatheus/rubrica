/**
 * Blocos que, na v1 do Bento, têm visual diferente do padrão do núcleo: hero (cartão em
 * degradê + perfil + contato), cases (grade e hierarquia), serviços numerados,
 * depoimentos (um grande e os outros pequenos) e currículo em cartões. Os demais blocos
 * herdam os componentes do núcleo e ganham o visual de cartão pelo CSS.
 */
import type { BlockProps, ResolvedImage } from "@rubrica/core";
import { Heading, Img, LinkButton, Logo, Section, SectionHeader, digits } from "@rubrica/core/components";
import { Icon, type IconName } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");
const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

const SOCIAL_ICONS: Record<string, IconName> = { github: "github", linkedin: "linkedin" };

/** Link "ver todos" ao lado do título da seção (como o `ver todos →` mono da v1). */
function HeadWithLink({ title, intro, level, link }: { title?: string; intro?: string; level: 1 | 2; link?: { label: string; href: string; external?: boolean } }) {
  if (!title && !intro && !link) return null;
  return (
    <div className="bento-head">
      <SectionHeader title={title} intro={intro} level={level} />
      {link && (
        <a className="bento-head__link" href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link.label}
        </a>
      )}
    </div>
  );
}

/**
 * Hero: cartão em degradê (chip `$ sobretítulo → nome`, título, cargo, apoio e botões),
 * cartão de perfil (foto ou iniciais, nome e redes) e cartões de contato (e-mail e
 * telefone). Na linha de empresa o perfil mostra a logo ou a inicial do nome do site.
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<any>) {
  const { site } = ctx;
  const person = site.person;
  const org = site.organization;
  const name = person?.name ?? site.name;
  const email = person?.email ?? org?.email;
  const whatsapp = person?.whatsapp ?? org?.whatsapp;
  const phone = whatsapp ?? person?.phone ?? org?.phone;
  const showChip = Boolean(fields.eyebrow || person);
  const image = fields.image as ResolvedImage | undefined;
  const hasAside = Boolean(image || person || site.logo || site.social.length > 0 || org);
  const extra = [email, phone].filter(Boolean).length;

  return (
    <Section id={id} type="hero" variant={variant}>
      <div className="bento-hero" data-aside={hasAside ? "" : undefined} data-contacts={extra}>
        <div className="bento-hero__card">
          {fields.showAvailability && (
            <p className="rb-hero__availability">
              <span className="rb-hero__dot" aria-hidden="true" />
              {ctx.t("hero.available")}
            </p>
          )}
          {showChip && (
            <p className="bento-hero__chip">
              <span aria-hidden="true">$ </span>
              {fields.eyebrow}
              {fields.eyebrow && person && <span aria-hidden="true"> → </span>}
              {person && <strong>{person.name}</strong>}
            </p>
          )}
          {fields.title && (
            <Heading level={headingLevel} className="rb-hero__title">
              {fields.title}
            </Heading>
          )}
          {person?.jobTitle && <p className="bento-hero__role">{person.jobTitle}</p>}
          {fields.subtitle && <p className="rb-hero__subtitle">{fields.subtitle}</p>}
          {!!fields.tags?.length && (
            <ul className="rb-hero__tags">
              {fields.tags.map((t: { label: string }, i: number) => (
                <li key={`${i}-${t.label}`}>{t.label}</li>
              ))}
            </ul>
          )}
          {(fields.primaryCta || fields.secondaryCta) && (
            <div className="rb-actions bento-hero__actions">
              {fields.primaryCta && (
                <a className="bento-hero__btn bento-hero__btn--solid" href={fields.primaryCta.href} {...(fields.primaryCta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {fields.primaryCta.label}
                  <Icon name="arrow" size={15} />
                </a>
              )}
              {fields.secondaryCta && (
                <a className="bento-hero__btn bento-hero__btn--ghost" href={fields.secondaryCta.href} {...(fields.secondaryCta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icon name="message" size={15} />
                  {fields.secondaryCta.label}
                </a>
              )}
            </div>
          )}
        </div>

        {hasAside && (
          <div className="bento-card bento-profile">
            {image ? (
              <Img image={image} className="bento-profile__cover" priority sizes="(min-width: 960px) 30vw, 100vw" />
            ) : (
              <>
                <span className="bento-profile__avatar">
                  {person?.photo ? (
                    <Img image={{ ...person.photo, alt: "" }} className="bento-profile__photo" priority sizes="92px" />
                  ) : site.logo ? (
                    <Logo logo={site.logo} className="bento-profile__logo" />
                  ) : (
                    <span aria-hidden="true">{initialsOf(name)}</span>
                  )}
                </span>
                <p className="bento-profile__name">{name}</p>
              </>
            )}
            {site.social.length > 0 && (
              <ul className="bento-profile__social">
                {site.social.slice(0, 4).map((s) => {
                  const icon = SOCIAL_ICONS[s.network.toLowerCase()];
                  return (
                    <li key={s.url}>
                      <a href={s.url} rel="me noopener noreferrer" target="_blank" aria-label={s.network}>
                        {icon ? <Icon name={icon} size={15} /> : <span aria-hidden="true">{s.network.slice(0, 2)}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {email && (
          <a className="bento-card bento-contact bento-contact--accent" href={`mailto:${email}`}>
            <Icon name="mail" size={18} />
            <span className="bento-contact__label">{ctx.t("contact.email")}</span>
            <span className="bento-contact__value">{email}</span>
          </a>
        )}
        {phone && (
          <a
            className="bento-card bento-contact"
            href={whatsapp ? `https://wa.me/${digits(whatsapp)}` : `tel:+${digits(phone)}`}
            {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <Icon name="phone" size={18} />
            <span className="bento-contact__label">{whatsapp ? ctx.t("contact.whatsapp") : ctx.t("contact.phone")}</span>
            <span className="bento-contact__value">{phone}</span>
            {whatsapp && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
          </a>
        )}
      </div>
    </Section>
  );
}

/**
 * Cases. Variações: `grade` (3 colunas, como na home da v1) e `destaque` (como o
 * portfólio da v1: o 1º grande com selo, o 2º e o 3º médios, os outros compactos).
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<any, any>) {
  const featured = variant === "destaque";
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <HeadWithLink title={fields.title} intro={fields.intro} level={headingLevel} link={fields.cta} />
      {items.length > 0 ? (
        <ul className="rb-grid rb-cases__list bento-cases">
          {items.map((p: any, i: number) => (
            <li key={p.id} className="rb-card rb-card--link bento-case" data-lead={i === 0 ? "" : undefined} data-accent={featured && i === 0 ? "" : undefined}>
              <div className="bento-case__media">
                {p.cover ? <Img image={p.cover} className="rb-card__image" sizes="(min-width: 960px) 33vw, 100vw" /> : <span className="bento-case__initial" aria-hidden="true">{p.title.charAt(0)}</span>}
                {featured && i === 0 && (
                  <span className="bento-case__badge">
                    <Icon name="star" size={12} />
                    {ctx.t("bento.featured")}
                  </span>
                )}
              </div>
              <div className="rb-card__body">
                <Heading level={3} className="rb-card__title">
                  <a href={p.url} className="rb-card__link">
                    {p.title}
                  </a>
                </Heading>
                {p.summary && <p className="rb-card__text">{p.summary}</p>}
                {(p.client || p.year) && <p className="bento-case__meta">{[p.client, p.year].filter(Boolean).join(" · ")}</p>}
                <span className="rb-card__more" aria-hidden="true">
                  {ctx.t("case.view")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      )}
    </Section>
  );
}

/** Serviços: cartões numerados (`1` num quadro e `01 / 04`), o primeiro mais claro. */
export function ServicosBlock({ id, variant, fields, items, headingLevel }: BlockProps<any, any>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid bento-servicos">
          {items.map((s: { id: string; title: string; description?: string; priceLabel?: string }, i: number) => (
            <li key={s.id} className="rb-card bento-servico">
              <div className="bento-servico__top">
                <span className="bento-servico__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="bento-servico__count" aria-hidden="true">
                  {pad(i + 1)} / {pad(items.length)}
                </span>
              </div>
              <Heading level={3} className="rb-card__title">
                {s.title}
              </Heading>
              {s.description && <p className="rb-card__text">{s.description}</p>}
              {s.priceLabel && <p className="rb-card__meta bento-servico__price">{s.priceLabel}</p>}
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

function Person({ t, small }: { t: { author: string; role?: string; company?: string; avatar?: ResolvedImage }; small?: boolean }) {
  const sub = [t.role, t.company].filter(Boolean).join(", ");
  return (
    <figcaption className={`bento-dep__author${small ? " bento-dep__author--small" : ""}`}>
      {t.avatar ? <Img image={t.avatar} className="bento-dep__avatar" sizes="40px" /> : <span className="bento-dep__avatar bento-dep__avatar--initial" aria-hidden="true">{t.author.charAt(0)}</span>}
      <span>
        <strong>{t.author}</strong>
        {sub && <span className="bento-dep__role">{sub}</span>}
      </span>
    </figcaption>
  );
}

/** Depoimentos: o primeiro grande na cor primária e os outros em cartões menores ao lado. */
export function DepoimentosBlock({ id, variant, fields, items, headingLevel, island }: BlockProps<any, any>) {
  const [lead, ...rest] = items as any[];
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {lead && (
        <div className="bento-dep" data-solo={rest.length === 0 ? "" : undefined}>
          <figure className="rb-card bento-dep__lead">
            <Icon name="quote" size={28} className="bento-dep__mark" />
            <blockquote className="bento-dep__quote">
              <p>{lead.quote}</p>
            </blockquote>
            <Person t={lead} />
          </figure>
          {rest.length > 0 && (
            <ul className="rb-grid bento-dep__rest">
              {rest.map((t) => (
                <li key={t.id} className="rb-card">
                  <figure className="bento-dep__small">
                    <Person t={t} small />
                    <blockquote className="bento-dep__quote">
                      <p>{t.quote}</p>
                    </blockquote>
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

const KINDS = ["experience", "education", "skill", "certification", "language"] as const;
type Kind = (typeof KINDS)[number];

/** Resumo do currículo (v1): contagens em cartões, a primeira na cor primária. */
const SUMMARY: Kind[] = ["experience", "skill", "certification", "language"];

function Period({ item, ctx }: { item: any; ctx: BlockProps["ctx"] }) {
  if (!item.start && !item.end) return null;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return (
    <p className="rb-card__meta rb-resume__period">
      {item.start && <time dateTime={item.start}>{month(item.start)}</time>}
      {" – "}
      {item.end ? <time dateTime={item.end}>{month(item.end)}</time> : ctx.t("resume.present")}
    </p>
  );
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="rb-resume__bullets">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="rb-card__text">{lines.join(" ")}</p>;
}

/**
 * Currículo em cartões: faixa de resumo (contagens) com o botão de PDF, experiências em
 * até 3 colunas, competências em chips (cartão na primária) e o resto em cartões.
 */
export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<any, any>) {
  const byKind = (kind: Kind) => (items as any[]).filter((i) => i.kind === kind);
  const summary = SUMMARY.filter((k) => byKind(k).length > 0);
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {(summary.length > 0 || (fields.showDownload && island)) && (
        <div className="bento-resume__summary">
          {summary.map((k) => (
            <div key={k} className="rb-card bento-stat">
              <span className="bento-stat__value">{byKind(k).length}</span>
              <span className="bento-stat__label">{ctx.t(`resume.${k}`)}</span>
            </div>
          ))}
          {fields.showDownload && island ? <div className="rb-island rb-resume__download bento-resume__download">{island}</div> : null}
        </div>
      )}
      {KINDS.map((kind) => {
        const list = byKind(kind);
        if (!list.length) return null;
        return (
          <section key={kind} className={`rb-resume__group rb-resume__group--${kind}`} aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="rb-resume__heading">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            {kind === "skill" ? (
              <div className="rb-card bento-skills" data-accent="">
                <ul className="rb-tags rb-tags--large">
                  {list.map((i) => (
                    <li key={i.id}>{i.title}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className={`rb-grid rb-resume__list bento-resume__list bento-resume__list--${kind}`}>
                {list.map((i) => (
                  <li key={i.id} className="rb-card rb-resume__item">
                    <h4 className="rb-card__title">{i.title}</h4>
                    {(i.organization || i.location) && <p className="rb-card__meta">{[i.organization, i.location].filter(Boolean).join(" · ")}</p>}
                    <Period item={i} ctx={ctx} />
                    <Description text={i.description} />
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
