import { useState } from "react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";

function AsciiRule({ char = "─", label }: { char?: string; label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "14px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.7,
        color: "var(--text)",
      }}
    >
      {label ? (
        <>
          <span style={{ color: "var(--accent)" }}>{char.repeat(3)}</span>
          <span
            style={{
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            [ {label} ]
          </span>
          <span style={{ flex: 1, color: "var(--accent)", overflow: "hidden" }}>
            {char.repeat(200)}
          </span>
        </>
      ) : (
        <span style={{ flex: 1, overflow: "hidden" }}>{char.repeat(200)}</span>
      )}
    </div>
  );
}

function BrutPrompt({
  cmd,
  output,
  host = "user@rubrica",
}: {
  cmd: string;
  output?: React.ReactNode;
  host?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}
    >
      <div>
        <span style={{ color: "var(--accent)" }}>{host}</span>
        <span style={{ opacity: 0.7 }}>:~$ </span>
        <span style={{ color: "var(--primary)", fontWeight: 700 }}>{cmd}</span>
      </div>
      {output && <div style={{ marginTop: 6 }}>{output}</div>}
    </div>
  );
}

export default function Resume() {
  const { t } = useTranslation();
  const { getItemsByType } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill");
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const certs = getItemsByType("course");
  const volunteering = getItemsByType("volunteer");
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? [...recent, ...older] : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        padding: "24px 28px",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>
        // trajetória profissional · formação · habilidades
      </div>
      <h1
        style={{
          fontSize: "clamp(22px, 6.5vw, 28px)", overflowWrap: "anywhere",
          fontWeight: 700,
          margin: "4px 0 14px",
          letterSpacing: "-0.01em",
        }}
      >
        $ curriculum_vitae.md
      </h1>

      <AsciiRule label={t("resume.summary")} />
      <BrutPrompt
        cmd="cat summary.txt"
        output={
          <div style={{ paddingLeft: 14, borderLeft: "2px solid var(--accent)" }}>
            {summary && <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.65 }}>{summary}</p>}
          </div>
        }
      />
      {metrics.length > 0 && (
        <div data-m-cols="2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            border: "1px solid var(--text)",
            marginTop: 14,
          }}
        >
          {metrics.map((m, i) => (
            <div key={m.label} style={{ padding: "12px 14px", borderLeft: i === 0 ? "none" : "1px solid var(--text)" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", lineHeight: 1.1 }}>{m.value}</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={downloadCV}
        disabled={!canDownload}
        data-umami-event="resume-download-cv"
        style={{
          marginTop: 14,
          padding: "8px 16px",
          border: "2px solid var(--text)",
          background: "var(--text)",
          color: "var(--bg)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 700,
          cursor: canDownload ? "pointer" : "not-allowed",
          opacity: canDownload ? 1 : 0.5,
        }}
      >
        ↓ {t("resume.downloadCV")}
      </button>

      <AsciiRule label="experiência" />
      <BrutPrompt
        cmd="git log --oneline --graph"
        output={
          <pre
            style={{
              margin: "8px 0 0",
              fontSize: 12.5,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {visibleExperience.map((e, i) => {
              const c = e.translatedContent as {
                role?: string;
                company?: string;
                period?: string;
                description?: string;
              };
              return (
                <span key={e.id}>
                  <span style={{ color: "var(--primary)" }}>{"*"}</span>{" "}
                  <span
                    style={{
                      background:
                        i === 0 ? "var(--accent)" : "transparent",
                      color: i === 0 ? "var(--bg)" : "var(--text)",
                      padding: "0 4px",
                    }}
                  >
                    {c.period}
                  </span>{" "}
                  <span style={{ fontWeight: 700 }}>{c.role}</span>
                  <span style={{ opacity: 0.6 }}> @ {c.company}</span>
                  {"\n"}
                  {c.description && (
                    <span
                      style={{
                        display: "block",
                        fontSize: 11.5,
                        opacity: 0.8,
                        paddingLeft: 24,
                      }}
                      dangerouslySetInnerHTML={{ __html: c.description }}
                    />
                  )}
                  <span
                    style={{
                      display: "block",
                      opacity: 0.4,
                      fontSize: 11.5,
                    }}
                  >
                    │
                  </span>
                </span>
              );
            })}
          </pre>
        }
      />
      {older.length > 0 && (
        <button
          type="button"
          onClick={() => setShowOlder(v => !v)}
          style={{
            background: "transparent",
            border: "1px solid var(--text)",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          {showOlder ? `[-] ${t("resume.hideOlder")}` : `[+] ${t("resume.showOlder")} (${older.length})`}
        </button>
      )}

      <AsciiRule label="habilidades" />
      <div style={{ display: "grid", gap: 12 }}>
        {skillGroups.map((g) => (
          <div key={g.name}>
            <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
              <span style={{ color: "var(--accent)" }}>##</span> {g.name.toLowerCase()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 12 }}>
              {g.items.map((s) => {
                const c = s.translatedContent as { name?: string };
                return (
                  <span key={s.id} style={{ padding: "3px 8px", border: "1px solid var(--text)" }}>
                    <span style={{ color: "var(--accent)" }}>›</span> {c.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AsciiRule label="soft-skills" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 12 }}>
        {softSkills.map((s) => {
          const c = s.translatedContent as { name?: string; text?: string };
          const label = c.name ?? c.text ?? "";
          return (
            <span
              key={s.id}
              style={{ padding: "3px 8px", border: "1px solid var(--text)" }}
            >
              <span style={{ color: "var(--accent)" }}>#</span>
              {label.toLowerCase().replace(/\s/g, "-")}
            </span>
          );
        })}
      </div>

      <AsciiRule label="formação" />
      {education.map((e) => {
        const c = e.translatedContent as {
          degree?: string;
          school?: string;
          institution?: string;
          period?: string;
          items?: string[];
        };
        return (
          <div
            key={e.id}
            style={{
              padding: "12px 14px",
              border: "1px solid var(--text)",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  [edu]
                </span>{" "}
                <span style={{ fontWeight: 700 }}>{c.degree}</span>
                <span style={{ opacity: 0.7 }}>
                  {" @ "}
                  {c.school ?? c.institution}
                </span>
              </span>
              <span style={{ opacity: 0.6 }}>{c.period}</span>
            </div>
            {(c.items ?? []).map((it, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11.5,
                  opacity: 0.82,
                  marginTop: 6,
                  paddingLeft: 14,
                }}
              >
                <span style={{ color: "var(--accent)" }}>›</span> {it}
              </div>
            ))}
          </div>
        );
      })}

      <AsciiRule label="idiomas" />
      <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
        {languages.map((l) => {
          const c = l.translatedContent as { name?: string; level?: string };
          return (
            <div key={l.id}>
              <span style={{ fontWeight: 700 }}>{c.name}</span>
              <span style={{ opacity: 0.6 }}>
                {" = "}
                &ldquo;{c.level}&rdquo;
              </span>
            </div>
          );
        })}
      </div>

      <AsciiRule label="certs.list" />
      <div
        style={{ columns: 2, columnGap: 32, fontSize: 12, lineHeight: 1.8 }}
      >
        {certs.map((cert, i) => {
          const c = cert.translatedContent as { name?: string; text?: string };
          const label = c.name ?? c.text ?? "";
          return (
            <div key={cert.id} style={{ breakInside: "avoid" }}>
              <span style={{ opacity: 0.5 }}>
                {String(i + 1).padStart(2, "0")}.
              </span>{" "}
              <span style={{ color: "var(--accent)" }}>›</span> {label}
            </div>
          );
        })}
      </div>

      <AsciiRule label="voluntariado" />
      <pre
        style={{ margin: 0, fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}
      >
        {volunteering.map((v, i) => {
          const c = v.translatedContent as { name?: string; text?: string };
          const label = c.name ?? c.text ?? "";
          return (
            <span key={v.id}>
              <span style={{ color: "var(--primary)" }}>
                [{String(i + 1).padStart(2, "0")}]
              </span>{" "}
              {label}
              {"\n"}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
