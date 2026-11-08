// @vitest-environment edge-runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";

const SITE = "https://exemplo.dev";

const contato = (patch: Record<string, unknown> = {}) => ({
  name: "Maria Lima",
  email: "Maria@Cliente.com ",
  phone: "+55 11 99999-0000",
  message: "Quero um site novo.",
  details: { topic: "project" },
  consent: true,
  locale: "pt-BR",
  blockId: "contato-1",
  page: "/contato",
  ...patch,
});

function post(t: T, path: string, body: unknown, headers: Record<string, string> = {}) {
  return t.fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SITE, "X-Forwarded-For": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let t: T;
beforeEach(async () => {
  t = setup();
  await seedSettings(t);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("POST /rubrica/contato: CORS e origem", () => {
  it("responde o preflight só para a origem do site", async () => {
    const ok = await t.fetch("/rubrica/contato", { method: "OPTIONS", headers: { Origin: SITE, "Access-Control-Request-Method": "POST" } });
    expect(ok.status).toBe(204);
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe(SITE);
    expect(ok.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(ok.headers.get("Vary")).toBe("Origin");
    const bad = await t.fetch("/rubrica/contato", { method: "OPTIONS", headers: { Origin: "https://malicioso.dev" } });
    expect(bad.status).toBe(403);
    expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("recusa POST de outra origem ou sem Origin", async () => {
    expect((await post(t, "/rubrica/contato", contato(), { Origin: "https://malicioso.dev" })).status).toBe(403);
    const noOrigin = await t.fetch("/rubrica/contato", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contato()) });
    expect(noOrigin.status).toBe(403);
  });

  it("localhost só com RUBRICA_ALLOW_LOCALHOST; origens extras por env", async () => {
    const local = { Origin: "http://localhost:4321" };
    expect((await post(t, "/rubrica/contato", contato(), local)).status).toBe(403);
    vi.stubEnv("RUBRICA_ALLOW_LOCALHOST", "true");
    expect((await post(t, "/rubrica/contato", contato(), local)).status).toBe(200);
    vi.stubEnv("RUBRICA_ALLOWED_ORIGINS", "https://www.exemplo.dev, https://preview.exemplo.dev");
    const res = await post(t, "/rubrica/contato", contato({ email: "outra@cliente.com" }), { Origin: "https://www.exemplo.dev" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://www.exemplo.dev");
  });
});

describe("POST /rubrica/contato: validação e consentimento", () => {
  it("grava o pedido com o consentimento (sem IP, só o hash)", async () => {
    const res = await post(t, "/rubrica/contato", contato());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(SITE);
    const comercial = await as(t, "comercial");
    const [doc] = await comercial.query(api.rubrica.contacts.list, {});
    expect(doc?._id).toBe(body.id);
    expect(doc).toMatchObject({ name: "Maria Lima", email: "maria@cliente.com", status: "new", details: { topic: "project" }, page: "/contato" });
    expect(doc?.consent).toMatchObject({ locale: "pt-BR", page: "/contato", policyVersion: 0 });
    expect(doc?.consent.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(doc)).not.toContain("203.0.113.7");
  });

  it("recusa consent diferente de true e campos inválidos, dizendo quais", async () => {
    for (const consent of [false, "true", undefined]) {
      const res = await post(t, "/rubrica/contato", contato({ consent }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: "invalid", fields: ["consent"] });
    }
    const res = await post(t, "/rubrica/contato", contato({ email: "sem-arroba", message: "", locale: "pt_BR", page: "contato", details: { a: 1 } }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { fields: string[] }).fields.sort()).toEqual(["details", "email", "locale", "message", "page"]);
    expect((await post(t, "/rubrica/contato", "{nao é json")).status).toBe(400);
    expect((await post(t, "/rubrica/contato", contato(), { "Content-Type": "text/plain" })).status).toBe(415);
    expect((await post(t, "/rubrica/contato", contato({ message: "x".repeat(40_000) }))).status).toBe(413);
  });

  it("honeypot preenchido finge sucesso e não grava", async () => {
    const res = await post(t, "/rubrica/contato", contato({ website: "https://spam.example" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const admin = await as(t, "admin");
    expect(await admin.query(api.rubrica.contacts.list, {})).toHaveLength(0);
  });

  it("com o plugin desligado, 404", async () => {
    const root = await as(t, "root");
    await root.mutation(api.rubrica.settings.setPlugin, { id: "contact-wizard", enabled: false });
    expect((await post(t, "/rubrica/contato", contato())).status).toBe(404);
  });
});

describe("POST /rubrica/contato: limite por IP", () => {
  it("5 por hora por IP; o sexto recebe 429 com retryAfter", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await post(t, "/rubrica/contato", contato({ email: `p${i}@cliente.com` }))).status).toBe(200);
    }
    const res = await post(t, "/rubrica/contato", contato({ email: "p9@cliente.com" }));
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string; retryAfter: number };
    expect(body.error).toBe("rate_limited");
    expect(body.retryAfter).toBeGreaterThan(3000);
    expect(res.headers.get("Retry-After")).toBe(String(body.retryAfter));
    expect((await post(t, "/rubrica/contato", contato({ email: "p9@cliente.com" }), { "X-Forwarded-For": "198.51.100.1" })).status).toBe(200);
  });

  it("e 5 por dia por e-mail, mesmo trocando de IP", async () => {
    for (let i = 0; i < 5; i++) expect((await post(t, "/rubrica/contato", contato(), { "X-Forwarded-For": `198.51.100.${i}` })).status).toBe(200);
    expect((await post(t, "/rubrica/contato", contato(), { "X-Forwarded-For": "198.51.100.99" })).status).toBe(429);
  });

  it("os limites guardam hashes, não o IP nem o e-mail", async () => {
    await post(t, "/rubrica/contato", contato());
    const keys = await t.run(async (ctx) => (await ctx.db.query("rateLimits").collect()).map((r) => r.key));
    expect(keys).toHaveLength(2);
    expect(keys.join(" ")).not.toMatch(/203\.0\.113\.7|maria@cliente\.com/);
  });
});

describe("painel de contatos", () => {
  it("lê, arquiva e apaga com o papel comercial; editor de conteúdo não vê", async () => {
    await post(t, "/rubrica/contato", contato());
    const comercial = await as(t, "comercial");
    const [doc] = await comercial.query(api.rubrica.contacts.list, {});
    expect(await comercial.query(api.rubrica.contacts.unreadCount, {})).toBe(1);
    await comercial.mutation(api.rubrica.contacts.markRead, { id: doc!._id });
    expect((await comercial.query(api.rubrica.contacts.get, { id: doc!._id }))?.status).toBe("read");
    await comercial.mutation(api.rubrica.contacts.archive, { id: doc!._id });
    expect(await comercial.query(api.rubrica.contacts.list, { status: "archived" })).toHaveLength(1);
    expect(await comercial.query(api.rubrica.contacts.unreadCount, {})).toBe(0);
    const editor = await as(t, "content-editor");
    await expect(editor.query(api.rubrica.contacts.list, {})).rejects.toThrow(/Sem permissão/);
    await expect(comercial.mutation(api.rubrica.contacts.setDestinations, { telegram: true, email: { enabled: false, to: [] }, webhook: { enabled: false } })).rejects.toThrow(/Sem permissão/);
    await comercial.mutation(api.rubrica.contacts.remove, { id: doc!._id });
    expect(await comercial.query(api.rubrica.contacts.list, {})).toHaveLength(0);
  });

  it("mensagem com muitos links fica marcada como spam e não dispara destinos", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.contacts.setDestinations, { telegram: true, email: { enabled: false, to: [] }, webhook: { enabled: false } });
    await post(t, "/rubrica/contato", contato({ message: "http://a.co http://b.co http://c.co www.d.co" }));
    const [doc] = await admin.query(api.rubrica.contacts.list, {});
    expect(doc?.spam).toBe(true);
    expect(doc?.deliveries).toEqual([]);
  });

  it("cron apaga pedidos além da retenção", async () => {
    await post(t, "/rubrica/contato", contato());
    await t.run(async (ctx) => {
      const doc = (await ctx.db.query("contactRequests").first())!;
      await ctx.db.patch(doc._id, { createdAt: Date.now() - 800 * 24 * 60 * 60 * 1000 });
    });
    expect(await t.mutation(internal.rubrica.contacts.cleanup, {})).toEqual({ deleted: 1 });
  });
});

describe("destinos dos contatos", () => {
  type Call = { url: string; init: RequestInit };

  function mockFetch(status = (_url: string) => 200) {
    const calls: Call[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url: String(url), init });
        return new Response(status(String(url)) === 200 ? "{}" : "erro", { status: status(String(url)) });
      }),
    );
    return calls;
  }

  async function configure(c: Awaited<ReturnType<typeof as>>) {
    await c.mutation(api.rubrica.contacts.setDestinations, {
      telegram: true,
      email: { enabled: true, to: ["Dono@Empresa.com"] },
      webhook: { enabled: true, url: "https://crm.exemplo.dev/hook" },
    });
  }

  it("envia para Telegram, e-mail (Resend) e webhook assinado com HMAC", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "tg-token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "42");
    vi.stubEnv("RESEND_API_KEY", "re-key");
    vi.stubEnv("RUBRICA_EMAIL_FROM", "Site <site@exemplo.dev>");
    vi.stubEnv("RUBRICA_WEBHOOK_SECRET", "segredo");
    const admin = await as(t, "admin");
    await configure(admin);
    const calls = mockFetch();
    vi.useFakeTimers();
    await post(t, "/rubrica/contato", contato({ message: "Olá <b>mundo</b>" }));
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(calls.map((c) => new URL(c.url).host).sort()).toEqual(["api.resend.com", "api.telegram.org", "crm.exemplo.dev"]);
    const tg = calls.find((c) => c.url.includes("telegram"))!;
    expect(tg.url).toBe("https://api.telegram.org/bottg-token/sendMessage");
    const tgBody = JSON.parse(tg.init.body as string);
    expect(tgBody).toMatchObject({ chat_id: "42", parse_mode: "HTML" });
    expect(tgBody.text).toContain("Olá &lt;b&gt;mundo&lt;/b&gt;");

    const mail = calls.find((c) => c.url.includes("resend"))!;
    expect((mail.init.headers as Record<string, string>).Authorization).toBe("Bearer re-key");
    expect(JSON.parse(mail.init.body as string)).toMatchObject({ to: ["dono@empresa.com"], reply_to: "maria@cliente.com", from: "Site <site@exemplo.dev>" });

    const hook = calls.find((c) => c.url.includes("crm"))!;
    const headers = hook.init.headers as Record<string, string>;
    const body = hook.init.body as string;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("segredo"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${headers["X-Rubrica-Timestamp"]}.${body}`)))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(headers["X-Rubrica-Signature"]).toBe(`sha256=${sig}`);
    expect(JSON.parse(body)).toMatchObject({ event: "contact.created", data: { name: "Maria Lima", email: "maria@cliente.com" } });

    const [doc] = await admin.query(api.rubrica.contacts.list, {});
    expect(doc?.deliveries.map((d) => d.status)).toEqual(["sent", "sent", "sent"]);
  });

  it("tenta de novo e, esgotadas as tentativas, deixa a falha visível; dá para reenviar", async () => {
    vi.stubEnv("RUBRICA_WEBHOOK_SECRET", "segredo");
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.contacts.setDestinations, { telegram: false, email: { enabled: false, to: [] }, webhook: { enabled: true, url: "https://crm.exemplo.dev/hook" } });
    const calls = mockFetch(() => 500);
    vi.useFakeTimers();
    await post(t, "/rubrica/contato", contato());
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(calls).toHaveLength(5);
    const failed = await admin.query(api.rubrica.contacts.failedDeliveries, {});
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({ destination: "webhook", status: "failed", attempts: 5 });
    expect(failed[0]!.lastError).toMatch(/Webhook: HTTP 500/);

    mockFetch(() => 200);
    await admin.mutation(api.rubrica.contacts.retryDelivery, { id: failed[0]!._id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await admin.query(api.rubrica.contacts.failedDeliveries, {})).toHaveLength(0);
  });

  it("destino sem a variável de ambiente falha com a explicação e o painel mostra o que falta", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.contacts.setDestinations, { telegram: true, email: { enabled: false, to: [] }, webhook: { enabled: false } });
    const info = await admin.query(api.rubrica.contacts.destinations, {});
    expect(info.missing.telegram).toEqual(["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]);
    expect(info.missing.email).toEqual(["RESEND_API_KEY", "RUBRICA_EMAIL_FROM"]);
    mockFetch();
    vi.useFakeTimers();
    await post(t, "/rubrica/contato", contato());
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const [failed] = await admin.query(api.rubrica.contacts.failedDeliveries, {});
    expect(failed?.lastError).toMatch(/Telegram não configurado/);
  });

  it("valida a configuração: webhook https e e-mails", async () => {
    const admin = await as(t, "admin");
    const base = { telegram: false, email: { enabled: false, to: [] as string[] } };
    await expect(admin.mutation(api.rubrica.contacts.setDestinations, { ...base, webhook: { enabled: true, url: "http://crm.dev" } })).rejects.toThrow(/https/);
    await expect(admin.mutation(api.rubrica.contacts.setDestinations, { ...base, webhook: { enabled: true } })).rejects.toThrow(/URL do webhook/);
    await expect(admin.mutation(api.rubrica.contacts.setDestinations, { telegram: false, email: { enabled: true, to: ["x"] }, webhook: { enabled: false } })).rejects.toThrow(/E-mail inválido/);
  });
});

describe("POST /rubrica/depoimento e aprovação", () => {
  const depoimento = (patch: Record<string, unknown> = {}) => ({
    name: "João Prado",
    email: "joao@cliente.com",
    role: "CTO",
    company: "Prado & Filhos",
    quote: "Trabalho excelente.",
    consent: true,
    locale: "en",
    blockId: "dep-1",
    page: "/en/depoimentos",
    ...patch,
  });

  it("entra como pendente, com consentimento; aprovar cria o item publicado com o texto no idioma", async () => {
    const res = await post(t, "/rubrica/depoimento", depoimento());
    expect(res.status).toBe(200);
    const editor = await as(t, "content-editor");
    const [sub] = await editor.query(api.rubrica.testimonialIntake.list, {});
    expect(sub).toMatchObject({ status: "pending", name: "João Prado", consent: { locale: "en", page: "/en/depoimentos" } });
    const id = await editor.mutation(api.rubrica.testimonialIntake.approve, { id: sub!._id });
    const item = await editor.query(api.rubrica.testimonials.get, { id });
    expect(item).toMatchObject({ quote: { en: "Trabalho excelente." }, author: "João Prado", role: { en: "CTO" }, company: "Prado & Filhos", published: true });
    expect(await editor.query(api.rubrica.testimonialIntake.list, {})).toHaveLength(0);
    expect(await editor.query(api.rubrica.testimonialIntake.list, { status: "approved" })).toHaveLength(1);
    await expect(editor.mutation(api.rubrica.testimonialIntake.approve, { id: sub!._id })).rejects.toThrow(/já foi aprovado/);
  });

  it("recusar apaga; comercial não modera", async () => {
    await post(t, "/rubrica/depoimento", depoimento());
    const comercial = await as(t, "comercial");
    await expect(comercial.query(api.rubrica.testimonialIntake.list, {})).rejects.toThrow(/Sem permissão/);
    const admin = await as(t, "admin");
    const [sub] = await admin.query(api.rubrica.testimonialIntake.list, {});
    await admin.mutation(api.rubrica.testimonialIntake.reject, { id: sub!._id });
    expect(await t.run((ctx) => ctx.db.query("testimonialSubmissions").collect())).toHaveLength(0);
  });

  it("mesmas proteções: consentimento, origem e um por semana por e-mail", async () => {
    expect((await post(t, "/rubrica/depoimento", depoimento({ consent: false }))).status).toBe(400);
    expect((await post(t, "/rubrica/depoimento", depoimento(), { Origin: "https://outro.dev" })).status).toBe(403);
    expect((await post(t, "/rubrica/depoimento", depoimento())).status).toBe(200);
    expect((await post(t, "/rubrica/depoimento", depoimento(), { "X-Forwarded-For": "198.51.100.1" })).status).toBe(429);
  });

  it("com o plugin desligado (padrão de empresa), 404", async () => {
    await seedSettings(t, { kind: "empresa" });
    expect((await post(t, "/rubrica/depoimento", depoimento())).status).toBe(404);
  });
});
