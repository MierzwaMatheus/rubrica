/** Números do case (`metrics`), o próximo case, o carrossel das telas e o template padrão. */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaseMetrics, DefaultCase, LucideIcon, lucideIcon } from "../src/components";
import { resolveProject, type ProjectItem } from "../src/render/collections";
import { nextCase } from "../src/render/site";
import type { RawProject } from "../src/content/types";
import type { ResolveOptions } from "../src/render/resolve";
import Carrossel from "../src/islands/carrossel";

const opts = (locale: string): ResolveOptions => ({ locale, locales: { locales: ["pt-BR", "en"], default: "pt-BR" } });

const raw: RawProject = {
  id: "p",
  slug: "p",
  title: { "pt-BR": "Case", en: "Case" },
  metrics: [
    { value: "~50", label: { "pt-BR": "Skills em produção", en: "Skills in production" }, icon: "Package" },
    { value: "3", label: { "pt-BR": "Sistemas" } },
  ],
};

describe("números do case", () => {
  it("resolve no idioma, com ícone opcional; sem rótulo no idioma, o número sai", () => {
    expect(resolveProject(raw, opts("pt-BR"))?.metrics).toEqual([
      { value: "~50", label: "Skills em produção", icon: "Package" },
      { value: "3", label: "Sistemas" },
    ]);
    expect(resolveProject(raw, opts("en"))?.metrics).toEqual([{ value: "~50", label: "Skills in production", icon: "Package" }]);
    expect(resolveProject({ ...raw, metrics: undefined }, opts("pt-BR"))?.metrics).toEqual([]);
  });

  it("sem número de destaque, o card usa o primeiro número; com ele, o próprio", () => {
    expect(resolveProject(raw, opts("pt-BR"))?.metric).toEqual({ value: "~50", label: "Skills em produção" });
    const own = { ...raw, metric: { value: "9", label: { "pt-BR": "clientes" } } };
    expect(resolveProject(own, opts("pt-BR"))?.metric).toEqual({ value: "9", label: "clientes" });
  });

  it("CaseMetrics: h2 próprio, ícone do Lucide pelo nome e nada sem números", () => {
    const html = renderToStaticMarkup(<CaseMetrics metrics={resolveProject(raw, opts("pt-BR"))!.metrics} title="Resultados em números" />);
    expect(html).toContain("<h2 class=\"rb-case__metricsTitle\">Resultados em números</h2>");
    expect(html.match(/<svg/g)).toHaveLength(1);
    expect(html).toContain("<strong class=\"rb-case__metricValue\">~50</strong>");
    expect(renderToStaticMarkup(<CaseMetrics metrics={[]} title="x" />)).toBe("");
  });

  it("ícone por nome em PascalCase, kebab-case ou nome antigo; desconhecido não desenha", () => {
    expect(lucideIcon("ShieldCheck")).toBeDefined();
    expect(lucideIcon("shield-check")).toBe(lucideIcon("ShieldCheck"));
    expect(lucideIcon("Building2")).toBeDefined();
    expect(lucideIcon("NaoExiste")).toBeUndefined();
    expect(lucideIcon("")).toBeUndefined();
    expect(renderToStaticMarkup(<LucideIcon name="Bot" />)).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<LucideIcon name="zzz" />)).toBe("");
  });
});

describe("próximo case", () => {
  const p = (id: string, withCase = true) => ({ id, sections: [], hasCase: withCase }) as unknown as ProjectItem;
  const list = [p("a"), p("b", false), p("c"), p("d")];

  it("o seguinte com case, com volta ao início, pulando os sem case", () => {
    expect(nextCase(list, "a")?.id).toBe("c");
    expect(nextCase(list, "d")?.id).toBe("a");
  });

  it("projeto sem case aponta para o primeiro; com um só case, não há próximo", () => {
    expect(nextCase(list, "b")?.id).toBe("a");
    expect(nextCase([p("a"), p("b", false)], "a")).toBeUndefined();
  });
});

describe("ilha do carrossel", () => {
  const texts = { "case.gallery": "Telas", "gallery.expand": "Expandir imagem", "gallery.prev": "Imagem anterior", "gallery.next": "Próxima imagem" };

  it("antes de hidratar: a faixa rolável com as imagens, sem botões", () => {
    const html = renderToStaticMarkup(<Carrossel images={[{ src: "/a.png", alt: "" }, { src: "/b.png", alt: "Tela B" }]} title="Rubrica" texts={texts} />);
    expect(html).toContain('aria-label="Telas"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('alt="Rubrica – 1"');
    expect(html).toContain('alt="Tela B"');
    expect(html).not.toContain("<button");
    // Imagens preguiçosas: sem o <link rel=preload> do React antes da faixa, a ilha começa pela própria faixa (client:visible).
    expect(html.startsWith("<div class=\"rb-carousel\"")).toBe(true);
  });

  it("sem imagens, nada", () => {
    expect(renderToStaticMarkup(<Carrossel images={[]} title="x" texts={texts} />)).toBe("");
  });
});

describe("template de case padrão", () => {
  const ctx = { t: (k: string) => k, href: (p: string) => p, formatDate: (d: string) => d } as unknown as Parameters<typeof DefaultCase>[0]["ctx"];
  const project = { ...resolveProject({ ...raw, sections: [{ title: { "pt-BR": "Antiga" }, body: { "pt-BR": "<p>x</p>" } }] }, opts("pt-BR"))!, content: "<p>Texto antigo</p>" };

  it("desenha o corpo do slot blocks, entre o cabeçalho e os números", () => {
    const html = renderToStaticMarkup(<DefaultCase project={project} related={[]} ctx={ctx} blocks={<section className="rb-section">Corpo</section>} />);
    expect(html).toContain('<div class="rb-case__body"><section class="rb-section">Corpo</section></div>');
    expect(html.indexOf("rb-case__body")).toBeLessThan(html.indexOf("rb-case__metrics"));
    // content e sections não são mais lidos pelo template: chegam como blocos.
    expect(html).not.toContain("Texto antigo");
    expect(html).not.toContain("Antiga");
  });

  it("sem corpo, sem o wrapper", () => {
    expect(renderToStaticMarkup(<DefaultCase project={project} related={[]} ctx={ctx} />)).not.toContain("rb-case__body");
  });
});
