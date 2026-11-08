/**
 * `migrar` (RFC v2, decisão 7 e "Migração da v1"): leva um projeto da v1 para a v2.
 *
 *   migrar --relatorio [--export x.zip] [--template-v1 <pasta>] [--saida rel.md]
 *       Só lê: tema equivalente, personalizações e (com o export) o que os dados viram.
 *   migrar [--export x.zip] [--yes]
 *       Num projeto v1 na última versão, com o git limpo: cria a branch rubrica-v2, troca
 *       o código, converte os dados (com o export), builda com os dados convertidos e
 *       grava o relatório. O import no Convex é a pessoa que faz, num deployment de
 *       desenvolvimento novo; a produção só com o "ok" explícito dela.
 *   migrar dados --export x.zip [--saida <pasta>]
 *       Só a conversão (import da v2, pendentes, fixtures e relatório).
 *   migrar conferir --v1 <url|dist> [--v2 <dist>]
 *       Compara título, h1 e texto das páginas principais.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CORE_RECIPES, type Recipe } from "@rubrica/core";
import { parseArgs } from "../utils/args.js";
import { errorOutput, run as defaultRun, tail, type Runner } from "../utils/exec.js";
import { projectPackageManager, writeFiles } from "../utils/fs.js";
import { buildPristine } from "../v1/pristine.js";
import type { RubricaState as V1State } from "../v1/state.js";
import { convexFiles } from "../project/convex.js";
import { CORE_VERSION, GITIGNORE, defaultDependencySpecs, projectFiles, type DependencySpecs } from "../project/files.js";
import { loadInstalledCore, loadThemeRecipe } from "../project/introspect.js";
import { convertV1, type ConvertResult, type V1RubricaJson } from "../migrate/convert.js";
import { listCustomizations, type Customization } from "../migrate/customizations.js";
import { importZip, pendingZip, readSnapshot } from "../migrate/snapshot.js";
import { toFixtures } from "../migrate/fixtures.js";
import { renderReport, type ReportInput } from "../migrate/report.js";
import { MAIN_PAGES, comparePage, fetchPage, formatComparison, readDistPage } from "../migrate/compare.js";
import { defaultPlugins, pluginsRecord } from "../plugins.js";
import { STATE_FILE, type RubricaState } from "../state.js";
import { resolveTheme, themeForV1Layout, themePackage, type ThemeChoice } from "../themes.js";
import { localDependencySpecs } from "./create.js";
import { Cancelled, canAsk, confirm, log, note, outro, spinner } from "../ui.js";
import { track } from "../telemetry.js";

/** Última versão da v1: o `migrar` só parte dela (as transformações de dados assumem o schema dela). */
export const LAST_V1 = "1.13.1";
export const BRANCH = "rubrica-v2";
export const WORK_DIR = ".rubrica/migracao";

/** Raiz do projeto v1 que fica na v2 (o resto do template sai; continua no histórico do git). */
const KEEP = new Set([".git", "public", "docs", "README.md", "LICENSE", ".agents", ".claude", ".github", ".rubrica", "node_modules", ".env.local", ".env", ".vscode", ".idea"]);

export interface MigrateDeps {
  cwd: string;
  runner?: Runner;
  /** Monta a v1 de referência numa pasta (teste troca). */
  pristine?: (dir: string, v1: V1RubricaJson, packageName: string, templateDir?: string) => Promise<void>;
  fetchFn?: typeof fetch;
  out?: (text: string) => void;
}

export function readV1(projectDir: string): V1RubricaJson {
  const path = join(projectDir, STATE_FILE);
  if (!existsSync(path)) throw new Cancelled("Não achei o rubrica.json: rode o migrar na pasta de um projeto da v1. (Projeto criado por fork? Primeiro alinhe com a última v1 pelo git.)");
  const raw = JSON.parse(readFileSync(path, "utf-8")) as V1RubricaJson & { rubrica?: number };
  if (raw.rubrica === 2) throw new Cancelled("Este projeto já está na v2. Para atualizar: npx create-rubrica update.");
  if (typeof raw.layout !== "string") throw new Cancelled("O rubrica.json não parece de um projeto da v1 (sem o campo layout).");
  return raw;
}

