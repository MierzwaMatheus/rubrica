import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runPublish } from "../commands/publish.js";

vi.mock("@clack/prompts", () => ({
  outro: vi.fn(),
  note: vi.fn(),
  text: vi.fn(),
  password: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn((v) => v === "CANCEL"),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { info: vi.fn(), warn: vi.fn(), success: vi.fn() },
}));

import { confirm, password, text, outro, cancel, log, note } from "@clack/prompts";

const DEPLOY_KEY = "prod:happy-otter-123|eyJ2MiI6ImFiYyJ9";
const STATE = {
  plugins: { blog: true, about: false },
  identity: { siteName: "Ana Souza", siteUrl: "https://anasouza.com.br", authorName: "Ana", authorEmail: "ana@ana.dev", lang: "pt-BR" },
};
const DOMAINS = JSON.stringify({ domains: [{ name: "ana-site.vercel.app" }] });

interface Opts {
  linked?: boolean;
  env?: string | null;
  vercelignore?: string;
  loggedIn?: boolean | "after-login";
  devEnv?: Record<string, string>;
  adminExists?: boolean;
  fail?: Record<string, string | { stdout?: string; message?: string }>;
  domains?: string | null;
  devContact?: string | null;
  state?: object;
  key?: string;
  processEnv?: Record<string, string>;
}

/** Tira o prefixo `--yes vercel@latest [--global-config X]` das chamadas da Vercel. */
function vercelArgs(args: string[]): string[] | null {
  if (args[1] !== "vercel@latest") return null;
  const rest = args.slice(2);
  return rest[0] === "--global-config" ? rest.slice(2) : rest;
}

function makeDeps(opts: Opts = {}) {
  const files: Record<string, string> = {
    "/p/rubrica.json": JSON.stringify(opts.state ?? STATE),
    "/p/package.json": JSON.stringify({ name: "ana-site" }),
  };
  if (opts.env !== null) files["/p/.env.local"] = opts.env ?? "CONVEX_DEPLOYMENT=dev:x\nVITE_CONVEX_URL=https://x.convex.cloud\n";
  if (opts.linked) files["/p/.vercel/project.json"] = JSON.stringify({ projectId: "prj_1", projectName: "ana-site" });
  if (opts.vercelignore) files["/p/.vercelignore"] = opts.vercelignore;
  const vol = Volume.fromJSON(files);
  let loggedIn = opts.loggedIn === undefined ? true : opts.loggedIn === true;

  const execFileSync = vi.fn((_file: string, args: string[], _o?: { cwd?: string; env?: Record<string, string | undefined>; stdio?: string }) => {
    const key = args.join(" ");
    const failing = Object.entries(opts.fail ?? {}).find(([k]) => key.includes(k));
    if (failing) {
      const f = failing[1];
      if (typeof f === "string") throw Object.assign(new Error("falhou"), { stderr: Buffer.from(f) });
      throw Object.assign(new Error(f.message ?? "falhou"), f.stdout ? { stdout: Buffer.from(f.stdout) } : {});
    }
    const v = vercelArgs(args);
    if (v) {
      if (v[0] === "whoami") {
        if (!loggedIn) throw new Error("not logged in");
        return Buffer.from("ana\n");
      }
      if (v[0] === "login") {
        if (opts.loggedIn === "after-login") loggedIn = true;
        return Buffer.from("");
      }
      if (v[0] === "link") {
        vol.mkdirSync("/p/.vercel", { recursive: true });
        vol.writeFileSync("/p/.vercel/project.json", JSON.stringify({ projectId: "prj_1", projectName: "ana-site" }));
        return Buffer.from("");
      }
      if (v[0] === "api") {
        if (opts.domains === null) throw new Error("api fora do ar");
        return Buffer.from(opts.domains ?? DOMAINS);
      }
      if (v[0] === "deploy") return Buffer.from("https://ana-site-abc123.vercel.app\n");
      return Buffer.from("");
    }
    if (key === "convex deployment token create rubrica-vercel --prod") return Buffer.from(`${opts.key ?? DEPLOY_KEY}\n`);
    if (args[1] === "env" && args[2] === "get") return Buffer.from((opts.devEnv ?? {})[args[3]] ?? "");
    if (key === "convex run contactInfo:get") {
      if (opts.devContact === null) throw new Error("offline");
      return Buffer.from(opts.devContact ?? "null");
    }
    if (key === "convex run --prod users:isSetupRequired") return Buffer.from(opts.adminExists ? "false\n" : "true\n");
    return Buffer.from("");
  });

  return {
    vol,
    deps: {
      cwd: "/p",
      fs: {
        readFile: (p: string, e: string) => vol.promises.readFile(p, e as BufferEncoding) as Promise<string>,
        writeFile: (p: string, d: string) => vol.promises.writeFile(p, d).then(() => undefined),
        access: (p: string) => vol.promises.access(p).then(() => undefined),
      },
      detectProject: vi.fn().mockResolvedValue("/p/rubrica.json"),
      readState: vi.fn().mockResolvedValue(opts.state ?? STATE),
      generateJwtKeys: vi.fn().mockResolvedValue({ JWT_PRIVATE_KEY: "PRIV", JWKS: "{}" }),
      randomBytes: vi.fn().mockReturnValue(Buffer.alloc(32, 7)),
      execFileSync,
      processEnv: opts.processEnv ?? {},
    },
  };
}

