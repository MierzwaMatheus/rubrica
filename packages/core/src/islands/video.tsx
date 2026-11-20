/**
 * Ilha do bloco `video`: a fachada (miniatura e play) vira o player no clique. Antes de
 * hidratar (e sem JavaScript) é o mesmo link para o provedor que o bloco estático mostra;
 * depois, um botão. O iframe só existe depois do clique, já tocando, e recebe o foco.
 * Os capítulos, depois de hidratar, viram botões que abrem o player no tempo (ou pulam,
 * se já estiver tocando: o player recarrega no tempo novo).
 *
 * Só o iframe remonta (chave `reload`, um contador): a figura e a lista de capítulos ficam,
 * e o mesmo capítulo clicado de novo também recarrega no tempo dele.
 *
 * Foco: no play da miniatura, vai para o player (o botão some, e o foco não pode se perder).
 * No capítulo, fica no botão do capítulo: quem navega pelo teclado segue na lista para
 * escolher outro, e o `aria-current` (lido como "último capítulo escolhido") confirma a
 * escolha; o player já recarregou no tempo e está a um Shift+Tab de distância. Levar o foco
 * para dentro do iframe de outro site obrigaria a voltar do player a cada troca.
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
  /** Muda a cada pedido de play ou de capítulo: é a chave do iframe (recarrega no tempo). */
  const [nonce, setNonce] = useState(0);
  /** O último pedido veio do play da miniatura (o foco vai para o player). */
  const focusPlayer = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (playing && focusPlayer.current) frame.current?.focus();
  }, [playing, nonce]);
  const parsed = parseVideoUrl(fields.url);
  if (!parsed) return null;
  const video = start === undefined ? parsed : { ...parsed, start: start || undefined };
  return (
    <VideoMedia
      video={video}
      poster={videoPoster(fields, parsed)}
      name={videoName(fields, parsed)}
      ratio={videoRatio(fields.aspect)}
      mode={playing ? "player" : ready ? "button" : "link"}
      reload={nonce}
      t={t}
      caption={fields.caption}
      chapters={videoChapters(fields.chapters)}
      level={3}
      current={playing ? start : undefined}
      onPlay={() => {
        focusPlayer.current = true;
        setPlaying(true);
        setNonce((n) => n + 1);
      }}
      onChapter={(seconds) => {
        focusPlayer.current = false;
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
