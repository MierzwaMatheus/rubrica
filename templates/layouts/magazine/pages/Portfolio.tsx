import { usePortfolio } from "@/hooks/usePortfolio";
import { portfolioRepository } from "@/repositories/instances";
import { Masthead } from "../Masthead";

export default function Portfolio() {
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  if (isLoading) return null;
  const pad = 48;
  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags ?? [])));
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <Masthead page="Portfólio" issue="Index of Works" />
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 96, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}><em style={{ color: "var(--primary)" }}>Obras</em> Selecionadas</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 19, opacity: 0.7, marginTop: 14 }}>{projects.length} projetos · Curadoria pessoal</p>
      </div>
      <div style={{ padding: `0 ${pad}px ${pad - 12}px`, borderBottom: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.55, marginBottom: 12 }}>Filtrar por tecnologia ↓</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
          {allTags.map((tag, i) => (<span key={tag} style={{ padding: "4px 0", color: i === 0 ? "var(--primary)" : "var(--text)", borderBottom: i === 0 ? "2px solid var(--primary)" : "none", opacity: i === 0 ? 1 : 0.7, textTransform: "lowercase" }}>{tag}</span>))}
        </div>
      </div>
      <div style={{ padding: `${pad}px ${pad}px 0` }}>
        {projects.map((p, i) => {
          const flip = i % 2 === 1;
          return (
            <article key={p.id} style={{ display: "grid", gridTemplateColumns: flip ? "1fr 1.2fr" : "1.2fr 1fr", gap: 48, paddingBottom: 56, marginBottom: 56, borderBottom: i < projects.length - 1 ? "0.5px solid var(--text)" : "none", alignItems: "center" }}>
              <div style={{ order: flip ? 2 : 1, background: "var(--text)", opacity: 0.08, aspectRatio: "4/3" }} />
              <div style={{ order: flip ? 1 : 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 64, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.55 }}>Edição {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 44, fontWeight: 500, margin: "4px 0 14px", letterSpacing: "-0.01em", lineHeight: 1.05 }}>{p.title}</h2>
                <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 17, lineHeight: 1.5, opacity: 0.88, margin: "0 0 20px" }}>{p.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", borderTop: "0.5px solid var(--text)", paddingTop: 14 }}>
                  {(p.tags ?? []).map((t) => <span key={t} style={{ opacity: 0.7 }}>{t}</span>)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
