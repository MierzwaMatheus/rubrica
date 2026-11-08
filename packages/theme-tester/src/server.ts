/** Servidor estático mínimo para o `dist` do Astro (com gzip, como uma hospedagem de verdade). */
import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { extname, join, normalize, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg)/;

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Resolve a URL para um arquivo do `dist`: `/x` vira `/x/index.html` ou `/x.html`. */
async function resolveFile(root: string, urlPath: string): Promise<string | null> {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = join(root, clean);
  if (base !== root && !base.startsWith(root + sep)) return null;
  for (const candidate of [base, join(base, "index.html"), `${base}.html`]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

export interface StaticServer {
  url: string;
  close(): Promise<void>;
}

export async function serveStatic(root: string): Promise<StaticServer> {
  const server: Server = createServer(async (req, res) => {
    try {
      const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
      let file = await resolveFile(root, urlPath);
      let status = 200;
      if (!file) {
        status = 404;
        file = (await isFile(join(root, "404.html"))) ? join(root, "404.html") : null;
      }
      if (!file) {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
      const type = TYPES[extname(file)] ?? "application/octet-stream";
      let body = await readFile(file);
      const headers: Record<string, string> = { "content-type": type };
      // Ativos com hash do Astro são imutáveis; o resto revalida.
      headers["cache-control"] = urlPath.startsWith("/_astro/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate";
      if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""))) {
        body = gzipSync(body);
        headers["content-encoding"] = "gzip";
        headers["vary"] = "accept-encoding";
      }
      headers["content-length"] = String(body.length);
      res.writeHead(status, headers).end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(500).end("erro");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
