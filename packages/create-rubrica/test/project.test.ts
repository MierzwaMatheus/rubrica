import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { createRubrica, RUBRICA_MODULES } from "@rubrica/core/convex";
import { CORE_MODULES } from "../src/core-manifest";
import { convexFiles, convexOwnedFiles, isGeneratedConvexFile, reexportSource } from "../src/project/convex";
import { astroConfig, ejectedSection, MARK, projectFiles, replaceSection, defaultDependencySpecs } from "../src/project/files";
import { CONTENT_SECURITY_POLICY, defaultHosting, headersFile, hostingFiles, redirectsFile, vercelJson } from "../src/project/hosting";
import { repo, sampleState } from "./helpers";

const demo = (p: string) => readFileSync(repo("apps/demo", p), "utf-8");

describe("convex/ gerado", () => {
  it("o manifesto do CLI bate com o núcleo do monorepo", () => {
    const rubrica = createRubrica();
    expect(Object.keys(CORE_MODULES)).toEqual([...RUBRICA_MODULES]);
    for (const m of RUBRICA_MODULES) expect(CORE_MODULES[m], m).toEqual(Object.keys(rubrica[m]));
  });

  it("gera os mesmos arquivos do projeto de referência (apps/demo/convex)", () => {
    const files = convexFiles();
    const demoModules = readdirSync(repo("apps/demo/convex/rubrica")).map((f) => `convex/rubrica/${f}`).sort();
    expect(Object.keys(files).filter((f) => f.startsWith("convex/rubrica/")).sort()).toEqual(demoModules);
    for (const [path, content] of Object.entries(files)) expect(content, path).toBe(demo(path));
    const owned = convexOwnedFiles();
    for (const path of ["convex/schema.ts", "convex/auth.config.ts", "convex/tsconfig.json"]) expect(owned[path], path).toBe(demo(path));
  });

  it("reexporta como o reexportSource do núcleo", async () => {
    const core = await import("@rubrica/core/convex");
    const rubrica = core.createRubrica();
    expect(reexportSource("posts", CORE_MODULES.posts!)).toBe(core.reexportSource(rubrica, "posts"));
  });

  it("o rubrica.config.ts liga os blocos próprios do projeto", () => {
    expect(convexOwnedFiles()["convex/rubrica.config.ts"]).toContain('import { blocks } from "../src/blocks";');
    expect(convexOwnedFiles()["convex/rubrica.config.ts"]).toContain("createRubrica({ blocks })");
  });

  it("reconhece os arquivos gerados", () => {
    expect(isGeneratedConvexFile("convex/rubrica/posts.ts", convexFiles()["convex/rubrica/posts.ts"]!)).toBe(true);
    expect(isGeneratedConvexFile("convex/minhas.ts", "export const x = 1;")).toBe(false);
  });
});

describe("astro.config.ts", () => {
  it("usa o tema, os blocos próprios e os ejetados", () => {
    const state = sampleState({
      tema: "cyberpunk",
      ejetados: { hero: { tipo: "hero", pasta: "src/overrides/hero", arquivo: "src/overrides/hero/index.tsx", origem: "@rubrica/core", versao: "2.0.0", hash: "x", arquivoOrigem: "src/components/blocks/basic.tsx", componente: "HeroBlock" } },
    });
    const config = astroConfig(state);
    expect(config).toContain('theme: "@rubrica/theme-cyberpunk"');
    expect(config).toContain('"hero": "./src/overrides/hero/index.tsx"');
    expect(config).toContain('site: "https://ana.dev"');
    expect(config).toContain("RUBRICA_FIXTURES");
  });

  it("troca só o trecho entre marcadores", () => {
    const config = astroConfig(sampleState());
    const next = replaceSection(config, MARK.ejectedStart, MARK.ejectedEnd, ejectedSection({ ejetados: { faq: { tipo: "faq", arquivo: "src/overrides/faq/index.tsx" } as never } }));
    expect(next).toContain('"faq": "./src/overrides/faq/index.tsx"');
    expect(next.replace(/\s*"faq".*\n/, "\n")).toBe(config);
    expect(() => replaceSection("sem marcadores", MARK.ejectedStart, MARK.ejectedEnd, "")).toThrow(/marcadores/);
  });
});

describe("hospedagem neutra (decisão 21)", () => {
  const config = { ...defaultHosting(), redirects: [{ from: "/antigo", to: "/novo", status: 301 as const }] };

  it("vercel.json com build pelo convex deploy, cabeçalhos e redirecionamentos", () => {
    const json = JSON.parse(vercelJson(config));
    expect(json.buildCommand).toContain("convex deploy");
    expect(json.redirects).toEqual([{ source: "/antigo", destination: "/novo", permanent: true }]);
    expect(json.headers.map((h: { source: string }) => h.source)).toEqual(["/(.*)", "/_astro/(.*)"]);
  });

  it("_headers e _redirects com a mesma configuração", () => {
    expect(redirectsFile(config)).toContain("/antigo /novo 301");
    const headers = headersFile(config);
    expect(headers).toContain("/*\n  Strict-Transport-Security");
    expect(headers).toContain(`Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`);
    expect(headers).toContain("/_astro/*\n  Cache-Control: public, max-age=31536000, immutable");
  });

  it("a CSP deixa as ilhas do Astro e os formulários funcionarem", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'unsafe-inline'");
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.convex.site");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(Object.keys(hostingFiles())).toEqual(["vercel.json", "public/_redirects", "public/_headers"]);
  });
});

describe("projectFiles", () => {
  const files = projectFiles({ name: "site-da-ana", state: sampleState(), deps: defaultDependencySpecs() });

  it("depende do núcleo e do tema, sem copiar o template", () => {
    const pkg = JSON.parse(files["package.json"]!);
    expect(pkg.dependencies["@rubrica/core"]).toMatch(/^\^2\./);
    expect(pkg.dependencies["@rubrica/theme-padrao"]).toMatch(/^\^2\./);
    expect(pkg.dependencies.astro).toBeDefined();
    expect(pkg.devDependencies["create-rubrica"]).toBeDefined();
    // O .mcp.json roda npx rubrica mcp, que delega ao @rubrica/mcp.
    expect(pkg.devDependencies["@rubrica/mcp"]).toMatch(/^\^2\./);
    expect(Object.keys(files).some((f) => f.startsWith("src/components") || f.startsWith("src/pages"))).toBe(false);
  });

  it("leva AGENTS.md, CLAUDE.md, .mcp.json e o rubrica.json", () => {
    expect(files["AGENTS.md"]).toContain("rubrica mcp");
    expect(files["CLAUDE.md"]).toContain("@AGENTS.md");
    expect(JSON.parse(files[".mcp.json"]!).mcpServers.rubrica).toEqual({ command: "npx", args: ["rubrica", "mcp"] });
    expect(JSON.parse(files["rubrica.json"]!).rubrica).toBe(2);
    expect(files[".gitignore"]).toContain(".env*");
  });
});

describe("create --local", () => {
  it("aponta para os pacotes reais do monorepo (tema escolhido e MCP)", async () => {
    const { localDependencySpecs } = await import("../src/commands/create");
    expect(localDependencySpecs(repo(), "cyberpunk")).toEqual({
      core: `link:${repo("packages/core")}`,
      theme: `link:${repo("packages/themes/cyberpunk")}`,
      cli: `link:${repo("packages/create-rubrica")}`,
      mcp: `link:${repo("packages/mcp")}`,
    });
    expect(() => localDependencySpecs(repo(), "zine")).toThrow(/não existe/);
  });
});
