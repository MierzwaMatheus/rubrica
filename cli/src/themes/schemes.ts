/**
 * Esquemas de cores do Rubrica.
 *
 * Cada esquema tem um modo claro e um escuro, e cada modo define 11 papéis de cor.
 * Os templates antigos (cyberpunk, brutalist, swiss, bento, magazine) usam só as 4 cores
 * do contrato original: `--bg`, `--text`, `--primary` e `--accent`. Os templates novos
 * usam o esquema completo.
 *
 * O CLI (applyTheme) grava o esquema escolhido em `src/index.css`: o modo claro em `:root`
 * e o escuro em `.dark`.
 */

export type SchemeRole =
  | "bg" // fundo das páginas
  | "surface" // cartões, painéis, sidebar
  | "subtle" // fundos sutis, hover, faixas
  | "text" // texto principal
  | "textMuted" // texto secundário
  | "line" // bordas e divisórias
  | "primary" // cor de identidade: botões, links, blocos de destaque
  | "onPrimary" // texto sobre a primária
  | "accent" // segunda cor de marca (é a que os templates antigos usam)
  | "onAccent" // texto sobre o acento
  | "accent2"; // terceira cor, só nos templates novos

export type SchemeMode = Record<SchemeRole, string>;

export interface ColorScheme {
  id: string;
  label: string;
  hint: string;
  light: SchemeMode;
  dark: SchemeMode;
}

/** Nome da variável CSS de cada papel. */
export const ROLE_VARS: Record<SchemeRole, string> = {
  bg: "--bg",
  surface: "--surface",
  subtle: "--subtle",
  text: "--text",
  textMuted: "--text-muted",
  line: "--line",
  primary: "--primary",
  onPrimary: "--on-primary",
  accent: "--accent",
  onAccent: "--on-accent",
  accent2: "--accent-2",
};

/** As 4 cores que os templates antigos podem usar. */
export const LEGACY_ROLES: SchemeRole[] = ["bg", "text", "primary", "accent"];

// ---- contraste ------------------------------------------------------------------

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Entre o fundo e o texto do próprio modo, escolhe o que mais contrasta com `fill`. */
function onColor(fill: string, mode: Pick<SchemeMode, "bg" | "text">): string {
  return contrast(fill, mode.bg) >= contrast(fill, mode.text) ? mode.bg : mode.text;
}

type ModeInput = Omit<SchemeMode, "onPrimary" | "onAccent"> & { onPrimary?: string; onAccent?: string };

function mode(m: ModeInput): SchemeMode {
  return {
    ...m,
    onPrimary: m.onPrimary ?? onColor(m.primary, m),
    onAccent: m.onAccent ?? onColor(m.accent, m),
  };
}

// ---- esquemas -------------------------------------------------------------------

