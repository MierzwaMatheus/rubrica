/**
 * Cliente mínimo da API HTTP do Convex (`/api/query|mutation|action`), com o token da
 * sessão e renovação. Sem a lib `convex`: o MCP só precisa de JSON.
 */
import { jwtClaims, type Session, type SessionStore } from "./session";

export type Args = Record<string, unknown>;

/** O que as ferramentas usam; os testes trocam por um cliente falso. */
export interface RubricaClient {
  query<T = unknown>(path: string, args?: Args): Promise<T>;
  mutation<T = unknown>(path: string, args?: Args): Promise<T>;
  action<T = unknown>(path: string, args?: Args): Promise<T>;
  /** Envia bytes para a URL de upload do Convex Storage. */
  upload(url: string, bytes: Uint8Array, contentType: string): Promise<{ storageId: string }>;
}

export type ErrorKind = "auth" | "forbidden" | "missing-function" | "validation" | "server" | "network";

export class RubricaError extends Error {
  constructor(
    message: string,
    readonly kind: ErrorKind = "server",
  ) {
    super(message);
    this.name = "RubricaError";
  }
}

/** Tira o ruído do Convex (id da requisição, "Uncaught Error", pilha) e deixa a mensagem. */
export function cleanErrorMessage(raw: string): string {
  let msg = raw.replace(/^\[(?:CONVEX [^\]]*|Request ID: [^\]]*)\]\s*/gim, "");
  msg = msg.replace(/^\s*Server Error\s*$/gim, "");
  const lines = msg.split("\n").filter((l) => !/^\s+at\s/.test(l) && !/^\s*Called by client\s*$/i.test(l));
  msg = lines.join("\n").replace(/Uncaught (?:\w+)?Error:\s*/g, "").trim();
  return msg || raw.trim();
}

