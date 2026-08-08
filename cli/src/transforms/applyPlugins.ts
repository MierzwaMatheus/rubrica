import * as nodeFsPromises from "node:fs/promises";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export async function applyPlugins(
  plugins: Record<string, boolean>,
  registryPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  let content = await fsModule.readFile(registryPath, "utf-8");

  for (const [id, enabled] of Object.entries(plugins)) {
    // Check if the plugin id exists in the file
    if (!content.includes(`id: '${id}'`)) {
      throw new Error(`applyPlugins: plugin id "${id}" não encontrado em "${registryPath}".`);
    }

    // Replace defaultEnabled for this specific plugin block
    // Match from the id line to the next defaultEnabled occurrence
    content = content.replace(
      new RegExp(`(id: '${id}'[\\s\\S]*?defaultEnabled: )(?:true|false)`, ""),
      `$1${enabled}`
    );
  }

  await fsModule.writeFile(registryPath, content);
}
