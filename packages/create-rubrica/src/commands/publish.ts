/**
 * `publicar`: põe o site no ar na Vercel, a hospedagem oficial (decisão 21), com o
 * banco de produção do Convex. Na primeira vez cria tudo (projeto na Vercel, chave de
 * deploy, variáveis, root e conteúdo inicial da produção); depois, só publica de novo.
 *
 * A pessoa roda, a pedido dela: publica em produção. O build da Vercel roda
 * `convex deploy` (vercel.json), que envia o backend junto.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as nodeCrypto from "node:crypto";
import { convexEnvGet, convexEnvSet, type ConvexContext } from "../utils/convex.js";
import { readEnvLocal } from "../utils/env.js";
import { errorOutput, run as defaultRun, tail, type Runner } from "../utils/exec.js";
import { generateJwtKeys } from "../utils/generateJwtKeys.js";
import { findProjectDir, readState, updateState, type RubricaState } from "../state.js";
import { Cancelled, confirm, ask, log, note, outro, spinner } from "../ui.js";
import { track } from "../telemetry.js";
import { applySeed, COPIED_TO_PRODUCTION, createRoot, ensureAuthKeys, ensureBaseEnv, seedStatus } from "./setup.js";

const NOTHING = "Nada foi publicado.";
const DEPLOY_KEY_NAME = "rubrica-vercel";
const VERCELIGNORE = ".env*\n!.env.example\nnode_modules\n.rubrica\n";

export interface PublishDeps {
  cwd: string;
  runner?: Runner;
  env?: Record<string, string | undefined>;
  randomBytes?: (n: number) => Buffer;
  generateKeys?: typeof generateJwtKeys;
}

/** `prod:nome-123|segredo` → endereços do Convex de produção. */
export function productionUrls(deployKey: string): { name: string; convexUrl: string; siteUrl: string } | null {
  const name = /^prod:([a-z0-9-]+)\|/.exec(deployKey.trim())?.[1];
  if (!name) return null;
  return { name, convexUrl: `https://${name}.convex.cloud`, siteUrl: `https://${name}.convex.site` };
}

