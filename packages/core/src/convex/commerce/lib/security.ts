/**
 * Senha da proposta, tokens de sessão e comparações sem vazar tempo (port da v1).
 * Só Web Crypto: roda no runtime padrão do Convex, sem `"use node"`.
 *
 * O formato do hash (`pbkdf2:<sal>:<hash>`) é o mesmo da v1, então as senhas
 * migradas continuam valendo.
 */

const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2:${toHex(salt)}:${await derive(password, salt)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2" || !/^[0-9a-f]+$/.test(parts[1]!)) return false;
  return timingSafeEqual(await derive(password, fromHex(parts[1]!)), parts[2]!);
}

export function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

/** Token aleatório em hexadecimal (32 bytes = 64 caracteres). */
export function randomToken(bytes = 32): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Identificador público difícil de adivinhar (links de checkout, slug de proposta). */
export function randomId(length = 24): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

/** Texto para mensagens do Telegram em `parse_mode: HTML`. */
export function escapeTgHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
