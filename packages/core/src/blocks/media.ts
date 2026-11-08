/**
 * Endereços de terceiros que os blocos `video` e `incorporacao` aceitam. Funções puras,
 * usadas na validação dos campos (backend, MCP, painel), no componente do bloco e na CSP
 * gerada pelo CLI (`frame-src`): a lista de domínios é uma só.
 *
 * A validação é estrita: só `https:`, sem usuário, senha nem porta, com o domínio exato da
 * lista (ou um subdomínio, quando o provedor declara `*.`) e o caminho no formato do
 * provedor. Nada de HTML livre nem `<script>`: o bloco monta o `<iframe>` sozinho.
 */

// ── Vídeo (YouTube e Vimeo) ─────────────────────────────────────────────────

export type VideoProvider = "youtube" | "vimeo";

export interface VideoRef {
  provider: VideoProvider;
  /** Id do vídeo: 11 caracteres no YouTube, só dígitos no Vimeo. */
  id: string;
  /** Vimeo não listado: o código que vem depois do id (`vimeo.com/123/abc`). */
  hash?: string;
  /** Início em segundos (`?t=1m30s`, `?start=90`). */
  start?: number;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;
const VIMEO_HASH = /^[0-9a-f]{6,20}$/i;
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/** URL https "limpa" (sem usuário, senha nem porta), ou nada. */
function strictUrl(raw: unknown): URL | undefined {
  if (typeof raw !== "string") return undefined;
  const text = raw.trim();
  if (!text || text.length > 2000 || /\s/.test(text)) return undefined;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return undefined;
  return url;
}

/** "90", "90s", "1m30s", "1h2m3s" → segundos. */
function parseStart(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d{1,6}$/.test(value)) return Number(value) || undefined;
  const m = /^(?:(\d{1,3})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/.exec(value);
  if (!m || !m[0]) return undefined;
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return total || undefined;
}

/**
 * Reconhece os endereços comuns do YouTube (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`,
 * `/live/`) e do Vimeo (`vimeo.com/<id>`, `/<id>/<hash>`, `player.vimeo.com/video/<id>`,
 * canais e grupos). Qualquer outra coisa: `undefined`.
 */
export function parseVideoUrl(raw: unknown): VideoRef | undefined {
  const url = strictUrl(raw);
  if (!url) return undefined;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"));
  const yt = (id: string | undefined | null): VideoRef | undefined =>
    id && YT_ID.test(id) ? { provider: "youtube", id, ...(start ? { start } : {}) } : undefined;

  if (host === "youtu.be") return parts.length === 1 ? yt(parts[0]) : undefined;
  if (YT_HOSTS.has(host)) {
    if (parts.length === 1 && parts[0] === "watch") return yt(url.searchParams.get("v"));
    if (parts.length === 2 && ["embed", "shorts", "live", "v"].includes(parts[0]!)) return yt(parts[1]);
    return undefined;
  }
  if (VIMEO_HOSTS.has(host)) {
    let id: string | undefined;
    let hash: string | undefined;
    if (host === "player.vimeo.com") {
      if (parts.length !== 2 || parts[0] !== "video") return undefined;
      id = parts[1];
      hash = url.searchParams.get("h") ?? undefined;
    } else if (parts.length === 1 || parts.length === 2) {
      id = parts[0];
      hash = parts[1];
    } else if (parts.length === 3 && parts[0] === "channels") {
      id = parts[2];
    } else if (parts.length === 4 && parts[0] === "groups" && parts[2] === "videos") {
      id = parts[3];
    } else return undefined;
    if (!id || !VIMEO_ID.test(id)) return undefined;
    if (hash !== undefined && !VIMEO_HASH.test(hash)) return undefined;
    return { provider: "vimeo", id, ...(hash ? { hash } : {}), ...(start ? { start } : {}) };
  }
  return undefined;
}

export const VIDEO_PROVIDER_LABELS: Record<VideoProvider, string> = { youtube: "YouTube", vimeo: "Vimeo" };

/** Player para o iframe (YouTube sem cookies, Vimeo sem rastreio), já tocando: só monta depois do clique. */
export function videoEmbedUrl(video: VideoRef): string {
  if (video.provider === "youtube") {
    const q = new URLSearchParams({ autoplay: "1", rel: "0" });
    if (video.start) q.set("start", String(video.start));
    return `https://www.youtube-nocookie.com/embed/${video.id}?${q}`;
  }
  const q = new URLSearchParams({ autoplay: "1", dnt: "1" });
  if (video.hash) q.set("h", video.hash);
  return `https://player.vimeo.com/video/${video.id}?${q}${video.start ? `#t=${video.start}s` : ""}`;
}

/** Página do vídeo no site do provedor (o link que funciona sem JavaScript). */
export function videoWatchUrl(video: VideoRef): string {
  if (video.provider === "youtube") return `https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}s` : ""}`;
  return `https://vimeo.com/${video.id}${video.hash ? `/${video.hash}` : ""}${video.start ? `#t=${video.start}s` : ""}`;
}

