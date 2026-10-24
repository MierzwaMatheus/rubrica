import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runCreate, suggestedSiteUrl } from "../commands/create.js";
import { PLUGIN_PRESETS } from "../plugins.js";

// Fluxo simplificado do create: modo rápido, pacotes de plugins, instalação sem perguntas
// e o setup encadeado no final.

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), success: vi.fn(), step: vi.fn() },
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import { select, multiselect, confirm, outro, isCancel, cancel, log, note } from "@clack/prompts";
import type { Recipe } from "../recipe.js";

const IDENTITY = {
  siteName: "Ana",
  siteUrl: "https://ana.dev",
  siteDescription: "Designer",
  authorName: "Ana",
  authorEmail: "ana@ana.dev",
  twitterHandle: "",
  lang: "pt-BR",
};

function makeFs(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (p: string, e: string) => vol.promises.readFile(p, e as BufferEncoding) as Promise<string>,
    writeFile: (p: string, d: string) => vol.promises.writeFile(p, d).then(() => undefined),
    mkdir: (p: string, o: { recursive: boolean }) => vol.promises.mkdir(p, o).then(() => undefined),
    exists: async (p: string) => {
      try {
        await vol.promises.access(p);
        return true;
      } catch {
        return false;
      }
    },
    rm: async () => undefined,
  };
}

function makeDeps(overrides: Partial<Parameters<typeof runCreate>[1]> = {}) {
  const vol = Volume.fromJSON({});
  vol.mkdirSync("/projects", { recursive: true });
  const fs = makeFs(vol);
  const deps = {
    projectsDir: "/projects",
    fs,
    getLatestVersion: vi.fn(async () => "v1.1.0"),
    download: vi.fn(async (dir: string) => {
      await fs.mkdir(`${dir}/src`, { recursive: true });
      await fs.writeFile(`${dir}/package.json`, JSON.stringify({ name: "x" }));
    }),
    applyLayout: vi.fn(async () => undefined),
    applyTheme: vi.fn(async () => undefined),
    applyFont: vi.fn(async () => undefined),
    applyPlugins: vi.fn(async () => undefined),
    applyIndexHtml: vi.fn(async () => undefined),
    applyRubricalConfig: vi.fn(async () => undefined),
    applyAppearance: vi.fn(async () => undefined),
    writeState: vi.fn(async () => undefined),
    identityPrompt: vi.fn(async () => IDENTITY),
    exec: vi.fn(async () => undefined),
    setup: vi.fn(async () => undefined),
    userAgent: "npm/10.0.0 node/v22.0.0",
    ...overrides,
  };
  return deps as typeof deps & Parameters<typeof runCreate>[1];
}

/** Modo rápido: só modo, layout e pacote de plugins passam por select. */
function quick(layout = "cyberpunk", preset = "recommended") {
  vi.mocked(select).mockResolvedValueOnce("quick").mockResolvedValueOnce(layout).mockResolvedValueOnce(preset);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isCancel).mockReturnValue(false);
  vi.mocked(confirm).mockResolvedValue(false);
});

