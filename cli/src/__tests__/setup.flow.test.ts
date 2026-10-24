import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runSetup } from "../commands/setup.js";

// Setup simplificado: conecta o Convex sozinho, reaproveita a identidade do create
// e só pergunta das integrações se a pessoa quiser.

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  password: vi.fn().mockResolvedValue("senha-bem-longa-123"),
  confirm: vi.fn().mockResolvedValue(false),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { text, confirm, outro, cancel, log, isCancel } from "@clack/prompts";

const ENV = "VITE_CONVEX_URL=https://x.convex.cloud\nVITE_CONVEX_SITE_URL=https://x.convex.site\n";

const IDENTITY = {
  siteName: "Ana",
  siteUrl: "https://ana.dev",
  siteDescription: "Designer",
  authorName: "Ana Souza",
  authorEmail: "ana@ana.dev",
  twitterHandle: "",
  lang: "pt-BR",
};

function makeState(plugins: Record<string, boolean> = {}, identity: object | undefined = IDENTITY) {
  return { version: "1.1.0", layout: "cyberpunk", theme: "neon", fontSans: "Inter", fontMono: "", plugins, identity };
}

function makeDeps(opts: { state?: ReturnType<typeof makeState>; env?: string | null; connectWritesEnv?: boolean } = {}) {
  const state = opts.state ?? makeState();
  const files: Record<string, string> = { "/p/rubrica.json": JSON.stringify(state) };
  if (opts.env !== null) files["/p/.env.local"] = opts.env ?? ENV;
  const vol = Volume.fromJSON(files);
  const execFileSync = vi.fn((_file: string, args: string[], _opts?: object) => {
    if (args.join(" ") === "convex dev --once" && opts.connectWritesEnv) vol.writeFileSync("/p/.env.local", ENV);
    return Buffer.from("");
  });
  return {
    cwd: "/p",
    fs: {
      access: (p: string) => vol.promises.access(p).then(() => undefined),
      readFile: (p: string, e: string) => vol.promises.readFile(p, e as BufferEncoding) as Promise<string>,
      writeFile: (p: string, d: string) => vol.promises.writeFile(p, d).then(() => undefined),
      mkdir: (p: string, o: { recursive: boolean }) => vol.promises.mkdir(p, o).then(() => undefined),
    },
    detectProject: vi.fn().mockResolvedValue("/p/rubrica.json"),
    generateJwtKeys: vi.fn().mockResolvedValue({ JWT_PRIVATE_KEY: "k", JWKS: "{}" }),
    readState: vi.fn().mockResolvedValue(state),
    randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 1)),
    execFileSync,
  };
}

const calls = (deps: ReturnType<typeof makeDeps>) => deps.execFileSync.mock.calls.map((c) => (c[1] as string[]).join(" "));
const messages = () => vi.mocked(text).mock.calls.map((c) => (c[0] as { message: string }).message);
const textOpts = (re: RegExp) =>
  vi.mocked(text).mock.calls.map((c) => c[0] as { message: string; initialValue?: string; validate?: (v: string) => string | undefined })
    .find((o) => re.test(o.message))!;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
  vi.mocked(confirm).mockResolvedValue(false);
  vi.mocked(text).mockResolvedValue("");
});

describe("setup — conexão com o Convex", () => {
  it("sem .env.local, conecta o Convex sozinho (na pasta do projeto) e segue", async () => {
    const deps = makeDeps({ env: null, connectWritesEnv: true });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(deps.execFileSync).toHaveBeenCalledWith("npx", ["convex", "dev", "--once"], expect.objectContaining({ cwd: "/p", stdio: "inherit" }));
    expect(calls(deps)).toContain("convex env set -- JWKS {}");
    expect(cancel).not.toHaveBeenCalled();
  });

  it("se a conexão não criar o .env.local, para com a instrução de rodar o Convex", async () => {
    const deps = makeDeps({ env: null });
    await runSetup(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx convex dev"));
  });

  it("se a conexão falhar, para com a mesma instrução", async () => {
    const deps = makeDeps({ env: null });
    deps.execFileSync.mockImplementationOnce(() => {
      throw new Error("login cancelado");
    });
    await runSetup(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/Não deu para conectar.*npx convex dev/));
    expect(deps.execFileSync).toHaveBeenCalledTimes(1);
  });

  it("todo comando do Convex roda via npx, na pasta do projeto, sem ecoar chaves no terminal", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("Designer").mockResolvedValueOnce("");
    await runSetup(deps);
    expect(deps.execFileSync.mock.calls.length).toBeGreaterThan(3);
    for (const c of deps.execFileSync.mock.calls) {
      expect(c[0]).toBe("npx");
      expect(c[2]).toEqual({ stdio: "pipe", cwd: "/p" });
    }
  });
});

