import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { validatePassword } from "../utils/password.js";
import { runPassword } from "../commands/password.js";

vi.mock("@clack/prompts", () => ({
  outro: vi.fn(),
  text: vi.fn(),
  password: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn((v) => v === "CANCEL"),
  cancel: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn() },
}));

import { text, password, select, outro, cancel } from "@clack/prompts";

describe("validatePassword (mesmas regras do painel)", () => {
  it.each([
    ["Curta1A", /12 caracteres/],
    ["semmaiuscula123", /maiúscula/],
    ["SEMMINUSCULA123", /minúscula/],
    ["SemNumeroNenhum", /número/],
  ])("recusa %j", (pw, msg) => {
    expect(validatePassword(pw)).toMatch(msg);
  });

  it("aceita senha forte (12 com maiúscula, minúscula e número)", () => {
    expect(validatePassword("NovaSenha123")).toBeUndefined();
  });
});

const ENV = "CONVEX_DEPLOYMENT=dev:x\nVITE_CONVEX_URL=https://x.convex.cloud\n";
const STATE = { plugins: {}, identity: { authorEmail: "ana@ana.dev", siteUrl: "https://ana.dev" } };

function makeDeps(opts: { env?: boolean | string; fail?: string | { stdout?: string; message?: string }; state?: object } = {}) {
  const state = opts.state ?? STATE;
  const files: Record<string, string> = { "/p/rubrica.json": JSON.stringify(state) };
  if (opts.env !== false) files["/p/.env.local"] = typeof opts.env === "string" ? opts.env : ENV;
  const vol = Volume.fromJSON(files);
  return {
    cwd: "/p",
    fs: { readFile: (p: string, e: string) => vol.promises.readFile(p, e as BufferEncoding) as Promise<string> },
    detectProject: vi.fn().mockResolvedValue("/p/rubrica.json"),
    readState: vi.fn().mockResolvedValue(state),
    execFileSync: vi.fn((_f: string, _a: string[], _o?: object) => {
      if (typeof opts.fail === "string") throw Object.assign(new Error("falhou"), { stderr: Buffer.from(opts.fail) });
      if (opts.fail) {
        throw Object.assign(new Error(opts.fail.message ?? "falhou"), opts.fail.stdout ? { stdout: Buffer.from(opts.fail.stdout) } : {});
      }
      return Buffer.from("");
    }),
  };
}

function answer(where = "prod", email = "ana@ana.dev", pw = "NovaSenha123", confirm = pw) {
  vi.mocked(select).mockResolvedValueOnce(where);
  vi.mocked(text).mockResolvedValueOnce(email);
  vi.mocked(password).mockResolvedValueOnce(pw).mockResolvedValueOnce(confirm);
}

const runArgs = (deps: ReturnType<typeof makeDeps>) => deps.execFileSync.mock.calls[0];

