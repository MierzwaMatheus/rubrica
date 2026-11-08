import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyFont } from "../transforms/applyFont.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

const stubCss = `@theme inline {
  --font-sans: "Chakra Petch", sans-serif;
  --font-mono: "Chakra Petch", monospace;
}

:root {
  --radius: 0.5rem;
}
`;

const stubHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body><div id="root"></div></body>
</html>
`;

describe("applyFont", () => {
  it("atualiza --font-sans em CSS", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": stubCss,
      "/project/index.html": stubHtml,
    });
    const fs = makeFsModule(vol);

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );

    const css = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(css).toContain('--font-sans: "Inter"');
  });

  it("atualiza --font-mono em CSS", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": stubCss,
      "/project/index.html": stubHtml,
    });
    const fs = makeFsModule(vol);

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );

    const css = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(css).toContain('--font-mono: "JetBrains Mono"');
  });

  it("não altera --radius no CSS", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": stubCss,
      "/project/index.html": stubHtml,
    });
    const fs = makeFsModule(vol);

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );

    const css = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(css).toContain("--radius: 0.5rem");
  });

  it("substitui <link> do Google Fonts em index.html pela fonte correta", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": stubCss,
      "/project/index.html": stubHtml,
    });
    const fs = makeFsModule(vol);

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain("family=Inter");
    expect(html).not.toContain("Chakra+Petch");
  });

  it("re-executar com mesma fonte não duplica o <link> (idempotência)", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": stubCss,
      "/project/index.html": stubHtml,
    });
    const fs = makeFsModule(vol);

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );
    const first = vol.readFileSync("/project/index.html", "utf-8") as string;

    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/index.html" },
      fs
    );
    const second = vol.readFileSync("/project/index.html", "utf-8") as string;

    expect(first).toBe(second);
    const linkMatches = second.match(/fonts\.googleapis\.com\/css2/g) ?? [];
    expect(linkMatches.length).toBe(1);
  });
});
