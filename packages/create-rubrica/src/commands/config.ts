/**
 * `config`: troca identidade, tipo, tema, esquema de cores, idiomas, plugins ou o analytics.
 *
 * Grava no `rubrica.json`, ajusta o código quando precisa (tema: dependência e
 * `astro.config.ts`; URL: `site` do Astro) e manda a mudança para o Convex do computador
 * (`rubrica/seed:patchSettings`). A produção só com confirmação (`--producao`).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SiteKind, SiteSettings } from "@rubrica/core";
import { analyticsScriptUrl, isAnalyticsId } from "@rubrica/core/seo";
import { list, parseArgs } from "../utils/args.js";
import { convexRun, deploymentLabel, isMissingFunction, type ConvexContext } from "../utils/convex.js";
import { readEnvLocal } from "../utils/env.js";
import { errorOutput, run as defaultRun, tail, type Runner } from "../utils/exec.js";
import { projectPackageManager } from "../utils/fs.js";
import { normalizeEmail, normalizeUrl, validateEmail, validateUrl } from "../utils/normalize.js";
import { normalizeLocales } from "../locales.js";
import { pluginOptions, pluginsRecord, unknownPlugins } from "../plugins.js";
import { MARK, replaceSection, themeSection } from "../project/files.js";
import { patchHostingCsp } from "../project/hosting.js";
import { analyticsOrigin, findProjectDir, readState, settingsFromState, writeState, type RubricaState } from "../state.js";
import { COLOR_MODES, getTheme, initialFonts, resolveTheme, SCHEME_IDS, SCHEME_OPTIONS, THEMES, themePackage, type ColorMode } from "../themes.js";
import { ask, canAsk, choose, chooseMany, confirm, log, outro } from "../ui.js";
import { track } from "../telemetry.js";

export interface ConfigChange {
  nome?: string;
  url?: string;
  descricao?: string;
  autor?: string;
  email?: string;
  tipo?: SiteKind;
  tema?: string;
  esquema?: string;
  modo?: ColorMode;
  idiomas?: string[];
  idiomaPrincipal?: string;
  /** `+id` liga, `-id` desliga, `id` liga. */
  plugins?: string[];
  /** Endereço do script do Umami (liga o plugin `analytics`), ou `desligar`. */
  analytics?: string;
  /** Id do site no Umami. */
  analyticsId?: string;
}

export interface ConfigResult {
  state: RubricaState;
  /** Campos do `siteSettings` que mudam. */
  patch: Partial<SiteSettings>;
  /** Pacote do tema trocado: [antigo, novo]. */
  themeSwap?: [string, string];
  /** Origem do analytics na CSP mudou: a anterior sai, a nova entra. */
  cspOrigin?: { from?: string; to?: string };
  warnings: string[];
}