export function classifyError(message: string): ErrorKind {
  if (/Could not find (public )?(function|module)/i.test(message)) return "missing-function";
  if (/Não autenticado|Unauthenticated|InvalidAuthHeader|Could not verify OIDC/i.test(message)) return "auth";
  if (/Sem permissão/i.test(message)) return "forbidden";
  if (/ArgumentValidationError|Validator error|Object contains extra field|missing required field/i.test(message)) return "validation";
  return "server";
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Chamada crua, sem login. */
export async function convexCall(
  fetchImpl: FetchLike,
  baseUrl: string,
  type: "query" | "mutation" | "action",
  path: string,
  args: Args,
  token?: string,
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "Convex-Client": "rubrica-mcp-1.0" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/${type}`, { method: "POST", headers, body: JSON.stringify({ path, args, format: "json" }) });
  } catch (e) {
    throw new RubricaError(`Falha de rede ao falar com o Convex (${new URL(baseUrl).hostname}): ${(e as Error).message}`, "network");
  }
  let body: { status?: string; value?: unknown; errorMessage?: string; errorData?: unknown } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    if (!response.ok) throw new RubricaError(`O Convex respondeu HTTP ${response.status}`, response.status === 401 ? "auth" : "server");
  }
  if (body.status === "error" || !response.ok) {
    const raw = typeof body.errorData === "string" && body.errorData ? body.errorData : (body.errorMessage ?? `HTTP ${response.status}`);
    const message = cleanErrorMessage(raw);
    throw new RubricaError(message, response.status === 401 ? "auth" : classifyError(`${body.errorMessage ?? ""}\n${message}`));
  }
  return body.value;
}

function tokensOf(value: unknown): { token: string; refreshToken: string } | null {
  const tokens = (value as { tokens?: { token?: unknown; refreshToken?: unknown } } | null)?.tokens;
  return tokens && typeof tokens.token === "string" && typeof tokens.refreshToken === "string"
    ? { token: tokens.token, refreshToken: tokens.refreshToken }
    : null;
}

/** Guarda a sessão e entrega um token válido, renovando quando falta menos de um minuto. */
export class AuthManager {
  private refreshing: Promise<Session> | null = null;

  constructor(
    readonly convexUrl: string,
    readonly store: SessionStore,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  session(): Session | null {
    const s = this.store.read();
    return s && s.convexUrl === this.convexUrl ? s : null;
  }

  async signIn(email: string, password: string): Promise<Session> {
    let value: unknown;
    try {
      value = await convexCall(this.fetchImpl, this.convexUrl, "action", "auth:signIn", {
        provider: "password",
        params: { email, password, flow: "signIn" },
      });
    } catch (e) {
      if (e instanceof RubricaError && e.kind !== "network") {
        throw new RubricaError("Login recusado: e-mail ou senha inválidos (ou tentativas demais; espere uns minutos).", "auth");
      }
      throw e;
    }
    const tokens = tokensOf(value);
    if (!tokens) throw new RubricaError("Login recusado: e-mail ou senha inválidos.", "auth");
    const session: Session = { convexUrl: this.convexUrl, email, ...tokens, savedAt: Date.now() };
    this.store.write(session);
    return session;
  }

  async signOut(): Promise<boolean> {
    const s = this.session();
    if (s) {
      try {
        await convexCall(this.fetchImpl, this.convexUrl, "action", "auth:signOut", {}, s.token);
      } catch {
        /* a sessão local sai de qualquer forma */
      }
    }
    return this.store.clear();
  }

  private async refresh(): Promise<Session> {
    // Outro processo (outro agente) pode ter renovado: o refresh token só vale uma vez.
    const current = this.session();
    if (!current) throw new RubricaError("Sem login. Peça à pessoa para rodar `npx rubrica mcp login` no terminal dela.", "auth");
    const fresh = this.store.read();
    if (fresh && fresh.token !== current.token && (jwtClaims(fresh.token).exp ?? 0) - Date.now() / 1000 > 60) return fresh;
    let value: unknown;
    try {
      value = await convexCall(this.fetchImpl, this.convexUrl, "action", "auth:signIn", { refreshToken: current.refreshToken });
    } catch (e) {
      if (e instanceof RubricaError && e.kind === "network") throw e;
      throw new RubricaError("A sessão expirou. Peça à pessoa para rodar `npx rubrica mcp login` de novo.", "auth");
    }
    const tokens = tokensOf(value);
    if (!tokens) throw new RubricaError("A sessão expirou. Peça à pessoa para rodar `npx rubrica mcp login` de novo.", "auth");
    const next: Session = { ...current, ...tokens, savedAt: Date.now() };
    this.store.write(next);
    return next;
  }

  /** Token válido, ou lança pedindo o login. */
  async token(force = false): Promise<string> {
    const s = this.session();
    if (!s) throw new RubricaError("Sem login. Peça à pessoa para rodar `npx rubrica mcp login` no terminal dela.", "auth");
    const expiresIn = (jwtClaims(s.token).exp ?? 0) - Date.now() / 1000;
    if (!force && expiresIn > 60) return s.token;
    this.refreshing ??= this.refresh().finally(() => {
      this.refreshing = null;
    });
    return (await this.refreshing).token;
  }
}

export class ConvexClient implements RubricaClient {
  constructor(
    private readonly auth: AuthManager,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  private async call(type: "query" | "mutation" | "action", path: string, args: Args = {}): Promise<unknown> {
    const send = async (force: boolean) => convexCall(this.fetchImpl, this.auth.convexUrl, type, path, args, await this.auth.token(force));
    try {
      return await send(false);
    } catch (e) {
      if (e instanceof RubricaError && e.kind === "auth") return send(true);
      throw e;
    }
  }

  query<T>(path: string, args?: Args) {
    return this.call("query", path, args) as Promise<T>;
  }
  mutation<T>(path: string, args?: Args) {
    return this.call("mutation", path, args) as Promise<T>;
  }
  action<T>(path: string, args?: Args) {
    return this.call("action", path, args) as Promise<T>;
  }

  async upload(url: string, bytes: Uint8Array, contentType: string) {
    let response: Response;
    try {
      response = await this.fetchImpl(url, { method: "POST", headers: { "Content-Type": contentType }, body: bytes as unknown as BodyInit });
    } catch (e) {
      throw new RubricaError(`Falha de rede no envio do arquivo: ${(e as Error).message}`, "network");
    }
    if (!response.ok) throw new RubricaError(`O envio do arquivo falhou (HTTP ${response.status})`, "server");
    const body = (await response.json()) as { storageId?: string };
    if (!body.storageId) throw new RubricaError("O Convex não devolveu o storageId do arquivo enviado", "server");
    return { storageId: body.storageId };
  }
}
