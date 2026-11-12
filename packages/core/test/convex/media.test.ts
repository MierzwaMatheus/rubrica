// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { RUBRICA_DATA_MIGRATIONS } from "../../src/convex";
import { normalizeFolder, repairFolder } from "../../src/convex/media";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";

describe("mídia: caminho das pastas", () => {
  it("normaliza e aceita _ e - nos nomes", () => {
    expect(normalizeFolder("portfolio/toca")).toBe("/portfolio/toca");
    expect(normalizeFolder("/sobre_mim/")).toBe("/sobre_mim");
    expect(normalizeFolder("hub-de-skills")).toBe("/hub-de-skills");
  });

  it("conserta o que a validação recusaria, sem lançar", () => {
    expect(repairFolder("portfolio/agenda-facil")).toBe("/portfolio/agenda-facil");
    expect(repairFolder("fotos & vídeos/2026.1")).toBe("/fotos - vídeos/2026-1");
    expect(repairFolder("a/b/c/d/e/f/g")).toBe("/a/b/c/d/e/f");
    expect(repairFolder("")).toBe("/");
    expect(repairFolder("///")).toBe("/");
  });
});

describe("mídia: pastas gravadas sem a barra inicial (migradas da v1)", () => {
  let t: T;
  let editor: Awaited<ReturnType<typeof as>>;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
    editor = await as(t, "content-editor");
  });

  /** Grava direto no banco, como o import do `migrar` fazia. */
  const insert = (name: string, folder: string) =>
    t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["img"], { type: "image/png" }));
      return ctx.db.insert("media", { storageId, name, folder, createdAt: Date.now() });
    });

  it("o filtro da pasta acha as imagens antes da migração, e a lista de pastas junta as duas formas", async () => {
    const a = await insert("a.png", "portfolio/toca");
    const b = await insert("b.png", "/portfolio/toca");
    await insert("c.png", "/");
    await insert("d.png", "portfolio");
    const ids = (folder: string) => editor.query(api.rubrica.media.list, { folder }).then((list) => list.map((m) => m._id).sort());
    expect(await ids("/portfolio/toca")).toEqual([a, b].sort());
    expect(await ids("portfolio/toca")).toEqual([a, b].sort());
    expect(await ids("/")).toHaveLength(1);
    expect(await editor.query(api.rubrica.media.folders, {})).toEqual([
      { path: "/", count: 1 },
      { path: "/portfolio", count: 1 },
      { path: "/portfolio/toca", count: 2 },
    ]);
  });

  it("a migração grava a forma normalizada e pode rodar de novo", async () => {
    const a = await insert("a.png", "portfolio/toca");
    const b = await insert("b.png", "sobre_mim");
    const c = await insert("c.png", "/");
    expect(await t.mutation(internal.rubrica.media.normalizeFolders, {})).toEqual({ fixed: 2 });
    const folders = await t.run(async (ctx) => Promise.all([a, b, c].map(async (id) => (await ctx.db.get(id))?.folder)));
    expect(folders).toEqual(["/portfolio/toca", "/sobre_mim", "/"]);
    expect(await t.mutation(internal.rubrica.media.normalizeFolders, {})).toEqual({ fixed: 0 });
  });

  it("está declarada para o update do CLI", () => {
    expect(RUBRICA_DATA_MIGRATIONS).toContainEqual(expect.objectContaining({ id: "media-folder-slash", fn: "rubrica/media:normalizeFolders" }));
  });
});
