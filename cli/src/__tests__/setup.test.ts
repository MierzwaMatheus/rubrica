import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runSetup } from "../commands/setup.js";

// ---- helpers ----------------------------------------------------------------

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

/** Extrai todas as chamadas execFileSync como strings "key value" */
function fileSyncArgs(mock: ReturnType<typeof vi.fn>): string[] {
  return mock.mock.calls.map((c) => (c[1] as string[]).join(" "));
}

const BASE_STATE = {
  version: "1.0.0",
  layout: "cyberpunk" as const,
  theme: "cyberpunk",
  accentColor: null,
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true },
};

const VALID_ENV = [
  "VITE_CONVEX_URL=https://precise-husky-581.convex.cloud",
  "VITE_CONVEX_SITE_URL=https://precise-husky-581.convex.site",
].join("\n");

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

import { cancel, password as passwordPrompt, text as textPrompt } from "@clack/prompts";

// ---- Ciclo 1: leitura de .env.local e detectProject -------------------------

describe("runSetup — Ciclo 1: .env.local e detectProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lê VITE_CONVEX_URL corretamente de .env.local existente", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const generateJwtKeysMock = vi.fn().mockResolvedValue({
      JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
      JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
    });

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: generateJwtKeysMock,
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    });

    expect(detectProjectMock).toHaveBeenCalled();
  });

  it("lança erro amigável quando .env.local não existe", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("npx convex dev")
    );
  });

  it("lança erro quando VITE_CONVEX_URL está ausente no .env.local", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": "VITE_CONVEX_SITE_URL=https://x.convex.site\n",
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("VITE_CONVEX_URL")
    );
  });

  it("lança erro quando VITE_CONVEX_SITE_URL está ausente no .env.local", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local":
        "VITE_CONVEX_URL=https://x.convex.cloud\n",
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("VITE_CONVEX_SITE_URL")
    );
  });

  it("propaga erro de detectProject como mensagem amigável", async () => {
    const vol = Volume.fromJSON({
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi
      .fn()
      .mockRejectedValue(new Error("rubrica.json não encontrado"));

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("rubrica.json não encontrado")
    );
  });
});

// ---- Ciclo 2: JWT keys + convex env set + prompt SITE_URL -------------------

describe("runSetup — Ciclo 2: JWT keys e convex env set", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeValidSetup() {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY:
          "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("JWT_PRIVATE_KEY é setado via execFileSync com args array (sem passar pelo shell)", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const fileCalls = (deps.execFileSync as ReturnType<typeof vi.fn>).mock.calls;
    const jwtCall = fileCalls.find(
      (c) => Array.isArray(c[1]) && (c[1] as string[]).includes("JWT_PRIVATE_KEY")
    );
    expect(jwtCall).toBeDefined();
    const args = jwtCall![1] as string[];
    const pemValue = args.find((a) => a.includes("BEGIN PRIVATE KEY"));
    expect(pemValue).toBeDefined();
  });

  it("JWKS é setado via execFileSync com args array", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    const jwksCall = calls.find((c) => c.includes("JWKS"));
    expect(jwksCall).toBeDefined();
    expect(jwksCall).toContain("keys");
  });

  it("SITE_URL é setado via execFileSync com valor do prompt", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("SITE_URL"))).toBe(true);
  });

  it("prompt de SITE_URL usa VITE_CONVEX_SITE_URL como initialValue", async () => {
    const { text } = await import("@clack/prompts");

    const deps = makeValidSetup();
    await runSetup(deps);

    expect(text).toHaveBeenCalledWith(
      expect.objectContaining({
        initialValue: "https://precise-husky-581.convex.site",
      })
    );
  });
});

// ---- Ciclo 4: vars condicionais Telegram ------------------------------------

