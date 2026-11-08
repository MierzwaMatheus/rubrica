/**
 * Links entre os guias: todo link relativo de docs/guia (e do docs/v2/contribuindo.md)
 * aponta para um arquivo que existe e, com âncora, para um título que existe no idioma
 * da página. Os links do site montado (`dist`) o build confere em `links-dist.ts`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isPublishedDoc } from "../src/lib/docs";
import { renderMarkdown } from "../src/lib/markdown";
import { REPO_ROOT } from "./blocos/fonte";

const FILES = [
  ...readdirSync(join(REPO_ROOT, "docs/guia"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => `docs/guia/${f}`),
  "docs/v2/contribuindo.md",
];

const read = (repoPath: string) => readFileSync(join(REPO_ROOT, repoPath), "utf-8");

/** Ids dos títulos, no mesmo formato do site (e do GitHub). */
const anchorsCache = new Map<string, Set<string>>();
function anchors(repoPath: string): Set<string> {
  if (!anchorsCache.has(repoPath)) {
    const { html } = renderMarkdown(read(repoPath));
    anchorsCache.set(repoPath, new Set([...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map((m) => decodeURIComponent(m[1]!))));
  }
  return anchorsCache.get(repoPath)!;
}

function resolveFrom(from: string, ref: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const seg of ref.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

/** Links do Markdown fora de código. */
function links(md: string): string[] {
  const text = md.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  return [...text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]!);
}

function problems(from: string): string[] {
  const out: string[] = [];
  const isEn = from.endsWith(".en.md");
  for (const ref of links(read(from))) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("/")) continue;
    const [file, hash] = ref.split("#") as [string, string | undefined];
    let target = file ? resolveFrom(from, file) : from;
    if (!existsSync(join(REPO_ROOT, target))) {
      out.push(`${from}: ${ref} (arquivo não existe)`);
      continue;
    }
    if (!hash) continue;
    // Guia publicado: a página em inglês mostra o .en.md, se existir.
    if (isEn && isPublishedDoc(target) && existsSync(join(REPO_ROOT, target.replace(/\.md$/, ".en.md")))) {
      target = target.replace(/\.md$/, ".en.md");
    }
    if (!anchors(target).has(decodeURIComponent(hash))) out.push(`${from}: ${ref} (sem o título #${hash} em ${target})`);
  }
  return out;
}

test("links entre os guias apontam para arquivos e títulos que existem", () => {
  assert.deepEqual(FILES.flatMap(problems), []);
});
