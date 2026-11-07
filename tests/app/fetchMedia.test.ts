// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MEDIA_VERSION,
  findStorageUrls,
  kindFromContentType,
  rewriteStorageUrls,
  withRetry,
} from "../../scripts/lib/media";
import { runFetchMedia, type ImageProcessor } from "../../scripts/lib/fetchMedia";
import { absoluteUrl, shareVariant } from "@/lib/mediaPath";

const ID_A = "11111111-1111-1111-1111-111111111111";
const ID_B = "22222222-2222-2222-2222-222222222222";
const ID_VIDEO = "33333333-3333-3333-3333-333333333333";
const ID_SVG = "44444444-4444-4444-4444-444444444444";
const url = (id: string) => `https://happy-cat-123.convex.cloud/api/storage/${id}`;

describe("media — funções puras", () => {
  it("acha as URLs do storage com o storageId", () => {
    const text = JSON.stringify({ a: url(ID_A), html: `<img src="${url(ID_B)}">`, ext: "https://i.com/x.png" });
    expect([...findStorageUrls(text)]).toEqual([
      [url(ID_A), ID_A],
      [url(ID_B), ID_B],
    ]);
  });

  it("decide pelo content-type: raster, copiar ou pular", () => {
    expect(kindFromContentType("image/png")).toBe("raster");
    expect(kindFromContentType("image/jpeg; charset=binary")).toBe("raster");
    expect(kindFromContentType("image/svg+xml")).toBe("copy");
    expect(kindFromContentType("image/gif")).toBe("copy");
    expect(kindFromContentType("video/mp4")).toBe("skip");
    expect(kindFromContentType("application/pdf")).toBe("skip");
    expect(kindFromContentType(null)).toBe("skip");
  });

  it("troca só as URLs que têm arquivo local", () => {
    const text = `${url(ID_A)} ${url(ID_B)}`;
    expect(rewriteStorageUrls(text, new Map([[ID_A, `${ID_A}.webp`]]))).toBe(`/media/${ID_A}.webp ${url(ID_B)}`);
  });

  it("prévia de link usa o JPG das imagens baixadas e endereço completo", () => {
    expect(shareVariant(`/media/${ID_A}.webp`)).toBe(`/media/${ID_A}.jpg`);
    expect(shareVariant(`/media/${ID_SVG}.svg`)).toBe(`/media/${ID_SVG}.svg`);
    expect(shareVariant("https://i.com/x.webp")).toBe("https://i.com/x.webp");
    expect(absoluteUrl(`/media/${ID_A}.jpg`, "https://site.com/")).toBe(`https://site.com/media/${ID_A}.jpg`);
    expect(absoluteUrl("https://i.com/x.png", "https://site.com")).toBe("https://i.com/x.png");
  });

  it("withRetry tenta de novo e devolve o último erro", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("1")).mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { wait: async () => {} })).resolves.toBe("ok");
    const sempreFalha = vi.fn().mockRejectedValue(new Error("fora do ar"));
    await expect(withRetry(sempreFalha, { attempts: 3, wait: async () => {} })).rejects.toThrow("fora do ar");
    expect(sempreFalha).toHaveBeenCalledTimes(3);
  });
});

