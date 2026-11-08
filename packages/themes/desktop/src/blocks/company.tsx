/**
 * Contato e os blocos da linha de empresa (preços, equipe, localização, logos). A v1 do
 * desktop não tinha esses blocos; aqui eles seguem a mesma gramática: janela, lista do
 * Finder, painéis com borda dura e mini-janelas.
 */
import type { BlockProps, CollectionItems, RenderContext, ResolvedFields } from "@rubrica/core";
import type { contato as contatoDef, equipe as equipeDef, localizacao as localizacaoDef, logosClientes as logosDef, precos as precosDef } from "@rubrica/core/blocks";
import { Img } from "@rubrica/core/components";
import { ButtonRow, DeskButton, Square, Window, iconColor, items } from "../window";

type PlanItem = CollectionItems["plans"];
type TeamItem = CollectionItems["team"];

type ContatoFields = ResolvedFields<typeof contatoDef.fields>;
type PrecosFields = ResolvedFields<typeof precosDef.fields>;
type EquipeFields = ResolvedFields<typeof equipeDef.fields>;
type LocalizacaoFields = ResolvedFields<typeof localizacaoDef.fields>;
type LogosFields = ResolvedFields<typeof logosDef.fields>;

const digits = (v: string) => v.replace(/\D+/g, "");

function External({ ctx }: { ctx: RenderContext }) {
  return <span className="rb-sr-only"> {ctx.t("common.external")}</span>;
}

