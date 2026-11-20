/**
 * Vídeo e incorporação: conteúdo de terceiros em iframe, só de endereços validados
 * (`blocks/media.ts`). O vídeo carrega leve (miniatura e play; o player só no clique, pela
 * ilha `video`); sem JavaScript, a miniatura é um link para o vídeo no site do provedor.
 */
import type { ResolvedFields, ResolvedImage } from "../../blocks/fields";
import type { incorporacao as incorporacaoDef, video as videoDef } from "../../blocks/catalog";
import {
  chapterSeconds,
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
import { Heading, Section, SectionHeader } from "../primitives";

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
  /**
   * Chave do iframe do player: mudou, o iframe remonta (recarrega no tempo de `video.start`)
   * sem remontar o resto (a figura, os capítulos e o botão em foco).
   */
  reload?: number;
  /** Recebe o iframe do player (a ilha põe o foco nele). Função, não `Ref`: o tipo não depende da cópia do @types/react do projeto. */
  frameRef?: (el: HTMLIFrameElement | null) => void;
}

/** Moldura do vídeo, pura: o bloco usa no HTML estático e a ilha usa depois de hidratar. */
export function VideoFrame({ video, poster, name, ratio, mode, t, onPlay, reload, frameRef }: VideoFrameProps) {
  const provider = VIDEO_PROVIDER_LABELS[video.provider];
  if (mode === "player") {
    return (
      <div className="rb-video__frame" data-ratio={ratio}>
        <iframe
          key={reload}
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

/** Capítulo já conferido: tempo como escrito (`1:05`), em segundos e o nome. */
export interface VideoChapter {
  start: string;
  seconds: number;
  label: string;
}

/** Capítulos válidos do campo (tempo em m:ss ou h:mm:ss e nome), na ordem do tempo. */
export function videoChapters(raw: VideoFields["chapters"] | undefined): VideoChapter[] {
  const out: VideoChapter[] = [];
  for (const c of raw ?? []) {
    const seconds = chapterSeconds(c?.start);
    if (seconds === undefined || !c?.start || !c.label) continue;
    out.push({ start: c.start.trim(), seconds, label: c.label });
  }
  return out.sort((a, b) => a.seconds - b.seconds);
}

export interface VideoChaptersProps {
  video: VideoRef;
  chapters: VideoChapter[];
  /** `link`: abre o vídeo no provedor, no tempo (sem JavaScript). `button`: a ilha pula o player. */
  mode: "link" | "button";
  t: T;
  /** Nome do vídeo (legenda, título ou provedor): torna único o rótulo da lista na página. */
  name: string;
  /** Nível do título "Capítulos". */
  level: 2 | 3;
  /**
   * Último capítulo escolhido (segundos), para `aria-current`. Não é "o que está tocando"
   * (o player segue sozinho), por isso o rótulo diz "último capítulo escolhido".
   */
  current?: number;
  onChapter?: (seconds: number) => void;
}

/** Lista de capítulos (tempo e nome). Sem JavaScript, cada um é um link para o vídeo no tempo. */
export function VideoChapters({ video, chapters, mode, t, name, level, current, onChapter }: VideoChaptersProps) {
  if (chapters.length === 0) return null;
  return (
    <nav className="rb-video__chapters" aria-label={t("video.chaptersOf", { name })}>
      <Heading level={level} className="rb-video__chaptersTitle">
        {t("video.chapters")}
      </Heading>
      <ol className="rb-video__chapterList">
        {chapters.map((c) => {
          const label = t("video.chapterAt", { time: c.start, label: c.label });
          const inner = (
            <>
              <span className="rb-video__chapterTime">{c.start}</span>
              <span className="rb-video__chapterLabel">{c.label}</span>
            </>
          );
          return (
            <li key={`${c.seconds}-${c.label}`} className="rb-video__chapter">
              {mode === "link" ? (
                <a
                  className="rb-video__chapterLink"
                  href={videoWatchUrl({ ...video, start: c.seconds || undefined })}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} ${t("common.external")}`}
                >
                  {inner}
                </a>
              ) : (
                <button
                  type="button"
                  className="rb-video__chapterLink"
                  aria-label={current === c.seconds ? t("video.chapterChosen", { label }) : label}
                  aria-current={current === c.seconds ? "true" : undefined}
                  onClick={() => onChapter?.(c.seconds)}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface VideoMediaProps extends Omit<VideoFrameProps, "mode"> {
  mode: VideoFrameProps["mode"];
  caption?: string;
  chapters: VideoChapter[];
  /** Nível do título dos capítulos. */
  level: 2 | 3;
  current?: number;
  onChapter?: (seconds: number) => void;
}

/**
 * O vídeo inteiro: a moldura com a legenda e os capítulos. Puro: o bloco usa no HTML
 * estático (links) e a ilha depois de hidratar (o capítulo pula o player).
 */
export function VideoMedia({ caption, chapters, level, current, onChapter, ...frame }: VideoMediaProps) {
  return (
    <>
      <figure className="rb-video" data-ratio={frame.ratio}>
        <VideoFrame {...frame} />
        {caption && <figcaption className="rb-video__caption">{caption}</figcaption>}
      </figure>
      <VideoChapters
        video={frame.video}
        chapters={chapters}
        mode={frame.mode === "link" ? "link" : "button"}
        t={frame.t}
        name={frame.name}
        level={level}
        current={current}
        onChapter={onChapter}
      />
    </>
  );
}

/** Vídeo do YouTube ou do Vimeo. A ilha (quando o site monta) troca o link pelo player no clique. */
export function VideoBlock({ id, variant, fields, headingLevel, ctx, island }: BlockProps<VideoFields>) {
  const video = parseVideoUrl(fields.url);
  if (!video) return null;
  const chapters = videoChapters(fields.chapters);
  return (
    <Section id={id} anchor={fields.anchor} type="video" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <div className="rb-video__layout" data-ratio={videoRatio(fields.aspect)} data-chapters={chapters.length ? "" : undefined}>
        {island ?? (
          <VideoMedia
            video={video}
            poster={videoPoster(fields, video)}
            name={videoName(fields, video)}
            ratio={videoRatio(fields.aspect)}
            mode="link"
            t={ctx.t}
            caption={fields.caption}
            chapters={chapters}
            level={headingLevel === 1 ? 2 : 3}
          />
        )}
      </div>
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
