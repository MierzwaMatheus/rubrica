import { text, select, isCancel, cancel } from "@clack/prompts";

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

function assertNotCancelled(value: unknown): asserts value is string {
  if (isCancel(value)) {
    cancel("Operação cancelada.");
    throw new Error("Prompt cancelado pelo usuário.");
  }
}

export async function identityPrompt(
  defaults?: IdentityDefaults
): Promise<IdentityInput> {
  const siteName = await text({
    message: "Nome do site (aparece no título do browser e SEO)",
    initialValue: defaults?.siteName ?? "",
  });
  assertNotCancelled(siteName);

  const siteUrl = await text({
    message: "URL do site (sem barra no final)",
    initialValue: defaults?.siteUrl ?? "",
    validate: (v) => {
      if (!v.startsWith("http://") && !v.startsWith("https://")) {
        return "A URL deve começar com http:// ou https://";
      }
    },
  });
  assertNotCancelled(siteUrl);

  const siteDescription = await text({
    message: "Descrição curta (SEO e Open Graph)",
    initialValue: defaults?.siteDescription ?? "",
  });
  assertNotCancelled(siteDescription);

  const authorName = await text({
    message: "Seu nome (para RSS e meta author)",
    initialValue: defaults?.authorName ?? "",
  });
  assertNotCancelled(authorName);

  const authorEmail = await text({
    message: "Seu email (para RSS — não aparece publicamente)",
    initialValue: defaults?.authorEmail ?? "",
    validate: (v) => {
      if (!v.includes("@") || !v.includes(".")) {
        return "Informe um email válido (ex: contato@meusite.com)";
      }
    },
  });
  assertNotCancelled(authorEmail);

  const twitterHandle = await text({
    message: "Twitter/X handle (sem @, Enter para pular)",
    initialValue: defaults?.twitterHandle ?? "",
  });
  assertNotCancelled(twitterHandle);

  const lang = await select({
    message: "Idioma padrão",
    initialValue: defaults?.lang ?? "pt-BR",
    options: [
      { value: "pt-BR", label: "Português (pt-BR)" },
      { value: "en-US", label: "Inglês (en-US)" },
    ],
  });
  assertNotCancelled(lang);

  return {
    siteName: siteName as string,
    siteUrl: siteUrl as string,
    siteDescription: siteDescription as string,
    authorName: authorName as string,
    authorEmail: authorEmail as string,
    twitterHandle: (twitterHandle as string) ?? "",
    lang: lang as string,
  };
}
