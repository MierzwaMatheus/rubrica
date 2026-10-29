import { describe, it, expect, vi } from "vitest";
import {
  telemetryOff,
  track,
  setTelemetry,
  pluginPreset,
  TELEMETRY_URL,
  type TelemetryDeps,
} from "../telemetry.js";

const UUID = "3f2b1c4d-5e6f-4a1b-8c2d-9e0f1a2b3c4d";

/** rubrica.json em memória. */
function memoryFs(initial?: Record<string, unknown>) {
  const files: Record<string, string> = {};
  if (initial) files["/p/rubrica.json"] = JSON.stringify(initial, null, 2);
  return {
    files,
    readFile: vi.fn(async (p: string) => {
      if (!(p in files)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      return files[p];
    }),
    writeFile: vi.fn(async (p: string, data: string) => {
      files[p] = data;
    }),
    json: () => JSON.parse(files["/p/rubrica.json"]) as Record<string, unknown>,
  };
}

function deps(over: Partial<Omit<TelemetryDeps, "fs">> & { fs?: ReturnType<typeof memoryFs> } = {}) {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }));
  const notice = vi.fn();
  return {
    fetch,
    notice,
    deps: {
      env: {},
      fetch,
      notice,
      randomUUID: () => UUID,
      platform: "linux",
      nodeVersion: "22.4.1",
      cliVersion: "1.6.0",
      userAgent: undefined,
      fs: memoryFs({ version: "1.8.1", layout: "swiss" }),
      ...over,
    } satisfies TelemetryDeps,
  };
}

const body = (fetch: ReturnType<typeof vi.fn>) =>
  JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string) as Record<string, unknown>;

describe("TELEMETRY_URL", () => {
  it("aponta para a produção do coletor", () => {
    expect(TELEMETRY_URL).toMatch(/^https:\/\/[a-z]+-[a-z]+-\d+\.convex\.site\/v1\/eventos$/);
    expect(TELEMETRY_URL).not.toContain("TODO");
  });
});

describe("telemetryOff", () => {
  it("liga por padrão", () => {
    expect(telemetryOff({})).toBeNull();
  });

  it.each([
    [{ RUBRICA_TELEMETRIA: "0" }, "RUBRICA_TELEMETRIA"],
    [{ RUBRICA_TELEMETRIA: "false" }, "RUBRICA_TELEMETRIA"],
    [{ RUBRICA_TELEMETRIA: "desligada" }, "RUBRICA_TELEMETRIA"],
    [{ DO_NOT_TRACK: "1" }, "DO_NOT_TRACK"],
    [{ CI: "true" }, "CI"],
    [{ VITEST: "true" }, "testes"],
  ])("desliga com %o", (env, motivo) => {
    expect(telemetryOff(env)).toContain(motivo);
  });

  it("não desliga com DO_NOT_TRACK=0 nem CI=false", () => {
    expect(telemetryOff({ DO_NOT_TRACK: "0", CI: "false" })).toBeNull();
  });

  it("desliga quando o projeto desligou", () => {
    expect(telemetryOff({}, { telemetria: { ativa: false } })).toContain("projeto");
  });
});

