/**
 * `create [pasta] --tipo pessoal|empresa --tema <id>`: gera um projeto v2. O projeto
 * depende de `@rubrica/core` e do tema; o conteúdo inicial (páginas pela receita do
 * tema) é gravado no Convex pelo `setup`, que o create oferece rodar no fim.
 */
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { SiteKind } from "@rubrica/core";
import { list, parseArgs } from "../utils/args.js";
import { run as defaultRun, type Runner, errorOutput, tail } from "../utils/exec.js";
import { isEmptyDir, writeFiles } from "../utils/fs.js";
import { normalizeEmail, normalizeHandle, normalizeUrl, validateEmail, validateUrl } from "../utils/normalize.js";
import { packageManagerFromUserAgent } from "../utils/packageManager.js";
import { COMMON_LOCALES, normalizeLocales } from "../locales.js";
import { defaultPlugins, pluginOptions, pluginsRecord, presetPlugins, unknownPlugins } from "../plugins.js";
import { convexFiles } from "../project/convex.js";
import { CORE_VERSION, defaultDependencySpecs, projectFiles, type DependencySpecs } from "../project/files.js";
import { loadInstalledCore } from "../project/introspect.js";
import type { RubricaState } from "../state.js";
import { COLOR_MODES, getTheme, resolveTheme, SCHEME_IDS, SCHEME_OPTIONS, THEMES, themePackage, type ColorMode } from "../themes.js";
import { ask, canAsk, choose, chooseMany, log, note, outro, spinner } from "../ui.js";
import { track } from "../telemetry.js";

export const CREATE_HELP = `Uso: npx create-rubrica@latest [create] <pasta> [opções]

Opções:
  --tipo pessoal|empresa      tipo de site (padrão: pessoal)
  --tema <id>                 tema (${THEMES.map((t) => t.id).join(", ")})
  --nome <texto>              nome do site ou da empresa
  --url <endereço>            endereço do site (ex.: meusite.com)
  --descricao <texto>         descrição curta (SEO)
  --autor <nome>              dono do site (pessoal) ou contato (empresa)
  --email <e-mail>            e-mail do login do painel e de contato
  --idiomas <lista>           idiomas, separados por vírgula (padrão: pt-BR)
  --idioma-principal <código> idioma sem prefixo na URL (padrão: o primeiro)
  --esquema <id>              esquema de cores (${SCHEME_IDS.join(", ")})
  --modo escuro|claro|automatico
  --plugins <lista|pacote>    plugins separados por vírgula, ou recommended|freelancer|simple
  --gerenciador pnpm|npm      gerenciador de pacotes (padrão: o que rodou o create)
  --local <monorepo>          usa os pacotes de um clone do monorepo (link:), para testar versões novas
  --sem-instalar              não roda o pnpm/npm install
  --sem-git                   não roda o git init
  --sem-setup                 não oferece o setup no fim
  --yes, -y                   não pergunta nada: usa as opções e os padrões`;

const MODES: Record<string, ColorMode> = { escuro: "dark", dark: "dark", claro: "light", light: "light", automatico: "system", "automático": "system", system: "system" };

export interface CreateOptions {
  dir: string;
  name: string;
  state: RubricaState;
  deps: DependencySpecs;
  install: boolean;
  git: boolean;
  packageManager: "pnpm" | "npm";
}

export interface CreateDeps {
  runner?: Runner;
  /** Lê as funções do núcleo instalado (o teste de ponta a ponta usa o de verdade). */
  loadCore?: typeof loadInstalledCore;
}

