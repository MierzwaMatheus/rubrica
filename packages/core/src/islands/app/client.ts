/**
 * Como as páginas do app (proposta, checkout) falam com o backend do site.
 *
 * - Leituras (`getPublic`, `getByLink`…) por assinatura do Convex: a página muda sozinha
 *   quando o pagamento é confirmado pelo webhook, como na v1.
 * - Senha, aceite e início do checkout pelas rotas HTTP (`convex/commerce/http.ts`), para
 *   o IP e o navegador saírem do servidor. Ficam no `.convex.site`, que é o
 *   `PUBLIC_RUBRICA_API` (ou o endereço do Convex com `.convex.cloud` → `.convex.site`).
 *
 * O componente recebe um `AppApi`; os testes passam um falso.
 */
import { useEffect, useState } from "react";
import { ConvexClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

/** Backend das páginas do app: o mesmo do painel (`virtual:rubrica/admin`) e o endereço das rotas HTTP. */
export type AppBackend = { kind: "convex"; url: string; siteUrl: string } | { kind: "demo" } | { kind: "missing" };

export function appBackend(admin: { kind: "convex"; url: string } | { kind: "demo" } | { kind: "missing" }, publicApi?: string): AppBackend {
  if (admin.kind !== "convex") return { kind: admin.kind };
  const url = admin.url.replace(/\/+$/, "");
  const siteUrl = publicApi?.trim().replace(/\/+$/, "") || url.replace(/\.convex\.cloud$/, ".convex.site");
  return { kind: "convex", url, siteUrl };
}

/** Funções públicas do backend usadas pelas páginas (`rubrica/<módulo>:<função>`). */
export const FN = {
  proposal: "rubrica/proposals:getPublic",
  acceptance: "rubrica/proposals:getAcceptanceByToken",
  signatureUploadUrl: "rubrica/proposals:generateSignatureUploadUrl",
  checkout: "rubrica/checkouts:getByLink",
  initiatePayment: "rubrica/checkouts:initiatePayment",
} as const;

/** Rotas HTTP públicas (`convex/commerce/http.ts`). */
export const HTTP = {
  session: "/api/proposal/session",
  accept: "/api/proposal/accept",
  checkoutStart: "/api/checkout/start",
} as const;

type Args = Record<string, unknown>;

export interface HttpResult {
  status: number;
  /** Corpo JSON (`{}` se não veio JSON). */
  body: Record<string, unknown>;
}

export interface AppApi {
  /** Assina uma query; devolve a função que cancela. */
  watch(fn: string, args: Args, onValue: (value: unknown) => void, onError: (error: unknown) => void): () => void;
  mutation(fn: string, args: Args): Promise<unknown>;
  action(fn: string, args: Args): Promise<unknown>;
  /** POST JSON numa rota HTTP. Falha de rede vira `status: 0`. */
  post(path: string, body: Args): Promise<HttpResult>;
  /** Envia um arquivo para a URL de upload do Convex e devolve o `storageId`. */
  upload(uploadUrl: string, file: Blob): Promise<string>;
}

export function convexAppApi(backend: { url: string; siteUrl: string }): AppApi {
  let client: ConvexClient | undefined;
  const get = () => (client ??= new ConvexClient(backend.url));
  return {
    watch(fn, args, onValue, onError) {
      const unsubscribe = get().onUpdate(makeFunctionReference<"query">(fn), args, onValue, onError);
      return () => unsubscribe();
    },
    mutation: (fn, args) => get().mutation(makeFunctionReference<"mutation">(fn), args),
    action: (fn, args) => get().action(makeFunctionReference<"action">(fn), args),
    async post(path, body) {
      try {
        const res = await fetch(`${backend.siteUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "omit",
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return { status: res.status, body: data && typeof data === "object" ? data : {} };
      } catch {
        return { status: 0, body: {} };
      }
    },
    async upload(uploadUrl, file) {
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "image/png" }, body: file });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      return ((await res.json()) as { storageId: string }).storageId;
    },
  };
}

/** Código do erro do backend (`ConvexError` com `{ code }`), ou `ERROR`. */
export function errorCode(error: unknown): string {
  const data = (error as { data?: unknown } | null)?.data;
  if (data && typeof data === "object" && "code" in data) return String((data as { code: unknown }).code);
  return "ERROR";
}

export type Watched<T> = { state: "loading" } | { state: "ready"; value: T } | { state: "error" };

/** Assinatura de uma query como estado do React. `args: null` = não assina (falta parâmetro). */
export function useWatch<T>(api: AppApi | null, fn: string, args: Args | null): Watched<T> {
  const key = args ? JSON.stringify(args) : null;
  const [result, setResult] = useState<{ key: string | null; value: Watched<T> }>({ key, value: { state: "loading" } });
  useEffect(() => {
    if (!api || key === null) return;
    return api.watch(
      fn,
      JSON.parse(key) as Args,
      (value) => setResult({ key, value: { state: "ready", value: value as T } }),
      () => setResult({ key, value: { state: "error" } }),
    );
  }, [api, fn, key]);
  // Trocou de argumentos (ex.: entrou o token): carregando até a resposta nova.
  return result.key === key ? result.value : { state: "loading" };
}
