import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { readState } from "../state/readState.js";

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

const validState = {
  version: "1.0.0",
  layout: "cyberpunk" as const,
  theme: "editorial-cream",
  fontSans: "Chakra Petch",
  fontMono: "JetBrains Mono",
  plugins: { blog: true, portfolio: true },
};

describe("readState", () => {
  it("cria rubrica.json com defaults quando arquivo não existe", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect(result.version).toBe("0.0.0");
    expect(result.layout).toBe("cyberpunk");
    expect(result.theme).toBe("editorial-cream");
    expect(result.plugins).toEqual({});
  });

  it("DEFAULT_STATE não possui campo radius", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect((result as Record<string, unknown>).radius).toBeUndefined();
  });

  it("DEFAULT_STATE não possui campo accentColor", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect((result as Record<string, unknown>).accentColor).toBeUndefined();
  });

  it("arquivo existente com radius e accentColor ainda parseia (forward-compat)", async () => {
    const stateWithOldFields = { ...validState, radius: "0.5rem", accentColor: null };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(stateWithOldFields),
    });
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect(result.version).toBe("1.0.0");
    expect(result.layout).toBe("cyberpunk");
  });

  it("preserva campos desconhecidos no objeto retornado (forward-compat)", async () => {
    const stateWithExtra = { ...validState, unknownField: "foo", extraNested: { a: 1 } };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(stateWithExtra),
    });
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect((result as Record<string, unknown>).unknownField).toBe("foo");
    expect((result as Record<string, unknown>).extraNested).toEqual({ a: 1 });
  });

  it("lança erro descritivo quando campo obrigatório layout está ausente", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify({ version: "1.0.0" }),
    });
    const fs = makeFsModule(vol);

    await expect(readState("/project", fs)).rejects.toThrow(/layout/);
  });

  it("lança erro descritivo quando campo obrigatório version está ausente", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify({ layout: "cyberpunk" }),
    });
    const fs = makeFsModule(vol);

    await expect(readState("/project", fs)).rejects.toThrow(/version/);
  });

  it("lê rubrica.json existente e retorna objeto tipado sem radius nem accentColor", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(validState),
    });
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect(result.version).toBe("1.0.0");
    expect(result.layout).toBe("cyberpunk");
    expect(result.theme).toBe("editorial-cream");
    expect(result.fontSans).toBe("Chakra Petch");
    expect(result.fontMono).toBe("JetBrains Mono");
    expect(result.plugins).toEqual({ blog: true, portfolio: true });
    expect((result as Record<string, unknown>).radius).toBeUndefined();
    expect((result as Record<string, unknown>).accentColor).toBeUndefined();
  });
});
