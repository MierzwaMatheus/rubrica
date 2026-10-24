/**
 * Receita: as escolhas feitas no site do Rubrica, levadas ao CLI num único parâmetro
 * (`npx create-rubrica@latest <pasta> --receita <código>`).
 *
 * O código é o JSON com chaves curtas, em base64url: só letras, números, `-` e `_`, então
 * funciona colado em qualquer terminal (bash, PowerShell, cmd) sem aspas. Este módulo roda
 * também no navegador (o site importa daqui): nada de APIs do Node.
 *
 * Tudo é opcional: o que faltar, ou o que o CLI não reconhecer, ele pergunta.
 */
import { LAYOUTS, COLOR_MODES, TEXTURES, getLayout, type ColorMode, type Texture } from "./layouts.js";
import { SCHEMES } from "./themes/schemes.js";
import { SANS_FONTS, MONO_FONTS } from "./themes/fonts.js";
import { PLUGINS } from "./plugins.js";
import { normalizeUrl, validateUrl, normalizeEmail, validateEmail, normalizeHandle } from "./utils/normalize.js";

/** Suba quando o formato mudar de um jeito que um CLI antigo não entenda. */
export const RECIPE_VERSION = 1;

export interface RecipeIdentity {
  authorName?: string;
  siteName?: string;
  siteUrl?: string;
  siteDescription?: string;
  authorEmail?: string;
  twitterHandle?: string;
  lang?: string;
  /** Aparece abaixo do nome no site; o setup grava no contato. */
  profession?: string;
  /** Separadas por vírgula; entram no contexto que a IA usa nas propostas. */
  specialties?: string;
}

export interface Recipe {
  layout?: string;
  scheme?: string;
  colorMode?: ColorMode;
  colorModeToggle?: boolean;
  texture?: Texture;
  fontSans?: string;
  fontMono?: string;
  plugins?: string[];
  identity?: RecipeIdentity;
}

// Chaves curtas: deixam o comando menor. Mudar uma delas quebra receitas já copiadas.
const KEYS = {
  layout: "l",
  scheme: "s",
  colorMode: "m",
  colorModeToggle: "a",
  texture: "t",
  fontSans: "f",
  fontMono: "fm",
  plugins: "p",
  identity: "i",
} as const;
const IDENTITY_KEYS = {
  authorName: "n",
  siteName: "sn",
  siteUrl: "u",
  siteDescription: "d",
  authorEmail: "e",
  twitterHandle: "x",
  lang: "lg",
  profession: "pf",
  specialties: "es",
} as const;
const LANGS = ["pt-BR", "en-US"];

// ---- base64url (navegador e Node 20+) ---------------------------------------

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

// ---- codificar / decodificar ------------------------------------------------

export function encodeRecipe(recipe: Recipe): string {
  const out: Record<string, unknown> = { v: RECIPE_VERSION };
  for (const [long, short] of Object.entries(KEYS)) {
    const value = recipe[long as keyof Recipe];
    if (value === undefined || long === "identity") continue;
    out[short] = value;
  }
  if (recipe.identity) {
    const id: Record<string, string> = {};
    for (const [long, short] of Object.entries(IDENTITY_KEYS)) {
      const value = recipe.identity[long as keyof RecipeIdentity];
      if (value !== undefined) id[short] = value;
    }
    if (Object.keys(id).length) out[KEYS.identity] = id;
  }
  return toBase64Url(JSON.stringify(out));
}

const INVALID = "Essa receita não é válida. Copie o comando de novo no site do Rubrica.";

