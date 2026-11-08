/**
 * Temas da v2 (RFC, decisão 6): um por layout da v1, com o mesmo id, mais o `padrao`.
 * É a única lista de temas do CLI: create, config, migrar e os testes leem daqui.
 *
 * `ported`: já existe o pacote `@rubrica/theme-<id>`. Enquanto um tema não é portado,
 * o site usa o `padrao` e o CLI avisa (a escolha fica guardada em `temaDesejado`).
 *
 * Os esquemas de cor são os do núcleo (`SCHEMES`, `appearance.scheme`). O esquema e as
 * fontes recomendados de um tema portado são os que o pacote do tema declara (`scheme`
 * e `fonts.json`; um teste confere); os dos outros vêm do layout da v1.
 */
import { SCHEMES } from "@rubrica/core";
import { LAYOUTS } from "./v1/layouts.js";
import { SANS_FONTS, MONO_FONTS } from "./v1/themes/fonts.js";

export type ColorMode = "light" | "dark" | "system";

export interface ThemeSpec {
  id: string;
  label: string;
  hint: string;
  /** Layout da v1 equivalente (o `migrar` usa). */
  v1Layout: string | null;
  ported: boolean;
  /**
   * Escolhas iniciais do `create`. Num tema portado, as fontes são as do pacote do tema
   * (o site não precisa gravá-las: sem `appearance.fontSans`, valem as do tema).
   */
  recommended: { scheme: string; mode: ColorMode; fontSans: string; fontMono?: string };
}

/** Temas com pacote publicado. */
export const PORTED_THEMES = ["padrao", "cyberpunk", "bento", "chat", "desktop", "index", "magazine", "monograph"] as const;

/** O que cada pacote de tema declara: `scheme` no `defineTheme` e `fonts.json` (`test/alignment.test.ts`). */
export const THEME_PACKAGE_DEFAULTS: Record<(typeof PORTED_THEMES)[number], { scheme: string; fontSans: string; fontMono?: string }> = {
  padrao: { scheme: "neon", fontSans: "Chakra Petch", fontMono: "Chakra Petch" },
  cyberpunk: { scheme: "neon", fontSans: "Chakra Petch", fontMono: "Chakra Petch" },
  bento: { scheme: "editorial-cream", fontSans: "Manrope", fontMono: "JetBrains Mono" },
  chat: { scheme: "alto-contraste", fontSans: "Instrument Sans", fontMono: "IBM Plex Mono" },
  desktop: { scheme: "sorbet", fontSans: "Instrument Sans", fontMono: "IBM Plex Mono" },
  index: { scheme: "sumi", fontSans: "Instrument Sans", fontMono: "IBM Plex Mono" },
  magazine: { scheme: "editorial-cream", fontSans: "IBM Plex Serif", fontMono: "JetBrains Mono" },
  monograph: { scheme: "azulejo", fontSans: "Source Serif 4", fontMono: "IBM Plex Mono" },
};

const isPorted = (id: string): id is (typeof PORTED_THEMES)[number] => (PORTED_THEMES as readonly string[]).includes(id);

/** Tema usado quando o escolhido ainda não foi portado. */
export const FALLBACK_THEME = "padrao";

export const THEMES: ThemeSpec[] = [
  {
    id: "padrao",
    label: "Padrão",
    hint: "barra lateral com foto, limpo e neutro: serve para qualquer área",
    v1Layout: null,
    ported: true,
    recommended: { mode: "dark", ...THEME_PACKAGE_DEFAULTS.padrao },
  },
  ...LAYOUTS.map((l) => ({
    id: l.id,
    label: l.label,
    hint: l.hint,
    v1Layout: l.id,
    ported: isPorted(l.id),
    recommended: isPorted(l.id)
      ? { mode: l.recommended.mode, ...THEME_PACKAGE_DEFAULTS[l.id] }
      : {
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

/**
 * Fontes que o `create` grava no `rubrica.json` para um tema: nenhuma num tema portado
 * (valem as do pacote do tema, e trocar de tema troca as fontes junto); as do layout da
 * v1 num tema ainda não portado (o site usa o padrao, com as fontes do layout escolhido).
 */
export function initialFonts(id: string): { fonteSans?: string; fonteMono?: string } {
  const spec = getTheme(id);
  if (!spec || spec.ported) return {};
  return { fonteSans: spec.recommended.fontSans, ...(spec.recommended.fontMono && { fonteMono: spec.recommended.fontMono }) };
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