/** Aplica a mudança ao estado (puro). */
export function applyConfigChange(current: RubricaState, change: ConfigChange): ConfigResult {
  const state: RubricaState = structuredClone(current);
  const warnings: string[] = [];
  const id = state.identidade;
  if (change.nome !== undefined) id.nome = change.nome.trim();
  if (change.descricao !== undefined) id.descricao = change.descricao.trim();
  if (change.autor !== undefined) id.autor = change.autor.trim();
  if (change.email !== undefined) {
    const email = normalizeEmail(change.email);
    if (validateEmail(email)) throw new Error(validateEmail(email));
    id.email = email;
  }
  if (change.url !== undefined) {
    const url = normalizeUrl(change.url);
    if (validateUrl(url)) throw new Error(validateUrl(url));
    id.url = url;
  }
  if (change.tipo && change.tipo !== state.tipo) {
    if (change.tipo !== "pessoal" && change.tipo !== "empresa") throw new Error(`Tipo inválido: "${change.tipo}".`);
    warnings.push(
      `O tipo mudou para ${change.tipo}. As páginas que já existem continuam; blocos que só existem no outro tipo deixam de aparecer. ` +
        "Monte as páginas novas pelo painel (ou pelo MCP).",
    );
    const enabled = Object.entries(state.plugins).filter(([, on]) => on).map(([p]) => p);
    state.tipo = change.tipo;
    state.plugins = pluginsRecord(change.tipo, enabled);
  }
  let themeSwap: [string, string] | undefined;
  if (change.tema) {
    const choice = resolveTheme(change.tema);
    if (choice.aviso) warnings.push(choice.aviso);
    if (choice.tema !== state.tema) themeSwap = [themePackage(state.tema), themePackage(choice.tema)];
    state.tema = choice.tema;
    if (choice.temaDesejado) state.temaDesejado = choice.temaDesejado;
    else delete state.temaDesejado;
    // O que seguia o tema anterior (o recomendado dele) passa a seguir o novo; o que a pessoa escolheu fica.
    const fromId = current.temaDesejado ?? current.tema;
    const toId = choice.temaDesejado ?? choice.tema;
    const from = getTheme(fromId)?.recommended;
    const to = getTheme(toId)?.recommended;
    if (fromId !== toId && from && to) {
      if (!change.esquema && state.aparencia.esquema === from.scheme) state.aparencia.esquema = to.scheme;
      if (!change.modo && state.aparencia.modo === from.mode) state.aparencia.modo = to.mode;
      const followed = initialFonts(fromId);
      if (state.aparencia.fonteSans === followed.fonteSans && state.aparencia.fonteMono === followed.fonteMono) {
        delete state.aparencia.fonteSans;
        delete state.aparencia.fonteMono;
        Object.assign(state.aparencia, initialFonts(toId));
      }
    }
    if (themeSwap && Object.values(state.ejetados ?? {}).some((e) => e.origem === themeSwap![0])) {
      warnings.push(`Há componentes ejetados do tema anterior (${themeSwap[0]}) em src/overrides/: confira se ainda fazem sentido no tema novo.`);
    }
  }
  if (change.esquema) {
    if (!SCHEME_IDS.includes(change.esquema)) throw new Error(`Esquema desconhecido: "${change.esquema}". Esquemas: ${SCHEME_IDS.join(", ")}.`);
    state.aparencia.esquema = change.esquema;
  }
  if (change.modo) state.aparencia.modo = change.modo;
  if (change.idiomas || change.idiomaPrincipal) {
    const before = state.idiomas.lista;
    state.idiomas = normalizeLocales(change.idiomas ?? state.idiomas.lista, change.idiomaPrincipal ?? (change.idiomas ? undefined : state.idiomas.principal));
    const added = state.idiomas.lista.filter((l) => !before.includes(l));
    if (added.length) warnings.push(`Idiomas novos (${added.join(", ")}): o conteúdo só aparece neles depois de traduzido (decisão 28). O painel mostra o que falta.`);
    if (state.idiomas.principal !== current.idiomas.principal) {
      warnings.push(`O idioma principal agora é ${state.idiomas.principal}: as URLs mudam (o principal fica sem prefixo). Considere redirecionamentos.`);
    }
  }
  if (change.plugins) {
    const plugins = { ...state.plugins };
    const ids = change.plugins.map((p) => p.replace(/^[+-]/, ""));
    const unknown = unknownPlugins(state.tipo, ids);
    if (unknown.length) throw new Error(`Plugins desconhecidos para sites do tipo ${state.tipo}: ${unknown.join(", ")}.`);
    for (const p of change.plugins) plugins[p.replace(/^[+-]/, "")] = !p.startsWith("-");
    for (const option of pluginOptions(state.tipo)) {
      if (plugins[option.id] && option.requires.some((r) => !plugins[r])) {
        warnings.push(`O plugin ${option.id} precisa de ${option.requires.join(", ")} ligado; sem isso ele fica desligado.`);
      }
    }
    state.plugins = plugins;
  }

  let cspOrigin: ConfigResult["cspOrigin"];
  if (change.analytics !== undefined || change.analyticsId !== undefined) {
    const from = analyticsOrigin(current);
    if (change.analytics !== undefined && /^(desligar|off|nenhum)$/i.test(change.analytics.trim())) {
      delete state.analytics;
      state.plugins = { ...state.plugins, analytics: false };
      if (from) cspOrigin = { from };
    } else {
      const script = change.analytics !== undefined ? analyticsScriptUrl(change.analytics) : state.analytics?.script;
      if (!script) throw new Error(change.analytics !== undefined ? `Endereço do script inválido: "${change.analytics}". Use https://… (ex.: https://cloud.umami.is/script.js).` : "Informe o script com --analytics <https://…/script.js>.");
      const id = change.analyticsId?.trim() || state.analytics?.id;
      if (id && !isAnalyticsId(id)) throw new Error(`Id do site inválido: "${id}". Só letras, números e hífen.`);
      state.analytics = { script, ...(id && { id }) };
      state.plugins = { ...state.plugins, analytics: true };
      if (!id) warnings.push("Sem o id do site (--analytics-id), o script não entra nas páginas: informe aqui ou nas Configurações do painel.");
      const to = analyticsOrigin(state);
      if (to !== from) cspOrigin = { ...(from && { from }), ...(to && { to }) };
    }
  }

  const before = settingsFromState(current);
  const after = settingsFromState(state);
  const patch: Partial<SiteSettings> = {};
  for (const key of Object.keys(after) as (keyof SiteSettings)[]) {
    if (key === "navigation" || key === "social") continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) (patch as Record<string, unknown>)[key] = after[key];
  }
  return { state, patch, ...(themeSwap && { themeSwap }), ...(cspOrigin && { cspOrigin }), warnings };
}

