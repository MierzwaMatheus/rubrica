/**
 * Ilha do bloco `antes-depois` (apresentação "comparador"): as duas imagens sobrepostas e uma
 * divisória arrastável. O controle é um `<input type="range">` nativo, esticado sobre as
 * imagens e invisível: arrasta com o mouse ou o dedo em qualquer ponto e anda pelas setas
 * do teclado (Page Up/Down, Home e End também), com o foco desenhado na alça.
 *
 * Antes de hidratar (e sem JavaScript) é o mesmo par lado a lado do bloco estático.
 *
 * O palco tem a altura reservada desde o primeiro quadro (`--ratio`, das medidas da imagem
 * do antes, senão da do depois, senão 16:10 com recorte), para não saltar enquanto as
 * imagens chegam. As imagens usam o mesmo `Img` do par (mesmo `src`, `sizes` e
 * carregamento), então o navegador reaproveita o que já baixou.
 */
import { useEffect, useState, type CSSProperties } from "react";
import type { ResolvedImage } from "../blocks/fields";
import { BeforeAfterPair, beforeAfterLabels } from "../components/blocks/before-after";
import { Img } from "../components/primitives";
import { makeT } from "./kit";

/** Proporção reservada para o palco: a do antes, a do depois ou 16:10 (a imagem é recortada). */
export function comparerRatio(before: Pick<ResolvedImage, "width" | "height">, after: Pick<ResolvedImage, "width" | "height">): string {
  const of = (i: Pick<ResolvedImage, "width" | "height">) => (i.width && i.height ? `${i.width} / ${i.height}` : undefined);
  return of(before) ?? of(after) ?? "16 / 10";
}

/** O mesmo `sizes` do par lado a lado: o navegador escolhe o mesmo arquivo e não baixa de novo. */
const SIZES = "(min-width: 48rem) 50vw, 100vw";

interface ComparadorProps {
  fields: { before?: ResolvedImage; after?: ResolvedImage; beforeLabel?: string; afterLabel?: string };
  texts: Record<string, string>;
}

export default function Comparador({ fields, texts }: ComparadorProps) {
  const t = makeT(texts);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState(50);
  useEffect(() => setReady(true), []);
  const { before, after } = fields;
  if (!before || !after) return null;
  const labels = beforeAfterLabels(fields, t);
  if (!ready) return <BeforeAfterPair before={before} after={after} {...labels} />;
  return (
    <div className="rb-comparer" style={{ "--pos": `${pos}%`, "--ratio": comparerRatio(before, after) } as CSSProperties}>
      <div className="rb-comparer__stage">
        <Img image={before} className="rb-comparer__before" sizes={SIZES} />
        <div className="rb-comparer__after">
          <Img image={after} sizes={SIZES} />
        </div>
        <span className="rb-comparer__label rb-comparer__label--before">{labels.beforeLabel}</span>
        <span className="rb-comparer__label rb-comparer__label--after">{labels.afterLabel}</span>
        <span className="rb-comparer__handle" aria-hidden="true" />
        <input
          type="range"
          className="rb-comparer__range"
          min={0}
          max={100}
          step={1}
          value={pos}
          aria-label={t("beforeAfter.slider")}
          aria-valuetext={t("beforeAfter.position", { before: pos, after: 100 - pos, beforeLabel: labels.beforeLabel, afterLabel: labels.afterLabel })}
          onChange={(e) => setPos(Number(e.currentTarget.value))}
        />
      </div>
    </div>
  );
}