type Deps = ReturnType<typeof makeDeps>["deps"];
const calls = (deps: Deps) => deps.execFileSync.mock.calls.map((c) => c[1] as string[]);
const vercelCalls = (deps: Deps) => calls(deps).map(vercelArgs).filter((v): v is string[] => v !== null);
const convexCalls = (deps: Deps) => calls(deps).filter((a) => a[0] === "convex").map((a) => a.join(" "));
const indexOf = (deps: Deps, pred: (a: string[]) => boolean) => calls(deps).findIndex(pred);

beforeEach(() => {
  vi.clearAllMocks();
  for (const prompt of [confirm, password, text]) vi.mocked(prompt).mockReset();
  vi.mocked(confirm).mockResolvedValue(true);
  vi.mocked(password).mockResolvedValue("SenhaForte2026");
});

describe("publicar — primeira vez", () => {
  it("explica o que vai fazer e pede confirmação; recusando, não roda nada", async () => {
    const { deps } = makeDeps();
    vi.mocked(confirm).mockResolvedValueOnce(false);
    await runPublish(deps);
    expect(note).toHaveBeenCalledWith(expect.stringMatching(/Vercel.*admin/s), expect.any(String));
    expect(deps.execFileSync).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledWith("Nada foi publicado.");
  });

  it("avisa que o que foi cadastrado no painel do computador não vai junto", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(note).toHaveBeenCalledWith(expect.stringMatching(/computador não vai junto/), expect.any(String));
  });

  it("logado na Vercel: não abre o login", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(vercelCalls(deps).some((v) => v[0] === "login")).toBe(false);
  });

  it("sem login na Vercel: abre o login no terminal (navegador) e segue", async () => {
    const { deps } = makeDeps({ loggedIn: "after-login" });
    await runPublish(deps);
    const loginCall = deps.execFileSync.mock.calls.find((c) => vercelArgs(c[1] as string[])?.[0] === "login")!;
    expect(loginCall[2]).toMatchObject({ stdio: "inherit", cwd: "/p" });
    expect(outro).toHaveBeenCalled();
  });

  it("se o login não der certo, para", async () => {
    const { deps } = makeDeps({ loggedIn: false });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/Vercel/));
    expect(vercelCalls(deps).some((v) => v[0] === "link")).toBe(false);
  });

  it("cria e liga o projeto na Vercel com o nome do package.json, sem perguntas", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(vercelCalls(deps)).toContainEqual(["link", "--yes", "--project", "ana-site"]);
  });

  it("usa o endereço .vercel.app que a Vercel reservou", async () => {
    const { deps } = makeDeps({ domains: JSON.stringify({ domains: [{ name: "www.outro.com" }, { name: "ana-site-7.vercel.app" }] }) });
    await runPublish(deps);
    expect(vercelCalls(deps)).toContainEqual(["api", "/v9/projects/prj_1/domains"]);
    expect(convexCalls(deps)).toContain("convex env set --prod -- SITE_URL https://ana-site-7.vercel.app");
  });

  it("se a API da Vercel falhar, usa <projeto>.vercel.app", async () => {
    const { deps } = makeDeps({ domains: null });
    await runPublish(deps);
    expect(convexCalls(deps)).toContain("convex env set --prod -- SITE_URL https://ana-site.vercel.app");
  });

  it("cria o .vercelignore para não enviar os arquivos .env", async () => {
    const { deps, vol } = makeDeps();
    await runPublish(deps);
    expect(vol.readFileSync("/p/.vercelignore", "utf-8")).toMatch(/^\.env\*$/m);
  });

  it("não mexe num .vercelignore que já existe", async () => {
    const { deps, vol } = makeDeps({ vercelignore: "meu\n" });
    await runPublish(deps);
    expect(vol.readFileSync("/p/.vercelignore", "utf-8")).toBe("meu\n");
  });

  it("gera a chave de produção do Convex e envia as funções com ela", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const push = deps.execFileSync.mock.calls.find((c) => (c[1] as string[]).join(" ") === "convex deploy")!;
    expect(push[2]?.env?.CONVEX_DEPLOY_KEY).toBe(DEPLOY_KEY);
    expect(push[2]).toMatchObject({ cwd: "/p" });
  });

  it("chave em formato inesperado: para sem publicar", async () => {
    const { deps } = makeDeps({ key: "algo-estranho" });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/chave de produção/));
    expect(vercelCalls(deps).some((v) => v[0] === "deploy")).toBe(false);
  });

  it("configura a produção do Convex: chaves de login novas e SITE_URL", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(convexCalls(deps)).toEqual(
      expect.arrayContaining([
        "convex env set --prod -- JWT_PRIVATE_KEY PRIV",
        "convex env set --prod -- JWKS {}",
        "convex env set --prod -- SITE_URL https://ana-site.vercel.app",
      ])
    );
  });

  it("copia Telegram e OpenRouter do ambiente do computador, quando existem", async () => {
    const { deps } = makeDeps({ devEnv: { TELEGRAM_BOT_TOKEN: "bot:1\n", OPENROUTER_API_KEY: "sk-or" } });
    await runPublish(deps);
    const sets = convexCalls(deps);
    expect(sets).toContain("convex env set --prod -- TELEGRAM_BOT_TOKEN bot:1");
    expect(sets).toContain("convex env set --prod -- OPENROUTER_API_KEY sk-or");
    expect(sets.some((c) => c.includes("TELEGRAM_ADMIN_CHAT_ID") && c.includes("set"))).toBe(false);
  });

  it("variável que não existe no computador (erro no env get) é só pulada", async () => {
    const { deps } = makeDeps({ fail: { "env get TELEGRAM_BOT_TOKEN": "not found" } });
    await runPublish(deps);
    expect(outro).toHaveBeenCalled();
  });

  it("com playground, gera um pepper novo para a produção", async () => {
    const { deps } = makeDeps({ state: { ...STATE, plugins: { playground: true } } });
    await runPublish(deps);
    expect(convexCalls(deps)).toContain(`convex env set --prod -- PLAYGROUND_KEY_PEPPER ${"07".repeat(32)}`);
  });

  it("com pagamentos, avisa que o Asaas de produção é configurado à parte", async () => {
    const { deps } = makeDeps({ state: { ...STATE, plugins: { payments: true } } });
    await runPublish(deps);
    expect(log.info).toHaveBeenCalledWith(expect.stringMatching(/Asaas/));
  });

  it("cria o admin do site publicado com o e-mail salvo e a senha pedida (regras do painel)", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const setup = convexCalls(deps).find((c) => c.startsWith("convex run --prod seed:setupAdmin"))!;
    expect(setup).toContain('"email":"ana@ana.dev"');
    expect(setup).toContain('"password":"SenhaForte2026"');
    const first = vi.mocked(password).mock.calls[0][0] as { validate: (v: string) => string | undefined };
    expect(first.validate("fraca")).toMatch(/12 caracteres/);
    const second = vi.mocked(password).mock.calls[1][0] as { validate: (v: string) => string | undefined };
    expect(second.validate("outra")).toMatch(/não coincidem/);
  });

  it("sem e-mail salvo, pergunta o e-mail do admin", async () => {
    const { deps } = makeDeps({ state: { ...STATE, identity: { siteName: "S" } } });
    vi.mocked(text).mockResolvedValueOnce(" Ana@Ana.dev ");
    await runPublish(deps);
    expect(convexCalls(deps).find((c) => c.includes("seed:setupAdmin"))).toContain('"email":"ana@ana.dev"');
  });

  it("produção que já tem admin: não pede senha", async () => {
    const { deps } = makeDeps({ adminExists: true });
    await runPublish(deps);
    expect(password).not.toHaveBeenCalled();
    expect(convexCalls(deps).some((c) => c.includes("seed:setupAdmin"))).toBe(false);
  });

  it("cancelar a senha para antes de publicar", async () => {
    const { deps } = makeDeps();
    vi.mocked(password).mockResolvedValueOnce("CANCEL");
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith("Nada foi publicado.");
    expect(vercelCalls(deps).some((v) => v[0] === "deploy")).toBe(false);
  });

  it("grava os dados iniciais na produção com o endereço publicado", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const runs = convexCalls(deps);
    expect(runs).toContain('convex run --prod seed:seedAll {"enabledPlugins":["blog"]}');
    expect(runs.find((c) => c.startsWith("convex run --prod siteConfig:setBatchInternal"))).toContain('"value":"https://ana-site.vercel.app"');
    expect(runs.find((c) => c.startsWith("convex run --prod contactInfo:updateInternal"))).toContain('"name":"Ana"');
  });

  it("leva a profissão e o contexto da IA do ambiente do computador para o contato da produção", async () => {
    const devContact = JSON.stringify({
      _id: "c1",
      name: "Ana",
      role: "Fotógrafa",
      roleTranslations: { ptBR: "Fotógrafa", enUS: "Photographer" },
      proposalAiContext: "Ana é Fotógrafa.",
      phone: "11999",
    });
    const { deps } = makeDeps({ devContact });
    await runPublish(deps);
    const contact = convexCalls(deps).find((c) => c.startsWith("convex run --prod contactInfo:updateInternal"))!;
    expect(JSON.parse(contact.slice("convex run --prod contactInfo:updateInternal ".length))).toEqual({
      name: "Ana",
      email: "ana@ana.dev",
      showEmail: false,
      role: "Fotógrafa",
      roleTranslations: { ptBR: "Fotógrafa", enUS: "Photographer" },
      proposalAiContext: "Ana é Fotógrafa.",
    });
  });

  it("sem contato no computador (ou consulta falhando), grava só nome e e-mail", async () => {
    for (const devContact of [null, "null"]) {
      vi.clearAllMocks();
      const { deps } = makeDeps({ devContact });
      await runPublish(deps);
      const contact = convexCalls(deps).find((c) => c.startsWith("convex run --prod contactInfo:updateInternal"))!;
      expect(contact).not.toContain("role");
    }
  });

  it("grava as 4 variáveis de produção na Vercel (a chave como sensível)", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const envAdds = vercelCalls(deps).filter((v) => v[0] === "env");
    expect(envAdds).toEqual([
      ["env", "add", "VITE_CONVEX_URL", "production", "--value", "https://happy-otter-123.convex.cloud", "--yes", "--force"],
      ["env", "add", "CONVEX_URL", "production", "--value", "https://happy-otter-123.convex.cloud", "--yes", "--force"],
      ["env", "add", "SITE_URL", "production", "--value", "https://ana-site.vercel.app", "--yes", "--force"],
      ["env", "add", "CONVEX_DEPLOY_KEY", "production", "--value", DEPLOY_KEY, "--yes", "--force", "--sensitive"],
    ]);
  });

  it("publica em produção por último e mostra o endereço, o login e como publicar de novo", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(vercelCalls(deps).at(-1)).toEqual(["deploy", "--prod", "--yes"]);
    const msg = vi.mocked(outro).mock.calls[0][0] as string;
    expect(msg).toContain("https://ana-site.vercel.app");
    expect(msg).toContain("https://ana-site.vercel.app/login");
    expect(msg).toContain("ana@ana.dev");
    expect(msg).toContain("npx create-rubrica publicar");
  });

  it("ordem: funções na produção → admin e dados → variáveis na Vercel → publicar", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const push = indexOf(deps, (a) => a.join(" ") === "convex deploy");
    const admin = indexOf(deps, (a) => a.includes("seed:setupAdmin"));
    const seed = indexOf(deps, (a) => a.includes("seed:seedAll"));
    const envAdd = indexOf(deps, (a) => vercelArgs(a)?.[0] === "env");
    const deploy = indexOf(deps, (a) => vercelArgs(a)?.[0] === "deploy");
    expect(push).toBeLessThan(admin);
    expect(admin).toBeLessThan(seed);
    expect(seed).toBeLessThan(envAdd);
    expect(envAdd).toBeLessThan(deploy);
  });

  it("todo comando roda na pasta do projeto; só o login herda o terminal", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    for (const c of deps.execFileSync.mock.calls) {
      expect(c[0]).toBe("npx");
      expect(c[2]).toMatchObject({ cwd: "/p", stdio: "pipe" });
    }
  });

  it("RUBRICA_VERCEL_GLOBAL_CONFIG escolhe a conta da Vercel (várias contas no mesmo computador)", async () => {
    const { deps } = makeDeps({ processEnv: { RUBRICA_VERCEL_GLOBAL_CONFIG: "/home/x/.vercel-pessoal" } });
    await runPublish(deps);
    const anyVercel = calls(deps).find((a) => a[1] === "vercel@latest")!;
    expect(anyVercel.slice(0, 4)).toEqual(["--yes", "vercel@latest", "--global-config", "/home/x/.vercel-pessoal"]);
  });

  it("falha no envio das funções: para e mostra o erro", async () => {
    const { deps } = makeDeps({ fail: { "convex deploy": "Schema validation failed" } });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("Schema validation failed"));
    expect(vercelCalls(deps).some((v) => v[0] === "deploy")).toBe(false);
  });

  it("falha na publicação da Vercel: mostra o erro e diz como tentar de novo", async () => {
    const { deps } = makeDeps({ fail: { "deploy --prod": "Build failed: missing CONVEX_DEPLOY_KEY" } });
    await runPublish(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("Build failed");
    expect(msg).toContain("npx create-rubrica publicar");
  });
});

