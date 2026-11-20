/**
 * Blocos de marca e mídia (contrato 1.4): antes e depois, paleta, tipografia, variações de
 * marca e imagens. Componentes puros; o comparador deslizante e o carrossel são ilhas que
 * só melhoram o HTML estático (sem JavaScript, tudo aparece).
 */
import type { CSSProperties } from "react";
import type { ResolvedFields, ResolvedImage } from "../../blocks/fields";
import { HEX_COLOR } from "../../blocks/fields";
import type { antesDepois, imagens, paleta, tipografia, variacoesMarca } from "../../blocks/catalog/marca";
import { accentForeground } from "../../theme/brand";
import { contrastRatio } from "../../theme/schemes";
import { fontVarFor, parseWeights } from "../../theme/fonts";
import type { BlockProps } from "../../theme/contract";
import { Heading, Img, Section, SectionHeader } from "../primitives";
import { BeforeAfterPair, beforeAfterLabels } from "./before-after";

export { BeforeAfterPair, beforeAfterLabels, type BeforeAfterPairProps } from "./before-after";

type AntesDepoisFields = ResolvedFields<typeof antesDepois.fields>;
type PaletaFields = ResolvedFields<typeof paleta.fields>;
type TipografiaFields = ResolvedFields<typeof tipografia.fields>;
type VariacoesFields = ResolvedFields<typeof variacoesMarca.fields>;
type ImagensFields = ResolvedFields<typeof imagens.fields>;
type T = (key: string, vars?: Record<string, string | number>) => string;

/** Nível dos títulos de item: um abaixo do título da seção. */
const itemLevel = (level: 1 | 2): 2 | 3 => (level === 1 ? 2 : 3);

// ── Antes e depois ──────────────────────────────────────────────────────────

/** Antes e depois: lado a lado; com o comparador, a ilha sobrepõe as imagens com uma divisória arrastável. */
export function AntesDepoisBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<AntesDepoisFields>) {
  const { before, after } = fields;
  if (!before || !after) return null;
  const presentation = fields.presentation === "lado-a-lado" ? "lado-a-lado" : "comparador";
  return (
    <Section id={id} anchor={fields.anchor} type="antes-depois" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <figure className="rb-before-after" data-presentation={presentation}>
        {island ?? <BeforeAfterPair before={before} after={after} {...beforeAfterLabels(fields, ctx.t)} />}
        {fields.caption && <figcaption className="rb-before-after__caption">{fields.caption}</figcaption>}
      </figure>
    </Section>
  );
}

// ── Paleta ──────────────────────────────────────────────────────────────────

/** `#7a1f2b` → `122 31 43`. */
export function hexToRgb(hex: string): string {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
}

export type ContrastGrade = "aaa" | "aa" | "large" | "fail";

/** Nível WCAG do contraste para texto: AAA (7), AA (4,5), AA só texto grande (3) ou reprova. */
export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "large";
  return "fail";
}

function gradeLabel(grade: ContrastGrade, t: T): string {
  if (grade === "aaa") return "AAA";
  if (grade === "aa") return "AA";
  return grade === "large" ? t("palette.large") : t("palette.fail");
}

