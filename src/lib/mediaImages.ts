/**
 * O build acrescenta srcset e medidas às imagens do HTML pré-renderizado (scripts/lib/enhanceImages.ts),
 * marcando-as com data-media="<atributos acrescentados>". O React não conhece esses atributos:
 * se um componente trocar o src de uma dessas imagens (galeria, carrossel), o srcset antigo faria
 * o navegador continuar mostrando a imagem velha. Este observador tira o que o build acrescentou.
 */
export const MEDIA_ATTR = "data-media";

export function clearBuildAttributes(img: Element) {
  const added = img.getAttribute(MEDIA_ATTR);
  if (added === null) return;
  for (const name of added.split(" ").filter(Boolean)) img.removeAttribute(name);
  img.removeAttribute(MEDIA_ATTR);
}

export function watchMediaImages(root: Node = document.documentElement): MutationObserver {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.target instanceof HTMLImageElement) clearBuildAttributes(record.target);
    }
  });
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["src"] });
  return observer;
}
