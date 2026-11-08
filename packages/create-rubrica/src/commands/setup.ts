/**
 * `setup` (interativo, a pessoa roda): liga o projeto ao Convex de desenvolvimento,
 * grava as variáveis de ambiente, cria o root (a senha é digitada aqui e nunca passa
 * pelo agente), monta o conteúdo inicial pela receita do tema e liga as integrações.
 *
 * Tolerante a backend incompleto: se o núcleo instalado ainda não tem uma função (um
 * módulo em construção), o passo vira aviso e o resto segue.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as nodeCrypto from "node:crypto";
import { convexEnvGet, convexEnvSet, convexRun, deploymentLabel, isMissingFunction, type ConvexContext } from "../utils/convex.js";
import { readEnvLocal } from "../utils/env.js";
import { errorOutput, run as defaultRun, tail, type Runner } from "../utils/exec.js";
import { generateJwtKeys } from "../utils/generateJwtKeys.js";
import { normalizeEmail, validateEmail } from "../utils/normalize.js";
import { validatePassword } from "../utils/password.js";
import { loadThemeRecipe } from "../project/introspect.js";
import { findProjectDir, readState, settingsFromState, type RubricaState } from "../state.js";
import { themePackage } from "../themes.js";
import { ask, askSecret, Cancelled, confirm, log, note, outro, spinner } from "../ui.js";
import { track } from "../telemetry.js";
import { runScript } from "../utils/packageManager.js";
import { projectPackageManager } from "../utils/fs.js";

export interface SeedStatus {
  configured: boolean;
  pages: number;
  hasRoot: boolean;
}

/**
 * Integrações e as variáveis do Convex de cada uma: os nomes que o núcleo lê, os mesmos
 * de `docs/v2/variaveis.md` (um teste confere). Ficam num lugar só: o setup pergunta, o
 * publicar copia para a produção.
 */
export const INTEGRATIONS = [
  {
    id: "telegram",
    label: "Aviso no Telegram (contatos, depoimentos, propostas aceitas e pagamentos)",
    when: (p: Record<string, boolean>) => p["contact-wizard"] !== false || p["testimonials-intake"] === true || p.proposals === true || p.payments === true,
    vars: [
      { key: "TELEGRAM_BOT_TOKEN", prompt: "Token do bot do Telegram (quem cria é o @BotFather):", secret: true },
      // O núcleo aceita também TELEGRAM_ADMIN_CHAT_ID, o nome da v1.
      { key: "TELEGRAM_CHAT_ID", prompt: "Id da conversa que recebe os avisos:" },
    ],
  },
  {
    id: "email",
    label: "Contatos também por e-mail (Resend)",
    when: (p: Record<string, boolean>) => p["contact-wizard"] !== false,
    vars: [
      { key: "RESEND_API_KEY", prompt: "Chave da API do Resend (resend.com/api-keys):", secret: true },
      { key: "RUBRICA_EMAIL_FROM", prompt: "Remetente dos e-mails (ex.: Site <contato@meusite.com>, de um domínio verificado no Resend):" },
    ],
  },
  {
    id: "openrouter",
    label: "Recursos de IA: tradução e currículo por vaga (OpenRouter)",
    when: (p: Record<string, boolean>) => p.translation === true || p["ai-resumes"] === true,
    vars: [{ key: "OPENROUTER_API_KEY", prompt: "Chave do OpenRouter (openrouter.ai/keys):", secret: true }],
  },
  {
    id: "asaas",
    label: "Pagamentos por PIX, boleto e cartão (Asaas)",
    when: (p: Record<string, boolean>) => p.payments === true,
    vars: [{ key: "ASAAS_API_KEY", prompt: "Chave da API do Asaas, de testes ou de produção:", secret: true }],
  },
  {
    id: "deploy-hook",
    label: "Botão Publicar do painel (deploy hook da hospedagem)",
    when: () => true,
    vars: [{ key: "RUBRICA_DEPLOY_HOOK_URL", prompt: "URL do deploy hook (Vercel: Settings → Git → Deploy Hooks; Netlify/Cloudflare: Build hooks):" }],
  },
] as const;

/** Variáveis das integrações que valem igual no computador e na produção. */
export const COPIED_TO_PRODUCTION = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "RESEND_API_KEY", "RUBRICA_EMAIL_FROM", "OPENROUTER_API_KEY"];

/** Variáveis que o setup grava sozinho em todo deployment (`ensureBaseEnv`) e as do Asaas que ele gera. */
export const BASE_ENV = ["SITE_URL", "RUBRICA_IP_SALT", "RUBRICA_DEPLOY_CALLBACK_SECRET", "RUBRICA_ALLOW_LOCALHOST", "ASAAS_WEBHOOK_TOKEN"] as const;

