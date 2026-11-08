/** WhatsApp e faixa de aviso: funções puras, montagem do site (por idioma e no build) e HTML. */
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureSource, type SiteSnapshot } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell, resolveFreeHref, SiteAnnouncement, siteWideAttributes, WhatsAppFloat } from "../src/components";
import { buildHead } from "../src/seo/head";
import {
  announcementActive,
  announcementTime,
  isWhatsAppNumber,
  normalizeWhatsAppNumber,
  resolveWhatsAppHref,
  siteWhatsAppNumber,
  whatsAppUrl,
} from "../src/render/sitewide";
import type { Announcement } from "../src/content/types";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const fixtures = (kind: string) => fileURLToPath(new URL(`../../../apps/demo/fixtures/${kind}`, import.meta.url));
const load = async (kind = "pessoal") => fixtureSource(fixtures(kind)).load();
const build = (snapshot: SiteSnapshot, now?: number) => buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS, ...(now !== undefined && { now }) });

const WHATSAPP = { number: "5511912345678", floating: true, message: { "pt-BR": "Olá! Vim pelo site.", en: "Hi! I found you on the site." } };
const NOV_20 = Date.UTC(2026, 10, 20, 12);

describe("WhatsApp: funções puras", () => {
  it("normaliza e confere o número", () => {
    expect(normalizeWhatsAppNumber("+55 (11) 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsAppNumber("00 351 912 345 678")).toBe("351912345678");
    expect(isWhatsAppNumber("5511912345678")).toBe(true);
    expect(isWhatsAppNumber("011912345678")).toBe(false);
    expect(isWhatsAppNumber("1234567")).toBe(false);
  });

  it("monta o wa.me com a mensagem codificada", () => {
    expect(whatsAppUrl("5511912345678")).toBe("https://wa.me/5511912345678");
    expect(whatsAppUrl("5511912345678", "Olá & até já?")).toBe("https://wa.me/5511912345678?text=Ol%C3%A1%20%26%20at%C3%A9%20j%C3%A1%3F");
    expect(whatsAppUrl("5511912345678", "  ")).toBe("https://wa.me/5511912345678");
  });

  it("whatsapp: usa a mensagem padrão; whatsapp:<texto> troca a mensagem; sem número, nada", () => {
    expect(resolveWhatsAppHref("whatsapp:", "5511912345678", "Oi")).toBe("https://wa.me/5511912345678?text=Oi");
    expect(resolveWhatsAppHref("WhatsApp:Quero o plano Pro", "5511912345678", "Oi")).toBe("https://wa.me/5511912345678?text=Quero%20o%20plano%20Pro");
    expect(resolveWhatsAppHref("whatsapp:Quero%20o%20plano", "5511912345678", undefined)).toBe("https://wa.me/5511912345678?text=Quero%20o%20plano");
    expect(resolveWhatsAppHref("whatsapp:", undefined, "Oi")).toBeUndefined();
  });

  it("número do site: o do WhatsApp, senão o da pessoa ou da empresa", () => {
    expect(siteWhatsAppNumber({ whatsapp: { number: "5511912345678", floating: false }, organization: { whatsapp: "5521900000000" } })).toBe("5511912345678");
    expect(siteWhatsAppNumber({ organization: { whatsapp: "+55 21 90000-0000" } })).toBe("5521900000000");
    expect(siteWhatsAppNumber({ organization: { whatsapp: "ligue já" } })).toBeUndefined();
  });
});

describe("faixa de aviso: período avaliado no build", () => {
  const base: Announcement = { enabled: true, text: { "pt-BR": "Aviso" } };

  it("dia inteiro em UTC, ou data e hora com fuso", () => {
    expect(announcementTime("2026-11-20", "start")).toBe(Date.UTC(2026, 10, 20));
    expect(announcementTime("2026-11-20", "end")).toBe(Date.UTC(2026, 10, 21) - 1);
    expect(announcementTime("2026-11-20T09:00-03:00", "start")).toBe(Date.UTC(2026, 10, 20, 12));
    expect(announcementTime("2026-11-20T09:00", "start")).toBeUndefined();
    expect(announcementTime("2026-02-30", "start")).toBeUndefined();
  });

  it("desligado, antes do início ou depois do fim: fora do ar", () => {
    expect(announcementActive(base, NOV_20)).toBe(true);
    expect(announcementActive({ ...base, enabled: false }, NOV_20)).toBe(false);
    expect(announcementActive({ ...base, startsAt: "2026-11-21" }, NOV_20)).toBe(false);
    expect(announcementActive({ ...base, endsAt: "2026-11-19" }, NOV_20)).toBe(false);
    expect(announcementActive({ ...base, startsAt: "2026-11-20", endsAt: "2026-11-20" }, NOV_20)).toBe(true);
    expect(announcementActive(undefined, NOV_20)).toBe(false);
  });
});

describe("montagem do site", () => {
  it("ctx.site.whatsapp traz o wa.me com a mensagem do idioma", async () => {
    const snapshot = await load();
    snapshot.site.whatsapp = { ...WHATSAPP, label: { "pt-BR": "Fale comigo" } };
    const s = build(snapshot);
    expect(s.context("pt-BR", "/").site.whatsapp).toEqual({
      number: "5511912345678",
      href: "https://wa.me/5511912345678?text=Ol%C3%A1!%20Vim%20pelo%20site.",
      floating: true,
      label: "Fale comigo",
    });
    // Sem rótulo em inglês: o botão fica só com o ícone (e o nome acessível padrão).
    expect(s.context("en", "/en").site.whatsapp).toEqual({ number: "5511912345678", href: "https://wa.me/5511912345678?text=Hi!%20I%20found%20you%20on%20the%20site.", floating: true });
  });

  it("links whatsapp: nos campos e no menu viram o wa.me; sem WhatsApp, somem", async () => {
    const snapshot = await load();
    const home = snapshot.pages.find((p) => p.path === "/")!;
    home.blocks.unshift({ id: "wa", type: "cta", visible: true, fields: { title: { "pt-BR": "Bora?", en: "Shall we?" }, primary: { label: { "pt-BR": "Chamar no WhatsApp", en: "WhatsApp me" }, href: "whatsapp:" } } });
    snapshot.site.navigation.push({ label: { "pt-BR": "WhatsApp", en: "WhatsApp" }, href: "whatsapp:Oi, vim pelo menu" });

    const without = build(structuredClone(snapshot));
    const ctxOff = without.context("pt-BR", "/");
    expect(ctxOff.site.navigation.some((n) => n.label === "WhatsApp")).toBe(false);
    expect(ctxOff.href("whatsapp:")).toBe("");
    expect(resolveFreeHref("whatsapp:", ctxOff)).toBeUndefined();
    const ctaOff = without.routes.find((r) => r.url === "/" && r.type === "page");
    if (ctaOff?.type !== "page") throw new Error("home ausente");
    expect(ctaOff.page.blocks.find((b) => b.id === "wa")?.fields.primary).toBeUndefined();

    snapshot.site.whatsapp = WHATSAPP;
    const on = build(snapshot);
    const route = on.routes.find((r) => r.url === "/en" && r.type === "page");
    if (route?.type !== "page") throw new Error("home ausente");
    expect(route.page.blocks.find((b) => b.id === "wa")?.fields.primary).toEqual({
      label: "WhatsApp me",
      href: "https://wa.me/5511912345678?text=Hi!%20I%20found%20you%20on%20the%20site.",
      external: true,
    });
    const ctx = on.context("pt-BR", "/");
    expect(ctx.site.navigation.find((n) => n.label === "WhatsApp")?.href).toBe("https://wa.me/5511912345678?text=Oi%2C%20vim%20pelo%20menu");
    expect(resolveFreeHref("whatsapp:", ctx)).toEqual({ href: "https://wa.me/5511912345678?text=Ol%C3%A1!%20Vim%20pelo%20site.", external: true });
  });

  it("o aviso só existe nos idiomas com texto e dentro do período do build", async () => {
    const snapshot = await load();
    snapshot.site.announcement = {
      enabled: true,
      text: { "pt-BR": "Agenda aberta para dezembro" },
      link: { label: { "pt-BR": "Ver datas", en: "See dates" }, href: "/contato" },
      tone: "destaque",
      startsAt: "2026-11-01",
      endsAt: "2026-11-30",
    };
    const s = build(snapshot, NOV_20);
    expect(s.context("pt-BR", "/").site.announcement).toEqual({ text: "Agenda aberta para dezembro", tone: "destaque", link: { label: "Ver datas", href: "/contato", external: false } });
    // Sem texto em inglês, nada de cair no português (decisão 28).
    expect(s.context("en", "/en").site.announcement).toBeUndefined();
    expect(build(snapshot, Date.UTC(2026, 11, 1)).context("pt-BR", "/").site.announcement).toBeUndefined();
  });

  it("link do aviso sem rótulo no idioma sai; o texto fica", async () => {
    const snapshot = await load();
    snapshot.site.announcement = { enabled: true, text: { "pt-BR": "Aviso", en: "Notice" }, link: { label: { "pt-BR": "Ver" }, href: "/contato" } };
    expect(build(snapshot).context("en", "/en").site.announcement).toEqual({ text: "Notice", tone: "info" });
  });

  it("JSON-LD da empresa ganha o WhatsApp como canal de atendimento", async () => {
    const snapshot = await load("empresa");
    snapshot.site.whatsapp = { number: "5511912345678", floating: false };
    const s = build(snapshot);
    const home = s.routes.find((r) => r.url === "/")!;
    const ld = buildHead(home, s.settings, s.context(home.locale, home.url, home.alternates)).find((t) => t.attrs?.type === "application/ld+json")!;
    const graph = JSON.parse(ld.content!)["@graph"] as Record<string, unknown>[];
    const org = graph.find((n) => n["@id"] === "https://empresa.userubrica.dev/#organization") ?? graph.find((n) => String(n["@id"]).endsWith("#organization"));
    expect(org?.contactPoint).toEqual([{ "@type": "ContactPoint", contactType: "customer service", telephone: "+5511912345678", url: "https://wa.me/5511912345678" }]);
  });
});

describe("HTML do aviso e do botão", () => {
  async function ctxWith(patch: Partial<SiteSnapshot["site"]>, kind = "pessoal") {
    const snapshot = await load(kind);
    Object.assign(snapshot.site, patch);
    return build(snapshot).context("pt-BR", "/");
  }

  it("aviso é uma região com rótulo; link externo avisa que abre em nova aba", async () => {
    const ctx = await ctxWith({ announcement: { enabled: true, text: { "pt-BR": "Novo curso" }, link: { label: { "pt-BR": "Inscreva-se" }, href: "https://exemplo.dev/curso" } } });
    const html = renderToStaticMarkup(<SiteAnnouncement ctx={ctx} />);
    expect(html).toContain('<section class="rb-announcement" data-tone="info" aria-label="Aviso">');
    expect(html).toContain('href="https://exemplo.dev/curso" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain("(abre em nova aba)");
    expect(siteWideAttributes(ctx)).toEqual({ "data-announcement": "info" });
  });

  it("sem aviso nem botão flutuante, nada vai ao HTML", async () => {
    const ctx = await ctxWith({ whatsapp: { ...WHATSAPP, floating: false } });
    expect(renderToStaticMarkup(<SiteAnnouncement ctx={ctx} />)).toBe("");
    expect(renderToStaticMarkup(<WhatsAppFloat ctx={ctx} />)).toBe("");
    expect(siteWideAttributes(ctx)).toEqual({});
  });

  it("botão flutuante: nova aba segura, nome acessível e texto na voz do tipo do site", async () => {
    const pessoal = renderToStaticMarkup(<WhatsAppFloat ctx={await ctxWith({ whatsapp: WHATSAPP })} />);
    expect(pessoal).toContain('<aside class="rb-whatsapp" aria-label="WhatsApp">');
    expect(pessoal).toContain('target="_blank" rel="noopener noreferrer"');
    expect(pessoal).toContain('<span class="rb-sr-only">Conversar comigo no WhatsApp</span>');
    expect(pessoal).toContain('aria-hidden="true"');
    const empresa = renderToStaticMarkup(<WhatsAppFloat ctx={await ctxWith({ whatsapp: WHATSAPP }, "empresa")} />);
    expect(empresa).toContain("Fale conosco no WhatsApp");
    const labelled = renderToStaticMarkup(<WhatsAppFloat ctx={await ctxWith({ whatsapp: { ...WHATSAPP, label: { "pt-BR": "Orçamento" } } })} />);
    expect(labelled).toContain('<span class="rb-whatsapp__label">Orçamento</span>');
    expect(labelled).not.toContain("Conversar comigo");
  });
});
