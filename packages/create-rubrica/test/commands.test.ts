import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FakeShell } from "./fake-shell";
import { sampleState, tmp } from "./helpers";

// Respostas das perguntas, na ordem (o teste preenche).
const answers: unknown[] = [];
const next = () => {
  if (!answers.length) throw new Error("pergunta sem resposta no teste");
  return answers.shift();
};
vi.mock("../src/ui", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  const quiet = { info: () => {}, warn: () => {}, success: () => {}, error: () => {}, message: () => {}, step: () => {} };
  return {
    ...real,
    log: quiet,
    note: () => {},
    outro: () => {},
    intro: () => {},
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    canAsk: () => false,
    ask: async () => next(),
    askSecret: async () => next(),
    choose: async () => next(),
    chooseMany: async () => next(),
    confirm: async () => next(),
  };
});

const { runSetup, INTEGRATIONS } = await import("../src/commands/setup");
const { runPassword } = await import("../src/commands/password");
const { runPublish, productionUrls } = await import("../src/commands/publish");

const keys = async () => ({ JWT_PRIVATE_KEY: "chave-privada", JWKS: '{"keys":[]}' });
const bytes = (n: number) => Buffer.alloc(n, 7);

function project(state = sampleState()) {
  const dir = tmp();
  writeFileSync(join(dir, "rubrica.json"), JSON.stringify(state));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "site-da-ana" }));
  writeFileSync(join(dir, ".env.local"), "CONVEX_DEPLOYMENT=dev:ana-123 # team: ana\nCONVEX_URL=https://ana-123.convex.cloud\nCONVEX_SITE_URL=https://ana-123.convex.site\n");
  return dir;
}

function backend(status = { configured: false, pages: 0, hasRoot: false }) {
  return new FakeShell({
    "rubrica/seed:status": () => status,
    "rubrica/users:setupRoot": () => ({ userId: "u1" }),
    "rubrica/seed:apply": () => ({ pagesCreated: 7, pagesSkipped: 0 }),
    "rubrica/users:resetPasswordInternal": (a) => ({ email: a.email }),
  });
}

beforeEach(() => {
  answers.length = 0;
});

