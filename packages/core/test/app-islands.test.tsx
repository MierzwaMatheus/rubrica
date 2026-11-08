// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Proposta from "../src/islands/app/proposta";
import PropostaAceite from "../src/islands/app/proposta-aceite";
import Checkout from "../src/islands/app/checkout";
import PagamentoConcluido from "../src/islands/app/pagamento-concluido";
import { appBackend, FN, HTTP, type AppApi, type HttpResult } from "../src/islands/app/client";
import { contractVariables, fillContract, type OpenProposal } from "../src/islands/app/contract";
import { markdownToHtml } from "../src/islands/app/markdown";
import type { AppIslandProps } from "../src/islands/app/ui";
import { APP_TEXT_PREFIXES } from "../src/islands/app";
import { defaultUiText, uiKeysWithPrefix } from "../src/i18n/ui-texts";
import { DEFAULT_CONTRACT_TEMPLATE } from "../src/convex/commerce/lib/defaultContract";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const contractsInPage = () => [...document.querySelectorAll(".rb-flow__contract")].map((e) => e.innerHTML).join("\n");

function setPath(path: string) {
  (window as unknown as { happyDOM: { setURL(u: string): void } }).happyDOM.setURL(`https://site.test${path}`);
}

const texts = (kind: "pessoal" | "empresa" = "pessoal") => Object.fromEntries(uiKeysWithPrefix(APP_TEXT_PREFIXES).map((k) => [k, defaultUiText(k, "pt-BR", kind)!]));

/** Backend falso: queries por função (a partir dos argumentos), rotas HTTP e ações. */
function fakeApi(spec: { queries?: Record<string, (args: Record<string, unknown>) => unknown>; post?: (path: string, body: Record<string, unknown>) => HttpResult; action?: (fn: string, args: Record<string, unknown>) => Promise<unknown>; mutation?: (fn: string, args: Record<string, unknown>) => Promise<unknown> }) {
  const calls = { watch: [] as [string, Record<string, unknown>][], post: [] as [string, Record<string, unknown>][], action: [] as [string, Record<string, unknown>][] };
  const api: AppApi = {
    watch(fn, args, onValue) {
      calls.watch.push([fn, args]);
      const q = spec.queries?.[fn];
      queueMicrotask(() => onValue(q ? q(args) : null));
      return () => {};
    },
    mutation: (fn, args) => spec.mutation?.(fn, args) ?? Promise.resolve(null),
    action: (fn, args) => {
      calls.action.push([fn, args]);
      return spec.action?.(fn, args) ?? Promise.resolve(null);
    },
    async post(path, body) {
      calls.post.push([path, body]);
      return spec.post?.(path, body) ?? { status: 500, body: {} };
    },
    upload: async () => "storage-1",
  };
  return { api, calls };
}

const props = (pattern: string, api: AppApi | undefined, extra: Partial<AppIslandProps> = {}): AppIslandProps => ({
  locale: "pt-BR",
  defaultLocale: "pt-BR",
  pattern,
  routes: { proposta: "/proposta/:slug", "proposta-aceite": "/proposta/:slug/aceitar", checkout: "/checkout/:uniqueLink", "pagamento-concluido": "/payment-success/:uniqueLink" },
  homeHref: "/",
  texts: texts(),
  backend: { kind: "convex", url: "https://x.convex.cloud", siteUrl: "https://x.convex.site" },
  api,
  ...extra,
});

