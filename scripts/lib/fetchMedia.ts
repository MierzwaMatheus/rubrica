/**
 * Baixa as imagens do storage do Convex citadas em public/data, otimiza e grava em
 * public/media, e troca as URLs nos JSON pelo caminho local. Roda no build, depois do
 * fetch-static-data. Falha de um arquivo não quebra o build: ele fica com a URL do storage.
 *
 * Cache entre builds: o arquivo processado fica em `cacheDir/<MEDIA_VERSION>/` com o
 * storageId no nome (o conteúdo de um storageId nunca muda), então build seguinte só baixa
 * o que é novo. Na Vercel, `node_modules/.cache` é preservado entre builds.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";
import {
  MEDIA_VERSION,
  displayName,
  findStorageUrls,
  inParallel,
  kindFromContentType,
  rewriteStorageUrls,
  shareName,
  withRetry,
  type MediaKind,
} from "./media";

export interface ImageProcessor {
  /** Redimensiona e converte uma imagem raster: WebP para a página e JPG para prévias de link. */
  raster(input: Uint8Array): Promise<{ webp: Uint8Array; jpg: Uint8Array }>;
}

export interface FetchMediaOptions {
  dataDir: string;
  outDir: string;
  cacheDir: string;
  fetchImpl?: typeof fetch;
  processor: ImageProcessor;
  concurrency?: number;
  timeoutMs?: number;
  log?: (message: string) => void;
}

export interface FetchMediaSummary {
  found: number;
  cached: number;
  downloaded: number;
  skipped: number;
  failed: Array<{ storageId: string; error: string }>;
}

/** Marca de "não é imagem" (vídeo, PDF): não pergunta de novo no próximo build. */
const SKIP_SUFFIX = ".skip";

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return jsonFiles(path);
    return name.endsWith(".json") ? [path] : [];
  });
}

/** Grava em .tmp e renomeia: arquivo pela metade nunca fica com o nome final. */
function writeAtomic(path: string, data: Uint8Array | string) {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

/** O que já está no cache para cada storageId: os nomes dos arquivos (ou a marca de skip). */
function cacheIndex(dir: string): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".tmp")) continue;
    const id = name.split(".")[0];
    index.set(id, [...(index.get(id) ?? []), name]);
  }
  return index;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.name === "TimeoutError" ? "tempo esgotado" : error.message;
  return String(error);
}

export async function runFetchMedia(options: FetchMediaOptions): Promise<FetchMediaSummary> {
  const { dataDir, outDir, processor } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const log = options.log ?? console.log;
  const cacheDir = join(options.cacheDir, MEDIA_VERSION);
  mkdirSync(cacheDir, { recursive: true });

  // 1. URLs do storage em todos os JSON.
  const files = jsonFiles(dataDir).map((path) => ({ path, text: readFileSync(path, "utf-8") }));
  const urlById = new Map<string, string>();
  for (const file of files) {
    for (const [url, id] of findStorageUrls(file.text)) if (!urlById.has(id)) urlById.set(id, url);
  }

  // 2. Baixa e processa o que não está no cache.
  const index = cacheIndex(cacheDir);
  const summary: FetchMediaSummary = { found: urlById.size, cached: 0, downloaded: 0, skipped: 0, failed: [] };
  const missing = [...urlById].filter(([id]) => !index.has(id));
  summary.cached = urlById.size - missing.length;

  await inParallel(missing, options.concurrency ?? 4, async ([id, url]) => {
    try {
      const head = await withRetry(async () => {
        const res = await fetchImpl(url, { method: "HEAD", signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      });
      const contentType = head.headers.get("content-type") ?? "";
      const kind: MediaKind = kindFromContentType(contentType);
      if (kind === "skip") {
        writeAtomic(join(cacheDir, `${id}${SKIP_SUFFIX}`), contentType);
        index.set(id, [`${id}${SKIP_SUFFIX}`]);
        return;
      }
      const data = await withRetry(async () => {
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      });
      if (kind === "copy") {
        const name = displayName(id, kind, contentType);
        writeAtomic(join(cacheDir, name), data);
        index.set(id, [name]);
      } else {
        const { webp, jpg } = await processor.raster(data);
        writeAtomic(join(cacheDir, displayName(id, kind)), webp);
        writeAtomic(join(cacheDir, shareName(id)), jpg);
        index.set(id, [displayName(id, kind), shareName(id)]);
      }
      summary.downloaded++;
    } catch (error) {
      summary.failed.push({ storageId: id, error: errorMessage(error) });
    }
  });

  // 3. public/media só com o que este build usa.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const localById = new Map<string, string>();
  for (const id of urlById.keys()) {
    const names = index.get(id) ?? [];
    if (names.some((n) => n.endsWith(SKIP_SUFFIX))) {
      summary.skipped++;
      continue;
    }
    if (names.length === 0) continue;
    for (const name of names) copyFileSync(join(cacheDir, name), join(outDir, name));
    localById.set(id, names.find((n) => !n.endsWith(".jpg")) ?? names[0]);
  }

  // 4. Troca as URLs nos JSON.
  for (const file of files) {
    const rewritten = rewriteStorageUrls(file.text, localById);
    if (rewritten !== file.text) writeAtomic(file.path, rewritten);
  }

  // 5. Tira do cache o que nenhum conteúdo cita mais (e versões antigas do processamento).
  for (const name of readdirSync(cacheDir)) {
    if (!urlById.has(name.split(".")[0])) rmSync(join(cacheDir, name), { force: true });
  }
  for (const name of readdirSync(options.cacheDir)) {
    if (name !== MEDIA_VERSION) rmSync(join(options.cacheDir, name), { recursive: true, force: true });
  }

  for (const f of summary.failed) {
    log(`Aviso: não baixou a imagem ${f.storageId} (${f.error}): fica a URL do storage`);
  }
  log(
    `✓ mídia: ${summary.found} no conteúdo, ${summary.cached} já em cache, ${summary.downloaded} baixada(s), ` +
      `${summary.skipped} não é imagem, ${summary.failed.length} falha(s) → ${relative(process.cwd(), outDir) || outDir}`,
  );
  return summary;
}
