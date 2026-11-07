import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { useI18n, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/context/I18nContext";

/** Texto do aviso no idioma de quem visita (não no idioma da página). */
const COPY: Record<Locale, { question: string; action: string; dismiss: string }> = {
  "en-US": { question: "View this page in English?", action: "English", dismiss: "Dismiss" },
  "pt-BR": { question: "Ver esta página em português?", action: "Português", dismiss: "Fechar" },
};

function browserLocale(): Locale {
  return navigator.language?.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

function savedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Sugere o outro idioma quando o navegador de quem visita está nele, sem redirecionar:
 * a URL decide o idioma (o robô do Google navega em inglês, e um redirect esconderia o pt-BR).
 * Some depois de qualquer escolha.
 */
export function LocaleSuggestion() {
  const { locale, setLocale } = useI18n();
  const [location] = useLocation();
  const [suggested, setSuggested] = useState<Locale | null>(null);

  // Só no navegador e depois da hidratação, para não mudar o HTML pré-renderizado.
  useEffect(() => {
    if (location.startsWith("/admin") || location.startsWith("/playground")) return;
    if (savedLocale()) return;
    const preferred = browserLocale();
    if (preferred !== locale) setSuggested(preferred);
  }, [locale, location]);

  if (!suggested || suggested === locale) return null;
  const copy = COPY[suggested];

  const dismiss = () => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // sem localStorage: só esconde
    }
    setSuggested(null);
  };

  return (
    <div
      role="region"
      aria-label={copy.question}
      lang={suggested}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-[var(--text)]/15 bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] shadow-lg"
    >
      <span>{copy.question}</span>
      <button
        type="button"
        onClick={() => setLocale(suggested)}
        className="rounded-md bg-[var(--primary)] px-3 py-1 font-medium text-[var(--bg)] hover:opacity-90"
        data-umami-event="locale-suggestion-accept"
      >
        {copy.action}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={copy.dismiss}
        className="rounded-md p-1 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
