import { Moon, Sun } from "lucide-react";
import { useOptionalTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/i18n/context/I18nContext";

interface ColorModeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  /** Mostra o texto ("Modo escuro"/"Modo claro") ao lado do ícone. */
  showLabel?: boolean;
  /** Tamanho do ícone em px. */
  iconSize?: number;
}

const LABELS = {
  "pt-BR": { toDark: "Modo escuro", toLight: "Modo claro" },
  "en-US": { toDark: "Dark mode", toLight: "Light mode" },
} as const;

/**
 * Botão de alternar entre modo claro e escuro. Não renderiza nada quando a alternância
 * está desligada (`rubrica config` → Aparência). Herda a cor do texto (`currentColor`):
 * cada layout posiciona e estiliza pelo `className`/`style`.
 */
export function ColorModeToggle({ className, style, showLabel = false, iconSize = 16 }: ColorModeToggleProps) {
  const themeContext = useOptionalTheme();
  const { locale } = useI18n();
  // Sem provedor (componente renderizado isolado) ou com a alternância desligada: nada.
  if (!themeContext?.toggleTheme) return null;
  const { theme, toggleTheme } = themeContext;

  const labels = LABELS[locale === "en-US" ? "en-US" : "pt-BR"];
  const label = theme === "dark" ? labels.toLight : labels.toDark;
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "inherit", background: "none", border: 0, padding: 0, font: "inherit", ...style }}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
