/**
 * Confere os links internos do site montado (o fim do `build`): todo `href` e `src` que
 * começa com "/" aponta para um arquivo do `dist`, e um `#âncora` numa página, para um
 * `id` que existe nela. Os previews do combinador (`/previews/...`) só entram quando foram
 * gerados (`build:full`).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "previews" ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

/** Arquivo do `dist` que responde ao caminho (`/docs/guia/temas` → `.../temas/index.html`). */
function fileFor(path: string): string | undefined {
  const clean = decodeURIComponent(path).replace(/\/$/, "");
  for (const candidate of [join(DIST, clean), join(DIST, clean, "index.html"), join(DIST, `${clean}.html`)]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

const idsCache = new Map<string, Set<string>>();
function ids(file: string): Set<string> {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, "utf-8");
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!)));
  }
  return idsCache.get(file)!;
}

function main(): number {
  if (!existsSync(DIST)) {
    console.error("Sem dist/: rode o astro build antes.");
    return 1;
  }
  const previews = existsSync(join(DIST, "previews"));
  const problems: string[] = [];
  let checked = 0;
  for (const page of htmlFiles(DIST)) {
    const html = readFileSync(page, "utf-8");
    for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      const ref = m[1]!.replace(/&amp;/g, "&");
      if (!ref.startsWith("/") && !ref.startsWith("#")) continue;
      if (ref.startsWith("//")) continue;
      const [pathAndQuery, hash] = ref.split("#") as [string, string | undefined];
      const path = pathAndQuery.split("?")[0]!;
      if (path.startsWith("/previews/") && !previews) continue;
      checked++;
      const target = path ? fileFor(path) : page;
      const from = `/${relative(DIST, page)}`;
      if (!target) {
        problems.push(`${from}: ${ref} (não existe no dist)`);
        continue;
      }
      if (hash && target.endsWith(".html") && !ids(target).has(decodeURIComponent(hash))) {
        problems.push(`${from}: ${ref} (sem o id #${hash})`);
      }
    }
  }
  for (const p of problems) console.error(p);
  if (problems.length) {
    console.error(`\n${problems.length} link(s) interno(s) quebrado(s) no site.`);
    return 1;
  }
  console.log(`Links internos do site: ${checked} conferidos, nenhum quebrado.`);
  return 0;
}

process.exitCode = main();
