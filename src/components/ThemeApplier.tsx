import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteConfigRepository } from "@/repositories/instances";
import { adminColorsCss, COLOR_KEYS } from "@/lib/themeColors";

/** Chaves salvas em /admin/site-config → as 4 cores do contrato (modo claro; o escuro usa `theme_dark_*`). */
export const THEME_CONFIG_VARS = {
  [COLOR_KEYS.light.bg]: "--bg",
  [COLOR_KEYS.light.text]: "--text",
  [COLOR_KEYS.light.primary]: "--primary",
  [COLOR_KEYS.light.accent]: "--accent",
} as const;

export const ADMIN_COLORS_STYLE_ID = "rubrica-admin-colors";

/**
 * Aplica as cores salvas no admin sobre o esquema do index.css, cada modo com as suas
 * (ver src/lib/themeColors.ts). Só sobrescreve o que foi de fato salvo: sem configuração,
 * o esquema do projeto permanece.
 */
export function ThemeApplier() {
  const { data } = useQuery({
    queryKey: ["siteConfig"],
    queryFn: () => siteConfigRepository.getPublic(),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!data) return;
    const saved = new Map(data.map((d) => [d.key, d.value]));
    const css = adminColorsCss(saved, (v) => CSS.supports("color", v));
    let style = document.getElementById(ADMIN_COLORS_STYLE_ID) as HTMLStyleElement | null;
    if (!css) {
      style?.remove();
      return;
    }
    if (!style) {
      style = document.createElement("style");
      style.id = ADMIN_COLORS_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }, [data]);

  return null;
}
