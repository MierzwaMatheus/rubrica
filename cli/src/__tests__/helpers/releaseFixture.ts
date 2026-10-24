import * as fs from "node:fs/promises";
import * as path from "node:path";

/** Arquivos de uma release falsa: caminho relativo → conteúdo. */
export type ReleaseFiles = Record<string, string | Buffer>;

export const BASE_CSS = `:root {
  --font-sans: "Inter";
  --font-mono: "JetBrains Mono";
  --bg: #ffffff;
  --text: #000000;
  --primary: #111111;
  --accent: #222222;
}

.card {
  border-radius: 8px;
}

.button {
  padding: 4px;
}
`;

export const BASE_HTML = `<!DOCTYPE html>
<html>
<head>
  <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
  <meta name="theme-color" content="#6366f1" />
  <meta property="og:title" content="Rubrica" />
  <meta property="og:url" content="https://exemplo.com" />
  <meta property="twitter:creator" content="@handle" />
  <meta name="author" content="Author" />
</head>
<body></body>
</html>
`;

const PLUGIN_IDS = [
  "contact-wizard", "proposals", "payments", "blog", "portfolio", "resume", "about", "ai-resumes",
  "audit-log", "media-manager", "i18n", "playground", "testimonials", "testimonials-intake",
];

export const BASE_REGISTRY = `export const pluginRegistry = [
${PLUGIN_IDS.map((id) => `  { id: '${id}', defaultEnabled: true },`).join("\n")}
];
`;

const PAGE = (name: string) => `export default function ${name}() {\n  return <main>${name}</main>;\n}\n`;

/** Release mínima com o que os transforms do create precisam. */
export function baseRelease(): ReleaseFiles {
  const files: ReleaseFiles = {
    "package.json": JSON.stringify({ name: "rubrica", version: "1.0.0" }, null, 2),
    "src/index.css": BASE_CSS,
    "index.html": BASE_HTML,
    "convex/pluginRegistry.ts": BASE_REGISTRY,
    "convex/schema.ts": "export const schema = 1;\n",
    "src/components/Layout.tsx": "// layout padrão\n",
    "src/components/Sidebar.tsx": "// sidebar padrão\n",
    "src/components/Navbar.tsx": "// navbar padrão\n",
    "src/components/Footer.tsx": "// footer padrão\n",
    "src/pages/Home.tsx": PAGE("Home"),
    "public/data/home.json": "{}\n",
    "cli/package.json": "{}\n",
    "templates/layouts/brutalist/Layout.tsx": "// brutalist layout\n",
    "templates/layouts/brutalist/Navbar.tsx": "// brutalist navbar\n",
  };
  for (const page of ["Home", "Resume", "Portfolio", "About", "Blog"]) {
    files[`templates/layouts/brutalist/pages/${page}.tsx`] = PAGE(`Brutalist${page}`);
  }
  return files;
}

export async function writeTree(dir: string, files: ReleaseFiles): Promise<void> {
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content);
  }
}

/** Substituto do downloadRelease: "baixa" a release da tabela em memória. */
export function fakeDownload(releases: Record<string, ReleaseFiles>) {
  return async (targetDir: string, tag: string): Promise<void> => {
    const files = releases[tag.replace(/^v/, "")];
    if (!files) throw new Error(`release ${tag} não existe`);
    await writeTree(targetDir, files);
  };
}

export async function readTree(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(d: string): Promise<void> {
    for (const entry of await fs.readdir(d, { withFileTypes: true })) {
      const abs = path.join(d, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else out[path.relative(dir, abs).split(path.sep).join("/")] = await fs.readFile(abs, "utf-8");
    }
  }
  await walk(dir);
  return out;
}