/** Rota do webhook do Asaas no Convex (`packages/core/src/convex/commerce/http.ts`), sob o endereço `.convex.site`. */
export const ASAAS_WEBHOOK_PATH = "/webhooks/asaas";

export interface SetupDeps {
  cwd: string;
  runner?: Runner;
  /** Projeto recém-criado: cria o projeto do Convex com este nome, sem as perguntas. */
  newProject?: string;
  randomBytes?: (n: number) => Buffer;
  generateKeys?: typeof generateJwtKeys;
  loadRecipe?: typeof loadThemeRecipe;
}

/** Grava as chaves do login só se ainda não existem (gerar de novo derruba todas as sessões). */
export async function ensureAuthKeys(ctx: ConvexContext, generate = generateJwtKeys): Promise<boolean> {
  if (convexEnvGet(ctx, "JWKS") && convexEnvGet(ctx, "JWT_PRIVATE_KEY")) return false;
  const { JWT_PRIVATE_KEY, JWKS } = await generate();
  convexEnvSet(ctx, "JWT_PRIVATE_KEY", JWT_PRIVATE_KEY);
  convexEnvSet(ctx, "JWKS", JWKS);
  return true;
}

/** Variáveis que o núcleo precisa em todo deployment (as que não são integração). */
export function ensureBaseEnv(ctx: ConvexContext, state: RubricaState, randomBytes: (n: number) => Buffer, dev: boolean): void {
  convexEnvSet(ctx, "SITE_URL", state.identidade.url);
  if (!convexEnvGet(ctx, "RUBRICA_IP_SALT")) convexEnvSet(ctx, "RUBRICA_IP_SALT", randomBytes(32).toString("hex"));
  if (!convexEnvGet(ctx, "RUBRICA_DEPLOY_CALLBACK_SECRET")) convexEnvSet(ctx, "RUBRICA_DEPLOY_CALLBACK_SECRET", randomBytes(32).toString("hex"));
  // No computador, os formulários do site (localhost) podem enviar para o Convex.
  if (dev) convexEnvSet(ctx, "RUBRICA_ALLOW_LOCALHOST", "true");
}

export function seedStatus(ctx: ConvexContext): SeedStatus | null {
  try {
    return convexRun<SeedStatus>(ctx, "rubrica/seed:status");
  } catch (err) {
    if (isMissingFunction(err)) return null;
    throw err;
  }
}

/** Configurações + páginas pela receita do tema (ou do núcleo). */
export async function applySeed(ctx: ConvexContext, state: RubricaState, loadRecipe = loadThemeRecipe): Promise<{ pagesCreated: number } | null> {
  let recipe = null;
  try {
    recipe = await loadRecipe(ctx.projectDir, themePackage(state.tema), state.tipo);
  } catch {
    recipe = null; // sem receita do tema: o seed usa a do núcleo
  }
  try {
    return convexRun<{ pagesCreated: number }>(ctx, "rubrica/seed:apply", { settings: settingsFromState(state), ...(recipe && { recipe }) });
  } catch (err) {
    if (isMissingFunction(err)) return null;
    throw err;
  }
}

/** Pergunta e-mail e senha e cria o primeiro root. Devolve o e-mail. */
export async function createRoot(ctx: ConvexContext, state: RubricaState, label = ""): Promise<string> {
  const email = normalizeEmail(await ask(`E-mail para entrar no painel${label ? ` ${label}` : ""}:`, { initial: state.identidade.email ?? "", validate: validateEmail }));
  const password = await askSecret("Senha (12 ou mais caracteres, com maiúscula, minúscula e número):", validatePassword);
  await askSecret("Repita a senha:", (v) => (v !== password ? "As senhas não coincidem" : undefined));
  convexRun(ctx, "rubrica/users:setupRoot", { email, password, ...(state.identidade.autor && { name: state.identidade.autor }) });
  return email;
}

