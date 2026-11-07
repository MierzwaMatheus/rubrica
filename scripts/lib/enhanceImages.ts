/**
 * Acabamento das imagens no HTML pré-renderizado (primeira visita, a que o Google mede):
 * - largura e altura, para a página não pular quando a imagem carrega (CLS);
 * - srcset com a versão de 800px, para o celular não baixar a de 1600px;
 * - fetchpriority="high" na primeira imagem do conteúdo, que costuma ser o LCP.
 *
 * Só mexe em imagens baixadas no build (/media/<storageId>.webp) que estão no manifesto.
 * O React não renderiza esses atributos; se um componente trocar o src depois, o main.tsx
 * remove o srcset e as medidas antigas (ver src/lib/mediaImages.ts).
 */
import type { MediaManifest } from "./media";

/** Marca das imagens que receberam srcset/medidas no build, com os atributos acrescentados. */
export const MEDIA_ATTR = "data-media";
/** Até 1024px a imagem ocupa a largura da tela; acima, o conteúdo não passa de ~800px. */
export const MEDIA_SIZES = "(max-width: 1024px) 100vw, 800px";

const IMG_TAG = /<img\b[^>]*>/gi;
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];

function enhanceTag(tag: string, manifest: MediaManifest, priority: boolean): string {
  const src = attr(tag, "src");
  const name = src?.match(/^\/media\/([0-9a-f-]{36}\.[a-z0-9]+)$/)?.[1];
  const info = name ? manifest[name] : undefined;
  const extra: string[] = [];
  const added: string[] = [];
  if (info) {
    if (!attr(tag, "width") && !attr(tag, "height")) {
      extra.push(`width="${info.width}"`, `height="${info.height}"`);
      added.push("width", "height");
    }
    if (info.small && !attr(tag, "srcset")) {
      extra.push(`srcset="/media/${info.small} 800w, ${src} ${info.width}w"`, `sizes="${MEDIA_SIZES}"`);
      added.push("srcset", "sizes");
    }
    if (added.length) extra.push(`${MEDIA_ATTR}="${added.join(" ")}"`);
  }
  if (priority && attr(tag, "loading") !== "lazy" && !attr(tag, "fetchpriority")) extra.push(`fetchpriority="high"`);
  if (extra.length === 0) return tag;
  return tag.replace(/\s*(\/?)>$/, (_m, slash: string) => ` ${extra.join(" ")}${slash ? "/" : ""}>`);
}

export function enhanceImages(html: string, manifest: MediaManifest): string {
  // A primeira imagem dentro de <main> (fora da barra lateral e do cabeçalho) é a candidata a LCP.
  const mainAt = html.search(/<main\b/i);
  let prioritized = false;
  return html.replace(IMG_TAG, (tag, offset: number) => {
    const priority = !prioritized && mainAt >= 0 && offset > mainAt && attr(tag, "loading") !== "lazy";
    if (priority) prioritized = true;
    return enhanceTag(tag, manifest, priority);
  });
}
