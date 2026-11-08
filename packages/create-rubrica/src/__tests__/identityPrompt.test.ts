import { describe, it, expect, vi, beforeEach } from "vitest";
import { text, select, isCancel, cancel } from "@clack/prompts";
import { identityPrompt } from "../prompts/identityPrompt.js";

vi.mock("@clack/prompts", () => ({
  text: vi.fn(),
  select: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

type Field = "authorName" | "siteName" | "siteUrl" | "siteDescription" | "authorEmail" | "twitterHandle";

/** Cada pergunta é reconhecida pelo texto, não pela posição. */
const QUESTION: Record<Field, RegExp> = {
  authorName: /^Seu nome/,
  siteName: /^Nome do site/,
  siteUrl: /^Endereço do site/,
  siteDescription: /o que você faz/,
  authorEmail: /^Seu e-mail/,
  twitterHandle: /X\/Twitter/,
};

interface TextOpts {
  message: string;
  initialValue?: string;
  validate?: (v: string) => string | undefined;
}

function answer(overrides: Partial<Record<Field, string>> = {}, lang = "pt-BR") {
  const answers: Record<Field, string> = {
    authorName: "João Silva",
    siteName: "Portfólio do João",
    siteUrl: "https://meusite.com",
    siteDescription: "Desenvolvedor web.",
    authorEmail: "joao@meusite.com",
    twitterHandle: "joaosilva",
    ...overrides,
  };
  const asked: Array<{ field: Field } & TextOpts> = [];
  vi.mocked(text).mockImplementation((async (opts: TextOpts) => {
    const field = (Object.keys(QUESTION) as Field[]).find((f) => QUESTION[f].test(opts.message));
    if (!field) throw new Error(`pergunta inesperada: ${opts.message}`);
    asked.push({ field, ...opts });
    return answers[field];
  }) as never);
  vi.mocked(select).mockResolvedValue(lang);
  return {
    order: () => asked.map((a) => a.field),
    opts: (field: Field) => asked.find((a) => a.field === field)!,
  };
}

describe("identityPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCancel).mockReturnValue(false);
  });

  it("pergunta o nome da pessoa antes do nome do site", async () => {
    const prompts = answer();
    await identityPrompt();
    expect(prompts.order()).toEqual([
      "authorName",
      "siteName",
      "siteUrl",
      "siteDescription",
      "authorEmail",
      "twitterHandle",
    ]);
  });

  it("devolve o que a pessoa respondeu", async () => {
    answer();
    expect(await identityPrompt()).toEqual({
      authorName: "João Silva",
      siteName: "Portfólio do João",
      siteUrl: "https://meusite.com",
      siteDescription: "Desenvolvedor web.",
      authorEmail: "joao@meusite.com",
      twitterHandle: "joaosilva",
      lang: "pt-BR",
    });
  });

  it("completa a URL, limpa o e-mail e o @ do X, e tira espaços das pontas", async () => {
    answer({
      authorName: "  João Silva ",
      siteName: " Site ",
      siteUrl: "meusite.com/",
      siteDescription: " Dev. ",
      authorEmail: "  Joao@MeuSite.com ",
      twitterHandle: "https://x.com/joaosilva",
    });
    const result = await identityPrompt();
    expect(result).toMatchObject({
      authorName: "João Silva",
      siteName: "Site",
      siteUrl: "https://meusite.com",
      siteDescription: "Dev.",
      authorEmail: "joao@meusite.com",
      twitterHandle: "joaosilva",
    });
  });

  it("a URL aceita endereço sem https:// e recusa o que não é endereço", async () => {
    const prompts = answer();
    await identityPrompt();
    const validate = prompts.opts("siteUrl").validate!;
    expect(validate("meusite.com")).toBeUndefined();
    expect(validate("meusite")).toMatch(/meusite\.com/);
  });

  it("o e-mail é validado", async () => {
    const prompts = answer();
    await identityPrompt();
    const validate = prompts.opts("authorEmail").validate!;
    expect(validate("joao@meusite.com")).toBeUndefined();
    expect(validate("joao")).toMatch(/e-mail válido/);
  });

  it("o nome é obrigatório", async () => {
    const prompts = answer();
    await identityPrompt();
    const validate = prompts.opts("authorName").validate!;
    expect(validate("  ")).toMatch(/nome/i);
    expect(validate("Ana")).toBeUndefined();
  });

  it("sem default, o nome do site sugere o nome da pessoa", async () => {
    const prompts = answer({ authorName: "Ana Souza" });
    await identityPrompt();
    expect(prompts.opts("siteName").initialValue).toBe("Ana Souza");
  });

  it("nome do site apagado vira o nome da pessoa", async () => {
    answer({ authorName: "Ana Souza", siteName: "  " });
    expect((await identityPrompt()).siteName).toBe("Ana Souza");
  });

  it("os defaults viram o valor inicial de cada pergunta", async () => {
    const prompts = answer();
    await identityPrompt({
      authorName: "Def Nome",
      siteName: "Def Site",
      siteUrl: "https://def.com",
      siteDescription: "Def desc",
      authorEmail: "def@def.com",
      twitterHandle: "defhandle",
    });
    expect(prompts.opts("authorName").initialValue).toBe("Def Nome");
    expect(prompts.opts("siteName").initialValue).toBe("Def Site");
    expect(prompts.opts("siteUrl").initialValue).toBe("https://def.com");
    expect(prompts.opts("siteDescription").initialValue).toBe("Def desc");
    expect(prompts.opts("authorEmail").initialValue).toBe("def@def.com");
    expect(prompts.opts("twitterHandle").initialValue).toBe("defhandle");
  });

  it("sem defaults, as perguntas começam vazias", async () => {
    const prompts = answer();
    await identityPrompt();
    for (const f of ["authorName", "siteUrl", "siteDescription", "authorEmail", "twitterHandle"] as Field[]) {
      expect(prompts.opts(f).initialValue).toBe("");
    }
  });

  it("pergunta o idioma (pt-BR ou en-US), começando pelo default", async () => {
    answer({}, "en-US");
    const result = await identityPrompt({ lang: "en-US" });
    expect(result.lang).toBe("en-US");
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        initialValue: "en-US",
        options: [expect.objectContaining({ value: "pt-BR" }), expect.objectContaining({ value: "en-US" })],
      })
    );
  });

  it("sem default de idioma, o select começa em pt-BR", async () => {
    answer();
    await identityPrompt();
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ initialValue: "pt-BR" }));
  });

  it("com askLang: false não pergunta o idioma e usa o default (ou pt-BR)", async () => {
    answer();
    expect((await identityPrompt(undefined, { askLang: false })).lang).toBe("pt-BR");
    expect((await identityPrompt({ lang: "en-US" }, { askLang: false })).lang).toBe("en-US");
    expect(select).not.toHaveBeenCalled();
  });

  it("onlyMissing com tudo preenchido: nenhuma pergunta", async () => {
    const prompts = answer();
    const result = await identityPrompt(
      { authorName: "Ana", siteName: "Site", siteUrl: "https://a.dev", siteDescription: "d", authorEmail: "a@a.dev", twitterHandle: "a", lang: "en-US" },
      { askLang: false, onlyMissing: true }
    );
    expect(prompts.order()).toEqual([]);
    expect(result).toEqual({ authorName: "Ana", siteName: "Site", siteUrl: "https://a.dev", siteDescription: "d", authorEmail: "a@a.dev", twitterHandle: "a", lang: "en-US" });
  });

  it("onlyMissing pergunta só o obrigatório que faltou; opcionais ficam vazios e o nome do site vira o nome", async () => {
    const prompts = answer({ authorEmail: "ana@a.dev" });
    const result = await identityPrompt({ authorName: "Ana", siteUrl: "https://a.dev" }, { askLang: false, onlyMissing: true });
    expect(prompts.order()).toEqual(["authorEmail"]);
    expect(result).toMatchObject({ siteName: "Ana", siteDescription: "", twitterHandle: "", authorEmail: "ana@a.dev", lang: "pt-BR" });
  });

  it("onlyMissing pergunta nome e endereço quando faltam", async () => {
    const prompts = answer();
    await identityPrompt({ authorEmail: "a@a.dev" }, { askLang: false, onlyMissing: true });
    expect(prompts.order()).toEqual(["authorName", "siteUrl"]);
  });

  it("onlyMissing sem defaults pergunta só os obrigatórios", async () => {
    const prompts = answer();
    await identityPrompt(undefined, { askLang: false, onlyMissing: true });
    expect(prompts.order()).toEqual(["authorName", "siteUrl", "authorEmail"]);
  });

  it("onlyMissing trata valor inválido como faltando", async () => {
    const prompts = answer();
    await identityPrompt({ authorName: "Ana", siteUrl: "ana", authorEmail: "ana" }, { askLang: false, onlyMissing: true });
    expect(prompts.order()).toEqual(["siteUrl", "authorEmail"]);
  });

  it("onlyMissing normaliza o que veio pronto", async () => {
    answer();
    const result = await identityPrompt(
      { authorName: " Ana ", siteUrl: "a.dev/", authorEmail: " A@A.dev", twitterHandle: "@ana" },
      { askLang: false, onlyMissing: true }
    );
    expect(result).toMatchObject({ authorName: "Ana", siteUrl: "https://a.dev", authorEmail: "a@a.dev", twitterHandle: "ana" });
  });

  it("cancelar em qualquer pergunta chama cancel e lança erro", async () => {
    answer();
    vi.mocked(isCancel).mockReturnValueOnce(true);
    await expect(identityPrompt()).rejects.toThrow("cancelado");
    expect(cancel).toHaveBeenCalled();
  });

  it("cancelar no idioma também interrompe", async () => {
    answer();
    vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
    vi.mocked(select).mockResolvedValue("CANCEL");
    await expect(identityPrompt()).rejects.toThrow("cancelado");
  });
});
