import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";

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

const stubHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Rubrica Portfolio</title>
    <meta property="og:title" content="Rubrica Portfolio" />
    <meta property="og:url" content="" />
    <meta property="twitter:title" content="Rubrica Portfolio" />
    <meta property="twitter:url" content="" />
    <meta property="twitter:creator" content="" />
    <meta name="theme-color" content="#6366f1" />
    <meta name="author" content="Portfolio Author" />
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

const fullData = {
  fontFamily: "Inter",
  themeColor: "#0065fe",
  siteName: "João Silva | Dev",
  siteUrl: "https://joaosilva.dev",
  twitterHandle: "joaosilva",
  authorName: "João Silva",
};

describe("applyIndexHtml", () => {
  it("substitui <link> do Google Fonts pelo link da fonte escolhida", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain("family=Inter");
    expect(html).not.toContain("Chakra+Petch");
  });

  it("atualiza <meta name='theme-color'> com a cor do tema", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain('content="#0065fe"');
    expect(html).not.toContain("#6366f1");
  });

  it("substitui og:title e twitter:title pelo siteName fornecido", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain('property="og:title" content="João Silva | Dev"');
    expect(html).toContain('property="twitter:title" content="João Silva | Dev"');
  });

  it("substitui og:url e twitter:url pelo siteUrl fornecido", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain('property="og:url" content="https://joaosilva.dev"');
    expect(html).toContain('property="twitter:url" content="https://joaosilva.dev"');
  });

  it("substitui twitter:creator pelo twitterHandle com @", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain('property="twitter:creator" content="@joaosilva"');
  });

  it("substitui <meta name='author'> pelo authorName fornecido", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);

    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain('name="author" content="João Silva"');
    expect(html).not.toContain('"Portfolio Author"');
  });

  it("re-executar com mesmos valores produz output idêntico (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project/index.html": stubHtml });
    const fs = makeFsModule(vol);

    await applyIndexHtml(fullData, "/project/index.html", fs);
    const first = vol.readFileSync("/project/index.html", "utf-8") as string;

    await applyIndexHtml(fullData, "/project/index.html", fs);
    const second = vol.readFileSync("/project/index.html", "utf-8") as string;

    expect(first).toBe(second);
  });
});
