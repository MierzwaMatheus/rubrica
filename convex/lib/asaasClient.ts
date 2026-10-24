/**
 * Cliente HTTP mínimo da API v3 do Asaas (https://docs.asaas.com).
 *
 * - A chave vai no header `access_token` (ASAAS_API_KEY).
 * - O ambiente sai do prefixo da chave: `$aact_prod_` = produção, qualquer outra = sandbox.
 *   ASAAS_ENV=production|sandbox sobrepõe a detecção.
 */

export type AsaasEnv = 'production' | 'sandbox';

const BASE_URLS: Record<AsaasEnv, string> = {
  production: 'https://api.asaas.com/v3',
  sandbox: 'https://api-sandbox.asaas.com/v3',
};

export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codes: string[] = [],
  ) {
    super(message);
    this.name = 'AsaasError';
  }
}

export interface AsaasConfig {
  apiKey: string;
  env: AsaasEnv;
  baseUrl: string;
}

export function asaasConfig(env: Record<string, string | undefined> = process.env): AsaasConfig {
  const apiKey = env.ASAAS_API_KEY?.trim();
  if (!apiKey) {
    throw new AsaasError(
      'Pagamentos não configurados: defina ASAAS_API_KEY nas variáveis do Convex (npx convex env set ASAAS_API_KEY ...).',
      0,
      ['not_configured'],
    );
  }
  const explicit = env.ASAAS_ENV?.trim().toLowerCase();
  const detected: AsaasEnv = apiKey.startsWith('$aact_prod_') ? 'production' : 'sandbox';
  const resolved: AsaasEnv =
    explicit === 'production' || explicit === 'sandbox' ? explicit : detected;
  return { apiKey, env: resolved, baseUrl: BASE_URLS[resolved] };
}

type FetchFn = typeof fetch;

export async function asaasRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  deps: { config?: AsaasConfig; fetch?: FetchFn } = {},
): Promise<T> {
  const config = deps.config ?? asaasConfig();
  const doFetch = deps.fetch ?? fetch;

  let response: Response;
  try {
    response = await doFetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        access_token: config.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'rubrica',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AsaasError('Não foi possível falar com o Asaas. Tente de novo em instantes.', 0);
  }

  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const errors = (data as { errors?: Array<{ code?: string; description?: string }> } | undefined)?.errors ?? [];
    const description = errors.map((e) => e.description).filter(Boolean).join(' ');
    throw new AsaasError(
      description || `Asaas respondeu HTTP ${response.status}.`,
      response.status,
      errors.map((e) => e.code ?? '').filter(Boolean),
    );
  }

  return data as T;
}

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo, que é o que o Asaas usa para vencimentos. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Valor mínimo de uma cobrança (e de cada parcela) no Asaas, em reais. */
export const MIN_CHARGE_VALUE = 5;

/** "AAAA-MM-DD" válido? */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m! - 1 && date.getUTCDate() === d;
}

/** O Asaas recusa vencimento no passado: usa hoje quando a data do checkout já passou. */
export function effectiveDueDate(dueDate: string, now: Date = new Date()): string {
  const today = todayInSaoPaulo(now);
  return dueDate < today ? today : dueDate;
}

export function onlyDigits(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits || undefined;
}
