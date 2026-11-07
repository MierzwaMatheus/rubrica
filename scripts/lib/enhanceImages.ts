/**
 * Acabamento das imagens no HTML pré-renderizado (primeira visita, a que o Google mede):
 * - largura e altura, para a página não pular quando a imagem carrega (CLS);
 * - srcset com a versão de 800px, para o celular não baixar a de 1600px;
 * - fetchpriority="high" na primeira imagem do conteúdo, que costuma ser o LCP.
 *
 * Só mexe em imagens baixadas no build (/media/<storageId>.webp) que estão no manifesto.
 * O React não renderiza esses atributos; se um componente trocar o src depois, o main.tsx
 * remove o srcset e as medidas antigas (ver src/lib/mediaImages.ts).
 *
 * Num build com o React de desenvolvimento, a hidratação avisa que esses atributos não batem
 * ("This won't be patched up"): é esperado, eles ficam. Em produção o React não compara
 * atributos na hidratação.
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

/**
 * O React 19 põe no HTML um <link rel="preload" as="image"> para as primeiras imagens. Ele é
 * gerado sem o srcset (acrescentado depois, aqui), então pré-carregaria a versão de 1600px até
 * no celular: ganha o imagesrcset/imagesizes, e o navegador escolhe a mesma da <img>.
 */
function enhancePreload(tag: string, manifest: MediaManifest): string {
  const href = attr(tag, "href");
  const name = href?.match(/^\/media\/([0-9a-f-]{36}\.[a-z0-9]+)$/)?.[1];
  const info = name ? manifest[name] : undefined;
  if (!info?.small || attr(tag, "imagesrcset")) return tag;
  const extra = `imagesrcset="/media/${info.small} 800w, ${href} ${info.width}w" imagesizes="${MEDIA_SIZES}"`;
  return tag.replace(/\s*(\/?)>$/, (_m, slash: string) => ` ${extra}${slash ? "/" : ""}>`);
}

const PRELOAD_IMAGE = /<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="image")[^>]*>/gi;

export function enhanceImages(html: string, manifest: MediaManifest): string {
  html = html.replace(PRELOAD_IMAGE, (tag) => enhancePreload(tag, manifest));
  // A primeira imagem dentro de <main> (fora da barra lateral e do cabeçalho) é a candidata a LCP.
  const mainAt = html.search(/<main\b/i);
  let prioritized = false;
  return html.replace(IMG_TAG, (tag, offset: number) => {
    const priority = !prioritized && mainAt >= 0 && offset > mainAt && attr(tag, "loading") !== "lazy";
    if (priority) prioritized = true;
    return enhanceTag(tag, manifest, priority);
  });
}
