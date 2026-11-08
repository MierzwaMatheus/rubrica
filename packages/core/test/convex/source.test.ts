import { describe, expect, it } from "vitest";
import { getFunctionName } from "convex/server";
import { convexSource, resolveConvexUrl, SNAPSHOT_FUNCTION } from "../../src/data/convex";
import { emptyCollections, type SiteSnapshot } from "../../src/data/source";
import { BASE_SETTINGS } from "./_setup";

describe("convexSource", () => {
  it("usa a url informada, senão CONVEX_URL, senão VITE_CONVEX_URL", () => {
    expect(resolveConvexUrl("https://a.convex.cloud", { CONVEX_URL: "https://b.convex.cloud" })).toBe("https://a.convex.cloud");
    expect(resolveConvexUrl(null, { CONVEX_URL: "https://b.convex.cloud", VITE_CONVEX_URL: "https://c.convex.cloud" })).toBe("https://b.convex.cloud");
    expect(resolveConvexUrl(null, { VITE_CONVEX_URL: "https://c.convex.cloud" })).toBe("https://c.convex.cloud");
    expect(() => resolveConvexUrl(null, {})).toThrow(/CONVEX_URL/);
  });

  it("lê o snapshot da query rubrica/site:snapshot", async () => {
    const snapshot: SiteSnapshot = { site: BASE_SETTINGS, pages: [], texts: {}, collections: emptyCollections() };
    const calls: string[] = [];
    const source = convexSource(null, {
      client: {
        async query(ref, args) {
          calls.push(`${getFunctionName(ref)} ${JSON.stringify(args)}`);
          return snapshot;
        },
      },
    });
    expect(await source.load()).toBe(snapshot);
    expect(calls).toEqual([`${SNAPSHOT_FUNCTION} {}`]);
  });

  it("explica a falha sem endereço ou na leitura", async () => {
    await expect(convexSource(null, { env: {} }).load()).rejects.toThrow(/endereço do Convex ausente/);
    const failing = convexSource("https://x.convex.cloud", {
      client: {
        async query() {
          throw new Error("Could not find public function");
        },
      },
    });
    await expect(failing.load()).rejects.toThrow(/não foi possível ler o conteúdo do Convex.*Could not find public function/);
  });
});
