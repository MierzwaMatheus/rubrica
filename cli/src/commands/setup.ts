import { outro, text, password, confirm, spinner, isCancel, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import * as nodeCrypto from "node:crypto";
import { execFileSync as defaultExecFileSync } from "node:child_process";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { generateJwtKeys as defaultGenerateJwtKeys } from "../utils/generateJwtKeys.js";
import { readState as defaultReadState } from "../state/readState.js";
import { normalizeUrl, validateUrl, normalizeEmail, validateEmail } from "../utils/normalize.js";

// ---- Tipos ------------------------------------------------------------------

export interface FsModule {
  access: (path: string) => Promise<void>;
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface RunSetupDeps {
  cwd?: string;
  fs?: FsModule;
  detectProject?: typeof defaultDetectProject;
  generateJwtKeys?: typeof defaultGenerateJwtKeys;
  readState?: typeof defaultReadState;
  randomBytes?: (size: number) => Buffer;
  execSync?: (cmd: string, opts?: object) => Buffer; // mantido para compatibilidade com testes existentes
  execFileSync?: (file: string, args: string[], opts?: object) => Buffer;
  /** Última linha do resumo final. O create passa `cd <projeto> && <pm> run dev`. */
  nextStep?: string;
}

// ---- Helpers ----------------------------------------------------------------

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// ---- Comando runSetup -------------------------------------------------------

export async function runSetup(deps: RunSetupDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? {
    access: (p: string) => nodeFsPromises.access(p).then(() => undefined),
    readFile: (p: string, enc: string) =>
      nodeFsPromises.readFile(p, enc as BufferEncoding) as Promise<string>,
    writeFile: (p: string, data: string) =>
      nodeFsPromises.writeFile(p, data).then(() => undefined),
    mkdir: (p: string, opts: { recursive: boolean }) =>
      nodeFsPromises.mkdir(p, opts).then(() => undefined),
  };
  const detectProject = deps.detectProject ?? defaultDetectProject;
  const generateJwtKeys = deps.generateJwtKeys ?? defaultGenerateJwtKeys;
  const readState = deps.readState ?? defaultReadState;
  const randomBytes = deps.randomBytes ?? ((size: number) => nodeCrypto.randomBytes(size));
  const execFileSync = deps.execFileSync ?? ((file: string, args: string[], opts?: object) =>
    defaultExecFileSync(file, args, opts as Parameters<typeof defaultExecFileSync>[2]) as Buffer
  );

  // 1. Detectar projeto Rubrica
  try {
    await detectProject(cwd);
  } catch (err) {
    cancel((err as Error).message);
    return;
  }

  // Todo comando do Convex roda na pasta do projeto: o create chama o setup de fora dela.
  const convex = (...args: string[]) => execFileSync("npx", ["convex", ...args], { stdio: "pipe", cwd });
  const setEnv = (key: string, value: string) => convex("env", "set", "--", key, value);

  // 2. Ler .env.local. Sem ele, o projeto ainda não foi ligado ao Convex: conecta agora
  // (login e criação do projeto pelo navegador) em vez de mandar abrir outro terminal.
  const envPath = path.join(cwd, ".env.local");
  const readEnv = async () => parseEnvFile(await fs.readFile(envPath, "utf-8"));
  let envVars: Record<string, string> = {};
  try {
    envVars = await readEnv();
  } catch {
    log.info("Conectando o projeto ao Convex (o backend do site). Se pedir, faça login no navegador.");
    try {
      execFileSync("npx", ["convex", "dev", "--once"], { stdio: "inherit", cwd });
      envVars = await readEnv();
    } catch {
      cancel(
        "Não deu para conectar ao Convex. Rode npx convex dev nesta pasta, espere terminar e rode o setup de novo."
      );
      return;
    }
  }

  // 3. Validar vars obrigatórias
  if (!envVars["VITE_CONVEX_URL"]) {
    cancel(
      "VITE_CONVEX_URL não encontrado no .env.local. Rode npx convex dev primeiro."
    );
    return;
  }
  if (!envVars["VITE_CONVEX_SITE_URL"]) {
    cancel(
      "VITE_CONVEX_SITE_URL não encontrado no .env.local. Rode npx convex dev primeiro."
    );
    return;
  }

  // Endereço HTTP do Convex (webhooks), não o do site.
  const convexSiteUrl = envVars["VITE_CONVEX_SITE_URL"];

  // O rubrica.json traz o que o create já perguntou: nada disso é perguntado de novo.
  const state = await readState(cwd, fs);
  const plugins = state.plugins;
  const identity = (state.identity ?? {}) as Partial<Record<string, string>>;

  // 4. Gerar JWT keys
  const s = spinner();
  s.start("Gerando chaves JWT (RS256)...");
  const { JWT_PRIVATE_KEY, JWKS } = await generateJwtKeys();
  s.stop("Chaves JWT geradas.");

  // 5. Setar JWT_PRIVATE_KEY e JWKS no Convex
  setEnv("JWT_PRIVATE_KEY", JWT_PRIVATE_KEY);
  setEnv("JWKS", JWKS);

  // 6. SITE_URL: o endereço do create; só pergunta se ele não estiver salvo.
  let siteUrl = normalizeUrl(identity.siteUrl ?? "");
  if (siteUrl) {
    log.info(`Endereço do site: ${siteUrl} (para mudar: npx create-rubrica config)`);
  } else {
    const answer = await text({
      message: "Endereço do site (ex: meusite.com — não precisa do https://)",
      initialValue: "",
      validate: validateUrl,
    });
    if (isCancel(answer)) {
      cancel("Setup cancelado.");
      return;
    }
    siteUrl = normalizeUrl(answer as string);
  }
  setEnv("SITE_URL", siteUrl);

  /** Pergunta opcional: grava a variável só se a pessoa digitou algo. */
  const optional = async (message: string, key: string) => {
    const value = await text({ message, initialValue: "" });
    if (!isCancel(value) && value && (value as string).trim()) setEnv(key, (value as string).trim());
  };
  const wants = async (message: string) => (await confirm({ message, initialValue: false })) === true;

  // 8. Telegram (contact-wizard ou testimonials-intake)
  if (plugins["contact-wizard"] || plugins["testimonials-intake"]) {
    if (await wants("Quer receber um aviso no Telegram a cada novo contato ou depoimento? (dá para configurar depois)")) {
      await optional("Token do bot do Telegram (quem cria é o @BotFather; Enter para pular):", "TELEGRAM_BOT_TOKEN");
      await optional("Id da conversa que recebe os avisos (Enter para pular):", "TELEGRAM_ADMIN_CHAT_ID");
    }
  }

  // 9. Playground — gerar PLAYGROUND_KEY_PEPPER silenciosamente
  if (plugins["playground"]) {
    const pepper = randomBytes(32).toString("hex");
    setEnv("PLAYGROUND_KEY_PEPPER", pepper);
  }

  // 10. AI (ai-resumes, i18n ou playground)
  if (plugins["ai-resumes"] || plugins["i18n"] || plugins["playground"]) {
    await optional("Chave do OpenRouter, usada nos recursos de IA (openrouter.ai/keys; Enter para pular):", "OPENROUTER_API_KEY");
  }

  // 11. Payments (Asaas: PIX, boleto e cartão)
  if (plugins["payments"]) {
    const asaasKey = await text({
      message: "Chave da API do Asaas, de testes ou de produção (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(asaasKey) && asaasKey && (asaasKey as string).trim()) {
      const key = (asaasKey as string).trim();
      setEnv("ASAAS_API_KEY", key);

      // Token que o Asaas manda em cada webhook; o Convex recusa chamadas sem ele.
      const webhookToken = randomBytes(32).toString("hex");
      setEnv("ASAAS_WEBHOOK_TOKEN", webhookToken);

      const env = key.startsWith("$aact_prod_") ? "produção" : "sandbox (testes)";
      log.info(
        `Asaas configurado em ${env}. Falta cadastrar o webhook no painel do Asaas\n` +
        `(Integrações → Webhooks → Adicionar), com os eventos de cobrança ligados:\n\n` +
        `  URL:   ${convexSiteUrl.replace(/\/+$/, "")}/webhooks/asaas\n` +
        `  Token: ${webhookToken}\n\n` +
        `Sem o webhook, os pagamentos nunca aparecem como pagos.`
      );
    }
  }

  // 12. Prompts de admin (email + senha)
  const adminEmailAnswer = await text({
    message: "E-mail para entrar no painel admin:",
    initialValue: normalizeEmail(identity.authorEmail ?? ""),
    validate: validateEmail,
  });
  if (isCancel(adminEmailAnswer)) {
    cancel("Setup cancelado.");
    return;
  }
  const adminEmail = normalizeEmail(adminEmailAnswer as string);

  const adminPassword = await password({
    message: "Senha do painel admin (mínimo 12 caracteres):",
    validate: (v) => {
      if (v.length < 12) return "Senha deve ter pelo menos 12 caracteres";
    },
  });
  if (isCancel(adminPassword)) {
    cancel("Setup cancelado.");
    return;
  }

  const adminPasswordConfirm = await password({
    message: "Confirme a senha:",
    validate: (v) => {
      if (v !== adminPassword) return "As senhas não coincidem";
    },
  });
  if (isCancel(adminPasswordConfirm)) {
    cancel("Setup cancelado.");
    return;
  }

  try {
    execFileSync(
      "npx",
      ["convex", "run", "seed:setupAdmin", JSON.stringify({ email: adminEmail, password: adminPassword as string })],
      { stdio: "pipe", cwd }
    );
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const output = e.stdout?.toString() || e.stderr?.toString() || e.message || "";
    if (output.includes("Root user already exists")) {
      log.warn("Admin já configurado — credenciais mantidas. Para redefinir, acesse o Convex Dashboard.");
    } else {
      cancel(`Erro ao criar usuário root: ${output || String(err)}`);
      return;
    }
  }

  // Seed orquestrado: seedSiteConfig + (proposals → seedDefaultTemplate) + (i18n → siteTexts:seed)
  const enabledPlugins = Object.entries(plugins)
    .filter(([, on]) => on)
    .map(([id]) => id);
  try {
    execFileSync(
      "npx",
      ["convex", "run", "seed:seedAll", JSON.stringify({ enabledPlugins })],
      { stdio: "pipe", cwd }
    );
  } catch (err: unknown) {
    const output =
      (err as { stdout?: Buffer }).stdout?.toString() ||
      (err as { stderr?: Buffer }).stderr?.toString() ||
      (err as Error).message;
    log.warn(`seedAll falhou: ${output.trim() || "erro desconhecido"} — rode 'npx convex run seed:seedAll \"{...}\"' manualmente depois.`);
  }

  // Seed de identidade no Convex (siteConfig + contactInfo) a partir do rubrica.json
  if (identity.siteName) {
    try {
      execFileSync(
        "npx",
        ["convex", "run", "siteConfig:setBatchInternal", JSON.stringify({
          items: [
            { key: "site_title", value: identity.siteName },
            { key: "site_name", value: identity.siteName },
            { key: "site_url", value: siteUrl },
            { key: "site_description", value: identity.siteDescription || "" },
            { key: "author_name", value: identity.authorName || "" },
            { key: "author_email", value: identity.authorEmail || "" },
            { key: "twitter_handle", value: identity.twitterHandle || "" },
            { key: "lang", value: identity.lang || "pt-BR" },
          ],
        })],
        { stdio: "pipe", cwd }
      );
    } catch {
      // não crítico — configurável pelo admin
    }

    if (identity.authorName) {
      try {
        execFileSync(
          "npx",
          ["convex", "run", "contactInfo:updateInternal", JSON.stringify({
            name: identity.authorName,
            email: identity.authorEmail || "",
            showEmail: false,
          })],
          { stdio: "pipe", cwd }
        );
      } catch {
        // não crítico
      }
    }
  }

  // 13. Vercel — sempre presentes (opcionais)
  if (await wants("O site vai ficar na Vercel e você quer o botão de publicar no painel? (dá para configurar depois)")) {
    await optional("Link do Deploy Hook da Vercel (Settings → Git → Deploy Hooks; Enter para pular):", "VERCEL_DEPLOY_HOOK_URL");
    await optional("Segredo do webhook da Vercel (Enter para pular):", "VERCEL_WEBHOOK_SECRET");
  }

  // 14. Personalização: a profissão aparece abaixo do nome no site; as especialidades
  // entram no contexto que a IA usa para escrever propostas.
  const profession = await text({
    message: "Qual é a sua profissão ou área de atuação? (aparece abaixo do seu nome no site; Enter para pular)",
    placeholder: "Ex: Designer UX, Fotógrafa, Advogada, Engenheira Civil...",
    initialValue: "",
  });

  const specialties = await text({
    message: "Quais são suas principais especialidades? (separadas por vírgula; a IA usa nas propostas; Enter para pular)",
    placeholder: "Ex: Branding, Motion Design, Fotografia de Produto",
    initialValue: "",
  });

  const professionStr = isCancel(profession) ? "" : ((profession as string) || "").trim();
  const specialtiesStr = isCancel(specialties) ? "" : ((specialties as string) || "").trim();

  if (professionStr) {
    const name = identity.authorName || adminEmail.split("@")[0];
    const aiContext = specialtiesStr
      ? `${name} é ${professionStr} com especialidade em ${specialtiesStr}. Entrega projetos com qualidade e comprometimento.`
      : `${name} é ${professionStr}. Entrega projetos com qualidade e comprometimento.`;

    try {
      execFileSync(
        "npx",
        [
          "convex",
          "run",
          "contactInfo:updateInternal",
          JSON.stringify({ role: professionStr, roleTranslations: { ptBR: professionStr }, proposalAiContext: aiContext }),
        ],
        { stdio: "pipe", cwd }
      );
    } catch {
      // não crítico: dá para editar no painel
    }
  }

  outro(
    `Pronto!\n\n  Admin: ${adminEmail}\n  O painel fica em /login\n\n  Para abrir o site:\n  ${deps.nextStep ?? "pnpm dev"}`
  );
}