/** Monta as opções a partir das flags (e das perguntas, se der para perguntar). */
export async function resolveCreateOptions(argv: string[], cwd: string, env: Record<string, string | undefined> = process.env): Promise<CreateOptions> {
  const args = parseArgs(argv, {
    values: ["tipo", "tema", "nome", "url", "descricao", "autor", "email", "idiomas", "idioma-principal", "esquema", "modo", "plugins", "local", "twitter", "gerenciador"],
    flags: ["sem-instalar", "sem-git", "sem-setup", "yes", "help"],
    aliases: { "-y": "yes", "-h": "help" },
  });
  const interactive = canAsk(args.flags.has("yes"));
  const v = args.values;

  let folder = args.positionals[0];
  if (!folder && interactive) folder = await ask("Nome da pasta do projeto:", { placeholder: "meu-site", validate: (s) => (s.trim() ? undefined : "Informe um nome") });
  if (!folder) throw new Error("Informe a pasta do projeto: npx create-rubrica@latest <pasta>");
  const dir = resolve(cwd, folder);
  if (!isEmptyDir(dir)) throw new Error(`A pasta ${folder} já existe e não está vazia. Escolha outro nome.`);
  const name = basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "meu-site";

  let tipo = (v.tipo as SiteKind | undefined) ?? undefined;
  if (tipo && tipo !== "pessoal" && tipo !== "empresa") throw new Error(`Tipo inválido: "${tipo}". Use pessoal ou empresa.`);
  if (!tipo) {
    tipo = interactive
      ? await choose<SiteKind>("Que tipo de site?", [
          { value: "pessoal", label: "Pessoal", hint: "portfólio: sobre, currículo, projetos, blog" },
          { value: "empresa", label: "Empresa", hint: "quem somos, serviços, preços, equipe, cases, contato" },
        ], "pessoal")
      : "pessoal";
  }

  let temaId = v.tema;
  if (temaId && !getTheme(temaId)) throw new Error(`Tema desconhecido: "${temaId}". Temas: ${THEMES.map((t) => t.id).join(", ")}.`);
  if (!temaId) {
    temaId = interactive
      ? await choose("Tema", THEMES.map((t) => ({ value: t.id, label: `${t.label}${t.ported ? "" : " (em breve)"}`, hint: t.hint })), "padrao")
      : "padrao";
  }
  const theme = resolveTheme(temaId);
  if (theme.aviso) log.warn(theme.aviso);
  const spec = getTheme(temaId)!;

  const nome = v.nome ?? (interactive ? await ask(tipo === "empresa" ? "Nome da empresa:" : "Nome do site (o seu nome, se for um portfólio):", { validate: (s) => (s.trim() ? undefined : "Informe o nome") }) : name);
  let url = v.url ? normalizeUrl(v.url) : "";
  if (url && validateUrl(url)) throw new Error(validateUrl(url));
  if (!url) url = interactive ? normalizeUrl(await ask("Endereço do site (ex.: meusite.com; dá para mudar depois):", { initial: `${name}.vercel.app`, validate: validateUrl })) : `https://${name}.vercel.app`;
  const descricao = v.descricao ?? (interactive ? await ask("Descrição curta do site (aparece no Google; Enter para pular):", { initial: "" }) : "");
  const autor = v.autor ?? (tipo === "pessoal" ? nome : undefined);
  let email = v.email ? normalizeEmail(v.email) : undefined;
  if (email && validateEmail(email)) throw new Error(validateEmail(email));
  if (!email && interactive) {
    const answer = await ask("Seu e-mail (login do painel; Enter para pular):", { initial: "", validate: (s) => (s.trim() ? validateEmail(s) : undefined) });
    email = answer ? normalizeEmail(answer) : undefined;
  }

  let idiomasList = list(v.idiomas);
  if (idiomasList.length === 0) {
    idiomasList = interactive
      ? await chooseMany("Idiomas do site (o primeiro é o principal, sem prefixo na URL)", COMMON_LOCALES, ["pt-BR"])
      : ["pt-BR"];
  }
  const idiomas = normalizeLocales(idiomasList.length ? idiomasList : ["pt-BR"], v["idioma-principal"]);

  const esquema = v.esquema ?? (interactive ? await choose("Esquema de cores", SCHEME_OPTIONS, spec.recommended.scheme) : spec.recommended.scheme);
  if (!SCHEME_IDS.includes(esquema)) throw new Error(`Esquema desconhecido: "${esquema}". Esquemas: ${SCHEME_IDS.join(", ")}.`);
  const modo = v.modo ? MODES[v.modo.toLowerCase()] : interactive ? await choose("Modo de cor", COLOR_MODES, spec.recommended.mode) : spec.recommended.mode;
  if (!modo) throw new Error(`Modo inválido: "${v.modo}". Use escuro, claro ou automatico.`);

  let selected: string[];
  if (v.plugins) {
    selected = presetPlugins(v.plugins, tipo) ?? (v.plugins === "nenhum" ? [] : list(v.plugins));
    const unknown = unknownPlugins(tipo, selected);
    if (unknown.length) throw new Error(`Plugins desconhecidos para sites do tipo ${tipo}: ${unknown.join(", ")}.`);
  } else if (interactive) {
    selected = await chooseMany(
      "Plugins (espaço marca e desmarca; dá para mudar depois no painel)",
      pluginOptions(tipo).map((p) => ({ value: p.id, label: p.label, hint: p.needsKey ? `${p.description} (precisa de chave: ${p.needsKey})` : p.description })),
      defaultPlugins(tipo),
    );
  } else {
    selected = defaultPlugins(tipo);
  }

  const state: RubricaState = {
    rubrica: 2,
    version: CORE_VERSION,
    tipo,
    tema: theme.tema,
    ...(theme.temaDesejado && { temaDesejado: theme.temaDesejado }),
    identidade: { nome, url, descricao, ...(autor && { autor }), ...(email && { email }), ...(v.twitter && { twitter: normalizeHandle(v.twitter) }) },
    idiomas,
    aparencia: { esquema, modo, alternancia: true, fonteSans: spec.recommended.fontSans, ...(spec.recommended.fontMono && { fonteMono: spec.recommended.fontMono }) },
    plugins: pluginsRecord(tipo, selected),
  };

  return {
    dir,
    name,
    state,
    deps: v.local ? localDependencySpecs(resolve(cwd, v.local), theme.tema) : defaultDependencySpecs(),
    install: !args.flags.has("sem-instalar"),
    git: !args.flags.has("sem-git"),
    packageManager: v.gerenciador === "pnpm" || v.gerenciador === "npm" ? v.gerenciador : packageManagerFromUserAgent(env.npm_config_user_agent),
  };
}