/** Troca o tema no package.json e no astro.config.ts. */
export function swapThemeInFiles(projectDir: string, state: RubricaState, swap: [string, string]): void {
  const pkgPath = join(projectDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { dependencies?: Record<string, string> };
  const deps = pkg.dependencies ?? {};
  const spec = deps[swap[0]] ?? deps["@rubrica/core"] ?? "latest";
  delete deps[swap[0]];
  // Pacotes locais (link:) apontam para a pasta do tema no monorepo.
  deps[swap[1]] = spec.startsWith("link:") ? spec.replace(/themes\/[^/]+$/, `themes/${swap[1].replace("@rubrica/theme-", "")}`) : spec;
  pkg.dependencies = Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  const configPath = join(projectDir, "astro.config.ts");
  writeFileSync(configPath, replaceSection(readFileSync(configPath, "utf-8"), MARK.themeStart, MARK.themeEnd, themeSection(state)));
}

/** Troca o `site:` do astro.config.ts. */
export function updateSiteUrl(projectDir: string, url: string): void {
  const configPath = join(projectDir, "astro.config.ts");
  const source = readFileSync(configPath, "utf-8");
  const next = source.replace(/^(\s*site:\s*)(["'`]).*?\2(,?)/m, `$1${JSON.stringify(url)}$3`);
  if (next === source && !source.includes(JSON.stringify(url))) log.warn(`Não achei o "site:" no astro.config.ts; ajuste para ${url} à mão.`);
  writeFileSync(configPath, next);
}

const CONFIG_FLAGS = ["nome", "url", "descricao", "autor", "email", "tipo", "tema", "esquema", "modo", "idiomas", "idioma-principal", "plugins", "analytics", "analytics-id"] as const;
const MODES: Record<string, ColorMode> = { escuro: "dark", dark: "dark", claro: "light", light: "light", automatico: "system", system: "system" };

async function askChange(state: RubricaState): Promise<ConfigChange> {
  const what = await choose("O que você quer mudar?", [
    { value: "identidade", label: "Identidade", hint: "nome, endereço, descrição, e-mail" },
    { value: "tema", label: "Tema", hint: `hoje: ${state.temaDesejado ?? state.tema}` },
    { value: "esquema", label: "Cores", hint: `esquema ${state.aparencia.esquema ?? "do tema"}, modo ${state.aparencia.modo}` },
    { value: "idiomas", label: "Idiomas", hint: state.idiomas.lista.join(", ") },
    { value: "plugins", label: "Plugins" },
    { value: "tipo", label: "Tipo do site", hint: state.tipo },
  ]);
  if (what === "identidade") {
    return {
      nome: await ask("Nome do site:", { initial: state.identidade.nome }),
      url: await ask("Endereço do site:", { initial: state.identidade.url, validate: validateUrl }),
      descricao: await ask("Descrição:", { initial: state.identidade.descricao }),
      email: await ask("E-mail:", { initial: state.identidade.email ?? "", validate: (s) => (s ? validateEmail(s) : undefined) }) || undefined,
    };
  }
  if (what === "tema") return { tema: await choose("Tema", THEMES.map((t) => ({ value: t.id, label: `${t.label}${t.ported ? "" : " (em breve)"}`, hint: t.hint })), state.temaDesejado ?? state.tema) };
  if (what === "esquema") {
    return {
      esquema: await choose("Esquema de cores", SCHEME_OPTIONS, state.aparencia.esquema ?? getTheme(state.tema)?.recommended.scheme),
      modo: await choose("Modo de cor", COLOR_MODES, state.aparencia.modo),
    };
  }
  if (what === "idiomas") {
    const lista = list(await ask("Idiomas, separados por vírgula (o primeiro é o principal):", { initial: state.idiomas.lista.join(", ") }));
    return { idiomas: lista, idiomaPrincipal: lista[0] };
  }
  if (what === "plugins") {
    const on = await chooseMany(
      "Plugins ligados",
      pluginOptions(state.tipo).map((p) => ({ value: p.id, label: p.label, hint: p.description })),
      Object.entries(state.plugins).filter(([, v]) => v).map(([k]) => k),
    );
    return { plugins: pluginOptions(state.tipo).map((p) => (on.includes(p.id) ? `+${p.id}` : `-${p.id}`)) };
  }
  return { tipo: await choose<SiteKind>("Tipo do site", [{ value: "pessoal", label: "Pessoal" }, { value: "empresa", label: "Empresa" }], state.tipo) };
}

export async function runConfig(argv: string[], deps: { cwd: string; runner?: Runner }): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const args = parseArgs(argv, { values: CONFIG_FLAGS, flags: ["producao", "sem-instalar", "yes"], aliases: { "-y": "yes" } });
  const projectDir = findProjectDir(deps.cwd);
  const current = readState(projectDir);
  const v = args.values;
  const fromFlags: ConfigChange = {
    ...(v.nome !== undefined && { nome: v.nome }),
    ...(v.url !== undefined && { url: v.url }),
    ...(v.descricao !== undefined && { descricao: v.descricao }),
    ...(v.autor !== undefined && { autor: v.autor }),
    ...(v.email !== undefined && { email: v.email }),
    ...(v.tipo !== undefined && { tipo: v.tipo as SiteKind }),
    ...(v.tema !== undefined && { tema: v.tema }),
    ...(v.esquema !== undefined && { esquema: v.esquema }),
    ...(v.modo !== undefined && { modo: MODES[v.modo.toLowerCase()] ?? (v.modo as ColorMode) }),
    ...(v.idiomas !== undefined && { idiomas: list(v.idiomas) }),
    ...(v["idioma-principal"] !== undefined && { idiomaPrincipal: v["idioma-principal"] }),
    ...(v.plugins !== undefined && { plugins: list(v.plugins) }),
    ...(v.analytics !== undefined && { analytics: v.analytics }),
    ...(v["analytics-id"] !== undefined && { analyticsId: v["analytics-id"] }),
  };
  const change = Object.keys(fromFlags).length ? fromFlags : canAsk(args.flags.has("yes")) ? await askChange(current) : null;
  if (!change) throw new Error("Diga o que mudar (ex.: --tema cyberpunk, --esquema neon, --idiomas pt-BR,en, --analytics https://cloud.umami.is/script.js --analytics-id <id>) ou rode no terminal para as perguntas.");

  const result = applyConfigChange(current, change);
  for (const w of result.warnings) log.warn(w);
  writeState(projectDir, result.state);
  if (change.url) updateSiteUrl(projectDir, result.state.identidade.url);
  if (result.cspOrigin) {
    const read = (f: string) => (existsSync(join(projectDir, f)) ? readFileSync(join(projectDir, f), "utf-8") : undefined);
    const changed = patchHostingCsp({ "vercel.json": read("vercel.json"), "public/_headers": read("public/_headers") }, result.cspOrigin.from, result.cspOrigin.to);
    for (const [file, content] of Object.entries(changed)) writeFileSync(join(projectDir, file), content);
    const files = Object.keys(changed);
    if (files.length) log.success(`CSP ${result.cspOrigin.to ? `liberando ${result.cspOrigin.to}` : "sem a origem do analytics"} em ${files.join(" e ")}. Vale no site no ar depois do próximo publicar.`);
    else log.warn("Não achei a CSP no vercel.json nem no public/_headers: libere a origem do analytics em script-src e connect-src à mão.");
  }
  if (result.themeSwap) {
    swapThemeInFiles(projectDir, result.state, result.themeSwap);
    log.success(`Tema trocado: ${result.themeSwap[0]} → ${result.themeSwap[1]}.`);
    if (!args.flags.has("sem-instalar")) {
      const pm = projectPackageManager(projectDir);
      try {
        runner(pm, ["install"], { cwd: projectDir });
      } catch (err) {
        log.warn(`O ${pm} install falhou; rode à mão:\n${tail(errorOutput(err))}`);
      }
    }
  }

  const keys = Object.keys(result.patch);
  if (keys.length && readEnvLocal(projectDir).CONVEX_DEPLOYMENT) {
    const targets: ConvexContext[] = [{ projectDir, runner }];
    if (args.flags.has("producao") && (await confirm(`Gravar também no Convex de PRODUÇÃO (${keys.join(", ")})?`, false))) targets.push({ projectDir, runner, prod: true });
    for (const ctx of targets) {
      log.info(`Gravando ${keys.join(", ")} no Convex: ${deploymentLabel(ctx)}`);
      try {
        convexRun(ctx, "rubrica/seed:patchSettings", { patch: result.patch });
      } catch (err) {
        if (isMissingFunction(err)) log.warn("O backend instalado não tem rubrica/seed:patchSettings: mude pelo painel ou atualize o Rubrica.");
        else log.warn(`O Convex recusou a mudança:\n${tail(errorOutput(err))}`);
      }
    }
    if (!args.flags.has("producao") && current.producao?.convexUrl) log.info("O site publicado não mudou. Para levar a mudança para ele: npx create-rubrica config --producao (com as mesmas opções).");
  } else if (keys.length) {
    log.info("O projeto ainda não está ligado ao Convex: a mudança vai para o banco quando você rodar o setup.");
  }
  await track(projectDir, "config", { campos: Object.keys(change), tema: result.state.temaDesejado ?? result.state.tema });
  outro("Configuração atualizada.");
}
