/**
 * Linha do tempo: lista ordenada de marcos, pura e sem JavaScript.
 */
import type { ResolvedFields } from "../../blocks/fields";
import type { linhaDoTempo as linhaDef } from "../../blocks/catalog";
import type { BlockProps } from "../../theme/contract";
import { Heading, Img, Section, SectionHeader } from "../primitives";

type LinhaFields = ResolvedFields<typeof linhaDef.fields>;

/** Variações: `vertical` (padrão, uma linha à esquerda) e `horizontal` (compacta, marcos lado a lado). */
export function LinhaDoTempoBlock({ id, variant, fields, headingLevel }: BlockProps<LinhaFields>) {
  const items = (fields.items ?? []).filter((m) => m.title);
  const horizontal = variant === "horizontal";
  return (
    <Section id={id} anchor={fields.anchor} type="linha-do-tempo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ol className={`rb-timeline${horizontal ? " rb-timeline--horizontal" : ""}`}>
          {items.map((m, i) => (
            <li key={`${i}-${m.title}`} className="rb-timeline__item">
              {m.date && <p className="rb-timeline__date">{m.date}</p>}
              <div className="rb-timeline__content">
                <Heading level={3} className="rb-timeline__title">
                  {m.title}
                </Heading>
                {m.body && <p className="rb-timeline__text">{m.body}</p>}
                {m.image && <Img image={m.image} className="rb-timeline__image" sizes={horizontal ? "(min-width: 960px) 20vw, 100vw" : "(min-width: 960px) 30rem, 100vw"} />}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
