/**
 * Cores do esquema personalizadas em /admin/site-config.
 *
 * O esquema do projeto (src/index.css, gravado pelo CLI) tem um modo claro e um escuro.
 * O admin pode trocar as 4 cores do contrato original de cada modo:
 * - `theme_background`, `theme_foreground`, `theme_primary`, `theme_accent` → modo claro;
 * - `theme_dark_background`, `theme_dark_foreground`, `theme_dark_primary`, `theme_dark_accent` → modo escuro.
 *
 * Projetos salvos antes das cores por modo não têm `theme_colors_per_mode`: neles as 4
 * chaves `theme_*` valem para os dois modos, como antes. Uma cor vazia ("") significa
 * "use a do esquema".
 */

export type ColorMode = "light" | "dark";
export type ContractColor = "bg" | "text" | "primary" | "accent";

export const COLOR_KEYS: Record<ColorMode, Record<ContractColor, string>> = {
  light: { bg: "theme_background", text: "theme_foreground", primary: "theme_primary", accent: "theme_accent" },
  dark: { bg: "theme_dark_background", text: "theme_dark_foreground", primary: "theme_dark_primary", accent: "theme_dark_accent" },
};

export const PER_MODE_FLAG = "theme_colors_per_mode";

const CSS_VAR: Record<ContractColor, string> = { bg: "--bg", text: "--text", primary: "--primary", accent: "--accent" };

/**
 * Trocar o fundo ou o texto deixa as cores de apoio do esquema sem par. Estas fórmulas
 * as recalculam a partir das 4 do contrato.
 */
export const DERIVED_FROM_ADMIN: Record<string, string> = {
  "--surface": "color-mix(in srgb, var(--text) 4%, var(--bg))",
  "--subtle": "color-mix(in srgb, var(--text) 2%, var(--bg))",
  "--line": "color-mix(in srgb, var(--text) 12%, var(--bg))",
  "--text-muted": "color-mix(in srgb, var(--text) 68%, var(--bg))",
};

export const HEX_RE = /^#[0-9a-f]{6}$/i;

/** `#abc`/`#AABBCC` → `#aabbcc` (o build minifica os hex do index.css). Outros formatos: null. */
export function normalizeHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return "#" + [...v.slice(1)].map((c) => c + c).join("");
  return null;
}

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Texto legível sobre `fill` (hex): branco ou quase preto, o que tiver mais contraste. */
export function readableOn(fill: string): string | null {
  if (!HEX_RE.test(fill)) return null;
  const l = luminance(fill);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? "#ffffff" : "#111111";
}

export type SavedConfig = ReadonlyMap<string, unknown>;
export type ModeColors = Partial<Record<ContractColor, string>>;

/** As cores do admin que valem em cada modo (só as válidas). */
export function adminColors(saved: SavedConfig, isColor: (v: string) => boolean): Record<ColorMode, ModeColors> {
  const perMode = saved.get(PER_MODE_FLAG) === true || saved.get(PER_MODE_FLAG) === "true";
  const read = (mode: ColorMode): ModeColors => {
    const out: ModeColors = {};
    for (const [role, key] of Object.entries(COLOR_KEYS[mode]) as [ContractColor, string][]) {
      const v = saved.get(key);
      if (typeof v === "string" && v.trim() !== "" && isColor(v)) out[role] = v.trim();
    }
    return out;
  };
  const light = read("light");
  return { light, dark: perMode ? read("dark") : light };
}

function declarations(colors: ModeColors): string[] {
  const out: string[] = [];
  for (const [role, value] of Object.entries(colors) as [ContractColor, string][]) {
    out.push(`${CSS_VAR[role]}: ${value};`);
    if (role === "primary" || role === "accent") {
      const on = readableOn(value);
      if (on) out.push(`${role === "primary" ? "--on-primary" : "--on-accent"}: ${on};`);
    }
  }
  if (colors.bg || colors.text) {
    for (const [v, formula] of Object.entries(DERIVED_FROM_ADMIN)) out.push(`${v}: ${formula};`);
  }
  return out;
}

/**
 * Folha de estilo com as cores do admin, um bloco por modo. Os seletores têm
 * especificidade maior que `:root` e `.dark` do index.css, então vencem o esquema só no
 * modo a que pertencem. Devolve "" quando não há nada salvo.
 */
export function adminColorsCss(saved: SavedConfig, isColor: (v: string) => boolean): string {
  const { light, dark } = adminColors(saved, isColor);
  const blocks: string[] = [];
  const l = declarations(light);
  const d = declarations(dark);
  if (l.length) blocks.push(`html:root:not(.dark) {\n  ${l.join("\n  ")}\n}`);
  if (d.length) blocks.push(`html:root.dark {\n  ${d.join("\n  ")}\n}`);
  return blocks.join("\n");
}

/**
 * As 4 cores do contrato de cada modo como estão no esquema do projeto (index.css), sem
 * as personalizações do admin. Lê as regras `:root` e `.dark` das folhas de estilo, porque
 * a página do admin está sempre no modo escuro e não dá para medir o claro na tela.
 */
export function schemeColors(doc: Document = document): Record<ColorMode, ModeColors> {
  const found: Record<ColorMode, ModeColors> = { light: {}, dark: {} };
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("cssRules" in rule && !(rule instanceof CSSStyleRule)) {
        visit((rule as CSSGroupingRule).cssRules);
        continue;
      }
      if (!(rule instanceof CSSStyleRule)) continue;
      const mode: ColorMode | null = rule.selectorText === ":root" ? "light" : rule.selectorText === ".dark" ? "dark" : null;
      if (!mode) continue;
      for (const [role, cssVar] of Object.entries(CSS_VAR) as [ContractColor, string][]) {
        const v = normalizeHex(rule.style.getPropertyValue(cssVar));
        if (v && !found[mode][role]) found[mode][role] = v;
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      /* folha de outro domínio (ex.: Google Fonts): não dá para ler */
    }
  }
  return found;
}
