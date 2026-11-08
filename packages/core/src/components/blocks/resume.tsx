/** Currículo: experiência, formação e competências, mais o botão de PDF (ilha). */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { curriculo as curriculoDef } from "../../blocks/catalog";
import type { ResumeItem } from "../../render/collections";
import type { ResumeKind } from "../../content/types";
import { Heading, Section, SectionHeader } from "../primitives";

type CurriculoFields = ResolvedFields<typeof curriculoDef.fields>;

const KINDS: ResumeKind[] = ["experience", "education", "skill", "certification", "language"];

function Period({ item, ctx }: { item: ResumeItem; ctx: BlockProps["ctx"] }) {
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

export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<CurriculoFields, ResumeItem>) {
  const byKind = (kind: ResumeKind) => items.filter((i) => i.kind === kind);
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island rb-resume__download">{island}</div> : null}
      {KINDS.map((kind) => {
        const list = byKind(kind);
        if (!list.length) return null;
        return (
          <section key={kind} className={`rb-resume__group rb-resume__group--${kind}`} aria-labelledby={`${id}-${kind}`}>
            <Heading level={3} id={`${id}-${kind}`} className="rb-resume__heading">
              {ctx.t(`resume.${kind}`)}
            </Heading>
            {kind === "skill" ? (
              <ul className="rb-tags rb-tags--large">
                {list.map((i) => (
                  <li key={i.id}>{i.title}</li>
                ))}
              </ul>
            ) : (
              <ul className="rb-resume__list">
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
