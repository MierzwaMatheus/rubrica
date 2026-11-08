import { text, select, isCancel, cancel } from "@clack/prompts";
import { normalizeUrl, validateUrl, normalizeEmail, validateEmail, normalizeHandle } from "../utils/normalize.js";

export interface IdentityInput {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
  twitterHandle: string;
  lang: string;
}

export type IdentityDefaults = Partial<IdentityInput>;

export interface IdentityPromptOptions {
  /** `false` no modo rápido: usa `defaults.lang` ou pt-BR sem perguntar. */
  askLang?: boolean;
  /**
   * Com receita do site: pergunta só o obrigatório que faltou ou veio inválido (nome,
   * endereço, e-mail). Nome do site cai no nome da pessoa; frase e X ficam como vieram.
   */
  onlyMissing?: boolean;
}

function assertNotCancelled(value: unknown): asserts value is string {
  if (isCancel(value)) {
    cancel("Operação cancelada.");
    throw new Error("Prompt cancelado pelo usuário.");
  }
}

async function ask(opts: Parameters<typeof text>[0]): Promise<string> {
  const value = await text(opts);
  assertNotCancelled(value);
  return value.trim();
}

/**
 * Identidade do site. As perguntas aceitam o jeito natural de escrever (URL sem https://,
 * @ do X, link do perfil) e devolvem tudo normalizado.
 */
export async function identityPrompt(
  defaults?: IdentityDefaults,
  options: IdentityPromptOptions = {}
): Promise<IdentityInput> {
  const skip = options.onlyMissing === true;
  const given = (v: string | undefined) => (v ?? "").trim();

  const authorName = skip && given(defaults?.authorName) ? given(defaults?.authorName) : await ask({
    message: "Seu nome",
    initialValue: defaults?.authorName ?? "",
    validate: (v) => (v.trim() ? undefined : "Informe seu nome"),
  });

  const siteName = skip
    ? given(defaults?.siteName) || authorName
    : (await ask({
      message: "Nome do site (aparece na aba do navegador e no Google)",
      initialValue: defaults?.siteName ?? authorName,
    })) || authorName;

  const siteUrlGiven = skip && given(defaults?.siteUrl) && !validateUrl(given(defaults?.siteUrl));
  const siteUrl = normalizeUrl(
    siteUrlGiven ? given(defaults?.siteUrl) : await ask({
      message: "Endereço do site (ex: meusite.com — não precisa do https://)",
      initialValue: defaults?.siteUrl ?? "",
      validate: validateUrl,
    })
  );

  const siteDescription = skip ? given(defaults?.siteDescription) : await ask({
    message: "Em uma frase, o que você faz? (aparece no Google e quando alguém compartilha o link)",
    initialValue: defaults?.siteDescription ?? "",
  });

  const emailGiven = skip && given(defaults?.authorEmail) && !validateEmail(given(defaults?.authorEmail));
  const authorEmail = normalizeEmail(
    emailGiven ? given(defaults?.authorEmail) : await ask({
      message: "Seu e-mail (não aparece no site)",
      initialValue: defaults?.authorEmail ?? "",
      validate: validateEmail,
    })
  );

  const twitterHandle = normalizeHandle(
    skip ? given(defaults?.twitterHandle) : await ask({
      message: "Seu perfil no X/Twitter (opcional — Enter para pular)",
      initialValue: defaults?.twitterHandle ?? "",
    })
  );

  let lang = defaults?.lang ?? "pt-BR";
  if (options.askLang !== false) {
    const chosen = await select({
      message: "Idioma do site",
      initialValue: lang,
      options: [
        { value: "pt-BR", label: "Português (pt-BR)" },
        { value: "en-US", label: "Inglês (en-US)" },
      ],
    });
    assertNotCancelled(chosen);
    lang = chosen;
  }

  return { siteName, siteUrl, siteDescription, authorName, authorEmail, twitterHandle, lang };
}
