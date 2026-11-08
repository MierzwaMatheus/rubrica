/**
 * Esquemas de cor (RFC v2: "Os 3 temas de cor atuais viram conjuntos de tokens que
 * funcionam com qualquer tema"). Portados da v1 (`cli/src/themes/schemes.ts`).
 *
 * Cada esquema tem um modo claro e um escuro, com 11 papéis. Os papéis viram os tokens
 * `--rb-*` do núcleo (ver `SCHEME_TOKENS`). A ordem de precedência no site é
 * tokens do tema < esquema escolhido < `appearance.tokens`.
 *
 * Valores ajustados em relação à v1 para passar o contraste AA de texto (4,5:1) nos
 * dois modos (teste em `test/schemes.test.ts`); cada ajuste está marcado com "AA:".
 */

export type SchemeRole =
  | "bg" // fundo das páginas
  | "surface" // cartões, painéis, sidebar
  | "subtle" // fundos sutis, hover, faixas
  | "text" // texto principal
  | "textMuted" // texto secundário
  | "line" // bordas e divisórias
  | "primary" // cor de identidade: botões, links, destaques
  | "onPrimary" // texto sobre a primária
  | "accent" // segunda cor de marca
  | "onAccent" // texto sobre o acento
  | "accent2"; // terceira cor

export interface SchemeMode extends Record<SchemeRole, string> {
  /** Opcionais: texto de erro e de confirmação. Sem eles valem os padrões do base.css. */
  danger?: string;
  success?: string;
}

export interface ColorScheme {
  id: string;
  label: string;
  hint: string;
  light: SchemeMode;
  dark: SchemeMode;
}

/** Token `--rb-*` de cada papel. `primary` é o `--rb-accent` do núcleo. */
export const SCHEME_TOKENS: Record<SchemeRole | "danger" | "success", string> = {
  bg: "--rb-bg",
  surface: "--rb-surface",
  subtle: "--rb-subtle",
  text: "--rb-fg",
  textMuted: "--rb-muted",
  line: "--rb-border",
  primary: "--rb-accent",
  onPrimary: "--rb-accent-fg",
  accent: "--rb-accent-2",
  onAccent: "--rb-accent-2-fg",
  accent2: "--rb-accent-3",
  danger: "--rb-danger",
  success: "--rb-success",
};

export const DEFAULT_SCHEME_ID = "neon";

