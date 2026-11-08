import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { createRubrica, RUBRICA_MODULES } from "@rubrica/core/convex";
import { CORE_MODULES } from "../src/core-manifest";
import { convexFiles, convexOwnedFiles, isGeneratedConvexFile, reexportSource } from "../src/project/convex";
import { astroConfig, ejectedSection, MARK, projectFiles, replaceSection, defaultDependencySpecs } from "../src/project/files";
import { CONTENT_SECURITY_POLICY, contentSecurityPolicy, defaultHosting, headersFile, hostingFiles, patchHostingCsp, redirectsFile, swapCspOrigin, vercelJson } from "../src/project/hosting";
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
    expect(json.headers.map((h: { source: string }) => h.source)).toEqual(["/((?!admin).*)", "/admin(.*)", "/_astro/(.*)"]);
  });

  it("_headers e _redirects com a mesma configuração", () => {
    expect(redirectsFile(config)).toContain("/antigo /novo 301");
    const headers = headersFile(config);
    expect(headers).toContain("/*\n  Strict-Transport-Security");
    expect(headers).toContain(`Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`);
    expect(headers).toContain("/_astro/*\n  Cache-Control: public, max-age=31536000, immutable");
  });

  it("rotas do app (proposta, checkout) reescritas para a página estática delas, com status 200", () => {
    const json = JSON.parse(vercelJson(config));
    expect(json.rewrites).toContainEqual({ source: "/proposta/:slug", destination: "/_rubrica/app/proposta" });
    expect(json.rewrites).toContainEqual({ source: "/:locale/proposta/:slug/aceitar", destination: "/_rubrica/app/:locale/proposta-aceite" });
    expect(json.rewrites).toContainEqual({ source: "/checkout/:uniqueLink", destination: "/_rubrica/app/checkout" });
    expect(json.rewrites).toContainEqual({ source: "/payment-success/:uniqueLink", destination: "/_rubrica/app/pagamento-concluido" });
    const redirects = redirectsFile(config);
    expect(redirects).toContain("/proposta/:slug /_rubrica/app/proposta 200");
    expect(redirects).toContain("/:locale/checkout/:uniqueLink /_rubrica/app/:locale/checkout 200");
    // Redirecionamentos de verdade vêm antes (o Netlify usa a primeira regra que casa).
    expect(redirects.indexOf("/antigo /novo 301")).toBeLessThan(redirects.indexOf(" 200"));
    // Sem reescritas, o vercel.json não ganha a chave.
    expect(JSON.parse(vercelJson({ ...config, rewrites: [] })).rewrites).toBeUndefined();
  });

  it("a CSP deixa as ilhas do Astro e os formulários funcionarem", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'unsafe-inline'");
    expect(CONTENT_SECURITY_POLICY).toContain("https://*.convex.site");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(Object.keys(hostingFiles())).toEqual(["vercel.json", "public/_redirects", "public/_headers"]);
  });
});

describe("cabeçalhos do painel", () => {
  const adminHeaders = (rule: { headers: { key: string; value: string }[] }) => Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));

  it("na Vercel, o painel recebe 'self'/SAMEORIGIN e a regra do site não o alcança", () => {
    const json = JSON.parse(vercelJson(defaultHosting()));
    const rules = json.headers as { source: string; headers: { key: string; value: string }[] }[];
    expect(rules.map((r) => r.source)).toEqual(["/((?!admin).*)", "/admin(.*)", "/_astro/(.*)"]);
    const [site, admin] = rules.map(adminHeaders);
    expect(site["X-Frame-Options"]).toBe("DENY");
    expect(site["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(admin["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(admin["Content-Security-Policy"]).toContain("frame-ancestors 'self'");
    expect(admin["Strict-Transport-Security"]).toBeDefined();
    // a regex da regra do site não casa com o painel, mas casa com o resto
    const siteRe = new RegExp(`^${rules[0].source}$`);
    expect(siteRe.test("/admin")).toBe(false);
    expect(siteRe.test("/admin/preview")).toBe(false);
    expect(siteRe.test("/")).toBe(true);
    expect(siteRe.test("/blog/post")).toBe(true);
  });

  it("no _headers, a regra do painel solta os valores herdados da /* antes de definir os seus", () => {
    const headers = headersFile(defaultHosting());
    const admin = headers.slice(headers.indexOf("/admin*"), headers.indexOf("/_astro/*"));
    expect(admin).toContain("  ! X-Frame-Options\n");
    expect(admin).toContain("  ! Content-Security-Policy\n");
    expect(admin).toContain("  X-Frame-Options: SAMEORIGIN");
    expect(admin).toContain("frame-ancestors 'self'");
    const site = headers.slice(0, headers.indexOf("/admin*"));
    expect(site).toContain("X-Frame-Options: DENY");
    expect(site).not.toContain("!");
  });

  it("o analytics entra na CSP do site e na do painel", () => {
    const files = hostingFiles(defaultHosting({ analyticsOrigin: "https://cloud.umami.is" }));
    expect(files["public/_headers"].match(/script-src 'self' 'unsafe-inline' https:\/\/cloud.umami.is/g)).toHaveLength(2);
  });
});