describe("track", () => {
  it("na primeira vez cria o id do projeto, avisa e manda o evento", async () => {
    const d = deps();
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);

    expect(d.deps.fs.json().telemetria).toEqual({ projeto: UUID, ativa: true });
    expect(d.deps.fs.json().layout).toBe("swiss"); // o resto do rubrica.json fica igual
    expect(d.notice).toHaveBeenCalledOnce();
    expect(d.fetch).toHaveBeenCalledWith(TELEMETRY_URL, expect.objectContaining({ method: "POST" }));
    expect(body(d.fetch)).toEqual({
      v: 1,
      tipo: "publicacao",
      projeto: UUID,
      cli: "1.6.0",
      template: "1.8.1",
      so: "linux",
      node: 22,
      gerenciador: "npm",
      dados: { caminho: "primeira" },
    });
  });

  it("com id já salvo não avisa de novo nem regrava o rubrica.json", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss", telemetria: { projeto: UUID, ativa: true } });
    const d = deps({ fs });
    await track("/p", "publicacao", { caminho: "denovo" }, d.deps);
    expect(d.notice).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(d.fetch).toHaveBeenCalledOnce();
  });

  it("não manda nada, nem cria id, quando está desligada", async () => {
    const d = deps({ env: { DO_NOT_TRACK: "1" } });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(d.fetch).not.toHaveBeenCalled();
    expect(d.deps.fs.writeFile).not.toHaveBeenCalled();
  });

  it("não manda nada fora de um projeto (sem rubrica.json)", async () => {
    const d = deps({ fs: memoryFs() });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it("descobre o gerenciador pelo lockfile do projeto", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss" });
    fs.files["/p/pnpm-lock.yaml"] = "";
    const d = deps({ fs });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(body(d.fetch).gerenciador).toBe("pnpm");
  });

  it("com os dois lockfiles (template pnpm instalado com npm), vale o npm", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss" });
    fs.files["/p/pnpm-lock.yaml"] = "";
    fs.files["/p/package-lock.json"] = "{}";
    const d = deps({ fs });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(body(d.fetch).gerenciador).toBe("npm");
  });

  it("o gerenciador informado pelo comando vale mais que os lockfiles", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss" });
    fs.files["/p/pnpm-lock.yaml"] = "";
    const d = deps({ fs, packageManager: "npm" });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(body(d.fetch).gerenciador).toBe("npm");
  });

  it("usa RUBRICA_TELEMETRIA_URL quando existe (testes do coletor)", async () => {
    const d = deps({ env: { RUBRICA_TELEMETRIA_URL: "http://localhost:3211/v1/eventos" } });
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    expect(d.fetch.mock.calls[0][0]).toBe("http://localhost:3211/v1/eventos");
  });

  it("nunca quebra o comando: rede fora do ar vira silêncio", async () => {
    const fetch = vi.fn(async (_url: string, _init: RequestInit): Promise<Response> => {
      throw new Error("ECONNREFUSED");
    });
    const d = deps({ fetch });
    await expect(track("/p", "publicacao", { caminho: "primeira" }, d.deps)).resolves.toBeUndefined();
  });

  it("nunca quebra o comando: rubrica.json ilegível vira silêncio", async () => {
    const fs = memoryFs();
    fs.files["/p/rubrica.json"] = "{ quebrado";
    const d = deps({ fs });
    await expect(track("/p", "publicacao", { caminho: "primeira" }, d.deps)).resolves.toBeUndefined();
    expect(d.fetch).not.toHaveBeenCalled();
  });

  it("manda com tempo-limite", async () => {
    const d = deps();
    await track("/p", "publicacao", { caminho: "primeira" }, d.deps);
    const init = (d.fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("setTelemetry", () => {
  it("desliga e liga no rubrica.json, preservando o id", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss", telemetria: { projeto: UUID, ativa: true } });
    await setTelemetry("/p", false, { fs });
    expect(fs.json().telemetria).toEqual({ projeto: UUID, ativa: false });
    await setTelemetry("/p", true, { fs });
    expect(fs.json().telemetria).toEqual({ projeto: UUID, ativa: true });
  });

  it("desligar num projeto sem id não cria id", async () => {
    const fs = memoryFs({ version: "1.8.1", layout: "swiss" });
    await setTelemetry("/p", false, { fs });
    expect(fs.json().telemetria).toEqual({ ativa: false });
  });
});

describe("pluginPreset", () => {
  it("reconhece os pacotes prontos, em qualquer ordem", () => {
    expect(pluginPreset(["about", "resume", "portfolio", "contact-wizard"])).toBe("simple");
  });

  it("o que não bate com um pacote é custom", () => {
    expect(pluginPreset(["blog"])).toBe("custom");
    expect(pluginPreset([])).toBe("custom");
  });
});
