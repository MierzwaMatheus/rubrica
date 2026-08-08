import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { homeRepository, sidebarRepository } from "@/repositories/instances";
import { Github, Linkedin, Mail, Phone, Quote } from "lucide-react";
import { Link } from "wouter";

function BentoCard({
  children,
  span = "auto",
  tint,
  padding = 22,
  radius = 22,
  style = {},
}: {
  children: React.ReactNode;
  span?: number | "auto";
  tint?: string;
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        gridColumn: span === "auto" ? "auto" : `span ${span}`,
        background: tint || "color-mix(in srgb, var(--text) 10%, var(--bg))",
        borderRadius: radius,
        padding,
        border: "0.5px solid color-mix(in srgb, var(--text) 20%, transparent)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function BentoHome() {
  const { contactRole, aboutText, services, testimonials } = useHome(homeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);

  const ownerFirstName = contactInfo?.name?.split(" ")[0] ?? "";
  const email = contactInfo?.email ?? "";
  const phone = contactInfo?.phone ?? "";
  const showEmail = !!(contactInfo?.show_email && email);
  const showPhone = !!(contactInfo?.show_phone && phone);
  const gap = 14;

  return (
    <div
      style={{
        paddingTop: 84,
        paddingBottom: 110,
        paddingLeft: 28,
        paddingRight: 28,
        boxSizing: "border-box",
      }}
    >
      {/* Row 1 — Hero (large) + profile sidebar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(80px, auto)",
          gap,
          marginBottom: gap,
        }}
      >
        {/* Hero card */}
        <BentoCard
          span={8}
          padding={36}
          style={{
            gridRow: "span 2",
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--accent) 200%)",
            color: "var(--bg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginBottom: 14,
            }}
          >
            $ whoami
          </div>
          <h1
            style={{
              fontSize: 76,
              lineHeight: 0.95,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Oi! Eu sou
            <br />o{" "}
            <em
              style={{
                fontStyle: "normal",
                background: "var(--bg)",
                color: "var(--primary)",
                padding: "0 12px",
                borderRadius: 12,
              }}
            >
              {ownerFirstName}
            </em>
          </h1>
          <div
            style={{
              marginTop: 24,
              fontSize: 17,
              fontWeight: 500,
              opacity: 0.95,
              maxWidth: 480,
            }}
          >
            {contactRole}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: 520,
              opacity: 0.85,
            }}
          >
            {aboutText}
          </div>
        </BentoCard>

        {/* Profile card */}
        <BentoCard span={4} padding={24} style={{ alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--bg)",
            }}
          >
            {contactInfo?.name
              ?.split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("") ?? ""}
          </div>
          <div style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>
            {contactInfo?.name ?? ""}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {contactInfo?.github_url && (
              <a
                href={contactInfo.github_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--text) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Github size={15} />
              </a>
            )}
            {contactInfo?.linkedin_url && (
              <a
                href={contactInfo.linkedin_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--text) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Linkedin size={15} />
              </a>
            )}
          </div>
        </BentoCard>

        {/* Contact cards */}
        {showEmail && (
          <BentoCard
            span={2}
            padding={18}
            tint="var(--accent)"
            style={{ color: "var(--text)" }}
          >
            <Mail size={18} />
            <div style={{ fontSize: 10.5, marginTop: 8, opacity: 0.75 }}>contato</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{email}</div>
          </BentoCard>
        )}
        {showPhone && (
          <BentoCard span={2} padding={18}>
            <Phone size={18} />
            <div style={{ fontSize: 10.5, marginTop: 8, opacity: 0.6 }}>whatsapp</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{phone}</div>
          </BentoCard>
        )}
      </div>

      {/* Services / Capabilities — grid 2x2 */}
      {services.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap,
            marginBottom: gap,
          }}
        >
          {services.slice(0, 4).map((s, i) => (
            <BentoCard
              key={s.title}
              padding={26}
              style={i === 0 ? { background: "color-mix(in srgb, var(--text) 10%, transparent)" } : {}}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "var(--primary)",
                    color: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    opacity: 0.5,
                  }}
                >
                  0{i + 1} / {String(services.slice(0, 4).length).padStart(2, "0")}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 19,
                  margin: "0 0 10px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: 12.8, lineHeight: 1.55, margin: 0, opacity: 0.78 }}>
                {s.description}
              </p>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap,
          }}
        >
          <BentoCard
            span={6}
            padding={28}
            tint="var(--primary)"
            style={{ color: "var(--bg)" }}
          >
            <Quote size={26} />
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                margin: "14px 0 18px",
                fontStyle: "italic",
              }}
            >
              "{testimonials[0].text.slice(0, 220)}
              {testimonials[0].text.length > 220 ? "…" : ""}"
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--bg) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {testimonials[0].name[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{testimonials[0].name}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{testimonials[0].role}</div>
              </div>
            </div>
          </BentoCard>
          {testimonials.slice(1, 4).map((t) => (
            <BentoCard key={t.name} span={2} padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {t.name[0]}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700 }}>{t.name}</div>
              </div>
              <p style={{ fontSize: 11.5, lineHeight: 1.45, margin: "10px 0 0", opacity: 0.75 }}>
                "{t.text.slice(0, 110)}
                {t.text.length > 110 ? "…" : ""}"
              </p>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Navigation links */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: gap * 2,
        }}
      >
        {[
          { label: "Currículo", to: "/resume" },
          { label: "Portfólio", to: "/portfolio" },
          { label: "Sobre Mim", to: "/about" },
          { label: "Blog", to: "/blog" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, var(--text) 20%, transparent)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
