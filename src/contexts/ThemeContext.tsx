import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { isHydratingPrerender } from "@/ssr/hydration";

/** Modo efetivo da página. */
type Theme = "light" | "dark";
/** Modo configurado: "system" segue o sistema operacional de quem visita. */
export type ColorModeSetting = Theme | "system";

interface ThemeContextType {
  /** Modo efetivo agora (claro ou escuro). */
  theme: Theme;
  /** Alterna o modo. Só existe quando a alternância está ligada. */
  toggleTheme?: () => void;
  /** Se quem visita pode alternar o modo. */
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Onde fica a escolha de quem visita (o script do index.html lê a mesma chave). */
export const COLOR_MODE_STORAGE_KEY = "rubrica-color-mode";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Sobrepõe o `data-color-mode` do <html> (gravado pelo CLI). */
  defaultTheme?: ColorModeSetting;
  /** Sobrepõe o `data-color-toggle` do <html> (gravado pelo CLI). */
  switchable?: boolean;
}

function htmlSetting(): { mode: ColorModeSetting; toggle: boolean } {
  const d = typeof document !== "undefined" ? document.documentElement : null;
  const raw = d?.getAttribute("data-color-mode");
  const mode: ColorModeSetting = raw === "light" || raw === "system" ? raw : "dark";
  return { mode, toggle: d?.getAttribute("data-color-toggle") === "true" };
}

function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readSaved(): Theme | null {
  try {
    const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children, defaultTheme, switchable }: ThemeProviderProps) {
  const fromHtml = htmlSetting();
  const setting = defaultTheme ?? fromHtml.mode;
  const canSwitch = switchable ?? fromHtml.toggle;

  // Página pré-renderizada: começa igual ao build (sem escolha salva, sistema "escuro") e
  // aplica a escolha e o tema do sistema logo depois. A cor certa já está na tela desde o
  // início: o color-mode.js põe a classe no <html> antes de a página aparecer.
  const [synced, setSynced] = useState(() => !isHydratingPrerender());
  // Escolha explícita de quem visita (só vale com a alternância ligada).
  const [chosen, setChosen] = useState<Theme | null>(() => (canSwitch && synced ? readSaved() : null));
  const [system, setSystem] = useState<Theme>(() => (synced ? systemTheme() : "dark"));

  useEffect(() => {
    if (synced) return;
    if (canSwitch) setChosen(readSaved());
    setSystem(systemTheme());
    setSynced(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  useEffect(() => {
    if (setting !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [setting]);

  const theme: Theme = chosen ?? (setting === "system" ? system : setting);

  useEffect(() => {
    // Antes de sincronizar, o tema ainda é o do build: não mexe na classe que o color-mode.js pôs.
    if (!synced) return;
    const root = document.documentElement;
    // O painel admin foi desenhado para o modo escuro e não usa textura.
    root.classList.toggle("dark", isAdmin || theme === "dark");
    if (isAdmin) root.setAttribute("data-admin", "");
    else root.removeAttribute("data-admin");
  }, [theme, isAdmin, synced]);

  const toggleTheme = canSwitch
    ? () => {
        const next: Theme = theme === "light" ? "dark" : "light";
        setChosen(next);
        try {
          localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
        } catch {
          /* navegação privada: a escolha vale só nesta visita */
        }
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable: canSwitch }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Como `useTheme`, mas devolve `undefined` fora do `ThemeProvider` (testes, previews isolados). */
export function useOptionalTheme(): ThemeContextType | undefined {
  return useContext(ThemeContext);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
