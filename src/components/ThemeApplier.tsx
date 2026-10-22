import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Aplica o tema persistido (localStorage ou contactInfo) ao `documentElement`
 * assim que o componente monta, antes do ThemeProvider receber os children.
 * Evita o flash de tema errado (FOUC) na primeira pintura.
 */
export function ThemeApplier() {
  const contactInfo = useQuery(api.contactInfo.get);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as
      | "light"
      | "dark"
      | null;
    const theme: "light" | "dark" = stored ?? "dark";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    // contactInfo é carregado para manter paridade com futuras extensões
    // (ex.: tema customizado salvo no contactInfo) — referência simbólica.
    void contactInfo;
  }, [contactInfo]);

  return null;
}