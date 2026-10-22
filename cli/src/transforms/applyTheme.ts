import * as nodeFsPromises from "node:fs/promises";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

/** Contrato de 4 cores: as únicas variáveis que um tema define (ver src/index.css). */
type ThemeVars = Record<"--bg" | "--text" | "--primary" | "--accent", string>;

const PRESETS: Record<string, ThemeVars> = {
  "editorial-cream": { "--bg": "#faf7f2", "--text": "#1a1614", "--primary": "#a855f7", "--accent": "#ef4444" },
  "paper-noir": { "--bg": "#f0eee9", "--text": "#0a0a0a", "--primary": "#ef4444", "--accent": "#3b82f6" },
  "midnight-blue": { "--bg": "#0a1224", "--text": "#e8e6e0", "--primary": "#06b6d4", "--accent": "#facc15" },
  "solar-warm": { "--bg": "#1a1410", "--text": "#f2ede4", "--primary": "#f97316", "--accent": "#facc15" },
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Atualiza as variáveis do contrato dentro do primeiro bloco `selector { ... }`,
 * preservando as demais declarações. Com `addMissing`, acrescenta as que faltam.
 */
function setVars(css: string, selector: string, vars: ThemeVars, addMissing: boolean): string {
  const blockRe = new RegExp(`(^|\\n)(\\s*${escapeRegExp(selector)}\\s*\\{)([^}]*)(\\})`);
  return css.replace(blockRe, (_m, lead: string, open: string, body: string, close: string) => {
    let updated = body;
    const missing: string[] = [];
    for (const [name, value] of Object.entries(vars)) {
      const declRe = new RegExp(`(^|[\\s;{])(${escapeRegExp(name)}\\s*:)[^;}]*`);
      if (declRe.test(updated)) {
        updated = updated.replace(declRe, `$1$2 ${value}`);
      } else if (addMissing) {
        missing.push(`  ${name}: ${value};`);
      }
    }
    if (missing.length) {
      updated = `${updated.replace(/\s*$/, "")}\n${missing.join("\n")}\n`;
    }
    return `${lead}${open}${updated}${close}`;
  });
}

export async function applyTheme(
  options: { preset: string },
  cssPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const theme = PRESETS[options.preset];
  if (!theme) {
    throw new Error(`applyTheme: preset "${options.preset}" não encontrado.`);
  }

  const css = await fsModule.readFile(cssPath, "utf-8");
  let updated = setVars(css, ":root", theme, true);
  // O app roda com a classe .dark no <html>: se o .dark redeclarar alguma variável
  // do contrato, ela sobrescreveria o tema, então é atualizada também.
  updated = setVars(updated, ".dark", theme, false);
  await fsModule.writeFile(cssPath, updated);
}
