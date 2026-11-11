// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Contato from "../src/islands/contato";
import { buildContactPayload, readFlows, stepErrors, summaryRows, totalSteps } from "../src/islands/contact-flows";
import { validateContact } from "../src/convex/lib/intake";
import { defaultUiText, uiKeysWithPrefix } from "../src/i18n/ui-texts";
import { ISLAND_META } from "../src/islands";

const texts = Object.fromEntries(uiKeysWithPrefix(ISLAND_META.contato!.textPrefixes).map((k) => [k, defaultUiText(k, "pt-BR")!]));

/** Assuntos no formato que a ilha recebe (campos já no idioma). */
const FLOWS = [
  {
    id: "project",
    emoji: "💼",
    label: "Tenho um projeto",
    steps: [
      { kind: "choice", key: "projectType", title: "Qual o tipo de projeto?", options: "Web App / SaaS\nMobile\nLanding Page" },
      { kind: "choice", key: "budget", title: "Qual o orçamento estimado?", options: "Até R$ 5.000\nAinda não sei" },
      { kind: "textarea", key: "description", title: "Descreva o projeto", placeholder: "Conte um pouco..." },
      { kind: "contact", title: "Seus dados de contato", askPhone: true, askLinkedin: true },
    ],
  },
  {
    id: "job",
    emoji: "🧑‍💼",
    label: "Oportunidade de emprego",
    steps: [
      { kind: "choice", key: "modality", title: "Qual a modalidade?", options: "Remoto\nHíbrido" },
      { kind: "text", key: "jobCompany, jobRole", title: "Empresa e cargo ofertado", placeholder: "Nome da empresa\nTítulo do cargo" },
    ],
  },
];

const contact = { name: "Ana", email: "ana@exemplo.com", phone: "", linkedin: "", company: "" };

describe("assuntos do assistente (contact-flows)", () => {
  it("normaliza: contato no fim quando falta, várias chaves no texto curto, escolha sem opções sai", () => {
    const flows = readFlows([...FLOWS, { id: "x", label: "", steps: [] }, { id: "y", label: "Só contato", steps: [{ kind: "choice", key: "a", options: "" }] }]);
    expect(flows.map((f) => f.label)).toEqual(["Tenho um projeto", "Oportunidade de emprego", "Só contato"]);
    expect(totalSteps(flows[0]!)).toBe(5);
    expect(flows[1]!.steps.map((s) => s.kind)).toEqual(["choice", "text", "contact"]);
    expect(flows[1]!.steps[1]!.keys).toEqual(["jobCompany", "jobRole"]);
    expect(flows[2]!.steps.map((s) => s.kind)).toEqual(["contact"]);
  });

  it("chaves inválidas ou reservadas viram outras, sem colidir com o assunto", () => {
    const [flow] = readFlows([{ id: "a", label: "A", steps: [{ kind: "text", key: "topic" }, { kind: "text", key: "com espaço" }, { kind: "text", key: "topic" }] }]);
    expect(flow!.steps.slice(0, 3).map((s) => s.keys[0])).toEqual(["topic_", "q2", "topic__"]);
  });

  it("valida a etapa: obrigatória, opcional e os dados de contato", () => {
    const [flow] = readFlows(FLOWS);
    expect(stepErrors(flow!.steps[0]!, {}, contact, false)).toEqual({ projectType: "required" });
    expect(stepErrors({ ...flow!.steps[0]!, optional: true }, {}, contact, false)).toEqual({});
    expect(stepErrors(flow!.steps[3]!, {}, { ...contact, email: "x" }, false)).toEqual({ email: "email", consent: "consent" });
  });

  it("texto longo vira a mensagem; escolhas, LinkedIn e empresa vão em details; o backend aceita", () => {
    const [flow] = readFlows(FLOWS);
    const answers = { projectType: "Mobile", budget: "Ainda não sei", description: "Um app de agenda." };
    const payload = buildContactPayload(flow!, answers, { ...contact, phone: "+55 11 99999-0000", linkedin: "linkedin.com/in/ana", company: "Acme" });
    expect(payload).toEqual({
      message: "Um app de agenda.",
      phone: "+55 11 99999-0000",
      details: { topic: "Tenho um projeto", projectType: "Mobile", budget: "Ainda não sei", linkedin: "linkedin.com/in/ana", empresa: "Acme" },
    });
    const body = { name: "Ana", email: "ana@exemplo.com", consent: true, locale: "pt-BR", blockId: "k1", page: "/", ...payload };
    expect(validateContact(body).ok).toBe(true);
  });

  it("sem texto longo, a mensagem é o resumo das respostas", () => {
    const [, job] = readFlows(FLOWS);
    const answers = { modality: "Remoto", jobCompany: "Acme", jobRole: "Dev" };
    expect(summaryRows(job!, answers)).toEqual([
      { label: "Qual a modalidade?", value: "Remoto" },
      { label: "Empresa e cargo ofertado", value: "Acme · Dev" },
    ]);
    const payload = buildContactPayload(job!, answers, contact);
    expect(payload.message).toBe("Qual a modalidade?: Remoto\nEmpresa e cargo ofertado: Acme · Dev");
    expect(validateContact({ name: "Ana", email: "ana@exemplo.com", consent: true, locale: "pt-BR", blockId: "k1", page: "/", ...payload }).ok).toBe(true);
  });
});