export async function runSetup(deps: SetupDeps): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const projectDir = findProjectDir(deps.cwd);
  const state = readState(projectDir);
  const randomBytes = deps.randomBytes ?? ((n: number) => nodeCrypto.randomBytes(n));

  // 1. Convex de desenvolvimento.
  if (!readEnvLocal(projectDir).CONVEX_DEPLOYMENT) {
    log.info("Ligando o projeto ao Convex (o backend). Se pedir, faça login no navegador.");
    const args = ["convex", "dev", "--once"];
    if (state.producao?.convexUrl && !deps.newProject) {
      log.info("Este site já está publicado: na pergunta do Convex, escolha o projeto onde ele está (o mesmo time e projeto de quem publicou).");
      args.push("--configure", "existing");
    } else if (deps.newProject) {
      args.push("--configure", "new", "--project", deps.newProject, "--dev-deployment", "cloud");
      const convexJson = join(projectDir, "convex.json");
      if (!existsSync(convexJson)) writeFileSync(convexJson, `${JSON.stringify({ aiFiles: { enabled: false } }, null, 2)}\n`);
    }
    try {
      runner("npx", args, { cwd: projectDir, stdio: "inherit" });
    } catch {
      throw new Cancelled("Não deu para ligar ao Convex. Quando quiser tentar de novo, rode npx create-rubrica setup nesta pasta.");
    }
  } else {
    // Publica as funções atuais antes de chamar qualquer uma.
    const s = spinner();
    s.start("Enviando o backend para o Convex de desenvolvimento...");
    try {
      runner("npx", ["convex", "dev", "--once"], { cwd: projectDir });
      s.stop("Backend enviado.");
    } catch (err) {
      s.stop("O envio falhou.");
      throw new Error(`O Convex recusou o backend:\n${tail(errorOutput(err))}`);
    }
  }
  const ctx: ConvexContext = { projectDir, runner };
  log.info(`Convex: ${deploymentLabel(ctx)}`);

  // 2. Variáveis.
  const newKeys = await ensureAuthKeys(ctx, deps.generateKeys);
  ensureBaseEnv(ctx, state, randomBytes, true);
  if (!newKeys) log.info("As chaves do login já existiam: quem estava logado continua logado.");

  // 3. Root.
  const status = seedStatus(ctx);
  if (!status) log.warn("O backend instalado ainda não tem rubrica/seed (núcleo antigo?). Atualize com npx create-rubrica update e rode o setup de novo.");
  let adminEmail = "";
  if (status?.hasRoot) {
    log.info("O painel já tem um root; o login continua o mesmo. Para trocar a senha: npx create-rubrica senha");
  } else if (status) {
    try {
      adminEmail = await createRoot(ctx, state);
    } catch (err) {
      if (err instanceof Cancelled) throw err;
      if (/Já existe um usuário root/.test(errorOutput(err))) log.warn("O painel já tinha um root; o login continua o mesmo.");
      else throw new Error(`Não deu para criar o root:\n${tail(errorOutput(err))}`);
    }
  }

  // 4. Conteúdo inicial.
  if (status && !status.configured) {
    const result = await applySeed(ctx, state, deps.loadRecipe);
    if (result) log.success(`Conteúdo inicial pronto: ${result.pagesCreated} páginas pela receita do tema ${state.tema}.`);
  } else if (status?.configured) {
    log.info(`O site já tinha conteúdo (${status.pages} páginas); nada foi sobrescrito. Para trocar tema, idiomas ou plugins: npx create-rubrica config`);
  }

  // 5. Integrações.
  const enabled = new Set<string>();
  for (const integration of INTEGRATIONS) {
    if (!integration.when(state.plugins)) continue;
    if (integration.vars.every((v) => convexEnvGet(ctx, v.key))) {
      enabled.add(integration.id);
      continue;
    }
    if (!(await confirm(`${integration.label}: configurar agora? (dá para configurar depois)`, false))) continue;
    for (const variable of integration.vars) {
      const value = "secret" in variable && variable.secret ? await askSecret(`${variable.prompt} (Enter para pular)`) : await ask(`${variable.prompt} (Enter para pular)`, { initial: "" });
      if (value.trim()) {
        convexEnvSet(ctx, variable.key, value.trim());
        enabled.add(integration.id);
      }
    }
    if (integration.id === "asaas" && convexEnvGet(ctx, "ASAAS_API_KEY")) {
      const token = convexEnvGet(ctx, "ASAAS_WEBHOOK_TOKEN") || randomBytes(32).toString("hex");
      convexEnvSet(ctx, "ASAAS_WEBHOOK_TOKEN", token);
      const site = readEnvLocal(projectDir).CONVEX_SITE_URL ?? readEnvLocal(projectDir).VITE_CONVEX_SITE_URL ?? "<endereço .convex.site do projeto>";
      note(
        `Falta cadastrar o webhook no painel do Asaas (Integrações → Webhooks), com os eventos de cobrança:\n\n  URL:   ${site.replace(/\/+$/, "")}${ASAAS_WEBHOOK_PATH}\n  Token: ${token}\n\nSem o webhook, os pagamentos nunca aparecem como pagos.`,
        "Asaas",
      );
    }
  }

  await track(projectDir, "setup", { veioDoCreate: deps.newProject !== undefined, rootNovo: adminEmail !== "", integracoes: [...enabled] }, { notice: (m) => log.info(m) });

  outro(
    [
      "Pronto!",
      `  Painel: /admin${adminEmail ? ` (${adminEmail})` : ""}`,
      `  Abrir o site: ${runScript(projectPackageManager(projectDir), "dev")} (e ${runScript(projectPackageManager(projectDir), "dev:convex")} em outro terminal)`,
      "  Colocar no ar (Vercel): npx create-rubrica publicar",
    ].join("\n"),
  );
}
