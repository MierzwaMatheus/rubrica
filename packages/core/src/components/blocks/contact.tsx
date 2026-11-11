/** Contato e localização: canais e dados da empresa; o formulário é ilha. */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { contato as contatoDef, localizacao as localizacaoDef } from "../../blocks/catalog";
import { Section, SectionHeader } from "../primitives";
import { digits, formatDays } from "./util";

type ContatoFields = ResolvedFields<typeof contatoDef.fields>;
type LocalizacaoFields = ResolvedFields<typeof localizacaoDef.fields>;

export function ContatoBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<ContatoFields>) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone;
  const whatsapp = org?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const channels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  // Na janela, o bloco só leva a âncora e a ilha (título, apoio e assistente vão dentro dela).
  if (fields.presentation === "dialog" && mode !== "channels" && island) {
    return (
      <Section id={id} anchor={fields.anchor} type="contato" variant={variant} className="rb-contato--dialog">
        <div className="rb-island rb-contato__form">{island}</div>
      </Section>
    );
  }
  return (
    <Section id={id} anchor={fields.anchor} type="contato" variant={variant} className={mode === "channels" ? "rb-contato--channels" : undefined}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-contato__layout">
        {mode !== "channels" && island ? <div className="rb-island rb-contato__form">{island}</div> : null}
        {channels && (
          <ul className="rb-contato__channels" aria-label={ctx.t("contact.channels")}>
            {email && (
              <li>
                <span className="rb-contato__label">{ctx.t("contact.email")}</span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {phone && (
              <li>
                <span className="rb-contato__label">{ctx.t("contact.phone")}</span>
                <a href={`tel:+${digits(phone)}`}>{phone}</a>
              </li>
            )}
            {whatsapp && (
              <li>
                <span className="rb-contato__label">{ctx.t("contact.whatsapp")}</span>
                <a href={`https://wa.me/${digits(whatsapp)}`} target="_blank" rel="noopener noreferrer">
                  {whatsapp}
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              </li>
            )}
            {social.map((s) => (
              <li key={s.url}>
                <span className="rb-contato__label">{ctx.t("contact.social")}</span>
                <a href={s.url} target="_blank" rel="me noopener noreferrer">
                  {s.network}
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

export function LocalizacaoBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<LocalizacaoFields>) {
  const org = ctx.site.organization;
  const a = org?.address;
  const addressLines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  return (
    <Section id={id} anchor={fields.anchor} type="localizacao" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-localizacao__layout">
        {addressLines.length > 0 && (
          <div className="rb-card">
            <h3 className="rb-card__title">{ctx.t("location.address")}</h3>
            <address className="rb-localizacao__address">
              {addressLines.map((l) => (
                <span key={l}>
                  {l}
                  <br />
                </span>
              ))}
            </address>
            {mapUrl && (
              <p>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  {ctx.t("location.map")}
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              </p>
            )}
          </div>
        )}
        {hours.length > 0 && (
          <div className="rb-card">
            <h3 className="rb-card__title">{ctx.t("location.hours")}</h3>
            <dl className="rb-localizacao__hours">
              {hours.map((h) => (
                <div key={`${h.days}-${h.opens}`}>
                  <dt>{formatDays(h.days, ctx.locale)}</dt>
                  <dd>
                    {h.opens} – {h.closes}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Section>
  );
}