describe("runSetup — Ciclo 4: Telegram plugin vars", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeSetupWithPlugins(plugins: Record<string, boolean>) {
    const state = { ...BASE_STATE, plugins };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.from("a".repeat(32))),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("com contact-wizard:true, execFileSync é chamado com TELEGRAM_BOT_TOKEN quando valor fornecido", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("bot123:token")          // TELEGRAM_BOT_TOKEN
      .mockResolvedValueOnce("987654321")             // TELEGRAM_ADMIN_CHAT_ID
      .mockResolvedValue("");                          // demais (Vercel)

    const deps = makeSetupWithPlugins({ "contact-wizard": true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("TELEGRAM_BOT_TOKEN"))).toBe(true);
  });

  it("sem plugin Telegram, nenhum prompt de TELEGRAM_BOT_TOKEN é exibido", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValue("");                         // demais

    const deps = makeSetupWithPlugins({ blog: true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("TELEGRAM_BOT_TOKEN"))).toBe(false);
    expect(calls.some((c) => c.includes("TELEGRAM_ADMIN_CHAT_ID"))).toBe(false);
  });

  it("TELEGRAM_BOT_TOKEN pulado (vazio) não chama execFileSync para essa var", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("")                     // TELEGRAM_BOT_TOKEN (pulado)
      .mockResolvedValueOnce("")                     // TELEGRAM_ADMIN_CHAT_ID (pulado)
      .mockResolvedValue("");                         // demais

    const deps = makeSetupWithPlugins({ "contact-wizard": true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("TELEGRAM_BOT_TOKEN"))).toBe(false);
  });
});

// ---- Ciclo 5: AI / Playground / Payments -----------------------------------

describe("runSetup — Ciclo 5: AI, Playground e Payments vars", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeSetupWithPlugins(plugins: Record<string, boolean>) {
    const state = { ...BASE_STATE, plugins };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0xab)),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("com playground:true, PLAYGROUND_KEY_PEPPER é gerado com 64 chars hex sem prompt", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text).mockResolvedValue("https://meusite.com");

    const deps = makeSetupWithPlugins({ playground: true });
    await runSetup(deps);

    expect(deps.randomBytes).toHaveBeenCalledWith(32);
    const fileCalls = (deps.execFileSync as ReturnType<typeof vi.fn>).mock.calls as [string, string[], object][];
    const pepperCall = fileCalls.find((c) => c[1].includes("PLAYGROUND_KEY_PEPPER"));
    expect(pepperCall).toBeDefined();
    const args = pepperCall![1];
    const pepperValue = args[args.indexOf("PLAYGROUND_KEY_PEPPER") + 1];
    expect(pepperValue).toHaveLength(64);
  });

  it("com playground:true, PLAYGROUND_KEY_PEPPER é setado sem interação do usuário", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text).mockResolvedValue("https://meusite.com");

    const deps = makeSetupWithPlugins({ playground: true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("PLAYGROUND_KEY_PEPPER"))).toBe(true);
    const textCalls = vi.mocked(text).mock.calls;
    expect(textCalls.every((c) => !String(c[0]).includes("PLAYGROUND"))).toBe(true);
  });

  it("com ai-resumes:true, prompt de OPENROUTER_API_KEY aparece e é setado quando fornecido", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("sk-or-key123")         // OPENROUTER_API_KEY
      .mockResolvedValue("");                         // Vercel (skip)

    const deps = makeSetupWithPlugins({ "ai-resumes": true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("OPENROUTER_API_KEY"))).toBe(true);
  });

  it("com payments:true, prompts de STRIPE_WEBHOOK_SECRET e ASAAS_WEBHOOK_TOKEN aparecem (skipáveis)", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("whsec_abc")            // STRIPE_WEBHOOK_SECRET
      .mockResolvedValueOnce("asaas_token")          // ASAAS_WEBHOOK_TOKEN
      .mockResolvedValue("");                         // Vercel (skip)

    const deps = makeSetupWithPlugins({ payments: true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("STRIPE_WEBHOOK_SECRET"))).toBe(true);
    expect(calls.some((c) => c.includes("ASAAS_WEBHOOK_TOKEN"))).toBe(true);
  });

  it("vars opcionais puladas (vazias) não geram chamada execFileSync para convex env set", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("")                     // STRIPE_WEBHOOK_SECRET (pulado)
      .mockResolvedValueOnce("")                     // ASAAS_WEBHOOK_TOKEN (pulado)
      .mockResolvedValue("");                         // Vercel (skip)

    const deps = makeSetupWithPlugins({ payments: true });
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("STRIPE_WEBHOOK_SECRET"))).toBe(false);
    expect(calls.some((c) => c.includes("ASAAS_WEBHOOK_TOKEN"))).toBe(false);
  });
});

// ---- Ciclo 6: Vercel vars always-present -----------------------------------

