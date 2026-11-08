/** Leitura de imagens locais: tipo pelo conteúdo (não só pela extensão) e dimensões. */
import { extname } from "node:path";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export interface ImageInfo {
  contentType: string;
  width?: number;
  height?: number;
}

export class ImageError extends Error {}

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

function jpegSize(b: Uint8Array): { width: number; height: number } | undefined {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1]!;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (b[i + 5]! << 8) | b[i + 6]!, width: (b[i + 7]! << 8) | b[i + 8]! };
    }
    i += 2 + ((b[i + 2]! << 8) | b[i + 3]!);
  }
  return undefined;
}

function webpSize(b: Uint8Array): { width: number; height: number } | undefined {
  const kind = ascii(b, 12, 16);
  if (kind === "VP8X") return { width: 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)), height: 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16)) };
  if (kind === "VP8L") {
    const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (kind === "VP8 ") return { width: (b[26]! | (b[27]! << 8)) & 0x3fff, height: (b[28]! | (b[29]! << 8)) & 0x3fff };
  return undefined;
}

/** Confere que o conteúdo é a imagem que a extensão diz e lê as dimensões quando dá. */
export function inspectImage(path: string, bytes: Uint8Array): ImageInfo {
  const ext = extname(path).toLowerCase();
  const expected = MIME[ext];
  if (!expected) throw new ImageError(`Extensão não aceita (${ext || "sem extensão"}). Use PNG, JPG, WebP, AVIF, GIF ou SVG.`);
  if (bytes.length === 0) throw new ImageError("O arquivo está vazio.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new ImageError(`Imagem acima de 20 MB (${(bytes.length / 1048576).toFixed(1)} MB).`);
  const bad = () => new ImageError(`O conteúdo do arquivo não é ${expected.replace("image/", "").toUpperCase()}.`);
  switch (expected) {
    case "image/png":
      if (ascii(bytes, 1, 4) !== "PNG") throw bad();
      return { contentType: expected, width: new DataView(bytes.buffer, bytes.byteOffset).getUint32(16), height: new DataView(bytes.buffer, bytes.byteOffset).getUint32(20) };
    case "image/jpeg":
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw bad();
      return { contentType: expected, ...jpegSize(bytes) };
    case "image/gif":
      if (!ascii(bytes, 0, 3).startsWith("GIF")) throw bad();
      return { contentType: expected, width: bytes[6]! | (bytes[7]! << 8), height: bytes[8]! | (bytes[9]! << 8) };
    case "image/webp":
      if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 12) !== "WEBP") throw bad();
      return { contentType: expected, ...webpSize(bytes) };
    case "image/avif":
      if (ascii(bytes, 4, 8) !== "ftyp") throw bad();
      return { contentType: expected };
    default: {
      if (!/<svg[\s>]/i.test(Buffer.from(bytes.subarray(0, 4096)).toString("utf8"))) throw bad();
      return { contentType: expected };
    }
  }
}
