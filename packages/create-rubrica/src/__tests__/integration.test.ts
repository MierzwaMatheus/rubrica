import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyTheme } from "../transforms/applyTheme.js";
import { applyFont } from "../transforms/applyFont.js";
import { applyLayout } from "../transforms/applyLayout.js";
import { applyPlugins } from "../transforms/applyPlugins.js";
import { applyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { readState } from "../state/readState.js";
import { writeState } from "../state/writeState.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeLayoutFsModule(vol: InstanceType<typeof Volume>) {
  return {
    ...makeFsModule(vol),
    copyFile: (src: string, dest: string) =>
      vol.promises.copyFile(src, dest).then(() => undefined),
    unlink: (path: string) =>
      vol.promises.unlink(path).then(() => undefined),
    exists: async (path: string) => {
      try {
        await vol.promises.access(path);
        return true;
      } catch {
        return false;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COMBINED_CSS = `@theme inline {
  --font-sans: "Chakra Petch", sans-serif;
  --font-mono: "Chakra Petch", monospace;
}

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}

body { margin: 0; }
`;

const STUB_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <meta name="theme-color" content="#6366f1" />
    <meta property="og:title" content="Placeholder Title" />
    <meta property="og:url" content="https://exemplo.com" />
    <meta property="twitter:title" content="Placeholder Title" />
    <meta property="twitter:url" content="https://exemplo.com" />
    <meta property="twitter:creator" content="@placeholder" />
    <meta name="author" content="Placeholder Author" />
  </head>
  <body><div id="root"></div></body>
</html>
`;

const STUB_REGISTRY = `export const PLUGIN_REGISTRY = [
  {
    id: 'blog',
    label: 'Blog',
    defaultEnabled: true,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    defaultEnabled: true,
  },
];
`;

// Navbar template usa usePlugins() — sem rotas hardcoded
const STUB_NAVBAR = `import { usePlugins } from "../hooks/usePlugins";
import { NAV_ITEMS } from "../const";

export function Navbar() {
  const plugins = usePlugins();
  const visibleItems = NAV_ITEMS.filter((item) => plugins[item.pluginId]);
  return <nav>{visibleItems.map((item) => <a key={item.path} href={item.path}>{item.label}</a>)}</nav>;
}
`;

const FULL_CONFIG = {
  siteName: "Portfólio Integração",
  siteUrl: "https://integracao.com",
  siteDescription: "Teste de integração",
  authorName: "Dev Teste",
  authorEmail: "dev@teste.com",
  twitterHandle: "devteste",
  lang: "pt-BR",
  seoHomeTitle: "Dev Teste · Home",
  seoHomeDescription: "Portfólio de testes.",
  rssTitle: "Dev Teste — Blog",
  rssDescription: "Artigos de teste.",
  ogImageUrl: "https://integracao.com/og.jpg",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
};

const FULL_STATE = {
  version: "1.0.0",
  layout: "cyberpunk" as const,
  theme: "editorial-cream",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  plugins: { blog: true, portfolio: true },
};

// ---------------------------------------------------------------------------
// Ciclo 1 — applyTheme + applyFont sem conflito no mesmo src/index.css
// ---------------------------------------------------------------------------

describe("integração: applyTheme + applyFont em cadeia", () => {
  it("resultado final tem variáveis de tema E de fonte sem conflito", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": COMBINED_CSS });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
    await applyFont(
      { fontSans: "Inter", fontMono: "JetBrains Mono" },
      { css: "/project/src/index.css", html: "/project/src/index.css" },
      fs
    );

    const css = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    // variáveis do tema estão presentes
    expect(css).toContain("--primary:");
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");

    // variáveis de fonte estão presentes
    expect(css).toContain('--font-sans: "Inter"');
    expect(css).toContain('--font-mono: "JetBrains Mono"');
  });
});

// ---------------------------------------------------------------------------
// Ciclo 2 — applyLayout("cyberpunk") + applyIndexHtml em sequência
// ---------------------------------------------------------------------------

describe("integração: applyLayout(cyberpunk) + applyIndexHtml em sequência", () => {
  it("Sidebar.tsx copiado e index.html com font link e og:title corretos", async () => {
    const vol = Volume.fromJSON({
      "/project/index.html": STUB_HTML,
    });

    // montar templates
    vol.mkdirSync("/templates/layouts/cyberpunk", { recursive: true });
    vol.writeFileSync("/templates/layouts/cyberpunk/Layout.tsx", "// cyberpunk Layout");
    vol.writeFileSync("/templates/layouts/cyberpunk/Sidebar.tsx", STUB_NAVBAR);
    vol.mkdirSync("/project/src/components", { recursive: true });

    const layoutFs = makeLayoutFsModule(vol);
    const htmlFs = makeFsModule(vol);

    await applyLayout(
      "cyberpunk",
      { projectDir: "/project", templatesDir: "/templates" },
      layoutFs
    );

    await applyIndexHtml(
      {
        fontFamily: "Inter",
        themeColor: "#0065fe",
        siteName: "Meu Portfólio",
        siteUrl: "https://meusite.com",
        twitterHandle: "meuhandle",
        authorName: "Meu Nome",
      },
      "/project/index.html",
      htmlFs
    );

    // layout
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(sidebar).toContain("usePlugins");

    const hasNavbar = await layoutFs.exists("/project/src/components/Navbar.tsx");
    expect(hasNavbar).toBe(false);

    // html
    const html = vol.readFileSync("/project/index.html", "utf-8") as string;
    expect(html).toContain("family=Inter");
    expect(html).toContain("Meu Portfólio");
  });
});

// ---------------------------------------------------------------------------
// Ciclo 3 — applyPlugins desativa blog → applyLayout copia navbar com filtragem dinâmica
// ---------------------------------------------------------------------------

describe("integração: applyPlugins(blog=false) + applyLayout(cyberpunk)", () => {
  it("registry tem blog desativado e Sidebar copiada não tem rota /blog hardcoded", async () => {
    const vol = Volume.fromJSON({
      "/project/convex/pluginRegistry.ts": STUB_REGISTRY,
    });

    vol.mkdirSync("/templates/layouts/cyberpunk", { recursive: true });
    vol.writeFileSync("/templates/layouts/cyberpunk/Layout.tsx", "// cyberpunk Layout");
    vol.writeFileSync("/templates/layouts/cyberpunk/Sidebar.tsx", STUB_NAVBAR);
    vol.mkdirSync("/project/src/components", { recursive: true });

    const pluginFs = makeFsModule(vol);
    const layoutFs = makeLayoutFsModule(vol);

    await applyPlugins({ blog: false }, "/project/convex/pluginRegistry.ts", pluginFs);
    await applyLayout("cyberpunk", { projectDir: "/project", templatesDir: "/templates" }, layoutFs);

    // registry tem blog desativado
    const registry = vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string;
    expect(registry).toMatch(/id: 'blog'[\s\S]*?defaultEnabled: false/);

    // Sidebar copiada existe e não tem rota hardcoded para blog
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(sidebar).toContain("usePlugins");
    expect(sidebar).not.toMatch(/href=["']\/blog["']/);
  });
});

// ---------------------------------------------------------------------------
// Ciclo 4 — applyRubricalConfig + writeState com mesmos valores
// ---------------------------------------------------------------------------

describe("integração: applyRubricalConfig + writeState com mesmos valores de identidade e aparência", () => {
  it("rubrica.config.ts e rubrica.json refletem os mesmos valores", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/project", { recursive: true });
    const fs = makeFsModule(vol);

    await applyRubricalConfig(FULL_CONFIG, "/project", fs);
    await writeState("/project", FULL_STATE, fs);

    const configTs = vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string;
    expect(configTs).toContain('"Portfólio Integração"');
    expect(configTs).toContain('"Inter"');

    const state = await readState("/project", fs);
    expect(state.fontSans).toBe("Inter");
    expect(state.layout).toBe("cyberpunk");
  });
});

// ---------------------------------------------------------------------------
// Ciclo 5 — Idempotência do pipeline completo
// ---------------------------------------------------------------------------

describe("integração: idempotência do pipeline completo", () => {
  it("re-executar todos os transforms com os mesmos inputs produz output idêntico", async () => {
    const vol = Volume.fromJSON({
      "/project/src/index.css": COMBINED_CSS,
      "/project/index.html": STUB_HTML,
      "/project/convex/pluginRegistry.ts": STUB_REGISTRY,
    });

    vol.mkdirSync("/templates/layouts/cyberpunk", { recursive: true });
    vol.writeFileSync("/templates/layouts/cyberpunk/Layout.tsx", "// cyberpunk Layout");
    vol.writeFileSync("/templates/layouts/cyberpunk/Sidebar.tsx", STUB_NAVBAR);
    vol.mkdirSync("/project/src/components", { recursive: true });

    const fs = makeFsModule(vol);
    const layoutFs = makeLayoutFsModule(vol);

    const htmlData = {
      fontFamily: "Inter",
      themeColor: "#0065fe",
      siteName: "Portfólio Integração",
      siteUrl: "https://integracao.com",
      twitterHandle: "devteste",
      authorName: "Dev Teste",
    };

    async function runPipeline() {
      await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
      await applyFont(
        { fontSans: "Inter", fontMono: "JetBrains Mono" },
        { css: "/project/src/index.css", html: "/project/index.html" },
        fs
      );
      await applyLayout("cyberpunk", { projectDir: "/project", templatesDir: "/templates" }, layoutFs);
      await applyPlugins({ blog: true, portfolio: true }, "/project/convex/pluginRegistry.ts", fs);
      await applyIndexHtml(htmlData, "/project/index.html", fs);
      await applyRubricalConfig(FULL_CONFIG, "/project", fs);
      await writeState("/project", FULL_STATE, fs);
    }

    await runPipeline();

    const after1 = {
      css: vol.readFileSync("/project/src/index.css", "utf-8") as string,
      html: vol.readFileSync("/project/index.html", "utf-8") as string,
      registry: vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string,
      configTs: vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string,
      state: vol.readFileSync("/project/rubrica.json", "utf-8") as string,
    };

    await runPipeline();

    const after2 = {
      css: vol.readFileSync("/project/src/index.css", "utf-8") as string,
      html: vol.readFileSync("/project/index.html", "utf-8") as string,
      registry: vol.readFileSync("/project/convex/pluginRegistry.ts", "utf-8") as string,
      configTs: vol.readFileSync("/project/rubrica.config.ts", "utf-8") as string,
      state: vol.readFileSync("/project/rubrica.json", "utf-8") as string,
    };

    expect(after2.css).toBe(after1.css);
    expect(after2.html).toBe(after1.html);
    expect(after2.registry).toBe(after1.registry);
    expect(after2.configTs).toBe(after1.configTs);
    expect(after2.state).toBe(after1.state);
  });
});
