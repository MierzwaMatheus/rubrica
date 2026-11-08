/** Conteúdo ao vivo do dev (`astro/dev-content.ts`): quando invalidar e quando pedir reinício. */
import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentChangeTracker, subscribeFixtures, type FileWatcher } from "../src/astro/dev-content";
import { emptyCollections, type SiteSnapshot } from "../src/data/source";

function snapshot(title: string, font?: string): SiteSnapshot {
  return {
    site: { name: title, appearance: font ? { fonts: { sans: font } } : {} } as unknown as SiteSnapshot["site"],
    pages: [],
    collections: emptyCollections(),
    texts: {},
  };
}

const fontKey = (s: SiteSnapshot) => JSON.stringify((s.site as unknown as { appearance: unknown }).appearance);

describe("contentChangeTracker", () => {
  it("ignora o snapshot igual ao da partida (a inscrição entrega o valor atual primeiro)", () => {
    const onChange = vi.fn();
    const track = contentChangeTracker({ initial: snapshot("A"), onChange, warn: vi.fn() });
    expect(track(snapshot("A"))).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("invalida a cada conteúdo novo, uma vez por mudança", () => {
    const onChange = vi.fn();
    const track = contentChangeTracker({ initial: snapshot("A"), onChange, warn: vi.fn() });
    expect(track(snapshot("B"))).toBe(true);
    expect(track(snapshot("B"))).toBe(false);
    expect(track(snapshot("A"))).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("avisa para reiniciar quando o que só vale na partida muda, sem repetir o aviso", () => {
    const warn = vi.fn();
    const track = contentChangeTracker({
      initial: snapshot("A", "Inter"),
      onChange: vi.fn(),
      warn,
      restartNotices: [{ key: fontKey, message: "reinicie" }],
    });
    track(snapshot("B", "Inter"));
    expect(warn).not.toHaveBeenCalled();
    track(snapshot("B", "Lora"));
    track(snapshot("C", "Lora"));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("reinicie");
    track(snapshot("C", "Roboto"));
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("não avisa quando volta ao valor da partida", () => {
    const warn = vi.fn();
    const track = contentChangeTracker({
      initial: snapshot("A", "Inter"),
      onChange: vi.fn(),
      warn,
      restartNotices: [{ key: fontKey, message: "reinicie" }],
    });
    track(snapshot("A", "Lora"));
    track(snapshot("A", "Inter"));
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("subscribeFixtures", () => {
  function fakeWatcher() {
    const listeners = new Set<(event: string, path: string) => void>();
    const watcher: FileWatcher & { emit(path: string): void; added: string[] } = {
      added: [],
      add(p) {
        this.added.push(p);
      },
      on(_e, l) {
        listeners.add(l);
      },
      off(_e, l) {
        listeners.delete(l);
      },
      emit(path) {
        for (const l of listeners) l("change", path);
      },
    };
    return watcher;
  }

  it("relê a pasta só quando um arquivo dela muda, e para ao cancelar", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rb-fixtures-"));
    try {
      const load = vi.fn(async () => snapshot("A"));
      const onSnapshot = vi.fn();
      const watcher = fakeWatcher();
      const stop = subscribeFixtures(dir, { load }, watcher, onSnapshot, vi.fn());
      expect(watcher.added).toEqual([dir]);
      watcher.emit(join(dir, "..", "outro.json"));
      watcher.emit(join(dir + "-irma", "site.json"));
      expect(load).not.toHaveBeenCalled();
      watcher.emit(join(dir, "collections", "posts.json"));
      await vi.waitFor(() => expect(onSnapshot).toHaveBeenCalledTimes(1));
      stop();
      watcher.emit(join(dir, "site.json"));
      expect(load).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("um JSON inválido no meio da edição vira erro, não derruba o dev", async () => {
    const onError = vi.fn();
    const watcher = fakeWatcher();
    subscribeFixtures("/x", { load: () => Promise.reject(new Error("JSON inválido")) }, watcher, vi.fn(), onError);
    watcher.emit("/x/site.json");
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "JSON inválido" })));
  });
});
