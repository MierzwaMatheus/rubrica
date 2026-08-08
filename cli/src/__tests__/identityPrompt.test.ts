import { describe, it, expect, vi, beforeEach } from "vitest";
import { text, select, isCancel, cancel } from "@clack/prompts";

vi.mock("@clack/prompts", () => ({
  text: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

function setupAllMocks(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    siteName: "Meu Portfolio",
    siteUrl: "https://meusite.com",
    siteDescription: "Descrição do site.",
    authorName: "João Silva",
    authorEmail: "joao@meusite.com",
    twitterHandle: "joaosilva",
    lang: "pt-BR",
    ...overrides,
  };

  vi.mocked(isCancel).mockReturnValue(false);

  const textOrder = [
    "siteName",
    "siteUrl",
    "siteDescription",
    "authorName",
    "authorEmail",
    "twitterHandle",
  ];
  let textCallIndex = 0;
  vi.mocked(text).mockImplementation(async () => {
    const key = textOrder[textCallIndex++];
    return defaults[key] as string;
  });

  vi.mocked(select).mockResolvedValue(defaults["lang"] as string);
}

describe("identityPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // Ciclo 1 — siteName
  it("retorna siteName informado pelo usuário", async () => {
    setupAllMocks({ siteName: "Portfolio do João" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.siteName).toBe("Portfolio do João");
  });

  // Ciclo 2 — siteUrl com validação
  it("retorna siteUrl válida fornecida pelo usuário", async () => {
    setupAllMocks({ siteUrl: "https://exemplo.com" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.siteUrl).toBe("https://exemplo.com");
  });

  it("valida siteUrl: rejeita url sem protocolo http/https", async () => {
    vi.mocked(isCancel).mockReturnValue(false);
    let capturedValidate: ((v: string) => string | undefined) | undefined;
    const textOrder = [
      "siteName",
      "siteUrl",
      "siteDescription",
      "authorName",
      "authorEmail",
      "twitterHandle",
    ];
    let idx = 0;
    vi.mocked(text).mockImplementation(async (opts: any) => {
      const key = textOrder[idx++];
      if (key === "siteUrl") capturedValidate = opts.validate;
      return key === "siteName"
        ? "Meu Site"
        : key === "siteUrl"
          ? "https://ok.com"
          : key === "siteDescription"
            ? "desc"
            : key === "authorName"
              ? "João"
              : key === "authorEmail"
                ? "j@j.com"
                : "";
    });
    vi.mocked(select).mockResolvedValue("pt-BR");

    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await identityPrompt();

    expect(capturedValidate).toBeDefined();
    expect(capturedValidate!("semprotocolo.com")).toMatch(/http/);
    expect(capturedValidate!("ftp://errado.com")).toMatch(/http/);
    expect(capturedValidate!("http://valido.com")).toBeUndefined();
    expect(capturedValidate!("https://valido.com")).toBeUndefined();
  });

  // Ciclo 3 — siteDescription e authorName (texto livre)
  it("retorna siteDescription informado pelo usuário", async () => {
    setupAllMocks({ siteDescription: "Portfólio de desenvolvimento web." });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.siteDescription).toBe("Portfólio de desenvolvimento web.");
  });

  it("retorna authorName informado pelo usuário", async () => {
    setupAllMocks({ authorName: "Maria Souza" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.authorName).toBe("Maria Souza");
  });

  // Ciclo 4 — authorEmail com validação
  it("retorna authorEmail válido fornecido pelo usuário", async () => {
    setupAllMocks({ authorEmail: "maria@souza.com" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.authorEmail).toBe("maria@souza.com");
  });

  it("valida authorEmail: rejeita email sem @ ou sem ponto", async () => {
    vi.mocked(isCancel).mockReturnValue(false);
    let capturedValidate: ((v: string) => string | undefined) | undefined;
    const textOrder = [
      "siteName",
      "siteUrl",
      "siteDescription",
      "authorName",
      "authorEmail",
      "twitterHandle",
    ];
    let idx = 0;
    vi.mocked(text).mockImplementation(async (opts: any) => {
      const key = textOrder[idx++];
      if (key === "authorEmail") capturedValidate = opts.validate;
      return key === "siteName"
        ? "Site"
        : key === "siteUrl"
          ? "https://ok.com"
          : key === "siteDescription"
            ? "desc"
            : key === "authorName"
              ? "Nome"
              : key === "authorEmail"
                ? "a@b.com"
                : "";
    });
    vi.mocked(select).mockResolvedValue("pt-BR");

    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await identityPrompt();

    expect(capturedValidate).toBeDefined();
    expect(capturedValidate!("semArroba")).toMatch(/@/);
    expect(capturedValidate!("a@semponto")).toMatch(/\./);
    expect(capturedValidate!("a@b.com")).toBeUndefined();
  });

  // Ciclo 5 — twitterHandle opcional
  it("retorna string vazia quando twitterHandle não é fornecido", async () => {
    setupAllMocks({ twitterHandle: "" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.twitterHandle).toBe("");
  });

  it("retorna twitterHandle fornecido pelo usuário", async () => {
    setupAllMocks({ twitterHandle: "devjoao" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.twitterHandle).toBe("devjoao");
  });

  // Ciclo 6 — lang como select
  it("retorna lang selecionado pelo usuário", async () => {
    setupAllMocks({ lang: "en-US" });
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    const result = await identityPrompt();
    expect(result.lang).toBe("en-US");
  });

  it("oferece opções pt-BR e en-US para lang", async () => {
    setupAllMocks();
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await identityPrompt();
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "pt-BR" }),
          expect.objectContaining({ value: "en-US" }),
        ]),
      })
    );
  });

  // Ciclo 7 — Suporte a defaults
  it("usa defaults como initialValue nos prompts de texto", async () => {
    setupAllMocks();
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await identityPrompt({ siteName: "Site Default" });
    expect(text).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: "Site Default" })
    );
  });

  it("usa default de lang no select", async () => {
    setupAllMocks();
    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await identityPrompt({ lang: "en-US" });
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: "en-US" })
    );
  });

  // Ciclo 8 — Cancelamento
  it("chama cancel e lança erro quando usuário cancela no primeiro campo", async () => {
    vi.mocked(text).mockResolvedValueOnce(Symbol("cancel") as any);
    vi.mocked(isCancel).mockReturnValueOnce(true);

    const { identityPrompt } = await import("../prompts/identityPrompt.js");
    await expect(identityPrompt()).rejects.toThrow("cancelado");
    expect(cancel).toHaveBeenCalled();
  });
});