export const SCHEMES: ColorScheme[] = [
  {
    id: "neon",
    label: "Neon",
    hint: "o visual original do Rubrica — roxo e lima sobre grafite",
    light: { bg: "#F7F7F8", surface: "#EFEFF2", subtle: "#F1F1F4", text: "#141414", textMuted: "#55555C", line: "#DCDCE2", primary: "#7E22CE", onPrimary: "#F7F7F8", accent: "#446E0D", onAccent: "#F7F7F8", accent2: "#0891B2" },
    dark: { bg: "#141414", surface: "#0A0A0A", subtle: "#171717", text: "#E6E6E6", textMuted: "#A2A2A2", line: "#252525", primary: "#B670F8", onPrimary: "#141414", accent: "#BEF264", onAccent: "#141414", accent2: "#22D3EE" },
  },
  {
    id: "editorial-cream",
    label: "Editorial Cream",
    hint: "refinado e atemporal — blogs e portfólios literários",
    light: { bg: "#FAF7F2", surface: "#F3EEE5", subtle: "#EFE9DE", text: "#1A1614", textMuted: "#5E554D", line: "#E2D9CB", primary: "#8A1AF4", onPrimary: "#FFFFFF", accent: "#C71111", onAccent: "#FFFFFF", accent2: "#B7832A" },
    dark: { bg: "#1A1614", surface: "#231E1A", subtle: "#2A241F", text: "#F3EEE5", textMuted: "#A89E93", line: "#3A322B", primary: "#C084FC", onPrimary: "#1A1614", accent: "#F87171", onAccent: "#1A1614", accent2: "#E0B25A" },
  },
  {
    id: "paper-noir",
    label: "Paper Noir",
    hint: "contraste máximo — identidade editorial forte",
    light: { bg: "#F0EEE9", surface: "#E8E5DE", subtle: "#E4E1D9", text: "#0A0A0A", textMuted: "#55524C", line: "#D3CFC6", primary: "#BA1010", onPrimary: "#FFFFFF", accent: "#0955D0", onAccent: "#FFFFFF", accent2: "#E8B500" },
    dark: { bg: "#0D0D0D", surface: "#161616", subtle: "#1C1C1C", text: "#F0EEE9", textMuted: "#A3A09A", line: "#2C2C2C", primary: "#F05454", onPrimary: "#0D0D0D", accent: "#60A5FA", onAccent: "#0D0D0D", accent2: "#F2C94C" },
  },
  {
    id: "midnight-blue",
    label: "Midnight Blue",
    hint: "tech e premium — devs e designers noturnos",
    light: { bg: "#F3F6FB", surface: "#E9EEF7", subtle: "#E3E9F3", text: "#0A1224", textMuted: "#4B5670", line: "#CBD5E6", primary: "#0D6B84", onPrimary: "#F3F6FB", accent: "#845A03", onAccent: "#FFFFFF", accent2: "#6D28D9" },
    dark: { bg: "#0A1224", surface: "#0F1A31", subtle: "#13203B", text: "#E8E6E0", textMuted: "#9AA3B5", line: "#22304D", primary: "#06B6D4", onPrimary: "#0A1224", accent: "#FACC15", onAccent: "#0A1224", accent2: "#A78BFA" },
  },
  {
    id: "solar-warm",
    label: "Solar Warm",
    hint: "energia e criatividade — marcas pessoais vibrantes",
    light: { bg: "#FFF8EF", surface: "#FBEFDF", subtle: "#F7E9D6", text: "#2A1A0E", textMuted: "#6E5A47", line: "#EAD7BE", primary: "#B43C0B", onPrimary: "#FFF8EF", accent: "#895D03", onAccent: "#FFFFFF", accent2: "#BE123C" },
    dark: { bg: "#1A1410", surface: "#231B15", subtle: "#2A2019", text: "#F2EDE4", textMuted: "#ABA092", line: "#3A2E24", primary: "#F97316", onPrimary: "#1A1410", accent: "#FACC15", onAccent: "#1A1410", accent2: "#FB7185" },
  },
  {
    id: "riso",
    label: "Riso",
    hint: "rosa fluorescente e azul de impressão riso sobre papel",
    light: { bg: "#F2EDE2", surface: "#FAF6EE", subtle: "#E5DDCC", text: "#1D2B63", textMuted: "#4E5884", line: "#D4C9B2", primary: "#B4156B", onPrimary: "#FFFFFF", accent: "#00639E", onAccent: "#F2EDE2", accent2: "#FFE800" },
    dark: { bg: "#15172A", surface: "#1E2138", subtle: "#272A44", text: "#F2EDE2", textMuted: "#A9ACC8", line: "#363A5C", primary: "#FF5CBA", onPrimary: "#15172A", accent: "#4AA8E8", onAccent: "#15172A", accent2: "#FFE45C" },
  },
  {
    id: "cianotipia",
    label: "Cianotipia",
    hint: "azul-da-prússia e branco giz, como cópia heliográfica",
    light: { bg: "#EDF1F6", surface: "#F8FAFC", subtle: "#DDE5EF", text: "#0F2C57", textMuted: "#4A6286", line: "#C3D0E1", primary: "#1D4E89", onPrimary: "#FFFFFF", accent: "#356394", onAccent: "#FFFFFF", accent2: "#8FB3D9" },
    dark: { bg: "#0E2A50", surface: "#14345F", subtle: "#1A3D6C", text: "#E9EFF7", textMuted: "#9DB4D3", line: "#2D5285", primary: "#F2F5FA", onPrimary: "#0E2A50", accent: "#83ACDB", onAccent: "#0E2A50", accent2: "#BFD3EA" },
  },
  {
    id: "tropicalia",
    label: "Tropicália",
    hint: "verde-mata, amarelo-ouro e rosa-buganvília",
    light: { bg: "#FBF5E6", surface: "#FFFBF1", subtle: "#EFE6CD", text: "#0D3326", textMuted: "#4D6358", line: "#DCCFAE", primary: "#0B6E4F", onPrimary: "#FFFFFF", accent: "#7D5E03", onAccent: "#FFFFFF", accent2: "#E2457A" },
    dark: { bg: "#0A271D", surface: "#0F3427", subtle: "#143D2F", text: "#F6EFDA", textMuted: "#A7BFAF", line: "#22513F", primary: "#34C08A", onPrimary: "#062016", accent: "#F7C531", onAccent: "#0A271D", accent2: "#F26B9C" },
  },
  {
    id: "azulejo",
    label: "Azulejo",
    hint: "azul-cobalto sobre branco, com terracota",
    light: { bg: "#F6F6F2", surface: "#FFFFFF", subtle: "#E7EAF1", text: "#14213D", textMuted: "#4F5B78", line: "#D2D7E3", primary: "#1F4FB4", onPrimary: "#FFFFFF", accent: "#984F2E", onAccent: "#FFFFFF", accent2: "#E9B949" },
    dark: { bg: "#0D1630", surface: "#141F3D", subtle: "#1B2749", text: "#ECEFF6", textMuted: "#A1ACC8", line: "#2A3762", primary: "#7397F2", onPrimary: "#0D1630", accent: "#E58C61", onAccent: "#0D1630", accent2: "#F0C866" },
  },
  {
    id: "sumi",
    label: "Sumi",
    hint: "tinta preta, papel washi e um único vermelho de carimbo",
    light: { bg: "#EEEBE3", surface: "#F7F5F0", subtle: "#E1DDD2", text: "#171614", textMuted: "#5F5B53", line: "#CEC8BA", primary: "#BA0F2B", onPrimary: "#FFFFFF", accent: "#615D54", onAccent: "#FFFFFF", accent2: "#171614" },
    dark: { bg: "#121110", surface: "#1B1A18", subtle: "#24221F", text: "#E9E5DC", textMuted: "#A39E93", line: "#34312C", primary: "#E96068", onPrimary: "#121110", accent: "#938C81", onAccent: "#121110", accent2: "#E9E5DC" },
  },
  {
    id: "fosforo",
    label: "Fósforo",
    hint: "verde de monitor CRT e âmbar; no claro, papel de formulário contínuo",
    light: { bg: "#EEF3E8", surface: "#F7FAF3", subtle: "#DDE8D3", text: "#1A3A20", textMuted: "#4C6A50", line: "#C3D4B6", primary: "#1B702F", onPrimary: "#FFFFFF", accent: "#8A5600", onAccent: "#EEF3E8", accent2: "#5E9E6A" },
    dark: { bg: "#070C08", surface: "#0C150E", subtle: "#102014", text: "#8CFF9E", textMuted: "#4FBF63", line: "#1C3A22", primary: "#3DFF6E", onPrimary: "#04140A", accent: "#FFB000", onAccent: "#070C08", accent2: "#2E8B45" },
  },
  {
    id: "crepusculo",
    label: "Crepúsculo",
    hint: "roxo profundo indo para o laranja de fim de tarde",
    light: { bg: "#FFF3ED", surface: "#FFFAF7", subtle: "#F6E2DD", text: "#2A1540", textMuted: "#6B5378", line: "#EBCFCB", primary: "#6B2FA3", onPrimary: "#FFFFFF", accent: "#A9410C", onAccent: "#FFFFFF", accent2: "#E3A73B" },
    dark: { bg: "#190E29", surface: "#231536", subtle: "#2D1C44", text: "#F7E9F0", textMuted: "#BCA6C9", line: "#3E2A5A", primary: "#B788F2", onPrimary: "#190E29", accent: "#FF8A4C", onAccent: "#190E29", accent2: "#F4C15D" },
  },
  {
    id: "concreto",
    label: "Concreto",
    hint: "cinzas frios e um amarelo de sinalização",
    light: { bg: "#E3E4E5", surface: "#EEEFF0", subtle: "#D3D5D7", text: "#111214", textMuted: "#55595F", line: "#B9BCC0", primary: "#1F2124", onPrimary: "#FFD400", accent: "#705400", onAccent: "#FFFFFF", accent2: "#FFD400" },
    dark: { bg: "#18191B", surface: "#212325", subtle: "#2A2C2F", text: "#E8E9EA", textMuted: "#9A9EA4", line: "#3A3D41", primary: "#FFD400", onPrimary: "#111214", accent: "#91969C", onAccent: "#000000", accent2: "#E8E9EA" },
  },
  {
    id: "sorbet",
    label: "Sorbet",
    hint: "lilás, menta e pêssego em tons Y2K",
    light: { bg: "#FFF6FA", surface: "#FFFFFF", subtle: "#F3E8F6", text: "#35295A", textMuted: "#6F6390", line: "#E6D6EE", primary: "#6D4CD4", onPrimary: "#FFFFFF", accent: "#23735C", onAccent: "#FFFFFF", accent2: "#FFAE94" },
    dark: { bg: "#211B33", surface: "#2A2340", subtle: "#332B4C", text: "#F5EEFF", textMuted: "#B9AED6", line: "#433A60", primary: "#B9A0FF", onPrimary: "#211B33", accent: "#86E3C7", onAccent: "#211B33", accent2: "#FFB8A1" },
  },
  {
    id: "alto-contraste",
    label: "Alto Contraste",
    hint: "contraste nível AAA nos dois modos, pensado para baixa visão",
    light: { bg: "#FFFFFF", surface: "#FFFFFF", subtle: "#F0F0F0", text: "#000000", textMuted: "#2B2B2B", line: "#000000", primary: "#0030B8", onPrimary: "#FFFFFF", accent: "#8A0000", onAccent: "#FFFFFF", accent2: "#000000" },
    dark: { bg: "#000000", surface: "#0A0A0A", subtle: "#1A1A1A", text: "#FFFFFF", textMuted: "#E0E0E0", line: "#FFFFFF", primary: "#FFE14D", onPrimary: "#000000", accent: "#7FD8FF", onAccent: "#000000", accent2: "#FFFFFF" },
  },
];

