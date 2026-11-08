/**
 * Compila os exemplos de código da documentação (o `check` deste app).
 *
 * Todo bloco ```ts ou ```tsx dos guias (docs/guia/*.md) e do docs/v2/contribuindo.md precisa
 * vir logo depois de um marcador que diz onde ele mora (um ```json com marcador também
 * entra, e é conferido como JSON):
 *
 *   <!-- exemplo: projeto/src/blocks/selo.tsx -->
 *
 * O primeiro trecho do caminho é o cenário; o resto, o arquivo dentro dele. Cada idioma
 * (o .md e o .en.md) é compilado à parte, com os arquivos do mesmo cenário juntos, então
 * um exemplo pode importar outro. Cenários:
 *
 * - `projeto`: um projeto criado pelo CLI (src/ e convex/). O convex/_generated vem do
 *   apps/demo, e os tipos das tabelas saem do convex/schema.ts do exemplo.
 * - `tema`: um pacote de tema (src/, package.json, fonts.json).
 * - `nucleo`: arquivos novos dentro de packages/core (importações relativas resolvem
 *   contra o núcleo de verdade, por `rootDirs`).
 *
 * Um bloco ```ts sem marcador, ou com cenário desconhecido, faz o check falhar: assim
 * nenhum exemplo publicado escapa da compilação.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import ts from "typescript";
import { REPO_ROOT } from "./blocos/fonte";

const DOCS = [
  ...readdirSync(join(REPO_ROOT, "docs/guia"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => `docs/guia/${f}`),
  "docs/v2/contribuindo.md",
  "docs/v2/contribuindo.en.md",
].filter((f) => existsSync(join(REPO_ROOT, f)));

const SCENARIOS = ["projeto", "tema", "nucleo"] as const;
type Scenario = (typeof SCENARIOS)[number];

const OUT = join(REPO_ROOT, "apps/docs/.exemplos");

export interface Example {
  doc: string;
  /** Linha (1 em diante) da primeira linha de código no .md. */
  line: number;
  lang: string;
  scenario: Scenario;
  file: string;
  code: string;
}

const MARK = /^<!--\s*exemplo:\s*([^\s]+)\s*-->\s*$/;
const FENCE = /^```(\w*)\s*$/;
const CHECKED = new Set(["ts", "tsx", "json"]);

/** Exemplos de um .md e os problemas de marcação. */
export function extract(doc: string, md: string): { examples: Example[]; problems: string[] } {
  const lines = md.split("\n");
  const examples: Example[] = [];
  const problems: string[] = [];
  let pending: { path: string; line: number } | undefined;
  for (let i = 0; i < lines.length; i++) {
    const mark = lines[i]!.match(MARK);
    if (mark) {
      pending = { path: mark[1]!, line: i + 1 };
      continue;
    }
    const fence = lines[i]!.match(FENCE);
    if (!fence) {
      if (lines[i]!.trim() && pending) {
        problems.push(`${doc}:${pending.line}: o marcador precisa vir logo antes do bloco de código`);
        pending = undefined;
      }
      continue;
    }
    const lang = fence[1]!;
    const start = i + 1;
    let end = start;
    while (end < lines.length && !/^```\s*$/.test(lines[end]!)) end++;
    const code = lines.slice(start, end).join("\n");
    i = end;
    if (!CHECKED.has(lang)) {
      if (pending) problems.push(`${doc}:${pending.line}: marcador num bloco ${lang || "sem linguagem"} (só ts, tsx e json são compilados)`);
      pending = undefined;
      continue;
    }
    if (!pending) {
      // JSON solto (um .mcp.json de exemplo) pode ficar sem marcador; TypeScript, não.
      if (lang !== "json") problems.push(`${doc}:${start}: bloco ${lang} sem o marcador <!-- exemplo: cenário/arquivo -->`);
      continue;
    }
    const [scenario, ...rest] = pending.path.split("/");
    if (!SCENARIOS.includes(scenario as Scenario) || rest.length === 0) {
      problems.push(`${doc}:${pending.line}: cenário desconhecido em "${pending.path}" (use ${SCENARIOS.join(", ")})`);
    } else {
      examples.push({ doc, line: start + 1, lang, scenario: scenario as Scenario, file: rest.join("/"), code });
    }
    pending = undefined;
  }
  return { examples, problems };
}

