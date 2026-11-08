import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";

vi.mock("@clack/prompts", () => ({ outro: vi.fn(), cancel: vi.fn(), log: { info: vi.fn() } }));

import { outro, cancel, log } from "@clack/prompts";
import { runTelemetry } from "../commands/telemetry.js";

const UUID = "3f2b1c4d-5e6f-4a1b-8c2d-9e0f1a2b3c4d";

function setup(state: object | null = { version: "1.8.1", layout: "swiss", telemetria: { projeto: UUID, ativa: true } }) {
  const vol = Volume.fromJSON(state ? { "/p/rubrica.json": JSON.stringify(state) } : {});
  const fs = {
    access: (p: string) => vol.promises.access(p).then(() => undefined),
    readFile: (p: string, e: string) => vol.promises.readFile(p, e as BufferEncoding) as Promise<string>,
    writeFile: (p: string, d: string) => vol.promises.writeFile(p, d).then(() => undefined),
  };
  const read = () => JSON.parse(vol.readFileSync("/p/rubrica.json", "utf-8") as string) as { telemetria: object };
  return { fs, read };
}

beforeEach(() => vi.clearAllMocks());

describe("telemetria", () => {
  it("desligar grava no rubrica.json", async () => {
    const { fs, read } = setup();
    await runTelemetry({ cwd: "/p", action: "desligar", fs, env: {} });
    expect(read().telemetria).toEqual({ projeto: UUID, ativa: false });
    expect(vi.mocked(outro).mock.calls[0][0]).toMatch(/desligada/);
  });

  it("ligar grava no rubrica.json", async () => {
    const { fs, read } = setup({ version: "1.8.1", layout: "swiss", telemetria: { ativa: false } });
    await runTelemetry({ cwd: "/p", action: "ligar", fs, env: {} });
    expect(read().telemetria).toEqual({ ativa: true });
  });

  it("sem ação, mostra como está e o motivo quando desligada", async () => {
    const { fs } = setup();
    await runTelemetry({ cwd: "/p", fs, env: { DO_NOT_TRACK: "1" } });
    expect(vi.mocked(log.info).mock.calls[0][0]).toMatch(/DO_NOT_TRACK/);
  });

  it("ação desconhecida mostra o uso", async () => {
    const { fs } = setup();
    await runTelemetry({ cwd: "/p", action: "talvez", fs, env: {} });
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/ligar\|desligar/));
  });

  it("fora de um projeto, explica a variável de ambiente", async () => {
    const { fs } = setup(null);
    await runTelemetry({ cwd: "/p", action: "desligar", fs, env: {} });
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/RUBRICA_TELEMETRIA=0/));
  });
});
