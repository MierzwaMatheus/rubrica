import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export type RubricaIdentity = {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
  twitterHandle: string;
  lang: string;
};

/** Id de um layout do registro (cli/src/layouts.ts). */
export type RubricaLayout = string;

export type RubricaState = {
  version: string;
  layout: RubricaLayout;
  theme: string;
  fontSans: string;
  fontMono: string;
  /** Aparência (modo de cor e textura). Projetos antigos não têm: vale o padrão escuro, sem textura. */
  colorMode?: "light" | "dark" | "system";
  colorModeToggle?: boolean;
  texture?: "none" | "grain" | "paper" | "scanlines";
  plugins: Record<string, boolean>;
  identity?: RubricaIdentity;
  [key: string]: unknown;
};

const DEFAULT_STATE: RubricaState = {
  version: "0.0.0",
  layout: "cyberpunk",
  theme: "editorial-cream",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  plugins: {},
};

export async function readState(
  projectDir: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<RubricaState> {
  const filePath = path.join(projectDir, "rubrica.json");

  let raw: string;
  try {
    raw = await fsModule.readFile(filePath, "utf-8");
  } catch {
    const state = { ...DEFAULT_STATE };
    await fsModule.mkdir(projectDir, { recursive: true });
    await fsModule.writeFile(filePath, JSON.stringify(state, null, 2));
    return state;
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (!("version" in parsed) || parsed.version === undefined) {
    throw new Error(
      `readState: campo obrigatório "version" ausente em "${filePath}".`
    );
  }

  if (!("layout" in parsed) || parsed.layout === undefined) {
    throw new Error(
      `readState: campo obrigatório "layout" ausente em "${filePath}".`
    );
  }

  return parsed as RubricaState;
}
