import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { classify, lineDelta, listCustomizations } from "../src/migrate/customizations";
import { comparePage, summarize, textCoverage } from "../src/migrate/compare";
import { runMigrate, v2StateFrom, LAST_V1 } from "../src/commands/migrate";
import { resolveTheme } from "../src/themes";
import { run } from "../src/utils/exec";
import { V1_RUBRICA_JSON } from "./fixtures/v1-export";
import { TEMPLATE, pristine, v1Project } from "./fixtures/v1-project";
import { writeFiles } from "../src/utils/fs";
import { tmp } from "./helpers";

describe("personalizações", () => {
  it("compara com a v1 de referência e sugere o destino", () => {
    const { dir } = v1Project();
    const base = tmp();
    writeFiles(base, TEMPLATE);
    const list = listCustomizations(dir, base);
    const by = Object.fromEntries(list.map((c) => [c.path, c]));
    expect(by["src/pages/Home.tsx"]).toMatchObject({ kind: "modificado", area: "página", lines: { added: 2, removed: 1 } });
    expect(by["src/components/Terminal.tsx"]).toMatchObject({ kind: "novo", area: "componente próprio" });
    expect(by["convex/newsletter.ts"]).toMatchObject({ kind: "novo", area: "backend próprio" });
    expect(by["src/index.css"]?.area).toBe("estilo");
    expect(by["public/cv.pdf"]?.area).toBe("arquivo público");
    expect(by["tests/app.test.ts"]).toMatchObject({ kind: "removido" });
    expect(by["src/components/Sidebar.tsx"]).toBeUndefined();
    expect(Object.keys(by).some((p) => p.startsWith(".git/") || p.startsWith(".env"))).toBe(false);
  });

  it("regras de sugestão", () => {
    expect(classify("src/components/Sidebar.tsx", "modificado").area).toBe("casca do tema");
    expect(classify("src/components/ZineShared.tsx", "modificado").area).toBe("casca do tema");
    expect(classify("src/pages/About.tsx", "modificado").suggestion).toMatch(/lista-itens/);
    expect(classify("src/pages/ProjectCaseStudy.tsx", "modificado").area).toBe("template do tema");
    expect(classify("convex/posts.ts", "modificado").area).toBe("backend do núcleo");
    expect(classify("convex/schema.ts", "modificado").suggestion).toMatch(/rubricaTables/);
    expect(classify("vercel.json", "modificado").area).toBe("hospedagem");
    for (const icon of ["public/favicon.ico", "public/favicon-32x32.png", "public/apple-touch-icon.png", "public/icon-512.png", "public/maskable-512.png", "public/site.webmanifest"]) {
      expect(classify(icon, "novo").area, icon).toBe("ícones");
    }
    expect(classify("public/cv.pdf", "novo").area).toBe("arquivo público");
    expect(classify("index.html", "modificado").suggestion).toMatch(/--analytics/);
    expect(classify("src/i18n/translations/pt-BR.ts", "modificado").suggestion).toMatch(/arquivos de tradução/);
    expect(lineDelta("a\nb\nc", "a\nc\nd\ne")).toEqual({ added: 2, removed: 1 });
  });
});

describe("conferência das páginas", () => {
  it("resume título, h1 e texto, sem scripts", () => {
    const s = summarize("<html><head><title>Bruna &amp; cia</title><script>x()</script></head><body><main><h1>Olá <span>mundo</span></h1><p>Texto&nbsp;aqui</p></main></body></html>");
    expect(s).toEqual({ title: "Bruna & cia", h1: ["Olá mundo"], text: "Olá mundo Texto aqui" });
  });

  it("compara v1 e v2", () => {
    const v1 = "<title>A</title><main><h1>Oi</h1><p>design de produto em São Paulo</p></main>";
    const v2 = "<title>A</title><main><h1>Oi</h1><p>Design de produto, São Paulo.</p></main>";
    expect(comparePage("/", v1, v2)).toMatchObject({ titleSame: true, h1Same: true, coverage: 1 });
    expect(comparePage("/x", null, v2).missing).toBe("v1");
    expect(textCoverage("design produto pesquisa marca", "design produto")).toBe(0.5);
  });
});

