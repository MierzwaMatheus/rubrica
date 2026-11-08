/**
 * Versões padrão dos blocos. Todo tema herda estas até desenhar a sua (RFC: "O
 * núcleo entrega uma versão padrão de cada bloco").
 */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { cta as ctaDef, hero as heroDef, texto as textoDef } from "../../blocks/catalog";
import { Heading, Html, Img, LinkButton, Section, SectionHeader } from "../primitives";

type HeroFields = ResolvedFields<typeof heroDef.fields>;
type TextoFields = ResolvedFields<typeof textoDef.fields>;
type CtaFields = ResolvedFields<typeof ctaDef.fields>;

export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<HeroFields>) {
  return (
    <Section id={id} type="hero" variant={variant}>
      <div className="rb-hero__body">
        {fields.showAvailability && (
          <p className="rb-hero__availability">
            <span className="rb-hero__dot" aria-hidden="true" />
            {ctx.t("hero.available")}
          </p>
        )}
        {fields.eyebrow && <p className="rb-hero__eyebrow">{fields.eyebrow}</p>}
        {fields.title && (
          <Heading level={headingLevel} className="rb-hero__title">
            {fields.title}
          </Heading>
        )}
        {fields.subtitle && <p className="rb-hero__subtitle">{fields.subtitle}</p>}
        {!!fields.tags?.length && (
          <ul className="rb-hero__tags">
            {fields.tags.map((t, i) => (
              <li key={`${i}-${t.label}`}>{t.label}</li>
            ))}
          </ul>
        )}
        {(fields.primaryCta || fields.secondaryCta) && (
          <div className="rb-actions">
            {fields.primaryCta && <LinkButton link={fields.primaryCta} />}
            {fields.secondaryCta && <LinkButton link={fields.secondaryCta} variant="secondary" />}
          </div>
        )}
      </div>
      {fields.image && <Img image={fields.image} className="rb-hero__image" priority sizes="(min-width: 960px) 40vw, 100vw" />}
    </Section>
  );
}

export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<TextoFields>) {
  const image = fields.image && <Img image={fields.image} className="rb-texto__image" sizes="(min-width: 960px) 40vw, 100vw" />;
  return (
    <Section id={id} anchor={fields.anchor} type="texto" variant={variant} className={image ? "rb-texto--media" : undefined}>
      {fields.imagePosition === "start" && image}
      <div className="rb-texto__body">
        {fields.title && (
          <Heading level={headingLevel} className="rb-section__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <Html html={fields.body} className="rb-prose" />}
      </div>
      {fields.imagePosition !== "start" && image}
    </Section>
  );
}

export function CtaBlock({ id, variant, fields, headingLevel }: BlockProps<CtaFields>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.body} level={headingLevel} />
      <div className="rb-actions">
        {fields.primary && <LinkButton link={fields.primary} />}
        {fields.secondary && <LinkButton link={fields.secondary} variant="secondary" />}
      </div>
    </Section>
  );
}

/**
 * Versão genérica para blocos que ainda não têm componente padrão: título, apoio e
 * uma lista simples dos itens. Mantém a página válida enquanto o catálogo cresce.
 */
export function GenericBlock({ id, variant, fields, items, headingLevel, island }: BlockProps<Record<string, unknown>, Record<string, unknown>> & { type?: string }) {
  const title = typeof fields.title === "string" ? fields.title : undefined;
  const intro = typeof fields.intro === "string" ? fields.intro : undefined;
  const label = (item: Record<string, unknown>) =>
    String(item.title ?? item.name ?? item.question ?? item.quote ?? item.label ?? item.value ?? "");
  const listFields = Object.values(fields).filter((v): v is Record<string, unknown>[] => Array.isArray(v));
  const rows = items.length ? items : listFields.flat();
  return (
    <Section id={id} anchor={typeof fields.anchor === "string" ? fields.anchor : undefined} type="generic" variant={variant}>
      <SectionHeader title={title} intro={intro} level={headingLevel} />
      {rows.length > 0 && (
        <ul className="rb-generic__list">
          {rows.map((item, i) => (
            <li key={String(item.id ?? i)}>{"url" in item && typeof item.url === "string" ? <a href={item.url}>{label(item)}</a> : label(item)}</li>
          ))}
        </ul>
      )}
      {island}
    </Section>
  );
}
