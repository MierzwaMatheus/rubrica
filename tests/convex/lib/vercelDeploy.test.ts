import { describe, it, expect, vi } from "vitest";
import { triggerVercelBuild, NOT_CONFIGURED } from "../../../convex/lib/vercelDeploy";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const LAST = { uid: "dpl_ultimo", name: "ana-site" };

/** fetch de mentira: lista o último deploy de produção e aceita o redeploy. */
function fakeVercel(opts: { list?: Response; create?: Response } = {}) {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.includes("/v6/deployments")) return opts.list ?? json({ deployments: [LAST] });
    if (url.includes("/v13/deployments")) return opts.create ?? json({ id: "dpl_novo", readyState: "QUEUED" });
    return new Response("?", { status: 404 });
  });
}

describe("convex/lib/vercelDeploy · triggerVercelBuild", () => {
  it("com Deploy Hook (projeto ligado ao GitHub), chama o hook", async () => {
    const fetchFn = vi.fn(async () => new Response("{}", { status: 201 }));
    const r = await triggerVercelBuild({ hookUrl: "https://api.vercel.com/v1/integrations/deploy/x" }, fetchFn);
    expect(fetchFn).toHaveBeenCalledWith("https://api.vercel.com/v1/integrations/deploy/x", { method: "POST" });
    expect(r).toEqual({ ok: true, statusCode: 201 });
  });

  it("o hook tem preferência sobre o token", async () => {
    const fetchFn = vi.fn(async () => new Response("{}", { status: 201 }));
    await triggerVercelBuild({ hookUrl: "https://hook", token: "tok", projectId: "prj_1" }, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe("https://hook");
  });

  it("com token: acha o último deploy de produção pronto e refaz em produção", async () => {
    const fetchFn = fakeVercel();
    const r = await triggerVercelBuild({ token: "tok", projectId: "prj_1", teamId: "team_9" }, fetchFn);
    const [listUrl, listInit] = fetchFn.mock.calls[0];
    expect(listUrl).toContain("projectId=prj_1");
    expect(listUrl).toContain("target=production");
    expect(listUrl).toContain("state=READY");
    expect(listUrl).toContain("teamId=team_9");
    expect((listInit!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const [createUrl, createInit] = fetchFn.mock.calls[1];
    expect(createUrl).toContain("/v13/deployments");
    expect(createUrl).toContain("teamId=team_9");
    expect(createInit!.method).toBe("POST");
    expect(JSON.parse(createInit!.body as string)).toEqual({ name: "ana-site", deploymentId: "dpl_ultimo", target: "production" });
    expect(r.ok).toBe(true);
  });

  it("sem time (conta pessoal antiga), não manda teamId", async () => {
    const fetchFn = fakeVercel();
    await triggerVercelBuild({ token: "tok", projectId: "prj_1" }, fetchFn);
    for (const [url] of fetchFn.mock.calls) expect(url).not.toContain("teamId");
  });

  it("token vencido ou revogado: explica como trocar", async () => {
    const fetchFn = fakeVercel({ list: json({ error: { code: "forbidden" } }, 403) });
    const r = await triggerVercelBuild({ token: "tok", projectId: "prj_1" }, fetchFn);
    expect(r.ok).toBe(false);
    expect(r.statusCode).toBe(403);
    expect(r.message).toMatch(/token da Vercel/);
    expect(r.message).toContain("npx create-rubrica publicar");
  });

  it("projeto sem nenhum deploy de produção: manda publicar pelo terminal", async () => {
    const fetchFn = fakeVercel({ list: json({ deployments: [] }) });
    const r = await triggerVercelBuild({ token: "tok", projectId: "prj_1" }, fetchFn);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("npx create-rubrica publicar");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("a Vercel recusando o redeploy: devolve o erro", async () => {
    const fetchFn = fakeVercel({ create: json({ error: { message: "limite de builds" } }, 429) });
    const r = await triggerVercelBuild({ token: "tok", projectId: "prj_1" }, fetchFn);
    expect(r).toMatchObject({ ok: false, statusCode: 429 });
    expect(r.message).toContain("limite de builds");
  });

  it("nada configurado: não chama a rede e diz o que fazer", async () => {
    const fetchFn = vi.fn();
    const r = await triggerVercelBuild({}, fetchFn);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(r).toEqual({ ok: false, message: NOT_CONFIGURED });
    expect(NOT_CONFIGURED).toContain("npx create-rubrica publicar");
  });

  it("token sem o id do projeto também conta como não configurado", async () => {
    const r = await triggerVercelBuild({ token: "tok" }, vi.fn());
    expect(r.message).toBe(NOT_CONFIGURED);
  });
});
