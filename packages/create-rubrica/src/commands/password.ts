import { outro, text, password, select, isCancel, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { execFileSync as defaultExecFileSync } from "node:child_process";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { readState as defaultReadState } from "../state/readState.js";
import { normalizeEmail, validateEmail } from "../utils/normalize.js";
import { validatePassword } from "../utils/password.js";

export interface RunPasswordDeps {
  cwd?: string;
  fs?: { readFile: (path: string, encoding: string) => Promise<string> };
  detectProject?: typeof defaultDetectProject;
  readState?: typeof defaultReadState;
  execFileSync?: (file: string, args: string[], opts?: object) => Buffer;
}

const NOTHING_CHANGED = "Nada foi alterado.";

/**
 * `npx create-rubrica senha`: troca a senha de quem entra no painel admin, para quem
 * esqueceu ou ficou bloqueado. Usa a função interna users:resetPasswordInternal, que só
 * quem tem acesso ao projeto no Convex consegue chamar.
 */
export async function runPassword(deps: RunPasswordDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? { readFile: (p: string, e: string) => nodeFsPromises.readFile(p, e as BufferEncoding) };
  const detectProject = deps.detectProject ?? defaultDetectProject;
  const readState = deps.readState ?? defaultReadState;
  const execFileSync =
    deps.execFileSync ??
    ((file: string, args: string[], opts?: object) =>
      defaultExecFileSync(file, args, opts as Parameters<typeof defaultExecFileSync>[2]) as Buffer);

  try {
    await detectProject(cwd);
  } catch (err) {
    cancel((err as Error).message);
    return;
  }

  // Sem .env.local o projeto nunca foi ligado ao Convex: não há admin para trocar a senha.
  const connected = await fs.readFile(path.join(cwd, ".env.local"), "utf-8").then(
    (env) => /^CONVEX_DEPLOYMENT=/m.test(env) || /^VITE_CONVEX_URL=/m.test(env),
    () => false
  );
  if (!connected) {
    cancel("Este projeto ainda não está ligado ao Convex, então ainda não tem painel. Rode npx create-rubrica setup primeiro.");
    return;
  }

  const state = await readState(cwd, fs as Parameters<typeof defaultReadState>[1]);
  const identity = (state.identity ?? {}) as Partial<Record<string, string>>;

  const where = await select({
    message: "Onde você quer trocar a senha?",
    initialValue: "prod",
    options: [
      { value: "prod", label: "No site publicado", hint: "o que está no ar" },
      { value: "dev", label: "No site do seu computador", hint: "o que abre com npm run dev" },
    ],
  });
  if (isCancel(where)) return void cancel(NOTHING_CHANGED);

  const emailAnswer = await text({
    message: "E-mail de quem entra no painel:",
    initialValue: normalizeEmail(identity.authorEmail ?? ""),
    validate: validateEmail,
  });
  if (isCancel(emailAnswer)) return void cancel(NOTHING_CHANGED);
  const email = normalizeEmail(emailAnswer as string);

  const newPassword = await password({
    message: "Senha nova (12 ou mais caracteres, com maiúscula, minúscula e número):",
    validate: validatePassword,
  });
  if (isCancel(newPassword)) return void cancel(NOTHING_CHANGED);

  const confirmPassword = await password({
    message: "Repita a senha nova:",
    validate: (v) => (v !== newPassword ? "As senhas não coincidem" : undefined),
  });
  if (isCancel(confirmPassword)) return void cancel(NOTHING_CHANGED);

  const prod = where === "prod";
  try {
    execFileSync(
      "npx",
      ["convex", "run", ...(prod ? ["--prod"] : []), "users:resetPasswordInternal", JSON.stringify({ email, password: newPassword })],
      { stdio: "pipe", cwd }
    );
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const output = `${e.stderr?.toString() ?? ""}${e.stdout?.toString() ?? ""}` || e.message || "";
    if (output.includes("Nenhum usuário")) {
      cancel(`Nenhum usuário com o e-mail ${email} neste site. Confira o e-mail e rode de novo.`);
    } else if (output.includes("No functions found")) {
      // O deployment existe mas está vazio: nada foi publicado nele.
      cancel(
        prod
          ? 'O site ainda não foi publicado, então não há senha para trocar lá. Para o site do seu computador, rode de novo e escolha "No site do seu computador".'
          : "O backend deste projeto está vazio. Rode npx create-rubrica setup para configurá-lo."
      );
    } else if (/Could not find|not found/i.test(output) && output.includes("resetPasswordInternal")) {
      cancel(
        "Este projeto é de uma versão sem a troca de senha pelo terminal. Atualize com npx create-rubrica@latest update" +
          (prod ? ", publique de novo e rode este comando outra vez." : " e rode de novo.")
      );
    } else {
      cancel(
        `Não deu para trocar a senha:\n${output.trim()}` +
          (prod ? "\n\nSe você ainda não publicou o site, rode de novo e escolha \"No site do seu computador\"." : "")
      );
    }
    return;
  }

  const loginUrl = !prod
    ? "http://localhost:3000/login"
    : identity.siteUrl
      ? `${identity.siteUrl.replace(/\/+$/, "")}/login`
      : "o /login do seu site";
  log.info("Se o login estava bloqueado por tentativas erradas, ele também foi liberado.");
  outro(`Senha trocada!\n\n  Entre em ${loginUrl}\n  com ${email}`);
}