/** Contato: o formulário (ilha) e os canais numa lista do Finder ao lado. */
export function ContatoBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<ContatoFields>) {
  const org = ctx.site.organization;
  const email = org?.email ?? ctx.site.person?.email;
  const phone = org?.phone ?? ctx.site.person?.phone;
  const whatsapp = org?.whatsapp ?? ctx.site.person?.whatsapp;
  const social = ctx.site.social;
  const mode = fields.mode ?? "wizard";
  const form = mode !== "channels" && island ? <div className="rb-island dk-contato__form">{island}</div> : null;
  const channels = fields.showChannels !== false && (email || phone || whatsapp || social.length > 0);
  const rows: { label: string; href: string; text: string; external?: boolean }[] = [];
  if (email) rows.push({ label: ctx.t("contact.email"), href: `mailto:${email}`, text: email });
  if (phone) rows.push({ label: ctx.t("contact.phone"), href: `tel:+${digits(phone)}`, text: phone });
  if (whatsapp) rows.push({ label: ctx.t("contact.whatsapp"), href: `https://wa.me/${digits(whatsapp)}`, text: whatsapp, external: true });
  for (const s of social) rows.push({ label: s.network, href: s.url, text: s.url.replace(/^https?:\/\/(www\.)?/, ""), external: true });
  return (
    <Window id={id} anchor={fields.anchor} type="contato" variant={variant} title={fields.title} level={headingLevel} className={form ? "dk-win--form" : undefined}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      <div className={`dk-contato${form && channels ? " dk-contato--split" : ""}`}>
        {form}
        {channels && (
          <ul className="dk-list dk-contato__channels" aria-label={ctx.t("contact.channels")}>
            {rows.map((r, i) => (
              <li key={r.href} className="dk-li dk-li--channel">
                <span className="dk-li__name">
                  <Square color={i} />
                  {r.label}
                </span>
                <a href={r.href} className="dk-contato__link" {...(r.external ? { target: "_blank", rel: r.label === ctx.t("contact.whatsapp") ? "noopener noreferrer" : "me noopener noreferrer" } : {})}>
                  {r.text}
                  {r.external && <External ctx={ctx} />}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Window>
  );
}

/** Preços: cada plano é uma mini-janela; o destacado fica com a barra em foco e o selo. */
export function PrecosBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<PrecosFields, PlanItem>) {
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  return (
    <Window id={id} anchor={fields.anchor} type="precos" variant={variant} title={fields.title} level={headingLevel} status={fields.note ? <span>{fields.note}</span> : undefined}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length > 0 && (
        <ul className="dk-plans">
          {list.map((plan) => (
            <li key={plan.id} className={`dk-plan${plan.highlighted ? " dk-plan--on" : ""}`}>
              <div className="dk-title dk-title--mini">
                <span className="dk-x" aria-hidden="true" />
                <SubHeading className="dk-title__text">{plan.name}</SubHeading>
              </div>
              <div className="dk-plan__body">
                {plan.highlighted && <p className="dk-badge dk-badge--inline">★ {ctx.t("pricing.highlighted")}</p>}
                {plan.price && <p className="dk-plan__price">{plan.price}</p>}
                {plan.description && <p className="dk-muted dk-plan__desc">{plan.description}</p>}
                {plan.features.length > 0 && (
                  <ul className="dk-checks" aria-label={ctx.t("plans.included")}>
                    {plan.features.map((f, i) => (
                      <li key={`${i}-${f}`}>
                        <span className="dk-check" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {plan.cta && (
                  <ButtonRow>
                    <DeskButton link={plan.cta} ctx={ctx} primary={plan.highlighted} />
                  </ButtonRow>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Window>
  );
}

/** Equipe como agenda de contatos: retrato na moldura, nome, cargo, bio e redes. */
export function EquipeBlock({ id, variant, fields, items: list, headingLevel, ctx }: BlockProps<EquipeFields, TeamItem>) {
  const sub = headingLevel === 1 ? 2 : 3;
  const SubHeading = `h${sub}` as "h2" | "h3";
  return (
    <Window id={id} anchor={fields.anchor} type="equipe" variant={variant} title={fields.title} level={headingLevel} prefix={ctx.t("desktop.people")} bar={ctx.t("desktop.people")} status={<span>{items(ctx, list.length)}</span>}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length > 0 && (
        <ul className="dk-people">
          {list.map((m, i) => (
            <li key={m.id} className="dk-person">
              <span className="dk-thumb dk-thumb--square" style={iconColor(i)}>
                {m.photo ? <Img image={m.photo} sizes="(min-width: 1024px) 200px, 50vw" /> : <span aria-hidden="true">{m.name.charAt(0)}</span>}
              </span>
              <SubHeading className="dk-person__name">{m.name}</SubHeading>
              <p className="dk-person__role">{m.role}</p>
              {m.bio && <p className="dk-person__bio">{m.bio}</p>}
              {m.links.length > 0 && (
                <ul className="dk-person__links">
                  {m.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {l.label}
                        {l.external && <External ctx={ctx} />}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Window>
  );
}

const WEEKDAYS: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

/** "Mo-Fr" (schema.org) → "seg. – sex." no idioma. Formato desconhecido volta como veio. */
function formatDays(days: string, locale: string): string {
  const name = (code: string) => {
    const n = WEEKDAYS[code];
    // 2024-01-07 foi um domingo.
    return n === undefined ? undefined : new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + n)));
  };
  const parts = days.split(",").map((part) => {
    const [a, b] = part.trim().split("-");
    const first = a && name(a);
    if (!first) return undefined;
    if (!b) return first;
    const last = name(b);
    return last ? `${first} – ${last}` : undefined;
  });
  return parts.every(Boolean) ? parts.join(", ") : days;
}

/** Localização: o endereço como arquivo de texto e o horário na lista do Finder. */
export function LocalizacaoBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<LocalizacaoFields>) {
  const org = ctx.site.organization;
  const a = org?.address;
  const lines = [a?.street, [a?.postalCode, a?.locality, a?.region].filter(Boolean).join(" · "), a?.country].filter((l): l is string => !!l);
  const hours = fields.showHours !== false ? (org?.openingHours ?? []) : [];
  const mapUrl = fields.showMap !== false ? org?.mapUrl : undefined;
  const SubHeading = `h${headingLevel === 1 ? 2 : 3}` as "h2" | "h3";
  return (
    <Window id={id} anchor={fields.anchor} type="localizacao" variant={variant} title={fields.title} level={headingLevel}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      <div className="dk-loc">
        {lines.length > 0 && (
          <div className="dk-loc__address">
            <SubHeading className="dk-loc__heading">{ctx.t("location.address")}</SubHeading>
            <address className="dk-txt">
              {lines.map((l) => (
                <span key={l}>
                  {l}
                  <br />
                </span>
              ))}
            </address>
            {mapUrl && (
              <ButtonRow>
                <DeskButton link={{ label: ctx.t("location.map"), href: mapUrl, external: true }} ctx={ctx} primary />
              </ButtonRow>
            )}
          </div>
        )}
        {hours.length > 0 && (
          <div className="dk-loc__hours">
            <SubHeading className="dk-loc__heading">{ctx.t("location.hours")}</SubHeading>
            <dl className="dk-list">
              {hours.map((h, i) => (
                <div key={`${h.days}-${h.opens}`} className="dk-li dk-li--hours">
                  <dt className="dk-li__name">
                    <Square color={i} />
                    {formatDays(h.days, ctx.locale)}
                  </dt>
                  <dd className="dk-mono">
                    {h.opens} – {h.closes}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Window>
  );
}

/** Logos de clientes: uma pasta de ícones, cada logo numa moldura. */
export function LogosClientesBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<LogosFields>) {
  const logos = fields.logos ?? [];
  const resolve = (href?: string) => {
    if (!href) return undefined;
    if (/^(https?:|\/\/)/i.test(href)) return { href, external: true };
    if (/^(mailto:|tel:|#)/i.test(href)) return { href, external: false };
    return { href: ctx.href(href), external: false };
  };
  return (
    <Window id={id} anchor={fields.anchor} type="logos-clientes" variant={variant} title={fields.title} level={headingLevel} bar={items(ctx, logos.length)} status={fields.title ? <span>{items(ctx, logos.length)}</span> : undefined}>
      {logos.length > 0 && (
        <ul className="dk-logos">
          {logos.map((logo, i) => {
            const link = resolve(logo.href);
            const img = logo.image && <Img image={{ ...logo.image, alt: logo.image.alt || logo.name || "" }} className="dk-logos__img" sizes="160px" />;
            return (
              <li key={`${i}-${logo.name}`} className="dk-logos__item">
                {link ? (
                  <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {img}
                    {link.external && <External ctx={ctx} />}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Window>
  );
}