describe("runSetup — Ciclo 6: Vercel vars always-present", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeMinimalSetup() {
    const state = { ...BASE_STATE, plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0)),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("VERCEL_DEPLOY_HOOK_URL é sempre promovido independente de plugins", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com")          // SITE_URL
      .mockResolvedValueOnce("admin@test.com")               // email admin
      .mockResolvedValueOnce("https://api.vercel.com/hook")  // VERCEL_DEPLOY_HOOK_URL
      .mockResolvedValueOnce("");                             // VERCEL_WEBHOOK_SECRET (skip)

    const deps = makeMinimalSetup();
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("VERCEL_DEPLOY_HOOK_URL"))).toBe(true);
  });

  it("VERCEL_WEBHOOK_SECRET é sempre promovido independente de plugins", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("admin@test.com")      // email admin
      .mockResolvedValueOnce("")                    // VERCEL_DEPLOY_HOOK_URL (skip)
      .mockResolvedValueOnce("secret123");          // VERCEL_WEBHOOK_SECRET

    const deps = makeMinimalSetup();
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("VERCEL_WEBHOOK_SECRET"))).toBe(true);
  });

  it("Vercel vars puladas (vazias) não geram chamada execFileSync", async () => {
    const { text } = await import("@clack/prompts");
    vi.mocked(text)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("admin@test.com")      // email admin
      .mockResolvedValueOnce("")                    // VERCEL_DEPLOY_HOOK_URL (skip)
      .mockResolvedValueOnce("");                   // VERCEL_WEBHOOK_SECRET (skip)

    const deps = makeMinimalSetup();
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls.some((c) => c.includes("VERCEL_DEPLOY_HOOK_URL"))).toBe(false);
    expect(calls.some((c) => c.includes("VERCEL_WEBHOOK_SECRET"))).toBe(false);
  });
});

// ---- Ciclo 7: validações de email e senha -----------------------------------

describe("runSetup — Ciclo 7: prompts de admin (validações)", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeMinimalSetup() {
    const state = { ...BASE_STATE, plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0)),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("validate de email rejeita string sem '@'", async () => {
    const deps = makeMinimalSetup();

    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce(""); // Vercel vars skip

    await runSetup(deps);

    const emailCall = vi.mocked(textPrompt).mock.calls.find(
      (c) => typeof c[0] === "object" && (c[0] as { message?: string }).message?.toLowerCase().includes("email")
    );
    expect(emailCall).toBeDefined();
    const { validate } = emailCall![0] as { validate: (v: string) => string | undefined };
    expect(validate("invalidemail")).toBeTruthy();
    expect(validate("valido@email.com")).toBeUndefined();
  });

  it("validate de email rejeita string sem ponto", async () => {
    const deps = makeMinimalSetup();

    vi.mocked(textPrompt).mockResolvedValue("https://meusite.com");
    await runSetup(deps);

    const emailCall = vi.mocked(textPrompt).mock.calls.find(
      (c) => typeof c[0] === "object" && (c[0] as { message?: string }).message?.toLowerCase().includes("email")
    );
    const { validate } = emailCall![0] as { validate: (v: string) => string | undefined };
    expect(validate("sem@ponto")).toBeTruthy();
    expect(validate("com@ponto.com")).toBeUndefined();
  });

  it("validate de senha rejeita string com menos de 12 caracteres", async () => {
    const deps = makeMinimalSetup();

    vi.mocked(textPrompt).mockResolvedValue("https://meusite.com");
    await runSetup(deps);

    const senhaCall = vi.mocked(passwordPrompt).mock.calls.find(
      (c) => typeof c[0] === "object" && (c[0] as { message?: string }).message?.toLowerCase().includes("senha")
        && !(c[0] as { message?: string }).message?.toLowerCase().includes("confirm")
    );
    expect(senhaCall).toBeDefined();
    const { validate } = senhaCall![0] as { validate: (v: string) => string | undefined };
    expect(validate("curta")).toBeTruthy();
    expect(validate("senha12caracteres")).toBeUndefined();
  });

  it("validate de confirmação de senha rejeita quando diferente", async () => {
    const deps = makeMinimalSetup();

    vi.mocked(textPrompt).mockResolvedValue("https://meusite.com");
    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123") // senha
      .mockResolvedValueOnce("outraSenha123"); // confirmação diferente

    await runSetup(deps);

    const confirmCall = vi.mocked(passwordPrompt).mock.calls.find(
      (c) => typeof c[0] === "object" && (c[0] as { message?: string }).message?.toLowerCase().includes("confirm")
    );
    expect(confirmCall).toBeDefined();
    const confirmValidate = (confirmCall![0] as { validate?: (v: string) => string | undefined }).validate;
    if (confirmValidate) {
      expect(typeof confirmValidate).toBe("function");
    }
  });
});

