/** Paridade com a v1: capa padrão de post, ícones e manifest, theme-color, RSS e analytics. */
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell } from "../src/components";
import { buildHead } from "../src/seo/head";
import type { SiteSnapshot } from "../src/data/source";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
const fixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/pessoal", import.meta.url));

async function built(edit: (s: SiteSnapshot) => void = () => {}) {
  const snapshot = await fixtureSource(fixtures).load();
  edit(snapshot);
  return buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
}

const headOf = (s: Awaited<ReturnType<typeof built>>, url: string) => {
  const route = s.routes.find((r) => r.url === url)!;
  return buildHead(route, s.settings, s.context(route.locale, route.url, route.alternates));
};

describe("capa padrão de post", () => {
  it("post sem capa recebe a das configurações (marcada) e ela vira o og:image; com capa, fica a dele", async () => {
    const s = await built((snap) => (snap.site.defaultPostCover = { url: "/img/capa-padrao.png", width: 1200, height: 630, alt: { "pt-BR": "Marca" } }));
    const route = s.routes.find((r) => r.url === "/blog/so-portugues");
    if (route?.type !== "post") throw new Error("rota ausente");
    expect(route.post.cover).toEqual({ src: "/img/capa-padrao.png", alt: "Marca", width: 1200, height: 630 });
    expect(route.post.defaultCover).toBe(true);
    expect(headOf(s, "/blog/so-portugues").find((t) => t.attrs?.property === "og:image")?.attrs?.content).toBe("https://demo.userubrica.dev/img/capa-padrao.png");

    const own = s.routes.find((r) => r.url === "/blog/pesquisa-com-usuarios");
    if (own?.type !== "post") throw new Error("rota ausente");
    expect(own.post.cover?.src).not.toBe("/img/capa-padrao.png");
    expect(own.post.defaultCover).toBeUndefined();

    // Os blocos de lista recebem os itens já com a capa padrão.
    const home = s.routes.find((r) => r.url === "/");
    if (home?.type !== "page") throw new Error("rota ausente");
    const items = home.page.blocks.find((b) => b.type === "posts-recentes")!.items as { slug: string; cover?: { src: string } }[];
    expect(items.find((p) => p.slug === "so-portugues")?.cover?.src).toBe("/img/capa-padrao.png");
  });

  it("sem capa padrão, post sem capa continua sem capa", async () => {
    const route = (await built()).routes.find((r) => r.url === "/blog/so-portugues");
    if (route?.type !== "post") throw new Error("rota ausente");
    expect(route.post.cover).toBeUndefined();
  });
});

