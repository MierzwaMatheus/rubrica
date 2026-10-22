import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const root = resolve(__dirname, "../../..");

describe("brutalist template — contrato de fonte CSS", () => {
  const pages = ["Home", "About", "Resume", "Blog", "Portfolio"];

  pages.forEach((page) => {
    it(`${page}.tsx não usa --brut-mono`, () => {
      const src = readFileSync(
        resolve(root, `templates/layouts/brutalist/pages/${page}.tsx`),
        "utf8"
      );
      expect(src).not.toContain("--brut-mono");
    });
  });
});

describe("brutalist Layout — footer sem link hardcoded", () => {
  it("Layout.tsx não contém link do repositório rubrica", () => {
    const src = readFileSync(
      resolve(root, "templates/layouts/brutalist/Layout.tsx"),
      "utf8"
    );
    expect(src).not.toContain("github.com/rubrica-app/rubrica");
  });
});

describe("PublicRoute — sem duplo Layout", () => {
  it("PublicRoute.tsx não envolve children em <Layout>", () => {
    const src = readFileSync(
      resolve(root, "src/components/PublicRoute.tsx"),
      "utf8"
    );
    expect(src).not.toContain("<Layout>");
  });
});

describe("brutalist Home — banner dinâmico", () => {
  it("Home.tsx não contém MATHEUS hardcoded", () => {
    const src = readFileSync(
      resolve(root, "templates/layouts/brutalist/pages/Home.tsx"),
      "utf8"
    );
    expect(src).not.toContain("MATHEUS");
  });

  it("Home.tsx usa contactName do hook", () => {
    const src = readFileSync(
      resolve(root, "templates/layouts/brutalist/pages/Home.tsx"),
      "utf8"
    );
    expect(src).toContain("contactName");
  });
});