describe("migrar", () => {
  it("--relatorio não grava nada no projeto", async () => {
    const { dir, exportZip } = v1Project();
    const before = run("git", ["status", "--porcelain", "--ignored"], { cwd: dir });
    let report = "";
    await runMigrate(["--relatorio", "--export", exportZip], { cwd: dir, pristine, out: (t) => (report = t) });
    expect(run("git", ["status", "--porcelain", "--ignored"], { cwd: dir })).toBe(before);
    expect(run("git", ["branch", "--show-current"], { cwd: dir }).trim()).toBe("main");
    expect(report).toContain("Layout da v1: **cyberpunk** → tema da v2: **cyberpunk**");
    expect(report).toContain("`src/pages/Home.tsx` (+2/−1)");
    expect(report).toContain("`convex/newsletter.ts`");
    expect(report).toContain("| posts | posts | 3 |");
    expect(report).toContain("`notFound.lines.0`");
    expect(report).toContain("`playground` → **removido na v2**");
    expect(report).toContain("dá para migrar");
  });

  it("recusa versão antiga da v1 e git sujo", async () => {
    const old = v1Project();
    writeFileSync(join(old.dir, "rubrica.json"), JSON.stringify({ ...V1_RUBRICA_JSON, version: "1.12.0" }));
    run("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "x"], { cwd: old.dir });
    await expect(runMigrate(["--yes", "--sem-instalar"], { cwd: old.dir, pristine })).rejects.toThrow(new RegExp(`parte da ${LAST_V1.replace(/\./g, "\\.")}`));
    const dirty = v1Project();
    writeFileSync(join(dirty.dir, "README.md"), "mudei");
    await expect(runMigrate(["--yes", "--sem-instalar"], { cwd: dirty.dir, pristine })).rejects.toThrow(/sem commit/);
  });

  it("troca o código numa branch nova e converte os dados, sem tocar no Convex", async () => {
    const { dir, exportZip } = v1Project("zine");
    await runMigrate(["--yes", "--sem-instalar", "--export", exportZip], { cwd: dir, pristine });
    expect(run("git", ["branch", "--show-current"], { cwd: dir }).trim()).toBe("rubrica-v2");
    // saiu o template da v1, ficaram public/, docs/, README e o .env.local
    for (const gone of ["src/pages", "src/components", "vite.config.ts", "index.html", "tests", "convex/posts.ts", "convex/newsletter.ts"]) expect(existsSync(join(dir, gone)), gone).toBe(false);
    for (const kept of ["public/cv.pdf", "public/favicon.svg", "docs/notas.md", "README.md", ".env.local"]) expect(existsSync(join(dir, kept)), kept).toBe(true);
    expect(readFileSync(join(dir, ".env.local"), "utf-8")).toBe("CONVEX_DEPLOYMENT=dev:nao-mexer\n");
    // entrou a v2, com o tema equivalente ao layout da v1
    expect(readFileSync(join(dir, "astro.config.ts"), "utf-8")).toContain('theme: "@rubrica/theme-zine"');
    expect(existsSync(join(dir, "convex/rubrica/posts.ts"))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("site-da-bruna");
    expect(pkg.dependencies["@rubrica/core"]).toBeDefined();
    expect(pkg.dependencies.react).not.toBe("^19");
    const state = JSON.parse(readFileSync(join(dir, "rubrica.json"), "utf-8"));
    expect(state.temaDesejado).toBeUndefined();
    expect(state).toMatchObject({ rubrica: 2, tema: "zine", tipo: "pessoal", idiomas: { lista: ["pt-BR", "en"], principal: "pt-BR" }, aparencia: { esquema: "neon", modo: "dark" }, migracao: { de: "1.13.1", layoutV1: "zine" } });
    expect(state.plugins.translation).toBe(false);
    expect(state.plugins.payments).toBe(false);
    expect(readFileSync(join(dir, ".gitignore"), "utf-8")).toContain("meus-rascunhos/");
    // dados
    const work = join(dir, ".rubrica/migracao");
    expect(Object.keys(unzipSync(readFileSync(join(work, "import-v2.zip"))))).toContain("pages/documents.jsonl");
    expect(existsSync(join(work, "pendentes-v1.zip"))).toBe(true);
    expect(readdirSync(join(work, "fixtures/collections"))).toContain("posts.json");
    const report = readFileSync(join(work, "relatorio.md"), "utf-8");
    expect(report).not.toContain("ainda não portado");
    expect(report).toContain("`src/components/Terminal.tsx`");
    expect(report).toContain("desenvolvimento novo e vazio");
    // a branch original continua com a v1
    expect(run("git", ["show", "main:src/pages/Home.tsx"], { cwd: dir })).toContain("Minha home");
  });

  it("estado da v2 a partir do rubrica.json da v1", () => {
    const s = v2StateFrom(V1_RUBRICA_JSON, resolveTheme("cyberpunk"), undefined, new Date("2026-11-08T00:00:00Z"));
    expect(s.identidade).toEqual({ nome: "Bruna Lima", url: "https://brunalima.design", descricao: "Designer de produto", autor: "Bruna Lima", twitter: "brunalima" });
    expect(s.aparencia).toEqual({ esquema: "neon", modo: "dark", alternancia: false, fonteSans: "Chakra Petch", fonteMono: "JetBrains Mono" });
    expect(s.migracao).toEqual({ de: "1.13.1", layoutV1: "cyberpunk", em: "2026-11-08" });
  });
});