/** Paleta: amostras grandes com nome, códigos, papel, uso e (opcional) o contraste com branco e preto. */
export function PaletaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<PaletaFields>) {
  const colors = (fields.colors ?? []).flatMap((c) => (c?.name && typeof c.hex === "string" && HEX_COLOR.test(c.hex) ? [{ ...c, hex: c.hex }] : []));
  if (colors.length === 0) return null;
  const ratio = new Intl.NumberFormat(ctx.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const level = itemLevel(headingLevel);
  return (
    <Section id={id} anchor={fields.anchor} type="paleta" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-palette">
        <ul className="rb-palette__list" data-count={colors.length}>
          {colors.map((c, i) => {
            const hex = c.hex.toLowerCase();
            const fg = accentForeground(hex);
            return (
              <li key={`${i}-${hex}`} className="rb-palette__swatch">
                <div className="rb-palette__chip" style={{ "--swatch": hex, color: fg } as CSSProperties}>
                  {c.role && <p className="rb-palette__role">{c.role}</p>}
                  <Heading level={level} className="rb-palette__name">
                    {c.name}
                  </Heading>
                </div>
                <div className="rb-palette__body">
                  <dl className="rb-palette__codes">
                    <div>
                      <dt>{ctx.t("palette.hex")}</dt>
                      <dd className="rb-palette__hex">{hex.toUpperCase()}</dd>
                    </div>
                    <div>
                      <dt>{ctx.t("palette.rgb")}</dt>
                      <dd>{hexToRgb(hex)}</dd>
                    </div>
                  </dl>
                  {c.usage && <p className="rb-palette__usage">{c.usage}</p>}
                  {fields.showContrast !== false && (
                    <ul className="rb-palette__contrast">
                      {(
                        [
                          ["#ffffff", "palette.contrastWhite"],
                          ["#000000", "palette.contrastBlack"],
                        ] as const
                      ).map(([text, key]) => {
                        const value = contrastRatio(hex, text);
                        const grade = contrastGrade(value);
                        return (
                          <li key={key} className="rb-palette__ratio" data-grade={grade}>
                            {/* Demonstração visual (pode reprovar de propósito): desenhada pelo CSS, fora da árvore de texto. */}
                            <span className="rb-palette__sample" style={{ background: hex, color: text }} data-sample={ctx.t("palette.sample")} aria-hidden="true" />
                            <span className="rb-palette__ratioLabel">{ctx.t(key)}</span>
                            <span className="rb-palette__ratioValue">{`${ratio.format(Math.floor(value * 10) / 10)}:1`}</span>
                            <span className="rb-palette__grade">{gradeLabel(grade, ctx.t)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ── Tipografia ──────────────────────────────────────────────────────────────

/** Variável CSS da fonte de uma família de conteúdo (a mesma regra do build: `fontVarFor`). */
export const fontVar = fontVarFor;

/** Pilha da família: a variável que o build define, o nome da família (se instalada) e a fonte do tema. */
export function fontStack(family: string): string {
  const name = family.replace(/["\\]/g, "");
  return `var(${fontVar(family)}, "${name}", var(--rb-font-sans))`;
}

/**
 * Pesos a mostrar: os do campo (`parseWeights`, a mesma leitura do build) ou, sem nenhum
 * válido, 400 e 700.
 */
export function typeWeights(raw: string | undefined): number[] {
  const weights = parseWeights(raw);
  return weights.length ? weights : [400, 700];
}

/** Tipografia: cada família com papel, pesos e uma amostra grande na própria fonte. */
export function TipografiaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<TipografiaFields>) {
  const fonts = (fields.fonts ?? []).flatMap((f) => (f?.family ? [{ ...f, family: f.family }] : []));
  if (fonts.length === 0) return null;
  const level = itemLevel(headingLevel);
  return (
    <Section id={id} anchor={fields.anchor} type="tipografia" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-type">
        <ul className="rb-type__list">
          {fonts.map((f, i) => {
            const weights = typeWeights(f.weights);
            const style = { "--type-font": fontStack(f.family) } as CSSProperties;
            return (
              <li key={`${i}-${f.family}`} className="rb-type__font" style={style} data-specimen={f.specimen ? "" : undefined}>
                <div className="rb-type__meta">
                  {f.role && <p className="rb-type__role">{f.role}</p>}
                  <Heading level={level} className="rb-type__family">
                    {f.family}
                  </Heading>
                  <div className="rb-type__weights">
                    <p className="rb-type__weightsLabel">{ctx.t("type.weights")}</p>
                    <ul className="rb-type__weightList">
                      {weights.map((w) => (
                        <li key={w} className="rb-type__weight">
                          {!f.specimen && (
                            <span className="rb-type__glyph" style={{ fontWeight: w }} aria-hidden="true">
                              {ctx.t("type.glyph")}
                            </span>
                          )}
                          <span className="rb-type__weightValue">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {f.specimen ? (
                  <Img image={f.specimen} className="rb-type__specimen" sizes="(min-width: 60rem) 40rem, 100vw" />
                ) : (
                  <p className="rb-type__sample" data-long={(f.sample ?? "").length > 48 ? "" : undefined}>
                    {f.sample || ctx.t("type.alphabet")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ── Variações de marca ──────────────────────────────────────────────────────

/** Variações de marca: "pranchas" com o logo centralizado sobre a cor de fundo; rótulo e observação fora do fundo. */
export function VariacoesMarcaBlock({ id, variant, fields, headingLevel }: BlockProps<VariacoesFields>) {
  const items = (fields.items ?? []).flatMap((it) => (it?.image ? [{ ...it, image: it.image }] : []));
  if (items.length === 0) return null;
  const columns = ["2", "3", "4"].includes(fields.columns ?? "") ? fields.columns : "3";
  return (
    <Section id={id} anchor={fields.anchor} type="variacoes-marca" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-brand-grid">
        <ul className="rb-brand-grid__list" data-columns={columns}>
          {items.map((it, i) => {
            const bg = typeof it.background === "string" && HEX_COLOR.test(it.background) ? it.background.toLowerCase() : undefined;
            return (
              <li key={`${i}-${it.image.src}`} className="rb-brand-grid__item">
                <figure className="rb-brand-grid__figure">
                  <div className="rb-brand-grid__tile" style={bg ? ({ "--tile-bg": bg } as CSSProperties) : undefined} data-bg={bg ? "" : undefined}>
                    <Img image={it.image} className="rb-brand-grid__image" sizes="(min-width: 60rem) 25vw, 50vw" />
                  </div>
                  {(it.label || it.note) && (
                    <figcaption className="rb-brand-grid__caption">
                      {it.label && <span className="rb-brand-grid__label">{it.label}</span>}
                      {it.note && <span className="rb-brand-grid__note">{it.note}</span>}
                    </figcaption>
                  )}
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ── Imagens ─────────────────────────────────────────────────────────────────

/**
 * Imagens: grade, mosaico (a primeira maior) ou carrossel. O carrossel, com a ilha, ganha
 * botões e a imagem grande numa janela; sem JavaScript, é uma faixa com rolagem lateral.
 * As imagens vão como estão (sem conversão), então GIF animado continua animado.
 */
export function ImagensBlock({ id, variant, fields, headingLevel, island }: BlockProps<ImagensFields>) {
  const items = (fields.items ?? []).flatMap((it) => (it?.image ? [{ ...it, image: it.image }] : []));
  if (items.length === 0) return null;
  const layout = fields.layout === "mosaico" || fields.layout === "carrossel" ? fields.layout : "grade";
  return (
    <Section id={id} anchor={fields.anchor} type="imagens" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-images" data-layout={layout} data-count={items.length}>
        {(layout === "carrossel" && island) || (
          <ul className="rb-images__list" {...(layout === "carrossel" ? { tabIndex: 0, "aria-label": fields.title || undefined } : {})}>
            {items.map((it, i) => (
              <li key={`${i}-${it.image.src}`} className="rb-images__item">
                <figure className="rb-images__figure">
                  <Img image={it.image} className="rb-images__image" sizes={layout === "mosaico" && i === 0 ? "(min-width: 48rem) 66vw, 100vw" : "(min-width: 48rem) 33vw, 100vw"} />
                  {it.caption && <figcaption className="rb-images__caption">{it.caption}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
