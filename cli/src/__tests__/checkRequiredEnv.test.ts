import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { checkRequiredEnv } from "../utils/checkRequiredEnv.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    access: (path: string) =>
      vol.promises.access(path).then(() => undefined),
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

// ---- Ciclo 2: var presente em .env → não aparece no output -----------------

describe("checkRequiredEnv — var presente no .env", () => {
  it("não retorna var quando .env já contém STRIPE_SECRET_KEY", async () => {
    const vol = Volume.fromJSON({
      "/project/required-env.json": JSON.stringify([
        { name: "STRIPE_SECRET_KEY", description: "Chave secreta do Stripe" },
      ]),
      "/project/.env": "STRIPE_SECRET_KEY=sk_test_abc\nOTHER=x\n",
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toHaveLength(0);
  });

  it("não retorna var quando .env.local já contém a var requerida", async () => {
    const vol = Volume.fromJSON({
      "/project/required-env.json": JSON.stringify([
        { name: "OPENROUTER_API_KEY", description: "Chave OpenRouter" },
      ]),
      "/project/.env.local": "OPENROUTER_API_KEY=key123\n",
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toHaveLength(0);
  });
});

// ---- Ciclo 3: .env não existe → todas as vars faltam -----------------------

describe("checkRequiredEnv — .env inexistente", () => {
  it("retorna todas as vars quando não há .env nem .env.local", async () => {
    const vol = Volume.fromJSON({
      "/project/required-env.json": JSON.stringify([
        { name: "STRIPE_SECRET_KEY", description: "Chave Stripe" },
        { name: "OPENROUTER_API_KEY", description: "Chave OpenRouter" },
      ]),
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toHaveLength(2);
    expect(missing.map((v) => v.name)).toContain("STRIPE_SECRET_KEY");
    expect(missing.map((v) => v.name)).toContain("OPENROUTER_API_KEY");
  });
});

// ---- Ciclo 4: required-env.json ausente ou vazio → retorna [] --------------

describe("checkRequiredEnv — required-env.json ausente ou vazio", () => {
  it("retorna [] quando required-env.json não existe", async () => {
    const vol = Volume.fromJSON({
      "/project/.env": "SOME_VAR=x\n",
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toEqual([]);
  });

  it("retorna [] quando required-env.json contém array vazio", async () => {
    const vol = Volume.fromJSON({
      "/project/required-env.json": JSON.stringify([]),
      "/project/.env": "SOME_VAR=x\n",
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toEqual([]);
  });
});

// ---- Ciclo 1: var faltante quando .env não contém --------------------------

describe("checkRequiredEnv — var ausente no .env", () => {
  it("retorna var faltante quando required-env.json lista STRIPE_SECRET_KEY e .env não contém", async () => {
    const vol = Volume.fromJSON({
      "/project/required-env.json": JSON.stringify([
        { name: "STRIPE_SECRET_KEY", description: "Chave secreta do Stripe" },
      ]),
      "/project/.env": "OTHER_VAR=abc\n",
    });
    const fs = makeFsModule(vol);

    const missing = await checkRequiredEnv("/project", fs);

    expect(missing).toHaveLength(1);
    expect(missing[0].name).toBe("STRIPE_SECRET_KEY");
    expect(missing[0].description).toBe("Chave secreta do Stripe");
  });
});