const BASE = JSON.parse(readFileSync(join(REPO_ROOT, "tsconfig.base.json"), "utf-8")).compilerOptions as Record<string, unknown>;

function compile(dir: string, scenario: Scenario, files: string[]): readonly ts.Diagnostic[] {
  const options: Record<string, unknown> = { ...BASE, types: ["node"], noEmit: true };
  if (scenario === "nucleo") options.rootDirs = [dir, join(REPO_ROOT, "packages/core")];
  const parsed = ts.convertCompilerOptionsFromJson(options, dir);
  if (parsed.errors.length) return parsed.errors;
  const program = ts.createProgram(files, parsed.options);
  // Só os erros dos exemplos: o resto (núcleo, temas) tem o check próprio.
  return ts.getPreEmitDiagnostics(program).filter((d) => !d.file || d.file.fileName.startsWith(dir));
}

function main(): number {
  const problems: string[] = [];
  const all: Example[] = [];
  for (const doc of DOCS) {
    const r = extract(doc, readFileSync(join(REPO_ROOT, doc), "utf-8"));
    problems.push(...r.problems);
    all.push(...r.examples);
  }

  rmSync(OUT, { recursive: true, force: true });
  const groups = new Map<string, Example[]>();
  for (const ex of all) {
    const lang = ex.doc.endsWith(".en.md") ? "en" : "pt";
    const key = `${lang}/${ex.scenario}`;
    groups.set(key, [...(groups.get(key) ?? []), ex]);
  }

  let compiled = 0;
  for (const [key, examples] of groups) {
    const dir = join(OUT, key);
    const where = new Map<string, Example>();
    for (const ex of examples) {
      const path = join(dir, ex.file);
      if (where.has(path)) {
        problems.push(`${ex.doc}:${ex.line}: ${key}/${ex.file} já foi usado em ${where.get(path)!.doc}:${where.get(path)!.line}`);
        continue;
      }
      where.set(path, ex);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `${ex.code}\n`);
      if (ex.lang === "json") {
        try {
          JSON.parse(ex.code);
        } catch (e) {
          problems.push(`${ex.doc}:${ex.line}: JSON inválido (${(e as Error).message})`);
        }
      }
    }
    const scenario = examples[0]!.scenario;
    if (scenario === "projeto" && existsSync(join(dir, "convex"))) {
      // Os tipos gerados pelo Convex (o dataModel lê o convex/schema.ts do exemplo).
      const generated = join(REPO_ROOT, "apps/demo/convex/_generated");
      mkdirSync(join(dir, "convex/_generated"), { recursive: true });
      for (const f of ["dataModel.d.ts", "server.d.ts", "server.js"]) cpSync(join(generated, f), join(dir, "convex/_generated", f));
    }
    const files = [...where.keys()].filter((f) => /\.tsx?$/.test(f));
    compiled += files.length;
    for (const d of compile(dir, scenario, files)) {
      const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      if (!d.file || d.start === undefined) {
        problems.push(`${key}: ${message}`);
        continue;
      }
      const ex = where.get(d.file.fileName);
      const { line } = d.file.getLineAndCharacterOfPosition(d.start);
      problems.push(ex ? `${ex.doc}:${ex.line + line}: ${message}` : `${relative(REPO_ROOT, d.file.fileName)}:${line + 1}: ${message}`);
    }
  }

  for (const p of problems) console.error(p);
  if (problems.length) {
    console.error(`\n${problems.length} problema(s) nos exemplos da documentação. Os arquivos compilados ficam em ${relative(REPO_ROOT, OUT)}.`);
    return 1;
  }
  rmSync(OUT, { recursive: true, force: true });
  console.log(`Exemplos da documentação: ${compiled} arquivo(s) TypeScript compilados, ${all.length} bloco(s) no total.`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main();
