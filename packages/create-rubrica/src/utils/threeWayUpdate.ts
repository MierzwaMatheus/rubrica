import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Atualização em três vias, arquivo por arquivo:
 *
 * - base:   a versão de origem do projeto, montada com as escolhas do usuário
 * - nova:   a versão nova, montada com as mesmas escolhas
 * - atual:  o projeto como o usuário deixou
 *
 * Regra de ouro: o que o usuário mudou nunca é perdido. Quando o Rubrica e o usuário
 * mexeram no mesmo trecho, o arquivo do usuário fica como está e a versão nova é salva
 * ao lado (`<arquivo>.rubrica-new`) para ele revisar.
 */

export type ActionKind =
  /** Usuário não mexeu: recebe a versão nova. */
  | "update"
  /** Arquivo novo no Rubrica. */
  | "add"
  /** Removido no Rubrica e o usuário não tinha mexido. */
  | "remove"
  /** Usuário e Rubrica mudaram partes diferentes: mesclado. */
  | "merge"
  /** Usuário mudou e o Rubrica não: fica como está. */
  | "keep"
  /** Mudanças no mesmo trecho, ou arquivo que não dá para mesclar: fica como está, nova versão ao lado. */
  | "conflict"
  /** Lockfile com mudança dos dois lados: fica como está, o install resolve. */
  | "lockfile";

export interface FileAction {
  file: string;
  kind: ActionKind;
  /** Conteúdo a gravar (update, add, merge). */
  content?: Buffer;
  /** Conteúdo a salvar em `<arquivo>.rubrica-new` (conflict). */
  incoming?: Buffer;
  /** Explicação curta, para o relatório. */
  reason?: string;
}

/** Caminhos que pertencem ao usuário e nunca são tocados pelo update. */
const PROTECTED: RegExp[] = [
  /^\.git\//,
  /(^|\/)node_modules\//,
  /^dist\//,
  /^\.env(\..*)?$/,
  /^rubrica\.json$/,
  // Conteúdo gerado a partir do banco do usuário no build.
  /^public\/data\//,
  /^public\/rss\.xml$/,
  /^public\/sitemap\.xml$/,
];

const LOCKFILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"]);

export const NEW_SUFFIX = ".rubrica-new";

export function isProtected(file: string): boolean {
  return PROTECTED.some((re) => re.test(file));
}

async function listFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).split(path.sep).join("/");
      if (entry.isDirectory()) {
        if (!isProtected(`${rel}/`)) await walk(abs);
      } else if (entry.isFile() && !isProtected(rel)) {
        out.push(rel);
      }
    }
  }
  await walk(root);
  return out;
}

async function readOrNull(file: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(file);
  } catch {
    return null;
  }
}

function same(a: Buffer | null, b: Buffer | null): boolean {
  if (a === null || b === null) return a === b;
  return a.equals(b);
}

function isBinary(buf: Buffer): boolean {
  return buf.subarray(0, 8000).includes(0);
}

/** Mescla com `git merge-file`. Retorna null se houver trechos em conflito. */
async function mergeText(ours: Buffer, base: Buffer, theirs: Buffer, tmpDir: string): Promise<Buffer | null> {
  const o = path.join(tmpDir, "ours");
  const b = path.join(tmpDir, "base");
  const t = path.join(tmpDir, "theirs");
  await fs.writeFile(o, ours);
  await fs.writeFile(b, base);
  await fs.writeFile(t, theirs);
  try {
    const { stdout } = await execFileAsync("git", ["merge-file", "-p", o, b, t], {
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout as unknown as Buffer;
  } catch (err) {
    // Código de saída > 0 = número de conflitos; < 0 ou sem código = erro de verdade.
    const code = (err as { code?: unknown }).code;
    if (typeof code === "number" && code > 0) return null;
    throw err;
  }
}

/** Calcula o que fazer com cada arquivo, sem gravar nada. */
export async function planUpdate(dirs: { base: string; next: string; project: string }): Promise<FileAction[]> {
  const files = new Set([...(await listFiles(dirs.base)), ...(await listFiles(dirs.next))]);
  const tmpDir = await fs.mkdtemp(path.join(path.dirname(dirs.base), "merge-"));
  const actions: FileAction[] = [];

  try {
    for (const file of [...files].sort()) {
      const base = await readOrNull(path.join(dirs.base, file));
      const next = await readOrNull(path.join(dirs.next, file));
      const ours = await readOrNull(path.join(dirs.project, file));

      // Nada mudou no Rubrica, ou o usuário já está igual à versão nova.
      if (same(base, next) || same(ours, next)) continue;

      // Usuário não mexeu: aplica a mudança do Rubrica.
      if (same(ours, base)) {
        if (next === null) actions.push({ file, kind: "remove" });
        else actions.push({ file, kind: base === null ? "add" : "update", content: next });
        continue;
      }

      // Daqui em diante, os dois lados mudaram o arquivo.
      if (ours === null) {
        actions.push({
          file,
          kind: "conflict",
          incoming: next ?? undefined,
          reason: "você removeu este arquivo, mas o Rubrica o alterou",
        });
        continue;
      }
      if (next === null) {
        actions.push({ file, kind: "keep", reason: "removido no Rubrica, mas você o personalizou" });
        continue;
      }
      if (LOCKFILES.has(path.basename(file))) {
        actions.push({ file, kind: "lockfile", reason: "rode o install para atualizar as dependências" });
        continue;
      }
      if (base === null) {
        actions.push({ file, kind: "conflict", incoming: next, reason: "você criou um arquivo com o mesmo nome de um arquivo novo do Rubrica" });
        continue;
      }
      if (isBinary(ours) || isBinary(base) || isBinary(next)) {
        actions.push({ file, kind: "conflict", incoming: next, reason: "arquivo binário alterado dos dois lados" });
        continue;
      }

      const merged = await mergeText(ours, base, next, tmpDir);
      if (merged) actions.push({ file, kind: "merge", content: merged });
      else actions.push({ file, kind: "conflict", incoming: next, reason: "você e o Rubrica mudaram o mesmo trecho" });
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return actions;
}

/** Grava o plano no projeto. Arquivos do usuário só são sobrescritos em update/add/merge. */
export async function applyPlan(projectDir: string, actions: FileAction[]): Promise<void> {
  for (const action of actions) {
    const target = path.join(projectDir, action.file);
    switch (action.kind) {
      case "update":
      case "add":
      case "merge":
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, action.content!);
        break;
      case "remove":
        await fs.rm(target, { force: true });
        break;
      case "conflict":
        if (action.incoming) {
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(`${target}${NEW_SUFFIX}`, action.incoming);
        }
        break;
      case "keep":
      case "lockfile":
        break;
    }
  }
}

/** Resumo legível do plano. */
export function formatPlan(actions: FileAction[]): string {
  const groups: Array<[ActionKind, string]> = [
    ["update", "Atualizados"],
    ["add", "Novos"],
    ["remove", "Removidos"],
    ["merge", "Mesclados com suas mudanças"],
    ["keep", "Mantidos como você deixou"],
    ["lockfile", "Lockfile mantido"],
    ["conflict", `Precisam da sua revisão (versão nova salva em <arquivo>${NEW_SUFFIX})`],
  ];
  const lines: string[] = [];
  for (const [kind, title] of groups) {
    const items = actions.filter((a) => a.kind === kind);
    if (!items.length) continue;
    lines.push(`${title} (${items.length}):`);
    for (const a of items) lines.push(`  • ${a.file}${a.reason ? ` — ${a.reason}` : ""}`);
  }
  return lines.length ? lines.join("\n") : "Nenhum arquivo muda.";
}