describe("create — modo rápido", () => {
  it("a primeira pergunta é o modo, com o rápido como padrão", async () => {
    quick();
    await runCreate("ana", makeDeps());
    const first = vi.mocked(select).mock.calls[0][0] as { initialValue: string; options: Array<{ value: string }> };
    expect(first.initialValue).toBe("quick");
    expect(first.options.map((o) => o.value)).toEqual(["quick", "custom"]);
  });

  it("aplica a aparência recomendada do layout sem perguntar cores, textura nem fontes", async () => {
    quick("cyberpunk");
    const deps = makeDeps();
    await runCreate("ana", deps);

    expect(select).toHaveBeenCalledTimes(3); // modo, layout, plugins
    expect(deps.applyTheme).toHaveBeenCalledWith({ preset: "neon" }, expect.any(String), expect.anything());
    expect(deps.applyAppearance).toHaveBeenCalledWith(
      { colorMode: "dark", colorModeToggle: true, texture: "none" },
      expect.any(String),
      expect.anything()
    );
    expect(deps.applyFont).toHaveBeenCalledWith(
      { fontSans: "Chakra Petch", fontMono: "JetBrains Mono" },
      expect.anything(),
      expect.anything()
    );
  });

  it("grava no rubrica.json a aparência recomendada", async () => {
    quick("swiss");
    const deps = makeDeps();
    await runCreate("ana", deps);
    expect(deps.writeState).toHaveBeenCalledWith(
      "/projects/ana",
      expect.objectContaining({ layout: "swiss", theme: "paper-noir", colorMode: "light", fontSans: "Archivo", fontMono: "" }),
      expect.anything()
    );
  });

  it("não pergunta o idioma (usa pt-BR) e sugere o endereço da Vercel", async () => {
    quick();
    const deps = makeDeps();
    await runCreate("Meu_Portfolio", deps);
    expect(deps.identityPrompt).toHaveBeenCalledWith(
      { siteUrl: "https://meu-portfolio.vercel.app" },
      { askLang: false }
    );
  });

  it("no modo personalizado pergunta o idioma", async () => {
    vi.mocked(select)
      .mockResolvedValueOnce("custom")
      .mockResolvedValueOnce("cyberpunk")
      .mockResolvedValueOnce("neon")
      .mockResolvedValueOnce("dark")
      .mockResolvedValueOnce("none")
      .mockResolvedValueOnce("Inter")
      .mockResolvedValueOnce("JetBrains Mono")
      .mockResolvedValueOnce("recommended");
    const deps = makeDeps();
    await runCreate("ana", deps);
    expect(deps.identityPrompt).toHaveBeenCalledWith(expect.anything(), { askLang: true });
    expect(deps.applyTheme).toHaveBeenCalledWith({ preset: "neon" }, expect.any(String), expect.anything());
  });

  it("cancelar a escolha do modo interrompe sem baixar nada", async () => {
    vi.mocked(select).mockResolvedValueOnce("CANCEL");
    vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
    const deps = makeDeps();
    await expect(runCreate("ana", deps)).rejects.toThrow("cancelado");
    expect(cancel).toHaveBeenCalled();
    expect(deps.download).not.toHaveBeenCalled();
  });

  it("cancelar a escolha do layout interrompe", async () => {
    vi.mocked(select).mockResolvedValueOnce("quick").mockResolvedValueOnce("CANCEL");
    vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
    await expect(runCreate("ana", makeDeps())).rejects.toThrow("cancelado");
  });
});

describe("create — plugins por pacote", () => {
  it.each(PLUGIN_PRESETS.map((p) => [p.id, p.plugins] as const))("pacote %s liga só os plugins dele", async (id, plugins) => {
    quick("cyberpunk", id);
    const deps = makeDeps();
    await runCreate("ana", deps);
    const record = vi.mocked(deps.applyPlugins).mock.calls[0][0] as Record<string, boolean>;
    expect(Object.entries(record).filter(([, on]) => on).map(([k]) => k).sort()).toEqual([...plugins].sort());
    expect(multiselect).not.toHaveBeenCalled();
  });
});

describe("create — instalação sem perguntas", () => {
  it("roda git init e instala com npm quando veio do npx", async () => {
    quick();
    const deps = makeDeps({ userAgent: "npm/10.0.0 node/v22" });
    await runCreate("ana", deps);
    expect(deps.exec).toHaveBeenCalledWith("git init", "/projects/ana");
    expect(deps.exec).toHaveBeenCalledWith("npm install", "/projects/ana");
  });

  it("instala com pnpm quando veio do pnpm create", async () => {
    quick();
    const deps = makeDeps({ userAgent: "pnpm/9.0.0 npm/? node/v22" });
    await runCreate("ana", deps);
    expect(deps.exec).toHaveBeenCalledWith("pnpm install", "/projects/ana");
  });

  it("git init falhando (git não instalado) não impede o resto", async () => {
    quick();
    const exec = vi.fn(async (cmd: string) => {
      if (cmd === "git init") throw new Error("git: command not found");
    });
    const deps = makeDeps({ exec });
    await runCreate("ana", deps);
    expect(exec).toHaveBeenCalledWith("npm install", "/projects/ana");
    expect(log.warn).toHaveBeenCalledWith(expect.stringMatching(/git/));
    expect(outro).toHaveBeenCalled();
  });

  it("não pergunta git nem gerenciador de pacotes", async () => {
    quick();
    await runCreate("ana", makeDeps());
    const messages = vi.mocked(confirm).mock.calls.map((c) => (c[0] as { message: string }).message);
    expect(messages.some((m) => /git/i.test(m))).toBe(false);
  });
});