describe("setup — reaproveita o que o create já perguntou", () => {
  it("com o endereço no rubrica.json, grava o SITE_URL sem perguntar", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- SITE_URL https://ana.dev");
    expect(messages().some((m) => /endereço/i.test(m))).toBe(false);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining("https://ana.dev"));
  });

  it("sem endereço salvo, pergunta aceitando sem https:// e grava completo", async () => {
    const deps = makeDeps({ state: makeState({}, { ...IDENTITY, siteUrl: "" }) });
    vi.mocked(text).mockResolvedValueOnce("ana.dev/").mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- SITE_URL https://ana.dev");
    const opts = textOpts(/endereço/i);
    expect(opts.initialValue).toBe("");
    expect(opts.validate!("ana.dev")).toBeUndefined();
  });

  it("cancelar a pergunta do endereço encerra o setup", async () => {
    const deps = makeDeps({ state: makeState({}, { ...IDENTITY, siteUrl: "" }) });
    vi.mocked(text).mockResolvedValueOnce("CANCEL");
    await runSetup(deps);
    expect(cancel).toHaveBeenCalledWith("Setup cancelado.");
    expect(calls(deps).some((c) => c.includes("SITE_URL"))).toBe(false);
  });

  it("cancelar o e-mail do admin encerra o setup sem criar o admin", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("CANCEL");
    await runSetup(deps);
    expect(cancel).toHaveBeenCalledWith("Setup cancelado.");
    expect(calls(deps).some((c) => c.includes("setupAdmin"))).toBe(false);
  });

  it("sem e-mail salvo, a pergunta do e-mail começa vazia", async () => {
    const deps = makeDeps({ state: makeState({}, { siteUrl: "https://ana.dev" }) });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(textOpts(/e-mail/i).initialValue).toBe("");
  });

  it("o e-mail do admin começa com o e-mail do create e é gravado limpo", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("  Ana@Ana.dev ");
    await runSetup(deps);
    expect(textOpts(/e-mail/i).initialValue).toBe("ana@ana.dev");
    expect(textOpts(/e-mail/i).validate!("ana")).toMatch(/e-mail válido/);
    expect(calls(deps).find((c) => c.startsWith("convex run seed:setupAdmin"))).toContain('"email":"ana@ana.dev"');
  });

  it("o contexto da IA usa o nome da pessoa, não o começo do e-mail", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("Designer UX").mockResolvedValueOnce("");
    await runSetup(deps);
    const ai = calls(deps).find((c) => c.includes("proposalAiContext"));
    expect(ai).toContain("Ana Souza é Designer UX");
  });

  it("a profissão vira o cargo mostrado no site, gravado pela função interna (sem login)", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce(" Designer UX ").mockResolvedValueOnce("");
    await runSetup(deps);
    const call = deps.execFileSync.mock.calls
      .map((c) => c[1] as string[])
      .find((a) => a[2] === "contactInfo:updateInternal" && a[3].includes("proposalAiContext"))!;
    expect(JSON.parse(call[3])).toMatchObject({ role: "Designer UX", roleTranslations: { ptBR: "Designer UX" } });
  });

  it("as especialidades (sem espaços nas pontas) entram no contexto da IA", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("Designer UX").mockResolvedValueOnce("  UX, Ilustração  ");
    await runSetup(deps);
    const ai = calls(deps).find((c) => c.includes("proposalAiContext"))!;
    expect(ai).toContain("Ana Souza é Designer UX com especialidade em UX, Ilustração. Entrega");
  });

  it("sem nome salvo, o contexto da IA usa o começo do e-mail", async () => {
    const deps = makeDeps({ state: makeState({}, { siteUrl: "https://ana.dev" }) });
    vi.mocked(text).mockResolvedValueOnce("ana.souza@ana.dev").mockResolvedValueOnce("Designer").mockResolvedValueOnce("");
    await runSetup(deps);
    expect(calls(deps).find((c) => c.includes("proposalAiContext"))).toContain("ana.souza é Designer. Entrega");
  });

  it("cancelar a profissão e as especialidades não grava nada", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("CANCEL").mockResolvedValueOnce("CANCEL");
    await runSetup(deps);
    expect(calls(deps).some((c) => c.includes("proposalAiContext"))).toBe(false);
  });

  it("especialidade cancelada não entra no contexto da IA", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("Designer").mockResolvedValueOnce("CANCEL");
    await runSetup(deps);
    expect(calls(deps).find((c) => c.includes("proposalAiContext"))).toContain("Ana Souza é Designer. Entrega");
  });

  it("sem profissão, não mexe no cargo nem no contexto da IA", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("").mockResolvedValueOnce("UX");
    await runSetup(deps);
    expect(calls(deps).some((c) => c.includes('"role"') || c.includes("proposalAiContext"))).toBe(false);
  });

  it("não chama mutations públicas, que exigem login de admin", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("Designer").mockResolvedValueOnce("UX, Ilustração");
    await runSetup(deps);
    const runs = deps.execFileSync.mock.calls.map((c) => c[1] as string[]).filter((a) => a[1] === "run").map((a) => a[2]);
    expect(runs).toEqual(["seed:setupAdmin", "seed:seedAll", "siteConfig:setBatchInternal", "contactInfo:updateInternal", "contactInfo:updateInternal"]);
  });

  it("a pergunta da profissão explica onde ela aparece", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(messages().find((m) => /profissão/.test(m))).toMatch(/abaixo do seu nome/);
    expect(messages().join("\n")).not.toMatch(/padrão tech/);
  });

  it("termina mostrando o próximo passo que o create passou", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup({ ...deps, nextStep: "cd ana && npm run dev" });
    expect(vi.mocked(outro).mock.calls[0][0]).toContain("cd ana && npm run dev");
  });
});

