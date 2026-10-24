import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// A CSP do vercel.json só aceita scripts de arquivo ('self'). Script embutido no
// index.html é bloqueado no site publicado (passa despercebido no `vite dev`).

const ROOT = path.resolve(__dirname, "..");
const html = readFileSync(path.join(ROOT, "index.html"), "utf-8");
const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf-8")) as {
  headers: Array<{ headers: Array<{ key: string; value: string }> }>;
};
const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === "Content-Security-Policy")!.value;

describe("CSP do site publicado", () => {
  it("script-src não libera scripts embutidos", () => {
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("o index.html não tem script embutido (todo <script> vem de um arquivo)", () => {
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(([, attrs, body]) => !/\bsrc=/.test(attrs) && body.trim());
    expect(inline.map(([tag]) => tag.slice(0, 80))).toEqual([]);
  });

  it("o script do modo de cor carrega no <head>, antes do app", () => {
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toMatch(/<script src="\/color-mode\.js"><\/script>/);
  });
});
