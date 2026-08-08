import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import { Masthead } from "../Masthead";

export default function Blog() {
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);
  if (isLoading) return null;
  const featured = featuredPosts[0] ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  const pad = 48;
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <Masthead page="Blog" issue="A Edição Editorial" />
      {featured && (<div style={{ padding: `${pad}px ${pad}px`, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 36, alignItems: "center" }}><div><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 14 }}>↘ Em Destaque</div><h1 style={{ fontFamily: "var(--font-sans)", fontSize: 96, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.92 }}>{featured.title}</h1><p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 24, lineHeight: 1.3, margin: "20px 0 24px", opacity: 0.9 }}>{featured.subtitle}</p></div><div style={{ background: "var(--text)", opacity: 0.08, aspectRatio: "4/5" }} /></div>)}
      <div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24, display: "flex", justifyContent: "space-between" }}><span>§ Sumário desta edição</span><span>{posts.length} artigos</span></div>
        {rest.map((p, i) => (<article key={p.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 240px 80px", gap: 28, padding: "24px 0", borderBottom: i < rest.length - 1 ? "0.5px dotted var(--text)" : "none", alignItems: "baseline" }}><div style={{ fontFamily: "var(--font-sans)", fontSize: 32, color: "var(--primary)", lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</div><div><h3 style={{ fontFamily: "var(--font-sans)", fontSize: 26, margin: "0 0 4px", fontWeight: 500, letterSpacing: "-0.01em" }}>{p.title}</h3><p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 14, opacity: 0.75, margin: 0 }}>{p.subtitle}</p></div><div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65 }}>{(p.tags ?? []).slice(0, 3).join(" · ")}</div><div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}><div>{p.published_at ? new Date(p.published_at).toLocaleDateString("pt-BR") : ""}</div></div></article>))}
      </div>
    </div>
  );
}