describe("setup — integrações só se a pessoa quiser", () => {
  it("Telegram: recusando, não pede token nem chat id", async () => {
    const deps = makeDeps({ state: makeState({ "contact-wizard": true }) });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Telegram/), initialValue: false }));
    expect(messages().some((m) => /Telegram/.test(m))).toBe(false);
  });

  it("Telegram: aceitando, pede o token e o chat id", async () => {
    const deps = makeDeps({ state: makeState({ "contact-wizard": true }) });
    vi.mocked(confirm).mockResolvedValueOnce(true);
    vi.mocked(text).mockResolvedValueOnce("bot:tok").mockResolvedValueOnce("123").mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- TELEGRAM_BOT_TOKEN bot:tok");
    expect(calls(deps)).toContain("convex env set -- TELEGRAM_ADMIN_CHAT_ID 123");
  });

  it("Telegram também é oferecido só com a coleta de depoimentos ligada", async () => {
    const deps = makeDeps({ state: makeState({ "testimonials-intake": true }) });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Telegram/) }));
  });

  it("Telegram não é oferecido sem contato nem coleta de depoimentos", async () => {
    const deps = makeDeps({ state: makeState({ blog: true }) });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(confirm).not.toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Telegram/) }));
  });

  it("valores das integrações são gravados sem espaços nas pontas; só espaços ou cancelado não grava", async () => {
    const deps = makeDeps({ state: makeState({ "contact-wizard": true, "ai-resumes": true }) });
    vi.mocked(confirm).mockResolvedValueOnce(true);
    vi.mocked(text).mockResolvedValueOnce("  bot:tok  ").mockResolvedValueOnce("CANCEL").mockResolvedValueOnce("   ").mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- TELEGRAM_BOT_TOKEN bot:tok");
    expect(calls(deps).some((c) => c.includes("TELEGRAM_ADMIN_CHAT_ID"))).toBe(false);
    expect(calls(deps).some((c) => c.includes("OPENROUTER_API_KEY"))).toBe(false);
  });

  it.each(["i18n", "playground", "ai-resumes"])("com %s ligado, pede a chave do OpenRouter", async (plugin) => {
    const deps = makeDeps({ state: makeState({ [plugin]: true }) });
    vi.mocked(text).mockResolvedValueOnce("sk-or").mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- OPENROUTER_API_KEY sk-or");
  });

  it("sem plugin de IA, não pede a chave do OpenRouter", async () => {
    const deps = makeDeps({ state: makeState({ blog: true }) });
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(messages().some((m) => /OpenRouter/.test(m))).toBe(false);
  });

  it("Vercel: recusando, não pede hook nem secret", async () => {
    const deps = makeDeps();
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Vercel/), initialValue: false }));
    expect(calls(deps).some((c) => c.includes("VERCEL_"))).toBe(false);
    expect(messages().some((m) => /Vercel/.test(m))).toBe(false);
  });

  it("Vercel: aceitando, pede o link do deploy hook e o segredo", async () => {
    const deps = makeDeps();
    vi.mocked(confirm).mockResolvedValueOnce(true);
    vi.mocked(text).mockResolvedValueOnce("ana@ana.dev").mockResolvedValueOnce("https://api.vercel.com/h").mockResolvedValueOnce("seg");
    await runSetup(deps);
    expect(calls(deps)).toContain("convex env set -- VERCEL_DEPLOY_HOOK_URL https://api.vercel.com/h");
    expect(calls(deps)).toContain("convex env set -- VERCEL_WEBHOOK_SECRET seg");
  });

  it("não mostra nomes de variável de ambiente nas perguntas", async () => {
    const deps = makeDeps({ state: makeState({ "contact-wizard": true, "ai-resumes": true, payments: true }) });
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(text).mockResolvedValue("");
    vi.mocked(text).mockResolvedValueOnce("").mockResolvedValueOnce("").mockResolvedValueOnce("").mockResolvedValueOnce("").mockResolvedValueOnce("ana@ana.dev");
    await runSetup(deps);
    for (const m of messages()) expect(m).not.toMatch(/[A-Z]{3,}_[A-Z_]+/);
    expect(log.warn).not.toHaveBeenCalledWith(expect.stringMatching(/undefined/));
  });
});
