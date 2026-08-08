import { outro, text, password, spinner, isCancel, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import * as nodeCrypto from "node:crypto";
import { execFileSync as defaultExecFileSync } from "node:child_process";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { generateJwtKeys as defaultGenerateJwtKeys } from "../utils/generateJwtKeys.js";
import { readState as defaultReadState } from "../state/readState.js";

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

  // 2. Ler .env.local
  const envPath = path.join(cwd, ".env.local");
  let envVars: Record<string, string> = {};
  try {
    const envContent = await fs.readFile(envPath, "utf-8");
    envVars = parseEnvFile(envContent);
  } catch {
    cancel(
      "Arquivo .env.local não encontrado. Rode npx convex dev primeiro para criá-lo."
    );
    return;
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

  const siteUrlDefault = envVars["VITE_CONVEX_SITE_URL"];

  // 4. Gerar JWT keys
  const s = spinner();
  s.start("Gerando chaves JWT (RS256)...");
  const { JWT_PRIVATE_KEY, JWKS } = await generateJwtKeys();
  s.stop("Chaves JWT geradas.");

  // 5. Setar JWT_PRIVATE_KEY e JWKS no Convex
  execFileSync("npx", ["convex", "env", "set", "--", "JWT_PRIVATE_KEY", JWT_PRIVATE_KEY], {
    stdio: "pipe",
  });
  execFileSync("npx", ["convex", "env", "set", "--", "JWKS", JWKS], {
    stdio: "pipe",
  });

  // 6. Prompt e set de SITE_URL
  const siteUrl = await text({
    message: "URL pública do site (SITE_URL no Convex):",
    initialValue: siteUrlDefault,
    validate: (v) => {
      if (!v || (!v.startsWith("http://") && !v.startsWith("https://")))
        return "URL deve começar com http:// ou https://";
    },
  });

  if (isCancel(siteUrl)) {
    cancel("Setup cancelado.");
    return;
  }

  execFileSync("npx", ["convex", "env", "set", "--", "SITE_URL", siteUrl as string], {
    stdio: "pipe",
  });

  // 7. Ler rubrica.json para vars condicionais por plugin
  const state = await readState(cwd, fs);
  const plugins = state.plugins;

  // 8. Telegram (contact-wizard ou testimonials-intake)
  if (plugins["contact-wizard"] || plugins["testimonials-intake"]) {
    const telegramToken = await text({
      message: "TELEGRAM_BOT_TOKEN (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(telegramToken) && telegramToken && (telegramToken as string).trim()) {
      execFileSync("npx", ["convex", "env", "set", "--", "TELEGRAM_BOT_TOKEN", telegramToken as string], { stdio: "pipe" });
    }

    const telegramChatId = await text({
      message: "TELEGRAM_ADMIN_CHAT_ID (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(telegramChatId) && telegramChatId && (telegramChatId as string).trim()) {
      execFileSync("npx", ["convex", "env", "set", "--", "TELEGRAM_ADMIN_CHAT_ID", telegramChatId as string], { stdio: "pipe" });
    }
  }

  // 9. Playground — gerar PLAYGROUND_KEY_PEPPER silenciosamente
  if (plugins["playground"]) {
    const pepper = randomBytes(32).toString("hex");
    execFileSync("npx", ["convex", "env", "set", "--", "PLAYGROUND_KEY_PEPPER", pepper], { stdio: "pipe" });
  }

  // 10. AI (ai-resumes, i18n ou playground)
  if (plugins["ai-resumes"] || plugins["i18n"] || plugins["playground"]) {
    const openrouterKey = await text({
      message: "OPENROUTER_API_KEY (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(openrouterKey) && openrouterKey && (openrouterKey as string).trim()) {
      execFileSync("npx", ["convex", "env", "set", "--", "OPENROUTER_API_KEY", openrouterKey as string], { stdio: "pipe" });
    }
  }

  // 11. Payments
  if (plugins["payments"]) {
    const stripeSecret = await text({
      message: "STRIPE_WEBHOOK_SECRET (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(stripeSecret) && stripeSecret && (stripeSecret as string).trim()) {
      execFileSync("npx", ["convex", "env", "set", "--", "STRIPE_WEBHOOK_SECRET", stripeSecret as string], { stdio: "pipe" });
    }

    const asaasToken = await text({
      message: "ASAAS_WEBHOOK_TOKEN (Enter para pular):",
      initialValue: "",
    });
    if (!isCancel(asaasToken) && asaasToken && (asaasToken as string).trim()) {
      execFileSync("npx", ["convex", "env", "set", "--", "ASAAS_WEBHOOK_TOKEN", asaasToken as string], { stdio: "pipe" });
    }
  }

  // 12. Prompts de admin (email + senha)
  const adminEmail = await text({
    message: "Email do usuário root:",
    validate: (v) => {
      if (!v.includes("@") || !v.includes("."))
        return "Email inválido — deve conter @ e pelo menos um ponto";
    },
  });
  if (isCancel(adminEmail)) {
    cancel("Setup cancelado.");
    return;
  }

  const adminPassword = await password({
    message: "Senha do usuário root (mínimo 12 caracteres):",
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
      ["convex", "run", "seed:setupAdmin", JSON.stringify({ email: adminEmail as string, password: adminPassword as string })],
      { stdio: "pipe" }
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

  // Seed template padrão de contrato (se proposals habilitado)
  if (plugins["proposals"]) {
    try {
      execFileSync(
        "npx",
        ["convex", "run", "contractTemplates:seedDefaultTemplate"],
        { stdio: "pipe" }
      );
    } catch {
      // não crítico — admin pode criar o template manualmente
    }
  }

  // Seed textos de UI padrão
  try {
    execFileSync("npx", ["convex", "run", "siteTexts:seed"], { stdio: "pipe" });
  } catch {
    // não crítico — textos podem ser populados manualmente
  }

  // Seed de identidade no Convex (siteConfig + contactInfo) a partir do rubrica.json
  const identity = state.identity as Record<string, string> | undefined;
  if (identity?.siteName) {
    try {
      execFileSync(
        "npx",
        ["convex", "run", "siteConfig:setBatch", JSON.stringify({
          items: [
            { key: "site_title", value: identity.siteName },
            { key: "site_name", value: identity.siteName },
            { key: "site_url", value: identity.siteUrl || "" },
            { key: "site_description", value: identity.siteDescription || "" },
            { key: "author_name", value: identity.authorName || "" },
            { key: "author_email", value: identity.authorEmail || "" },
            { key: "twitter_handle", value: identity.twitterHandle || "" },
            { key: "lang", value: identity.lang || "pt-BR" },
          ],
        })],
        { stdio: "pipe" }
      );
    } catch {
      // não crítico — configurável pelo admin
    }

    if (identity.authorName) {
      try {
        execFileSync(
          "npx",
          ["convex", "run", "contactInfo:update", JSON.stringify({
            name: identity.authorName,
            email: identity.authorEmail || "",
            showEmail: false,
          })],
          { stdio: "pipe" }
        );
      } catch {
        // não crítico
      }
    }
  }

  // 13. Vercel — sempre presentes (opcionais)
  const vercelHookUrl = await text({
    message: "VERCEL_DEPLOY_HOOK_URL (Enter para pular):",
    initialValue: "",
  });
  if (!isCancel(vercelHookUrl) && vercelHookUrl && (vercelHookUrl as string).trim()) {
    execFileSync("npx", ["convex", "env", "set", "--", "VERCEL_DEPLOY_HOOK_URL", vercelHookUrl as string], { stdio: "pipe" });
  }

  const vercelWebhookSecret = await text({
    message: "VERCEL_WEBHOOK_SECRET (Enter para pular):",
    initialValue: "",
  });
  if (!isCancel(vercelWebhookSecret) && vercelWebhookSecret && (vercelWebhookSecret as string).trim()) {
    execFileSync("npx", ["convex", "env", "set", "--", "VERCEL_WEBHOOK_SECRET", vercelWebhookSecret as string], { stdio: "pipe" });
  }

  // 14. Personalização do portfolio
  const profession = await text({
    message: "Qual é a sua profissão ou área de atuação? (Enter para usar padrão tech)",
    placeholder: "Ex: Designer UX, Fotógrafa, Advogada, Engenheira Civil...",
    initialValue: "",
  });

  const specialties = await text({
    message: "Quais são suas principais especialidades? (separadas por vírgula, Enter para pular)",
    placeholder: "Ex: Branding, Motion Design, Fotografia de Produto",
    initialValue: "",
  });

  const professionStr = isCancel(profession) ? "" : ((profession as string) || "").trim();
  const specialtiesStr = isCancel(specialties) ? "" : ((specialties as string) || "").trim();

  if (professionStr || specialtiesStr) {
    const tags: Array<{ label: string; color: string }> = specialtiesStr
      ? specialtiesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
          .map((label, i) => ({ label, color: i % 2 === 0 ? "primary" : "secondary" }))
      : [
          { label: "React", color: "primary" },
          { label: "TypeScript", color: "primary" },
          { label: "Arquitetura de Sistemas", color: "secondary" },
          { label: "DevOps & Infraestrutura", color: "secondary" },
        ];

    try {
      execFileSync(
        "npx",
        ["convex", "run", "homeContent:set", JSON.stringify({ key: "hero_tags", value: tags })],
        { stdio: "pipe" }
      );
    } catch {
      // não crítico
    }

    if (professionStr) {
      const name = (adminEmail as string).split("@")[0];
      const aiContext = specialtiesStr
        ? `${name} é ${professionStr} com especialidade em ${specialtiesStr}. Entrega projetos com qualidade e comprometimento.`
        : `${name} é ${professionStr}. Entrega projetos com qualidade e comprometimento.`;

      try {
        execFileSync(
          "npx",
          ["convex", "run", "contactInfo:update", JSON.stringify({ proposalAiContext: aiContext })],
          { stdio: "pipe" }
        );
      } catch {
        // não crítico
      }
    }
  }

  outro(
    `Setup concluído!\n\n  Admin criado: ${adminEmail as string}\n  Acesse: /login\n\n  Próximo passo: pnpm dev`
  );
}
