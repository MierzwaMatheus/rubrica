import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { useSidebar } from "@/hooks/useSidebar";
import { sidebarRepository } from "@/repositories/instances";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { isActivePath, useDesktopCopy, useDesktopNav } from "./DesktopShared";

/** Hora real, atualizada a cada 15 segundos. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function Clock() {
  const { locale } = useI18n();
  const now = useNow();
  const weekday = now.toLocaleDateString(locale, { weekday: "short" }).replace(/\.$/, "");
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return (
    <time className="dk-clock" dateTime={now.toISOString()}>
      <span className="dk-weekday">{weekday} </span>
      {time}
    </time>
  );
}

/**
 * Barra de menu fixa no topo, como num sistema de 1998: marca "◆ <nome> OS", itens de
 * navegação, relógio e a alternância de modo. No celular, os itens vão para um menu.
 */
export function DesktopMenuBar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const nav = useDesktopNav();
  const { contactInfo } = useSidebar(sidebarRepository);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const firstName = (contactInfo?.name ?? "").trim().split(/\s+/)[0] || "Rubrica";

  // Fecha o menu ao trocar de página, com Esc ou clicando fora.
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <header className="dk-bar">
      <Link href="/" className="dk-brand">
        <span aria-hidden="true">◆ </span>
        {firstName} {copy.os}
      </Link>

      <nav aria-label={copy.mainNav}>
        <ul className="dk-nav">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActivePath(location, item.href) ? "page" : undefined}>
                {t(`navigation.${item.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="dk-bar-end" ref={wrapRef} style={{ position: "relative" }}>
        <Clock />
        <ColorModeToggle iconSize={15} />
        <button
          type="button"
          className="dk-menu-btn"
          aria-expanded={open}
          aria-controls="dk-menu"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
        </button>
        {open && (
          <ul id="dk-menu" className="dk-menu">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActivePath(location, item.href) ? "page" : undefined}>
                  {t(`navigation.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
