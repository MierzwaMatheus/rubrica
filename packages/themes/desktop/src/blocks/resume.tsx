/**
 * Currículo como na v1: o Currículo.txt no topo (com o PDF), a experiência numa janela
 * em modo lista (período, cargo, empresa), as competências no Painel de Controle e as
 * janelas menores (formação, certificações, idiomas) lado a lado.
 *
 * Um bloco só, várias janelas: o título do bloco fica na primeira; as outras levam
 * títulos um nível abaixo.
 */
import type { BlockProps, CollectionItems, ResolvedFields } from "@rubrica/core";
import type { curriculo as curriculoDef } from "@rubrica/core/blocks";
import { Cluster, Square, Window, items } from "../window";

type ResumeItem = CollectionItems["resume"];
type CurriculoFields = ResolvedFields<typeof curriculoDef.fields>;
type Ctx = BlockProps["ctx"];

function period(item: ResumeItem, ctx: Ctx): string | undefined {
  if (!item.start && !item.end) return undefined;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return `${item.start ? month(item.start) : ""} – ${item.end ? month(item.end) : ctx.t("resume.present")}`;
}

function Description({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.every((l) => /^[-•]\s/.test(l))) {
    return (
      <ul className="dk-li__desc dk-li__full">
        {lines.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="dk-li__desc dk-li__full">{lines.join(" ")}</p>;
}

export function CurriculoBlock({ id, variant, fields, items: list, headingLevel, ctx, island }: BlockProps<CurriculoFields, ResumeItem>) {
  const byKind = (kind: ResumeItem["kind"]) => list.filter((i) => i.kind === kind);
  const experience = byKind("experience");
  const skills = byKind("skill");
  const small = (["education", "certification", "language"] as const).map((kind) => ({ kind, list: byKind(kind) })).filter((g) => g.list.length > 0);
  const person = ctx.site.person;
  const sub = (headingLevel === 1 ? 2 : 3) as 2 | 3;
  const ItemHeading = `h${sub === 2 ? 3 : 4}` as "h3" | "h4";

  return (
    <>
      <Window id={id} anchor={fields.anchor} type="curriculo" variant={variant} title={fields.title} level={headingLevel} suffix=".txt">
        <div className="dk-pad dk-hero">
          {(person?.name || person?.jobTitle) && (
            <p className="dk-role">
              <span aria-hidden="true">&gt; </span>
              {[person?.name, person?.jobTitle].filter(Boolean).join(" · ")}
            </p>
          )}
          {fields.intro && <p className="dk-txt">{fields.intro}</p>}
          {fields.showDownload && island ? <div className="rb-island dk-resume__download">{island}</div> : null}
        </div>
      </Window>

      {experience.length > 0 && (
        <Window id={`${id}-experience`} type="curriculo-experiencia" title={ctx.t("resume.experience")} level={sub} status={<span>{items(ctx, experience.length)}</span>}>
          <div className="dk-lh dk-lh--resume" aria-hidden="true">
            <span>{ctx.t("desktop.colPeriod")}</span>
            <span>{ctx.t("desktop.colRole")}</span>
            <span>{ctx.t("desktop.colCompany")}</span>
          </div>
          <ul className="dk-list">
            {experience.map((item) => (
              <li key={item.id} className="dk-li dk-li--resume">
                <span className="dk-mono dk-muted">{period(item, ctx)}</span>
                <ItemHeading className="dk-li__name">{item.title}</ItemHeading>
                <span>{[item.organization, item.location].filter(Boolean).join(" · ")}</span>
                <Description text={item.description} />
              </li>
            ))}
          </ul>
        </Window>
      )}

      {skills.length > 0 && (
        <Window id={`${id}-skills`} type="curriculo-competencias" title={ctx.t("resume.skill")} level={sub} prefix={ctx.t("desktop.controlPanel")}>
          <div className="dk-panels dk-panels--single">
            <div className="dk-panel dk-panel--col">
              <ul className="dk-chips">
                {skills.map((s) => (
                  <li key={s.id} className="dk-chip">
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Window>
      )}

      {small.length > 0 && (
        <Cluster>
          {small.map((g) => (
            <Window key={g.kind} id={`${id}-${g.kind}`} type={`curriculo-${g.kind}`} title={ctx.t(`resume.${g.kind}`)} level={sub}>
              <ul className="dk-list">
                {g.list.map((item, i) => (
                  <li key={item.id} className="dk-li dk-li--single">
                    <ItemHeading className="dk-li__name">
                      <Square color={i} />
                      {item.title}
                    </ItemHeading>
                    {(item.organization || period(item, ctx)) && (
                      <span className="dk-muted">
                        {item.organization}
                        {item.organization && period(item, ctx) && " · "}
                        {period(item, ctx) && <span className="dk-mono">{period(item, ctx)}</span>}
                      </span>
                    )}
                    <Description text={item.description} />
                  </li>
                ))}
              </ul>
            </Window>
          ))}
        </Cluster>
      )}
    </>
  );
}
