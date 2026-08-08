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

export type RubricaState = {
  version: string;
  layout: "cyberpunk" | "brutalist" | "swiss" | "bento";
  theme: string;
  fontSans: string;
  fontMono: string;
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
