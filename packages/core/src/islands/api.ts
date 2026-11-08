/**
 * Contrato HTTP das ilhas com o backend (RFC v2: LGPD com consentimento registrado).
 *
 * Base: `import.meta.env.PUBLIC_RUBRICA_API` (sem barra no final). Sem ela, o envio
 * está desativado (demonstração) e nada sai do navegador.
 *
 * Os dois endpoints recebem `Content-Type: application/json` por POST, sem cookies nem
 * credenciais, de outra origem: o backend precisa responder o preflight (CORS) para a
 * origem do site e aplicar limite de envios por IP.
 *
 * ── POST {base}/rubrica/contato ──────────────────────────────────────────────────
 *   corpo: ContatoRequest
 *   200  { "ok": true, "id"?: string }                      recebido
 *   400  { "ok": false, "error": "invalid", "fields"?: string[] }   dados inválidos, ou consent != true
 *   429  { "ok": false, "error": "rate_limited", "retryAfter"?: number }   segundos
 *
 * ── POST {base}/rubrica/depoimento ───────────────────────────────────────────────
 *   corpo: DepoimentoRequest   (mesmas respostas; o depoimento entra como pendente)
 *
 * Qualquer outra resposta (5xx, rede) a ilha trata como falha genérica e deixa tentar de novo.
 * O backend deve rejeitar `consent` diferente de `true` e guardar o consentimento com a
 * data, o `locale`, a `page` e a versão da política vigente.
 */

export interface ContatoRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Respostas do assistente (ex.: `{ topic: "project" }`). Valores curtos e planos. */
  details?: Record<string, string>;
  consent: true;
  /** Honeypot: sempre vazio para pessoas (ver kit.tsx). */
  website?: string;
  /** Idioma da página (BCP 47), para responder no mesmo idioma. */
  locale: string;
  /** Id do bloco `contato` na página. */
  blockId: string;
  /** Caminho da página, com prefixo do idioma. */
  page: string;
}

export interface DepoimentoRequest {
  name: string;
  email: string;
  role?: string;
  company?: string;
  /** O texto do depoimento. */
  quote: string;
  consent: true;
  /** Honeypot: sempre vazio para pessoas (ver kit.tsx). */
  website?: string;
  locale: string;
  blockId: string;
  page: string;
}

export interface ApiOk {
  ok: true;
  id?: string;
}
export interface ApiInvalid {
  ok: false;
  error: "invalid";
  fields?: string[];
}
export interface ApiRateLimited {
  ok: false;
  error: "rate_limited";
  retryAfter?: number;
}

export type SubmitResult = ApiOk | ApiInvalid | ApiRateLimited | { ok: false; error: "network" | "server" };

/** Base do backend, sem barra final; `undefined` quando o envio está desativado. */
export function apiBase(): string | undefined {
  const base = import.meta.env.PUBLIC_RUBRICA_API;
  return base ? base.replace(/\/+$/, "") : undefined;
}

export const ENDPOINTS = { contato: "/rubrica/contato", depoimento: "/rubrica/depoimento" } as const;

export async function submitJson(path: (typeof ENDPOINTS)[keyof typeof ENDPOINTS], body: ContatoRequest | DepoimentoRequest): Promise<SubmitResult> {
  const base = apiBase();
  if (!base) return { ok: false, error: "server" };
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; fields?: string[]; retryAfter?: number };
    if (res.status === 200) return { ok: true, ...(data.id ? { id: data.id } : {}) };
    if (res.status === 400) return { ok: false, error: "invalid", ...(data.fields ? { fields: data.fields } : {}) };
    if (res.status === 429) return { ok: false, error: "rate_limited", ...(typeof data.retryAfter === "number" ? { retryAfter: data.retryAfter } : {}) };
    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}