/** Monta a última v1 com as escolhas do projeto (para a comparação), de uma pasta local ou do GitHub. */
async function defaultPristine(dir: string, v1: V1RubricaJson, packageName: string, templateDir?: string): Promise<void> {
  const tag = `v${v1.version ?? LAST_V1}`;
  const download = templateDir
    ? async (target: string) => {
        mkdirSync(target, { recursive: true });
        if (existsSync(join(templateDir, ".git"))) {
          // Clone da tag: a árvore inteira (o tarball da release deixa de fora docs/, tests/… por
          // export-ignore, e um fork tem esses arquivos). A pasta de origem não muda.
          defaultRun("git", ["clone", "-q", "--depth", "1", "--branch", tag, `file://${resolve(templateDir)}`, target]);
          rmSync(join(target, ".git"), { recursive: true, force: true });
        } else {
          cpSync(templateDir, target, { recursive: true, filter: (src) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(src) });
        }
      }
    : undefined;
  await buildPristine({ dir, version: tag, state: { plugins: {}, ...v1 } as V1State, packageName, ...(download && { download }) });
}

export function v2StateFrom(v1: V1RubricaJson, theme: ThemeChoice, plugins?: Record<string, boolean>, now = new Date()): RubricaState {
  const id = v1.identity ?? {};
  return {
    rubrica: 2,
    version: CORE_VERSION,
    tipo: "pessoal",
    tema: theme.tema,
    ...(theme.temaDesejado && { temaDesejado: theme.temaDesejado }),
    identidade: {
      nome: id.siteName || id.authorName || "Meu site",
      url: (id.siteUrl || "https://exemplo.com").replace(/\/+$/, ""),
      descricao: id.siteDescription ?? "",
      ...(id.authorName && { autor: id.authorName }),
      ...(id.authorEmail && { email: id.authorEmail }),
      ...(id.twitterHandle && { twitter: id.twitterHandle }),
    },
    idiomas: { lista: ["pt-BR", "en"], principal: "pt-BR" },
    aparencia: {
      ...(v1.theme && { esquema: v1.theme }),
      modo: v1.colorMode ?? "dark",
      alternancia: v1.colorModeToggle ?? false,
      ...(v1.fontSans && { fonteSans: v1.fontSans }),
      ...(v1.fontMono && { fonteMono: v1.fontMono }),
    },
    plugins: plugins ?? pluginsRecord("pessoal", defaultPlugins("pessoal")),
    migracao: { de: v1.version ?? LAST_V1, layoutV1: v1.layout ?? "", em: now.toISOString().slice(0, 10) },
  };
}

interface DataOutputs {
  result: ConvertResult;
  files: Record<string, string>;
}

/** Converte o export e grava import, pendentes, fixtures (na pasta `outDir`). */
export function convertExport(exportPath: string, v1: V1RubricaJson, theme: string, recipe: Recipe, outDir: string, storageUrl?: (id: string) => string): DataOutputs {
  const snapshot = readSnapshot(exportPath);
  const result = convertV1({ tables: snapshot.tables, v1, theme, recipe });
  mkdirSync(outDir, { recursive: true });
  const files: Record<string, string> = {};
  writeFileSync(join(outDir, "import-v2.zip"), importZip(result, snapshot));
  files["Import da v2"] = join(outDir, "import-v2.zip");
  const pending = pendingZip(result, snapshot);
  if (pending) {
    writeFileSync(join(outDir, "pendentes-v1.zip"), pending);
    files["Tabelas pendentes (como estavam)"] = join(outDir, "pendentes-v1.zip");
  }
  const fixturesDir = join(outDir, "fixtures");
  rmSync(fixturesDir, { recursive: true, force: true });
  writeFiles(fixturesDir, toFixtures(result, storageUrl));
  files["Dados convertidos para build sem banco (RUBRICA_FIXTURES)"] = fixturesDir;
  return { result, files };
}