/** Miniatura pública do YouTube (480×360, existe para todo vídeo). O Vimeo não tem endereço fixo. */
export function videoThumbnail(video: VideoRef): { src: string; width: number; height: number } | undefined {
  return video.provider === "youtube" ? { src: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`, width: 480, height: 360 } : undefined;
}

/** `allow` do iframe do player. */
export const VIDEO_IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share";

/** `sandbox` do player: scripts e a própria origem (o player precisa), tela cheia e o link "ver no site". */
export const VIDEO_IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

/** Origens do player, para a CSP (`frame-src`). */
export const VIDEO_FRAME_SOURCES = ["https://www.youtube-nocookie.com", "https://player.vimeo.com"] as const;

// ── Incorporação (lista de provedores permitidos) ───────────────────────────

export type EmbedCategory = "agenda" | "formulario" | "mapa" | "midia" | "outro";

export interface EmbedProvider {
  id: string;
  label: string;
  category: EmbedCategory;
  /** Domínios exatos; `*.dominio.com` aceita qualquer subdomínio (não o domínio sozinho). */
  hosts: readonly string[];
  /** Formato do caminho (e da consulta, se precisar) que o provedor usa nas incorporações. */
  path: RegExp;
  /** Exemplo de endereço (ajuda do painel e mensagem de erro). */
  example: string;
  /** Altura padrão do iframe, em px. */
  height: number;
  /** `sandbox` do iframe: só o que o provedor precisa para funcionar. */
  sandbox: string;
  /** `allow` do iframe (recursos do navegador), quando o provedor pede. */
  allow?: string;
}

const FORM_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

/**
 * Provedores aceitos no bloco de incorporação. Acrescentar um é versão menor do núcleo; a
 * CSP dos projetos novos já sai com ele (`EMBED_FRAME_SOURCES`), e os existentes precisam
 * regerar a hospedagem.
 */
export const EMBED_PROVIDERS: readonly EmbedProvider[] = [
  {
    id: "calendly",
    label: "Calendly",
    category: "agenda",
    hosts: ["calendly.com"],
    path: /^\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)?\/?$/,
    example: "https://calendly.com/sua-conta/30min",
    height: 700,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "cal",
    label: "Cal.com",
    category: "agenda",
    hosts: ["cal.com", "app.cal.com"],
    path: /^\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?(\/embed)?\/?$/,
    example: "https://cal.com/sua-conta/30min",
    height: 700,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "google-calendar",
    label: "Google Agenda",
    category: "agenda",
    hosts: ["calendar.google.com"],
    path: /^\/calendar\/(embed|appointments\/schedules\/[A-Za-z0-9_-]+)\/?$/,
    example: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ...",
    height: 700,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "google-forms",
    label: "Google Forms",
    category: "formulario",
    hosts: ["docs.google.com"],
    path: /^\/forms\/d\/(e\/)?[A-Za-z0-9_-]+\/viewform\/?$/,
    example: "https://docs.google.com/forms/d/e/1FAIpQL.../viewform?embedded=true",
    height: 800,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "typeform",
    label: "Typeform",
    category: "formulario",
    hosts: ["form.typeform.com", "*.typeform.com"],
    path: /^\/to\/[A-Za-z0-9]+\/?$/,
    example: "https://form.typeform.com/to/AbCdEf",
    height: 600,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "tally",
    label: "Tally",
    category: "formulario",
    hosts: ["tally.so"],
    path: /^\/(embed|r)\/[A-Za-z0-9]+\/?$/,
    example: "https://tally.so/embed/wA1bCd",
    height: 600,
    sandbox: FORM_SANDBOX,
  },
  {
    id: "google-maps",
    label: "Google Maps",
    category: "mapa",
    hosts: ["www.google.com", "maps.google.com"],
    path: /^\/maps\/embed(\/v1\/[a-z]+)?\/?$/,
    example: "https://www.google.com/maps/embed?pb=!1m18...",
    height: 450,
    sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
    allow: "fullscreen",
  },
  {
    id: "openstreetmap",
    label: "OpenStreetMap",
    category: "mapa",
    hosts: ["www.openstreetmap.org"],
    path: /^\/export\/embed\.html$/,
    example: "https://www.openstreetmap.org/export/embed.html?bbox=...&layer=mapnik",
    height: 450,
    sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
  },
  {
    id: "spotify",
    label: "Spotify",
    category: "midia",
    hosts: ["open.spotify.com"],
    path: /^\/embed\/(track|album|playlist|episode|show|artist)\/[A-Za-z0-9]+\/?$/,
    example: "https://open.spotify.com/embed/episode/5Xt5DXGzch68nYYamXrNxZ",
    height: 352,
    sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
    allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    category: "midia",
    hosts: ["w.soundcloud.com"],
    path: /^\/player\/?$/,
    example: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123",
    height: 166,
    sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
    allow: "autoplay",
  },
  {
    id: "figma",
    label: "Figma",
    category: "outro",
    hosts: ["embed.figma.com", "www.figma.com"],
    path: /^\/(embed|(design|file|proto|board|slides)\/[A-Za-z0-9]+(\/[^/]*)?)\/?$/,
    example: "https://embed.figma.com/design/AbC123/Projeto?embed-host=share",
    height: 600,
    sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox",
    allow: "fullscreen",
  },
];

const hostMatches = (pattern: string, host: string) =>
  pattern.startsWith("*.") ? host.endsWith(pattern.slice(1)) && /^[a-z0-9-]+$/.test(host.slice(0, -pattern.length + 1)) : host === pattern;

export interface EmbedRef {
  provider: EmbedProvider;
  /** Endereço normalizado (o que vai no `src`). */
  src: string;
}

/** Provedor e endereço normalizado, se a URL é de um provedor permitido e no formato dele. */
export function parseEmbedUrl(raw: unknown): EmbedRef | undefined {
  const url = strictUrl(raw);
  if (!url) return undefined;
  const host = url.hostname.toLowerCase();
  // Google Forms e Maps compartilham domínio com outras coisas: confere o caminho também.
  const provider = EMBED_PROVIDERS.find((p) => p.hosts.some((h) => hostMatches(h, host)) && p.path.test(url.pathname));
  if (!provider) return undefined;
  url.hash = "";
  return { provider, src: url.href };
}

/** Origens dos provedores, para a CSP (`frame-src`). `*.x.com` vira `https://*.x.com`. */
export const EMBED_FRAME_SOURCES: readonly string[] = [...new Set(EMBED_PROVIDERS.flatMap((p) => p.hosts.map((h) => `https://${h}`)))];

/** Tudo o que os blocos do núcleo podem pôr num iframe: players de vídeo e provedores de incorporação. */
export const BLOCK_FRAME_SOURCES: readonly string[] = [...VIDEO_FRAME_SOURCES, ...EMBED_FRAME_SOURCES];
