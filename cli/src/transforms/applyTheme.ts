import * as nodeFsPromises from "node:fs/promises";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

interface ThemeVars {
  root: string;
  dark: string;
}

const PRESETS: Record<string, ThemeVars> = {
  "editorial-cream": {
    root: `  --bg: #faf7f2;
  --text: #1a1614;
  --primary: #a855f7;
  --accent: #ef4444;`,
    dark: ``,
  },
  "paper-noir": {
    root: `  --bg: #f0eee9;
  --text: #0a0a0a;
  --primary: #ef4444;
  --accent: #3b82f6;`,
    dark: ``,
  },
  "midnight-blue": {
    root: `  --bg: #0a1224;
  --text: #e8e6e0;
  --primary: #06b6d4;
  --accent: #facc15;`,
    dark: ``,
  },
  "solar-warm": {
    root: `  --bg: #1a1410;
  --text: #f2ede4;
  --primary: #f97316;
  --accent: #facc15;`,
    dark: ``,
  },
};

function replaceBlock(css: string, selector: string, newVars: string): string {
  const re = new RegExp(`(${selector.replace(".", "\\.")} \\{)[^}]*(\\})`, "s");
  return css.replace(re, `$1\n${newVars}\n$2`);
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
  let updated = replaceBlock(css, ":root", theme.root);
  if (theme.dark) {
    updated = replaceBlock(updated, ".dark", theme.dark);
  }
  await fsModule.writeFile(cssPath, updated);
}
