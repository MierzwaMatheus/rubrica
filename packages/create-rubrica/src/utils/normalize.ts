/**
 * Limpeza do que a pessoa digita nos prompts. A regra é aceitar o jeito natural de escrever
 * (sem https://, com @, colando o link do perfil) e gravar sempre no formato certo.
 */

const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:|\/|$)/i;

/** `meusite.com/` → `https://meusite.com`. Endereços locais ganham `http://`. Vazio continua vazio. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const scheme = /^(https?):\/\//i.exec(trimmed);
  const withScheme = scheme
    ? `${scheme[1].toLowerCase()}://${trimmed.slice(scheme[0].length)}`
    : `${LOCAL_HOST.test(trimmed) ? "http" : "https"}://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

const URL_EXAMPLE = "Não parece um endereço de site. Exemplo: meusite.com";

/** Mensagem de erro para o prompt, ou `undefined` se dá para usar. */
export function validateUrl(input: string): string | undefined {
  if (!input.trim()) return "Informe o endereço do site (ex: meusite.com)";
  const url = normalizeUrl(input);
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return URL_EXAMPLE;
  }
  if (host !== "localhost" && !host.includes(".")) return URL_EXAMPLE;
  return undefined;
}

/** `@fulano`, `x.com/fulano` ou `https://twitter.com/fulano/` → `fulano`. */
export function normalizeHandle(input: string): string {
  const trimmed = input.trim().replace(/[?#].*/, "").replace(/\/+$/, "");
  const lastSegment = trimmed.slice(trimmed.lastIndexOf("/") + 1);
  return lastSegment.replace(/^@/, "");
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function validateEmail(input: string): string | undefined {
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(input.trim())) {
    return "Informe um e-mail válido (ex: nome@meusite.com)";
  }
  return undefined;
}
