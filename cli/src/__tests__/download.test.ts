import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { getLatestVersion, downloadRelease } from "../utils/download.js";

const GITHUB_API = "https://api.github.com";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** Cria um tarball mínimo válido com arquivos de template para usar nos testes */
function createMinimalTarball(): Buffer {
  const srcDir = mkdtempSync(join(tmpdir(), "rubrica-test-src-"));
  const tarPath = join(tmpdir(), "rubrica-test.tar.gz");
  try {
    mkdirSync(join(srcDir, "src"), { recursive: true });
    writeFileSync(join(srcDir, "package.json"), JSON.stringify({ name: "rubrica" }));
    writeFileSync(join(srcDir, "src", "index.css"), ":root {}");
    writeFileSync(join(srcDir, "index.html"), "<!DOCTYPE html><html></html>");
    execFileSync("tar", [
      "-czf", tarPath,
      "-C", dirname(srcDir),
      basename(srcDir),
    ]);
    return Buffer.from(execFileSync("cat", [tarPath]));
  } finally {
    rmSync(srcDir, { recursive: true, force: true });
    if (existsSync(tarPath)) rmSync(tarPath);
  }
}

describe("getLatestVersion", () => {
  it("retorna string semver a partir da GitHub API", async () => {
    server.use(
      http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/releases/latest`, () =>
        HttpResponse.json({ tag_name: "v1.2.3" })
      )
    );

    const version = await getLatestVersion();
    expect(version).toBe("v1.2.3");
  });

  it("lança erro amigável quando GitHub API retorna 404", async () => {
    server.use(
      http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/releases/latest`, () =>
        HttpResponse.json({ message: "Not Found" }, { status: 404 })
      )
    );

    await expect(getLatestVersion()).rejects.toThrow(/404/);
  });

  it("lança erro amigável quando há erro de rede", async () => {
    server.use(
      http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/releases/latest`, () =>
        HttpResponse.error()
      )
    );

    await expect(getLatestVersion()).rejects.toThrow(/conexão|rede|network/i);
  });
});

describe("downloadRelease", () => {
  it("lança erro amigável quando há erro de rede ao baixar", async () => {
    const targetDir = mkdtempSync(join(tmpdir(), "rubrica-target-"));
    try {
      server.use(
        http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/tarball/v1.2.3`, () =>
          HttpResponse.error()
        )
      );

      await expect(downloadRelease(targetDir, "v1.2.3")).rejects.toThrow(/rede|conexão/i);
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });

  it("lança erro descritivo quando a URL retorna resposta não-ok", async () => {
    const targetDir = mkdtempSync(join(tmpdir(), "rubrica-target-"));
    try {
      server.use(
        http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/tarball/v1.2.3`, () =>
          HttpResponse.json({ message: "Not Found" }, { status: 404 })
        )
      );

      await expect(downloadRelease(targetDir, "v1.2.3")).rejects.toThrow(/404/);
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });

  it("baixa e extrai tarball para o diretório alvo", async () => {
    const tarball = createMinimalTarball();
    const targetDir = mkdtempSync(join(tmpdir(), "rubrica-target-"));

    try {
      server.use(
        http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/tarball/v1.2.3`, () =>
          new HttpResponse(tarball, {
            headers: { "Content-Type": "application/gzip" },
          })
        )
      );

      await downloadRelease(targetDir, "v1.2.3");

      expect(existsSync(join(targetDir, "package.json"))).toBe(true);
      expect(existsSync(join(targetDir, "src", "index.css"))).toBe(true);
    } finally {
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
