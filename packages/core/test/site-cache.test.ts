/** Cache do site montado (`astro/site-cache.ts`): uma carga até invalidar; falha não fica guardada. */
import { describe, expect, it, vi } from "vitest";
import { siteCache } from "../src/astro/site-cache";

describe("siteCache", () => {
  it("carrega uma vez e reaproveita entre chamadas (o build)", async () => {
    const load = vi.fn(async () => ({ n: 1 }));
    const cache = siteCache(load);
    const [a, b] = await Promise.all([cache.get(), cache.get()]);
    expect(await cache.get()).toBe(a);
    expect(b).toBe(a);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("depois de invalidate(), a próxima chamada carrega de novo (o dev, quando o conteúdo muda)", async () => {
    let n = 0;
    const cache = siteCache(async () => ({ n: ++n }));
    expect((await cache.get()).n).toBe(1);
    cache.invalidate();
    expect((await cache.get()).n).toBe(2);
    expect((await cache.get()).n).toBe(2);
  });

  it("não guarda uma carga que falhou", async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("Convex fora")).mockResolvedValue("ok");
    const cache = siteCache(load);
    await expect(cache.get()).rejects.toThrow("Convex fora");
    expect(await cache.get()).toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("uma falha antiga não apaga a carga nova feita depois de invalidate()", async () => {
    let reject!: (e: Error) => void;
    const load = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(() => new Promise((_, r) => (reject = r)))
      .mockResolvedValue("novo");
    const cache = siteCache(load);
    const first = cache.get();
    cache.invalidate();
    const second = cache.get();
    reject(new Error("antiga"));
    await expect(first).rejects.toThrow("antiga");
    expect(await second).toBe("novo");
    expect(cache.get()).toBe(second);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