describe("setup", () => {
  it("grava as variáveis, cria o root e monta o conteúdo pela receita", async () => {
    const dir = project();
    const shell = backend();
    // e-mail, senha, repetir; depois "não" para cada integração oferecida
    answers.push("ana@exemplo.dev", "SenhaForte1234", "SenhaForte1234");
    const offered = INTEGRATIONS.filter((i) => i.when(sampleState().plugins)).length;
    for (let i = 0; i < offered; i++) answers.push(false);
    await runSetup({ cwd: dir, runner: shell.runner, generateKeys: keys, randomBytes: bytes, loadRecipe: async () => null });

    expect(shell.env.dev.JWKS).toBe('{"keys":[]}');
    expect(shell.env.dev.SITE_URL).toBe("https://ana.dev");
    expect(shell.env.dev.RUBRICA_ALLOW_LOCALHOST).toBe("true");
    expect(shell.env.dev.RUBRICA_IP_SALT).toHaveLength(64);
    expect(shell.fnCalls("rubrica/users:setupRoot")).toEqual([{ prod: false, args: { email: "ana@exemplo.dev", password: "SenhaForte1234", name: "Ana Souza" } }]);
    const seed = shell.fnCalls("rubrica/seed:apply")[0]!;
    expect(seed.prod).toBe(false);
    expect(seed.args.settings).toMatchObject({ kind: "pessoal", theme: "padrao", locales: { locales: ["pt-BR", "en"], default: "pt-BR" }, appearance: { scheme: "neon" } });
    expect(seed.args.recipe).toBeUndefined();
    // nada foi para a produção
    expect(shell.env.prod).toEqual({});
  });

  it("rodar de novo não troca as chaves, não pede senha e não sobrescreve o conteúdo", async () => {
    const dir = project();
    const shell = backend({ configured: true, pages: 7, hasRoot: true });
    shell.env.dev = { JWKS: "antiga", JWT_PRIVATE_KEY: "antiga", RUBRICA_IP_SALT: "sal", RUBRICA_DEPLOY_CALLBACK_SECRET: "s" };
    for (const i of INTEGRATIONS) if (i.when(sampleState().plugins)) answers.push(false);
    await runSetup({ cwd: dir, runner: shell.runner, generateKeys: keys, randomBytes: bytes });
    expect(shell.env.dev.JWKS).toBe("antiga");
    expect(shell.env.dev.RUBRICA_IP_SALT).toBe("sal");
    expect(shell.fnCalls("rubrica/users:setupRoot")).toEqual([]);
    expect(shell.fnCalls("rubrica/seed:apply")).toEqual([]);
  });

  it("segue com aviso quando o backend ainda não tem rubrica/seed", async () => {
    const dir = project();
    const shell = new FakeShell({});
    for (const i of INTEGRATIONS) if (i.when(sampleState().plugins)) answers.push(false);
    await expect(runSetup({ cwd: dir, runner: shell.runner, generateKeys: keys, randomBytes: bytes })).resolves.toBeUndefined();
    expect(shell.env.dev.JWKS).toBeDefined();
  });

  it("liga o Asaas com token de webhook gerado", async () => {
    const dir = project(sampleState({ plugins: { payments: true, "contact-wizard": false } }));
    const shell = backend({ configured: true, pages: 1, hasRoot: true });
    for (const i of INTEGRATIONS.filter((x) => x.when({ payments: true, "contact-wizard": false }))) {
      if (i.id === "asaas") answers.push(true, "$aact_teste");
      else answers.push(false);
    }
    await runSetup({ cwd: dir, runner: shell.runner, generateKeys: keys, randomBytes: bytes });
    expect(shell.env.dev.ASAAS_API_KEY).toBe("$aact_teste");
    expect(shell.env.dev.ASAAS_WEBHOOK_TOKEN).toBe("07".repeat(32));
  });
});

describe("senha", () => {
  it("troca a senha na produção pela função interna", async () => {
    const dir = project();
    const shell = backend();
    answers.push("prod", "ana@exemplo.dev", "NovaSenha12345", "NovaSenha12345");
    await runPassword({ cwd: dir, runner: shell.runner });
    expect(shell.fnCalls("rubrica/users:resetPasswordInternal")).toEqual([{ prod: true, args: { email: "ana@exemplo.dev", password: "NovaSenha12345" } }]);
  });

  it("explica quando não há usuário com o e-mail", async () => {
    const dir = project();
    const shell = new FakeShell({
      "rubrica/users:resetPasswordInternal": (a) => {
        throw new Error(`Nenhum usuário com o e-mail ${String(a.email)}`);
      },
    });
    answers.push("dev", "ninguem@exemplo.dev", "NovaSenha12345", "NovaSenha12345");
    await expect(runPassword({ cwd: dir, runner: shell.runner })).rejects.toThrow(/Nenhum usuário com o e-mail ninguem@exemplo.dev neste site/);
  });
});

