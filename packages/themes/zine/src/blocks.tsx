/**
 * Blocos do Zine, parte 1: capa, texto, números, listas, serviços, FAQ, logos, contato e
 * localização. Os de coleção (cases, posts, depoimentos, galeria, equipe, preços) ficam em
 * `collections.tsx` e o currículo em `resume.tsx`. Os textos de interface vêm de
 * `ctx.t("zine.*")` (declarados em `texts`) ou do núcleo.
 */
import type { ReactNode } from "react";
import type { BlockProps, CollectionItems, ResolvedImage } from "@rubrica/core";
import { Heading, Html, Img } from "@rubrica/core/components";
import { HandLink, Letter, PostIt, STICKER_TONES, POSTIT_TONES, Polaroid, Scissors, CheckBoxes, Sticker, TicketLink, ZHead, ZSection, stickerValueSize, tilt, tiltAt } from "./parts";
import { digits, firstName, formatDays, resolveFreeHref } from "./util";

export type Props<F = any, I = any> = BlockProps<F, I>;
type ServiceItem = CollectionItems["services"];
type FaqItem = CollectionItems["faq"];

// ---- capa -----------------------------------------------------------------------------------

/**
 * Capa: sobretítulo numa etiqueta preta, o título à mão, a chamada numa tira de papel,
 * botões em ingresso e a foto numa polaroide com manchas de cor e o adesivo de
 * disponibilidade. Sem foto, no pessoal fica a polaroide vazia (padrão de pontos).
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const { site } = ctx;
  const personal = site.kind === "pessoal";
  const photo: ResolvedImage | undefined = fields.image ?? site.person?.photo;
  const showPolaroid = !!photo || personal;
  const caption = personal ? site.person?.name : undefined;
  const available = fields.showAvailability ? (
    <Sticker tone="tape" deg={12} className={showPolaroid ? "zn-avail" : "zn-avail zn-avail--inline"}>
      <span>{ctx.t("hero.available")}</span>
    </Sticker>
  ) : null;
  return (
    <ZSection type="hero" id={id} variant={variant} className="zn-sec--hero">
      <div className={`zn-hero${showPolaroid ? "" : " zn-hero--solo"}`}>
        <div className="zn-hero-text">
          {fields.eyebrow && (
            <p className="zn-tilt" style={tilt(-1, { margin: 0 })}>
              <span className="zn-role">{fields.eyebrow}</span>
            </p>
          )}
          {fields.title && (
            <div className="zn-hello-wrap zn-tilt" style={tilt(-2)}>
              <Heading level={headingLevel} className="zn-hello">
                {fields.title}
              </Heading>
            </div>
          )}
          {fields.subtitle && (
            <p className="zn-paperstrip zn-tilt" style={tilt(-1.4)}>
              {fields.subtitle}
            </p>
          )}
          {!!fields.tags?.length && (
            <ul className="zn-chips">
              {fields.tags.map((t: { label: string }, i: number) => (
                <li key={`${i}-${t.label}`} className="zn-chip zn-tilt" style={tilt(tiltAt(i, 0.8))}>
                  {t.label}
                </li>
              ))}
            </ul>
          )}
          {(fields.primaryCta || fields.secondaryCta) && (
            <div className="zn-actions">
              {fields.primaryCta && <TicketLink link={fields.primaryCta} ctx={ctx} stub={ctx.t("zine.no", { n: "01" })} deg={-2} />}
              {fields.secondaryCta && <TicketLink link={fields.secondaryCta} ctx={ctx} tone="paper" stub={ctx.t("zine.no", { n: "02" })} deg={1.5} />}
            </div>
          )}
          {!showPolaroid && available}
        </div>
        {showPolaroid && (
          <div className="zn-me">
            <span className="zn-blob a" aria-hidden="true" />
            <span className="zn-blob b" aria-hidden="true" />
            <Polaroid as="figure" image={photo} deg={4} tape="left" halftone sizes="(min-width: 900px) 330px, 300px" ratio="4 / 4.4">
              {caption && <figcaption className="zn-pol-title zn-pol-title--small">{caption}</figcaption>}
            </Polaroid>
            {available}
          </div>
        )}
      </div>
    </ZSection>
  );
}

// ---- texto ----------------------------------------------------------------------------------

/**
 * Texto. Variações: `carta` (padrão: carta datilografada em papel pautado; no pessoal leva
 * a saudação e a assinatura) e `postit` (bilhete amarelo, para a parte pessoal do Sobre).
 */
