// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { affectsSite } from "../../src/convex/publish";
import { api, as, seedSettings, setup, type T } from "./_setup";

const HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_x/abc";

let t: T;
let calls: { url: string; method?: string }[];
beforeEach(async () => {
  t = setup();
  await seedSettings(t);
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method });
      return new Response("{}", { status: String(url).includes("quebrado") ? 500 : 201 });
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("publicação pelo deploy hook", () => {
  it("sem hook configurado, o estado diz e o botão explica", async () => {
    const admin = await as(t, "admin");
    expect((await admin.query(api.rubrica.publish.status, {})).status).toBe("unconfigured");
    expect(await admin.action(api.rubrica.publish.trigger, {})).toMatchObject({ ok: false, message: expect.stringMatching(/RUBRICA_DEPLOY_HOOK_URL/) });
    expect(calls).toHaveLength(0);
  });

  it("mudança pendente → publica (POST no hook) → publicando → concluído pelo aviso do build", async () => {
    vi.stubEnv("RUBRICA_DEPLOY_HOOK_URL", HOOK);
    vi.stubEnv("RUBRICA_DEPLOY_CALLBACK_SECRET", "s3gredo");
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.services.create, { title: { "pt-BR": "Design" } });
    let status = await admin.query(api.rubrica.publish.status, {});
    expect(status).toMatchObject({ status: "pending", configured: true, pendingChanges: 1 });

    expect(await admin.action(api.rubrica.publish.trigger, {})).toEqual({ ok: true });
    expect(calls).toEqual([{ url: HOOK, method: "POST" }]);
    status = await admin.query(api.rubrica.publish.status, {});
    expect(status).toMatchObject({ status: "publishing", pendingChanges: 0 });

    expect((await t.fetch("/rubrica/publicacao/concluida", { method: "POST", headers: { "X-Rubrica-Secret": "errado" } })).status).toBe(401);
    expect((await t.fetch("/rubrica/publicacao/concluida", { method: "POST", headers: { "X-Rubrica-Secret": "s3gredo" } })).status).toBe(200);
    status = await admin.query(api.rubrica.publish.status, {});
    expect(status.status).toBe("published");
    expect(status.lastPublishedAt).toBeGreaterThan(0);
  });

  it("sem mudanças, só com force; e no máximo uma vez por minuto", async () => {
    vi.stubEnv("RUBRICA_DEPLOY_HOOK_URL", HOOK);
    vi.useFakeTimers();
    const admin = await as(t, "admin");
    expect(await admin.action(api.rubrica.publish.trigger, {})).toMatchObject({ ok: true, skipped: true, message: "Nada novo para publicar." });
    expect(await admin.action(api.rubrica.publish.trigger, { force: true })).toEqual({ ok: true });
    await admin.mutation(api.rubrica.faq.create, { question: { "pt-BR": "?" }, answer: { "pt-BR": "!" } });
    expect(await admin.action(api.rubrica.publish.trigger, {})).toMatchObject({ skipped: true, message: expect.stringMatching(/Tente de novo em \d+ s/) });
    vi.advanceTimersByTime(61_000);
    expect(await admin.action(api.rubrica.publish.trigger, {})).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    // Sem o aviso do build, "publicando" expira sozinho.
    vi.advanceTimersByTime(16 * 60_000);
    expect((await admin.query(api.rubrica.publish.status, {})).status).toBe("published");
  });

  it("falha do provedor fica visível; contatos e usuários não contam como mudança", async () => {
    vi.stubEnv("RUBRICA_DEPLOY_HOOK_URL", "https://hooks.exemplo.dev/quebrado");
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.pages.create, { path: "/x", title: { "pt-BR": "X" } });
    expect(await admin.action(api.rubrica.publish.trigger, {})).toMatchObject({ ok: false, message: expect.stringMatching(/HTTP 500/) });
    const status = await admin.query(api.rubrica.publish.status, {});
    expect(status).toMatchObject({ status: "failed", pendingChanges: 1, lastError: expect.stringMatching(/HTTP 500/) });
    expect(affectsSite({ eventType: "contact.status_changed", targetType: "contactRequest" })).toBe(false);
    expect(affectsSite({ eventType: "user.created", targetType: "user" })).toBe(false);
    expect(affectsSite({ eventType: "admin.create", targetType: "proposal" })).toBe(false);
    expect(affectsSite({ eventType: "admin.update", targetType: "posts" })).toBe(true);
    expect(affectsSite({ eventType: "settings.updated", targetType: "siteSettings" })).toBe(true);
  });

  it("só root e admin publicam; todos do painel veem o estado", async () => {
    vi.stubEnv("RUBRICA_DEPLOY_HOOK_URL", HOOK);
    const editor = await as(t, "content-editor");
    expect((await editor.query(api.rubrica.publish.status, {})).status).toBe("published");
    await expect(editor.action(api.rubrica.publish.trigger, { force: true })).rejects.toThrow(/Sem permissão/);
    expect(calls).toHaveLength(0);
  });
});
