/**
 * Imagens do Convex no build: acha as URLs do storage nos JSON de public/data, decide o que
 * fazer com cada arquivo e troca as URLs pelo caminho local (/media/...). Sem I/O: o
 * scripts/lib/fetchMedia.ts injeta fetch, disco e o processamento de imagem.
 */

/** URL de arquivo no storage do Convex. O storageId nunca muda de conteúdo: serve de nome. */
const STORAGE_URL = /https:\/\/[a-z0-9-]+\.convex\.(?:cloud|site)\/api\/storage\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;

export const PUBLIC_PREFIX = "/media/";

/** Versão do processamento: mudar tamanho, formato ou qualidade troca a pasta do cache. */
export const MEDIA_VERSION = "v2-webp1600+800q80-jpg1200q82";
/** Largura máxima da imagem na página. */
export const MAX_WIDTH = 1600;
/** Versão menor, para telas pequenas (srcset). */
export const SMALL_WIDTH = 800;
/** Largura da variante para prévia de link (o tamanho que as redes recomendam para og:image). */
export const SHARE_WIDTH = 1200;

export type MediaKind =
  /** PNG, JPEG, WebP, AVIF...: redimensiona e gera WebP (página) e JPG (prévia de link). */
  | "raster"
  /** SVG e GIF (pode ser animado): copia como veio. */
  | "copy"
  /** Vídeo, PDF e o resto: não baixa, a URL do storage continua. */
  | "skip";

export function kindFromContentType(contentType: string | null | undefined): MediaKind {
  const type = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (type === "image/svg+xml" || type === "image/gif") return "copy";
  if (type.startsWith("image/")) return "raster";
  return "skip";
}

/** Extensão do arquivo copiado sem conversão. */
export function copyExtension(contentType: string): string {
  return contentType.toLowerCase().includes("svg") ? "svg" : "gif";
}

/** Nome do arquivo usado na página. */
export function displayName(storageId: string, kind: Exclude<MediaKind, "skip">, contentType = ""): string {
  return kind === "raster" ? `${storageId}.webp` : `${storageId}.${copyExtension(contentType)}`;
}

/** Nome da variante JPG das imagens raster, usada no og:image (nem toda rede aceita WebP). */
export function shareName(storageId: string): string {
  return `${storageId}.jpg`;
}

/** Nome da versão de 800px (srcset). */
export function smallName(storageId: string): string {
  return `${storageId}-${SMALL_WIDTH}.webp`;
}

/** storageId no começo do nome de um arquivo de mídia ("<uuid>.webp", "<uuid>-800.webp"...). */
export function storageIdOf(fileName: string): string {
  return fileName.slice(0, 36);
}

/** Medidas de cada imagem da página (nome do arquivo → largura, altura e se há a versão de 800px). */
export type MediaManifest = Record<string, { width: number; height: number; small?: string }>;
export const MANIFEST_NAME = "manifest.json";

/** URLs do storage citadas num texto (o JSON inteiro), com o storageId de cada uma. */
export function findStorageUrls(text: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const m of text.matchAll(STORAGE_URL)) found.set(m[0], m[1]);
  return found;
}

/** Troca cada URL do storage que tem arquivo local pelo caminho /media/... As outras ficam. */
export function rewriteStorageUrls(text: string, localByStorageId: Map<string, string>): string {
  return text.replace(STORAGE_URL, (url, storageId: string) => {
    const name = localByStorageId.get(storageId);
    return name ? `${PUBLIC_PREFIX}${name}` : url;
  });
}

/** Roda `fn` em todos os itens com no máximo `limit` ao mesmo tempo; mantém a ordem. */
export async function inParallel<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Tenta de novo com espera crescente (0,5 s, 1 s...). Devolve o último erro. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {},
): Promise<T> {
  let lastError: unknown;
  for (let n = 1; n <= attempts; n++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (n < attempts) await wait(500 * 2 ** (n - 1));
    }
  }
  throw lastError;
}
