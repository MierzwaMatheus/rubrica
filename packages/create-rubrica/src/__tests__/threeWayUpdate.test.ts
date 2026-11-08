import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { planUpdate, applyPlan, formatPlan, NEW_SUFFIX } from "../utils/threeWayUpdate.js";
import { writeTree, readTree, type ReleaseFiles } from "./helpers/releaseFixture.js";

let root: string;
let dirs: { base: string; next: string; project: string };

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(tmpdir(), "rubrica-3way-"));
  dirs = { base: path.join(root, "base"), next: path.join(root, "next"), project: path.join(root, "project") };
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

async function run(base: ReleaseFiles, next: ReleaseFiles, project: ReleaseFiles) {
  await writeTree(dirs.base, base);
  await writeTree(dirs.next, next);
  await writeTree(dirs.project, project);
  const actions = await planUpdate(dirs);
  await applyPlan(dirs.project, actions);
  return { actions, files: await readTree(dirs.project) };
}

const LINES = (...l: string[]) => l.join("\n") + "\n";

describe("planUpdate + applyPlan", () => {
  it("arquivo que o usuário não mexeu recebe a versão nova", async () => {
    const { actions, files } = await run({ "a.ts": "v1\n" }, { "a.ts": "v2\n" }, { "a.ts": "v1\n" });
    expect(files["a.ts"]).toBe("v2\n");
    expect(actions[0]!.kind).toBe("update");
  });

  it("arquivo personalizado que o Rubrica não mudou fica intacto", async () => {
    const { actions, files } = await run({ "a.ts": "v1\n" }, { "a.ts": "v1\n" }, { "a.ts": "meu\n" });
    expect(files["a.ts"]).toBe("meu\n");
    expect(actions).toHaveLength(0);
  });

  it("mudanças em trechos diferentes são mescladas, preservando as do usuário", async () => {
    const base = LINES("um", "dois", "três", "quatro", "cinco", "seis");
    const mine = LINES("UM (meu)", "dois", "três", "quatro", "cinco", "seis");
    const next = LINES("um", "dois", "três", "quatro", "cinco", "SEIS (rubrica)");
    const { actions, files } = await run({ "a.css": base }, { "a.css": next }, { "a.css": mine });
    expect(actions[0]!.kind).toBe("merge");
    expect(files["a.css"]).toBe(LINES("UM (meu)", "dois", "três", "quatro", "cinco", "SEIS (rubrica)"));
  });

  it("mudança no mesmo trecho mantém o arquivo do usuário e salva a versão nova ao lado", async () => {
    const { actions, files } = await run(
      { "a.css": LINES("cor: azul") },
      { "a.css": LINES("cor: verde") },
      { "a.css": LINES("cor: vermelho") }
    );
    expect(actions[0]!.kind).toBe("conflict");
    expect(files["a.css"]).toBe(LINES("cor: vermelho"));
    expect(files[`a.css${NEW_SUFFIX}`]).toBe(LINES("cor: verde"));
  });

  it("arquivo novo do Rubrica é adicionado", async () => {
    const { files } = await run({}, { "novo.ts": "x\n" }, {});
    expect(files["novo.ts"]).toBe("x\n");
  });

  it("arquivo removido no Rubrica sai se o usuário não mexeu, e fica se mexeu", async () => {
    const { actions, files } = await run(
      { "velho.ts": "x\n", "meu-velho.ts": "x\n" },
      {},
      { "velho.ts": "x\n", "meu-velho.ts": "editado\n" }
    );
    expect(files["velho.ts"]).toBeUndefined();
    expect(files["meu-velho.ts"]).toBe("editado\n");
    expect(actions.find((a) => a.file === "meu-velho.ts")!.kind).toBe("keep");
  });

  it("arquivo que o usuário apagou continua apagado, com a versão nova ao lado se o Rubrica mudou", async () => {
    const { files } = await run({ "a.ts": "v1\n", "b.ts": "v1\n" }, { "a.ts": "v2\n", "b.ts": "v1\n" }, {});
    expect(files["a.ts"]).toBeUndefined();
    expect(files[`a.ts${NEW_SUFFIX}`]).toBe("v2\n");
    expect(files["b.ts"]).toBeUndefined();
  });

  it("arquivo criado pelo usuário com o nome de um arquivo novo do Rubrica não é sobrescrito", async () => {
    const { files } = await run({}, { "x.ts": "rubrica\n" }, { "x.ts": "meu\n" });
    expect(files["x.ts"]).toBe("meu\n");
    expect(files[`x.ts${NEW_SUFFIX}`]).toBe("rubrica\n");
  });

  it("nunca toca em .env, rubrica.json e dados gerados em public/data", async () => {
    const { actions, files } = await run(
      { ".env.local": "A=1\n", "rubrica.json": "{}", "public/data/home.json": "{}" },
      { ".env.local": "A=2\n", "rubrica.json": "{\"x\":1}", "public/data/home.json": "{\"demo\":true}" },
      { ".env.local": "A=1\n", "rubrica.json": "{}", "public/data/home.json": "{}" }
    );
    expect(actions).toHaveLength(0);
    expect(files[".env.local"]).toBe("A=1\n");
    expect(files["public/data/home.json"]).toBe("{}");
  });

  it("binário alterado dos dois lados fica com a versão do usuário", async () => {
    const bin = (n: number) => Buffer.from([0, 1, 2, n]);
    await writeTree(dirs.base, { "logo.png": bin(1) });
    await writeTree(dirs.next, { "logo.png": bin(2) });
    await writeTree(dirs.project, { "logo.png": bin(3) });
    const actions = await planUpdate(dirs);
    await applyPlan(dirs.project, actions);
    expect(actions[0]!.kind).toBe("conflict");
    expect(await fs.readFile(path.join(dirs.project, "logo.png"))).toEqual(bin(3));
  });

  it("lockfile alterado dos dois lados fica como está", async () => {
    const { actions, files } = await run(
      { "pnpm-lock.yaml": "a\n" },
      { "pnpm-lock.yaml": "b\n" },
      { "pnpm-lock.yaml": "c\n" }
    );
    expect(actions[0]!.kind).toBe("lockfile");
    expect(files["pnpm-lock.yaml"]).toBe("c\n");
    expect(files[`pnpm-lock.yaml${NEW_SUFFIX}`]).toBeUndefined();
  });

  it("arquivos que só existem no projeto do usuário não aparecem no plano", async () => {
    const { actions, files } = await run({}, {}, { "src/meu-componente.tsx": "x\n" });
    expect(actions).toHaveLength(0);
    expect(files["src/meu-componente.tsx"]).toBe("x\n");
  });
});

describe("formatPlan", () => {
  it("agrupa por tipo e explica conflitos", () => {
    const text = formatPlan([
      { file: "a.ts", kind: "update" },
      { file: "b.css", kind: "conflict", reason: "você e o Rubrica mudaram o mesmo trecho" },
    ]);
    expect(text).toContain("Atualizados (1)");
    expect(text).toContain("b.css — você e o Rubrica mudaram o mesmo trecho");
    expect(text).toContain(NEW_SUFFIX);
  });

  it("avisa quando nada muda", () => {
    expect(formatPlan([])).toBe("Nenhum arquivo muda.");
  });
});
