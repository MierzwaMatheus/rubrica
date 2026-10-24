/**
 * Argumentos do create: `<pasta> [--receita <código>] [opções legíveis]`.
 * As opções legíveis (em português) valem por cima da receita. Tudo vira uma Recipe
 * validada; o que estiver errado vira aviso e o CLI pergunta.
 */
import { decodeRecipe, sanitizeRecipe, type Recipe } from "./recipe.js";
import { SANS_FONTS, MONO_FONTS } from "./themes/fonts.js";
import { PLUGIN_PRESETS } from "./plugins.js";

export interface CreateArgs {
  projectName?: string;
  recipe: Recipe;
  warnings: string[];
}

/** Opções que recebem valor, e o campo da receita que cada uma preenche. */
const VALUE_FLAGS = ["--receita", "--layout", "--esquema", "--modo", "--textura", "--fonte", "--mono", "--plugins"];

const key = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const MODES: Record<string, string> = { claro: "light", escuro: "dark", automatico: "system" };
const TEXTURES: Record<string, string> = { nenhuma: "none", grao: "grain", papel: "paper" };

/** `bricolage-grotesque` ou `Bricolage Grotesque` → nome oficial da família (ou o texto como veio). */
function font(value: string, list: { family: string }[]): string {
  return list.find((f) => key(f.family) === key(value))?.family ?? value;
}

function plugins(value: string): string[] {
  if (key(value) === "nenhum") return [];
  const preset = PLUGIN_PRESETS.find((p) => p.id === value);
  if (preset) return [...preset.plugins];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function parseCreateArgs(args: string[]): CreateArgs {
  let projectName: string | undefined;
  let recipeCode: string | undefined;
  const flags: Record<string, unknown> = {};
  const parseWarnings: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      projectName ??= arg;
      continue;
    }
    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg : arg.slice(0, eq);

    if (name === "--alternancia") { flags.colorModeToggle = true; continue; }
    if (name === "--sem-alternancia") { flags.colorModeToggle = false; continue; }
    if (!VALUE_FLAGS.includes(name)) {
      parseWarnings.push(`Opção desconhecida: ${name} (ignorada).`);
      continue;
    }

    let value: string | undefined;
    if (eq !== -1) value = arg.slice(eq + 1);
    else if (args[i + 1] !== undefined && !args[i + 1].startsWith("--")) value = args[++i];
    if (!value) {
      parseWarnings.push(`A opção ${name} precisa de um valor (ignorada).`);
      continue;
    }

    switch (name) {
      case "--receita": recipeCode = value; break;
      case "--layout": flags.layout = value; break;
      case "--esquema": flags.scheme = value; break;
      case "--modo": flags.colorMode = MODES[key(value)] ?? value; break;
      case "--textura": flags.texture = TEXTURES[key(value)] ?? value; break;
      case "--fonte": flags.fontSans = font(value, SANS_FONTS); break;
      case "--mono": flags.fontMono = font(value, MONO_FONTS); break;
      case "--plugins": flags.plugins = plugins(value); break;
    }
  }

  const fromCode = recipeCode ? decodeRecipe(recipeCode) : { recipe: {}, warnings: [] };
  const fromFlags = sanitizeRecipe(flags);
  return {
    projectName,
    recipe: { ...fromCode.recipe, ...fromFlags.recipe },
    warnings: [...fromCode.warnings, ...fromFlags.warnings, ...parseWarnings],
  };
}