export function getScheme(id: string | undefined): ColorScheme | undefined {
  return id ? SCHEMES.find((s) => s.id === id) : undefined;
}

function declarations(mode: SchemeMode): string {
  return (Object.keys(SCHEME_TOKENS) as (keyof typeof SCHEME_TOKENS)[])
    .filter((role) => mode[role as keyof SchemeMode] !== undefined)
    .map((role) => `${SCHEME_TOKENS[role]}:${mode[role as keyof SchemeMode]}`)
    .join(";");
}

/**
 * CSS do esquema. O escuro vale por padrão (como o `base.css`) e o claro entra com
 * `data-color-mode="light"` ou, em "system", com `prefers-color-scheme: light`.
 * Os seletores levam `[data-scheme]` na raiz para vencer, por especificidade, os tokens
 * do tema e do base independentemente da ordem das folhas de estilo.
 */
export function schemeCss(scheme: ColorScheme): string {
  const dark = declarations(scheme.dark);
  const light = declarations(scheme.light);
  return [
    `:root[data-scheme]{${dark}}`,
    `:root[data-scheme][data-color-mode="light"]{${light}}`,
    `@media (prefers-color-scheme:light){:root[data-scheme][data-color-mode="system"]{${light}}}`,
  ].join("\n");
}

// ---- contraste (WCAG 2) ---------------------------------------------------------

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

/** Razão de contraste WCAG entre duas cores `#rrggbb`. */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Mistura `b` sobre `a` na proporção `amount` (0 a 1), em sRGB, como `color-mix(in srgb)`. */
export function mixColors(a: string, b: string, amount: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(ch(a, i) * (1 - amount) + ch(b, i) * amount).toString(16).padStart(2, "0")).join("")}`;
}