describe("CSP do analytics", () => {
  const umami = "https://cloud.umami.is";
  it("libera a origem em script-src e connect-src, e só neles", () => {
    const csp = contentSecurityPolicy(umami);
    expect(csp).toContain(`script-src 'self' 'unsafe-inline' ${umami}`);
    expect(csp).toContain(`connect-src 'self' ${umami} https://*.convex.cloud`);
    expect(csp.split(umami).length - 1).toBe(2);
    expect(CONTENT_SECURITY_POLICY).not.toContain("umami");
  });

  it("troca a origem numa CSP existente sem mexer no resto e sem repetir", () => {
    const custom = `${CONTENT_SECURITY_POLICY}; script-src-elem 'self'`;
    const added = swapCspOrigin(custom, undefined, umami);
    expect(added).toBe(`${contentSecurityPolicy(umami)}; script-src-elem 'self'`);
    expect(swapCspOrigin(added, undefined, umami)).toBe(added);
    const swapped = swapCspOrigin(added, umami, "https://stats.ana.dev");
    expect(swapped).not.toContain(umami);
    expect(swapped).toContain("script-src 'self' 'unsafe-inline' https://stats.ana.dev");
    expect(swapCspOrigin(added, umami, undefined)).toBe(custom);
  });

  it("aplica nos arquivos do projeto e preserva o que a pessoa mudou", () => {
    const files = hostingFiles();
    const vercel = JSON.parse(files["vercel.json"]!);
    vercel.redirects.push({ source: "/x", destination: "/y", permanent: false });
    const changed = patchHostingCsp({ "vercel.json": JSON.stringify(vercel), "public/_headers": files["public/_headers"] }, undefined, umami);
    expect(Object.keys(changed).sort()).toEqual(["public/_headers", "vercel.json"]);
    const next = JSON.parse(changed["vercel.json"]!);
    expect(next.redirects).toContainEqual({ source: "/x", destination: "/y", permanent: false });
    expect(JSON.stringify(next)).toContain(`connect-src 'self' ${umami}`);
    expect(changed["public/_headers"]).toContain(`Content-Security-Policy: ${contentSecurityPolicy(umami)}`);
    expect(patchHostingCsp({ "vercel.json": undefined }, undefined, umami)).toEqual({});
  });

  it("o create já gera a CSP com o analytics do rubrica.json", () => {
    const files = projectFiles({ name: "x", state: sampleState({ analytics: { script: `${umami}/script.js`, id: "abc" } }), deps: defaultDependencySpecs() });
    expect(files["public/_headers"]).toContain(contentSecurityPolicy(umami));
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
    expect(() => localDependencySpecs(repo(), "inexistente")).toThrow(/não existe/);
  });
});

describe("CSP do painel", () => {
  it("libera o Google Fonts só no painel (prévia da Aparência) e o iframe da mesma origem", async () => {
    const { contentSecurityPolicy } = await import("../src/project/hosting");
    const site = contentSecurityPolicy();
    const admin = contentSecurityPolicy(undefined, "admin");
    expect(site).not.toContain("fonts.googleapis.com");
    expect(site).toContain("frame-ancestors 'none'");
    expect(admin).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(admin).toContain("font-src 'self' data: https://fonts.gstatic.com");
    expect(admin).toContain("frame-ancestors 'self'");
  });
});
