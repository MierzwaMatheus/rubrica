// @vitest-environment edge-runtime
/** WhatsApp e faixa de aviso nas configurações: normalização, validação e snapshot. */
import { beforeEach, describe, expect, it } from "vitest";
import { api, as, seedSettings, setup, type T } from "./_setup";

describe("configurações do site inteiro (WhatsApp e aviso)", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("normaliza o número do WhatsApp para só dígitos e o expõe no snapshot", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.settings.update, {
      patch: { whatsapp: { number: "+55 (11) 91234-5678", floating: true, message: { "pt-BR": "Olá!", en: " " } } },
    });
    const snapshot = await t.query(api.rubrica.site.snapshot, {});
    // Texto vazio num idioma sai (o idioma fica sem tradução).
    expect(snapshot.site.whatsapp).toEqual({ number: "5511912345678", floating: true, message: { "pt-BR": "Olá!" } });
  });

  it("aceita o prefixo internacional 00", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.settings.update, { patch: { whatsapp: { number: "00 351 912 345 678", floating: false } } });
    expect((await t.query(api.rubrica.site.snapshot, {})).site.whatsapp?.number).toBe("351912345678");
  });

  it.each([
    ["curto demais", "1234"],
    ["sem dígitos", "whatsapp"],
    ["com zero no DDI", "0 11 91234-5678"],
    ["longo demais", "1234567890123456"],
  ])("recusa número %s", async (_label, number) => {
    const admin = await as(t, "admin");
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { whatsapp: { number, floating: true } } })).rejects.toThrow(/WhatsApp inválido/);
  });

  it("limita a mensagem e o texto do botão", async () => {
    const admin = await as(t, "admin");
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { whatsapp: { number: "5511912345678", floating: true, message: { "pt-BR": "a".repeat(501) } } } })).rejects.toThrow(/500/);
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { whatsapp: { number: "5511912345678", floating: true, label: { "pt-BR": "a".repeat(41) } } } })).rejects.toThrow(/40/);
  });

  it("grava o aviso com link, tom e período e o expõe no snapshot", async () => {
    const admin = await as(t, "admin");
    const announcement = {
      enabled: true,
      text: { "pt-BR": "Agenda aberta para dezembro", en: "Booking open for December" },
      link: { label: { "pt-BR": "Ver datas" }, href: "/contato" },
      tone: "destaque" as const,
      startsAt: "2026-11-01",
      endsAt: "2026-12-15T18:00-03:00",
    };
    await admin.mutation(api.rubrica.settings.update, { patch: { announcement } });
    expect((await t.query(api.rubrica.site.snapshot, {})).site.announcement).toEqual(announcement);
  });

  it("recusa aviso ligado sem texto, mas guarda o rascunho desligado", async () => {
    const admin = await as(t, "admin");
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "  " } } } })).rejects.toThrow(/sem texto/);
    await admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: false, text: {} } } });
    expect((await t.query(api.rubrica.site.snapshot, {})).site.announcement).toEqual({ enabled: false, text: {} });
  });

  it.each([
    ["data sem fuso", { startsAt: "2026-12-01T09:00" }, /Início do aviso inválido/],
    ["dia que não existe", { endsAt: "2026-02-30" }, /Fim do aviso inválido/],
    ["fim antes do início", { startsAt: "2026-12-10", endsAt: "2026-12-09" }, /termina antes de começar/],
  ])("recusa %s", async (_label, dates, error) => {
    const admin = await as(t, "admin");
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "Aviso" }, ...dates } } })).rejects.toThrow(error);
  });

  it("aceita início e fim no mesmo dia", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "Hoje" }, startsAt: "2026-12-10", endsAt: "2026-12-10" } } });
    expect((await t.query(api.rubrica.site.snapshot, {})).site.announcement?.endsAt).toBe("2026-12-10");
  });

  it("recusa texto longo e link sem endereço", async () => {
    const admin = await as(t, "admin");
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "a".repeat(201) } } } })).rejects.toThrow(/200/);
    await expect(admin.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "Aviso" }, link: { label: { "pt-BR": "Ver" }, href: " " } } } })).rejects.toThrow(/sem endereço/);
  });

  it("unset apaga o WhatsApp e o aviso; campo obrigatório não se apaga", async () => {
    const admin = await as(t, "admin");
    await admin.mutation(api.rubrica.settings.update, { patch: { whatsapp: { number: "5511912345678", floating: true }, announcement: { enabled: false, text: {} } } });
    await admin.mutation(api.rubrica.settings.update, { patch: {}, unset: ["whatsapp", "announcement"] });
    const { site } = await t.query(api.rubrica.site.snapshot, {});
    expect(site.whatsapp).toBeUndefined();
    expect(site.announcement).toBeUndefined();
    await expect(admin.mutation(api.rubrica.settings.update, { patch: {}, unset: ["url"] })).rejects.toThrow(/não pode ser apagado/);
  });

  it("editor de conteúdo não muda as configurações", async () => {
    const editor = await as(t, "content-editor");
    await expect(editor.mutation(api.rubrica.settings.update, { patch: { announcement: { enabled: true, text: { "pt-BR": "Aviso" } } } })).rejects.toThrow();
  });
});