describe("runFetchMedia", () => {
  let root: string;
  let dataDir: string;
  let outDir: string;
  let cacheDir: string;
  const processor: ImageProcessor = {
    // Imagens "largas" (A) ganham a versão de 800px; as outras não.
    raster: vi.fn(async (input: Uint8Array) => {
      const wide = new TextDecoder().decode(input) === ID_A;
      return { webp: input, jpg: input, width: wide ? 1600 : 640, height: wide ? 900 : 480, ...(wide ? { small: input } : {}) };
    }),
    dimensions: vi.fn(async () => ({ width: 24, height: 24 })),
  };

  /** Storage falso: guarda as requisições feitas. */
  function fakeStorage(files: Record<string, { type: string; body?: string; status?: number }>) {
    const calls: string[] = [];
    const fetchImpl = (async (input: string, init?: RequestInit) => {
      const id = input.split("/").pop()!;
      const method = init?.method ?? "GET";
      calls.push(`${method} ${id}`);
      const file = files[id];
      if (!file || file.status) return new Response("", { status: file?.status ?? 404 });
      return new Response(method === "HEAD" ? null : (file.body ?? id), { headers: { "content-type": file.type } });
    }) as unknown as typeof fetch;
    return { fetchImpl, calls };
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "media-"));
    dataDir = join(root, "data");
    outDir = join(root, "media");
    cacheDir = join(root, "cache");
    mkdirSync(join(dataDir, "posts"), { recursive: true });
    writeFileSync(join(dataDir, "blog.json"), JSON.stringify([{ imageUrl: url(ID_A) }, { video: url(ID_VIDEO) }]));
    writeFileSync(
      join(dataDir, "posts", "p.json"),
      JSON.stringify({ content: `<img src="${url(ID_A)}"><img src="${url(ID_SVG)}"><img src="${url(ID_B)}">` }),
    );
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("baixa, otimiza, grava em public/media e troca as URLs nos JSON", async () => {
    const { fetchImpl } = fakeStorage({
      [ID_A]: { type: "image/png" },
      [ID_B]: { type: "image/jpeg" },
      [ID_VIDEO]: { type: "video/mp4" },
      [ID_SVG]: { type: "image/svg+xml", body: "<svg/>" },
    });
    const summary = await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl, processor, log: () => {} });

    expect(summary).toMatchObject({ found: 4, cached: 0, downloaded: 3, skipped: 1, failed: [] });
    expect(readdirSync(outDir).sort()).toEqual(
      [`${ID_A}.jpg`, `${ID_A}.webp`, `${ID_A}-800.webp`, `${ID_B}.jpg`, `${ID_B}.webp`, `${ID_SVG}.svg`, "manifest.json"].sort(),
    );
    expect(JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf-8"))).toEqual({
      [`${ID_A}.webp`]: { width: 1600, height: 900, small: `${ID_A}-800.webp` },
      [`${ID_B}.webp`]: { width: 640, height: 480 },
      [`${ID_SVG}.svg`]: { width: 24, height: 24 },
    });
    const blog = readFileSync(join(dataDir, "blog.json"), "utf-8");
    expect(blog).toContain(`/media/${ID_A}.webp`);
    expect(blog).toContain(url(ID_VIDEO)); // vídeo continua no storage
    const post = readFileSync(join(dataDir, "posts", "p.json"), "utf-8");
    expect(post).toContain(`/media/${ID_SVG}.svg`);
    expect(post).not.toContain("convex.cloud");
  });

  it("no build seguinte usa o cache: não pergunta nada ao storage", async () => {
    const files = {
      [ID_A]: { type: "image/png" },
      [ID_B]: { type: "image/jpeg" },
      [ID_VIDEO]: { type: "video/mp4" },
      [ID_SVG]: { type: "image/svg+xml" },
    };
    await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl: fakeStorage(files).fetchImpl, processor, log: () => {} });

    // Build novo: os JSON voltam com as URLs do storage (o fetch-static-data reescreve tudo).
    writeFileSync(join(dataDir, "blog.json"), JSON.stringify([{ imageUrl: url(ID_A) }, { video: url(ID_VIDEO) }]));
    writeFileSync(
      join(dataDir, "posts", "p.json"),
      JSON.stringify({ content: `<img src="${url(ID_A)}"><img src="${url(ID_SVG)}"><img src="${url(ID_B)}">` }),
    );
    const second = fakeStorage(files);
    const summary = await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl: second.fetchImpl, processor, log: () => {} });

    expect(second.calls).toEqual([]);
    expect(summary).toMatchObject({ cached: 4, downloaded: 0, skipped: 1 });
    expect(readFileSync(join(dataDir, "blog.json"), "utf-8")).toContain(`/media/${ID_A}.webp`);
  });

  it("falha num arquivo não derruba o resto: ele fica com a URL do storage", async () => {
    const { fetchImpl } = fakeStorage({
      [ID_A]: { type: "image/png" },
      [ID_B]: { type: "image/png", status: 500 },
      [ID_VIDEO]: { type: "video/mp4" },
      [ID_SVG]: { type: "image/svg+xml" },
    });
    const logs: string[] = [];
    const summary = await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl, processor, timeoutMs: 1000, log: (m) => logs.push(m) });

    expect(summary.failed).toEqual([{ storageId: ID_B, error: "HTTP 500" }]);
    const post = readFileSync(join(dataDir, "posts", "p.json"), "utf-8");
    expect(post).toContain(url(ID_B));
    expect(post).toContain(`/media/${ID_A}.webp`);
    expect(logs.some((l) => l.includes(ID_B))).toBe(true);
  });

  it("tira do cache o que o conteúdo não cita mais e versões antigas do processamento", async () => {
    mkdirSync(join(cacheDir, "v0-antiga"), { recursive: true });
    writeFileSync(join(cacheDir, "v0-antiga", "x.webp"), "x");
    mkdirSync(join(cacheDir, MEDIA_VERSION), { recursive: true });
    writeFileSync(join(cacheDir, MEDIA_VERSION, "99999999-9999-9999-9999-999999999999.webp"), "velha");
    const { fetchImpl } = fakeStorage({
      [ID_A]: { type: "image/png" },
      [ID_B]: { type: "image/png" },
      [ID_VIDEO]: { type: "video/mp4" },
      [ID_SVG]: { type: "image/svg+xml" },
    });
    await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl, processor, log: () => {} });

    expect(existsSync(join(cacheDir, "v0-antiga"))).toBe(false);
    expect(readdirSync(join(cacheDir, MEDIA_VERSION)).some((n) => n.startsWith("9999"))).toBe(false);
  });

  it("sem public/data, não faz nada", async () => {
    rmSync(dataDir, { recursive: true });
    const summary = await runFetchMedia({ dataDir, outDir, cacheDir, fetchImpl: fakeStorage({}).fetchImpl, processor, log: () => {} });
    expect(summary.found).toBe(0);
  });
});

describe("media — nomes", () => {
  it("storageId só de dígitos no último bloco não confunde a imagem com a versão de 800px", async () => {
    const { smallName, storageIdOf } = await import("../../scripts/lib/media");
    const id = "11111111-1111-1111-1111-111111111111";
    expect(storageIdOf(`${id}.webp`)).toBe(id);
    expect(storageIdOf(smallName(id))).toBe(id);
    expect(`${id}.webp`).not.toBe(smallName(id));
  });
});
