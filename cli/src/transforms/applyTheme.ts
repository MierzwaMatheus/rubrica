import * as nodeFsPromises from "node:fs/promises";
import { getScheme, schemeCss, SCHEME_START, SCHEME_END, LEGACY_ROLES, ROLE_VARS } from "../themes/schemes.js";

/**
 * O que o CLI gravava antes do esquema completo (versões até 1.0.0). O `update` remonta
 * projetos antigos com estes valores exatos para reconhecer o que o usuário mudou.
 */
const PRE_SCHEME_PRESETS: Record<string, Record<string, string>> = {
  "editorial-cream": { "--bg": "#faf7f2", "--text": "#1a1614", "--primary": "#a855f7", "--accent": "#ef4444" },
  "paper-noir": { "--bg": "#f0eee9", "--text": "#0a0a0a", "--primary": "#ef4444", "--accent": "#3b82f6" },
  "midnight-blue": { "--bg": "#0a1224", "--text": "#e8e6e0", "--primary": "#06b6d4", "--accent": "#facc15" },
  "solar-warm": { "--bg": "#1a1410", "--text": "#f2ede4", "--primary": "#f97316", "--accent": "#facc15" },
};

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Atualiza variáveis dentro do primeiro bloco `selector { ... }`, preservando as demais
 * declarações. Usado só em projetos antigos, cujo index.css ainda não tem os marcadores.
 */
function setVars(css: string, selector: string, vars: Record<string, string>, addMissing: boolean): string {
  const blockRe = new RegExp(`(^|\\n)(\\s*${escapeRegExp(selector)}\\s*\\{)([^}]*)(\\})`);
  return css.replace(blockRe, (_m, lead: string, open: string, body: string, close: string) => {
    let updated = body;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(vars)) {
      const declRe = new RegExp(`(^|[\\s;{])(${escapeRegExp(name)}\\s*:)[^;}]*`);
      if (declRe.test(updated)) updated = updated.replace(declRe, `$1$2 ${value}`);
      else if (addMissing) missing.push(`  ${name}: ${value};`);
    }
    if (missing.length) updated = `${updated.replace(/\s*$/, "")}\n${missing.join("\n")}\n`;
    return `${lead}${open}${updated}${close}`;
  });
}

/**
 * Grava o esquema de cores em src/index.css: o modo claro em `:root` e o escuro em `.dark`,
 * entre os marcadores `rubrica:esquema`. Em um index.css antigo (sem marcadores), atualiza
 * só as 4 cores do contrato original no `:root`, como antes.
 */
export async function applyTheme(
  options: { preset: string },
  cssPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const scheme = getScheme(options.preset);
  if (!scheme) {
    throw new Error(`applyTheme: esquema "${options.preset}" não encontrado.`);
  }

  const css = await fsModule.readFile(cssPath, "utf-8");
  const block = new RegExp(`${escapeRegExp(SCHEME_START)}[\\s\\S]*?${escapeRegExp(SCHEME_END)}`);

  let updated: string;
  if (block.test(css)) {
    updated = css.replace(block, () => schemeCss(scheme));
  } else {
    const legacy =
      PRE_SCHEME_PRESETS[scheme.id] ?? Object.fromEntries(LEGACY_ROLES.map((r) => [ROLE_VARS[r], scheme.dark[r]]));
    updated = setVars(setVars(css, ":root", legacy, true), ".dark", legacy, false);
  }
  await fsModule.writeFile(cssPath, updated);
}
