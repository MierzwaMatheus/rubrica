#!/usr/bin/env node
/**
 * Quais temas o CI testa (bateria e Lighthouse), a partir dos arquivos que mudaram.
 *
 * - Tema alterado (`packages/themes/<tema>/`): bateria e Lighthouse dele.
 * - Algo que muda o site de todos os temas (núcleo, theme-tester, demo, dependências, o
 *   próprio CI): bateria numa amostra de temas bem diferentes entre si (`AMOSTRA`).
 * - Só documentação, changeset, changelog ou número de versão: nenhum tema.
 * - `--todos` (agendamento noturno e disparo manual): todos, com Lighthouse.
 *
 * A bateria completa de todos os temas roda toda noite, então uma regressão do núcleo num
 * tema fora da amostra aparece no dia seguinte sem segurar nenhum PR.
 *
 * Uso: node .github/scripts/ci-temas.mjs <base> <head> [--todos]
 * Saída (GITHUB_OUTPUT ou stdout): `matrix` = [{ "theme": "@rubrica/theme-x", "lighthouse": bool }].
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Temas que representam os outros quando o núcleo muda: claro, escuro/neon, brutalista e de interface própria. */
export const AMOSTRA = ["padrao", "cyberpunk", "brutalist", "chat"];

/** Arquivos que nunca mudam o site gerado. */
const SEM_EFEITO = [/\.md$/, /^\.changeset\//, /^docs\//, /^apps\/docs\//, /^LICENSE$/];

/** Arquivos que mudam o site de todos os temas. */
const AFETA_TODOS = [/^packages\/core\//, /^packages\/theme-tester\//, /^apps\/demo\//, /^\.github\//, /^pnpm-lock\.yaml$/, /^package\.json$/, /^pnpm-workspace\.yaml$/, /^tsconfig/];

/**
 * @param {{ files: string[]; themes: string[]; onlyVersion?: (file: string) => boolean; all?: boolean }} input
 *   `files`: caminhos alterados; `themes`: pastas em `packages/themes`; `onlyVersion(file)`:
 *   o `package.json` mudou só no campo `version`.
 * @returns {{ dir: string; lighthouse: boolean }[]}
 */
export function selectThemes({ files, themes, onlyVersion = () => false, all = false }) {
  if (all) return themes.map((dir) => ({ dir, lighthouse: true }));
  const changed = new Set();
  let core = false;
  for (const file of files) {
    if (SEM_EFEITO.some((re) => re.test(file))) continue;
    if (file.endsWith("package.json") && onlyVersion(file)) continue;
    const theme = /^packages\/themes\/([^/]+)\//.exec(file)?.[1];
    if (theme) {
      if (themes.includes(theme)) changed.add(theme);
      continue;
    }
    if (AFETA_TODOS.some((re) => re.test(file))) core = true;
  }
  const out = new Map();
  if (core) for (const dir of AMOSTRA) if (themes.includes(dir)) out.set(dir, false);
  for (const dir of changed) out.set(dir, true);
  return [...out].map(([dir, lighthouse]) => ({ dir, lighthouse }));
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf-8" });
}

function main(argv) {
  const all = argv.includes("--todos");
  const [base, head] = argv.filter((a) => !a.startsWith("--"));
  const root = process.cwd();
  const themes = readdirSync(join(root, "packages/themes"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  // Sem base (push novo, histórico raso): tudo, por segurança.
  const known = (ref) => !!ref && !/^0+$/.test(ref) && (() => { try { git("cat-file", "-e", `${ref}^{commit}`); return true; } catch { return false; } })();
  const full = all || !known(base) || !known(head);
  const files = full ? [] : git("diff", "--name-only", `${base}...${head}`).split("\n").filter(Boolean);
  const onlyVersion = (file) => {
    const diff = git("diff", "-U0", `${base}...${head}`, "--", file);
    const lines = diff.split("\n").filter((l) => /^[+-](?![+-])/.test(l));
    return lines.length > 0 && lines.every((l) => /^[+-]\s*"version":/.test(l));
  };
  const selected = selectThemes({ files, themes, onlyVersion, all: full });
  const matrix = selected.map(({ dir, lighthouse }) => ({
    theme: JSON.parse(readFileSync(join(root, "packages/themes", dir, "package.json"), "utf-8")).name,
    lighthouse,
  }));
  const lines = [`matrix=${JSON.stringify(matrix)}`, `any=${matrix.length > 0}`];
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines.join("\n") + "\n");
  console.log(full ? "Todos os temas." : `Arquivos alterados: ${files.length}.`);
  for (const m of matrix) console.log(`- ${m.theme}${m.lighthouse ? " (com Lighthouse)" : ""}`);
  if (!matrix.length) console.log("Nenhum tema a testar.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
