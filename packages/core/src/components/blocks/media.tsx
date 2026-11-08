/**
 * Vídeo: conteúdo de terceiros em iframe, só de endereços validados
 * (`blocks/media.ts`). O vídeo carrega leve (miniatura e play; o player só no clique, pela
 * ilha `video`); sem JavaScript, a miniatura é um link para o vídeo no site do provedor.
 */
import type { Ref } from "react";
import type { ResolvedFields, ResolvedImage } from "../../blocks/fields";
import type { video as videoDef } from "../../blocks/catalog";
import {
  parseVideoUrl,
  VIDEO_IFRAME_ALLOW,
  VIDEO_IFRAME_SANDBOX,
  VIDEO_PROVIDER_LABELS,
  videoEmbedUrl,
  videoThumbnail,
  videoWatchUrl,
  type VideoRef,
} from "../../blocks/media";
import type { BlockProps } from "../../theme/contract";
import { Section, SectionHeader } from "../primitives";

type VideoFields = ResolvedFields<typeof videoDef.fields>;
type T = (key: string, vars?: Record<string, string | number>) => string;

const RATIOS = new Set(["16:9", "4:3", "1:1", "9:16"]);

/** Proporção do campo, no formato do atributo `data-ratio` (`16-9`). */
export function videoRatio(aspect: string | undefined): string {
  return (aspect && RATIOS.has(aspect) ? aspect : "16:9").replace(":", "-");
}

/** Nome do vídeo para o botão e o player: legenda, título ou o provedor. */
export function videoName(fields: Pick<VideoFields, "caption" | "title">, video: VideoRef): string {
  return fields.caption || fields.title || VIDEO_PROVIDER_LABELS[video.provider];
}

export interface VideoFrameProps {
  video: VideoRef;
  /** Miniatura própria (campo) ou a do provedor; sem nenhuma, só o botão de play. */
  poster?: Pick<ResolvedImage, "src" | "width" | "height">;
  name: string;
  /** `16-9`, `4-3`, `1-1`, `9-16`. */
  ratio: string;
  /**
   * `link`: abre o vídeo no provedor (sem JavaScript). `button`: a ilha hidratou e o clique
   * troca pelo player. `player`: o iframe.
   */
  mode: "link" | "button" | "player";
  t: T;
  onPlay?: () => void;
  frameRef?: Ref<HTMLIFrameElement>;
}

/** Moldura do vídeo, pura: o bloco usa no HTML estático e a ilha usa depois de hidratar. */
export function VideoFrame({ video, poster, name, ratio, mode, t, onPlay, frameRef }: VideoFrameProps) {
  const provider = VIDEO_PROVIDER_LABELS[video.provider];
  if (mode === "player") {
    return (
      <div className="rb-video__frame" data-ratio={ratio}>
        <iframe
          ref={frameRef}
          className="rb-video__player"
          src={videoEmbedUrl(video)}
          title={t("video.player", { title: name })}
          allow={VIDEO_IFRAME_ALLOW}
          sandbox={VIDEO_IFRAME_SANDBOX}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }
  const inner = (
    <>
      {poster && <img className="rb-video__poster" src={poster.src} alt="" width={poster.width} height={poster.height} loading="lazy" decoding="async" />}
      <span className="rb-video__play" aria-hidden="true" />
      <span className="rb-video__cta">
        {mode === "link" ? t("video.watchOn", { provider }) : t("video.play")}
        <span className="rb-sr-only">: {name}</span>
        {mode === "link" && <span className="rb-sr-only"> {t("common.external")}</span>}
      </span>
    </>
  );
  return (
    <div className="rb-video__frame" data-ratio={ratio} data-poster={poster ? "" : undefined}>
      {mode === "link" ? (
        <a className="rb-video__facade" href={videoWatchUrl(video)} target="_blank" rel="noopener noreferrer">
          {inner}
        </a>
      ) : (
        <button type="button" className="rb-video__facade" onClick={onPlay}>
          {inner}
        </button>
      )}
    </div>
  );
}

/** Miniatura a usar: a do campo, senão a pública do provedor (só o YouTube tem). */
export function videoPoster(fields: Pick<VideoFields, "poster">, video: VideoRef): VideoFrameProps["poster"] {
  return fields.poster ?? videoThumbnail(video);
}

/** Vídeo do YouTube ou do Vimeo. A ilha (quando o site monta) troca o link pelo player no clique. */
export function VideoBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<VideoFields>) {
  const video = parseVideoUrl(fields.url);
  if (!video) return null;
  return (
    <Section id={id} anchor={fields.anchor} type="video" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <figure className="rb-video" data-ratio={videoRatio(fields.aspect)}>
        {island ?? <VideoFrame video={video} poster={videoPoster(fields, video)} name={videoName(fields, video)} ratio={videoRatio(fields.aspect)} mode="link" t={ctx.t} />}
        {fields.caption && <figcaption className="rb-video__caption">{fields.caption}</figcaption>}
      </figure>
    </Section>
  );
}