describe("create — backend no mesmo fluxo", () => {
  it("pergunta se quer configurar o painel agora, com sim como padrão", async () => {
    quick();
    await runCreate("ana", makeDeps());
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/painel/), initialValue: true }));
  });

  it("aceitando, conecta o Convex na pasta do projeto e roda o setup lá", async () => {
    quick();
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps();
    await runCreate("ana", deps);
    expect(deps.exec).toHaveBeenCalledWith("npx convex dev --once", "/projects/ana");
    expect(deps.setup).toHaveBeenCalledWith({ cwd: "/projects/ana", nextStep: "cd ana && npm run dev" });
    const order = vi.mocked(deps.exec).mock.calls.map((c) => c[0]);
    expect(order.indexOf("npm install")).toBeLessThan(order.indexOf("npx convex dev --once"));
    expect(outro).not.toHaveBeenCalled(); // o setup fecha com os próximos passos
  });

  it("recusando, não chama o Convex e explica os próximos passos com o gerenciador certo", async () => {
    quick();
    const deps = makeDeps({ userAgent: "pnpm/9.0.0" });
    await runCreate("ana", deps);
    expect(deps.setup).not.toHaveBeenCalled();
    expect(deps.exec).not.toHaveBeenCalledWith("npx convex dev --once", expect.anything());
    const msg = vi.mocked(outro).mock.calls[0][0] as string;
    expect(msg).toMatch(/cd ana/);
    expect(msg).toMatch(/npx create-rubrica setup/);
    expect(msg).toMatch(/pnpm run dev/);
  });

  it("se o Convex falhar, não roda o setup e diz como continuar depois", async () => {
    quick();
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const exec = vi.fn(async (cmd: string) => {
      if (cmd.startsWith("npx convex")) throw new Error("login cancelado");
    });
    const deps = makeDeps({ exec });
    await runCreate("ana", deps);
    expect(deps.setup).not.toHaveBeenCalled();
    expect(vi.mocked(outro).mock.calls[0][0]).toMatch(/npx create-rubrica setup/);
  });
});

