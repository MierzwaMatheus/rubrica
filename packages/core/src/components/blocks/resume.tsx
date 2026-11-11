/** Currículo: experiência, formação e competências, mais o botão de PDF (ilha). */
import type { BlockProps } from "../../theme/contract";
import type { ResolvedFields } from "../../blocks/fields";
import type { curriculo as curriculoDef } from "../../blocks/catalog";
import type { ResumeItem } from "../../render/collections";
import type { ResumeKind } from "../../content/types";
import type { ReactNode } from "react";
import { Html, Section, SectionHeader } from "../primitives";
import { isHtmlText } from "./util";

type CurriculoFields = ResolvedFields<typeof curriculoDef.fields>;
type Ctx = BlockProps["ctx"];
type Level = 2 | 3 | 4 | 5;

/** Título de nível variável (h2 a h5): o nível depende de o bloco ter título ou não. */
export function ResumeHeading({ level, id, className, children }: { level: Level; id?: string; className?: string; children: ReactNode }) {
  const Tag = `h${level}` as "h2" | "h3" | "h4" | "h5";
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
}

const KINDS: ResumeKind[] = ["experience", "volunteer", "education", "skill", "soft-skill", "certification", "language"];

/** Competências agrupadas pelo `group`, na ordem em que cada grupo aparece; as sem grupo vêm por último. */
export function groupResumeSkills(items: ResumeItem[]): { name?: string; items: ResumeItem[] }[] {
  const groups = new Map<string, ResumeItem[]>();
  const loose: ResumeItem[] = [];
  for (const item of items) {
    const name = item.group?.trim();
    if (!name) {
      loose.push(item);
      continue;
    }
    const list = groups.get(name) ?? [];
    list.push(item);
    groups.set(name, list);
  }
  const out: { name?: string; items: ResumeItem[] }[] = [...groups].map(([name, list]) => ({ name, items: list }));
  if (loose.length) out.push({ items: loose });
  return out;
}

/** Período do item ("jun. de 2026 – atual"). */
export function ResumePeriod({ item, ctx, className = "rb-card__meta rb-resume__period" }: { item: ResumeItem; ctx: Ctx; className?: string }) {
  if (!item.start && !item.end) return null;
  const month = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? ctx.formatDate(`${v}-01`, "month") : v);
  return (
    <p className={className}>
      {item.start && <time dateTime={item.start}>{month(item.start)}</time>}
      {" – "}
      {item.end ? <time dateTime={item.end}>{month(item.end)}</time> : ctx.t("resume.present")}
    </p>
  );
}

/** Descrição do item: texto rico (HTML), lista com "- " ou parágrafo. */
export function ResumeDescription({ text }: { text?: string }) {
  if (!text) return null;
  // HTML (texto rico do painel ou vindo da v1): o backend sanitiza ao gravar.
  if (isHtmlText(text)) return <Html html={text} className="rb-prose rb-resume__desc" />;
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

function Skills({ list, level }: { list: ResumeItem[]; level: Level }) {
  const groups = groupResumeSkills(list);
  // Sem nenhum grupo, uma lista só (como antes dos grupos).
  if (groups.length === 1 && !groups[0]!.name) {
    return (
      <ul className="rb-tags rb-tags--large">
        {list.map((i) => (
          <li key={i.id}>{i.title}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="rb-resume__skillGroups">
      {groups.map((g) => (
        <div key={g.name ?? ""} className="rb-resume__skillGroup">
          {g.name && (
            <ResumeHeading level={level} className="rb-resume__groupName">
              {g.name}
            </ResumeHeading>
          )}
          <ul className="rb-tags rb-tags--large">
            {g.items.map((i) => (
              <li key={i.id}>{i.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CurriculoBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<CurriculoFields, ResumeItem>) {
  const byKind = (kind: ResumeKind) => items.filter((i) => i.kind === kind);
  // Sem título no bloco, as seções sobem um nível (a página não pula de h1 para h3).
  const level = (fields.title ? headingLevel + 1 : headingLevel) as Level;
  const itemLevel = (level + 1) as Level;
  return (
    <Section id={id} anchor={fields.anchor} type="curriculo" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {fields.showDownload && island ? <div className="rb-island rb-resume__download">{island}</div> : null}
      {KINDS.map((kind) => {
        const list = byKind(kind);
        if (!list.length) return null;
        const chips = kind === "skill" || kind === "soft-skill";
        return (
          <section key={kind} className={`rb-resume__group rb-resume__group--${kind}`} aria-labelledby={`${id}-${kind}`}>
            <ResumeHeading level={level} id={`${id}-${kind}`} className="rb-resume__heading">
              {ctx.t(`resume.${kind}`)}
            </ResumeHeading>
            {chips ? (
              <Skills list={list} level={itemLevel} />
            ) : (
              <ul className="rb-resume__list">
                {list.map((i) => (
                  <li key={i.id} className="rb-card rb-resume__item">
                    <ResumeHeading level={itemLevel} className="rb-card__title">
                      {i.title}
                    </ResumeHeading>
                    {(i.organization || i.location) && <p className="rb-card__meta">{[i.organization, i.location].filter(Boolean).join(" · ")}</p>}
                    <ResumePeriod item={i} ctx={ctx} />
                    <ResumeDescription text={i.description} />
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
