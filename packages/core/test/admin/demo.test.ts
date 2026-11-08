import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../../src/data/source";
import { createDemoStore, DEMO_CREDENTIALS } from "../../src/admin/data/demo";
import { api } from "../../src/admin/data/api";

const fixtures = fileURLToPath(new URL("../../../../apps/demo/fixtures/pessoal", import.meta.url));

async function store() {
  const s = createDemoStore({ snapshot: await fixtureSource(fixtures).load() });
  s.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
  return s;
}

describe("backend de demonstração do painel", () => {
  it("exige login e confere a senha", async () => {
    const s = createDemoStore({ snapshot: await fixtureSource(fixtures).load() });
    expect(() => s.query(api.pages.list, {})).toThrow(/Não autenticado/);
    expect(() => s.signIn(DEMO_CREDENTIALS.email, "errada")).toThrow();
    s.signIn(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(s.query(api.users.me, {})).toMatchObject({ role: "root" });
  });

  it("valida os blocos com as regras do backend e grava o rascunho", async () => {
    const s = await store();
    const home = (s.query(api.pages.list, {}) as { _id: string; path: string }[]).find((p) => p.path === "/")!;
    const bad = [{ id: "x", type: "cta", visible: true, fields: {} }];
    expect((s.query(api.panel.validatePage, { blocks: bad }) as { blockErrors: unknown[] }).blockErrors.length).toBeGreaterThan(0);
    expect(() => s.mutate(api.pages.update, { id: home._id, blocks: bad })).toThrow(/Página inválida/);
    s.mutate(api.pages.update, { id: home._id, blocks: [{ id: "t", type: "texto", visible: true, fields: { body: { "pt-BR": "<p onclick=\"x\">Oi</p>" } } }] });
    const saved = s.query(api.pages.get, { id: home._id }) as { blocks: { fields: Record<string, unknown> }[] };
    expect(saved.blocks[0]!.fields.body).toEqual({ "pt-BR": "<p>Oi</p>" });
  });

  it("o snapshot só leva o publicado; função ausente dá o erro do Convex", async () => {
    const s = await store();
    const id = s.mutate(api.pages.create, { path: "/rascunho", title: { "pt-BR": "Rascunho" } }) as string;
    expect((s.query(api.site.snapshot, {}) as { pages: { id: string }[] }).pages.map((p) => p.id)).not.toContain(id);
    s.mutate(api.pages.publish, { id });
    expect((s.query(api.site.snapshot, {}) as { pages: { id: string }[] }).pages.map((p) => p.id)).toContain(id);
    expect(() => s.act(api.users.remove as never, {})).toThrow(/Could not find public function/);
  });

  it("WhatsApp e aviso: normaliza, confere e apaga como o backend", async () => {
    const s = await store();
    s.mutate(api.settings.update, { patch: { whatsapp: { number: "+55 (11) 91234-5678", floating: true } } });
    expect((s.query(api.settings.get, {}) as { whatsapp?: { number: string } }).whatsapp?.number).toBe("5511912345678");
    expect(() => s.mutate(api.settings.update, { patch: { whatsapp: { number: "123", floating: true } } })).toThrow(/WhatsApp inválido/);
    expect(() => s.mutate(api.settings.update, { patch: { announcement: { enabled: true, text: {}, startsAt: "amanhã" } } })).toThrow(/sem texto/);
    s.mutate(api.settings.update, { patch: {}, unset: ["whatsapp"] });
    expect((s.query(api.settings.get, {}) as { whatsapp?: unknown }).whatsapp).toBeUndefined();
  });

  it("respeita papéis: editor não mexe em configurações técnicas nem em usuários", async () => {
    const s = await store();
    s.signOut();
    s.signIn("editora@rubrica.dev", "Editora2026!x");
    expect(() => s.query(api.users.list, {})).toThrow(/Sem permissão/);
    expect(() => s.mutate(api.settings.update, { patch: { url: "https://x.dev" } })).toThrow(/Sem permissão/);
  });
});
