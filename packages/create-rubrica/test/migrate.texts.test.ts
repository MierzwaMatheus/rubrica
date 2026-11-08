/** `migrar`: os arquivos de tradução do projeto v1 como segundo padrão dos textos. */
import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { CORE_RECIPES } from "@rubrica/core";
import { convertV1, V1_TEXTS } from "../src/migrate/convert";
import { mergeTranslations, parseV1Translations, readV1ProjectTexts, SAVED_TEXTS_FILE, V1_TRANSLATION_FILES } from "../src/migrate/v1-translations";
import { runMigrate } from "../src/commands/migrate";
import { run } from "../src/utils/exec";
import { V1_RUBRICA_JSON, v1Export } from "./fixtures/v1-export";
import { pristine, v1Project } from "./fixtures/v1-project";
import { tmp } from "./helpers";

/** Monta um arquivo de tradução no formato da v1 a partir de chaves achatadas. */
function translationSource(name: string, flat: Record<string, string>): string {
  const root: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = root as Record<string, unknown>;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = value;
      else node = (node[part] ??= /^\d+$/.test(parts[i + 1]!) ? [] : {}) as Record<string, unknown>;
    });
  }
  const render = (v: unknown, indent: string): string => {
    if (typeof v === "string") return `'${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
    if (Array.isArray(v)) return `[\n${v.map((x) => `${indent}  ${render(x, `${indent}  `)},`).join("\n")}\n${indent}]`;
    const entries = Object.entries(v as Record<string, unknown>).map(([k, x]) => `${indent}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${render(x, `${indent}  `)},`);
    return `{\n${entries.join("\n")}\n${indent}}`;
  };
  return `// Traduções\nexport const ${name} = ${render(root, "")};\n`;
}

const ptOf = (o: Record<string, { pt: string; en?: string }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.pt]));
const enOf = (o: Record<string, { pt: string; en?: string }>) => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (v.en === undefined ? [] : [[k, v.en]])));

describe("leitor dos arquivos de tradução da v1", () => {
  it("entende o literal: tipo, comentários, aspas, crase, escapes, listas, números e chaves entre aspas", () => {
    const src = `import type { T } from "./t";
/* cabeçalho */
export const enUS: T = {
  // comentário
  seo: { aboutTitle: "About \\"me\\"", 'quoted-key': 'It\\'s' },
  home: {
    hero: { technologies: [ { name: "React", color: "bg-sky" }, { name: \`Type
Script\` } ], count: 3, on: true },
    dynamic: \`Olá \${name}\`,
    fn: someFunction("x", { a: 1 }),
    ...extra,
    emoji: "\\u{1F600} \\u00e9",
  },
} as const;
`;
    expect(parseV1Translations(src)).toEqual({
      "seo.aboutTitle": 'About "me"',
      "seo.quoted-key": "It's",
      "home.hero.technologies.0.name": "React",
      "home.hero.technologies.0.color": "bg-sky",
      "home.hero.technologies.1.name": "Type\nScript",
      "home.emoji": "😀 é",
    });
  });

  it("lê de volta todos os textos do template da v1", () => {
    const pt = parseV1Translations(translationSource("ptBR", ptOf(V1_TEXTS)));
    expect(pt).toEqual(ptOf(V1_TEXTS));
    expect(Object.keys(pt).length).toBeGreaterThan(250);
    expect(parseV1Translations(translationSource("enUS", enOf(V1_TEXTS)))).toEqual(enOf(V1_TEXTS));
  });

  it("arquivo fora do formato: erro (o migrar avisa e segue sem ele)", () => {
    expect(() => parseV1Translations("export default function x() {}")).toThrow(/objeto/);
    expect(() => parseV1Translations("const a = 1;")).toThrow(/export/);
    const dir = tmp();
    mkdirSync(join(dir, "src/i18n/translations"), { recursive: true });
    writeFileSync(join(dir, V1_TRANSLATION_FILES.pt), "export const ptBR = { a: 'sem fim };");
    writeFileSync(join(dir, V1_TRANSLATION_FILES.en), translationSource("enUS", { "home.cta.title": "Hi" }));
    const read = readV1ProjectTexts(dir);
    expect(read.warnings.join()).toMatch(/pt-BR\.ts/);
    expect(read.texts).toEqual({ "home.cta.title": { en: "Hi" } });
  });

  it("sem os arquivos, usa a cópia guardada pelo migrar", () => {
    const dir = tmp();
    mkdirSync(join(dir, "work"), { recursive: true });
    writeFileSync(join(dir, "work", SAVED_TEXTS_FILE), JSON.stringify({ "a.b": { pt: "x" } }));
    expect(readV1ProjectTexts(dir, join(dir, "work")).texts).toEqual({ "a.b": { pt: "x" } });
    expect(readV1ProjectTexts(dir).texts).toBeUndefined();
  });
});

