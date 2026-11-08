/**
 * Vídeo e incorporação: conteúdo de terceiros em iframe, só de endereços validados
 * (`blocks/media.ts`). O vídeo carrega leve (miniatura e play; o player só no clique, pela
 * ilha `video`); sem JavaScript, a miniatura é um link para o vídeo no site do provedor.
 */
import type { ResolvedFields, ResolvedImage } from "../../blocks/fields";
import type { incorporacao as incorporacaoDef, video as videoDef } from "../../blocks/catalog";
import {
  parseEmbedUrl,
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
type IncorporacaoFields = ResolvedFields<typeof incorporacaoDef.fields>;
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
  /** Recebe o iframe do player (a ilha põe o foco nele). Função, não `Ref`: o tipo não depende da cópia do @types/react do projeto. */
  frameRef?: (el: HTMLIFrameElement | null) => void;
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

/** Iframe de um provedor permitido, com `sandbox` e `allow` do provedor e carregamento preguiçoso. */
export function IncorporacaoBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<IncorporacaoFields>) {
  const embed = parseEmbedUrl(fields.url);
  if (!embed) return null;
  const { provider } = embed;
  const height = fields.height ?? provider.height;
  return (
    <Section id={id} anchor={fields.anchor} type="incorporacao" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-embed" data-provider={provider.id} data-category={provider.category}>
        <iframe
          className="rb-embed__frame"
          src={embed.src}
          title={fields.frameTitle || fields.title || provider.label}
          height={height}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={provider.sandbox}
          {...(provider.allow ? { allow: provider.allow } : {})}
        />
      </div>
      {fields.showLink !== false && (
        <p className="rb-embed__link">
          <a href={embed.src} target="_blank" rel="noopener noreferrer">
            {ctx.t("embed.open", { provider: provider.label })}
            <span className="rb-sr-only"> {ctx.t("common.external")}</span>
          </a>
        </p>
      )}
    </Section>
  );
}
