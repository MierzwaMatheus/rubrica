/**
 * Formato do export/import do Convex (snapshot em ZIP): uma pasta por tabela com
 * `documents.jsonl`, a tabela `_tables` (nome → número da tabela, que entra nos ids) e os
 * arquivos em `_storage/`. O `migrar` lê o export da v1 e escreve o import da v2 no
 * mesmo formato, mantendo os números das tabelas 1:1 para os ids continuarem válidos.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import type { ConvertResult } from "./convert.js";

type Doc = Record<string, any>;

export interface Snapshot {
  tables: Record<string, Doc[]>;
  /** Número de cada tabela no deployment de origem. */
  tableNumbers: Record<string, number>;
  /** Arquivos de `_storage/` (caminho no ZIP → bytes), copiados como estão. */
  storage: Record<string, Uint8Array>;
}

export function parseJsonl(text: string): Doc[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Doc);
}

const toJsonl = (docs: Doc[]) => (docs.length ? `${docs.map((d) => JSON.stringify(d)).join("\n")}\n` : "");

function fromEntries(entries: Record<string, Uint8Array>): Snapshot {
  const tables: Record<string, Doc[]> = {};
  const storage: Record<string, Uint8Array> = {};
  const tableNumbers: Record<string, number> = {};
  for (const [rawPath, bytes] of Object.entries(entries)) {
    const path = rawPath.replace(/^\.?\//, "");
    if (path.endsWith("/")) continue;
    if (path.startsWith("_storage/")) {
      storage[path] = bytes;
      continue;
    }
    const m = /^([^/]+)\/documents\.jsonl$/.exec(path);
    if (!m) continue;
    const docs = parseJsonl(strFromU8(bytes));
    if (m[1] === "_tables") {
      for (const d of docs) if (typeof d.name === "string" && typeof d.id === "number") tableNumbers[d.name] = d.id;
    } else {
      tables[m[1]!] = docs;
    }
  }
  return { tables, tableNumbers, storage };
}

/** Lê um export (`npx convex export --path x.zip`) em ZIP ou já descompactado numa pasta. */
export function readSnapshot(path: string): Snapshot {
  if (!existsSync(path)) throw new Error(`Não achei o export em ${path}.`);
  if (statSync(path).isDirectory()) {
    const entries: Record<string, Uint8Array> = {};
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else entries[relative(path, full).split(sep).join("/")] = readFileSync(full);
      }
    };
    walk(path);
    return fromEntries(entries);
  }
  return fromEntries(unzipSync(readFileSync(path)));
}

/** Monta um snapshot (para os testes e para o export de exemplo). */
export function snapshotZip(snapshot: Snapshot): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  for (const [table, docs] of Object.entries(snapshot.tables)) files[`${table}/documents.jsonl`] = strToU8(toJsonl(docs));
  files["_tables/documents.jsonl"] = strToU8(toJsonl(Object.entries(snapshot.tableNumbers).map(([name, id]) => ({ name, id }))));
  Object.assign(files, snapshot.storage);
  return zipSync(files, { level: 6 });
}

/**
 * Números das tabelas da v2: as 1:1 herdam o da tabela da v1 (os ids codificam o número);
 * as montadas e as que não existiam ganham números novos, acima dos usados.
 */
export function tableNumbersFor(result: ConvertResult, source: Snapshot): Record<string, number> {
  const numbers: Record<string, number> = {};
  const used = new Set(Object.values(source.tableNumbers));
  let next = Math.max(10000, ...used) + 1;
  for (const table of Object.keys(result.tables)) {
    const from = result.sources[table];
    const n = from !== undefined ? source.tableNumbers[from] : undefined;
    if (n !== undefined) numbers[table] = n;
  }
  for (const table of Object.keys(result.tables)) {
    if (numbers[table] !== undefined) continue;
    while (used.has(next)) next++;
    numbers[table] = next;
    used.add(next++);
  }
  return numbers;
}

/** O ZIP do import da v2: tabelas convertidas, `_tables` e os arquivos (`_storage`). */
export function importZip(result: ConvertResult, source: Snapshot): Uint8Array {
  const tableNumbers = tableNumbersFor(result, source);
  return snapshotZip({ tables: result.tables, tableNumbers, storage: source.storage });
}

/** As tabelas pendentes (sem destino ainda), como estavam, num ZIP à parte. */
export function pendingZip(result: ConvertResult, source: Snapshot): Uint8Array | null {
  if (!Object.keys(result.pending).length) return null;
  const tableNumbers = Object.fromEntries(Object.keys(result.pending).filter((t) => source.tableNumbers[t] !== undefined).map((t) => [t, source.tableNumbers[t]!]));
  return snapshotZip({ tables: result.pending, tableNumbers, storage: {} });
}
