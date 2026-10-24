import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { highlightNumbers } from "@/utils/homeContent";

const label = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "var(--accent)" };

/** Parágrafo com os números de resultado em destaque. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? <strong key={i} style={{ color: "var(--primary)", fontWeight: 600 }}>{seg.text}</strong> : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}

export default function About() {
  const { t } = useTranslation();
  const { dailyRoutine, faq, isLoading } = useAbout(aboutRepository);
  const { aboutText } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  if (isLoading) return null;
  const pad = 48;
  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text"));

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <div style={{ ...label, color: "var(--primary)", marginBottom: 16 }}>↘ Perfil</div>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(52px, 8vw, 92px)", fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}>
          Quem faz o <em style={{ color: "var(--primary)" }}>trabalho</em>,<br />e <em style={{ color: "var(--accent)" }}>como</em> ele é feito.
        </h1>
      </div>

      {/* 1. Resumo profissional */}
      {professional.length > 0 && (
        <div style={{ padding: `${pad}px ${pad}px`, borderTop: "2px solid var(--text)" }}>
          <div style={{ ...label, marginBottom: 24 }}>§ I · {t("about.professional.title")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40 }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 24, lineHeight: 1.4, margin: 0 }}>
              <span style={{ fontSize: 80, lineHeight: 0.82, float: "left", marginRight: 12, marginTop: 6, color: "var(--primary)" }}>{professional[0].charAt(0)}</span>
              <Highlighted text={professional[0].slice(1)} />
            </p>
            {professional.length > 1 && (
              <div style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.88 }}>
                {professional.slice(1).map((para, i) => (
                  <p key={i} style={{ margin: "0 0 14px" }}><Highlighted text={para} /></p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Metodologia de trabalho */}
      {principles.length > 0 && (
        <div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
          <div style={{ ...label, marginBottom: 28 }}>§ II · {t("about.principles.title")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {principles.map((p, i) => (
              <div key={p.title} style={{ borderTop: "0.5px solid var(--text)", paddingTop: 16 }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 44, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 22, margin: "12px 0 8px", fontWeight: 500, lineHeight: 1.2 }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Fora do trabalho: o lado pessoal, depois do profissional */}
      <div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}>
        <div style={{ ...label, marginBottom: 24, textAlign: "center" }}>✦ Ensaio Pessoal · {t("about.aboutMe.title")} ✦</div>
        <div style={{ maxWidth: 760, margin: "0 auto", fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 18, lineHeight: 1.6 }}>
          {personal.map((para, i) => <p key={i} style={{ margin: "0 0 14px" }}>{para}</p>)}
        </div>
      </div>

      {dailyRoutine.length > 0 && (<div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)", borderBottom: "0.5px solid var(--text)" }}><div style={{ columns: "3 240px", columnGap: 36, fontSize: 13.5, lineHeight: 1.7 }}>{dailyRoutine.map((item, i) => (<p key={item.id} style={{ margin: "0 0 14px" }}>{i === 0 && (<span style={{ fontFamily: "var(--font-sans)", fontSize: 72, lineHeight: 0.85, float: "left", marginRight: 10, marginTop: 6, color: "var(--primary)" }}>{item.description.charAt(0)}</span>)}{i === 0 ? item.description.slice(1) : item.description}</p>))}</div></div>)}
      {faq.length > 0 && (<div style={{ padding: `${pad}px ${pad}px`, borderTop: "0.5px solid var(--text)" }}><div style={{ ...label, marginBottom: 24, textAlign: "center" }}>✦ A Entrevista · {faq.length} perguntas, {faq.length} respostas ✦</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px 40px" }}>{faq.map((item, i) => (<div key={item.id}><div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--primary)", marginBottom: 6 }}>P {String(i + 1).padStart(2, "0")}</div><h4 style={{ fontFamily: "var(--font-sans)", fontSize: 22, margin: "0 0 10px", fontWeight: 500, lineHeight: 1.2 }}>{item.question}</h4><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, opacity: 0.88, borderLeft: "2px solid var(--accent)", paddingLeft: 14 }}>{item.answer}</p></div>))}</div></div>)}
    </div>
  );
}
