/**
 * Ilha do bloco `video`: a fachada (miniatura e play) vira o player no clique. Antes de
 * hidratar (e sem JavaScript) é o mesmo link para o provedor que o bloco estático mostra;
 * depois, um botão. O iframe só existe depois do clique, já tocando, e recebe o foco.
 */
import { useEffect, useRef, useState } from "react";
import type { ResolvedImage } from "../blocks/fields";
import { parseVideoUrl } from "../blocks/media";
import { VideoFrame, videoName, videoPoster, videoRatio } from "../components/blocks/media";
import { makeT } from "./kit";

interface VideoIslandProps {
  fields: { url?: string; title?: string; caption?: string; poster?: ResolvedImage; aspect?: string };
  texts: Record<string, string>;
}

export default function Video({ fields, texts }: VideoIslandProps) {
  const t = makeT(texts);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);
  const video = parseVideoUrl(fields.url);
  if (!video) return null;
  return (
    <VideoFrame
      video={video}
      poster={videoPoster(fields, video)}
      name={videoName(fields, video)}
      ratio={videoRatio(fields.aspect)}
      mode={playing ? "player" : ready ? "button" : "link"}
      t={t}
      onPlay={() => setPlaying(true)}
      frameRef={frame}
    />
  );
}