export function decodeRecipe(code: string): { recipe: Recipe; warnings: string[] } {
  let data: unknown;
  try {
    const trimmed = code.trim();
    if (!trimmed) throw new Error("vazio");
    data = JSON.parse(fromBase64Url(trimmed));
  } catch {
    throw new Error(INVALID);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(INVALID);
  const raw = data as Record<string, unknown>;

  const expanded: Record<string, unknown> = {};
  for (const [long, short] of Object.entries(KEYS)) {
    if (raw[short] !== undefined) expanded[long] = raw[short];
  }
  const rawId = raw[KEYS.identity];
  if (rawId && typeof rawId === "object" && !Array.isArray(rawId)) {
    const id: Record<string, unknown> = {};
    for (const [long, short] of Object.entries(IDENTITY_KEYS)) {
      const value = (rawId as Record<string, unknown>)[short];
      if (value !== undefined) id[long] = value;
    }
    expanded.identity = id;
  }

  const result = sanitizeRecipe(expanded);
  if (typeof raw.v === "number" && raw.v > RECIPE_VERSION) {
    result.warnings.unshift(
      "Essa receita é de uma versão mais nova do Rubrica. Rode com `npx create-rubrica@latest` para aproveitar tudo."
    );
  }
  return result;
}

// ---- validação --------------------------------------------------------------

/** Mantém só o que o CLI conhece; o resto vira aviso (e será perguntado). */
export function sanitizeRecipe(input: Record<string, unknown>): { recipe: Recipe; warnings: string[] } {
  const recipe: Recipe = {};
  const warnings: string[] = [];
  const str = (v: unknown): v is string => typeof v === "string";

  const pick = <K extends keyof Recipe>(key: K, valid: (v: string) => boolean, what: string) => {
    const value = input[key];
    if (!str(value)) return;
    if (valid(value)) (recipe as Record<string, unknown>)[key] = value;
    else warnings.push(`${what} "${value}" não existe nesta versão; vou perguntar.`);
  };

  pick("layout", (v) => LAYOUTS.some((l) => l.id === v), "Layout");
  pick("scheme", (v) => SCHEMES.some((s) => s.id === v), "Esquema de cores");
  pick("colorMode", (v) => COLOR_MODES.some((m) => m.value === v), "Modo de cor");
  pick("texture", (v) => TEXTURES.some((t) => t.value === v), "Textura");
  pick("fontSans", (v) => SANS_FONTS.some((f) => f.family === v), "Fonte");
  pick("fontMono", (v) => v === "" || MONO_FONTS.some((f) => f.family === v), "Fonte mono");
  if (typeof input.colorModeToggle === "boolean") recipe.colorModeToggle = input.colorModeToggle;

  if (Array.isArray(input.plugins)) {
    recipe.plugins = [];
    for (const id of input.plugins) {
      if (str(id) && PLUGINS.some((p) => p.id === id)) recipe.plugins.push(id);
      else warnings.push(`Plugin "${String(id)}" não existe nesta versão; ficou de fora.`);
    }
  }

  const rawId = input.identity;
  if (rawId && typeof rawId === "object" && !Array.isArray(rawId)) {
    const id = rawId as Record<string, unknown>;
    const identity: RecipeIdentity = {};
    for (const key of ["authorName", "siteName", "siteDescription", "profession", "specialties"] as const) {
      if (str(id[key]) && id[key].trim()) identity[key] = id[key].trim();
    }
    if (str(id.siteUrl) && id.siteUrl.trim()) {
      if (validateUrl(id.siteUrl)) warnings.push(`Endereço "${id.siteUrl}" não parece válido; vou perguntar.`);
      else identity.siteUrl = normalizeUrl(id.siteUrl);
    }
    if (str(id.authorEmail) && id.authorEmail.trim()) {
      if (validateEmail(id.authorEmail)) warnings.push(`E-mail "${id.authorEmail}" não parece válido; vou perguntar.`);
      else identity.authorEmail = normalizeEmail(id.authorEmail);
    }
    if (str(id.twitterHandle) && normalizeHandle(id.twitterHandle)) identity.twitterHandle = normalizeHandle(id.twitterHandle);
    if (str(id.lang)) {
      if (LANGS.includes(id.lang)) identity.lang = id.lang;
      else warnings.push(`Idioma "${id.lang}" não é suportado; vou usar pt-BR.`);
    }
    if (Object.keys(identity).length) recipe.identity = identity;
  }

  return { recipe, warnings };
}

// ---- comando e resumo -------------------------------------------------------

/** Nome de pasta a partir do nome do site: minúsculo, sem acento, com hífens. */
export function projectNameFrom(siteName: string): string {
  const slug = siteName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "meu-portfolio";
}

export function recipeCommand(projectName: string, recipe: Recipe): string {
  return `npx create-rubrica@latest ${projectName} --receita ${encodeRecipe(recipe)}`;
}

/** Linhas para mostrar antes de criar: só o que veio na receita. */
export function recipeSummary(recipe: Recipe): string[] {
  const lines: string[] = [];
  if (recipe.layout) lines.push(`Layout: ${getLayout(recipe.layout)?.label ?? recipe.layout}`);

  const colors: string[] = [];
  if (recipe.scheme) colors.push(SCHEMES.find((s) => s.id === recipe.scheme)?.label ?? recipe.scheme);
  if (recipe.colorMode) {
    const mode = COLOR_MODES.find((m) => m.value === recipe.colorMode)?.label ?? recipe.colorMode;
    colors.push(`modo ${mode.toLowerCase()}`);
  }
  if (recipe.colorModeToggle !== undefined) colors.push(recipe.colorModeToggle ? "com botão para alternar" : "sem botão para alternar");
  if (colors.length) lines.push(`Cores: ${colors.join(", ")}`);

  if (recipe.texture) lines.push(`Textura: ${TEXTURES.find((t) => t.value === recipe.texture)?.label ?? recipe.texture}`);
  if (recipe.fontSans) lines.push(`Fontes: ${[recipe.fontSans, recipe.fontMono].filter(Boolean).join(" e ")}`);
  if (recipe.plugins) {
    const names = recipe.plugins.map((id) => PLUGINS.find((p) => p.id === id)?.label ?? id);
    lines.push(`Plugins: ${names.length ? names.join(", ") : "nenhum"}`);
  }

  const id = recipe.identity ?? {};
  if (id.authorName) lines.push(`Nome: ${id.authorName}`);
  const site = [id.siteName, id.siteUrl].filter(Boolean).join(" — ");
  if (site) lines.push(`Site: ${site}`);
  if (id.authorEmail) lines.push(`E-mail: ${id.authorEmail}`);
  if (id.profession) lines.push(`Profissão: ${id.profession}${id.specialties ? ` (${id.specialties})` : ""}`);
  return lines;
}
