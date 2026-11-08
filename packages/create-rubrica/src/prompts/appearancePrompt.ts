import { select, confirm, isCancel } from "@clack/prompts";
import { LAYOUTS, COLOR_MODES, TEXTURES, getLayout, type ColorMode, type Texture } from "../layouts.js";
import { SCHEMES } from "../themes/schemes.js";
import { SANS_FONTS, MONO_FONTS } from "../themes/fonts.js";
import type { Appearance } from "../transforms/applyAppearance.js";

/** Pergunta o layout. Os 5 originais primeiro, depois os novos. */
export async function layoutPrompt(initialValue?: string): Promise<string> {
  return (await select({
    message: "Layout",
    initialValue,
    options: LAYOUTS.map((l) => ({ value: l.id, label: l.label, hint: l.hint })),
  })) as string;
}

/** Pergunta o esquema de cores, marcando o recomendado para o layout. */
export async function schemePrompt(layoutId: string, initialValue?: string): Promise<string> {
  const recommended = getLayout(layoutId)?.recommended.scheme;
  return (await select({
    message: "Esquema de cores",
    initialValue: initialValue ?? recommended,
    options: SCHEMES.map((s) => ({
      value: s.id,
      label: s.label,
      hint: s.id === recommended ? `recomendado para este layout — ${s.hint}` : s.hint,
    })),
  })) as string;
}

/** Pergunta modo de cor, se quem visita pode alternar e a textura. */
export async function appearancePrompt(layoutId: string, current?: Partial<Appearance>): Promise<Appearance> {
  const rec = getLayout(layoutId)?.recommended;

  const colorMode = (await select({
    message: "Modo de cor",
    initialValue: current?.colorMode ?? rec?.mode ?? "dark",
    options: COLOR_MODES.map((m) => ({
      value: m.value,
      label: m.label,
      hint: m.value === rec?.mode ? `recomendado — ${m.hint}` : m.hint,
    })),
  })) as ColorMode;

  const toggle = await confirm({
    message: "Mostrar um botão para quem visita alternar entre claro e escuro?",
    initialValue: current?.colorModeToggle ?? true,
  });
  const colorModeToggle = !isCancel(toggle) && toggle === true;

  const texture = (await select({
    message: "Textura",
    initialValue: current?.texture ?? rec?.texture ?? "none",
    options: TEXTURES.map((t) => ({
      value: t.value,
      label: t.label,
      hint: t.value === rec?.texture ? `recomendada — ${t.hint}` : t.hint,
    })),
  })) as Texture;

  return { colorMode, colorModeToggle, texture };
}

/** Fonte principal e mono. Layouts sem mono (`fonts.mono === ""`) não perguntam a mono. */
export async function fontPrompts(
  layoutId: string,
  current?: { fontSans?: string; fontMono?: string }
): Promise<{ fontSans: string; fontMono: string }> {
  const rec = getLayout(layoutId)?.fonts ?? { sans: [], mono: "JetBrains Mono" };

  const fontSans = (await select({
    message: "Fonte principal",
    initialValue: current?.fontSans,
    options: SANS_FONTS.map((f) => ({
      value: f.family,
      label: f.family,
      hint: rec.sans.includes(f.family) ? "recomendada" : f.hint,
    })),
  })) as string;

  const fontMono =
    rec.mono === ""
      ? ""
      : ((await select({
          message: "Fonte mono",
          initialValue: current?.fontMono,
          options: MONO_FONTS.map((f) => ({
            value: f.family,
            label: f.family,
            hint: f.family === rec.mono ? "recomendada" : f.hint,
          })),
        })) as string);

  return { fontSans, fontMono };
}