describe("runPassword (npx create-rubrica senha)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Respostas enfileiradas e não usadas num teste não podem vazar para o próximo.
    for (const prompt of [select, text, password]) vi.mocked(prompt).mockReset();
  });

  it("troca a senha no site publicado pela função interna, na pasta do projeto", async () => {
    const deps = makeDeps();
    answer("prod");
    await runPassword(deps);
    const [file, args, opts] = runArgs(deps);
    expect(file).toBe("npx");
    expect(args).toEqual(["convex", "run", "--prod", "users:resetPasswordInternal", JSON.stringify({ email: "ana@ana.dev", password: "NovaSenha123" })]);
    expect(opts).toEqual({ stdio: "pipe", cwd: "/p" });
    expect(vi.mocked(outro).mock.calls[0][0]).toMatch(/https:\/\/ana\.dev\/login.*ana@ana\.dev/s);
  });

  it("no site do computador, roda sem --prod e aponta para o localhost", async () => {
    const deps = makeDeps();
    answer("dev");
    await runPassword(deps);
    expect(runArgs(deps)[1]).not.toContain("--prod");
    expect(vi.mocked(outro).mock.calls[0][0]).toMatch(/localhost:3000\/login/);
  });

  it("pergunta onde trocar, começando pelo site publicado", async () => {
    answer();
    await runPassword(makeDeps());
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ initialValue: "prod" }));
  });

  it("o e-mail começa preenchido, é validado e vai limpo", async () => {
    const deps = makeDeps();
    answer("prod", " Ana@Ana.dev ");
    await runPassword(deps);
    const opts = vi.mocked(text).mock.calls[0][0] as { initialValue: string; validate: (v: string) => string | undefined };
    expect(opts.initialValue).toBe("ana@ana.dev");
    expect(opts.validate("x")).toMatch(/e-mail válido/);
    expect(runArgs(deps)[1][4]).toContain('"email":"ana@ana.dev"');
  });

  it("a senha segue as regras do painel e a confirmação precisa bater", async () => {
    answer();
    await runPassword(makeDeps());
    const first = vi.mocked(password).mock.calls[0][0] as { validate: (v: string) => string | undefined };
    const second = vi.mocked(password).mock.calls[1][0] as { validate: (v: string) => string | undefined };
    expect(first.validate("fraca")).toMatch(/12 caracteres/);
    expect(second.validate("Outra123456A")).toMatch(/não coincidem/);
    expect(second.validate("NovaSenha123")).toBeUndefined();
  });

  it("fora de um projeto Rubrica, explica e para", async () => {
    const deps = { ...makeDeps(), detectProject: vi.fn().mockRejectedValue(new Error("Não é um projeto Rubrica")) };
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith("Não é um projeto Rubrica");
    expect(select).not.toHaveBeenCalled();
  });

  it("projeto ainda sem Convex: manda rodar o setup", async () => {
    const deps = makeDeps({ env: false });
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx create-rubrica setup"));
    expect(deps.execFileSync).not.toHaveBeenCalled();
  });

  it.each([
    ["vazio", ""],
    ["com a variável comentada", "#VITE_CONVEX_URL=https://x.convex.cloud\n"],
  ])(".env.local %s não conta como conectado", async (_label, env) => {
    const deps = makeDeps({ env });
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx create-rubrica setup"));
  });

  it("basta o CONVEX_DEPLOYMENT para contar como conectado", async () => {
    const deps = makeDeps({ env: "CONVEX_DEPLOYMENT=dev:x\n" });
    answer();
    await runPassword(deps);
    expect(deps.execFileSync).toHaveBeenCalled();
  });

  it("sem e-mail salvo, a pergunta começa vazia", async () => {
    answer();
    await runPassword(makeDeps({ state: { plugins: {}, identity: {} } }));
    expect((vi.mocked(text).mock.calls[0][0] as { initialValue: string }).initialValue).toBe("");
  });

  it("endereço com barra no final não dobra a barra; sem endereço salvo, aponta para o /login do site", async () => {
    answer();
    await runPassword(makeDeps({ state: { plugins: {}, identity: { authorEmail: "a@a.dev", siteUrl: "https://ana.dev/" } } }));
    expect(vi.mocked(outro).mock.calls[0][0]).toContain("https://ana.dev/login");
    vi.mocked(outro).mockClear();
    answer();
    await runPassword(makeDeps({ state: { plugins: {}, identity: { authorEmail: "a@a.dev" } } }));
    expect(vi.mocked(outro).mock.calls[0][0]).toMatch(/\/login do seu site/);
    expect(vi.mocked(outro).mock.calls[0][0]).not.toMatch(/localhost/);
  });

  it("erro que chega pelo stdout também é reconhecido", async () => {
    const deps = makeDeps({ fail: { stdout: "Error: Nenhum usuário com o e-mail ana@ana.dev" } });
    answer();
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/^Nenhum usuário/));
  });

  it("sem stdout nem stderr, mostra a mensagem do erro", async () => {
    const deps = makeDeps({ fail: { message: "spawn npx ENOENT" } });
    answer("dev");
    await runPassword(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("spawn npx ENOENT");
    expect(msg).not.toMatch(/ainda não publicou/);
  });

  it("'not found' que não é da função (deployment, por exemplo) não manda atualizar", async () => {
    const deps = makeDeps({ fail: "Deployment not found" });
    answer();
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("Não deu para trocar a senha"));
  });

  it("e-mail sem conta: diz isso com clareza", async () => {
    const deps = makeDeps({ fail: "Uncaught Error: Nenhum usuário com o e-mail x@a.dev\n    at handler" });
    answer();
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringMatching(/Nenhum usuário com o e-mail ana@ana\.dev/));
    expect(outro).not.toHaveBeenCalled();
  });

  const NOT_FOUND = "Could not find function for 'users:resetPasswordInternal'. Did you forget to run `npx convex dev`?";

  it("site publicado vazio (nunca publicou): diz isso e sugere o site do computador", async () => {
    const deps = makeDeps({ fail: `${NOT_FOUND}\n\nNo functions found.` });
    answer("prod");
    await runPassword(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toMatch(/ainda não foi publicado/);
    expect(msg).toMatch(/No site do seu computador/);
    expect(msg).not.toMatch(/update/);
  });

  it("site publicado com versão antiga: manda atualizar e publicar de novo", async () => {
    const deps = makeDeps({ fail: NOT_FOUND });
    answer("prod");
    await runPassword(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("npx create-rubrica@latest update");
    expect(msg).toMatch(/publique de novo/);
  });

  it("site do computador com versão antiga: manda atualizar", async () => {
    const deps = makeDeps({ fail: NOT_FOUND });
    answer("dev");
    await runPassword(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("npx create-rubrica@latest update");
    expect(msg).not.toMatch(/publique/);
  });

  it("site do computador vazio: manda rodar o setup", async () => {
    const deps = makeDeps({ fail: `${NOT_FOUND}\n\nNo functions found.` });
    answer("dev");
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("npx create-rubrica setup"));
  });

  it("outro erro no site publicado: mostra o erro e sugere o site do computador se ainda não publicou", async () => {
    const deps = makeDeps({ fail: "No production deployment" });
    answer("prod");
    await runPassword(deps);
    const msg = vi.mocked(cancel).mock.calls[0][0] as string;
    expect(msg).toContain("No production deployment");
    expect(msg).toMatch(/ainda não publicou/);
  });

  it.each(["select", "text", "password", "confirm"])("cancelar no %s para sem trocar nada", async (which) => {
    const deps = makeDeps();
    vi.mocked(select).mockResolvedValueOnce(which === "select" ? "CANCEL" : "prod");
    vi.mocked(text).mockResolvedValueOnce(which === "text" ? "CANCEL" : "ana@ana.dev");
    vi.mocked(password)
      .mockResolvedValueOnce(which === "password" ? "CANCEL" : "NovaSenha123")
      .mockResolvedValueOnce(which === "confirm" ? "CANCEL" : "NovaSenha123");
    await runPassword(deps);
    expect(cancel).toHaveBeenCalledWith("Nada foi alterado.");
    expect(deps.execFileSync).not.toHaveBeenCalled();
  });
});
