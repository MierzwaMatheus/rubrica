import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface RubricalConfigInput {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
  twitterHandle: string;
  lang: string;
  seoHomeTitle: string;
  seoHomeDescription: string;
  rssTitle: string;
  rssDescription: string;
  ogImageUrl: string;
  fontSans: string;
  fontMono: string;
}

function generateContent(config: RubricalConfigInput): string {
  return `export const rubricalConfig = {
  siteName: ${JSON.stringify(config.siteName)},
  siteUrl: ${JSON.stringify(config.siteUrl)},
  siteDescription: ${JSON.stringify(config.siteDescription)},
  authorName: ${JSON.stringify(config.authorName)},
  authorEmail: ${JSON.stringify(config.authorEmail)},
  twitterHandle: ${JSON.stringify(config.twitterHandle)},
  lang: ${JSON.stringify(config.lang)},
  seoHomeTitle: ${JSON.stringify(config.seoHomeTitle)},
  seoHomeDescription: ${JSON.stringify(config.seoHomeDescription)},
  rssTitle: ${JSON.stringify(config.rssTitle)},
  rssDescription: ${JSON.stringify(config.rssDescription)},
  ogImageUrl: ${JSON.stringify(config.ogImageUrl)},
  fontSans: ${JSON.stringify(config.fontSans)},
  fontMono: ${JSON.stringify(config.fontMono)},
};
`;
}

export async function applyRubricalConfig(
  config: RubricalConfigInput,
  targetDir: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const filePath = path.join(targetDir, "rubrica.config.ts");
  await fsModule.mkdir(targetDir, { recursive: true });
  await fsModule.writeFile(filePath, generateContent(config));
}
