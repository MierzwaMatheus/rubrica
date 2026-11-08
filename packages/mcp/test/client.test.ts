import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { AuthManager, ConvexClient, RubricaError, classifyError, cleanErrorMessage } from "../src/client";
import { SessionStore } from "../src/session";

const URL_ = "https://teste-1.convex.cloud";

function jwt(exp: number): string {
  return `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;
}

function store() {
  return new SessionStore(join(mkdtempSync(join(tmpdir(), "rubrica-mcp-s-")), "s.json"));
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("mensagens do Convex", () => {
  it("tira o id da requisição, o Server Error e a pilha", () => {
    const raw = "[Request ID: abc] Server Error\nUncaught Error: Sem permissão para esta ação\n    at requireRole (../x.ts:1:1)\n  Called by client";
    expect(cleanErrorMessage(raw)).toBe("Sem permissão para esta ação");
  });
  it("classifica os erros", () => {
    expect(classifyError("Could not find public function for 'a:b'")).toBe("missing-function");
    expect(classifyError("Não autenticado")).toBe("auth");
    expect(classifyError("Sem permissão para esta ação")).toBe("forbidden");
    expect(classifyError("ArgumentValidationError: Object contains extra field")).toBe("validation");
  });
});

describe("login e renovação", () => {
  it("entra, guarda os tokens e nunca devolve a senha", async () => {
    const fetchMock = vi.fn(async () => reply({ status: "success", value: { tokens: { token: jwt(9e9), refreshToken: "r1" } } }));
    const auth = new AuthManager(URL_, store(), fetchMock as never);
    const s = await auth.signIn("ana@exemplo.dev", "segredo-grande-1A");
    expect(s.email).toBe("ana@exemplo.dev");
    expect(JSON.stringify(auth.store.read())).not.toContain("segredo");
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent.path).toBe("auth:signIn");
    expect(sent.args.params).toEqual({ email: "ana@exemplo.dev", password: "segredo-grande-1A", flow: "signIn" });
  });

  it("recusa credenciais ruins com mensagem em português", async () => {
    const auth = new AuthManager(URL_, store(), (async () => reply({ status: "error", errorMessage: "InvalidSecret" })) as never);
    await expect(auth.signIn("a@b.dev", "x")).rejects.toThrow(/e-mail ou senha inválidos/);
  });

  it("renova o token quando falta menos de um minuto", async () => {
    const st = store();
    st.write({ convexUrl: URL_, email: "a@b.dev", token: jwt(Math.floor(Date.now() / 1000) + 10), refreshToken: "r1", savedAt: 0 });
    const fresh = jwt(Math.floor(Date.now() / 1000) + 3600);
    const fetchMock = vi.fn(async () => reply({ status: "success", value: { tokens: { token: fresh, refreshToken: "r2" } } }));
    const auth = new AuthManager(URL_, st, fetchMock as never);
    expect(await auth.token()).toBe(fresh);
    expect(st.read()?.refreshToken).toBe("r2");
    // duas chamadas ao mesmo tempo renovam uma vez só
    st.write({ ...st.read()!, token: jwt(Math.floor(Date.now() / 1000) + 5) });
    fetchMock.mockClear();
    await Promise.all([auth.token(), auth.token()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pede o login quando não há sessão ou a renovação falha", async () => {
    const auth = new AuthManager(URL_, store(), (async () => reply({ status: "error", errorMessage: "x" })) as never);
    await expect(auth.token()).rejects.toThrow(/rubrica mcp login/);
    auth.store.write({ convexUrl: URL_, email: "a@b.dev", token: jwt(1), refreshToken: "r", savedAt: 0 });
    await expect(auth.token()).rejects.toThrow(/expirou/);
  });

  it("ignora sessão guardada para outro Convex", () => {
    const st = store();
    st.write({ convexUrl: "https://outro.convex.cloud", email: "a@b.dev", token: jwt(9e9), refreshToken: "r", savedAt: 0 });
    expect(new AuthManager(URL_, st).session()).toBeNull();
  });
});

describe("cliente", () => {
  it("manda o Bearer e tenta de novo uma vez após erro de autenticação", async () => {
    const st = store();
    st.write({ convexUrl: URL_, email: "a@b.dev", token: jwt(9e9), refreshToken: "r1", savedAt: 0 });
    const fresh = jwt(9e9 + 1);
    let n = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/action")) return reply({ status: "success", value: { tokens: { token: fresh, refreshToken: "r2" } } });
      n++;
      return n === 1 ? reply({ status: "error", errorMessage: "Uncaught Error: Não autenticado" }) : reply({ status: "success", value: [1] });
    });
    const client = new ConvexClient(new AuthManager(URL_, st, fetchMock as never), fetchMock as never);
    expect(await client.query("rubrica/pages:list")).toEqual([1]);
    const calls = fetchMock.mock.calls as unknown as [string, { headers: Record<string, string> }][];
    expect(calls.at(-1)![1].headers.Authorization).toBe(`Bearer ${fresh}`);
  });

  it("devolve RubricaError com a mensagem limpa", async () => {
    const st = store();
    st.write({ convexUrl: URL_, email: "a@b.dev", token: jwt(9e9), refreshToken: "r1", savedAt: 0 });
    const fetchMock = async () => reply({ status: "error", errorMessage: "[Request ID: z] Server Error\nUncaught Error: Sem permissão para esta ação" });
    const client = new ConvexClient(new AuthManager(URL_, st, fetchMock as never), fetchMock as never);
    const err = await client.mutation("rubrica/pages:create", {}).catch((e) => e);
    expect(err).toBeInstanceOf(RubricaError);
    expect(err).toMatchObject({ message: "Sem permissão para esta ação", kind: "forbidden" });
  });
});
