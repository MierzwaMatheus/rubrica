import { describe, expect, it } from "vitest";
import { digits, formatDays, resolveFreeHref, safeId, shorten, tagFilterCss } from "../src/components";
import type { PostItem, ProjectItem, RenderContext } from "../src";

const ctx = { href: (p: string) => `/en${p}` } as unknown as RenderContext;

describe("utilitários exportados em @rubrica/core/components", () => {
  it("formatDays, safeId, digits e shorten", () => {
    expect(formatDays("Mo-Fr", "pt-BR")).toMatch(/seg.*sex/);
    expect(formatDays("x", "pt-BR")).toBe("x");
    expect(safeId("a b/ç")).toBe("a_b__");
    expect(digits("+55 (11) 9")).toBe("55119");
    expect(shorten("um texto longo demais", 12)).toBe("um texto…");
  });

  it("resolveFreeHref prefixa só link interno", () => {
    expect(resolveFreeHref("/blog", ctx)).toEqual({ href: "/en/blog", external: false });
    expect(resolveFreeHref("https://x.com", ctx)).toEqual({ href: "https://x.com", external: true });
    expect(resolveFreeHref("#a", ctx)).toEqual({ href: "#a", external: false });
    expect(resolveFreeHref(undefined, ctx)).toBeUndefined();
  });

  it("tagFilterCss usa os seletores do núcleo por padrão e aceita os do tema", () => {
    const core = tagFilterCss("f-x", 2);
    expect(core).toContain('#f-x-t1:checked ~ .rb-posts__list > .rb-post:not([data-tags~="t1"]){display:none}');
    expect(core).toContain('#f-x-all:checked ~ .rb-filter label[for="f-x-all"]');
    const themed = tagFilterCss("s", 1, { items: ".ix-tablewrap tbody > tr", filter: ".ix-filter", checked: "color:red", focus: "outline:1px solid" });
    expect(themed).toContain('#s-t0:checked ~ .ix-tablewrap tbody > tr:not([data-tags~="t0"]){display:none}');
    expect(themed).toContain('#s-t0:checked ~ .ix-filter label[for="s-t0"]{color:red}');
    expect(themed).toContain('#s-all:focus-visible ~ .ix-filter label[for="s-all"]{outline:1px solid}');
  });

  it("os tipos de item de coleção saem da raiz do pacote", () => {
    const post: Pick<PostItem, "title"> = { title: "t" };
    const project: Pick<ProjectItem, "slug"> = { slug: "s" };
    expect([post.title, project.slug]).toEqual(["t", "s"]);
  });
});