export async function runPublish(deps: PublishDeps): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const env = deps.env ?? process.env;
  const randomBytes = deps.randomBytes ?? ((n: number) => nodeCrypto.randomBytes(n));
  const projectDir = findProjectDir(deps.cwd);
  const state = readState(projectDir);
  if (!readEnvLocal(projectDir).CONVEX_DEPLOYMENT) throw new Cancelled("Este projeto ainda não está ligado ao Convex. Rode npx create-rubrica setup primeiro.");
  const projectName = (JSON.parse(readFileSync(join(projectDir, "package.json"), "utf-8")) as { name: string }).name;

  const globalConfig = env.RUBRICA_VERCEL_GLOBAL_CONFIG;
  const vercel = (args: string[], stdio: "pipe" | "inherit" = "pipe") =>
    runner("npx", ["--yes", "vercel@latest", ...(globalConfig ? ["--global-config", globalConfig] : []), ...args], { cwd: projectDir, stdio });
  const prod: ConvexContext = { projectDir, prod: true, runner };
  const dev: ConvexContext = { projectDir, runner };

  const ensureLogin = () => {
    try {
      vercel(["whoami"]);
    } catch {
      log.info("Entre na sua conta da Vercel (a conta gratuita serve). O login abre no navegador.");
      try {
        vercel(["login"], "inherit");
      } catch {
        throw new Cancelled("Não deu para entrar na Vercel. Quando quiser tentar de novo, rode npx create-rubrica publicar.");
      }
    }
  };

  const productionUrl = (): string => {
    try {
      const { projectId } = JSON.parse(readFileSync(join(projectDir, ".vercel", "project.json"), "utf-8")) as { projectId: string };
      const { domains } = JSON.parse(vercel(["api", `/v9/projects/${projectId}/domains`])) as { domains: { name: string }[] };
      const custom = domains.find((d) => !d.name.endsWith(".vercel.app")) ?? domains.find((d) => d.name.endsWith(".vercel.app"));
      if (custom) return `https://${custom.name}`;
    } catch {
      // a API é beta: o nome do projeto é o padrão da Vercel
    }
    return `https://${projectName}.vercel.app`;
  };

  const deploy = () => {
    const s = spinner();
    s.start("Publicando na Vercel (leva uns 2 minutos)...");
    try {
      vercel(["deploy", "--prod", "--yes"]);
      s.stop("Publicado.");
    } catch (err) {
      s.stop("A publicação falhou.");
      throw new Error(`A Vercel não conseguiu publicar:\n${tail(errorOutput(err))}\n\nCorrija e rode de novo: npx create-rubrica publicar`);
    }
  };

  /** Integrações ligadas no computador que ainda faltam na produção. */
  const syncIntegrations = () => {
    const copied: string[] = [];
    for (const key of COPIED_TO_PRODUCTION) {
      const value = convexEnvGet(dev, key);
      if (!value || convexEnvGet(prod, key)) continue;
      convexEnvSet(prod, key, value);
      copied.push(key);
    }
    if (copied.length) log.info(`Levei para o site publicado as integrações do computador: ${copied.join(", ")}.`);
  };

  /** Botão Publicar do painel: o deploy hook da Vercel (precisa do projeto ligado a um repositório Git). */
  const configurePublishButton = async () => {
    if (convexEnvGet(prod, "RUBRICA_DEPLOY_HOOK_URL")) return;
    note(
      [
        "O botão Publicar do painel chama um deploy hook da Vercel.",
        "O hook só existe com o projeto ligado a um repositório Git:",
        "Vercel → o projeto → Settings → Git → ligue o repositório,",
        "e em Deploy Hooks crie um hook (nome Rubrica, branch de produção).",
      ].join("\n"),
      "Botão Publicar do painel",
    );
    const hook = await ask("Cole a URL do deploy hook (Enter para pular):", { initial: "" });
    if (!hook) {
      log.info("Sem o hook, o botão Publicar do painel não funciona. Para configurar depois, rode npx create-rubrica publicar de novo.");
      return;
    }
    if (!/^https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\//.test(hook)) log.warn("Essa URL não parece um deploy hook da Vercel; gravei mesmo assim.");
    convexEnvSet(prod, "RUBRICA_DEPLOY_HOOK_URL", hook);
    log.success("Botão Publicar do painel configurado.");
  };

  // ── Publicar de novo ───────────────────────────────────────────────────────
  if (existsSync(join(projectDir, ".vercel", "project.json"))) {
    if (!(await confirm("Publicar de novo com as mudanças que você fez?", true))) throw new Cancelled(NOTHING);
    ensureLogin();
    syncIntegrations();
    await configurePublishButton();
    deploy();
    const siteUrl = productionUrl();
    await track(projectDir, "publicacao", { caminho: "denovo" });
    outro(`Publicado de novo!\n\n  ${siteUrl}`);
    return;
  }

  // ── Primeira vez ────────────────────────────────────────────────────────────
  if (state.producao?.convexUrl) {
    throw new Cancelled(
      `O rubrica.json diz que o site já está publicado, com o banco ${state.producao.convexUrl}, mas este computador não está ligado ao projeto da Vercel. ` +
        `Ligue com npx vercel link --project ${projectName} e rode o publicar de novo. ${NOTHING}`,
    );
  }
  note(
    [
      "1. Entrar na sua conta da Vercel (navegador)",
      `2. Criar o projeto ${projectName} na Vercel`,
      "3. Preparar o banco de PRODUÇÃO no Convex (backend, chaves e variáveis)",
      "4. Criar o root do site publicado (você escolhe a senha)",
      "5. Montar o conteúdo inicial da produção pela receita do tema",
      "6. Publicar",
      "",
      "O conteúdo do painel do computador não vai junto: a produção começa com as páginas iniciais.",
    ].join("\n"),
    "Vou colocar o site no ar",
  );
  if (!(await confirm("Publicar agora? (grava no Convex de PRODUÇÃO)", true))) throw new Cancelled(NOTHING);
  ensureLogin();

  const s = spinner();
  s.start("Criando o projeto na Vercel...");
  try {
    vercel(["link", "--yes", "--project", projectName]);
  } catch (err) {
    s.stop("Não deu para criar o projeto.");
    throw new Error(`A Vercel recusou criar o projeto:\n${tail(errorOutput(err))}`);
  }
  if (!existsSync(join(projectDir, ".vercelignore"))) writeFileSync(join(projectDir, ".vercelignore"), VERCELIGNORE);
  const siteUrl = productionUrl();
  s.stop(`Projeto criado: ${siteUrl}`);

  s.start("Preparando o banco de produção...");
  let deployKey: string;
  try {
    deployKey = runner("npx", ["convex", "deployment", "token", "create", DEPLOY_KEY_NAME, "--prod"], { cwd: projectDir }).trim().split("\n").pop()!.trim();
  } catch (err) {
    s.stop("Não deu para preparar o banco de produção.");
    throw new Error(`O Convex não criou a chave de produção:\n${tail(errorOutput(err))}`);
  }
  const urls = productionUrls(deployKey);
  if (!urls) {
    s.stop("Não deu para preparar o banco de produção.");
    throw new Error(`O Convex devolveu uma chave de produção num formato desconhecido. ${NOTHING}`);
  }
  try {
    runner("npx", ["convex", "deploy", "--yes"], { cwd: projectDir, env: { CONVEX_DEPLOY_KEY: deployKey } });
  } catch (err) {
    s.stop("Não deu para enviar o backend para a produção.");
    throw new Error(`O Convex recusou o envio:\n${tail(errorOutput(err))}`);
  }
  const prodState: RubricaState = { ...state, identidade: { ...state.identidade, url: state.identidade.url || siteUrl } };
  await ensureAuthKeys(prod, deps.generateKeys);
  ensureBaseEnv(prod, prodState, randomBytes, false);
  syncIntegrations();
  s.stop(`Banco de produção pronto (${urls.name}).`);

  const status = seedStatus(prod);
  let adminEmail = "";
  if (status && !status.hasRoot) adminEmail = await createRoot(prod, state, "do site publicado");
  if (status && !status.configured) {
    const seeded = await applySeed(prod, prodState);
    if (seeded) log.success(`Conteúdo inicial da produção: ${seeded.pagesCreated} páginas.`);
  }

  // Variáveis do build da Vercel. O `convex deploy` do build usa a chave e passa o CONVEX_URL.
  const vercelEnv: [string, string, boolean][] = [
    ["CONVEX_DEPLOY_KEY", deployKey, true],
    ["CONVEX_URL", urls.convexUrl, false],
    ["SITE_URL", prodState.identidade.url, false],
  ];
  for (const [key, value, sensitive] of vercelEnv) {
    vercel(["env", "add", key, "production", "--value", value, "--yes", "--force", ...(sensitive ? ["--sensitive"] : [])]);
  }
  updateState(projectDir, { producao: { convexUrl: urls.convexUrl, siteUrl } });
  await configurePublishButton();
  deploy();
  await track(projectDir, "publicacao", { caminho: "primeira" });
  outro(
    [
      "Seu site está no ar!",
      `  ${siteUrl}`,
      `  Painel: ${siteUrl}/admin${adminEmail ? ` (${adminEmail})` : ""}`,
      "",
      "Mudou o código? Publique de novo com npx create-rubrica publicar.",
      "Domínio próprio: na Vercel, em Settings → Domains (e depois mude a URL com npx create-rubrica config).",
    ].join("\n"),
  );
}