describe("ilha do contato com assuntos", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv("PUBLIC_RUBRICA_API", "https://api.test");
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const props = (fields: Record<string, unknown>) => ({ blockId: "k1", page: "/", locale: "pt-BR", fields, texts, privacyHref: "/privacidade" });

  it("escolher o assunto já avança; passo X de N; chega ao resumo e envia o pedido completo", async () => {
    render(<Contato {...props({ mode: "wizard", flows: FLOWS })} />);
    await waitFor(() => expect((screen.getByRole("button", { name: /Tenho um projeto/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: /Tenho um projeto/ }));
    expect(screen.getByText("Etapa 1 de 5")).toBeTruthy();
    expect(screen.getByText("Qual o tipo de projeto?")).toBeTruthy();

    // Sem escolher, não avança.
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("alert").textContent).toBe("Preencha este campo.");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(screen.getByRole("button", { name: "Mobile" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Ainda não sei" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Descreva o projeto" }), { target: { value: "Um app de agenda." } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Etapa 4 de 5")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: /Nome/ }), { target: { value: "Ana" } });
    fireEvent.change(screen.getByRole("textbox", { name: /E-mail/ }), { target: { value: "ana@exemplo.com" } });
    fireEvent.change(screen.getByRole("textbox", { name: /LinkedIn/ }), { target: { value: "linkedin.com/in/ana" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Revise e envie")).toBeTruthy();
    expect(screen.getByText("Um app de agenda.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("Mensagem enviada.");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.test/rubrica/contato");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      name: "Ana",
      email: "ana@exemplo.com",
      message: "Um app de agenda.",
      consent: true,
      details: { topic: "Tenho um projeto", projectType: "Mobile", budget: "Ainda não sei", linkedin: "linkedin.com/in/ana" },
    });
    expect(validateContact(body).ok).toBe(true);
  });

  it("voltar mantém as respostas; sem assuntos segue o assistente de 3 etapas", async () => {
    render(<Contato {...props({ mode: "wizard" })} />);
    expect(screen.getByText("Etapa 1 de 3")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("na janela de contato do núcleo: apoio no lugar do título da etapa, Fechar fecha a janela, recomeça depois do envio", async () => {
    document.body.innerHTML = "";
    const pop = document.createElement("div");
    pop.id = "rb-contato-janela";
    const hide = vi.fn(() => pop.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" })));
    Object.assign(pop, { hidePopover: hide });
    document.body.append(pop);
    const fields = { mode: "wizard", presentation: "dialog", title: "Como posso te ajudar?", intro: "Escolha o que melhor descreve o seu interesse", flows: FLOWS };
    render(<Contato {...props(fields)} dialog="rb-contato-janela" />, { container: pop });
    // Sem <dialog> próprio: a janela é a do núcleo.
    expect(document.querySelector("dialog")).toBeNull();
    expect(pop.querySelector("legend")!.textContent).toBe("Escolha o que melhor descreve o seu interesse");
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(hide).toHaveBeenCalledTimes(1);
    // Fechar sem enviar mantém o que foi escolhido.
    await waitFor(() => expect((screen.getByRole("button", { name: /Tenho um projeto/ }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: /Tenho um projeto/ }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("button", { name: /Tenho um projeto/ }).getAttribute("aria-pressed")).toBe("true");

    // Envio pelo assunto de emprego (sem texto longo) e fechar: a janela volta à primeira tela.
    fireEvent.click(screen.getByRole("button", { name: /Oportunidade de emprego/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remoto" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome da empresa" }), { target: { value: "Acme" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Título do cargo" }), { target: { value: "Dev" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Nome/ }), { target: { value: "Ana" } });
    fireEvent.change(screen.getByRole("textbox", { name: /E-mail/ }), { target: { value: "ana@exemplo.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("Mensagem enviada.");
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.message).toBe("Qual a modalidade?: Remoto\nEmpresa e cargo ofertado: Acme · Dev");
    expect(validateContact(body).ok).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(pop.querySelector("legend")?.textContent).toBe("Escolha o que melhor descreve o seu interesse"));
    expect(screen.getByRole("button", { name: /Oportunidade de emprego/ }).getAttribute("aria-pressed")).toBe("false");
  });
});
