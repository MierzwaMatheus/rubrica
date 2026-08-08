import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { generateCV } from "@/utils/cvPDF";

const baseContact: any = {
  name: "John Doe",
  role: "Senior Dev",
  email: "john@x.com",
  phone: "11999",
  linkedin_url: "https://www.linkedin.com/in/john",
  github_url: "https://github.com/john",
};

const skillItem = (name: string, order = 0): any => ({
  id: name,
  type: "skill",
  content: { name },
  order_index: order,
});

const expItem = (role: string, company: string, order = 0): any => ({
  id: role,
  type: "experience",
  content: { role, company, period: "2020-2024", description: "- Did X\n- Did Y" },
  order_index: order,
});

const eduItem = (degree: string, institution: string): any => ({
  id: degree,
  type: "education",
  content: { degree, institution, period: "2015-2019" },
  order_index: 0,
});

const langItem = (name: string, level: string): any => ({
  id: name,
  type: "language",
  content: { name, level },
  order_index: 0,
});

const projectFix = (title: string, tags: string[] = []): any => ({
  id: title,
  title,
  description: "Did things & more",
  tags,
});

let openSpy: any;
let createSpy: any;
let revokeSpy: any;
let lastBlobContents = "";

beforeEach(() => {
  openSpy = vi
    .spyOn(window, "open")
    .mockReturnValue({ onload: null, print: vi.fn() } as any);
  createSpy = vi.fn(() => "blob:url");
  revokeSpy = vi.fn();
  // Capture blob contents
  const originalBlob = global.Blob;
  global.Blob = vi.fn(function (this: any, parts: any[]) {
    lastBlobContents = parts.join("");
    return new originalBlob(parts, { type: "text/html" });
  }) as any;
  Object.defineProperty(window, "URL", {
    value: { createObjectURL: createSpy, revokeObjectURL: revokeSpy },
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cvPDF · generateCV (HTML output)", () => {
  it("opens a new window with blob URL", () => {
    generateCV(baseContact, [], [], "pt-BR", "");
    expect(openSpy).toHaveBeenCalledWith("blob:url", "_blank");
  });

  it("throws when popup is blocked", () => {
    openSpy.mockReturnValue(null);
    expect(() =>
      generateCV(baseContact, [], [], "pt-BR", ""),
    ).toThrow("Popup bloqueado");
  });

  it("uses pt-BR labels when locale is pt-BR", () => {
    generateCV(baseContact, [skillItem("X")], [], "pt-BR", "");
    expect(lastBlobContents).toContain("Habilidades Técnicas");
    expect(lastBlobContents).toContain('lang="pt-BR"');
  });

  it("uses en-US labels when locale is en-US", () => {
    generateCV(baseContact, [skillItem("X")], [], "en-US", "");
    expect(lastBlobContents).toContain("Technical Skills");
    expect(lastBlobContents).toContain('lang="en-US"');
  });

  it("HTML-escapes special characters in name and contacts", () => {
    generateCV(
      { ...baseContact, name: 'A & "B"' },
      [],
      [],
      "pt-BR",
      "",
    );
    expect(lastBlobContents).toContain("A &amp; &quot;B&quot;");
  });

  it("strips http(s):// and www. from linkedin and github URLs", () => {
    generateCV(baseContact, [], [], "pt-BR", "");
    expect(lastBlobContents).toContain("linkedin.com/in/john");
    expect(lastBlobContents).toContain("github.com/john");
    expect(lastBlobContents).not.toContain("https://www.linkedin.com");
  });

  it("renders skills as comma-separated list", () => {
    generateCV(
      baseContact,
      [skillItem("TS", 1), skillItem("React", 2)],
      [],
      "pt-BR",
      "",
    );
    expect(lastBlobContents).toContain("TS, React");
  });

  it("renders experience entries with role — company and period", () => {
    generateCV(baseContact, [expItem("Senior Dev", "Acme")], [], "pt-BR", "");
    expect(lastBlobContents).toContain("Senior Dev — Acme");
    expect(lastBlobContents).toContain("2020-2024");
  });

  it("renders bullet points from description starting with -", () => {
    generateCV(baseContact, [expItem("X", "Y")], [], "pt-BR", "");
    expect(lastBlobContents).toContain("<li>Did X</li>");
    expect(lastBlobContents).toContain("<li>Did Y</li>");
  });

  it("renders education entries with degree — institution", () => {
    generateCV(baseContact, [eduItem("BSc", "MIT")], [], "pt-BR", "");
    expect(lastBlobContents).toContain("BSc — MIT");
  });

  it("renders languages with name in bold + level", () => {
    generateCV(baseContact, [langItem("Português", "Nativo")], [], "pt-BR", "");
    expect(lastBlobContents).toContain("<strong>Português</strong>");
    expect(lastBlobContents).toContain("Nativo");
  });

  it("limits topProjects via topProjectsCount param", () => {
    generateCV(
      baseContact,
      [],
      [
        projectFix("P1"),
        projectFix("P2"),
        projectFix("P3"),
        projectFix("P4"),
      ],
      "pt-BR",
      "",
      2,
    );
    expect(lastBlobContents).toContain("P1");
    expect(lastBlobContents).toContain("P2");
    expect(lastBlobContents).not.toContain("P3");
  });

  it("includes summary section when provided", () => {
    generateCV(baseContact, [], [], "pt-BR", "Pro summary text here");
    expect(lastBlobContents).toContain("Pro summary text here");
    expect(lastBlobContents).toContain("Resumo Profissional");
  });

  it("omits summary section when empty", () => {
    generateCV(baseContact, [], [], "pt-BR", "");
    expect(lastBlobContents).not.toContain("Resumo Profissional");
  });

  it("escapes ampersand in description", () => {
    generateCV(
      baseContact,
      [],
      [projectFix("Foo & Bar")],
      "pt-BR",
      "",
    );
    expect(lastBlobContents).toContain("Foo &amp; Bar");
  });

  it("uses translatedContent when provided", () => {
    generateCV(
      baseContact,
      [
        {
          ...skillItem("Hardcoded"),
          translatedContent: { name: "Translated" },
        },
      ],
      [],
      "en-US",
      "",
    );
    expect(lastBlobContents).toContain("Translated");
    expect(lastBlobContents).not.toContain("Hardcoded");
  });

  it("contact line joins email | phone | linkedin | github", () => {
    generateCV(baseContact, [], [], "pt-BR", "");
    expect(lastBlobContents).toContain("john@x.com");
    expect(lastBlobContents).toContain("11999");
    expect(lastBlobContents).toMatch(/&nbsp;\|&nbsp;/);
  });

  it("header-name é vazio quando contactInfo.name é string vazia", () => {
    generateCV({ ...baseContact, name: "" }, [], [], "pt-BR", "");
    expect(lastBlobContents).toContain('<div class="header-name"></div>');
  });

  it("header-name exibe o nome quando contactInfo.name está preenchido", () => {
    generateCV({ ...baseContact, name: "Jane Doe" }, [], [], "pt-BR", "");
    expect(lastBlobContents).toContain("Jane Doe");
  });
});
