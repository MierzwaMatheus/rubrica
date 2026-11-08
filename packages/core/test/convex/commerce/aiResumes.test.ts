// @vitest-environment edge-runtime
/** Currículo por vaga com IA (OpenRouter simulado). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resumeModels } from "../../../src/convex/commerce/aiResumes";
import { as, seedSettings, setup, type T } from "../_setup";
import { api, internal } from "./_commerce";

type Client = Awaited<ReturnType<typeof as>>;

let t: T;
let root: Client;
let openrouter: ReturnType<typeof vi.fn>;

const ANSWERS = [
  { jobTitle: "Dev front-end", requiredSkills: ["React"] },
  { fitScore: 87.4, fitComment: "Boa aderência.", strengths: ["React"], weaknesses: ["Go"] },
  { summary: "Dev front-end.", resumeItems: [{ kind: "skill", title: "React" }], projects: [] },
];

beforeEach(async () => {
  t = setup();
  await seedSettings(t, {
    plugins: { "ai-resumes": true },
    person: { name: "Ana Souza", jobTitle: { "pt-BR": "Desenvolvedora", en: "Developer" }, email: "ana@exemplo.dev" },
  });
  root = await as(t, "root");
  process.env.OPENROUTER_API_KEY = "sk-or-teste";
  let call = 0;
  openrouter = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "```json\n" + JSON.stringify(ANSWERS[call++]) + "\n```" } }] }), { status: 200 }));
  vi.stubGlobal("fetch", openrouter);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENROUTER_API_KEY;
});

describe("currículos com IA", () => {
  it("lê a coleção resume (só publicados), chama as três etapas e guarda o resultado", async () => {
    const editor = await as(t, "content-editor");
    await editor.mutation(api.rubrica.resume.create, { kind: "experience", title: { "pt-BR": "Dev na Acme", en: "Dev at Acme" }, organization: "Acme" });
    const draft = await editor.mutation(api.rubrica.resume.create, { kind: "skill", title: { "pt-BR": "Rascunho" } });
    await editor.mutation(api.rubrica.resume.unpublish, { id: draft });

    const { id } = await root.action(api.rubrica.aiResumes.generate, { title: "Vaga Acme", locale: "en", jobDescription: "We need React." });
    expect(openrouter).toHaveBeenCalledTimes(3);
    const bodies = openrouter.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)));
    expect(bodies.map((b) => b.model)).toEqual([...resumeModels({})]);
    expect((openrouter.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer sk-or-teste");
    const cv = bodies[1].messages[1].content as string;
    expect(cv).toContain("Dev at Acme");
    expect(cv).not.toContain("Rascunho");
    expect(cv).toContain('"jobTitle": "Developer"');

    const saved = await root.query(api.rubrica.aiResumes.get, { id });
    expect(saved).toMatchObject({ title: "Vaga Acme", locale: "en", fitScore: 87, strengths: ["React"], weaknesses: ["Go"], cvData: { summary: "Dev front-end.", person: { name: "Ana Souza" } } });
    expect(await root.query(api.rubrica.aiResumes.list, {})).toHaveLength(1);
  });

  it("só root, com o plugin ligado e a chave configurada", async () => {
    const admin = await as(t, "admin");
    await expect(admin.action(api.rubrica.aiResumes.generate, { title: "x", locale: "pt-BR", jobDescription: "y" })).rejects.toThrow(/Sem permissão/);
    await expect(admin.query(api.rubrica.aiResumes.list, {})).rejects.toThrow(/Sem permissão/);
    delete process.env.OPENROUTER_API_KEY;
    await expect(root.action(api.rubrica.aiResumes.generate, { title: "x", locale: "pt-BR", jobDescription: "y" })).rejects.toThrow(/OPENROUTER_API_KEY/);
    await seedSettings(t, { plugins: {} });
    await expect(root.query(api.rubrica.aiResumes.list, {})).rejects.toThrow(/desligado/);
    // Tipo empresa: o plugin não existe.
    await seedSettings(t, { kind: "empresa", plugins: { "ai-resumes": true } });
    await expect(root.query(api.rubrica.aiResumes.list, {})).rejects.toThrow(/desligado/);
    expect(openrouter).not.toHaveBeenCalled();
  });

  it("resposta fora do formato ou erro do OpenRouter: falha sem gravar", async () => {
    openrouter.mockImplementationOnce(async () => new Response(JSON.stringify({ choices: [{ message: { content: "não é JSON" } }] })));
    await expect(root.action(api.rubrica.aiResumes.generate, { title: "x", locale: "pt-BR", jobDescription: "y" })).rejects.toThrow(/formato esperado/);
    openrouter.mockImplementationOnce(async () => new Response("limite", { status: 429 }));
    await expect(root.action(api.rubrica.aiResumes.generate, { title: "x", locale: "pt-BR", jobDescription: "y" })).rejects.toThrow(/HTTP 429/);
    expect(await root.query(api.rubrica.aiResumes.list, {})).toEqual([]);
  });

  it("lixeira: root apaga, restaura e apaga de vez", async () => {
    const id = await t.mutation(internal.rubrica.aiResumes.save, {
      title: "A",
      locale: "pt-BR",
      jobDescription: "j",
      fitScore: 1,
      fitComment: "",
      strengths: [],
      weaknesses: [],
      cvData: {},
      createdBy: root.userId,
    });
    await root.mutation(api.rubrica.aiResumes.remove, { id });
    expect(await root.query(api.rubrica.aiResumes.list, {})).toEqual([]);
    await root.mutation(api.rubrica.aiResumes.restore, { id });
    await root.mutation(api.rubrica.aiResumes.removePermanently, { id });
    expect(await root.query(api.rubrica.aiResumes.get, { id })).toBeNull();
  });

  it("OPENROUTER_RESUME_MODELS troca os modelos", () => {
    expect(resumeModels({ OPENROUTER_RESUME_MODELS: "a/x, b/y" })).toEqual(["a/x", "b/y", "anthropic/claude-sonnet-4-6"]);
  });
});
