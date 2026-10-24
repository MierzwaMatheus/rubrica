import { outro, note, text, password, confirm, isCancel, cancel, spinner, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import * as nodeCrypto from "node:crypto";
import { execFileSync as defaultExecFileSync } from "node:child_process";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { generateJwtKeys as defaultGenerateJwtKeys } from "../utils/generateJwtKeys.js";
import { readState as defaultReadState } from "../state/readState.js";
import { normalizeEmail, validateEmail } from "../utils/normalize.js";
import { validatePassword } from "../utils/password.js";
import { seedPayloads } from "../utils/seedPayloads.js";

export interface RunPublishDeps {
  cwd?: string;
  fs?: {
    readFile: (path: string, encoding: string) => Promise<string>;
    writeFile: (path: string, data: string) => Promise<void>;
    access: (path: string) => Promise<void>;
  };
  detectProject?: typeof defaultDetectProject;
  readState?: typeof defaultReadState;
  generateJwtKeys?: typeof defaultGenerateJwtKeys;
  randomBytes?: (size: number) => Buffer;
  execFileSync?: (file: string, args: string[], opts?: { cwd?: string; stdio?: string; env?: Record<string, string | undefined> }) => Buffer;
  /** Ambiente do processo (para testes). `RUBRICA_VERCEL_GLOBAL_CONFIG` escolhe a conta da Vercel. */
  processEnv?: Record<string, string | undefined>;
}

const NOTHING = "Nada foi publicado.";
const DEPLOY_KEY_NAME = "rubrica-vercel";
/** Integrações do ambiente do computador que valem igual na produção. */
const COPIED_ENV = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID", "OPENROUTER_API_KEY"];
const VERCELIGNORE = ".env*\n!.env.example\nnode_modules\n.stryker-tmp\n";

function errorOutput(err: unknown): string {
  const e = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
  return (`${e.stderr?.toString() ?? ""}${e.stdout?.toString() ?? ""}`.trim() || e.message || "").trim();
}

/** Últimas linhas de uma saída longa (build da Vercel, push do Convex). */
const tail = (text: string, lines = 15) => text.split("\n").slice(-lines).join("\n");

/**
 * `npx create-rubrica publicar`: coloca o site no ar na Vercel, com o banco de produção do
 * Convex. Na primeira vez cria tudo (projeto, chave, variáveis, admin, dados iniciais);
 * depois disso, só publica de novo.
 */
export async function runPublish(deps: RunPublishDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? {
    readFile: (p: string, e: string) => nodeFsPromises.readFile(p, e as BufferEncoding),
    writeFile: (p: string, d: string) => nodeFsPromises.writeFile(p, d),
    access: (p: string) => nodeFsPromises.access(p),
  };
  const detectProject = deps.detectProject ?? defaultDetectProject;
  const readState = deps.readState ?? defaultReadState;
  const generateJwtKeys = deps.generateJwtKeys ?? defaultGenerateJwtKeys;
  const randomBytes = deps.randomBytes ?? ((n: number) => nodeCrypto.randomBytes(n));
  const processEnv = deps.processEnv ?? process.env;
  const exec =
    deps.execFileSync ??
    ((file: string, args: string[], opts?: object) =>
      defaultExecFileSync(file, args, opts as Parameters<typeof defaultExecFileSync>[2]) as Buffer);

  const globalConfig = processEnv.RUBRICA_VERCEL_GLOBAL_CONFIG;
  const vercel = (args: string[], stdio: "pipe" | "inherit" = "pipe") =>
    exec("npx", ["--yes", "vercel@latest", ...(globalConfig ? ["--global-config", globalConfig] : []), ...args], { cwd, stdio })
      .toString();
  const convex = (args: string[], env?: Record<string, string>) =>
    exec("npx", ["convex", ...args], { cwd, stdio: "pipe", ...(env && { env: { ...processEnv, ...env } }) }).toString();
  const setProdEnv = (key: string, value: string) => convex(["env", "set", "--prod", "--", key, value]);
  const runProd = (fn: string, args: unknown) => convex(["run", "--prod", fn, JSON.stringify(args)]);
  const exists = (p: string) => fs.access(path.join(cwd, p)).then(() => true, () => false);

  try {
    await detectProject(cwd);
  } catch (err) {
    cancel((err as Error).message);
    return;
  }
  const env = await fs.readFile(path.join(cwd, ".env.local"), "utf-8").catch(() => "");
  if (!/^CONVEX_DEPLOYMENT=/m.test(env)) {
    cancel("Este projeto ainda não está ligado ao Convex. Rode npx create-rubrica setup primeiro.");
    return;
  }
  const state = await readState(cwd, fs as unknown as Parameters<typeof defaultReadState>[1]);
  const identity = (state.identity ?? {}) as Partial<Record<string, string>>;
  const projectName = (JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf-8")) as { name: string }).name;

  /** Endereço .vercel.app que a Vercel reservou para o projeto. */
  const productionUrl = async () => {
    const { projectId } = JSON.parse(await fs.readFile(path.join(cwd, ".vercel", "project.json"), "utf-8")) as { projectId: string };
    try {
      const { domains } = JSON.parse(vercel(["api", `/v9/projects/${projectId}/domains`])) as { domains: Array<{ name: string }> };
      const domain = domains.find((d) => d.name.endsWith(".vercel.app"));
      if (domain) return `https://${domain.name}`;
    } catch {
      // a API é beta; o nome do projeto é o padrão da Vercel
    }
    return `https://${projectName}.vercel.app`;
  };

  const ensureLogin = () => {
    try {
      vercel(["whoami"]);
      return true;
    } catch {
      log.info("Entre na sua conta da Vercel (conta gratuita). O login abre no navegador.");
      try {
        vercel(["login"], "inherit");
        vercel(["whoami"]);
        return true;
      } catch {
        cancel("Não deu para entrar na Vercel. Quando quiser tentar de novo, rode npx create-rubrica publicar.");
        return false;
      }
    }
  };

  const deploy = async (siteUrl: string, s: ReturnType<typeof spinner>) => {
    s.start("Publicando na Vercel (leva uns 2 minutos)...");
    try {
      vercel(["deploy", "--prod", "--yes"]);
    } catch (err) {
      s.stop("A publicação falhou.");
      cancel(`A Vercel não conseguiu publicar:\n${tail(errorOutput(err))}\n\nCorrija e rode de novo: npx create-rubrica publicar`);
      return false;
    }
    s.stop(`No ar: ${siteUrl}`);
    return true;
  };

  // ---- Publicar de novo -------------------------------------------------------
  if (await exists(path.join(".vercel", "project.json"))) {
    const again = await confirm({ message: "Publicar de novo com as mudanças que você fez?", initialValue: true });
    if (again !== true) return void cancel(NOTHING);
    if (!ensureLogin()) return;
    const siteUrl = await productionUrl();
    if (!(await deploy(siteUrl, spinner()))) return;
    outro(`Publicado de novo!\n\n  ${siteUrl}`);
    return;
  }

  // ---- Primeira vez -----------------------------------------------------------
  note(
    [
      "1. Entrar na sua conta da Vercel (navegador, conta gratuita)",
      `2. Criar o projeto ${projectName} na Vercel`,
      "3. Preparar o banco de dados de produção no Convex",
      "4. Criar o admin do site publicado (você escolhe a senha)",
      "5. Publicar",
      "",
      "O que você cadastrou no painel do computador não vai junto: o site publicado",
      "começa com os dados de exemplo, e você edita pelo painel dele.",
    ].join("\n"),
    "Vou colocar o site no ar"
  );
  const go = await confirm({ message: "Publicar agora?", initialValue: true });
  if (go !== true) return void cancel(NOTHING);

  if (!ensureLogin()) return;

  const s = spinner();
  s.start("Criando o projeto na Vercel...");
  try {
    vercel(["link", "--yes", "--project", projectName]);
  } catch (err) {
    s.stop("Não deu para criar o projeto.");
    cancel(`A Vercel recusou criar o projeto:\n${tail(errorOutput(err))}`);
    return;
  }
  const siteUrl = await productionUrl();
  // Sem isso a Vercel enviaria o .env.local (com dados do ambiente do computador).
  if (!(await exists(".vercelignore"))) await fs.writeFile(path.join(cwd, ".vercelignore"), VERCELIGNORE);
  s.stop(`Projeto criado: ${siteUrl}`);

  s.start("Preparando o banco de dados de produção...");
  let deployKey: string;
  try {
    deployKey = convex(["deployment", "token", "create", DEPLOY_KEY_NAME, "--prod"]).trim().split("\n").pop()!.trim();
  } catch (err) {
    s.stop("Não deu para preparar o banco de produção.");
    cancel(`O Convex não criou a chave de produção:\n${tail(errorOutput(err))}`);
    return;
  }
  const prodName = /^prod:([a-z0-9-]+)\|/.exec(deployKey)?.[1];
  if (!prodName) {
    s.stop("Não deu para preparar o banco de produção.");
    cancel("O Convex devolveu uma chave de produção num formato que eu não reconheço. Nada foi publicado.");
    return;
  }
  const convexUrl = `https://${prodName}.convex.cloud`;

  try {
    convex(["deploy"], { CONVEX_DEPLOY_KEY: deployKey });
  } catch (err) {
    s.stop("Não deu para enviar o backend para a produção.");
    cancel(`O Convex recusou o envio:\n${tail(errorOutput(err))}`);
    return;
  }

  const { JWT_PRIVATE_KEY, JWKS } = await generateJwtKeys();
  setProdEnv("JWT_PRIVATE_KEY", JWT_PRIVATE_KEY);
  setProdEnv("JWKS", JWKS);
  setProdEnv("SITE_URL", siteUrl);
  for (const key of COPIED_ENV) {
    let value = "";
    try {
      value = convex(["env", "get", key]).trim();
    } catch {
      // não existe no ambiente do computador
    }
    if (value) setProdEnv(key, value);
  }
  if (state.plugins.playground) setProdEnv("PLAYGROUND_KEY_PEPPER", randomBytes(32).toString("hex"));
  s.stop("Banco de produção pronto.");
  if (state.plugins.payments) {
    log.info("Pagamentos: a chave de produção do Asaas e o webhook são configurados à parte, no painel do Asaas e com npx convex env set --prod.");
  }

  // Admin do site publicado
  let adminEmail = normalizeEmail(identity.authorEmail ?? "");
  const adminExists = convex(["run", "--prod", "users:isSetupRequired"]).trim() === "false";
  if (!adminExists) {
    if (validateEmail(adminEmail)) {
      const answer = await text({ message: "E-mail para entrar no painel do site publicado:", validate: validateEmail });
      if (isCancel(answer)) return void cancel(NOTHING);
      adminEmail = normalizeEmail(answer as string);
    }
    const pw = await password({
      message: "Senha do painel do site publicado (12 ou mais caracteres, com maiúscula, minúscula e número):",
      validate: validatePassword,
    });
    if (isCancel(pw)) return void cancel(NOTHING);
    const again = await password({
      message: "Repita a senha:",
      validate: (v) => (v !== pw ? "As senhas não coincidem" : undefined),
    });
    if (isCancel(again)) return void cancel(NOTHING);
    runProd("seed:setupAdmin", { email: adminEmail, password: pw });
  }

  const seeds = seedPayloads(identity, state.plugins, siteUrl);
  runProd("seed:seedAll", seeds.seedAll);
  if (seeds.siteConfig) runProd("siteConfig:setBatchInternal", seeds.siteConfig);
  if (seeds.contact) {
    // A profissão e o contexto da IA ficaram só no ambiente do computador (o setup gravou lá).
    let fromDev: Record<string, unknown> = {};
    try {
      const dev = JSON.parse(convex(["run", "contactInfo:get"])) as Record<string, unknown> | null;
      if (dev) {
        for (const key of ["role", "roleTranslations", "proposalAiContext"]) {
          if (dev[key] !== undefined) fromDev[key] = dev[key];
        }
      }
    } catch {
      fromDev = {};
    }
    runProd("contactInfo:updateInternal", { ...seeds.contact, ...fromDev });
  }

  // Variáveis que o build da Vercel usa (o build envia o backend com a chave).
  const vercelEnv: Array<[string, string, boolean]> = [
    ["VITE_CONVEX_URL", convexUrl, false],
    ["CONVEX_URL", convexUrl, false],
    ["SITE_URL", siteUrl, false],
    ["CONVEX_DEPLOY_KEY", deployKey, true],
  ];
  for (const [key, value, sensitive] of vercelEnv) {
    vercel(["env", "add", key, "production", "--value", value, "--yes", "--force", ...(sensitive ? ["--sensitive"] : [])]);
  }

  if (!(await deploy(siteUrl, s))) return;

  outro(
    `Seu site está no ar!\n\n` +
      `  ${siteUrl}\n` +
      `  Painel: ${siteUrl}/login${adminEmail ? ` (${adminEmail})` : ""}\n\n` +
      `Mudou alguma coisa no projeto? Publique de novo com: npx create-rubrica publicar\n` +
      `Domínio próprio: na Vercel, em Settings → Domains.`
  );
}
