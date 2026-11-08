/**
 * Ponta a ponta do migrar: projeto v1 fictício → branch rubrica-v2 com os pacotes do
 * monorepo (link:) → build com os dados convertidos do export fictício → as páginas da
 * v2 mostram o conteúdo da v1. Nada fala com o Convex. Desligue com RUBRICA_SKIP_E2E=1.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { runMigrate } from "../../src/commands/migrate";
import { strFromU8, unzipSync } from "fflate";
import { comparePage, readDistPage } from "../../src/migrate/compare";
import { parseJsonl, readSnapshot } from "../../src/migrate/snapshot";
import { schemaErrors } from "../convex-validate";
import { pristine, v1Project } from "../fixtures/v1-project";
import { repo } from "../helpers";

describe.skipIf(process.env.RUBRICA_SKIP_E2E === "1")("migrar → install → build (ponta a ponta)", () => {
  const { dir, exportZip } = v1Project("zine");
  const calls: string[] = [];

  beforeAll(async () => {
    await runMigrate(["--yes", "--export", exportZip, "--local", repo()], {
      cwd: dir,
      pristine,
      runner: (file, args, opts) => {
        calls.push([file, ...args].join(" "));
        // os comandos reais (git, pnpm), menos qualquer coisa do Convex
        if (args.includes("convex")) throw new Error("o migrar não pode chamar o Convex");
        return execFileSync(file, args, { cwd: opts?.cwd, env: { ...process.env, ...opts?.env }, stdio: "pipe" }).toString();
      },
    });
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("instalou, buildou e não chamou o Convex", () => {
    expect(calls.some((c) => c === "pnpm install")).toBe(true);
    expect(calls.some((c) => c === "pnpm run build")).toBe(true);
    expect(calls.some((c) => c.includes("convex"))).toBe(false);
    expect(readFileSync(join(dir, ".rubrica/migracao/relatorio.md"), "utf-8")).toContain("Build com os dados convertidos: ok");
  });

  it("a home da v2 tem o conteúdo da v1, nos dois idiomas", () => {
    const home = readDistPage(join(dir, "dist"), "/")!;
    expect(home).toContain("Desenho produtos que as pessoas entendem.");
    expect(home).toContain("Sou designer há dez anos.");
    expect(home).toContain("Cases em destaque");
    expect(home).toContain("App de agendamento");
    const en = readDistPage(join(dir, "dist"), "/en")!;
    expect(en).toContain("I design products people understand.");
  });

  it("as URLs da v1 continuam (/sobre, /portfolio/<slug>, /blog/<slug>, /en)", () => {
    for (const path of ["/sobre", "/curriculo", "/portfolio", "/portfolio/app-de-agendamento", "/blog", "/blog/como-desenho-sistemas", "/en/blog/como-desenho-sistemas", "/depoimentos"]) {
      expect(readDistPage(join(dir, "dist"), path), path).not.toBeNull();
    }
    expect(readDistPage(join(dir, "dist"), "/sobre")).toContain("Fora do trabalho, pedalo.");
    expect(readDistPage(join(dir, "dist"), "/portfolio/app-de-agendamento")).toContain("Muitas faltas.");
  });

  it("o import da v2 leva os dados de negócio convertidos, válidos no schema, com os ids da v1", () => {
    const work = join(dir, ".rubrica/migracao");
    const files = unzipSync(readFileSync(join(work, "import-v2.zip")));
    const table = (t: string) => parseJsonl(strFromU8(files[`${t}/documents.jsonl`]!));
    const original = readSnapshot(exportZip);
    for (const t of ["contactRequests", "testimonialSubmissions", "proposals", "proposalVersions", "proposalAcceptances", "contractTemplates", "checkouts", "aiResumes"]) {
      expect(files[`${t}/documents.jsonl`], t).toBeDefined();
      expect(schemaErrors(t, table(t)), t).toEqual([]);
    }
    expect(table("proposals").map((p) => p._id)).toEqual(original.tables.proposals!.map((p) => p._id));
    expect(table("proposalAcceptances")[0]!.contentHash).toBe(original.tables.proposalAcceptances![0]!.contentHash);
    expect(table("checkouts").find((c) => c.uniqueLink === "pago-123")?.status).toBe("paid");
    expect(table("contactRequests")[0]!.consent).toMatchObject({ policyVersion: 0, ipHash: "v1:anterior-a-v2" });
    expect(files["proposalSessions/documents.jsonl"]).toBeUndefined();
    const tables = parseJsonl(strFromU8(files["_tables/documents.jsonl"]!));
    expect(tables.find((t) => t.name === "aiResumes")?.id).toBe(original.tableNumbers.aiGeneratedResumes);
    // Sem destino: o depoimento em vídeo e a versão ilegível, como estavam.
    const pending = unzipSync(readFileSync(join(work, "pendentes-v1.zip")));
    expect(Object.keys(pending).sort()).toEqual(["_tables/documents.jsonl", "proposalVersions/documents.jsonl", "testimonialSubmissions/documents.jsonl"]);
    const report = readFileSync(join(work, "relatorio.md"), "utf-8");
    expect(report).toContain("| aiResumes | aiGeneratedResumes | 1 |");
    expect(report).toMatch(/Sem destino na v2[\s\S]*testimonialSubmissions[^\n]*vídeo/);
    expect(report).toMatch(/webhooks\/asaas/);
  });

  it("a conferência compara uma página da v1 com a da v2", () => {
    const v1Html = "<title>Bruna Lima · Designer de produto</title><main><h1>Desenho produtos que as pessoas entendem.</h1><p>Sou designer há dez anos. Gosto de problemas difíceis.</p></main>";
    const result = comparePage("/", v1Html, readDistPage(join(dir, "dist"), "/"));
    expect(result.h1Same).toBe(true);
    expect(result.coverage).toBeGreaterThan(0.9);
  });
});