describe("conversão com os textos do projeto", () => {
  const NOW = 1_800_000_000_000;
  const projectTexts = mergeTranslations(
    { ...ptOf(V1_TEXTS), "home.cta.title": "Tem um sistema para tirar do papel?", "home.hero.headline": "Do arquivo", "resume.downloadCV": "Baixar PDF" },
    { ...enOf(V1_TEXTS), "home.cta.title": "Got a system to build?" },
  );
  const r = convertV1({ tables: v1Export().tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW, projectTexts });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = r.tables.pages!.find((p) => p.path === "/") as any;
  const field = (type: string, name: string) => home.blocks.find((b: { type: string }) => b.type === type)?.fields[name];

  it("siteTexts do banco > arquivo do projeto > template", () => {
    expect(field("cta", "title")).toEqual({ "pt-BR": "Tem um sistema para tirar do papel?", en: "Got a system to build?" });
    // home.hero.headline está no siteTexts: o banco vence o arquivo.
    expect(field("hero", "title")).toEqual({ "pt-BR": "Desenho produtos que as pessoas entendem.", en: "I design products people understand." });
    // Sem mudança no arquivo, vale o template (o en do arquivo é igual ao do template).
    expect(field("cta", "body")).toEqual({ "pt-BR": V1_TEXTS["home.cta.subtitle"]!.pt.trim(), en: V1_TEXTS["home.cta.subtitle"]!.en!.trim() });
  });

  it("texto de interface mudado só no arquivo vai para Textos; o relatório conta as chaves do arquivo", () => {
    expect(r.tables.uiTexts).toContainEqual({ key: "resume.download", value: { "pt-BR": "Baixar PDF", en: V1_TEXTS["resume.downloadCV"]!.en }, updatedAt: NOW });
    expect(r.report.texts.projectKeys).toBe(3);
    // Igual ao template não conta como personalizado.
    expect(r.report.texts.unmapped.map((u) => u.key)).toEqual(["notFound.lines.0"]);
  });
});

describe("migrar com os arquivos de tradução no projeto", () => {
  it("lê antes de tirar o código, guarda a cópia e usa na conversão", async () => {
    const { dir, exportZip } = v1Project("cyberpunk");
    const pt = { ...ptOf(V1_TEXTS), "home.cta.title": "Bora conversar?" };
    mkdirSync(join(dir, "src/i18n/translations"), { recursive: true });
    writeFileSync(join(dir, V1_TRANSLATION_FILES.pt), translationSource("ptBR", pt));
    writeFileSync(join(dir, V1_TRANSLATION_FILES.en), translationSource("enUS", enOf(V1_TEXTS)));
    run("git", ["add", "-A"], { cwd: dir });
    run("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "textos"], { cwd: dir });

    await runMigrate(["--yes", "--sem-instalar", "--export", exportZip], { cwd: dir, pristine });
    const work = join(dir, ".rubrica/migracao");
    expect(existsSync(join(dir, "src/i18n"))).toBe(false);
    expect(JSON.parse(readFileSync(join(work, SAVED_TEXTS_FILE), "utf-8"))["home.cta.title"]).toEqual({ pt: "Bora conversar?", en: V1_TEXTS["home.cta.title"]!.en });
    const pages = strFromU8(unzipSync(readFileSync(join(work, "import-v2.zip")))["pages/documents.jsonl"]!);
    expect(pages).toContain("Bora conversar?");
    expect(readFileSync(join(work, "relatorio.md"), "utf-8")).toMatch(/Arquivos de tradução do projeto.*1 texto mudado/);

    // `migrar dados` depois (o código da v1 já saiu): a cópia guardada vale.
    await runMigrate(["dados", "--export", exportZip], { cwd: dir, out: () => {} });
    expect(strFromU8(unzipSync(readFileSync(join(work, "import-v2.zip")))["pages/documents.jsonl"]!)).toContain("Bora conversar?");
  });
});
