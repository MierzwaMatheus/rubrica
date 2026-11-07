/**
 * Baixa as imagens do storage do Convex citadas em public/data para public/media, otimizadas,
 * e troca as URLs nos JSON. Roda no build depois do fetch-static-data (ver scripts/lib/fetchMedia.ts).
 *
 * Run: pnpm tsx scripts/fetch-media.ts
 */
import { join } from "path";
import sharp from "sharp";
import { MAX_WIDTH, SHARE_WIDTH, SMALL_WIDTH } from "./lib/media";
import { runFetchMedia, type ImageProcessor } from "./lib/fetchMedia";

const ROOT = join(import.meta.dirname, "..");

const processor: ImageProcessor = {
  async raster(input) {
    // rotate(): respeita a orientação do EXIF antes de redimensionar.
    const base = sharp(input, { failOn: "none" }).rotate();
    const [main, jpg] = await Promise.all([
      base.clone().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
      // Prévia de link: sem transparência (fundo branco) e em JPG, que toda rede aceita.
      base
        .clone()
        .resize({ width: SHARE_WIDTH, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer(),
    ]);
    // Versão menor só quando a imagem é mais larga que ela (senão o srcset não ganha nada).
    const small =
      main.info.width > SMALL_WIDTH
        ? await base.clone().resize({ width: SMALL_WIDTH }).webp({ quality: 80 }).toBuffer()
        : undefined;
    return { webp: main.data, small, jpg, width: main.info.width, height: main.info.height };
  },
  async dimensions(input) {
    const { width, height } = await sharp(input).metadata();
    return width && height ? { width, height } : null;
  },
};

runFetchMedia({
  dataDir: join(ROOT, "public", "data"),
  outDir: join(ROOT, "public", "media"),
  cacheDir: join(ROOT, "node_modules", ".cache", "rubrica-media"),
  processor,
}).catch((error) => {
  // Sem imagens locais o site continua funcionando com as URLs do storage: não derruba o build.
  console.warn("Aviso: falha ao baixar as imagens:", error);
});