export const SCHEMES: ColorScheme[] = [
  // Padrão do repositório: o visual original do Rubrica.
  {
    id: "neon",
    label: "Neon",
    hint: "o visual original do Rubrica — roxo e lima sobre grafite",
    light: mode({ bg: "#F7F7F8", surface: "#EFEFF2", subtle: "#F1F1F4", text: "#141414", textMuted: "#55555C", line: "#DCDCE2", primary: "#7E22CE", accent: "#4D7C0F", accent2: "#0891B2" }),
    dark: mode({ bg: "#141414", surface: "#0A0A0A", subtle: "#171717", text: "#E6E6E6", textMuted: "#A2A2A2", line: "#252525", primary: "#A855F7", onPrimary: "#FFFFFF", accent: "#BEF264", accent2: "#22D3EE" }),
  },
  // Os 4 presets originais, agora com os dois modos e o esquema completo.
  {
    id: "editorial-cream",
    label: "Editorial Cream",
    hint: "refinado e atemporal — blogs e portfólios literários",
    light: mode({ bg: "#FAF7F2", surface: "#F3EEE5", subtle: "#EFE9DE", text: "#1A1614", textMuted: "#5E554D", line: "#E2D9CB", primary: "#A855F7", accent: "#EF4444", accent2: "#B7832A" }),
    dark: mode({ bg: "#1A1614", surface: "#231E1A", subtle: "#2A241F", text: "#F3EEE5", textMuted: "#A89E93", line: "#3A322B", primary: "#C084FC", accent: "#F87171", accent2: "#E0B25A" }),
  },
  {
    id: "paper-noir",
    label: "Paper Noir",
    hint: "contraste máximo — identidade editorial forte",
    light: mode({ bg: "#F0EEE9", surface: "#E8E5DE", subtle: "#E4E1D9", text: "#0A0A0A", textMuted: "#55524C", line: "#D3CFC6", primary: "#EF4444", accent: "#3B82F6", accent2: "#E8B500" }),
    dark: mode({ bg: "#0D0D0D", surface: "#161616", subtle: "#1C1C1C", text: "#F0EEE9", textMuted: "#A3A09A", line: "#2C2C2C", primary: "#F05252", accent: "#60A5FA", accent2: "#F2C94C" }),
  },
  {
    id: "midnight-blue",
    label: "Midnight Blue",
    hint: "tech e premium — devs e designers noturnos",
    light: mode({ bg: "#F3F6FB", surface: "#E9EEF7", subtle: "#E3E9F3", text: "#0A1224", textMuted: "#4B5670", line: "#CBD5E6", primary: "#0E7490", accent: "#CA8A04", accent2: "#6D28D9" }),
    dark: mode({ bg: "#0A1224", surface: "#0F1A31", subtle: "#13203B", text: "#E8E6E0", textMuted: "#9AA3B5", line: "#22304D", primary: "#06B6D4", accent: "#FACC15", accent2: "#A78BFA" }),
  },
  {
    id: "solar-warm",
    label: "Solar Warm",
    hint: "energia e criatividade — marcas pessoais vibrantes",
    light: mode({ bg: "#FFF8EF", surface: "#FBEFDF", subtle: "#F7E9D6", text: "#2A1A0E", textMuted: "#6E5A47", line: "#EAD7BE", primary: "#C2410C", accent: "#CA8A04", accent2: "#BE123C" }),
    dark: mode({ bg: "#1A1410", surface: "#231B15", subtle: "#2A2019", text: "#F2EDE4", textMuted: "#ABA092", line: "#3A2E24", primary: "#F97316", accent: "#FACC15", accent2: "#FB7185" }),
  },
  // Paletas novas.
  {
    id: "riso",
    label: "Riso",
    hint: "rosa fluorescente e azul de impressão riso sobre papel",
    light: mode({ bg: "#F2EDE2", surface: "#FAF6EE", subtle: "#E5DDCC", text: "#1D2B63", textMuted: "#4E5884", line: "#D4C9B2", primary: "#E5258D", onPrimary: "#14183A", accent: "#0078BF", accent2: "#FFE800" }),
    dark: mode({ bg: "#15172A", surface: "#1E2138", subtle: "#272A44", text: "#F2EDE2", textMuted: "#A9ACC8", line: "#363A5C", primary: "#FF5CBA", onPrimary: "#15172A", accent: "#4AA8E8", accent2: "#FFE45C" }),
  },
  {
    id: "cianotipia",
    label: "Cianotipia",
    hint: "azul-da-prússia e branco giz, como cópia heliográfica",
    light: mode({ bg: "#EDF1F6", surface: "#F8FAFC", subtle: "#DDE5EF", text: "#0F2C57", textMuted: "#4A6286", line: "#C3D0E1", primary: "#1D4E89", onPrimary: "#FFFFFF", accent: "#6F9BCB", accent2: "#8FB3D9" }),
    dark: mode({ bg: "#0E2A50", surface: "#14345F", subtle: "#1A3D6C", text: "#E9EFF7", textMuted: "#9DB4D3", line: "#2D5285", primary: "#F2F5FA", onPrimary: "#0E2A50", accent: "#7FA9DA", accent2: "#BFD3EA" }),
  },
  {
    id: "tropicalia",
    label: "Tropicália",
    hint: "verde-mata, amarelo-ouro e rosa-buganvília",
    light: mode({ bg: "#FBF5E6", surface: "#FFFBF1", subtle: "#EFE6CD", text: "#0D3326", textMuted: "#4D6358", line: "#DCCFAE", primary: "#0B6E4F", onPrimary: "#FFFFFF", accent: "#F2B705", accent2: "#E2457A" }),
    dark: mode({ bg: "#0A271D", surface: "#0F3427", subtle: "#143D2F", text: "#F6EFDA", textMuted: "#A7BFAF", line: "#22513F", primary: "#34C08A", onPrimary: "#062016", accent: "#F7C531", accent2: "#F26B9C" }),
  },
  {
    id: "azulejo",
    label: "Azulejo",
    hint: "azul-cobalto sobre branco, com terracota",
    light: mode({ bg: "#F6F6F2", surface: "#FFFFFF", subtle: "#E7EAF1", text: "#14213D", textMuted: "#4F5B78", line: "#D2D7E3", primary: "#1F4FB4", onPrimary: "#FFFFFF", accent: "#C4673D", accent2: "#E9B949" }),
    dark: mode({ bg: "#0D1630", surface: "#141F3D", subtle: "#1B2749", text: "#ECEFF6", textMuted: "#A1ACC8", line: "#2A3762", primary: "#7397F2", onPrimary: "#0D1630", accent: "#E58C61", accent2: "#F0C866" }),
  },
  {
    id: "sumi",
    label: "Sumi",
    hint: "tinta preta, papel washi e um único vermelho de carimbo",
    light: mode({ bg: "#EEEBE3", surface: "#F7F5F0", subtle: "#E1DDD2", text: "#171614", textMuted: "#5F5B53", line: "#CEC8BA", primary: "#C8102E", onPrimary: "#FFFFFF", accent: "#8A8478", accent2: "#171614" }),
    dark: mode({ bg: "#121110", surface: "#1B1A18", subtle: "#24221F", text: "#E9E5DC", textMuted: "#A39E93", line: "#34312C", primary: "#E5414A", onPrimary: "#121110", accent: "#7D776C", accent2: "#E9E5DC" }),
  },
  {
    id: "fosforo",
    label: "Fósforo",
    hint: "verde de monitor CRT e âmbar; no claro, papel de formulário contínuo",
    light: mode({ bg: "#EEF3E8", surface: "#F7FAF3", subtle: "#DDE8D3", text: "#1A3A20", textMuted: "#4C6A50", line: "#C3D4B6", primary: "#1E7A33", onPrimary: "#FFFFFF", accent: "#A86A00", accent2: "#5E9E6A" }),
    dark: mode({ bg: "#070C08", surface: "#0C150E", subtle: "#102014", text: "#8CFF9E", textMuted: "#4FBF63", line: "#1C3A22", primary: "#3DFF6E", onPrimary: "#04140A", accent: "#FFB000", accent2: "#2E8B45" }),
  },
  {
    id: "crepusculo",
    label: "Crepúsculo",
    hint: "roxo profundo indo para o laranja de fim de tarde",
    light: mode({ bg: "#FFF3ED", surface: "#FFFAF7", subtle: "#F6E2DD", text: "#2A1540", textMuted: "#6B5378", line: "#EBCFCB", primary: "#6B2FA3", onPrimary: "#FFFFFF", accent: "#EF6C2A", accent2: "#E3A73B" }),
    dark: mode({ bg: "#190E29", surface: "#231536", subtle: "#2D1C44", text: "#F7E9F0", textMuted: "#BCA6C9", line: "#3E2A5A", primary: "#B788F2", onPrimary: "#190E29", accent: "#FF8A4C", accent2: "#F4C15D" }),
  },
  {
    id: "concreto",
    label: "Concreto",
    hint: "cinzas frios e um amarelo de sinalização",
    light: mode({ bg: "#E3E4E5", surface: "#EEEFF0", subtle: "#D3D5D7", text: "#111214", textMuted: "#55595F", line: "#B9BCC0", primary: "#1F2124", onPrimary: "#FFD400", accent: "#A87F00", accent2: "#FFD400" }),
    dark: mode({ bg: "#18191B", surface: "#212325", subtle: "#2A2C2F", text: "#E8E9EA", textMuted: "#9A9EA4", line: "#3A3D41", primary: "#FFD400", onPrimary: "#111214", accent: "#6E737A", accent2: "#E8E9EA" }),
  },
  {
    id: "sorbet",
    label: "Sorbet",
    hint: "lilás, menta e pêssego em tons Y2K",
    light: mode({ bg: "#FFF6FA", surface: "#FFFFFF", subtle: "#F3E8F6", text: "#35295A", textMuted: "#6F6390", line: "#E6D6EE", primary: "#7454D6", onPrimary: "#FFFFFF", accent: "#6FD3B5", accent2: "#FFAE94" }),
    dark: mode({ bg: "#211B33", surface: "#2A2340", subtle: "#332B4C", text: "#F5EEFF", textMuted: "#B9AED6", line: "#433A60", primary: "#B9A0FF", onPrimary: "#211B33", accent: "#86E3C7", accent2: "#FFB8A1" }),
  },
  {
    id: "alto-contraste",
    label: "Alto Contraste",
    hint: "contraste nível AAA nos dois modos, pensado para baixa visão",
    light: mode({ bg: "#FFFFFF", surface: "#FFFFFF", subtle: "#F0F0F0", text: "#000000", textMuted: "#2B2B2B", line: "#000000", primary: "#0030B8", onPrimary: "#FFFFFF", accent: "#8A0000", accent2: "#000000" }),
    dark: mode({ bg: "#000000", surface: "#0A0A0A", subtle: "#1A1A1A", text: "#FFFFFF", textMuted: "#E0E0E0", line: "#FFFFFF", primary: "#FFE14D", onPrimary: "#000000", accent: "#7FD8FF", accent2: "#FFFFFF" }),
  },
];

export const DEFAULT_SCHEME_ID = "neon";

export function getScheme(id: string): ColorScheme | undefined {
  return SCHEMES.find((s) => s.id === id);
}

/** Bloco CSS de um modo: uma declaração por papel. */
export function modeDeclarations(m: SchemeMode, indent = "  "): string {
  return (Object.keys(ROLE_VARS) as SchemeRole[])
    .map((role) => `${indent}${ROLE_VARS[role]}: ${m[role]};`)
    .join("\n");
}

export const SCHEME_START = "/* rubrica:esquema:inicio */";
export const SCHEME_END = "/* rubrica:esquema:fim */";

/** O trecho que vai entre os marcadores em src/index.css. */
export function schemeCss(scheme: ColorScheme): string {
  return [
    SCHEME_START,
    `/* Esquema de cores: ${scheme.label} (${scheme.id}). Gerado pelo CLI (rubrica config → Aparência). */`,
    `:root {\n${modeDeclarations(scheme.light)}\n}`,
    `.dark {\n${modeDeclarations(scheme.dark)}\n}`,
    SCHEME_END,
  ].join("\n");
}