export function TextoBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const image = fields.image && (
    <div className="zn-texto-img">
      <Polaroid as="figure" image={fields.image} deg={3} tape="right" sizes="(min-width: 900px) 30vw, 100vw" />
    </div>
  );
  const first = firstName(ctx.site.person?.name);
  const personal = ctx.site.kind === "pessoal";
  const body =
    variant === "postit" ? (
      <PostIt tone="tape" deg={-1.5} className="zn-personal">
        {fields.body && <Html html={fields.body} className="zn-rich" />}
      </PostIt>
    ) : (
      <Letter>
        {personal && <p>{ctx.t("zine.dear")}</p>}
        {fields.body && <Html html={fields.body} className="zn-letter-body" />}
        {personal && first && <p className="zn-sign">— {first}</p>}
      </Letter>
    );
  return (
    <ZSection type="texto" id={id} anchor={fields.anchor} variant={variant}>
      {fields.title && <ZHead title={fields.title} level={headingLevel} />}
      <div className={`zn-texto${image ? " zn-texto--media" : ""}`}>
        {fields.imagePosition === "start" && image}
        <div className="zn-texto-body">{body}</div>
        {fields.imagePosition !== "start" && image}
      </div>
    </ZSection>
  );
}

/** Fechamento: cupom de recortar com a chamada e os caminhos como caixas de marcar. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const links = [fields.primary, fields.secondary].filter(Boolean) as { label: string; href: string; external: boolean }[];
  return (
    <ZSection type="cta" id={id} anchor={fields.anchor} variant={variant}>
      <div className="zn-coupon zn-tilt" style={tilt(-0.8)}>
        <span className="zn-scissors">
          <Scissors />
        </span>
        {fields.title && (
          <Heading level={headingLevel} className="zn-coupon-title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <p>{fields.body}</p>}
        {links.length > 0 && (
          <div className="zn-checks">
            {links.map((link, i) => (
              <a key={link.href + i} href={link.href} className="zn-check" data-tone={i === 0 ? "primary" : undefined} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <CheckBoxes />
                {link.label}
                {link.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    </ZSection>
  );
}

// ---- números e listas ----------------------------------------------------------------------

/** Números de destaque como adesivos redondos, o valor acima do rótulo. */
export function NumerosBlock({ id, variant, fields, headingLevel }: Props) {
  const items: { value: string; label: string; description?: string }[] = fields.items ?? [];
  if (!items.length && !fields.title) return null;
  return (
    <ZSection type="numeros" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <dl className="zn-stickers">
          {items.map((m, i) => (
            <Sticker key={`${i}-${m.label}`} tone={STICKER_TONES[i % STICKER_TONES.length]} deg={tiltAt(i, 3)}>
              <dt className="zn-sticker-l">{m.label}</dt>
              <dd className="zn-sticker-v" style={{ fontSize: stickerValueSize(m.value) }}>
                {m.value}
              </dd>
              {m.description && <dd className="zn-sticker-d">{m.description}</dd>}
            </Sticker>
          ))}
        </dl>
      )}
    </ZSection>
  );
}

/**
 * Itens com título e texto. Numerada (princípios de trabalho): adesivos com o número;
 * sem número (valores): post-its coloridos.
 */
export function ListaItensBlock({ id, variant, fields, headingLevel }: Props) {
  const items: { title: string; body?: string }[] = fields.items ?? [];
  return (
    <ZSection type="lista-itens" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 &&
        (fields.numbered ? (
          <ol className="zn-principles">
            {items.map((item, i) => (
              <li key={`${i}-${item.title}`} className="zn-principle">
                <Sticker as="span" tone={STICKER_TONES[i % STICKER_TONES.length]} deg={tiltAt(i, 4)}>
                  <b aria-hidden="true">{String(i + 1).padStart(2, "0")}</b>
                </Sticker>
                <div className="zn-principle-body">
                  <Heading level={3}>{item.title}</Heading>
                  {item.body && <p>{item.body}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="zn-postits">
            {items.map((item, i) => (
              <PostIt key={`${i}-${item.title}`} as="li" tone={POSTIT_TONES[i % POSTIT_TONES.length]} deg={tiltAt(i, 1.3)}>
                <Heading level={3}>{item.title}</Heading>
                {item.body && <p>{item.body}</p>}
              </PostIt>
            ))}
          </ul>
        ))}
    </ZSection>
  );
}

/** Serviços como post-its de cores que se alternam. */
export function ServicosBlock({ id, variant, fields, items, headingLevel, ctx }: Props<any, ServiceItem>) {
  return (
    <ZSection type="servicos" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-postits">
          {items.map((s, i) => (
            <PostIt key={s.id} as="li" tone={POSTIT_TONES[i % POSTIT_TONES.length]} deg={tiltAt(i, 1.3)}>
              <Heading level={3}>{s.title}</Heading>
              {s.description && <p>{s.description}</p>}
              {s.priceLabel && <p className="zn-postit-price">{s.priceLabel}</p>}
            </PostIt>
          ))}
        </ul>
      )}
      {fields.cta && (
        <div className="zn-handlinks">
          <HandLink link={fields.cta} ctx={ctx} />
        </div>
      )}
    </ZSection>
  );
}

/** Perguntas e respostas como bilhetes dobrados (`details`, sem JavaScript). */
export function FaqBlock({ id, variant, fields, items, headingLevel }: Props<any, FaqItem>) {
  return (
    <ZSection type="faq" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="zn-folds">
          {items.map((q, i) => (
            <li key={q.id} className="zn-tilt" style={tilt(tiltAt(i, 0.5))}>
              <details className="zn-fold">
                <summary>{q.question}</summary>
                <Html html={q.answer} className="zn-fold-answer zn-rich" />
              </details>
            </li>
          ))}
        </ul>
      )}
    </ZSection>
  );
}