describe("create — com receita do site", () => {
  const FULL: Recipe = {
    layout: "zine",
    scheme: "riso",
    colorMode: "dark",
    colorModeToggle: false,
    texture: "paper",
    fontSans: "Fraunces",
    fontMono: "Space Mono",
    plugins: ["blog", "about"],
    identity: { authorName: "Ana", siteUrl: "https://ana.dev", authorEmail: "ana@ana.dev" },
  };

  it("mostra o resumo e pede confirmação antes de baixar", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: FULL });
    await runCreate("ana", deps);
    expect(note).toHaveBeenCalledWith(expect.stringContaining("Layout: Zine\nCores: Riso"), expect.stringMatching(/site/i));
    expect(confirm).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: expect.stringMatching(/Criar com essas escolhas/), initialValue: true }));
    expect(vi.mocked(confirm).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(deps.download).mock.invocationCallOrder[0]);
  });

  it("recusando o resumo, cancela sem baixar nada", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(false);
    const deps = makeDeps({ recipe: FULL });
    await expect(runCreate("ana", deps)).rejects.toThrow("cancelado");
    expect(cancel).toHaveBeenCalled();
    expect(deps.download).not.toHaveBeenCalled();
  });

  it("receita completa: nenhuma pergunta de modo, layout, aparência ou plugins", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: FULL });
    await runCreate("ana", deps);
    expect(select).not.toHaveBeenCalled();
    expect(multiselect).not.toHaveBeenCalled();
    expect(deps.applyLayout).toHaveBeenCalledWith("zine", expect.anything(), expect.anything());
    expect(deps.applyTheme).toHaveBeenCalledWith({ preset: "riso" }, expect.any(String), expect.anything());
    expect(deps.applyAppearance).toHaveBeenCalledWith({ colorMode: "dark", colorModeToggle: false, texture: "paper" }, expect.any(String), expect.anything());
    expect(deps.applyFont).toHaveBeenCalledWith({ fontSans: "Fraunces", fontMono: "Space Mono" }, expect.anything(), expect.anything());
    const record = vi.mocked(deps.applyPlugins).mock.calls[0][0] as Record<string, boolean>;
    expect(Object.entries(record).filter(([, on]) => on).map(([k]) => k)).toEqual(["blog", "about"]);
  });

  it("a identidade da receita vai para o prompt, que só pergunta o que faltar", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: FULL });
    await runCreate("ana", deps);
    expect(deps.identityPrompt).toHaveBeenCalledWith(
      { siteUrl: "https://ana.dev", authorName: "Ana", authorEmail: "ana@ana.dev" },
      { askLang: false, onlyMissing: true }
    );
  });

  it("sem endereço na receita, sugere o da Vercel", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: { layout: "zine", plugins: [], identity: { authorName: "Ana" } } });
    await runCreate("ana", deps);
    expect(deps.identityPrompt).toHaveBeenCalledWith({ siteUrl: "https://ana.vercel.app", authorName: "Ana" }, expect.anything());
  });

  it("só o layout: o resto da aparência vem do recomendado e os plugins são perguntados", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    vi.mocked(select).mockResolvedValueOnce("simple");
    const deps = makeDeps({ recipe: { layout: "desktop" } });
    await runCreate("ana", deps);
    expect(select).toHaveBeenCalledTimes(1); // só o pacote de plugins
    expect(deps.applyTheme).toHaveBeenCalledWith({ preset: "sorbet" }, expect.any(String), expect.anything());
    expect(deps.applyAppearance).toHaveBeenCalledWith({ colorMode: "light", colorModeToggle: true, texture: "grain" }, expect.any(String), expect.anything());
  });

  it("aparência parcial: usa o que veio e completa com o recomendado do layout", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: { layout: "desktop", scheme: "riso", plugins: [] } });
    await runCreate("ana", deps);
    expect(deps.applyTheme).toHaveBeenCalledWith({ preset: "riso" }, expect.any(String), expect.anything());
    expect(deps.applyFont).toHaveBeenCalledWith({ fontSans: "Instrument Sans", fontMono: "IBM Plex Mono" }, expect.anything(), expect.anything());
  });

  it("sem layout na receita, pergunta o layout (e não o modo)", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    vi.mocked(select).mockResolvedValueOnce("bento");
    const deps = makeDeps({ recipe: { plugins: [] } });
    await runCreate("ana", deps);
    expect(select).toHaveBeenCalledTimes(1);
    expect((vi.mocked(select).mock.calls[0][0] as { message: string }).message).toBe("Layout");
    expect(deps.applyLayout).toHaveBeenCalledWith("bento", expect.anything(), expect.anything());
  });

  it("layout sem fonte mono ignora a mono da receita", async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true);
    const deps = makeDeps({ recipe: { layout: "swiss", fontMono: "Space Mono", plugins: [] } });
    await runCreate("ana", deps);
    expect(deps.applyFont).toHaveBeenCalledWith({ fontSans: "Archivo", fontMono: "" }, expect.anything(), expect.anything());
  });

  it("receita vazia segue o fluxo normal (pergunta o modo)", async () => {
    quick();
    await runCreate("ana", makeDeps({ recipe: {} }));
    expect(note).not.toHaveBeenCalled();
    expect((vi.mocked(select).mock.calls[0][0] as { message: string }).message).toMatch(/montar o site/);
  });
});

describe("suggestedSiteUrl", () => {
  it.each([
    ["meu-portfolio", "https://meu-portfolio.vercel.app"],
    ["Meu_Portfolio", "https://meu-portfolio.vercel.app"],
    ["ana", "https://ana.vercel.app"],
  ])("%s → %s", (name, url) => {
    expect(suggestedSiteUrl(name)).toBe(url);
  });
});
