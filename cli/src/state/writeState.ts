import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { readState } from "./readState.js";
import type { FsModule, RubricaState } from "./readState.js";

export async function writeState(
  projectDir: string,
  partial: Partial<RubricaState>,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<RubricaState> {
  const filePath = path.join(projectDir, "rubrica.json");

  let current: RubricaState;
  try {
    current = await readState(projectDir, fsModule);
  } catch {
    current = {} as RubricaState;
  }

  const merged: RubricaState = { ...current, ...partial };
  await fsModule.mkdir(projectDir, { recursive: true });
  await fsModule.writeFile(filePath, JSON.stringify(merged, null, 2));
  return merged;
}
