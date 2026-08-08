import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runSetup } from "../commands/setup.js";

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue("https://meusite.com"),
  password: vi.fn().mockResolvedValue("senha12caracteres"),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { cancel } from "@clack/prompts";

// ---- helpers ----------------------------------------------------------------

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    access: (p: string) => vol.promises.access(p).then(() => undefined),
    readFile: (p: string, enc: string) =>
      vol.promises.readFile(p, enc as BufferEncoding) as Promise<string>,
    writeFile: (p: string, data: string) =>
      vol.promises.writeFile(p, data).then(() => undefined),
    mkdir: (p: string, opts: { recursive: boolean }) =>
      vol.promises.mkdir(p, opts).then(() => undefined),
  };
}

const VALID_ENV = [
  "VITE_CONVEX_URL=https://precise-husky-581.convex.cloud",
  "VITE_CONVEX_SITE_URL=https://precise-husky-581.convex.site",
].join("\n");

const BASE_PLUGINS = {
  blog: true,
  portfolio: true,
  resume: true,
};

// ---- Ciclo 1 E2E: sem .env.local → encerramento antecipado ------------------

describe("setup E2E — Ciclo 1: sem .env.local", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sem .env.local → cancel chamado com mensagem clara e execSync nunca chamado", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify({
        version: "1.0.0",
        layout: "cyberpunk" as const,
        theme: "cyberpunk",
        accentColor: null,
        fontSans: "Inter",
        fontMono: "JetBrains Mono",
        radius: "0.5rem",
        plugins: BASE_PLUGINS,
      }),
      // sem .env.local
    });
    const fs = makeFsModule(vol);
    const execFileSyncMock = vi.fn();

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn(),
      execFileSync: execFileSyncMock,
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("npx convex dev")
    );
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });
});

// ---- Ciclo 2 E2E: contact-wizard com readState real de memfs ----------------

describe("setup E2E — Ciclo 2: contact-wizard com readState real", () => {
  beforeEach(() => vi.clearAllMocks());

  it("contact-wizard ativo: TELEGRAM_BOT_TOKEN setado via readState real lendo memfs", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("bot123:token_real")   // TELEGRAM_BOT_TOKEN
      .mockResolvedValueOnce("987654321")            // TELEGRAM_ADMIN_CHAT_ID
      .mockResolvedValueOnce("admin@test.com")       // email admin
      .mockResolvedValue("");                         // Vercel (pular)

    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify({
        version: "1.0.0",
        layout: "cyberpunk" as const,
        theme: "cyberpunk",
        accentColor: null,
        fontSans: "Inter",
        fontMono: "JetBrains Mono",
        radius: "0.5rem",
        plugins: { "contact-wizard": true },
      }),
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const execFileSyncMock = vi.fn().mockReturnValue(Buffer.from(""));

    // NÃO passa readState: usa a implementação real com fs injetado
    await runSetup({
      cwd: "/project",
      fs,
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      execFileSync: execFileSyncMock,
    });

    const calls = execFileSyncMock.mock.calls.map((c) => (c[1] as string[]).join(" "));
    expect(calls.some((c) => c.includes("TELEGRAM_BOT_TOKEN"))).toBe(true);
  });
});

// ---- Ciclo 3 E2E: playground com readState real + 64 chars hex --------------

describe("setup E2E — Ciclo 3: playground com readState real", () => {
  beforeEach(() => vi.clearAllMocks());

  it("playground ativo: PLAYGROUND_KEY_PEPPER tem 64 chars hex via readState real", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("sk-or-key123")         // OPENROUTER_API_KEY (playground ativa AI também)
      .mockResolvedValueOnce("admin@test.com")       // email admin
      .mockResolvedValue("");                         // Vercel (pular)

    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify({
        version: "1.0.0",
        layout: "cyberpunk" as const,
        theme: "cyberpunk",
        accentColor: null,
        fontSans: "Inter",
        fontMono: "JetBrains Mono",
        radius: "0.5rem",
        plugins: { playground: true },
      }),
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const execFileSyncMock = vi.fn().mockReturnValue(Buffer.from(""));

    // NÃO passa readState: usa a implementação real com fs injetado
    await runSetup({
      cwd: "/project",
      fs,
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      execFileSync: execFileSyncMock,
    });

    const calls = execFileSyncMock.mock.calls as [string, string[], object][];
    const pepperCall = calls.find((c) => c[1].includes("PLAYGROUND_KEY_PEPPER"));
    expect(pepperCall).toBeDefined();

    // Extrai o valor: args = ["convex", "env", "set", "--", "PLAYGROUND_KEY_PEPPER", "<value>"]
    const args = pepperCall![1];
    const pepperValue = args[args.indexOf("PLAYGROUND_KEY_PEPPER") + 1];
    expect(pepperValue).toMatch(/^[0-9a-f]{64}$/i);
  });
});