function importSteps(outDir: string): string[] {
  return [
    "Crie um Convex de **desenvolvimento novo e vazio** para a v2: `npx convex dev --configure new --once` (o .env.local passa a apontar para ele; o banco da v1 fica intacto).",
    `Importe os dados nele: \`npx convex import ${join(outDir, "import-v2.zip")}\` (confira antes o CONVEX_DEPLOYMENT do .env.local).`,
    "Rode `npx create-rubrica setup` (chaves do login e variáveis; o root e as páginas já vieram no import).",
    "Abra o site (`pnpm dev` e `pnpm dev:convex`), entre no painel com o mesmo e-mail e senha da v1 e confira as páginas.",
    "Produção: só com o seu ok explícito, e depois de conferir o desenvolvimento. O import em produção apaga o que houver lá: combine antes.",
  ];
}

async function customizationsFor(projectDir: string, v1: V1RubricaJson, packageName: string, deps: MigrateDeps, templateDir?: string): Promise<{ list?: Customization[]; error?: string }> {
  const dir = mkdtempSync(join(tmpdir(), "rubrica-v1-pristine-"));
  try {
    await (deps.pristine ?? defaultPristine)(dir, v1, packageName, templateDir);
    return { list: listCustomizations(projectDir, dir, gitFiles(projectDir, deps.runner ?? defaultRun)) };
  } catch (err) {
    return { error: `${(err as Error).message}${templateDir ? "" : " (sem internet? passe --template-v1 <pasta com o repositório do Rubrica>)"}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Arquivos do projeto pelo git (versionados + novos não ignorados): deixa de fora caches e gerados. */
function gitFiles(projectDir: string, runner: Runner): string[] | undefined {
  if (!existsSync(join(projectDir, ".git"))) return undefined;
  try {
    return runner("git", ["ls-files", "-co", "--exclude-standard"], { cwd: projectDir }).split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return undefined;
  }
}

function packageNameOf(projectDir: string): string {
  try {
    return (JSON.parse(readFileSync(join(projectDir, "package.json"), "utf-8")) as { name?: string }).name ?? "meu-site";
  } catch {
    return "meu-site";
  }
}

// ── Subcomandos ─────────────────────────────────────────────────────────────

async function runReport(projectDir: string, values: Record<string, string>, deps: MigrateDeps): Promise<string> {
  const v1 = readV1(projectDir);
  const spec = themeForV1Layout(v1.layout);
  const theme = resolveTheme(spec.id);
  const name = packageNameOf(projectDir);
  const custom = await customizationsFor(projectDir, v1, name, deps, values["template-v1"] && resolve(deps.cwd, values["template-v1"]));
  let data;
  if (values.export) {
    const snapshot = readSnapshot(resolve(deps.cwd, values.export));
    data = convertV1({ tables: snapshot.tables, v1, theme: theme.tema, recipe: CORE_RECIPES.pessoal }).report;
  }
  const report = renderReport({
    projectName: name,
    v1Version: v1.version ?? "?",
    layout: v1.layout ?? "?",
    theme,
    ...(data && { data }),
    ...(custom.list && { customizations: custom.list }),
    ...(custom.error && { customizationsError: custom.error }),
    nextSteps: [
      v1.version === LAST_V1 ? "A v1 está na última versão: dá para migrar." : `Atualize a v1 para a ${LAST_V1} antes (npx create-rubrica@1 update).`,
      "Faça commit de tudo e rode `npx create-rubrica@latest migrar` (cria a branch rubrica-v2; nada muda na branch atual).",
      ...(values.export ? [] : ["Exporte os dados do Convex de desenvolvimento da v1 (`npx convex export --path .rubrica/migracao/export-v1.zip`) para ver no relatório o que eles viram."]),
    ],
  });
  if (values.saida) writeFileSync(resolve(deps.cwd, values.saida), report);
  return report;
}

async function runCompare(values: Record<string, string>, deps: MigrateDeps): Promise<string> {
  if (!values.v1) throw new Cancelled("Uso: npx create-rubrica migrar conferir --v1 <url do site v1 ou pasta dist> [--v2 <pasta dist da v2>]");
  const v2 = resolve(deps.cwd, values.v2 ?? "dist");
  const isUrl = /^https?:\/\//.test(values.v1);
  const results = [];
  for (const path of MAIN_PAGES) {
    const a = isUrl ? await fetchPage(values.v1, path, deps.fetchFn) : readDistPage(resolve(deps.cwd, values.v1), path);
    results.push(comparePage(path, a, readDistPage(v2, path)));
  }
  return formatComparison(results.filter((r) => r.missing !== "v1"));
}

async function runData(projectDir: string, values: Record<string, string>, deps: MigrateDeps): Promise<DataOutputs> {
  if (!values.export) throw new Cancelled(`Uso: npx create-rubrica migrar dados --export <arquivo.zip>. Para gerar o export: npx convex export --path ${WORK_DIR}/export-v1.zip`);
  const raw = JSON.parse(readFileSync(join(projectDir, STATE_FILE), "utf-8")) as Record<string, unknown>;
  const migrated = raw.rubrica === 2 ? (raw as RubricaState) : null;
  const v1: V1RubricaJson = migrated ? (raw.v1 as V1RubricaJson | undefined) ?? { layout: migrated.migracao?.layoutV1 ?? "", version: migrated.migracao?.de } : readV1(projectDir);
  const tema = migrated?.tema ?? resolveTheme(themeForV1Layout(v1.layout).id).tema;
  let recipe: Recipe = CORE_RECIPES.pessoal;
  try {
    recipe = (await loadThemeRecipe(projectDir, themePackage(tema), "pessoal")) ?? CORE_RECIPES.pessoal;
  } catch {
    // tema ainda não instalado (projeto ainda na v1): a receita do núcleo
  }
  const outDir = resolve(deps.cwd, values.saida ?? WORK_DIR);
  return convertExport(resolve(deps.cwd, values.export), v1, tema, recipe, outDir, values["convex-url"] ? (id) => `${values["convex-url"]!.replace(/\/+$/, "")}/api/storage/${id}` : undefined);
}

async function runFull(projectDir: string, values: Record<string, string>, flags: Set<string>, deps: MigrateDeps): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const v1 = readV1(projectDir);
  if (v1.version !== LAST_V1) throw new Cancelled(`O projeto está na v1 ${v1.version ?? "?"}; o migrar parte da ${LAST_V1}. Atualize antes: npx create-rubrica@1 update (e faça o commit).`);
  let dirty = "";
  try {
    dirty = runner("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: projectDir }).trim();
  } catch {
    throw new Cancelled("O migrar precisa do git (é o que permite voltar atrás). Rode git init e faça um commit antes.");
  }
  if (dirty) throw new Cancelled("Há mudanças sem commit. Faça commit (ou descarte) antes de migrar.");

  const spec = themeForV1Layout(v1.layout);
  const theme = resolveTheme(spec.id);
  if (theme.aviso) log.warn(theme.aviso);
  const name = packageNameOf(projectDir);
  note(
    [
      `Layout ${v1.layout} → tema ${theme.temaDesejado ?? theme.tema}${theme.temaDesejado ? ` (por enquanto, ${theme.tema})` : ""}`,
      `1. Criar a branch ${BRANCH} (a branch atual não muda)`,
      "2. Listar as personalizações comparando com a última v1",
      "3. Trocar o código: sai o template, entram @rubrica/core e o tema",
      values.export ? "4. Converter os dados do export para um arquivo de import da v2" : "4. (sem --export: os dados ficam para o migrar dados)",
      "5. Instalar e buildar com os dados convertidos",
      "Nada é gravado no Convex: o import é você que faz, num banco de desenvolvimento novo.",
    ].join("\n"),
    "Migração para a v2",
  );
  if (!flags.has("yes") && !(canAsk() && (await confirm("Migrar agora?", true)))) throw new Cancelled();

  // 1. Branch.
  try {
    runner("git", ["switch", "-c", BRANCH], { cwd: projectDir });
  } catch (err) {
    throw new Cancelled(`Não deu para criar a branch ${BRANCH} (${tail(errorOutput(err), 2)}). Ela já existe? Apague ou renomeie e rode de novo.`);
  }

  // 2. Personalizações (antes de tirar o código).
  const s = spinner();
  s.start("Comparando com a última v1...");
  const custom = await customizationsFor(projectDir, v1, name, deps, values["template-v1"] && resolve(deps.cwd, values["template-v1"]));
  s.stop(custom.list ? `${custom.list.length} arquivo(s) diferem da v1 de referência.` : "Não deu para comparar com a v1.");

  // 3. Código.
  const previous = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf-8")) as Record<string, unknown>;
  const oldGitignore = existsSync(join(projectDir, ".gitignore")) ? readFileSync(join(projectDir, ".gitignore"), "utf-8") : "";
  for (const entry of readdirSync(projectDir)) if (!KEEP.has(entry)) rmSync(join(projectDir, entry), { recursive: true, force: true });
  rmSync(join(projectDir, "public", "data"), { recursive: true, force: true });
  const state = v2StateFrom(v1, theme);
  const depSpecs: DependencySpecs = values.local ? localDependencySpecs(resolve(deps.cwd, values.local), theme.tema) : defaultDependencySpecs();
  const { dependencies: _d, devDependencies: _dd, scripts: _s, ...keepPkg } = previous;
  void _d;
  void _dd;
  void _s;
  const files = projectFiles({ name, state, deps: depSpecs, previousPackageJson: keepPkg });
  const extra = oldGitignore.split("\n").filter((l) => l.trim() && !GITIGNORE.includes(l.trim()));
  files[".gitignore"] = `${GITIGNORE}${extra.length ? `\n# Da v1\n${extra.join("\n")}\n` : ""}`;
  writeFiles(projectDir, files);
  writeFileSync(join(projectDir, STATE_FILE), `${JSON.stringify({ ...state, v1: { version: v1.version, layout: v1.layout, theme: v1.theme, fontSans: v1.fontSans, fontMono: v1.fontMono, colorMode: v1.colorMode, colorModeToggle: v1.colorModeToggle, identity: v1.identity } }, null, 2)}\n`);
  log.success("Código trocado: o projeto agora depende de @rubrica/core e do tema.");

  // 4. Instalar e gerar o convex/ com o núcleo instalado.
  const pm = projectPackageManager(projectDir, "pnpm");
  if (!flags.has("sem-instalar")) {
    s.start(`Instalando com o ${pm}...`);
    try {
      runner(pm, ["install"], { cwd: projectDir });
      s.stop("Instalado.");
      const core = await loadInstalledCore(projectDir);
      writeFiles(projectDir, convexFiles(core.modules));
    } catch (err) {
      s.stop("A instalação falhou.");
      log.warn(`Rode ${pm} install à mão:\n${tail(errorOutput(err))}`);
    }
  }

  // 5. Dados.
  const outDir = join(projectDir, WORK_DIR);
  let data: DataOutputs | undefined;
  if (values.export) {
    let recipe: Recipe = CORE_RECIPES.pessoal;
    try {
      recipe = (await loadThemeRecipe(projectDir, themePackage(state.tema), "pessoal")) ?? recipe;
    } catch {
      // sem receita do tema: a do núcleo
    }
    data = convertExport(resolve(deps.cwd, values.export), v1, state.tema, recipe, outDir);
    const plugins = (data.result.tables.siteSettings?.[0]?.plugins ?? {}) as Record<string, boolean>;
    const current = JSON.parse(readFileSync(join(projectDir, STATE_FILE), "utf-8")) as RubricaState;
    writeFileSync(join(projectDir, STATE_FILE), `${JSON.stringify({ ...current, plugins: { ...current.plugins, ...plugins } }, null, 2)}\n`);
  }

  // 6. Build com os dados convertidos (sem banco).
  let build = "não rodado (sem export)";
  if (data && !flags.has("sem-instalar") && !flags.has("sem-build")) {
    s.start("Buildando a v2 com os dados convertidos...");
    try {
      runner(pm, ["run", "build"], { cwd: projectDir, env: { RUBRICA_FIXTURES: join(outDir, "fixtures") } });
      build = "ok";
      s.stop("Build da v2 ok.");
    } catch (err) {
      build = `falhou: ${tail(errorOutput(err), 5)}`;
      s.stop("O build falhou (veja o relatório).");
    }
  }

  const reportInput: ReportInput = {
    projectName: name,
    v1Version: v1.version ?? "?",
    layout: v1.layout ?? "?",
    theme,
    ...(data && { data: data.result.report }),
    ...(custom.list && { customizations: custom.list }),
    ...(custom.error && { customizationsError: custom.error }),
    outputs: { ...(data?.files ?? {}), Relatório: join(outDir, "relatorio.md") },
    nextSteps: [
      ...(data ? [] : [`Exporte os dados da v1 (no Convex de desenvolvimento dela, antes de trocar o .env.local): \`npx convex export --path ${WORK_DIR}/export-v1.zip\`, e rode \`npx create-rubrica migrar dados --export ${WORK_DIR}/export-v1.zip\`.`]),
      `Build com os dados convertidos: ${build}. Compare com o site no ar: \`npx create-rubrica migrar conferir --v1 ${v1.identity?.siteUrl ?? "<url da v1>"} --v2 dist\`.`,
      ...importSteps(join(WORK_DIR)),
      "Para cada personalização listada, siga a sugestão (bloco próprio, ejetar, tokens). Depois: pnpm check, pnpm test, commit na branch rubrica-v2.",
    ],
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "relatorio.md"), renderReport(reportInput));
  await track(projectDir, "migracao", { layout: v1.layout, tema: theme.temaDesejado ?? theme.tema, comDados: !!data, personalizacoes: custom.list?.length ?? null, build: build === "ok" });
  outro(`Migração preparada na branch ${BRANCH}. Relatório: ${WORK_DIR}/relatorio.md\nO Convex não foi tocado: siga os próximos passos do relatório.`);
}

