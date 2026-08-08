import { useAbout } from "@/hooks/useAbout";
import { aboutRepository } from "@/repositories/instances";
import { Masthead } from "../Masthead";

export default function About() {
  const { dailyRoutine, faq, isLoading } = useAbout(aboutRepository);
  if (isLoading) return null;
  const pad = 48;
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <Masthead page="Sobre Mim" issue="Personal Essays" />
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 16 }}>↘ Ensaio Pessoal</div>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 92, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}>O cara da <em style={{ color: "var(--primary)" }}>tecnologia</em>,<br />fora do <em style={{ color: "var(--accent)" }}>computador</em>.</h1>
      </div>
      {dailyRoutine.length > 0 && (<div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)", borderBottom: "0.5px solid var(--text)" }}><div style={{ columns: 3, columnGap: 36, fontSize: 13.5, lineHeight: 1.7 }}>{dailyRoutine.map((item, i) => (<p key={item.id} style={{ margin: "0 0 14px" }}>{i === 0 && (<span style={{ fontFamily: "var(--font-sans)", fontSize: 72, lineHeight: 0.85, float: "left", marginRight: 10, marginTop: 6, color: "var(--primary)" }}>{item.description.charAt(0)}</span>)}{i === 0 ? item.description.slice(1) : item.description}</p>))}</div></div>)}
      {faq.length > 0 && (<div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 24, textAlign: "center" }}>✦ A Entrevista · {faq.length} perguntas, {faq.length} respostas ✦</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 40px" }}>{faq.map((item, i) => (<div key={item.id}><div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--primary)", marginBottom: 6 }}>P {String(i + 1).padStart(2, "0")}</div><h4 style={{ fontFamily: "var(--font-sans)", fontSize: 22, margin: "0 0 10px", fontWeight: 500, lineHeight: 1.2 }}>{item.question}</h4><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, opacity: 0.88, borderLeft: "2px solid var(--accent)", paddingLeft: 14 }}>{item.answer}</p></div>))}</div></div>)}
    </div>
  );
}
