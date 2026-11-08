import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { detectProject } from "../utils/detectProject.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    access: (path: string) =>
      vol.promises.access(path).then(() => undefined),
  };
}

describe("detectProject", () => {
  it("encontra rubrica.json no diretório atual", async () => {
    const vol = Volume.fromJSON({ "/project/rubrica.json": "{}" });
    const fsModule = makeFsModule(vol);

    const result = await detectProject("/project", fsModule);
    expect(result).toBe("/project/rubrica.json");
  });

  it("encontra rubrica.json dois níveis acima", async () => {
    const vol = Volume.fromJSON({ "/project/rubrica.json": "{}" });
    const fsModule = makeFsModule(vol);

    const result = await detectProject("/project/src/components", fsModule);
    expect(result).toBe("/project/rubrica.json");
  });

  it("lança erro amigável quando rubrica.json não existe em nenhum ancestral", async () => {
    const vol = Volume.fromJSON({});
    const fsModule = makeFsModule(vol);

    await expect(detectProject("/some/dir", fsModule)).rejects.toThrow(
      /detectProject/
    );
  });

  it("retorna o caminho absoluto para rubrica.json", async () => {
    const vol = Volume.fromJSON({ "/workspace/my-portfolio/rubrica.json": "{}" });
    const fsModule = makeFsModule(vol);

    const result = await detectProject("/workspace/my-portfolio/src", fsModule);
    expect(result).toBe("/workspace/my-portfolio/rubrica.json");
    expect(result.startsWith("/")).toBe(true);
  });
});
