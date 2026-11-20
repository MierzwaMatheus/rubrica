/**
 * Ilha do bloco `video`: a fachada (miniatura e play) vira o player no clique. Antes de
 * hidratar (e sem JavaScript) é o mesmo link para o provedor que o bloco estático mostra;
 * depois, um botão. O iframe só existe depois do clique, já tocando, e recebe o foco.
 * Os capítulos, depois de hidratar, viram botões que abrem o player no tempo (ou pulam,
 * se já estiver tocando: o player recarrega no tempo novo).
 */
import { useEffect, useRef, useState } from "react";
import type { ResolvedImage } from "../blocks/fields";
import { parseVideoUrl } from "../blocks/media";
import { VideoMedia, videoChapters, videoName, videoPoster, videoRatio } from "../components/blocks/media";
import { makeT } from "./kit";

interface VideoIslandProps {
  fields: {
    url?: string;
    title?: string;
    caption?: string;
    poster?: ResolvedImage;
    aspect?: string;
    chapters?: { start: string; label: string }[];
  };
  texts: Record<string, string>;
}

export default function Video({ fields, texts }: VideoIslandProps) {
  const t = makeT(texts);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  /** Tempo de início escolhido num capítulo; sem ele, o do endereço. */
  const [start, setStart] = useState<number | undefined>(undefined);
  /** Muda a cada pedido de play: o foco vai para o player mesmo quando ele já existia. */
  const [nonce, setNonce] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing, nonce]);
  const parsed = parseVideoUrl(fields.url);
  if (!parsed) return null;
  const video = start === undefined ? parsed : { ...parsed, start: start || undefined };
  return (
    <VideoMedia
      // A chave troca o iframe quando o tempo muda: o player recarrega já no capítulo.
      key={playing ? `p-${start ?? "x"}` : "f"}
      video={video}
      poster={videoPoster(fields, parsed)}
      name={videoName(fields, parsed)}
      ratio={videoRatio(fields.aspect)}
      mode={playing ? "player" : ready ? "button" : "link"}
      t={t}
      caption={fields.caption}
      chapters={videoChapters(fields.chapters)}
      level={3}
      current={playing ? start : undefined}
      onPlay={() => {
        setPlaying(true);
        setNonce((n) => n + 1);
      }}
      onChapter={(seconds) => {
        setStart(seconds);
        setPlaying(true);
        setNonce((n) => n + 1);
      }}
      frameRef={(el) => {
        frame.current = el;
      }}
    />
  );
}
