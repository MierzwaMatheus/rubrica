import { describe, expect, it } from "vitest";
import { isShowcasePath, SHOWCASE_PREFIX } from "../src/build.ts";
import { pickTargets } from "../src/lighthouse.ts";

describe("vitrine", () => {
  it("reconhece só as páginas sob /vitrine", () => {
    expect(SHOWCASE_PREFIX).toBe("/vitrine");
    expect(isShowcasePath("/vitrine")).toBe(true);
    expect(isShowcasePath("/vitrine/hero")).toBe(true);
    expect(isShowcasePath("/vitrine/receita/sobre")).toBe(true);
    expect(isShowcasePath("/vitrines")).toBe(false);
    expect(isShowcasePath("/blog/vitrine")).toBe(false);
  });

  it("fora do Lighthouse: sem as páginas da vitrine, a home continua sendo a home do site", () => {
    const paths = ["/vitrine/receita", "/vitrine/hero", "/", "/blog/a", "/portfolio/b"].filter((p) => !isShowcasePath(p));
    expect(pickTargets(paths).targets.map((t) => t.path)).toEqual(["/", "/blog/a", "/portfolio/b"]);
  });
});
