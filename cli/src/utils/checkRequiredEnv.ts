export type RequiredEnvVar = { name: string; description: string };

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
}

function parseEnvKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      keys.add(trimmed.slice(0, eqIndex).trim());
    }
  }
  return keys;
}

async function readEnvKeys(filePath: string, fs: FsModule): Promise<Set<string>> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return parseEnvKeys(content);
  } catch {
    return new Set();
  }
}

export async function checkRequiredEnv(
  projectDir: string,
  fs: FsModule
): Promise<RequiredEnvVar[]> {
  let required: RequiredEnvVar[] = [];
  try {
    const raw = await fs.readFile(`${projectDir}/required-env.json`, "utf-8");
    required = JSON.parse(raw) as RequiredEnvVar[];
  } catch {
    return [];
  }

  if (!required.length) return [];

  const envKeys = await readEnvKeys(`${projectDir}/.env`, fs);
  const envLocalKeys = await readEnvKeys(`${projectDir}/.env.local`, fs);
  const allKeys = new Set([...envKeys, ...envLocalKeys]);

  return required.filter((v) => !allKeys.has(v.name));
}
