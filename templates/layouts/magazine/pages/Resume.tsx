import DOMPurify from "dompurify";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, resumeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills } from "@/utils/resumeContent";

export default function Resume() {
  const { t } = useTranslation();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  if (isLoading) return null;
  const summary = splitParagraphs(aboutText ?? "")[0];
  const experience = getItemsByType("experience");
  const skillGroups = groupSkills(getItemsByType("skill"), t("resume.stack"));
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const certs = [...getItemsByType("cert"), ...getItemsByType("course")];
  const volunteering = getItemsByType("volunteer");
  const softSkills = getItemsByType("soft_skill");
  const pad = 48;
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 96, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}>
          <em style={{ color: "var(--primary)" }}>Curriculum</em> Vitæ
        </h1>
      </div>
      {/* Resumo: quem sou, números de prova e o PDF */}
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "2px solid var(--text)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "start" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>§ · {t("resume.summary")}</div>
          {summary && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 20, lineHeight: 1.5, margin: 0 }}>
              <span style={{ fontSize: 64, lineHeight: 0.85, float: "left", marginRight: 10, marginTop: 4, color: "var(--primary)" }}>{summary.charAt(0)}</span>
              {summary.slice(1)}
            </p>
          )}
          <button
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
            style={{ marginTop: 24, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", padding: "12px 20px", background: "var(--primary)", color: "var(--bg)", border: "none", cursor: canDownload ? "pointer" : "default", opacity: canDownload ? 1 : 0.5 }}
          >
            ↓ {t("resume.downloadCV")}
          </button>
        </div>
        {metrics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "0.5px solid var(--text)" }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ padding: "18px 0 16px", borderBottom: "0.5px solid var(--text)" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 38, lineHeight: 1, fontWeight: 500, color: "var(--primary)" }}>{m.value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 8, opacity: 0.75, paddingRight: 12 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 28 }}>§ I · Trajetória Profissional</div>
        {experience.map((item, idx) => {
          const c = item.translatedContent as { role?: string; company?: string; period?: string; description?: string; groups?: Array<{ title: string; items: string[] }>; items?: string[] };
          return (
            <article key={item.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 32, paddingBottom: 32, marginBottom: 32, borderBottom: idx < experience.length - 1 ? "0.5px solid var(--text)" : "none" }}>
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 38, lineHeight: 1, color: "var(--primary)", fontWeight: 500 }}>{String(idx + 1).padStart(2, "0")}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 12, opacity: 0.7 }}>{c.period}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontStyle: "italic", marginTop: 4 }}>{c.company}</div>
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 30, margin: "0 0 16px", fontWeight: 500, lineHeight: 1.1 }}>{c.role}</h3>
                {c.groups ? c.groups.map((g) => (
                  <div key={g.title} style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>{g.title}</div>
                    {g.items.map((it, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px", opacity: 0.88 }}>{it}</p>)}
                  </div>
                )) : c.items?.length ? c.items.map((it, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px", opacity: 0.88 }}>{it}</p>) : c.description ? (
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, opacity: 0.88, paddingLeft: 18 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.description) }} />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 28 }}>§ II · Catálogo de Habilidades</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "28px 36px" }}>
          {skillGroups.map((group) => (
            <div key={group.name}>
              <div style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 20, paddingBottom: 8, borderBottom: "0.5px solid var(--text)" }}>{group.name}</div>
              {group.items.map((item) => {
                const c = item.translatedContent as { name?: string };
                return (
                  <div key={item.id} style={{ padding: "8px 0", borderBottom: "0.5px dotted var(--text)", fontFamily: "var(--font-sans)", fontSize: 14 }}>{c.name}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24 }}>§ III · Formação Acadêmica</div>
          {education.map((item) => {
            const c = item.translatedContent as { degree?: string; school?: string; institution?: string; period?: string; description?: string; items?: string[] };
            return (
              <div key={item.id} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h4 style={{ fontFamily: "var(--font-sans)", fontSize: 22, margin: 0, fontWeight: 500 }}>{c.degree} {(c.institution ?? c.school) && <span style={{ fontStyle: "italic", opacity: 0.65 }}>· {c.institution ?? c.school}</span>}</h4>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.6 }}>{c.period}</span>
                </div>
                {c.items?.length ? c.items.map((it, i) => <p key={i} style={{ fontSize: 12.5, lineHeight: 1.55, margin: "8px 0 0", opacity: 0.82 }}>{it}</p>) : c.description ? <div style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 8, opacity: 0.82, paddingLeft: 18 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.description) }} /> : null}
              </div>
            );
          })}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24 }}>§ IV · Idiomas</div>
          {languages.map((item) => {
            const c = item.translatedContent as { name?: string; level?: string };
            return (
              <div key={item.id} style={{ padding: "14px 0", borderBottom: "0.5px solid var(--text)" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 22 }}>{c.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.6, marginTop: 2 }}>{c.level}</div>
              </div>
            );
          })}
          {softSkills.length > 0 && (<><div style={{ marginTop: 24, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>Soft Skills</div><p style={{ fontSize: 12.5, lineHeight: 1.7, fontFamily: "var(--font-sans)", fontStyle: "italic", opacity: 0.85 }}>{softSkills.map((s) => { const c = s.translatedContent as { name?: string; text?: string }; return c.text ?? c.name; }).filter(Boolean).join(" · ")}.</p></>)}
        </div>
      </div>
      {certs.length > 0 && (<div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>§ V · Índice de Certificações &amp; Cursos</div><div style={{ columns: "2 260px", columnGap: 36, fontSize: 12.5, lineHeight: 1.9 }}>{certs.map((item, i) => { const c = item.translatedContent as { name?: string; text?: string }; return (<div key={item.id} style={{ breakInside: "avoid" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.5, marginRight: 10 }}>{String(i + 1).padStart(2, "0")}</span>{c.text ?? c.name}</div>); })}</div></div>)}
      {volunteering.length > 0 && (<div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>§ VI · Voluntariado</div>{volunteering.map((item, i) => { const c = item.translatedContent as { name?: string; text?: string; description?: string }; return (<div key={item.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < volunteering.length - 1 ? "0.5px dotted var(--text)" : "none" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.5, width: 24 }}>{String(i + 1).padStart(2, "0")}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 16 }}>{c.text ?? c.name ?? c.description}</span></div>); })}</div>)}
    </div>
  );
}