describe("publicar", () => {
  it("lê os endereços da chave de produção", () => {
    expect(productionUrls("prod:feliz-gato-123|segredo")).toEqual({ name: "feliz-gato-123", convexUrl: "https://feliz-gato-123.convex.cloud", siteUrl: "https://feliz-gato-123.convex.site" });
    expect(productionUrls("dev:x|y")).toBeNull();
  });

  it("primeira vez: produção com chaves, root, conteúdo e variáveis da Vercel", async () => {
    const dir = project();
    const shell = backend();
    shell.env.dev.TELEGRAM_BOT_TOKEN = "tg";
    // confirmar, e-mail, senha x2, deploy hook (pula)
    answers.push(true, "ana@exemplo.dev", "SenhaForte1234", "SenhaForte1234", "");
    // o `vercel link` cria a pasta .vercel
    const original = shell.runner;
    shell.runner = (file, args, opts) => {
      if (args.includes("link")) {
        mkdirSync(join(dir, ".vercel"), { recursive: true });
        writeFileSync(join(dir, ".vercel/project.json"), JSON.stringify({ projectId: "prj_1" }));
      }
      return original(file, args, opts);
    };
    await runPublish({ cwd: dir, runner: shell.runner, generateKeys: keys, randomBytes: bytes, env: {} });

    const deploy = shell.calls.find((c) => c[1] === "convex" && c[2] === "deploy");
    expect(deploy).toBeDefined();
    expect(shell.env.prod.JWKS).toBe('{"keys":[]}');
    expect(shell.env.prod.TELEGRAM_BOT_TOKEN).toBe("tg");
    expect(shell.env.prod.RUBRICA_ALLOW_LOCALHOST).toBeUndefined();
    expect(shell.fnCalls("rubrica/users:setupRoot")[0]?.prod).toBe(true);
    expect(shell.fnCalls("rubrica/seed:apply")[0]?.prod).toBe(true);
    const envAdds = shell.calls.filter((c) => c.includes("env") && c.includes("add")).map((c) => c[c.indexOf("add") + 1]);
    expect(envAdds).toEqual(["CONVEX_DEPLOY_KEY", "CONVEX_URL", "SITE_URL"]);
    expect(JSON.parse(readFileSync(join(dir, "rubrica.json"), "utf-8")).producao).toEqual({ convexUrl: "https://feliz-gato-123.convex.cloud", siteUrl: "https://site-da-ana.vercel.app" });
    expect(shell.calls.some((c) => c.includes("deploy") && c.includes("--prod") && c.some((a) => a.startsWith("vercel")))).toBe(true);
  });

  it("não publica sem confirmação", async () => {
    const dir = project();
    const shell = backend();
    answers.push(false);
    await expect(runPublish({ cwd: dir, runner: shell.runner, env: {} })).rejects.toThrow(/Nada foi publicado/);
    expect(shell.calls.filter((c) => c.some((a) => a.startsWith("vercel")))).toEqual([]);
  });
});

describe("config --analytics", () => {
  it("grava no rubrica.json, libera a origem na CSP dos arquivos do projeto e manda ao Convex do computador", async () => {
    const { runConfig } = await import("../src/commands/config");
    const { hostingFiles } = await import("../src/project/hosting");
    const dir = project();
    mkdirSync(join(dir, "public"), { recursive: true });
    for (const [file, content] of Object.entries(hostingFiles())) writeFileSync(join(dir, file), content);
    const shell = new FakeShell({ "rubrica/seed:patchSettings": () => null });
    await runConfig(["--analytics", "https://cloud.umami.is/script.js", "--analytics-id", "abc-123"], { cwd: dir, runner: shell.runner });
    const state = JSON.parse(readFileSync(join(dir, "rubrica.json"), "utf-8"));
    expect(state.analytics).toEqual({ script: "https://cloud.umami.is/script.js", id: "abc-123" });
    expect(readFileSync(join(dir, "vercel.json"), "utf-8")).toContain("script-src 'self' 'unsafe-inline' https://cloud.umami.is");
    expect(readFileSync(join(dir, "public/_headers"), "utf-8")).toContain("connect-src 'self' https://cloud.umami.is");
    const patch = shell.fnCalls("rubrica/seed:patchSettings")[0]?.args.patch as Record<string, unknown>;
    expect(patch.analytics).toEqual({ scriptUrl: "https://cloud.umami.is/script.js", websiteId: "abc-123" });

    await runConfig(["--analytics", "desligar"], { cwd: dir, runner: shell.runner });
    expect(readFileSync(join(dir, "vercel.json"), "utf-8")).not.toContain("umami");
    expect(JSON.parse(readFileSync(join(dir, "rubrica.json"), "utf-8")).plugins.analytics).toBe(false);
  });
});
