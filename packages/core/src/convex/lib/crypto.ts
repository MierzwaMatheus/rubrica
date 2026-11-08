/**
 * Hashes do backend. SHA-256 e HMAC usam a Web Crypto (disponível no runtime padrão
 * do Convex em actions e rotas HTTP); o FNV-1a é síncrono, para usar em mutations.
 */

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/**
 * Sal dos hashes de IP e e-mail. Sem `RUBRICA_IP_SALT`, usa o endereço do deployment
 * (diferente em cada projeto, mas público: configure o sal em produção).
 */
export function hashSalt(env: Record<string, string | undefined> = process.env): string {
  return env.RUBRICA_IP_SALT || env.CONVEX_SITE_URL || "rubrica";
}

/** Hash de um dado pessoal usado só como chave (limite de envios, consentimento). */
export function personalHash(value: string, env?: Record<string, string | undefined>): Promise<string> {
  return sha256Hex(`${hashSalt(env)}:${value}`);
}

/** Comparação em tempo constante para segredos. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** JSON com as chaves em ordem: o mesmo valor dá sempre o mesmo texto. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** FNV-1a de 32 bits em hexadecimal. Não é criptográfico: serve para saber se algo mudou. */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
