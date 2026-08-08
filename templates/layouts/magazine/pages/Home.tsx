import { useHome } from "@/hooks/useHome";
import { homeRepository } from "@/repositories/instances";
import { Masthead } from "../Masthead";

export default function Home() {
  const { contactRole, services, testimonials, isLoading } = useHome(homeRepository);

  if (isLoading) return null;

  const pad = 48;

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <Masthead page="Início" issue="A Edição do Engenheiro" />

      {/* Hero */}
      <div style={{ padding: `${pad + 12}px ${pad}px ${pad}px`, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: pad, alignItems: "end" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 14 }}>
            ↘ Reportagem de Capa
          </div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 124, lineHeight: 0.92, margin: 0, letterSpacing: "-0.03em", fontWeight: 500 }}>
            {contactRole}
          </h1>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 26, lineHeight: 1.25, marginTop: 28, color: "var(--text)", borderLeft: "2px solid var(--accent)", paddingLeft: 18 }}>
            {testimonials[0]?.text}
          </p>
        </div>
      </div>

      {/* Capabilities / Services */}
      <div style={{ textAlign: "center", padding: `${pad + 8}px 0 ${pad - 12}px`, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--text)", opacity: 0.5 }}>
        ✦ ✦ ✦ &nbsp; Dossiê de Capacidades &nbsp; ✦ ✦ ✦
      </div>

      <div style={{ padding: `0 ${pad}px`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        {services.map((s, i) => (
          <article key={s.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 16, paddingBottom: 32, borderBottom: "0.5px solid var(--text)" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 56, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 24, margin: "0 0 8px", lineHeight: 1.15, fontWeight: 500 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>{s.description}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ textAlign: "center", padding: `${pad + 8}px 0 ${pad - 8}px`, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--text)", opacity: 0.5 }}>
        ✦ ✦ ✦ &nbsp; Vozes do Campo &nbsp; ✦ ✦ ✦
      </div>

      {testimonials[0] && (
        <div style={{ padding: `${pad - 8}px ${pad + 40}px`, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 34, lineHeight: 1.3, color: "var(--text)" }}>
            "{testimonials[0].text}"
          </div>
          <div style={{ marginTop: 24, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)" }}>
            — {testimonials[0].name}, {testimonials[0].role}
          </div>
        </div>
      )}

      <div style={{ padding: `${pad - 8}px ${pad}px 0`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, borderTop: "0.5px solid var(--text)", paddingTop: 32 }}>
        {testimonials.slice(1).map((t) => (
          <div key={t.id}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 28, lineHeight: 0.9, color: "var(--primary)", marginBottom: 8 }}>"</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "0 0 14px", opacity: 0.85, fontStyle: "italic" }}>{t.text.slice(0, 220)}…</p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", borderTop: "0.5px solid var(--text)", paddingTop: 10 }}>
              <div style={{ color: "var(--text)" }}>{t.name}</div>
              <div style={{ opacity: 0.55, marginTop: 2 }}>{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
