// @vitest-environment node
import { describe, it, expect } from "vitest";
import { enhanceImages } from "../../scripts/lib/enhanceImages";

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const manifest = {
  [`${A}.webp`]: { width: 1600, height: 900, small: `${A}-800.webp` },
  [`${B}.webp`]: { width: 640, height: 480 },
};

describe("enhanceImages", () => {
  it("acrescenta medidas, srcset e a marca do que foi acrescentado", () => {
    const out = enhanceImages(`<main><img src="/media/${A}.webp" alt="capa" class="w-full"/></main>`, manifest);
    expect(out).toContain('width="1600" height="900"');
    expect(out).toContain(`srcset="/media/${A}-800.webp 800w, /media/${A}.webp 1600w"`);
    expect(out).toContain('sizes="(max-width: 1024px) 100vw, 800px"');
    expect(out).toContain('data-media="width height srcset sizes"');
    expect(out).toMatch(/\/>(<\/main>)$/);
  });

  it("sem a versão de 800px, só as medidas", () => {
    const out = enhanceImages(`<img src="/media/${B}.webp" alt="">`, manifest);
    expect(out).toContain('width="640" height="480"');
    expect(out).not.toContain("srcset");
    expect(out).toContain('data-media="width height"');
  });

  it("não mexe em medidas ou srcset que o componente já definiu", () => {
    const out = enhanceImages(`<img src="/media/${A}.webp" width="10" height="10" srcset="x 1w">`, manifest);
    expect(out).not.toContain('width="1600"');
    expect(out).not.toContain("data-media");
  });

  it("fetchpriority só na primeira imagem do conteúdo, fora das preguiçosas e da barra lateral", () => {
    const html =
      `<aside><img src="/media/${B}.webp" alt="avatar"></aside>` +
      `<main><img src="/media/${A}.webp" loading="lazy"><img src="/media/${A}.webp" alt="capa"><img src="/media/${B}.webp"></main>`;
    const out = enhanceImages(html, manifest);
    expect(out.match(/fetchpriority="high"/g)).toHaveLength(1);
    const imgs = out.match(/<img[^>]*>/g)!;
    expect(imgs[0]).not.toContain("fetchpriority");
    expect(imgs[1]).not.toContain("fetchpriority");
    expect(imgs[2]).toContain('fetchpriority="high"');
  });

  it("imagens de fora de /media e fora do manifesto ficam como estão", () => {
    const html = `<img src="https://i.com/x.png"><img src="/media/${"9".repeat(8)}-9999-9999-9999-999999999999.webp">`;
    expect(enhanceImages(html, manifest)).toBe(html);
  });
});

describe("enhanceImages — preload que o React põe no HTML", () => {
  it("ganha imagesrcset/imagesizes para pré-carregar a mesma versão da <img>", () => {
    const out = enhanceImages(`<link rel="preload" as="image" href="/media/${A}.webp"/><main><img src="/media/${A}.webp"/></main>`, manifest);
    expect(out).toContain(`<link rel="preload" as="image" href="/media/${A}.webp" imagesrcset="/media/${A}-800.webp 800w, /media/${A}.webp 1600w" imagesizes="(max-width: 1024px) 100vw, 800px"/>`);
  });

  it("preload de outra coisa (fonte) ou sem versão menor fica igual", () => {
    const html = `<link rel="preload" href="/fonts/x.woff2" as="font"/><link rel="preload" as="image" href="/media/${B}.webp"/>`;
    expect(enhanceImages(html, manifest)).toBe(html);
  });
});
