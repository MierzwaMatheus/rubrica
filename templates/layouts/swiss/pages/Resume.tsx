import { useState } from "react";
import { Download } from "lucide-react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissResume() {
  const { t } = useTranslation();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const courses = getItemsByType("course");
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const softSkills = getItemsByType("soft_skill");
  const volunteering = getItemsByType("volunteer");
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));
  const stats =
    metrics.length > 0
      ? metrics.map((m) => ({ n: m.value, label: m.label }))
      : [
          { n: String(experience.length), label: "cargos" },
          { n: String(skills.length), label: "skills" },
          { n: String(courses.length), label: "certs" },
        ];

  return (
    <SwissShell page="Currículo" idx={2}>
      {/* Header */}
      <div
        style={{
          padding: "40px 18px",
          borderBottom: "2px solid var(--text)",
          position: "relative",
        }}
      >
        <SwissGridLines cols={12} />
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 12,
          }}
        >
          <div
            style={{
              gridColumn: "span 2",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Folha 02
            <br />
            de 05
          </div>
          <h1
            style={{
              gridColumn: "span 7",
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              margin: 0,
              lineHeight: 0.9,
            }}
          >
            Curriculum
            <br />
            <span
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "0 8px",
              }}
            >
              Vitæ.
            </span>
          </h1>
          <div
            style={{
              gridColumn: "span 3",
              fontSize: 13,
              lineHeight: 1.5,
              alignSelf: "end",
            }}
          >
            {summary ? (
              <p style={{ margin: 0 }}>{summary}</p>
            ) : (
              <p style={{ margin: 0 }}>
                {experience.length} cargos, {skills.length} habilidades e {courses.length} certificações.
              </p>
            )}
            <button
              type="button"
              onClick={downloadCV}
              disabled={!canDownload}
              data-umami-event="resume-download-cv"
              style={{
                marginTop: 16,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                background: "var(--text)",
                color: "var(--bg)",
                border: "2px solid var(--text)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: canDownload ? "pointer" : "not-allowed",
                opacity: canDownload ? 1 : 0.5,
              }}
            >
              <Download size={14} strokeWidth={3} /> {t("resume.downloadCV")}
            </button>
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          borderBottom: "2px solid var(--text)",
        }}
      >
        {stats.map((s, i) => {
          const tint = i === 0 ? "var(--primary)" : i === 1 ? "var(--accent)" : null;
          return (
          <div
            key={i}
            style={{
              padding: "24px 18px",
              borderRight: i < stats.length - 1 ? "1px solid var(--text)" : "none",
              background: tint ?? "transparent",
              color: tint ? "var(--bg)" : "var(--text)",
            }}
          >
            <div
              style={{
                fontSize: metrics.length > 0 ? 44 : 60,
                fontWeight: 900,
                lineHeight: 0.85,
                letterSpacing: "-0.04em",
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              {s.label}
            </div>
          </div>
          );
        })}
      </div>

      {/* Experience */}
      <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          .04 — Experiência Profissional
        </div>
        {visibleExperience.map((exp, i) => {
          const c = exp.translatedContent as {
            role?: string;
            company?: string;
            period?: string;
            description?: string;
          };
          return (
            <div
              key={exp.id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 200px 1fr",
                gap: 18,
                padding: "24px 0",
                borderTop: "1px solid var(--text)",
                borderBottom:
                  i === visibleExperience.length - 1 ? "1px solid var(--text)" : "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    lineHeight: 0.85,
                    color: "var(--primary)",
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginTop: 8,
                    opacity: 0.7,
                  }}
                >
                  {c.period}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {c.role}
                </div>
                <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>
                  @ {c.company}
                </div>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: c.description ?? "" }}
                style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.85 }}
              />
            </div>
          );
        })}
        {older.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOlder((v) => !v)}
            style={{
              marginTop: 16,
              background: "transparent",
              color: "var(--text)",
              border: "1px solid var(--text)",
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
          </button>
        )}
      </div>

      {/* Skills */}
      <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            .05 — Stack
          </div>
          <h3
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {skills.length} ferramentas, organizadas por área.
          </h3>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          {skillGroups.map((g, gi) => (
            <div key={g.name} style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 24, borderTop: "1px solid var(--text)", paddingTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
                <span style={{ color: "var(--primary)", marginRight: 8 }}>{String(gi + 1).padStart(2, "0")}</span>
                {g.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.items.map((s, i) => {
                  const sc = s.translatedContent as { name?: string };
                  const strong = gi === 0 && i === 0;
                  return (
                    <span
                      key={s.id}
                      style={{
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        background: strong ? "var(--primary)" : "transparent",
                        color: strong ? "var(--bg)" : "var(--text)",
                        border: strong ? "1px solid var(--primary)" : "1px solid color-mix(in oklab, var(--text) 30%, transparent)",
                      }}
                    >
                      {sc.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formação + Idiomas + Soft */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .06 — Formação
          </div>
          {education.map((e, i) => {
            const ec = e.translatedContent as {
              degree?: string;
              period?: string;
              school?: string;
              items?: string[];
            };
            return (
              <div
                key={e.id}
                style={{
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom:
                    i < education.length - 1
                      ? "1px solid color-mix(in oklab, var(--text) 20%, transparent)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ec.degree}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.6,
                    }}
                  >
                    {ec.period}
                  </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{ec.school}</div>
                {(ec.items ?? []).map((it, j) => (
                  <p
                    key={j}
                    style={{
                      fontSize: 11,
                      lineHeight: 1.5,
                      opacity: 0.7,
                      margin: "6px 0 0",
                    }}
                  >
                    {it}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .07 — Idiomas
          </div>
          {languages.map((l) => {
            const lc = l.translatedContent as { name?: string; level?: string };
            return (
              <div
                key={l.id}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    "1px solid color-mix(in oklab, var(--text) 18%, transparent)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {lc.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  {lc.level}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "30px 18px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .08 — Soft Skills
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {softSkills.map((s) => {
              const sc = s.translatedContent as { text?: string } | string;
              const label = typeof sc === "string" ? sc : sc.text ?? "";
              return (
                <span
                  key={s.id}
                  style={{
                    padding: "3px 8px",
                    background:
                      "color-mix(in oklab, var(--bg) 75%, var(--text) 25%)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cursos + Voluntariado */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .09 — Cursos &amp; Certs ({courses.length})
          </div>
          <div
            style={{ columns: 2, columnGap: 18, fontSize: 11, lineHeight: 1.75 }}
          >
            {courses.map((c, i) => {
              const label =
                typeof c.translatedContent === "string"
                  ? c.translatedContent
                  : (c.translatedContent as { text?: string; name?: string })?.text ??
                    (c.translatedContent as { text?: string; name?: string })?.name ??
                    "";
              return (
                <div
                  key={c.id}
                  style={{ breakInside: "avoid", display: "flex", gap: 8 }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      opacity: 0.5,
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 24,
                    }}
                  >
                    .{String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "30px 18px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .10 — Voluntariado
          </div>
          {volunteering.map((v, i) => {
            const label =
              typeof v.translatedContent === "string"
                ? v.translatedContent
                : (v.translatedContent as { text?: string })?.text ?? "";
            return (
              <div
                key={v.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < volunteering.length - 1
                      ? "1px solid color-mix(in oklab, var(--text) 18%, transparent)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontWeight: 700, opacity: 0.6 }}>
                    .{String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SwissShell>
  );
}
