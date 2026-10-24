import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  text: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { cancel, confirm, outro, text } from "@clack/prompts";
import { runUpdate } from "../commands/update.js";
import { buildPristine } from "../utils/pristine.js";
import { NEW_SUFFIX } from "../utils/threeWayUpdate.js";
import type { RubricaState } from "../state/readState.js";
import { baseRelease, fakeDownload, readTree, writeTree, type ReleaseFiles } from "./helpers/releaseFixture.js";

const STATE: RubricaState = {
  version: "0.3.17",
  layout: "brutalist",
  theme: "midnight-blue",
  fontSans: "Space Grotesk",
  fontMono: "Fira Code",
  plugins: { blog: true, portfolio: false },
  identity: {
    siteName: "Ana Dev",
    siteUrl: "https://ana.dev",
    siteDescription: "Portfólio da Ana",
    authorName: "Ana",
    authorEmail: "ana@ana.dev",
    twitterHandle: "anadev",
    lang: "pt-BR",
  },
};

let root: string;
let projectDir: string;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(confirm).mockResolvedValue(true);
  root = await fs.mkdtemp(path.join(tmpdir(), "rubrica-update-test-"));
  projectDir = path.join(root, "ana");
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

/** Projeto como o create deixaria na versão `from`, com o rubrica.json. */
async function createProject(releases: Record<string, ReleaseFiles>, state: RubricaState = STATE) {
  await buildPristine({
    dir: projectDir,
    version: state.version,
    state,
    packageName: "ana",
    download: fakeDownload(releases),
  });
  await fs.writeFile(path.join(projectDir, "rubrica.json"), JSON.stringify(state, null, 2));
}

async function edit(file: string, fn: (s: string) => string) {
  const abs = path.join(projectDir, file);
  await fs.writeFile(abs, fn(await fs.readFile(abs, "utf-8")));
}

function update(releases: Record<string, ReleaseFiles>, options = {}) {
  return runUpdate({
    cwd: projectDir,
    options,
    getLatestVersion: async () => "v0.4.0",
    downloadRelease: fakeDownload(releases),
    checkRequiredEnv: async () => [],
  });
}

/** Release nova: muda o CSS (regra nova no fim), uma página e o schema. */
function nextRelease(): ReleaseFiles {
  const r = baseRelease();
  r["src/index.css"] = `${r["src/index.css"]}\n.badge {\n  font-weight: 600;\n}\n`;
  r["templates/layouts/brutalist/pages/Resume.tsx"] = "export default function Resume() {\n  return <main>Resume v2</main>;\n}\n";
  r["templates/layouts/brutalist/pages/Home.tsx"] = String(r["templates/layouts/brutalist/pages/Home.tsx"]).replace("</main>", " v2</main>");
  r["convex/schema.ts"] = "export const schema = 2;\n";
  r["src/novo.ts"] = "export const novo = true;\n";
  return r;
}

describe("rubrica update", () => {
  it("preserva cores e CSS personalizados e ainda traz o CSS novo do Rubrica", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    await edit("src/index.css", (css) => css.replace(/--primary: [^;]+;/, "--primary: #ff00aa;").replace("padding: 4px;", "padding: 12px 20px;"));

    await update(releases);

    const css = await fs.readFile(path.join(projectDir, "src/index.css"), "utf-8");
    expect(css).toContain("--primary: #ff00aa;");
    expect(css).toContain("padding: 12px 20px;");
    expect(css).toContain(".badge");
    // Escolhas do create continuam aplicadas
    expect(css).toContain('--font-sans: "Space Grotesk"');
    expect(css).toContain("--bg: #0a1224"); // midnight-blue
  });

  it("página do layout personalizada fica intacta; as não personalizadas são atualizadas", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    await edit("src/pages/Home.tsx", () => "export default function Home() {\n  return <main>Minha home</main>;\n}\n");

    await update(releases);

    const files = await readTree(projectDir);
    expect(files["src/pages/Home.tsx"]).toContain("Minha home");
    expect(files[`src/pages/Home.tsx${NEW_SUFFIX}`]).toContain("v2");
    expect(files["src/pages/Resume.tsx"]).toContain("Resume v2");
    expect(files["convex/schema.ts"]).toBe("export const schema = 2;\n");
    expect(files["src/novo.ts"]).toBeDefined();
  });

  it("não apaga a identidade do rubrica.config.ts nem o nome do package.json", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);

    await update(releases);

    const files = await readTree(projectDir);
    expect(files["rubrica.config.ts"]).toContain('"Ana Dev"');
    expect(files["rubrica.config.ts"]).toContain('"https://ana.dev"');
    expect(JSON.parse(files["package.json"]!).name).toBe("ana");
  });

  it("não deixa templates/ nem cli/ no projeto", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);

    await update(releases);

    const files = Object.keys(await readTree(projectDir));
    expect(files.some((f) => f.startsWith("templates/") || f.startsWith("cli/"))).toBe(false);
  });

  it("grava a versão nova no rubrica.json", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);

    await update(releases);

    const state = JSON.parse(await fs.readFile(path.join(projectDir, "rubrica.json"), "utf-8"));
    expect(state.version).toBe("0.4.0");
    expect(state.identity.siteName).toBe("Ana Dev");
  });

  it("--dry-run não grava nada", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    const before = await readTree(projectDir);

    await update(releases, { dryRun: true });

    expect(await readTree(projectDir)).toEqual(before);
  });

  it("não grava nada se o usuário recusar o plano", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    const before = await readTree(projectDir);
    vi.mocked(confirm).mockResolvedValueOnce(false);

    await update(releases);

    expect(await readTree(projectDir)).toEqual(before);
  });

  it("não faz nada quando já está na versão mais recente", async () => {
    const releases = { "0.4.0": nextRelease() };
    await createProject(releases, { ...STATE, version: "0.4.0" });

    await update(releases);

    expect(outro).toHaveBeenCalledWith(expect.stringContaining("versão mais recente"));
  });

  it("com o 0.1.0 gravado por CLIs antigos, pergunta a versão de origem", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    await fs.writeFile(path.join(projectDir, "rubrica.json"), JSON.stringify({ ...STATE, version: "0.1.0" }));
    vi.mocked(text).mockResolvedValueOnce("0.3.17");

    await update(releases);

    expect(text).toHaveBeenCalled();
    const css = await fs.readFile(path.join(projectDir, "src/index.css"), "utf-8");
    expect(css).toContain(".badge");
  });

  it("com 0.1.0 e --yes, pede o --from em vez de adivinhar", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    await fs.writeFile(path.join(projectDir, "rubrica.json"), JSON.stringify({ ...STATE, version: "0.1.0" }));
    const before = await readTree(projectDir);

    await update(releases, { yes: true });

    expect(cancel).toHaveBeenCalledWith(expect.stringContaining("--from"));
    expect(await readTree(projectDir)).toEqual(before);
  });

  it("--from sobrepõe a versão do rubrica.json", async () => {
    const releases = { "0.3.17": baseRelease(), "0.4.0": nextRelease() };
    await createProject(releases);
    await fs.writeFile(path.join(projectDir, "rubrica.json"), JSON.stringify({ ...STATE, version: "0.1.0" }));

    await update(releases, { from: "v0.3.17", yes: true });

    expect(text).not.toHaveBeenCalled();
    const state = JSON.parse(await fs.readFile(path.join(projectDir, "rubrica.json"), "utf-8"));
    expect(state.version).toBe("0.4.0");
  });
});
