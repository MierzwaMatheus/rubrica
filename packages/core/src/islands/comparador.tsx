/**
 * Ilha do bloco `antes-depois` (apresentação "comparador"): as duas imagens sobrepostas e uma
 * divisória arrastável. O controle é um `<input type="range">` nativo, esticado sobre as
 * imagens e invisível: arrasta com o mouse ou o dedo em qualquer ponto e anda pelas setas
 * do teclado (Page Up/Down, Home e End também), com o foco desenhado na alça.
 *
 * Antes de hidratar (e sem JavaScript) é o mesmo par lado a lado do bloco estático.
 */
import { useEffect, useState, type CSSProperties } from "react";
import type { ResolvedImage } from "../blocks/fields";
import { BeforeAfterPair, beforeAfterLabels } from "../components/blocks/before-after";
import { makeT } from "./kit";

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
  const ratio = before.width && before.height ? `${before.width} / ${before.height}` : undefined;
  return (
    <div className="rb-comparer" style={{ "--pos": `${pos}%`, ...(ratio && { "--ratio": ratio }) } as CSSProperties}>
      <div className="rb-comparer__stage">
        <img className="rb-comparer__before" src={before.src} alt={before.alt} width={before.width} height={before.height} decoding="async" />
        <div className="rb-comparer__after">
          <img src={after.src} alt={after.alt} width={after.width} height={after.height} decoding="async" />
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
