/**
 * Imagens baixadas no build ficam em /media/<storageId>.webp, com uma variante JPG ao lado
 * (scripts/lib/fetchMedia.ts). A página usa o WebP; prévias de link (og:image) usam o JPG,
 * que toda rede aceita.
 */
export function shareVariant(path: string): string {
  return path.replace(/^(.*\/media\/[0-9a-f-]{36})\.webp$/, "$1.jpg");
}

/** Caminho do site ("/media/x.jpg") vira endereço completo; URL completa volta igual. */
export function absoluteUrl(path: string, siteUrl: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  return `${siteUrl.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}
