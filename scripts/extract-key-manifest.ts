import fs from "fs";
import path from "path";

export type KeyUsage = { file: string; line: number };
export type KeyManifest = Record<string, KeyUsage[]>;

const KEY_REGEX = /\bt\(\s*['"]([^'"]+)['"]\s*\)/g;

export function extractKeysFromContent(content: string, filePath: string): KeyManifest {
  const manifest: KeyManifest = {};
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match: RegExpExecArray | null;
    KEY_REGEX.lastIndex = 0;
    while ((match = KEY_REGEX.exec(line)) !== null) {
      const key = match[1];
      if (!manifest[key]) manifest[key] = [];
      manifest[key].push({ file: filePath, line: i + 1 });
    }
  }
  return manifest;
}

export function mergeManifests(...manifests: KeyManifest[]): KeyManifest {
  const merged: KeyManifest = {};
  for (const m of manifests) {
    for (const [key, usages] of Object.entries(m)) {
      if (!merged[key]) merged[key] = [];
      merged[key].push(...usages);
    }
  }
  return merged;
}

export async function extractKeysFromDir(dir: string): Promise<KeyManifest> {
  const manifests: KeyManifest[] = [];
  async function walk(current: string) {
    const entries = await fs.promises.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(tsx|ts)$/.test(entry.name)) {
        const content = await fs.promises.readFile(full, "utf-8");
        const relative = path.relative(dir, full);
        manifests.push(extractKeysFromContent(content, relative));
      }
    }
  }
  await walk(dir);
  return mergeManifests(...manifests);
}

export async function saveManifest(manifest: KeyManifest, outputPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}
