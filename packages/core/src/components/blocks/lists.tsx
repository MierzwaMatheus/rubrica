/**
 * Blocos de lista sem coleção própria de conteúdo rico: números, itens, serviços,
 * equipe, logos e galeria. Todos puros: só props.
 */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { galeria as galeriaDef, listaItens as listaDef, logosClientes as logosDef, numeros as numerosDef, servicos as servicosDef, equipe as equipeDef } from "../../blocks/catalog";
import type { RoutineItem, ServiceItem, TeamItem } from "../../render/collections";
import { Heading, Img, LinkButton, Section, SectionHeader } from "../primitives";
import { ExternalHint, resolveFreeHref } from "./util";

type NumerosFields = ResolvedFields<typeof numerosDef.fields>;
type ListaFields = ResolvedFields<typeof listaDef.fields>;
type ServicosFields = ResolvedFields<typeof servicosDef.fields>;
type EquipeFields = ResolvedFields<typeof equipeDef.fields>;
type LogosFields = ResolvedFields<typeof logosDef.fields>;
type GaleriaFields = ResolvedFields<typeof galeriaDef.fields>;

export function NumerosBlock({ id, variant, fields, headingLevel }: BlockProps<NumerosFields>) {
  const items = fields.items ?? [];
  return (
    <Section id={id} anchor={fields.anchor} type="numeros" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <dl className="rb-numeros__list">
          {items.map((item, i) => (
            <div key={`${i}-${item.label}`} className="rb-numeros__item">
              {/* termo → valor no DOM; o CSS mostra o valor em cima do rótulo */}
              <dt className="rb-numeros__label">{item.label}</dt>
              <dd className="rb-numeros__value">{item.value}</dd>
              {item.description && <dd className="rb-numeros__description">{item.description}</dd>}
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}

export function ListaItensBlock({ id, variant, fields, headingLevel }: BlockProps<ListaFields>) {
  const items = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <Section id={id} anchor={fields.anchor} type="lista-itens" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <List className="rb-grid rb-lista__list">
          {items.map((item, i) => (
            <li key={`${i}-${item.title}`} className="rb-card" data-icon={item.icon || undefined}>
              {fields.numbered && <span className="rb-lista__number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>}
              <Heading level={3} className="rb-card__title">{item.title}</Heading>
              {item.body && <p className="rb-card__text">{item.body}</p>}
            </li>
          ))}
        </List>
      )}
    </Section>
  );
}

export function ServicosBlock({ id, variant, fields, items, headingLevel }: BlockProps<ServicosFields, ServiceItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="servicos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid">
          {items.map((s) => (
            <li key={s.id} className="rb-card" data-icon={s.icon || undefined}>
              <Heading level={3} className="rb-card__title">{s.title}</Heading>
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

export function EquipeBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<EquipeFields, TeamItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="equipe" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-equipe__list">
          {items.map((m) => (
            <li key={m.id} className="rb-card rb-equipe__member">
              {m.photo && <Img image={m.photo} className="rb-equipe__photo" sizes="(min-width: 960px) 20vw, 50vw" />}
              <Heading level={3} className="rb-card__title">{m.name}</Heading>
              <p className="rb-card__meta">{m.role}</p>
              {m.bio && <p className="rb-card__text">{m.bio}</p>}
              {m.links.length > 0 && (
                <ul className="rb-inline-list">
                  {m.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {l.label}
                        <ExternalHint external={l.external} ctx={ctx} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function LogosClientesBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<LogosFields>) {
  const logos = fields.logos ?? [];
  return (
    <Section id={id} anchor={fields.anchor} type="logos-clientes" variant={variant}>
      <SectionHeader title={fields.title} level={headingLevel} />
      {logos.length > 0 && (
        <ul className="rb-logos__list">
          {logos.map((logo, i) => {
            const link = resolveFreeHref(logo.href, ctx);
            const img = logo.image && <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} className="rb-logos__image" sizes="160px" />;
            return (
              <li key={`${i}-${logo.name}`} className="rb-logos__item">
                {link ? (
                  <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {img}
                    <ExternalHint external={link.external} ctx={ctx} />
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

export function GaleriaBlock({ id, variant, fields, items, headingLevel }: BlockProps<GaleriaFields, RoutineItem>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="rb-grid rb-galeria__list">
          {items.map((item) => (
            <li key={item.id} className="rb-card rb-galeria__item">
              {item.image && <Img image={item.image} className="rb-card__image" sizes="(min-width: 960px) 30vw, 100vw" />}
              <Heading level={3} className="rb-card__title">{item.title}</Heading>
              {item.description && <p className="rb-card__text">{item.description}</p>}
              {item.tags.length > 0 && (
                <ul className="rb-tags">
                  {item.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