export async function runMigrate(argv: string[], deps: MigrateDeps): Promise<void> {
  const out = deps.out ?? ((t: string) => console.log(t));
  const args = parseArgs(argv, {
    values: ["export", "template-v1", "saida", "v1", "v2", "local", "convex-url"],
    flags: ["relatorio", "yes", "sem-instalar", "sem-build"],
    aliases: { "-y": "yes" },
  });
  const sub = args.positionals[0];
  const projectDir = resolve(deps.cwd);
  if (sub === "conferir") {
    out(await runCompare(args.values, deps));
    return;
  }
  if (sub === "dados") {
    const { result, files } = await runData(projectDir, args.values, deps);
    const v1 = (() => {
      try {
        return readV1(projectDir);
      } catch {
        return { version: "?", layout: "?" } as V1RubricaJson;
      }
    })();
    const report = renderReport({ projectName: packageNameOf(projectDir), v1Version: v1.version ?? "?", layout: v1.layout ?? "?", theme: { tema: String(result.tables.siteSettings?.[0]?.theme ?? "?") }, data: result.report, outputs: files, nextSteps: importSteps(WORK_DIR) });
    const reportPath = join(resolve(deps.cwd, args.values.saida ?? WORK_DIR), "relatorio-dados.md");
    writeFileSync(reportPath, report);
    out(report);
    outro(`Dados convertidos. Relatório: ${reportPath}`);
    return;
  }
  if (sub) throw new Cancelled(`Subcomando desconhecido: ${sub}. Use migrar, migrar --relatorio, migrar dados ou migrar conferir.`);
  if (args.flags.has("relatorio")) {
    out(await runReport(projectDir, args.values, deps));
    return;
  }
  await runFull(projectDir, args.values, args.flags, deps);
}
