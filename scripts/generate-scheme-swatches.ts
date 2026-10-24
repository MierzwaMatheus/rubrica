/**
 * Gera docs/templates/img/cores/<esquema>.svg: as cores de cada esquema nos modos
 * claro e escuro, a partir de cli/src/themes/schemes.ts (a fonte única dos esquemas).
 *
 * Uso: npx tsx scripts/generate-scheme-swatches.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { SCHEMES, ROLE_VARS, LEGACY_ROLES, contrast, type SchemeRole, type SchemeMode } from "../cli/src/themes/schemes";

const OUT = resolve(import.meta.dirname, "..", "docs", "templates", "img", "cores");
const SANS = "Inter,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,Menlo,monospace";

const LABELS: Record<SchemeRole, string> = {
  bg: "fundo",
  surface: "cartão",
  subtle: "sutil",
  text: "texto",
  textMuted: "texto 2",
  line: "linha",
  primary: "primária",
  onPrimary: "sobre prim.",
  accent: "acento",
  onAccent: "sobre acento",
  accent2: "acento 2",
};

const ROLES = Object.keys(ROLE_VARS) as SchemeRole[];
const W = 82;
const GAP = 6;
const LEFT = 92;
const WIDTH = LEFT + ROLES.length * (W + GAP) + 18;

function ink(fill: string): string {
  return contrast(fill, "#ffffff") >= contrast(fill, "#111111") ? "#ffffff" : "#111111";
}

function row(m: SchemeMode, y: number, label: string): string {
  const cells = ROLES.map((role, i) => {
    const x = LEFT + i * (W + GAP);
    const fill = m[role];
    const c = ink(fill);
    const legacy = LEGACY_ROLES.includes(role)
      ? `<circle cx="${x + W - 10}" cy="${y + 10}" r="4" fill="${c}"/>`
      : "";
    return `<g>
  <rect x="${x}" y="${y}" width="${W}" height="84" rx="8" fill="${fill}" stroke="#00000022"/>
  ${legacy}
  <text x="${x + 8}" y="${y + 22}" font-family="${SANS}" font-size="11" font-weight="700" fill="${c}">${LABELS[role]}</text>
  <text x="${x + 8}" y="${y + 74}" font-family="${MONO}" font-size="10.5" fill="${c}">${fill.toLowerCase()}</text>
</g>`;
  }).join("\n");
  return `<text x="20" y="${y + 47}" font-family="${SANS}" font-size="13" font-weight="600" fill="#444">${label}</text>\n${cells}`;
}

mkdirSync(OUT, { recursive: true });
for (const s of SCHEMES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="272" viewBox="0 0 ${WIDTH} 272">
<rect width="${WIDTH}" height="272" rx="16" fill="#ffffff"/>
<text x="20" y="38" font-family="${SANS}" font-size="20" font-weight="800" fill="#111">${s.label}</text>
<text x="${WIDTH - 20}" y="38" text-anchor="end" font-family="${SANS}" font-size="12.5" fill="#666">${s.id} · ● = as 4 cores dos layouts originais</text>
${row(s.light, 62, "Claro")}
${row(s.dark, 160, "Escuro")}
<text x="20" y="262" font-family="${SANS}" font-size="12" fill="#666">${s.hint}</text>
</svg>
`;
  writeFileSync(join(OUT, `${s.id}.svg`), svg);
  console.log(join(OUT, `${s.id}.svg`));
}
