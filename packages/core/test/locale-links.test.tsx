import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell, LocaleLinks, localeCode } from "../src/components";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const fixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/pessoal", import.meta.url));

describe("seletor de idioma", () => {
  it("código curto; código inteiro quando duas variantes da mesma língua", () => {
    expect(localeCode("pt-BR", ["pt-BR", "en"])).toBe("PT");
    expect(localeCode("en")).toBe("EN");
    expect(localeCode("pt-BR", ["pt-BR", "pt-PT"])).toBe("PT-BR");
  });

  it("compacto mostra o código e mantém o nome completo no nome acessível", async () => {
    const site = buildSite({ snapshot: await fixtureSource(fixtures).load(), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    const route = site.routes.find((r) => r.url === "/sobre")!;
    const ctx = site.context(route.locale, route.url, route.alternates);
    const full = renderToStaticMarkup(createElement(LocaleLinks, { ctx }));
    expect(full).toContain(">English</a>");
    const compact = renderToStaticMarkup(createElement(LocaleLinks, { ctx, compact: true }));
    expect(compact).toContain('class="rb-locales rb-locales--compact"');
    expect(compact).toContain('<span class="rb-sr-only">English </span>EN</a>');
    expect(compact).toContain('<span class="rb-sr-only">Português (Brasil) </span>PT</a>');
  });
});