describe("publicar — detalhes", () => {
  it("erro que vem pelo stdout aparece; sem saída, aparece a mensagem do erro", async () => {
    const a = makeDeps({ fail: { "convex deploy": { stdout: "Erro no stdout" } } });
    await runPublish(a.deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("Erro no stdout"));
    vi.mocked(cancel).mockClear();
    const b = makeDeps({ fail: { "convex deploy": { message: "spawn npx ENOENT" } } });
    await runPublish(b.deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("spawn npx ENOENT"));
  });

  it("de um log longo, mostra só as últimas 15 linhas", async () => {
    const log30 = Array.from({ length: 30 }, (_, i) => `linha ${i + 1}`).join("\n");
    const { deps } = makeDeps({ fail: { "deploy --prod": log30 } });
    await runPublish(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("linha 30");
    expect(msg).toContain("linha 16");
    expect(msg).not.toMatch(/linha 15\b/);
  });

  it("CONVEX_DEPLOYMENT comentado não conta como ligado ao Convex", async () => {
    const { deps } = makeDeps({ env: "#CONVEX_DEPLOYMENT=dev:x\n" });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx create-rubrica setup"));
  });

  it("sem domínio .vercel.app na resposta da API, usa <projeto>.vercel.app", async () => {
    const { deps } = makeDeps({ domains: JSON.stringify({ domains: [{ name: "www.meu.com" }] }) });
    await runPublish(deps);
    expect(convexCalls(deps)).toContain("convex env set --prod -- SITE_URL https://ana-site.vercel.app");
  });

  it("falha ao criar o projeto na Vercel: para e mostra o erro", async () => {
    const { deps } = makeDeps({ fail: { "link --yes": "Project name taken" } });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("Project name taken"));
    expect(convexCalls(deps)).toEqual([]);
  });

  it("falha ao criar a chave de produção: para e mostra o erro", async () => {
    const { deps } = makeDeps({ fail: { "deployment token create": "No prod deployment" } });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("No prod deployment"));
  });

  it.each(["dev:abc|x", "xprod:abc|x"])("chave %j (não é de produção) é recusada", async (key) => {
    const { deps } = makeDeps({ key });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/chave de produção/));
  });

  it("variável cujo env get falha não é gravada; TELEGRAM_ADMIN_CHAT_ID também é copiado", async () => {
    const { deps } = makeDeps({ devEnv: { TELEGRAM_ADMIN_CHAT_ID: "42" }, fail: { "env get OPENROUTER_API_KEY": "boom" } });
    await runPublish(deps);
    const sets = convexCalls(deps);
    expect(sets).toContain("convex env set --prod -- TELEGRAM_ADMIN_CHAT_ID 42");
    expect(sets.some((c) => c.includes("set --prod -- OPENROUTER_API_KEY"))).toBe(false);
  });

  it("sem playground nem pagamentos: nada de pepper nem aviso do Asaas", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    expect(convexCalls(deps).some((c) => c.includes("PLAYGROUND_KEY_PEPPER"))).toBe(false);
    expect(log.info).not.toHaveBeenCalledWith(expect.stringMatching(/Asaas/));
  });

  it("senhas iguais passam na confirmação", async () => {
    const { deps } = makeDeps();
    await runPublish(deps);
    const second = vi.mocked(password).mock.calls[1][0] as { validate: (v: string) => string | undefined };
    expect(second.validate("SenhaForte2026")).toBeUndefined();
  });

  it.each(["email", "confirm"])("cancelar no %s do admin para sem publicar", async (which) => {
    const { deps } = makeDeps({ state: { ...STATE, identity: { siteName: "S" } } });
    vi.mocked(text).mockResolvedValueOnce(which === "email" ? "CANCEL" : "a@a.dev");
    vi.mocked(password).mockResolvedValueOnce("SenhaForte2026").mockResolvedValueOnce(which === "confirm" ? "CANCEL" : "SenhaForte2026");
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith("Nada foi publicado.");
    expect(convexCalls(deps).some((c) => c.includes("seed:setupAdmin"))).toBe(false);
  });

  it("sem nome do site, não grava siteConfig nem contato", async () => {
    const { deps } = makeDeps({ state: { ...STATE, identity: { authorEmail: "a@a.dev" } } });
    await runPublish(deps);
    const runs = convexCalls(deps);
    expect(runs.some((c) => c.includes("siteConfig:setBatchInternal"))).toBe(false);
    expect(runs.some((c) => c.includes("contactInfo:updateInternal"))).toBe(false);
    expect(vi.mocked(outro).mock.calls[0][0]).toContain("(a@a.dev)");
  });

  it("do contato do computador, só leva os campos que existem", async () => {
    const { deps } = makeDeps({ devContact: JSON.stringify({ role: "Fotógrafa" }) });
    await runPublish(deps);
    const contact = convexCalls(deps).find((c) => c.startsWith("convex run --prod contactInfo:updateInternal"))!;
    expect(contact).toContain('"role":"Fotógrafa"');
    expect(contact).not.toContain("proposalAiContext");
    expect(contact).not.toContain("roleTranslations");
  });
});

