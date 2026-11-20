/**
 * Par lado a lado do antes e depois. Arquivo à parte para a ilha do comparador importar
 * só isto (sem o resto dos blocos de marca).
 */
import type { ResolvedImage } from "../../blocks/fields";
import { Img } from "../primitives";

type T = (key: string, vars?: Record<string, string | number>) => string;

export interface BeforeAfterPairProps {
  before: ResolvedImage;
  after: ResolvedImage;
  beforeLabel: string;
  afterLabel: string;
}

/** As duas figuras lado a lado (empilhadas no celular). O bloco usa sem JavaScript e a ilha antes de hidratar. */
export function BeforeAfterPair({ before, after, beforeLabel, afterLabel }: BeforeAfterPairProps) {
  return (
    <div className="rb-before-after__pair">
      <figure className="rb-before-after__figure rb-before-after__figure--before">
        <figcaption className="rb-before-after__label">{beforeLabel}</figcaption>
        <Img image={before} className="rb-before-after__image" sizes="(min-width: 48rem) 50vw, 100vw" />
      </figure>
      <figure className="rb-before-after__figure rb-before-after__figure--after">
        <figcaption className="rb-before-after__label">{afterLabel}</figcaption>
        <Img image={after} className="rb-before-after__image" sizes="(min-width: 48rem) 50vw, 100vw" />
      </figure>
    </div>
  );
}

/** Rótulos do antes e do depois: os do campo, senão os textos de interface. */
export function beforeAfterLabels(fields: { beforeLabel?: string; afterLabel?: string }, t: T): { beforeLabel: string; afterLabel: string } {
  return { beforeLabel: fields.beforeLabel || t("beforeAfter.before"), afterLabel: fields.afterLabel || t("beforeAfter.after") };
}

