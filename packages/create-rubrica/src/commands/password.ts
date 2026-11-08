/**
 * `senha`: troca a senha de quem entra no painel (esqueceu, ou ficou bloqueado). Usa a
 * função interna `rubrica/users:resetPasswordInternal`, que só quem tem acesso ao
 * projeto no Convex consegue chamar. Sempre a pessoa roda: a senha nunca passa pelo agente.
 */
import { convexRun, deploymentLabel, isEmptyDeployment, isMissingFunction, type ConvexContext } from "../utils/convex.js";
import { readEnvLocal } from "../utils/env.js";
import { errorOutput, type Runner } from "../utils/exec.js";
import { normalizeEmail, validateEmail } from "../utils/normalize.js";
import { validatePassword } from "../utils/password.js";
import { findProjectDir, readState } from "../state.js";
import { ask, askSecret, Cancelled, choose, log, outro } from "../ui.js";
import { runScript } from "../utils/packageManager.js";
import { projectPackageManager } from "../utils/fs.js";

export async function runPassword(deps: { cwd: string; runner?: Runner }): Promise<void> {
  const projectDir = findProjectDir(deps.cwd);
  const state = readState(projectDir);
  if (!readEnvLocal(projectDir).CONVEX_DEPLOYMENT) {
    throw new Cancelled("Este projeto ainda não está ligado ao Convex, então ainda não tem painel. Rode npx create-rubrica setup primeiro.");
  }
  const where = await choose("Onde você quer trocar a senha?", [
    { value: "prod", label: "No site publicado", hint: "o que está no ar" },
    { value: "dev", label: "No site do seu computador", hint: `o que abre com ${runScript(projectPackageManager(projectDir), "dev")}` },
  ], "prod");
  const ctx: ConvexContext = { projectDir, prod: where === "prod", ...(deps.runner && { runner: deps.runner }) };
  log.info(`Convex: ${deploymentLabel(ctx)}`);

  const email = normalizeEmail(await ask("E-mail de quem entra no painel:", { initial: state.identidade.email ?? "", validate: validateEmail }));
  const password = await askSecret("Senha nova (12 ou mais caracteres, com maiúscula, minúscula e número):", validatePassword);
  await askSecret("Repita a senha nova:", (v) => (v !== password ? "As senhas não coincidem" : undefined));

  try {
    convexRun(ctx, "rubrica/users:resetPasswordInternal", { email, password });
  } catch (err) {
    const output = errorOutput(err);
    if (output.includes("Nenhum usuário")) throw new Cancelled(`Nenhum usuário com o e-mail ${email} neste site. Confira o e-mail e rode de novo.`);
    if (isEmptyDeployment(err)) {
      throw new Cancelled(ctx.prod ? 'O site ainda não foi publicado. Para o site do computador, rode de novo e escolha "No site do seu computador".' : "O backend deste projeto está vazio. Rode npx create-rubrica setup.");
    }
    if (isMissingFunction(err)) throw new Cancelled("O backend deste site não tem a troca de senha pelo terminal. Atualize com npx create-rubrica update e publique de novo.");
    throw new Error(`Não deu para trocar a senha:\n${output}`);
  }
  const url = ctx.prod ? (state.producao?.siteUrl ?? state.identidade.url) : "http://localhost:4321";
  log.info("Se o login estava bloqueado por tentativas erradas, ele também foi liberado.");
  outro(`Senha trocada!\n\n  Entre em ${url.replace(/\/+$/, "")}/admin\n  com ${email}`);
}
