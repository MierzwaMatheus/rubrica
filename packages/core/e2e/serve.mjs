// Servidor estático mínimo para o dist da demo (o `astro preview` do Astro 7 roda em segundo plano).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const [root, port] = [process.argv[2], Number(process.argv[3] ?? 4787)];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png", ".woff2": "font/woff2" };
const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(root, path);
  for (const file of [base, join(base, "index.html"), `${base}.html`]) {
    if (await isFile(file)) {
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      return res.end(await readFile(file));
    }
  }
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(await readFile(join(root, "404.html")).catch(() => "404"));
}).listen(port, () => console.log(`http://localhost:${port}`));
