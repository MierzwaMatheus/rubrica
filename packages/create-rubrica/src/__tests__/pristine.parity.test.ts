import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import { select, multiselect } from "@clack/prompts";
import { runCreate, ALL_PLUGINS } from "../commands/create.js";
import { buildPristine } from "../utils/pristine.js";
import type { RubricaState } from "../state/readState.js";
import { baseRelease, fakeDownload, readTree } from "./helpers/releaseFixture.js";

/**
 * O update reconstrói o projeto "como o create deixaria" para comparar com o do usuário.
 * Se create e buildPristine divergirem, o update veria diferenças que o usuário não fez.
 */
let root: string;

beforeEach(async () => {
  vi.clearAllMocks();
  root = await fs.mkdtemp(path.join(tmpdir(), "rubrica-parity-"));
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe("buildPristine reproduz o create", () => {
  it("o fixture conhece todos os plugins do create", async () => {
    const registry = String(baseRelease()["convex/pluginRegistry.ts"]);
    for (const id of ALL_PLUGINS) expect(registry).toContain(`id: '${id}'`);
  });

  it("gera os mesmos arquivos para as mesmas escolhas", async () => {
    const releases = { "0.3.17": baseRelease() };
    const identity = {
      siteName: "Ana Dev",
      siteUrl: "https://ana.dev",
      siteDescription: "Portfólio da Ana",
      authorName: "Ana",
      authorEmail: "ana@ana.dev",
      twitterHandle: "anadev",
      lang: "pt-BR",
    };

    vi.mocked(select)
      .mockResolvedValueOnce("custom") // modo personalizado
      .mockResolvedValueOnce("brutalist")
      .mockResolvedValueOnce("solar-warm")
      .mockResolvedValueOnce("light") // modo de cor
      .mockResolvedValueOnce("grain") // textura
      .mockResolvedValueOnce("Space Grotesk")
      .mockResolvedValueOnce("Fira Code")
      .mockResolvedValueOnce("custom"); // plugins um por um
    vi.mocked(multiselect).mockResolvedValueOnce(["blog"]);

    await runCreate("ana", {
      projectsDir: root,
      getLatestVersion: async () => "v0.3.17",
      download: fakeDownload(releases),
      identityPrompt: async () => identity,
      exec: async () => {},
    });

    const created = path.join(root, "ana");
    const state = JSON.parse(await fs.readFile(path.join(created, "rubrica.json"), "utf-8")) as RubricaState;
    expect(state.version).toBe("0.3.17");

    const rebuilt = path.join(root, "rebuilt");
    await buildPristine({ dir: rebuilt, version: state.version, state, packageName: "ana", download: fakeDownload(releases) });

    const createdFiles = await readTree(created);
    delete createdFiles["rubrica.json"];
    expect(await readTree(rebuilt)).toEqual(createdFiles);
  });
});