/** Pacotes de um clone do monorepo (`link:`), para testar uma versão antes de publicar. */
export function localDependencySpecs(monorepo: string, theme: string): DependencySpecs {
  const pkg = (p: string) => join(monorepo, p);
  const themeDir = pkg(`packages/themes/${theme}`);
  if (!existsSync(pkg("packages/core/package.json"))) throw new Error(`Não achei packages/core em ${monorepo} (--local precisa apontar para o monorepo do Rubrica).`);
  if (!existsSync(join(themeDir, "package.json"))) throw new Error(`O tema ${theme} não existe em ${monorepo}/packages/themes.`);
  return { core: `link:${pkg("packages/core")}`, theme: `link:${themeDir}`, cli: `link:${pkg("packages/create-rubrica")}` };
}

/** Grava o projeto, instala e gera o convex/ com as funções do núcleo instalado. */
export async function createProject(options: CreateOptions, deps: CreateDeps = {}): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const { dir, state } = options;
  writeFiles(dir, projectFiles({ name: options.name, state, deps: options.deps }));
  log.success(`Projeto criado em ${dir} (tema ${themePackage(state.tema)}, tipo ${state.tipo}).`);

  if (options.git && !existsSync(join(dir, ".git"))) {
    try {
      runner("git", ["init", "-q"], { cwd: dir });
    } catch {
      log.warn("Não deu para rodar o git init (o git está instalado?). Siga sem ele ou rode depois.");
    }
  }

  if (!options.install) return;
  const s = spinner();
  s.start(`Instalando as dependências com o ${options.packageManager} (leva um ou dois minutos)...`);
  try {
    runner(options.packageManager, ["install"], { cwd: dir });
    s.stop("Dependências instaladas.");
  } catch (err) {
    s.stop("A instalação falhou.");
    throw new Error(`O ${options.packageManager} install falhou:\n${tail(errorOutput(err))}\n\nCorrija e rode ${options.packageManager} install na pasta ${dir}.`);
  }

  // O núcleo instalado pode ser de uma versão diferente da deste CLI: o convex/ segue o instalado.
  try {
    const core = await (deps.loadCore ?? loadInstalledCore)(dir);
    writeFiles(dir, convexFiles(core.modules));
  } catch (err) {
    log.warn(`Não consegui ler as funções do @rubrica/core instalado (${(err as Error).message}); o convex/ ficou com as da versão ${CORE_VERSION}. Rode npx create-rubrica verificar.`);
  }
}

export interface RunCreateDeps extends CreateDeps {
  cwd: string;
  noTelemetry?: boolean;
  /** Roda o setup no fim (o roteador injeta). */
  setup?: (projectDir: string, newProject: string) => Promise<void>;
}

export async function runCreate(argv: string[], deps: RunCreateDeps): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(CREATE_HELP);
    return;
  }
  const options = await resolveCreateOptions(argv, deps.cwd);
  if (deps.noTelemetry) options.state.telemetria = { ativa: false };
  await createProject(options, deps);
  await track(options.dir, "criacao", {
    tipo: options.state.tipo,
    tema: options.state.temaDesejado ?? options.state.tema,
    esquema: options.state.aparencia.esquema,
    modo: options.state.aparencia.modo,
    idiomas: options.state.idiomas.lista.length,
    plugins: Object.entries(options.state.plugins).filter(([, on]) => on).map(([id]) => id),
  }, { packageManager: options.packageManager, notice: (m) => log.info(m) });

  const folder = basename(options.dir);
  const runSetup = options.install && !argv.includes("--sem-setup") && canAsk(argv.includes("--yes") || argv.includes("-y")) && deps.setup;
  if (runSetup) {
    note("O setup liga o projeto ao Convex (o backend), cria o seu login do painel e monta as páginas iniciais.", "Próximo passo");
    await deps.setup!(options.dir, options.name);
    return;
  }
  outro(
    [
      "Pronto! Próximos passos:",
      `  cd ${folder}`,
      ...(options.install ? [] : [`  ${options.packageManager} install`]),
      "  npx create-rubrica setup     (liga o Convex, cria o login e o conteúdo inicial)",
      `  ${options.packageManager} dev`,
    ].join("\n"),
  );
}