const DAY = 86_400_000;
const status = { slug: "acme", requiresPassword: true, hasValidSession: true, isExpired: false, isAccepted: false, expiresAt: Date.now() + 5 * DAY };
const open: OpenProposal = {
  ...status,
  locked: false,
  clientName: "ACME Ltda",
  title: { "pt-BR": "Site novo da ACME" },
  objective: { "pt-BR": "Vender mais pelo site." },
  scope: [{ "pt-BR": "Design" }, { "pt-BR": "Hospedagem" }],
  scopePrices: [3000, 500],
  originalValue: 3500,
  giftIndexes: [1],
  timeline: [{ step: { "pt-BR": "Descoberta" }, period: { "pt-BR": "1 semana" } }],
  deliveryDate: "6 semanas após o aceite",
  investmentValue: 3000,
  paymentMethods: [{ "pt-BR": "PIX" }],
  conditions: [{ "pt-BR": "50% no início" }],
  rescissionPolicy: { "pt-BR": "## Rescisão\n\nAviso de **30 dias**." },
  version: 2,
  createdAt: Date.now() - DAY,
  contract: "**CONTRATANTE:** {{client_name}}{{client_document_line}}.\n\n### Escopo\n\n{{scope}}",
  contractor: { name: { "pt-BR": "Estúdio" }, person: null, organization: { legalName: "Estúdio Ltda", taxId: "12345678000190", address: { locality: "Curitiba", region: "PR" } } },
};

describe("página da proposta", () => {
  it("travada: pede a senha; senha errada avisa; certa abre o conteúdo com o token", async () => {
    setPath("/proposta/acme");
    const { api, calls } = fakeApi({
      queries: { [FN.proposal]: (args) => (args.token === "tok" ? open : { ...status, hasValidSession: false, locked: true }) },
      post: (_path, body) => (body.password === "certa123" ? { status: 200, body: { token: "tok", expiresAt: 1 } } : { status: 401, body: { error: "INVALID_PASSWORD" } }),
    });
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByRole("heading", { name: "Proposta protegida" })).toBeTruthy();
    // O conteúdo não está na página antes da senha.
    expect(document.body.textContent).not.toContain("Vender mais");

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "errada" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir proposta" }));
    expect(await screen.findByText("Senha incorreta.")).toBeTruthy();
    expect(calls.post[0]).toEqual([HTTP.session, { slug: "acme", password: "errada" }]);

    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "certa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir proposta" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Site novo da ACME" })).toBeTruthy();
    expect(calls.watch.at(-1)).toEqual([FN.proposal, { slug: "acme", token: "tok" }]);
    expect(sessionStorage.getItem("rubrica:proposta:acme")).toBe("tok");
    expect(document.body.textContent).toContain("Vender mais pelo site.");
    expect(document.body.textContent).toContain("Versão 2");
    expect(document.body.textContent).toContain("Brinde");
    expect(document.body.textContent).toContain("Desconto de R$");
    // Contrato com as variáveis preenchidas (sem dados de quem aceita ainda).
    expect(contractsInPage()).toContain("<strong>CONTRATANTE:</strong> ACME Ltda.");
    expect(screen.getByRole("link", { name: "Aceitar a proposta" }).getAttribute("href")).toBe("/proposta/acme/aceitar");
  });

  it("token guardado vencido: descarta e pede a senha de novo, com aviso", async () => {
    setPath("/proposta/acme");
    sessionStorage.setItem("rubrica:proposta:acme", "velho");
    const { api } = fakeApi({ queries: { [FN.proposal]: () => ({ ...status, hasValidSession: false, locked: true }) } });
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByText("Seu acesso expirou. Informe a senha de novo.")).toBeTruthy();
    expect(sessionStorage.getItem("rubrica:proposta:acme")).toBeNull();
  });

  it("aceita: mostra o registro, o PDF e nenhum botão de aceite", async () => {
    setPath("/proposta/acme");
    sessionStorage.setItem("rubrica:proposta:acme", "tok");
    const acceptedAt = Date.UTC(2026, 10, 3, 15);
    const { api } = fakeApi({
      queries: {
        [FN.proposal]: () => ({ ...open, isAccepted: true, acceptedAt }),
        [FN.acceptance]: () => ({ clientName: "Maria Silva", clientDocument: "12345678901", clientEmail: "m@acme.test", acceptedAt, proposalVersion: 2, contentHash: "abc123", signatureUrl: null }),
      },
    });
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByText("Proposta aceita eletronicamente.")).toBeTruthy();
    expect(await screen.findByText(/por Maria Silva\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Baixar o contrato (PDF)" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Aceitar a proposta" })).toBeNull();
    expect(contractsInPage()).toContain("inscrito(a) no CPF sob nº 123.456.789-01");
  });

  it("expirada: avisa e não deixa aceitar", async () => {
    setPath("/proposta/acme");
    const { api } = fakeApi({ queries: { [FN.proposal]: () => ({ ...open, requiresPassword: false, isExpired: true, expiresAt: Date.now() - DAY }) } });
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByText(/Esta proposta expirou em/)).toBeTruthy();
    expect(screen.getByText("Fale comigo para receber uma versão atualizada.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Aceitar a proposta" })).toBeNull();
  });

  it("linha empresa fala como a empresa", async () => {
    setPath("/proposta/acme");
    const { api } = fakeApi({ queries: { [FN.proposal]: () => ({ ...open, isExpired: true }) } });
    render(<Proposta {...props("/proposta/:slug", api, { texts: texts("empresa") })} />);
    expect(await screen.findByText("Fale conosco para receber uma versão atualizada.")).toBeTruthy();
  });

  it("não existe: aviso de link não encontrado", async () => {
    setPath("/proposta/nada");
    const { api } = fakeApi({});
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByRole("heading", { name: "Link não encontrado" })).toBeTruthy();
  });

  it("página aberta pelo endereço interno (sem slug): não encontrado, sem chamar o backend", async () => {
    setPath("/_rubrica/app/proposta");
    const { api, calls } = fakeApi({});
    render(<Proposta {...props("/proposta/:slug", api)} />);
    expect(await screen.findByRole("heading", { name: "Link não encontrado" })).toBeTruthy();
    expect(calls.watch).toHaveLength(0);
  });

  it("site de demonstração (fixtures): explica em vez de tentar o backend", async () => {
    setPath("/proposta/acme");
    render(<Proposta {...props("/proposta/:slug", undefined, { backend: { kind: "demo" } })} />);
    expect(await screen.findByText(/Demonstração: propostas e pagamentos/)).toBeTruthy();
  });
});

