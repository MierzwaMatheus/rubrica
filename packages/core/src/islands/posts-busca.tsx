/**
 * Ilha do bloco `posts-recentes` com "Busca por texto": o campo "Buscar artigos..." da v1.
 * Não traz os posts: filtra os cartões que o bloco já pôs no HTML, pelo `data-search` de cada
 * um (título, resumo e etiquetas, sem acento), escondendo os que não batem. Convive com o
 * filtro por etiqueta (que é CSS): o cartão aparece se passar nos dois.
 *
 * Também liga as setas do carrossel de destaques quando o tema o desenha
 * (`data-rb-carousel`): sem JavaScript, o carrossel rola com o dedo ou o trackpad e as
 * setas ficam escondidas.
 */
import { useEffect, useId, useRef, useState } from "react";
import { searchText } from "../render/text";
import { makeT } from "./kit";

interface PostsBuscaProps {
  texts: Record<string, string>;
}

/** Liga as setas do carrossel (com volta ao começo, como o da v1). Devolve a limpeza. */
function wireCarousel(root: Element): () => void {
  const off: (() => void)[] = [];
  for (const carousel of root.querySelectorAll<HTMLElement>("[data-rb-carousel]")) {
    const track = carousel.querySelector<HTMLElement>("[data-rb-carousel-track]");
    if (!track) continue;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const go = (dir: 1 | -1) => {
      const max = track.scrollWidth - track.clientWidth;
      const at = track.scrollLeft;
      let left = at + dir * track.clientWidth;
      if (dir === 1 && at >= max - 2) left = 0;
      if (dir === -1 && at <= 2) left = max;
      track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
    };
    for (const [attr, dir] of [["data-rb-carousel-prev", -1], ["data-rb-carousel-next", 1]] as const) {
      const button = carousel.querySelector<HTMLButtonElement>(`[${attr}]`);
      if (!button) continue;
      const onClick = () => go(dir);
      button.hidden = false;
      button.addEventListener("click", onClick);
      off.push(() => {
        button.removeEventListener("click", onClick);
        button.hidden = true;
      });
    }
  }
  return () => off.forEach((f) => f());
}

export default function PostsBusca({ texts }: PostsBuscaProps) {
  const t = makeT(texts);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const block = ref.current?.closest("[data-block]");
    return block ? wireCarousel(block) : undefined;
  }, []);

  useEffect(() => {
    const block = ref.current?.closest("[data-block]");
    if (!block) return;
    const q = searchText(query);
    const cards = [...block.querySelectorAll<HTMLElement>("[data-search]")];
    let shown = 0;
    for (const card of cards) {
      const hit = !q || (card.dataset.search ?? "").includes(q);
      card.hidden = !hit;
      if (hit) shown++;
    }
    setEmpty(cards.length > 0 && shown === 0);
  }, [query]);

  return (
    <div ref={ref} className="rb-search" role="search">
      <label htmlFor={id} className="rb-sr-only">
        {t("blog.search")}
      </label>
      <input id={id} type="search" className="rb-search__input" placeholder={t("blog.search")} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      <p className="rb-search__status" role="status">
        {empty ? t("blog.searchEmpty") : ""}
      </p>
    </div>
  );
}
