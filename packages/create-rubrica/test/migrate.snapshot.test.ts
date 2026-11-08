import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { CORE_RECIPES } from "@rubrica/core";
import { fixtureSource } from "@rubrica/core/data";
import { convertV1 } from "../src/migrate/convert";
import { importZip, parseJsonl, pendingZip, readSnapshot, snapshotZip, tableNumbersFor } from "../src/migrate/snapshot";
import { toFixtures } from "../src/migrate/fixtures";
import { writeFiles } from "../src/utils/fs";
import { IDS, V1_RUBRICA_JSON, v1Export } from "./fixtures/v1-export";
import { tmp } from "./helpers";

const convert = () => {
  const snap = v1Export();
  return { snap, result: convertV1({ tables: snap.tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: 1 }) };
};

describe("snapshot (ZIP do convex export/import)", () => {
  it("lê o ZIP e a pasta descompactada do mesmo jeito", () => {
    const snap = v1Export();
    const dir = tmp();
    const zipPath = join(dir, "export.zip");
    const zip = snapshotZip(snap);
    writeFileSync(zipPath, zip);
    const fromZip = readSnapshot(zipPath);
    expect(fromZip.tables.posts).toEqual(snap.tables.posts);
    expect(fromZip.tableNumbers).toEqual(snap.tableNumbers);
    expect(Object.keys(fromZip.storage).sort()).toEqual(Object.keys(snap.storage).sort());
    const unzipped = join(dir, "pasta");
    for (const [path, bytes] of Object.entries(unzipSync(zip))) {
      mkdirSync(join(unzipped, path, ".."), { recursive: true });
      writeFileSync(join(unzipped, path), bytes);
    }
    expect(readSnapshot(unzipped).tables.users).toEqual(snap.tables.users);
  });

  it("o import mantém o número das tabelas 1:1 e numera as novas acima", () => {
    const { snap, result } = convert();
    const numbers = tableNumbersFor(result, snap);
    expect(numbers.posts).toBe(snap.tableNumbers.posts);
    expect(numbers.faq).toBe(snap.tableNumbers.aboutFaq);
    expect(numbers.media).toBe(snap.tableNumbers.imageMetadata);
    const used = new Set(Object.values(snap.tableNumbers));
    for (const t of ["pages", "siteSettings", "uiTexts"]) expect(used.has(numbers[t]!)).toBe(false);
    expect(new Set(Object.values(numbers)).size).toBe(Object.values(numbers).length);
  });

  it("o ZIP do import tem as tabelas da v2, o _tables e os arquivos do _storage", () => {
    const { snap, result } = convert();
    const files = unzipSync(importZip(result, snap));
    const posts = parseJsonl(strFromU8(files["posts/documents.jsonl"]!));
    expect(posts[0]!._id).toBe(snap.tables.posts![0]!._id);
    expect(posts[0]!.title).toEqual({ "pt-BR": "Como desenho sistemas", en: "How I design systems" });
    expect(files["aboutFaq/documents.jsonl"]).toBeUndefined();
    expect(parseJsonl(strFromU8(files["faq/documents.jsonl"]!))).toHaveLength(2);
    const tables = parseJsonl(strFromU8(files["_tables/documents.jsonl"]!));
    expect(tables.find((t) => t.name === "posts")?.id).toBe(snap.tableNumbers.posts);
    expect(files[`_storage/${IDS.storage[0]}`]).toEqual(new Uint8Array([1, 2, 0]));
    expect(files["_storage/documents.jsonl"]).toBeDefined();
    // Negócio: mesmos ids e mesmo número de tabela (aiGeneratedResumes → aiResumes).
    const proposals = parseJsonl(strFromU8(files["proposals/documents.jsonl"]!));
    expect(proposals.map((p) => p._id)).toEqual(snap.tables.proposals!.map((p) => p._id));
    expect(tables.find((t) => t.name === "proposals")?.id).toBe(snap.tableNumbers.proposals);
    expect(tables.find((t) => t.name === "aiResumes")?.id).toBe(snap.tableNumbers.aiGeneratedResumes);
    expect(files["proposalSessions/documents.jsonl"]).toBeUndefined();
    const pending = unzipSync(pendingZip(result, snap)!);
    expect(Object.keys(pending).sort()).toEqual(["_tables/documents.jsonl", "proposalVersions/documents.jsonl", "testimonialSubmissions/documents.jsonl"]);
  });

  it("vira fixtures que a fonte de dados do núcleo lê", async () => {
    const { result } = convert();
    const dir = tmp();
    writeFiles(dir, toFixtures(result, (id) => `https://exemplo-123.convex.cloud/api/storage/${id}`));
    const snapshot = await fixtureSource(dir).load();
    expect(snapshot.site.locales).toEqual({ locales: ["pt-BR", "en"], default: "pt-BR" });
    expect(snapshot.pages.map((p) => p.path)).toContain("/sobre");
    expect(snapshot.collections.posts.map((p) => p.slug)).toEqual(["como-desenho-sistemas"]);
    expect(snapshot.collections.resume).toHaveLength(8);
    expect(snapshot.collections.projects[0]!.cover?.url).toBe(`https://exemplo-123.convex.cloud/api/storage/${IDS.storage[1]}`);
    expect(snapshot.texts["common.readMore"]).toEqual({ "pt-BR": "Continuar lendo", en: "Keep reading" });
    expect((snapshot.site.person as { photo?: { url: string } }).photo?.url).toContain("/api/storage/");
  });
});