describe("aceite da proposta", () => {
  it("valida, envia o aceite pela rota HTTP e mostra o código do registro", async () => {
    setPath("/proposta/acme/aceitar");
    sessionStorage.setItem("rubrica:proposta:acme", "tok");
    const { api, calls } = fakeApi({
      queries: { [FN.proposal]: () => open },
      post: () => ({ status: 200, body: { id: "a1", contentHash: "f".repeat(64), ipAddress: "1.2.3.4" } }),
    });
    render(<PropostaAceite {...props("/proposta/:slug/aceitar", api)} />);
    expect(await screen.findByRole("heading", { level: 1, name: "Aceite da proposta" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Aceitar a proposta" }));
    expect(await screen.findByText("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).")).toBeTruthy();
    expect(screen.getByText("Para aceitar, confirme que leu e concorda com os termos.")).toBeTruthy();
    expect(calls.post).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: "Maria Silva" } });
    fireEvent.change(screen.getByLabelText(/CPF ou CNPJ/), { target: { value: "12345678901" } });
    fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: "m@acme.test" } });
    fireEvent.click(screen.getByRole("checkbox"));
    // O contrato já aparece com os dados de quem aceita.
    expect(contractsInPage()).toContain("Maria Silva, inscrito(a) no CPF sob nº 123.456.789-01");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Aceitar a proposta" }));
    });
    expect(await screen.findByRole("heading", { name: "Proposta aceita." })).toBeTruthy();
    expect(screen.getByText("f".repeat(64))).toBeTruthy();
    expect(calls.post[0]).toEqual([HTTP.accept, { slug: "acme", token: "tok", clientName: "Maria Silva", clientDocument: "12345678901", clientEmail: "m@acme.test", locale: "pt-BR" }]);
  });

  it("sem a sessão da senha: manda abrir a proposta primeiro", async () => {
    setPath("/proposta/acme/aceitar");
    const { api } = fakeApi({ queries: { [FN.proposal]: () => ({ ...status, hasValidSession: false, locked: true }) } });
    render(<PropostaAceite {...props("/proposta/:slug/aceitar", api)} />);
    expect(await screen.findByText("Abra a proposta com a senha antes de aceitar.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar para a proposta" }).getAttribute("href")).toBe("/proposta/acme");
  });

  it("já aceita: não mostra o formulário", async () => {
    setPath("/proposta/acme/aceitar");
    const { api } = fakeApi({ queries: { [FN.proposal]: () => ({ ...open, requiresPassword: false, isAccepted: true }) } });
    render(<PropostaAceite {...props("/proposta/:slug/aceitar", api)} />);
    expect(await screen.findByRole("heading", { name: "Esta proposta já foi aceita." })).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

const checkout = {
  kind: "checkout" as const,
  _id: "c1",
  uniqueLink: "link1",
  customerName: "João",
  customerEmail: "j@x.test",
  value: 300,
  description: "Projeto X",
  dueDate: "2026-12-01",
  status: "pending" as const,
  expiresAt: Date.now() + 10 * DAY,
};

describe("checkout", () => {
  it("sem chave do Asaas: a cobrança falha com NOT_CONFIGURED e a página explica", async () => {
    setPath("/checkout/link1");
    const { api, calls } = fakeApi({
      queries: { [FN.checkout]: () => checkout },
      action: async () => {
        throw Object.assign(new Error("x"), { data: { code: "NOT_CONFIGURED", message: "Asaas não configurado" } });
      },
    });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    expect(await screen.findByRole("heading", { level: 1, name: "Projeto X" })).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/PIX/));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gerar pagamento" }));
    });
    expect(await screen.findByText(/Os pagamentos ainda não estão configurados neste site. Fale comigo/)).toBeTruthy();
    expect(calls.action[0]).toEqual([FN.initiatePayment, { id: "c1", billingType: "PIX" }]);
  });

  it("PIX gerado: QR Code e copia e cola", async () => {
    setPath("/checkout/link1");
    const { api } = fakeApi({
      queries: { [FN.checkout]: () => checkout },
      action: async () => ({ status: "payment_selected", billingType: "PIX", pixPayload: "000201PIX", pixImage: "iVBOR", pixExpiresAt: Date.now() + DAY, totalValue: 300 }),
    });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    fireEvent.click(await screen.findByLabelText(/PIX/));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gerar pagamento" }));
    });
    expect(await screen.findByText("000201PIX")).toBeTruthy();
    expect(screen.getByRole("img", { name: "QR Code do PIX" }).getAttribute("src")).toBe("data:image/png;base64,iVBOR");
  });

  it("cartão: pede as parcelas antes de gerar", async () => {
    setPath("/checkout/link1");
    const { api, calls } = fakeApi({ queries: { [FN.checkout]: () => checkout }, action: async () => ({ billingType: "CREDIT_CARD" }) });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    fireEvent.click(await screen.findByLabelText(/Cartão de crédito/));
    expect((screen.getByRole("button", { name: "Gerar pagamento" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/^3x de/));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Gerar pagamento" }));
    });
    expect(calls.action[0]).toEqual([FN.initiatePayment, { id: "c1", billingType: "CREDIT_CARD", installmentCount: 3 }]);
  });

  it("só mostra a forma de pagamento definida no link", async () => {
    setPath("/checkout/link1");
    const { api } = fakeApi({ queries: { [FN.checkout]: () => ({ ...checkout, billingType: "BOLETO" }) } });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    expect(await screen.findByLabelText(/Boleto/)).toBeTruthy();
    expect(screen.queryByLabelText(/PIX/)).toBeNull();
  });

  it("expirado", async () => {
    setPath("/checkout/link1");
    const { api } = fakeApi({ queries: { [FN.checkout]: () => ({ ...checkout, expiresAt: Date.now() - 1 }) } });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    expect(await screen.findByRole("heading", { name: "Link expirado" })).toBeTruthy();
  });

  it("link de plano: pede os dados e cria o checkout do visitante", async () => {
    setPath("/checkout/plano1");
    const assign = vi.spyOn(window.location, "assign").mockImplementation(() => {});
    const { api, calls } = fakeApi({
      queries: { [FN.checkout]: () => ({ kind: "plan", uniqueLink: "plano1", value: 99, plan: { name: { "pt-BR": "Plano Básico" }, features: [{ "pt-BR": "Suporte" }] } }) },
      post: () => ({ status: 200, body: { uniqueLink: "novo" } }),
    });
    render(<Checkout {...props("/checkout/:uniqueLink", api)} />);
    expect(await screen.findByRole("heading", { level: 1, name: "Plano Básico" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: "ana@x.test" } });
    fireEvent.change(screen.getByLabelText(/CPF ou CNPJ/), { target: { value: "123.456.789-01" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Continuar para o pagamento" }));
    });
    expect(calls.post[0]).toEqual([HTTP.checkoutStart, { uniqueLink: "plano1", customerName: "Ana", customerEmail: "ana@x.test", customerCpfCnpj: "12345678901" }]);
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/checkout/novo"));
    assign.mockRestore();
  });
});

