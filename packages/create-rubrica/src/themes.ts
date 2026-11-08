/**
 * Temas da v2 (RFC, decisão 6): um por layout da v1, com o mesmo id, mais o `padrao`.
 * É a única lista de temas do CLI: create, config, migrar e os testes leem daqui.
 *
 * `ported`: já existe o pacote `@rubrica/theme-<id>`. Enquanto um tema não é portado,
 * o site usa o `padrao` e o CLI avisa (a escolha fica guardada em `temaDesejado`).
 */
import { LAYOUTS } from "./v1/layouts.js";
import { SCHEMES } from "./v1/themes/schemes.js";
import { SANS_FONTS, MONO_FONTS } from "./v1/themes/fonts.js";

export type ColorMode = "light" | "dark" | "system";

export interface ThemeSpec {
  id: string;
  label: string;
  hint: string;
  /** Layout da v1 equivalente (o `migrar` usa). */
  v1Layout: string | null;
  ported: boolean;
  recommended: { scheme: string; mode: ColorMode; fontSans: string; fontMono?: string };
}

/** Temas com pacote publicado. */
export const PORTED_THEMES = ["padrao", "cyberpunk"] as const;

/** Tema usado quando o escolhido ainda não foi portado. */
export const FALLBACK_THEME = "padrao";

export const THEMES: ThemeSpec[] = [
  {
    id: "padrao",
    label: "Padrão",
    hint: "barra lateral com foto, limpo e neutro: serve para qualquer área",
    v1Layout: null,
    ported: true,
    recommended: { scheme: "midnight-blue", mode: "dark", fontSans: "Inter", fontMono: "JetBrains Mono" },
  },
  ...LAYOUTS.map((l) => ({
    id: l.id,
    label: l.label,
    hint: l.hint,
    v1Layout: l.id,
    ported: (PORTED_THEMES as readonly string[]).includes(l.id),
    recommended: {
      scheme: l.recommended.scheme,
      mode: l.recommended.mode,
      fontSans: l.fonts.sans[0]!,
      ...(l.fonts.mono && { fontMono: l.fonts.mono }),
    },
  })),
];

export function getTheme(id: string): ThemeSpec | undefined {
  return THEMES.find((t) => t.id === id);
}

/** Nome do pacote do tema. */
export const themePackage = (id: string) => `@rubrica/theme-${id}`;

/** Tema da v2 equivalente ao layout da v1 (layout desconhecido ou ausente: `padrao`). */
export function themeForV1Layout(layout: string | undefined | null): ThemeSpec {
  return THEMES.find((t) => t.v1Layout === layout) ?? getTheme(FALLBACK_THEME)!;
}

export interface ThemeChoice {
  /** Tema que o site usa de fato (pacote instalado). */
  tema: string;
  /** Tema escolhido que ainda não foi portado. */
  temaDesejado?: string;
  aviso?: string;
}

/** Tema efetivo para uma escolha, com o aviso quando ainda não foi portado. */
export function resolveTheme(id: string): ThemeChoice {
  const spec = getTheme(id);
  if (!spec) throw new Error(`Tema desconhecido: "${id}". Temas: ${THEMES.map((t) => t.id).join(", ")}.`);
  if (spec.ported) return { tema: spec.id };
  return {
    tema: FALLBACK_THEME,
    temaDesejado: spec.id,
    aviso:
      `O tema "${spec.label}" (${spec.id}) ainda não foi portado para a v2. ` +
      `O site usa o tema "${FALLBACK_THEME}" por enquanto; quando o ${themePackage(spec.id)} sair, troque com npx create-rubrica config.`,
  };
}

export const SCHEME_IDS = SCHEMES.map((s) => s.id);
export const SCHEME_OPTIONS = SCHEMES.map((s) => ({ value: s.id, label: s.label, hint: s.hint }));
export const SANS_FAMILIES = SANS_FONTS.map((f) => f.family);
export const MONO_FAMILIES = MONO_FONTS.map((f) => f.family);

export const COLOR_MODES: { value: ColorMode; label: string; hint: string }[] = [
  { value: "dark", label: "Escuro", hint: "fundo escuro" },
  { value: "light", label: "Claro", hint: "fundo claro" },
  { value: "system", label: "Automático", hint: "segue o modo do sistema de quem visita" },
];