describe("publicar — de novo", () => {
  it("projeto já ligado: confirma e só publica de novo", async () => {
    const { deps } = makeDeps({ linked: true });
    await runPublish(deps);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/de novo/) }));
    expect(vercelCalls(deps).map((v) => v[0])).toEqual(["whoami", "api", "deploy"]);
    expect(convexCalls(deps)).toEqual([]);
    expect(vi.mocked(outro).mock.calls[0][0]).toContain("https://ana-site.vercel.app");
  });

  it("recusando, não publica", async () => {
    const { deps } = makeDeps({ linked: true });
    vi.mocked(confirm).mockResolvedValueOnce(false);
    await runPublish(deps);
    expect(vercelCalls(deps).some((v) => v[0] === "deploy")).toBe(false);
  });
});

describe("publicar — antes de começar", () => {
  it("fora de um projeto Rubrica, explica e para", async () => {
    const { deps } = makeDeps();
    deps.detectProject.mockRejectedValueOnce(new Error("Não é um projeto Rubrica"));
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith("Não é um projeto Rubrica");
  });

  it("projeto ainda sem Convex: manda rodar o setup", async () => {
    const { deps } = makeDeps({ env: null });
    await runPublish(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx create-rubrica setup"));
    expect(deps.execFileSync).not.toHaveBeenCalled();
  });
});