describe("pagamento concluído", () => {
  it("pago: confirma com o valor e a forma", async () => {
    setPath("/payment-success/link1");
    const { api } = fakeApi({ queries: { [FN.checkout]: () => ({ ...checkout, status: "paid", paymentMethod: "credit_card", totalValue: 310.5, installmentCount: 3, installmentValue: 103.5 }) } });
    render(<PagamentoConcluido {...props("/payment-success/:uniqueLink", api)} />);
    expect(await screen.findByRole("heading", { name: "Pagamento confirmado. Obrigado!" })).toBeTruthy();
    expect(screen.getByText("Cartão de crédito")).toBeTruthy();
    expect(document.body.textContent).toContain("3x de R$");
  });

  it("ainda sem confirmação do webhook: aguarda e volta ao checkout", async () => {
    setPath("/payment-success/link1");
    const { api } = fakeApi({ queries: { [FN.checkout]: () => ({ ...checkout, status: "payment_selected" }) } });
    render(<PagamentoConcluido {...props("/payment-success/:uniqueLink", api)} />);
    expect(await screen.findByRole("heading", { name: "Confirmando o pagamento" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar ao pagamento" }).getAttribute("href")).toBe("/checkout/link1");
  });
});

describe("contrato e Markdown", () => {
  it("Markdown vira HTML escapado, com os títulos encaixados na hierarquia", () => {
    const html = markdownToHtml("# Título\n\nTexto <script>x</script> com **negrito** e *ênfase*.\n\n- um\n- dois\n\n---\n\n1. a\n2. b", 3);
    expect(html).toContain("<h3>Título</h3>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<strong>negrito</strong>");
    expect(html).toContain("<em>ênfase</em>");
    expect(html).toContain("<ul><li>um</li><li>dois</li></ul>");
    expect(html).toContain("<hr>");
    expect(html).toContain("<ol><li>a</li><li>b</li></ol>");
  });

  it("o modelo padrão fica sem variáveis por preencher", () => {
    const vars = contractVariables(open, { clientName: "Maria", clientDocument: "12345678901", clientEmail: "m@x.test", acceptedAt: Date.UTC(2026, 0, 2, 15) }, "pt-BR", "pt-BR");
    const filled = fillContract(DEFAULT_CONTRACT_TEMPLATE, vars);
    expect(filled).not.toMatch(/\{\{/);
    expect(filled).toContain("**CONTRATADA:** Estúdio Ltda, inscrito no CNPJ sob nº 12.345.678/0001-90");
    expect(filled).toContain("Hospedagem (brinde, sem custo; valor original R$ 500,00)");
    expect(filled).toContain("foro da comarca de Curitiba – PR");
    expect(filled).toContain("**Aceite registrado em:** 02/01/2026");
    expect(fillContract("{{desconhecida}}", vars)).toBe("{{desconhecida}}");
  });

  it("endereço das rotas HTTP: o PUBLIC_RUBRICA_API ou o .convex.site do Convex", () => {
    expect(appBackend({ kind: "convex", url: "https://a.convex.cloud/" })).toEqual({ kind: "convex", url: "https://a.convex.cloud", siteUrl: "https://a.convex.site" });
    expect(appBackend({ kind: "convex", url: "https://a.convex.cloud" }, "https://api.site.test/")).toMatchObject({ siteUrl: "https://api.site.test" });
    expect(appBackend({ kind: "demo" })).toEqual({ kind: "demo" });
  });
});