/** Logos de clientes, cada um num pedaço de papel colado. */
export function LogosClientesBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const logos: { name?: string; href?: string; image?: ResolvedImage }[] = fields.logos ?? [];
  return (
    <ZSection type="logos-clientes" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} level={headingLevel} />
      {logos.length > 0 && (
        <ul className="zn-logos">
          {logos.map((logo, i) => {
            const link = resolveFreeHref(logo.href, ctx);
            const img = logo.image && <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} sizes="160px" />;
            return (
              <li key={`${i}-${logo.name}`} className="zn-logo zn-tilt" style={tilt(tiltAt(i, 0.9))}>
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
      )}
    </ZSection>
  );
}

// ---- contato e localização -----------------------------------------------------------------

/** Contato: o formulário (ilha) num papel colado e os canais como bilhetes. */
export function ContatoBlock({ id, variant, fields, headingLevel, ctx, island }: Props) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone;
  const whatsapp = org?.whatsapp ?? ctx.site.person?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const channels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  const ext = <span className="rb-sr-only"> {ctx.t("common.external")}</span>;
  const rows: { key: string; label: string; node: ReactNode }[] = [];
  if (email) rows.push({ key: "email", label: ctx.t("contact.email"), node: <a href={`mailto:${email}`}>{email}</a> });
  if (phone) rows.push({ key: "phone", label: ctx.t("contact.phone"), node: <a href={`tel:+${digits(phone)}`}>{phone}</a> });
  if (whatsapp)
    rows.push({
      key: "whatsapp",
      label: ctx.t("contact.whatsapp"),
      node: (
        <a href={`https://wa.me/${digits(whatsapp)}`} target="_blank" rel="noopener noreferrer">
          {whatsapp}
          {ext}
        </a>
      ),
    });
  for (const s of social)
    rows.push({
      key: s.url,
      label: ctx.t("contact.social"),
      node: (
        <a href={s.url} target="_blank" rel="me noopener noreferrer">
          {s.network}
          {ext}
        </a>
      ),
    });
  return (
    <ZSection type="contato" id={id} anchor={fields.anchor} variant={variant} className={mode === "channels" ? "rb-contato--channels" : undefined}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="zn-contato">
        {mode !== "channels" && island ? <div className="rb-island zn-contato-form">{island}</div> : null}
        {channels && (
          <ul className="zn-chan" aria-label={ctx.t("contact.channels")}>
            {rows.map((r, i) => (
              <PostIt key={r.key} as="li" tone={POSTIT_TONES[i % POSTIT_TONES.length]} deg={tiltAt(i, 1)} className="zn-chan-item">
                <span className="zn-chan-label">{r.label}</span>
                {r.node}
              </PostIt>
            ))}
          </ul>
        )}
      </div>
    </ZSection>
  );
}

/** Localização: endereço e horários como duas fichas presas com fita. */
export function LocalizacaoBlock({ id, variant, fields, headingLevel, ctx }: Props) {
  const org = ctx.site.organization;
  const a = org?.address;
  const addressLines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours: { days: string; opens: string; closes: string }[] = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  return (
    <ZSection type="localizacao" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="zn-notes">
        {addressLines.length > 0 && (
          <div className="zn-note zn-tilt" style={tilt(-1)}>
            <span className="zn-tape" data-pos="center" aria-hidden="true" />
            <Heading level={3}>{ctx.t("location.address")}</Heading>
            <address className="zn-address">
              {addressLines.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </address>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="zn-handlink">
                {ctx.t("location.map")} <span aria-hidden="true">↗</span>
                <span className="rb-sr-only"> {ctx.t("common.external")}</span>
              </a>
            )}
          </div>
        )}
        {hours.length > 0 && (
          <div className="zn-note zn-tilt" style={tilt(1.2)}>
            <span className="zn-tape" data-pos="right" aria-hidden="true" />
            <Heading level={3}>{ctx.t("location.hours")}</Heading>
            <ul className="zn-hours">
              {hours.map((h) => (
                <li key={`${h.days}-${h.opens}`}>
                  <span>{formatDays(h.days, ctx.locale)}</span>
                  <span>
                    {h.opens} – {h.closes}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ZSection>
  );
}
