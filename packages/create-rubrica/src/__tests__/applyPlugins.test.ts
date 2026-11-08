import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyPlugins } from "../transforms/applyPlugins.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

const stubRegistry = `export const PLUGIN_REGISTRY = [
  {
    id: 'blog',
    label: 'Blog',
    defaultEnabled: true,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    defaultEnabled: true,
  },
  {
    id: 'payments',
    label: 'Pagamentos',
    defaultEnabled: false,
  },
];
`;

describe("applyPlugins", () => {
  it("plugin com true → defaultEnabled: true em pluginRegistry.ts", async () => {
    const vol = Volume.fromJSON({ "/project/convex/pluginRegistry.ts": stubRegistry });
    const fs = makeFsModule(vol);

    await applyPlugins({ blog: true }, "/project/convex/pluginRegistry.ts", fs);

    const content = vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string;
    // blog should remain true
    expect(content).toMatch(/id: 'blog'[\s\S]*?defaultEnabled: true/);
  });

  it("plugin com false → defaultEnabled: false em pluginRegistry.ts", async () => {
    const vol = Volume.fromJSON({ "/project/convex/pluginRegistry.ts": stubRegistry });
    const fs = makeFsModule(vol);

    await applyPlugins({ blog: false }, "/project/convex/pluginRegistry.ts", fs);

    const content = vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string;
    expect(content).toMatch(/id: 'blog'[\s\S]*?defaultEnabled: false/);
  });

  it("plugin com id inexistente lança erro descritivo com o id", async () => {
    const vol = Volume.fromJSON({ "/project/convex/pluginRegistry.ts": stubRegistry });
    const fs = makeFsModule(vol);

    await expect(
      applyPlugins({ naoexiste: true } as Record<string, boolean>, "/project/convex/pluginRegistry.ts", fs)
    ).rejects.toThrow(/naoexiste/);
  });

  it("re-executar com mesmos valores não altera o arquivo (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project/convex/pluginRegistry.ts": stubRegistry });
    const fs = makeFsModule(vol);

    await applyPlugins({ blog: false, portfolio: true }, "/project/convex/pluginRegistry.ts", fs);
    const first = vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string;

    await applyPlugins({ blog: false, portfolio: true }, "/project/convex/pluginRegistry.ts", fs);
    const second = vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string;

    expect(first).toBe(second);
  });
});