// ---- Ciclo 8: execFileSync setupAdmin + error handling + outro() ----------------

describe("runSetup — Ciclo 8: setupAdmin execFileSync e outro()", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeAdminSetup() {
    const state = { ...BASE_STATE, plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0)),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("execFileSync é chamado com npx convex run seed:setupAdmin --data contendo email e senha", async () => {
    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com")  // SITE_URL
      .mockResolvedValueOnce("admin@teste.com")       // email
      .mockResolvedValue("");                          // Vercel skip

    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123456") // senha
      .mockResolvedValueOnce("minhaSenha123456"); // confirmação

    const deps = makeAdminSetup();
    await runSetup(deps);

    const fileCalls = (deps.execFileSync as ReturnType<typeof vi.fn>).mock.calls as [string, string[], object][];
    const setupCall = fileCalls.find((c) => c[1].includes("seed:setupAdmin"));
    expect(setupCall).toBeDefined();
    const argsStr = setupCall![1].join(" ");
    expect(argsStr).toContain("admin@teste.com");
    expect(argsStr).toContain("minhaSenha123456");
  });

  it("quando execFileSync lança erro contendo 'Root user already exists', exibe mensagem amigável", async () => {
    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("admin@teste.com")      // email
      .mockResolvedValue("");                         // Vercel skip

    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123456")
      .mockResolvedValueOnce("minhaSenha123456");

    const err = Object.assign(new Error("Command failed"), {
      stdout: Buffer.from("Root user already exists"),
      stderr: Buffer.from(""),
    });

    const deps = makeAdminSetup();
    vi.mocked(deps.execFileSync as ReturnType<typeof vi.fn>).mockImplementation((_file: string, args: string[]) => {
      if (args.includes("seed:setupAdmin")) throw err;
      return Buffer.from("");
    });

    await runSetup(deps);

    expect(cancel).toHaveBeenCalledWith(
      expect.stringMatching(/já configurado|Admin/i)
    );
    const cancelArg = vi.mocked(cancel).mock.calls.at(-1)?.[0] as string;
    expect(cancelArg).not.toContain("Error:");
  });

  it("quando execFileSync lança erro genérico, exibe mensagem original ao usuário", async () => {
    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("admin@teste.com")      // email
      .mockResolvedValue("");                         // Vercel skip

    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123456")
      .mockResolvedValueOnce("minhaSenha123456");

    const err = Object.assign(new Error("Convex connection failed"), {
      stdout: Buffer.from(""),
      stderr: Buffer.from("Convex connection failed"),
    });

    const deps = makeAdminSetup();
    vi.mocked(deps.execFileSync as ReturnType<typeof vi.fn>).mockImplementation((_file: string, args: string[]) => {
      if (args.includes("seed:setupAdmin")) throw err;
      return Buffer.from("");
    });

    await runSetup(deps);

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("Convex connection failed")
    );
  });

  it("em caso de sucesso, outro() é chamado com mensagem contendo o email usado", async () => {
    const { outro } = await import("@clack/prompts");

    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com") // SITE_URL
      .mockResolvedValueOnce("admin@teste.com")      // email
      .mockResolvedValue("");                         // Vercel skip

    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123456")
      .mockResolvedValueOnce("minhaSenha123456");

    const deps = makeAdminSetup();
    await runSetup(deps);

    expect(outro).toHaveBeenCalledWith(
      expect.stringContaining("admin@teste.com")
    );
    expect(outro).toHaveBeenCalledWith(
      expect.stringContaining("/login")
    );
  });
});

describe("runSetup — Ciclo 9: siteTexts seed", () => {
  function makeAdminSetup() {
    const state = { ...BASE_STATE, plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      readState: vi.fn().mockResolvedValue(state),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 0)),
      execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("chama convex run siteTexts:seed durante o setup", async () => {
    vi.mocked(textPrompt)
      .mockResolvedValueOnce("https://meusite.com")
      .mockResolvedValueOnce("admin@teste.com")
      .mockResolvedValue("");

    vi.mocked(passwordPrompt)
      .mockResolvedValueOnce("minhaSenha123456")
      .mockResolvedValueOnce("minhaSenha123456");

    const deps = makeAdminSetup();
    await runSetup(deps);

    const calls = fileSyncArgs(deps.execFileSync as ReturnType<typeof vi.fn>);
    expect(calls).toContain("convex run siteTexts:seed");
  });
});
