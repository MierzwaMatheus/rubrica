import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteConfigRepository } from "@/repositories/instances";

/** Chaves salvas em /admin/site-config → variáveis do contrato de 4 cores (src/index.css). */
export const THEME_CONFIG_VARS = {
  theme_background: "--bg",
  theme_foreground: "--text",
  theme_primary: "--primary",
  theme_accent: "--accent",
} as const;

/**
 * Aplica as cores salvas no admin sobre o tema do index.css. Só sobrescreve as
 * cores que foram de fato salvas: sem configuração, o tema padrão permanece.
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
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(THEME_CONFIG_VARS)) {
      const value = saved.get(key);
      if (typeof value === "string" && CSS.supports("color", value)) {
        root.style.setProperty(cssVar, value);
      }
    }
  }, [data]);

  return null;
}
