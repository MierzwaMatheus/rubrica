/**
 * Ilha do carrossel das telas do case (`caseCarousel` no tema): uma faixa com rolagem lateral
 * e encaixe (duas imagens por vez a partir de 768 px, uma no celular), botões de anterior e
 * próxima e, em cada imagem, "Expandir imagem", que abre a imagem grande numa janela
 * (`<dialog>`, com anterior/próxima, setas do teclado e Esc).
 *
 * Antes de hidratar (e sem JavaScript) é a mesma faixa, que rola com o dedo, a roda ou o
 * teclado; os botões só aparecem depois de hidratar, quando funcionam.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ResolvedImage } from "../blocks/fields";
import { makeT } from "./kit";

export interface CarouselIslandProps {
  images: ResolvedImage[];
  /** Nome do projeto: completa o texto alternativo das imagens sem descrição. */
  title: string;
  texts: Record<string, string>;
}

const SVG = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false };
const ChevronLeft = () => (
  <svg {...SVG}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg {...SVG}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const ZoomIn = () => (
  <svg {...SVG}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
  </svg>
);
const Close = () => (
  <svg {...SVG}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function Carrossel({ images, title, texts }: CarouselIslandProps) {
  const t = makeT(texts);
  const track = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [open, setOpen] = useState<number | null>(null);
  const alt = (img: ResolvedImage, i: number) => img.alt || `${title} – ${i + 1}`;

  const updateEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    setReady(true);
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };
  const step = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + images.length) % images.length));

  if (images.length === 0) return null;
  const many = images.length > 1;
  const current = open !== null ? images[open] : undefined;

  return (
    <div className="rb-carousel" data-ready={ready ? "" : undefined}>
      <ul ref={track} className="rb-carousel__track" tabIndex={0} aria-label={t("case.gallery")} onScroll={updateEdges}>
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`} className="rb-carousel__slide">
            <img src={img.src} alt={alt(img, i)} width={img.width} height={img.height} loading="lazy" decoding="async" />
            {ready && (
              <button type="button" className="rb-carousel__expand" onClick={() => setOpen(i)} aria-label={`${t("gallery.expand")}: ${alt(img, i)}`}>
                <span className="rb-carousel__zoom">
                  <ZoomIn />
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>
      {ready && many && (
        <div className="rb-carousel__nav">
          <button type="button" className="rb-carousel__btn rb-carousel__btn--prev" onClick={() => page(-1)} disabled={edges.start} aria-label={t("gallery.prev")}>
            <ChevronLeft />
          </button>
          <button type="button" className="rb-carousel__btn rb-carousel__btn--next" onClick={() => page(1)} disabled={edges.end} aria-label={t("gallery.next")}>
            <ChevronRight />
          </button>
        </div>
      )}
      {ready && (
        <dialog
          ref={dialog}
          className="rb-lightbox"
          aria-label={t("gallery.expand")}
          onClose={() => setOpen(null)}
          onKeyDown={(e) => {
            if (!many) return;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              step(-1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              step(1);
            }
          }}
          onClick={(e) => {
            // Clique no fundo (fora da imagem e dos controles) fecha.
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          {current && open !== null && (
            <div className="rb-lightbox__inner">
              <div className="rb-lightbox__bar">
                <span className="rb-lightbox__count" aria-live="polite">
                  {t("gallery.position", { current: open + 1, total: images.length })}
                </span>
                <button type="button" className="rb-lightbox__close" onClick={() => setOpen(null)} aria-label={t("gallery.close")}>
                  <Close />
                </button>
              </div>
              <div className="rb-lightbox__stage">
                <img src={current.src} alt={alt(current, open)} />
                {many && (
                  <>
                    <button type="button" className="rb-carousel__btn rb-lightbox__prev" onClick={() => step(-1)} aria-label={t("gallery.prev")}>
                      <ChevronLeft />
                    </button>
                    <button type="button" className="rb-carousel__btn rb-lightbox__next" onClick={() => step(1)} aria-label={t("gallery.next")}>
                      <ChevronRight />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </dialog>
      )}
    </div>
  );
}
