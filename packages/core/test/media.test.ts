import { describe, expect, it } from "vitest";
import {
  BLOCK_FRAME_SOURCES,
  EMBED_FRAME_SOURCES,
  EMBED_PROVIDERS,
  parseEmbedUrl,
  parseVideoUrl,
  videoEmbedUrl,
  videoThumbnail,
  videoWatchUrl,
} from "../src/blocks/media";

describe("parseVideoUrl", () => {
  it("reconhece os endereços comuns do YouTube", () => {
    const id = "M7lc1UVf-VE";
    for (const url of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&list=PL123&index=2`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/live/${id}`,
      `  https://youtu.be/${id}  `,
    ]) {
      expect(parseVideoUrl(url), url).toEqual({ provider: "youtube", id });
    }
  });

  it("lê o início do vídeo (t ou start)", () => {
    expect(parseVideoUrl("https://youtu.be/M7lc1UVf-VE?t=90")?.start).toBe(90);
    expect(parseVideoUrl("https://www.youtube.com/watch?v=M7lc1UVf-VE&t=1m30s")?.start).toBe(90);
    expect(parseVideoUrl("https://www.youtube.com/embed/M7lc1UVf-VE?start=12")?.start).toBe(12);
    expect(parseVideoUrl("https://youtu.be/M7lc1UVf-VE?t=abc")?.start).toBeUndefined();
  });

  it("reconhece o Vimeo, inclusive não listado, canal e grupo", () => {
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({ provider: "vimeo", id: "76979871" });
    expect(parseVideoUrl("https://vimeo.com/76979871/a1b2c3d4e5")).toEqual({ provider: "vimeo", id: "76979871", hash: "a1b2c3d4e5" });
    expect(parseVideoUrl("https://player.vimeo.com/video/76979871?h=a1b2c3d4e5")).toEqual({ provider: "vimeo", id: "76979871", hash: "a1b2c3d4e5" });
    expect(parseVideoUrl("https://vimeo.com/channels/staffpicks/76979871")).toEqual({ provider: "vimeo", id: "76979871" });
    expect(parseVideoUrl("https://vimeo.com/groups/abc/videos/76979871")).toEqual({ provider: "vimeo", id: "76979871" });
  });

  it("recusa o que não é um vídeo dos dois provedores, com validação estrita", () => {
    for (const url of [
      "",
      "texto qualquer",
      "http://www.youtube.com/watch?v=M7lc1UVf-VE",
      "https://www.youtube.com/watch?v=curto",
      "https://www.youtube.com/watch?v=M7lc1UVf-VE<script>",
      "https://www.youtube.com/channel/UC123",
      "https://youtu.be/M7lc1UVf-VE/extra",
      "https://youtube.com.evil.com/watch?v=M7lc1UVf-VE",
      "https://evilyoutube.com/watch?v=M7lc1UVf-VE",
      "https://user:pass@www.youtube.com/watch?v=M7lc1UVf-VE",
      "https://www.youtube.com:8443/watch?v=M7lc1UVf-VE",
      "https://vimeo.com/abc",
      "https://vimeo.com/76979871/zz!",
      "https://vimeo.com/76979871/a/b",
      "javascript:alert(1)",
      "https://example.com/video.mp4",
    ]) {
      expect(parseVideoUrl(url), url).toBeUndefined();
    }
    expect(parseVideoUrl(42)).toBeUndefined();
    expect(parseVideoUrl(undefined)).toBeUndefined();
  });

  it("monta o player sem cookies, o link do provedor e a miniatura", () => {
    const yt = parseVideoUrl("https://youtu.be/M7lc1UVf-VE?t=90")!;
    expect(videoEmbedUrl(yt)).toBe("https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&rel=0&start=90");
    expect(videoWatchUrl(yt)).toBe("https://www.youtube.com/watch?v=M7lc1UVf-VE&t=90s");
    expect(videoThumbnail(yt)).toEqual({ src: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg", width: 480, height: 360 });
    const vimeo = parseVideoUrl("https://vimeo.com/76979871/a1b2c3d4e5")!;
    expect(videoEmbedUrl(vimeo)).toBe("https://player.vimeo.com/video/76979871?autoplay=1&dnt=1&h=a1b2c3d4e5");
    expect(videoWatchUrl(vimeo)).toBe("https://vimeo.com/76979871/a1b2c3d4e5");
    expect(videoThumbnail(vimeo)).toBeUndefined();
  });
});

describe("parseEmbedUrl", () => {
  it("aceita os exemplos de todos os provedores", () => {
    const examples: Record<string, string> = {
      calendly: "https://calendly.com/meridiano/conversa-inicial",
      cal: "https://cal.com/meridiano/30min",
      "google-calendar": "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1abc",
      "google-forms": "https://docs.google.com/forms/d/e/1FAIpQLSdAbC/viewform?embedded=true",
      typeform: "https://form.typeform.com/to/AbCdEf",
      tally: "https://tally.so/embed/wA1bCd?hideTitle=1",
      "google-maps": "https://www.google.com/maps/embed?pb=!1m18!1m12",
      openstreetmap: "https://www.openstreetmap.org/export/embed.html?bbox=-46.7,-23.6,-46.6,-23.5&layer=mapnik",
      spotify: "https://open.spotify.com/embed/episode/5Xt5DXGzch68nYYamXrNxZ",
      soundcloud: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123",
      figma: "https://embed.figma.com/design/AbC123/Projeto?embed-host=share",
    };
    expect(Object.keys(examples).sort()).toEqual(EMBED_PROVIDERS.map((p) => p.id).sort());
    for (const [id, url] of Object.entries(examples)) expect(parseEmbedUrl(url)?.provider.id, url).toBe(id);
    expect(parseEmbedUrl("https://minhaconta.typeform.com/to/AbCdEf")?.provider.id).toBe("typeform");
  });

  it("devolve o endereço normalizado, sem o fragmento", () => {
    expect(parseEmbedUrl("https://calendly.com/meridiano/30min#topo")?.src).toBe("https://calendly.com/meridiano/30min");
  });

  it("recusa domínio fora da lista, caminho de outro serviço e endereço inseguro", () => {
    for (const url of [
      "https://example.com/embed",
      "http://calendly.com/meridiano/30min",
      "https://calendly.com.evil.com/meridiano",
      "https://evilcalendly.com/meridiano",
      "https://calendly.com/a/b/c",
      "https://docs.google.com/document/d/123/edit",
      "https://www.google.com/search?q=x",
      "https://typeform.com/to/AbCdEf",
      "https://a.b.typeform.com/to/AbCdEf",
      "https://user@tally.so/embed/abc",
      "https://tally.so:444/embed/abc",
      "javascript:alert(1)",
      "<iframe src=\"https://calendly.com/x\"></iframe>",
      "https://calendly.com/x y",
    ]) {
      expect(parseEmbedUrl(url), url).toBeUndefined();
    }
  });

  it("as origens para a CSP cobrem players e provedores, sem repetir", () => {
    expect(EMBED_FRAME_SOURCES).toContain("https://calendly.com");
    expect(EMBED_FRAME_SOURCES).toContain("https://*.typeform.com");
    expect(BLOCK_FRAME_SOURCES).toContain("https://www.youtube-nocookie.com");
    expect(BLOCK_FRAME_SOURCES).toContain("https://player.vimeo.com");
    expect(new Set(BLOCK_FRAME_SOURCES).size).toBe(BLOCK_FRAME_SOURCES.length);
    for (const s of BLOCK_FRAME_SOURCES) expect(s).toMatch(/^https:\/\/(\*\.)?[a-z0-9.-]+$/);
  });
});
