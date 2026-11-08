/**
 * Comparativo de planos: tabela com cabeçalhos de linha e coluna, pura e sem JavaScript.
 * Em tela estreita, a tabela rola dentro de uma região própria (focável, com nome e aviso
 * visível), e a página não ganha rolagem horizontal; a coluna dos recursos fica fixa.
 */
import type { CSSProperties } from "react";
import type { ResolvedFields } from "../../blocks/fields";
import type { comparativoPlanos as comparativoDef } from "../../blocks/catalog";
import type { PlanItem } from "../../render/collections";
import type { BlockProps } from "../../theme/contract";
import { Section, SectionHeader } from "../primitives";
import { safeId } from "./util";

type ComparativoFields = ResolvedFields<typeof comparativoDef.fields>;
type Cell = NonNullable<NonNullable<ComparativoFields["rows"]>[number]["cells"]>[number];

function CellValue({ cell, t }: { cell: Cell | undefined; t: BlockProps["ctx"]["t"] }) {
  if (cell?.value === "sim") {
    return (
      <>
        <span className="rb-compare__mark rb-compare__mark--yes" aria-hidden="true">✓</span>
        <span className="rb-sr-only">{t("compare.yes")}</span>
      </>
    );
  }
  if (cell?.value === "nao") {
    return (
      <>
        <span className="rb-compare__mark rb-compare__mark--no" aria-hidden="true">✗</span>
        <span className="rb-sr-only">{t("compare.no")}</span>
      </>
    );
  }
  if (cell?.value === "texto" && cell.text) return <>{cell.text}</>;
  return (
    <>
      <span className="rb-compare__mark rb-compare__mark--none" aria-hidden="true">—</span>
      <span className="rb-sr-only">{t("compare.none")}</span>
    </>
  );
}

/**
 * Comparativo: as colunas são os planos da coleção (nome, preço, destaque e botão vêm de lá);
 * as linhas são os recursos do bloco, com um valor por plano na ordem das colunas.
 */
export function ComparativoPlanosBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<ComparativoFields, PlanItem>) {
  const rows = (fields.rows ?? []).filter((r) => r.label);
  if (!items.length || !rows.length) return null;
  const scope = safeId(id);
  const captionId = `${scope}-caption`;
  const hl = (plan: PlanItem) => (plan.highlighted ? " rb-compare__col--highlighted" : "");
  const style = { "--rb-compare-cols": items.length } as CSSProperties;
  return (
    <Section id={id} anchor={fields.anchor} type="comparativo-planos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <p className="rb-compare__hint">{ctx.t("compare.scroll")}</p>
      <div className="rb-compare__scroll" role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className="rb-compare" style={style}>
          <caption id={captionId} className={fields.caption ? "rb-compare__caption" : "rb-sr-only"}>
            {fields.caption || fields.title || ctx.t("compare.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="rb-compare__corner">
                {ctx.t("compare.feature")}
              </th>
              {items.map((plan) => (
                <th key={plan.id} scope="col" className={`rb-compare__plan${hl(plan)}`}>
                  {plan.highlighted && <span className="rb-compare__badge">{ctx.t("pricing.highlighted")}</span>}
                  <span className="rb-compare__name">{plan.name}</span>
                  {plan.price && <span className="rb-compare__price">{plan.price}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={`${r}-${row.label}`}>
                <th scope="row" className="rb-compare__feature">
                  {row.label}
                  {row.detail && <span className="rb-compare__detail">{row.detail}</span>}
                </th>
                {items.map((plan, c) => (
                  <td key={plan.id} className={`rb-compare__cell${hl(plan)}`}>
                    <CellValue cell={row.cells?.[c]} t={ctx.t} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {items.some((p) => p.cta) && (
            <tfoot>
              <tr>
                <th scope="row" className="rb-compare__feature">
                  <span className="rb-sr-only">{ctx.t("compare.choose")}</span>
                </th>
                {items.map((plan) => (
                  <td key={plan.id} className={`rb-compare__cell${hl(plan)}`}>
                    {plan.cta && (
                      <a
                        href={plan.cta.href}
                        className={`rb-button rb-button--${plan.highlighted ? "primary" : "secondary"} rb-compare__cta`}
                        {...(plan.cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {plan.cta.label}
                        <span className="rb-sr-only">: {plan.name}</span>
                        {plan.cta.external && <span className="rb-sr-only"> {ctx.t("common.external")}</span>}
                      </a>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {fields.note && <p className="rb-note">{fields.note}</p>}
    </Section>
  );
}
