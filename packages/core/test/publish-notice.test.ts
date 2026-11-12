import { describe, expect, it, vi } from "vitest";
import { PUBLISH_CALLBACK_PATH } from "../src/convex/httpRoutes";
import { CALLBACK_PATH, convexSiteUrl, isPreviewBuild, notifyBuildDone } from "../src/astro/publish-notice";

const CLOUD = "https://feliz-gato-123.convex.cloud";
const quiet = { info: () => {}, warn: () => {} };

function fakeFetch(status = 200) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response("ok", { status }));
}

describe("aviso de fim de build", () => {
  it("usa a mesma rota do backend", () => {
    expect(CALLBACK_PATH).toBe(PUBLISH_CALLBACK_PATH);
  });

  it("acha o endereço .convex.site: o explícito ou o derivado do .convex.cloud", () => {
    expect(convexSiteUrl(CLOUD, {})).toBe("https://feliz-gato-123.convex.site");
    expect(convexSiteUrl(`${CLOUD}/`, {})).toBe("https://feliz-gato-123.convex.site");
    expect(convexSiteUrl(CLOUD, { CONVEX_SITE_URL: "https://api.exemplo.dev/" })).toBe("https://api.exemplo.dev");
    expect(convexSiteUrl("http://127.0.0.1:3210", {})).toBeUndefined();
    expect(convexSiteUrl(undefined, {})).toBeUndefined();
  });

  it("com o segredo, avisa o Convex com o cabeçalho", async () => {
    const fetch = fakeFetch();
    const result = await notifyBuildDone({ convexUrl: CLOUD, env: { RUBRICA_DEPLOY_CALLBACK_SECRET: "s3gredo", VERCEL_ENV: "production" }, fetch, logger: quiet });
    expect(result).toBe("sent");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://feliz-gato-123.convex.site/rubrica/publicacao/concluida");
    expect(init).toMatchObject({ method: "POST", headers: { "X-Rubrica-Secret": "s3gredo" } });
  });

  it("sem segredo, sem endereço ou em build de prévia, não chama nada", async () => {
    const fetch = fakeFetch();
    expect(await notifyBuildDone({ convexUrl: CLOUD, env: {}, fetch })).toBe("skipped");
    expect(await notifyBuildDone({ convexUrl: undefined, env: { RUBRICA_DEPLOY_CALLBACK_SECRET: "s" }, fetch })).toBe("skipped");
    expect(await notifyBuildDone({ convexUrl: CLOUD, env: { RUBRICA_DEPLOY_CALLBACK_SECRET: "s", VERCEL_ENV: "preview" }, fetch })).toBe("skipped");
    expect(await notifyBuildDone({ convexUrl: CLOUD, env: { RUBRICA_DEPLOY_CALLBACK_SECRET: "s", NETLIFY: "true", CONTEXT: "deploy-preview" }, fetch })).toBe("skipped");
    expect(fetch).not.toHaveBeenCalled();
    expect(isPreviewBuild({ NETLIFY: "true", CONTEXT: "production" })).toBe(false);
  });

  it("erro do Convex ou da rede só vira aviso no log, nunca falha o build", async () => {
    const warn = vi.fn();
    const env = { RUBRICA_DEPLOY_CALLBACK_SECRET: "s" };
    expect(await notifyBuildDone({ convexUrl: CLOUD, env, fetch: fakeFetch(401), logger: { info: () => {}, warn } })).toBe("failed");
    const broken = vi.fn(async () => {
      throw new Error("fetch failed");
    });
    expect(await notifyBuildDone({ convexUrl: CLOUD, env, fetch: broken as unknown as typeof fetch, logger: { info: () => {}, warn } })).toBe("failed");
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]![0]).toMatch(/HTTP 401/);
  });
});
