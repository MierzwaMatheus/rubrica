import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";

export interface FsModule {
  access: (path: string) => Promise<void>;
}

export async function detectProject(
  startDir: string,
  fsModule: FsModule = nodeFsPromises
): Promise<string> {
  let current = startDir;

  while (true) {
    const candidate = path.join(current, "rubrica.json");
    try {
      await fsModule.access(candidate);
      return candidate;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        throw new Error(
          `detectProject: nenhum rubrica.json encontrado em "${startDir}" nem em nenhum diretório ancestral.`
        );
      }
      current = parent;
    }
  }
}
