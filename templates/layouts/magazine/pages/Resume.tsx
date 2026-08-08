import { useResume } from "@/hooks/useResume";
import { resumeRepository } from "@/repositories/instances";
import { Masthead } from "../Masthead";

export default function Resume() {
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  if (isLoading) return null;
  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const certs = getItemsByType("cert");
  const volunteering = getItemsByType("volunteer");
  const softSkills = getItemsByType("soft_skill");
  const pad = 48;
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <Masthead page="Currículo" issue="A Crônica Profissional" />
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 96, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}>
          <em style={{ color: "var(--primary)" }}>Curriculum</em> Vitæ
        </h1>
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 28 }}>§ I · Trajetória Profissional</div>
        {experience.map((item, idx) => {
          const c = item.translatedContent as { role?: string; company?: string; period?: string; groups?: Array<{ title: string; items: string[] }>; items?: string[] };
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
                )) : (c.items ?? []).map((it, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px", opacity: 0.88 }}>{it}</p>)}
              </div>
            </article>
          );
        })}
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 28 }}>§ II · Catálogo de Habilidades</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 36px" }}>
          {skills.map((item) => {
            const c = item.translatedContent as { name?: string; level?: number };
            return (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: "0.5px dotted var(--text)" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}>{c.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: (c.level ?? 0) >= 85 ? 1 : (c.level ?? 0) >= 60 ? 0.7 : 0.4 }}>{c.level}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 48 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24 }}>§ III · Formação Acadêmica</div>
          {education.map((item) => {
            const c = item.translatedContent as { degree?: string; school?: string; period?: string; items?: string[] };
            return (
              <div key={item.id} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h4 style={{ fontFamily: "var(--font-sans)", fontSize: 22, margin: 0, fontWeight: 500 }}>{c.degree} <span style={{ fontStyle: "italic", opacity: 0.65 }}>· {c.school}</span></h4>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.6 }}>{c.period}</span>
                </div>
                {(c.items ?? []).map((it, i) => <p key={i} style={{ fontSize: 12.5, lineHeight: 1.55, margin: "8px 0 0", opacity: 0.82 }}>{it}</p>)}
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
          {softSkills.length > 0 && (<><div style={{ marginTop: 24, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>Soft Skills</div><p style={{ fontSize: 12.5, lineHeight: 1.7, fontFamily: "var(--font-sans)", fontStyle: "italic", opacity: 0.85 }}>{softSkills.map((s) => (s.translatedContent as { name?: string }).name).join(" · ")}.</p></>)}
        </div>
      </div>
      {certs.length > 0 && (<div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20 }}>§ V · Índice de Certificações &amp; Cursos</div><div style={{ columns: 2, columnGap: 36, fontSize: 12.5, lineHeight: 1.9 }}>{certs.map((item, i) => { const c = item.translatedContent as { name?: string }; return (<div key={item.id} style={{ breakInside: "avoid" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.5, marginRight: 10 }}>{String(i + 1).padStart(2, "0")}</span>{c.name}</div>); })}</div></div>)}
      {volunteering.length > 0 && (<div style={{ padding: `${pad - 12}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>§ VI · Voluntariado</div>{volunteering.map((item, i) => { const c = item.translatedContent as { name?: string; description?: string }; return (<div key={item.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < volunteering.length - 1 ? "0.5px dotted var(--text)" : "none" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.5, width: 24 }}>{String(i + 1).padStart(2, "0")}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 16 }}>{c.name ?? c.description}</span></div>); })}</div>)}
    </div>
  );
}
