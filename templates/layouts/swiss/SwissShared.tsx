import { Link, useLocation } from "wouter";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { homeRepository, sidebarRepository } from "@/repositories/instances";

const NAV_ITEMS = [
  { label: "Início", href: "/" },
  { label: "Currículo", href: "/curriculo" },
  { label: "Portfólio", href: "/portfolio" },
  { label: "Sobre Mim", href: "/sobre" },
  { label: "Blog", href: "/blog" },
];

export function SwissNav() {
  const [location] = useLocation();
  return (
    <nav
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        borderTop: "2px solid var(--text)",
        borderBottom: "2px solid var(--text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {NAV_ITEMS.map((it, i) => {
        const active = location === it.href || (it.href !== "/" && location.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              padding: "14px 18px",
              textDecoration: "none",
              color: active ? "var(--bg)" : "var(--text)",
              background: active ? "var(--text)" : "transparent",
              borderRight: i < NAV_ITEMS.length - 1 ? "1px solid var(--text)" : "none",
              display: "flex",
              alignItems: "baseline",
              gap: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                fontVariantNumeric: "tabular-nums",
                opacity: active ? 0.65 : 0.55,
              }}
            >
              .{String(i + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: active ? 800 : 600,
                letterSpacing: "-0.01em",
              }}
            >
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SwissCorners({ page, idx, total = 5 }: { page: string; idx: number; total?: number }) {
  const siteConfig = useSiteConfig();
  const authorParts = (siteConfig.author_name || "").split(" ");
  const surname = authorParts.slice(1).join(" ") || authorParts[0] || "";
  const year = new Date().getFullYear();

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 18,
          fontFamily: "var(--font-sans)",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--text)",
          zIndex: 1,
        }}
      >
        <span
          style={{
            background: "var(--primary)",
            color: "var(--bg)",
            padding: "2px 6px",
            marginRight: 6,
          }}
        >
          R
        </span>
        Rubrica / {surname} / {year}
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 18,
          fontFamily: "var(--font-sans)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--text)",
          textAlign: "right",
          zIndex: 1,
        }}
      >
        Folha {String(idx).padStart(2, "0")} / {String(total).padStart(2, "0")}
        <br />
        <span style={{ opacity: 0.55, fontWeight: 400 }}>cap. {page}</span>
      </div>
    </>
  );
}

export function SwissMasthead() {
  const siteConfig = useSiteConfig();
  const { contactRole } = useHome(homeRepository);
  const authorParts = (siteConfig.author_name || "").split(" ");
  const initial = authorParts[0]?.[0] ?? "";
  const surname = authorParts.slice(1).join(" ") || authorParts[0] || "";

  return (
    <div
      style={{
        padding: "46px 18px 18px",
        borderBottom: "2px solid var(--text)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        alignItems: "baseline",
        gap: 0,
      }}
    >
      <div style={{ gridColumn: "span 2" }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: 4,
          }}
        >
          Index — Portfólio Pessoal
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
          }}
        >
          <span
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              padding: "0 8px",
            }}
          >
            {initial}.
          </span>
          {surname}
        </div>
      </div>
      <div style={{ gridColumn: "span 2", textAlign: "right" }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: 4,
          }}
        >
          Cargo Atual
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {contactRole}
        </div>
      </div>
    </div>
  );
}

export function SwissFooter() {
  const { contactInfo } = useSidebar(sidebarRepository);

  return (
    <div
      style={{
        borderTop: "2px solid var(--text)",
        padding: "12px 18px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        fontFamily: "var(--font-sans)",
        fontSize: 10.5,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      <span>{contactInfo?.email ?? ""}</span>
      <span>{contactInfo?.phone ?? ""}</span>
      <span>github · linkedin · be</span>
      <span style={{ textAlign: "right", opacity: 0.6 }}>Grid 12 · Helvetica</span>
    </div>
  );
}

export function SwissGridLines({ cols = 12, color }: { cols?: number; color?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          style={{
            borderLeft:
              i > 0
                ? `0.5px dotted ${color ?? "color-mix(in oklab, var(--text) 18%, transparent)"}`
                : "none",
          }}
        />
      ))}
    </div>
  );
}

export function SwissShell({
  page,
  idx,
  children,
}: {
  page: string;
  idx: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        position: "relative",
        minHeight: "100%",
      }}
    >
      <SwissCorners page={page} idx={idx} />
      <SwissMasthead />
      <SwissNav />
      <div>{children}</div>
      <SwissFooter />
    </div>
  );
}
