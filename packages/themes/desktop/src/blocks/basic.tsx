/**
 * Blocos de texto da área de trabalho: o Leia-me (hero), os arquivos .txt (texto), o
 * Números.app, os painéis de Preferências do Sistema (lista de itens) e a caixa de
 * diálogo do fechamento (cta).
 */
import type { BlockProps, ResolvedFields } from "@rubrica/core";
import type { cta as ctaDef, hero as heroDef, listaItens as listaDef, numeros as numerosDef, texto as textoDef } from "@rubrica/core/blocks";
import { Heading, Html, Img } from "@rubrica/core/components";
import { ButtonRow, DeskButton, Window, safeId } from "../window";

type HeroFields = ResolvedFields<typeof heroDef.fields>;
type TextoFields = ResolvedFields<typeof textoDef.fields>;
type NumerosFields = ResolvedFields<typeof numerosDef.fields>;
type ListaFields = ResolvedFields<typeof listaDef.fields>;
type CtaFields = ResolvedFields<typeof ctaDef.fields>;

/**
 * Leia-me.txt: luz de disponível, "Olá! Aqui é <nome>.", o cargo como linha de comando,
 * o título, o apoio com cursor piscando e os botões. A imagem, se houver, entra ao lado.
 */
export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<HeroFields>) {
  const person = ctx.site.kind === "pessoal" ? ctx.site.person : undefined;
  const role = fields.eyebrow || person?.jobTitle;
  const titleId = `${safeId(id)}-h`;
  return (
    <Window id={id} type="hero" variant={variant} bar={ctx.t("desktop.readme")} labelledBy={fields.title ? titleId : undefined} className={fields.image ? "dk-win--media" : undefined}>
      <div className="dk-pad dk-hero">
        <div className="dk-hero__body">
          {fields.showAvailability && (
            <p className="dk-led">
              <i aria-hidden="true" />
              {ctx.t("hero.available")}
            </p>
          )}
          {person?.name && (
            <p className="dk-hi">
              {ctx.t("desktop.hello")} <b>{person.name}</b>.
            </p>
          )}
          {role && (
            <p className="dk-role">
              <span aria-hidden="true">&gt; </span>
              {role}
            </p>
          )}
          {fields.title && (
            <Heading level={headingLevel} id={titleId} className="dk-hero__title">
              {fields.title}
            </Heading>
          )}
          {fields.subtitle && (
            <p className="dk-desc">
              {fields.subtitle}
              <span className="dk-caret" aria-hidden="true" />
            </p>
          )}
          {!!fields.tags?.length && (
            <ul className="dk-chips">
              {fields.tags.map((t, i) => (
                <li key={`${i}-${t.label}`} className="dk-chip">
                  {t.label}
                </li>
              ))}
            </ul>
          )}
          {(fields.primaryCta || fields.secondaryCta) && (
            <ButtonRow>
              {fields.primaryCta && <DeskButton link={fields.primaryCta} ctx={ctx} primary />}
              {fields.secondaryCta && <DeskButton link={fields.secondaryCta} ctx={ctx} />}
            </ButtonRow>
          )}
        </div>
        {fields.image && (
          <div className="dk-hero__media">
            <Img image={fields.image} className="dk-frame" priority sizes="(min-width: 1024px) 320px, 100vw" />
          </div>
        )}
      </div>
    </Window>
  );
}

/** Um arquivo .txt: o título na barra (com a extensão só visual) e o texto em mono. */
export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<TextoFields>) {
  const image = fields.image && (
    <div className="dk-texto__media">
      <Img image={fields.image} className="dk-frame" sizes="(min-width: 1024px) 300px, 100vw" />
    </div>
  );
  return (
    <Window id={id} anchor={fields.anchor} type="texto" variant={variant} title={fields.title} level={headingLevel} suffix=".txt" className={image ? "dk-win--media" : undefined}>
      <div className={`dk-pad dk-texto${image ? " dk-texto--media" : ""}`}>
        {fields.imagePosition === "start" && image}
        {fields.body && <Html html={fields.body} className="dk-txt" />}
        {fields.imagePosition !== "start" && image}
      </div>
    </Window>
  );
}

/** Números.app: cada número numa caixa; o valor aparece em cima do rótulo. */
export function NumerosBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<NumerosFields>) {
  const list = fields.items ?? [];
  return (
    <Window id={id} anchor={fields.anchor} type="numeros" variant={variant} title={fields.title} level={headingLevel} bar={ctx.t("desktop.numbers")}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length > 0 && (
        <dl className="dk-met">
          {list.map((m, i) => (
            <div key={`${i}-${m.label}`} className="dk-met__item">
              <dt className="dk-met__label">{m.label}</dt>
              <dd className="dk-met__value">{m.value}</dd>
              {m.description && <dd className="dk-met__desc">{m.description}</dd>}
            </div>
          ))}
        </dl>
      )}
    </Window>
  );
}

/** Preferências do Sistema: cada item é um painel com o "ícone" numerado ou com a inicial. */
export function ListaItensBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<ListaFields>) {
  const list = fields.items ?? [];
  const List = fields.numbered ? "ol" : "ul";
  return (
    <Window id={id} anchor={fields.anchor} type="lista-itens" variant={variant} title={fields.title} level={headingLevel} prefix={ctx.t("desktop.preferences")} bar={ctx.t("desktop.preferences")}>
      {fields.intro && <p className="dk-toolbar dk-muted">{fields.intro}</p>}
      {list.length > 0 && (
        <List className="dk-panels">
          {list.map((item, i) => (
            <li key={`${i}-${item.title}`} className="dk-panel">
              <span className={`dk-panel__ic${i % 2 ? " dk-panel__ic--alt" : ""}`} aria-hidden="true">
                {fields.numbered ? String(i + 1).padStart(2, "0") : (item.title ?? "").trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <h3 className="dk-panel__title">{item.title}</h3>
                {item.body && <p className="dk-panel__text">{item.body}</p>}
              </div>
            </li>
          ))}
        </List>
      )}
    </Window>
  );
}

/** Caixa de diálogo do fechamento: o "!" do sistema, o título, o apoio e os botões à direita. */
export function CtaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<CtaFields>) {
  const titleId = `${safeId(id)}-h`;
  return (
    <Window id={id} anchor={fields.anchor} type="cta" variant={variant} bar={ctx.t("desktop.dialog")} labelledBy={fields.title ? titleId : undefined}>
      <div className="dk-dlg">
        <i className="dk-bang" aria-hidden="true">
          !
        </i>
        <div className="dk-dlg__body">
          {fields.title && (
            <Heading level={headingLevel} id={titleId} className="dk-dlg__title">
              {fields.title}
            </Heading>
          )}
          {fields.body && <p className="dk-dlg__text">{fields.body}</p>}
          {(fields.primary || fields.secondary) && (
            <ButtonRow end>
              {fields.secondary && <DeskButton link={fields.secondary} ctx={ctx} />}
              {fields.primary && <DeskButton link={fields.primary} ctx={ctx} primary />}
            </ButtonRow>
          )}
        </div>
      </div>
    </Window>
  );
}
