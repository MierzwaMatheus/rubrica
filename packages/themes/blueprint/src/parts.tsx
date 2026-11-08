/**
 * Peças do Blueprint: folhas técnicas numeradas, linhas de cota, números em círculo,
 * carimbo (tabela de título) e área hachurada. Tudo estático e no fluxo do documento:
 * carimbos, cotas e números nunca são posicionados por cima do conteúdo, então não cobrem
 * texto em nenhuma largura. Os rótulos vêm de `ctx.t("blueprint.*")`.
 */
import type { ComponentType, ReactNode } from "react";
import type { BlockComponent, BlockProps, RenderContext } from "@rubrica/core";
import { Img } from "@rubrica/core/components";

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Mês e ano atuais, como num carimbo: 10.2026. */
export function stampDate(): string {
  const d = new Date();
  return `${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** Data técnica (ISO): 2026-10-24. */
export const isoDate = (iso: string) => iso.slice(0, 10);

/** Iniciais + sobrenome para o campo "Desenho" do carimbo: "A. Rocha". */
export function drawnBy(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]![0]}. ${parts[parts.length - 1]}`;
}

/** Quem "desenhou" o conjunto: a pessoa, a empresa ou o nome do site. */
export function ownerName(ctx: RenderContext): string {
  return ctx.site.person?.name ?? ctx.site.organization?.legalName ?? ctx.site.name;
}

/** Texto com plural: usa `<chave>.one` com n = 1 e `<chave>.other` nos demais casos. */
export function count(ctx: RenderContext, key: string, n: number, vars: Record<string, string | number> = {}): string {
  return ctx.t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...vars });
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
export const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ");

/** Rótulo do tipo de bloco na etiqueta da folha. */
const SHEET_LABELS = new Set([
  "hero",
  "texto",
  "numeros",
  "lista-itens",
  "cases",
  "servicos",
  "depoimentos",
  "faq",
  "posts-recentes",
  "cta",
  "contato",
  "galeria",
  "curriculo",
  "precos",
  "equipe",
  "localizacao",
  "logos-clientes",
]);

interface SheetProps {
  ctx: RenderContext;
  /** Número da folha (posição do bloco na página). */
  index: number;
  type: string;
  /** Troca o rótulo do tipo (ex.: o hero das páginas internas é a "ficha"). */
  label?: string;
  children: ReactNode;
}

/**
 * Uma folha técnica: moldura, etiqueta "FOLHA 0X · TÍTULO" e a referência no canto. A
 * etiqueta e a referência ficam numa linha própria (flex com quebra). O título da seção
 * (o `h1`/`h2` do bloco) fica dentro, como conteúdo.
 */
export function Sheet({ ctx, index, type, label, children }: SheetProps) {
  const name = label ?? ctx.t(`blueprint.sheet.${SHEET_LABELS.has(type) ? type : "generic"}`);
  return (
    <div className="bp-sheet" data-sheet={type}>
      <div className="bp-sheet-head">
        <p className="bp-tag">
          {ctx.t("blueprint.sheet")} {pad2(index)} · {name}
        </p>
        <span className="bp-ref" aria-hidden="true">
          A{index}
        </span>
      </div>
      <div className="bp-sheet-body">{children}</div>
    </div>
  );
}

/**
 * Faz de um componente de bloco (do núcleo ou do tema) uma folha: o bloco continua o
 * mesmo, só ganha a moldura numerada.
 */
export function sheeted(type: string, Inner: ComponentType<BlockProps<any, any>>): BlockComponent {
  function SheetedBlock(props: BlockProps<any, any>) {
    return (
      <Sheet ctx={props.ctx} index={props.index} type={type}>
        <Inner {...props} />
      </Sheet>
    );
  }
  SheetedBlock.displayName = `Sheeted(${type})`;
  return SheetedBlock;
}

/** Linha de cota: traço com as duas pontas e a medida no meio. A medida é informação real. */
export function Dim({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bp-dim${className ? ` ${className}` : ""}`}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Número em círculo (legenda de desenho). Decorativo: o texto ao lado diz o mesmo. */
export function Num({ children, size }: { children: ReactNode; size?: "lg" }) {
  return (
    <span className={`bp-n${size === "lg" ? " bp-n--lg" : ""}`} aria-hidden="true">
      {children}
    </span>
  );
}

export interface StampCell {
  label: string;
  value: ReactNode;
  span?: number;
}

/** Carimbo (tabela de título): uma tabela de verdade, no fluxo. */
export function TitleBlock({ ctx, rows, className }: { ctx: RenderContext; rows: StampCell[][]; className?: string }) {
  return (
    <table className={`bp-tb${className ? ` ${className}` : ""}`} aria-label={ctx.t("blueprint.stampLabel")}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell) => (
              <td key={cell.label} colSpan={cell.span}>
                <small>{cell.label}</small>
                {cell.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Carimbo de "projeto / folha / escala / data / desenho". */
export function ProjectStamp({ ctx, project, sheet }: { ctx: RenderContext; project: ReactNode; sheet?: string }) {
  return (
    <TitleBlock
      ctx={ctx}
      rows={[
        [
          { label: ctx.t("blueprint.project"), value: project, span: sheet ? 2 : 3 },
          ...(sheet ? [{ label: ctx.t("blueprint.sheet"), value: sheet }] : []),
        ],
        [
          { label: ctx.t("blueprint.scale"), value: "1:1" },
          { label: ctx.t("blueprint.date"), value: stampDate() },
          { label: ctx.t("blueprint.drawn"), value: drawnBy(ownerName(ctx)) || "—" },
        ],
      ]}
    />
  );
}

/** Área hachurada de uma prancha, com a imagem emoldurada dentro (ou a marca de centro). */
export function Hatch({ image, tall, sizes }: { image?: Parameters<typeof Img>[0]["image"]; tall?: boolean; sizes?: string }) {
  return (
    <div className={`bp-hatch${tall ? " bp-hatch--tall" : ""}`}>
      {image ? <Img image={image} sizes={sizes} /> : <span className="bp-hatch-mark" aria-hidden="true" />}
    </div>
  );
}

/** Marca de link externo para leitores de tela. */
export function ExternalHint({ external, ctx }: { external?: boolean; ctx: RenderContext }) {
  return external ? <span className="rb-sr-only"> {ctx.t("common.external")}</span> : null;
}

/** Botão-link do tema (`primary` usa a cor primária). */
export function Btn({ link, primary, ctx, children, trail }: { link: { href: string; label: string; external?: boolean }; primary?: boolean; ctx: RenderContext; children?: ReactNode; trail?: ReactNode }) {
  return (
    <a className={`bp-btn${primary ? " bp-btn--pri" : ""}`} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {link.label}
      <ExternalHint external={link.external} ctx={ctx} />
      {trail}
    </a>
  );
}
