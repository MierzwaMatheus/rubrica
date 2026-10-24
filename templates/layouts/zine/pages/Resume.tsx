import { useState } from "react";
import { Download } from "lucide-react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { homeRepository, resumeRepository } from "@/repositories/instances";
import {
  HandTitle,
  Letter,
  PostIt,
  Sticker,
  Tape,
  TicketFace,
  stickerValueSize,
  tilt,
  tiltAt,
  useZineCopy,
  type PaperTone,
} from "@/components/ZineShared";

type Content = Record<string, unknown> | string | undefined;

/** Lê um campo de texto do conteúdo do item (que pode ser objeto ou string pura). */
function field(content: Content, ...keys: string[]): string {
  if (typeof content === "string") return keys.includes("text") || keys.includes("name") ? content : "";
  if (!content) return "";
  for (const k of keys) {
    const v = content[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

const METRIC_TONES: PaperTone[] = ["primary", "ink", "tape", "paper"];
const GROUP_TONES: PaperTone[] = ["tape", "paper", "subtle", "primary"];

/** Ficha simples (formação, idiomas, cursos, voluntariado). Some quando não há itens. */
function Card({ title, deg, children }: { title: string; deg: number; children: React.ReactNode }) {
  return (
    <section className="zn-note zn-tilt" style={tilt(deg)}>
      <Tape />
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function ZineResume() {
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill");
  const languages = getItemsByType("language");
  const education = getItemsByType("education");
  const courses = getItemsByType("course");
  const volunteering = getItemsByType("volunteer");

  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  const cards: Array<{ key: string; title: string; items: React.ReactNode[] }> = [
    {
      key: "education",
      title: t("resume.education"),
      items: education.map((e) => {
        const c = e.translatedContent as Content;
        const desc = field(c, "description");
        return (
          <li key={e.id}>
            <strong>{field(c, "degree", "name")}</strong>
            <div className="zn-sub">
              {[field(c, "institution", "school"), field(c, "period")].filter(Boolean).join(" · ")}
            </div>
            {desc && <div className="zn-rich zn-muted" dangerouslySetInnerHTML={{ __html: desc }} />}
          </li>
        );
      }),
    },
    {
      key: "languages",
      title: t("resume.languages"),
      items: languages.map((l) => {
        const c = l.translatedContent as Content;
        const level = field(c, "level");
        return (
          <li key={l.id}>
            <strong>{field(c, "name", "text")}</strong>
            {level && <span className="zn-sub"> · {level}</span>}
          </li>
        );
      }),
    },
    {
      key: "courses",
      title: t("resume.courses"),
      items: courses.map((c) => <li key={c.id}>{field(c.translatedContent as Content, "text", "name")}</li>),
    },
    {
      key: "volunteer",
      title: t("resume.volunteer"),
      items: volunteering.map((v) => <li key={v.id}>{field(v.translatedContent as Content, "text", "name")}</li>),
    },
  ].filter((card) => card.items.length > 0);

  return (
    <div className="zn-wrap">
      {/* Cabeçalho: título à mão, resumo numa tira de papel e o ingresso do PDF */}
      <header className="zn-pagehead">
        <div>
          <p className="zn-kicker">{copy.resumeKicker}</p>
          <HandTitle as="h1">{t("resume.title")}</HandTitle>
          {summary && (
            <p className="zn-paperstrip zn-tilt" style={tilt(-1, { fontSize: "clamp(18px, 1.9vw, 22px)", fontWeight: 600, maxWidth: "52ch", marginTop: 18 })}>
              {summary}
            </p>
          )}
        </div>
        <div className="zn-pagehead-aside">
          <button
            type="button"
            className="zn-ticket zn-tilt"
            style={tilt(2)}
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
          >
            <TicketFace tone="primary" stub="PDF">
              <Download size={16} aria-hidden="true" /> {t("resume.downloadCV")}
            </TicketFace>
          </button>
        </div>
      </header>

      {/* Números de destaque como adesivos */}
      {metrics.length > 0 && (
        <section className="zn-sec" aria-label={copy.numbers} style={{ paddingBottom: 20 }}>
          <ul className="zn-stickers zn-list">
            {metrics.map((m, i) => (
              <Sticker key={`${m.value}-${m.label}`} as="li" tone={METRIC_TONES[i % METRIC_TONES.length]} deg={tiltAt(i, 3)}>
                <b style={{ fontSize: stickerValueSize(m.value) }}>{m.value}</b>
                <small>{m.label}</small>
              </Sticker>
            ))}
          </ul>
        </section>
      )}

      {/* Experiências: folha datilografada em papel pautado */}
      {experience.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-exp">
          <HandTitle id="zn-exp">{copy.experience}</HandTitle>
          <Letter deg={-0.5}>
            <ol className="zn-exp">
              {visibleExperience.map((exp) => {
                const c = exp.translatedContent as Content;
                const desc = field(c, "description");
                return (
                  <li key={exp.id}>
                    <div className="zn-exp-head">
                      <h3>
                        {field(c, "role")}
                        {field(c, "company") && <span style={{ fontWeight: 400 }}> @ {field(c, "company")}</span>}
                      </h3>
                      {field(c, "period") && <span className="zn-muted">{field(c, "period")}</span>}
                    </div>
                    {desc && <div className="zn-exp-desc" dangerouslySetInnerHTML={{ __html: desc }} />}
                  </li>
                );
              })}
            </ol>
          </Letter>
          {older.length > 0 && (
            <div className="zn-handlinks">
              <button type="button" className="zn-handlink" aria-expanded={showOlder} onClick={() => setShowOlder((v) => !v)}>
                {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Habilidades: um post-it por grupo, mais as soft skills */}
      {(skillGroups.length > 0 || softSkills.length > 0) && (
        <section className="zn-sec" aria-labelledby="zn-skills">
          <HandTitle id="zn-skills">{t("resume.skills")}</HandTitle>
          <ul className="zn-postits">
            {skillGroups.map((g, gi) => (
              <PostIt key={g.name} as="li" tone={GROUP_TONES[gi % GROUP_TONES.length]} deg={tiltAt(gi, 1.2)}>
                <h3>{g.name}</h3>
                <ul className="zn-skill-list">
                  {g.items.map((s) => (
                    <li key={s.id}>{field(s.translatedContent as Content, "name", "text")}</li>
                  ))}
                </ul>
              </PostIt>
            ))}
            {softSkills.length > 0 && (
              <PostIt as="li" tone="paper" deg={tiltAt(skillGroups.length, 1.2)}>
                <h3>{t("resume.softSkills")}</h3>
                <ul className="zn-skill-list">
                  {softSkills.map((s) => (
                    <li key={s.id}>{field(s.translatedContent as Content, "text", "name")}</li>
                  ))}
                </ul>
              </PostIt>
            )}
          </ul>
        </section>
      )}

      {/* Idiomas, formação, cursos e voluntariado: fichas presas com fita */}
      {cards.length > 0 && (
        <div className="zn-sec">
          <div className="zn-notes">
            {cards.map((card, i) => (
              <Card key={card.key} title={card.title} deg={tiltAt(i + 1, 0.9)}>
                <ul className="zn-plain">{card.items}</ul>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
