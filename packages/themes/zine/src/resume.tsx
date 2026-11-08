/**
 * Currículo do Zine (a "folha datilografada" da v1): a experiência numa carta em papel
 * pautado, as competências como etiquetas de fita e formação, certificações e idiomas
 * como fichas presas com fita. O botão de PDF (ilha) vem do núcleo.
 */
import type { CollectionItems } from "@rubrica/core";
import { Heading, Html, isHtmlText } from "@rubrica/core/components";
import { Letter, Tape, ZHead, ZSection, tilt, tiltAt } from "./parts";
import type { Props } from "./blocks";

type ResumeItem = CollectionItems["resume"];

function periodOf(item: ResumeItem, ctx: Props["ctx"]): string {
  if (!item.start && !item.end) return "";
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return `${item.start ? month(item.start) : ""} – ${item.end ? month(item.end) : ctx.t("resume.present")}`;
}

/** Descrição: linhas com marcador viram lista; o resto, um parágrafo. */
function Description({ text }: { text?: string }) {
  if (!text) return null;
  if (isHtmlText(text)) return <Html html={text} className="rb-prose rb-resume__desc" />;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul className="zn-bullets">
        {bullets.map((l, i) => (
          <li key={`${i}-${l}`}>{l.replace(/^[-•]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p className="zn-bullets-p">{lines.join(" ")}</p>;
}

export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: Props<any, ResumeItem>) {
  const byKind = (kind: ResumeItem["kind"]) => items.filter((i) => i.kind === kind);
  const experience = byKind("experience");
  const skills = byKind("skill");
  const cards: { kind: ResumeItem["kind"]; list: ResumeItem[] }[] = (["education", "certification", "language"] as const).map((kind) => ({ kind, list: byKind(kind) })).filter((c) => c.list.length > 0);
  return (
    <ZSection type="curriculo" id={id} anchor={fields.anchor} variant={variant}>
      <ZHead title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island zn-download">{island}</div> : null}
      {experience.length > 0 && (
        <div className="zn-resume-group">
          <Heading level={3} className="zn-sub-title">
            {ctx.t("resume.experience")}
          </Heading>
          <Letter deg={-0.5}>
            <ol className="zn-exp">
              {experience.map((i) => (
                <li key={i.id}>
                  <div className="zn-exp-head">
                    <h4>
                      {i.title}
                      {i.organization && <span className="zn-exp-org"> @ {i.organization}</span>}
                    </h4>
                    {periodOf(i, ctx) && <span className="zn-exp-period">{periodOf(i, ctx)}</span>}
                  </div>
                  {i.location && <p className="zn-exp-loc">{i.location}</p>}
                  <Description text={i.description} />
                </li>
              ))}
            </ol>
          </Letter>
        </div>
      )}
      {skills.length > 0 && (
        <div className="zn-resume-group">
          <Heading level={3} className="zn-sub-title">
            {ctx.t("resume.skill")}
          </Heading>
          <ul className="zn-chips">
            {skills.map((i, n) => (
              <li key={i.id} className="zn-chip zn-tilt" style={tilt(tiltAt(n, 0.8))}>
                {i.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      {cards.length > 0 && (
        <div className="zn-notes zn-resume-group">
          {cards.map((card, n) => (
            <section key={card.kind} className="zn-note zn-tilt" style={tilt(tiltAt(n + 1, 0.9))}>
              <Tape />
              <Heading level={3}>{ctx.t(`resume.${card.kind}`)}</Heading>
              <ul className="zn-plain">
                {card.list.map((i) => (
                  <li key={i.id}>
                    <strong>{i.title}</strong>
                    {(i.organization || periodOf(i, ctx)) && <div className="zn-sub">{[i.organization, periodOf(i, ctx)].filter(Boolean).join(" · ")}</div>}
                    <Description text={i.description} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </ZSection>
  );
}
