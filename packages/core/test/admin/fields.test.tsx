// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { field, validateFields, type FieldError, type FieldMap } from "../../src/blocks/fields";
import { numeros } from "../../src/blocks/catalog";
import { EditorLocaleProvider, FieldsForm } from "../../src/admin/editor/fields";
import { BackendContext, type Backend } from "../../src/admin/data/backend";
import { missingTranslations, type Values } from "../../src/admin/editor/model";

const toastError = vi.fn();
vi.mock("../../src/admin/lib/toast", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() }, Toaster: () => null }));

afterEach(() => {
  cleanup();
  toastError.mockReset();
});

function fakeBackend(action: (args: unknown) => Promise<unknown> = async () => "") {
  return {
    mode: "demo",
    useQuery: () => undefined,
    useMutation: () => async () => null,
    useAction: () => action,
    useQueryOnce: () => async () => null,
    useAuth: () => ({ isLoading: false, isAuthenticated: true, signIn: async () => {}, signOut: async () => {} }),
    upload: async () => "s",
  } as unknown as Backend;
}

/** Formulário controlado, como no editor; `latest()` devolve o último valor. */
function setup(fields: FieldMap, initial: Values = {}, opts: { errors?: FieldError[]; locales?: string[]; translation?: boolean; backend?: Backend } = {}) {
  let latest = initial;
  const locales = opts.locales ?? ["pt-BR", "en"];
  function Harness({ children }: { children?: ReactNode }) {
    const [values, setValues] = useState(initial);
    const [locale, setLocale] = useState(locales[0]!);
    latest = values;
    return (
      <BackendContext.Provider value={opts.backend ?? fakeBackend()}>
        <EditorLocaleProvider value={{ locale, setLocale, locales, defaultLocale: locales[0]!, translation: !!opts.translation }}>
          <FieldsForm fields={fields} values={values} onChange={setValues} errors={opts.errors ?? []} missing={missingTranslations(fields, values, locales)} />
          {children}
        </EditorLocaleProvider>
      </BackendContext.Provider>
    );
  }
  render(<Harness />);
  return { latest: () => latest };
}

describe("formulário gerado do schema", () => {
  it("um controle por tipo de campo", () => {
    setup({
      t: field.text({ label: "Texto" }),
      m: field.text({ label: "Várias linhas", multiline: true, localized: false }),
      n: field.number({ label: "Número", min: 1, max: 9, integer: true }),
      b: field.boolean({ label: "Liga", default: true }),
      s: field.select({ label: "Escolha", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], default: "b" }),
      i: field.image({ label: "Imagem" }),
      l: field.link({ label: "Botão" }),
      li: field.list({ label: "Lista", itemLabel: "Coisa", of: { x: field.text({ label: "X" }) } }),
    });
    expect(screen.getByLabelText("Texto").tagName).toBe("INPUT");
    expect(screen.getByLabelText("Várias linhas").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Número")).toMatchObject({ type: "number", min: "1", max: "9", step: "1" });
    expect(screen.getByRole("switch", { name: "Liga" }).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByLabelText("Escolha") as HTMLSelectElement).value).toBe("b");
    expect(screen.getByRole("button", { name: /Escolher imagem/ })).toBeTruthy();
    expect(screen.getByLabelText("Texto do botão")).toBeTruthy();
    expect(screen.getByLabelText("Endereço")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Adicionar coisa/ })).toBeTruthy();
  });

  it("texto traduzível grava só o idioma em edição e marca o que falta", () => {
    const { latest } = setup({ title: field.text({ label: "Título" }) });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Olá" } });
    expect(latest()).toEqual({ title: { "pt-BR": "Olá" } });
    expect(screen.getByLabelText("falta traduzir")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^en/ }));
    const input = screen.getByLabelText("Título") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("Olá");
    expect(input.lang).toBe("en");
    fireEvent.change(input, { target: { value: "Hi" } });
    expect(latest()).toEqual({ title: { "pt-BR": "Olá", en: "Hi" } });
    expect(screen.queryByLabelText("falta traduzir")).toBeNull();
    // Apagar o texto de um idioma tira o idioma; apagar todos tira o campo.
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /^pt-BR/ }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "" } });
    expect(latest()).toEqual({});
  });

  it("site de um idioma só não mostra abas", () => {
    setup({ title: field.text({ label: "Título" }) }, {}, { locales: ["pt-BR"] });
    expect(screen.queryByRole("group", { name: /Idioma/ })).toBeNull();
  });

  it("número, booleano e seleção gravam o tipo certo", () => {
    const { latest } = setup({ n: field.number({ label: "N" }), b: field.boolean({ label: "B" }), s: field.select({ label: "S", options: [{ value: "x", label: "X" }] }) });
    fireEvent.change(screen.getByLabelText("N"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("switch", { name: "B" }));
    fireEvent.change(screen.getByLabelText("S"), { target: { value: "x" } });
    expect(latest()).toEqual({ n: 42, b: true, s: "x" });
    fireEvent.change(screen.getByLabelText("N"), { target: { value: "" } });
    expect(latest()).not.toHaveProperty("n");
  });

  it("link: rótulo por idioma e endereço", () => {
    const { latest } = setup({ cta: field.link({ label: "Botão" }) });
    fireEvent.change(screen.getByLabelText("Texto do botão"), { target: { value: "Ver" } });
    fireEvent.change(screen.getByLabelText("Endereço"), { target: { value: "/x" } });
    expect(latest()).toEqual({ cta: { label: { "pt-BR": "Ver" }, href: "/x" } });
    expect(validateFields({ cta: field.link({ label: "Botão" }) }, latest())).toEqual([]);
  });

  it("lista respeita mínimo e máximo e o valor passa na validação", () => {
    const fields = { items: numeros.fields.items };
    const { latest } = setup(fields, { items: [{}] });
    expect(screen.getByRole("button", { name: "Remover Número 1" })).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: "10+" } });
    fireEvent.change(screen.getByLabelText(/^Rótulo/), { target: { value: "anos" } });
    expect(validateFields(fields, latest())).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: /Adicionar número/ }));
    expect((latest().items as unknown[]).length).toBe(2);
    expect(validateFields(fields, latest()).map((e) => e.path)).toEqual(["items.1.value", "items.1.label"]);
  });

  it("mostra os erros do backend no campo, inclusive dentro de um item fechado", () => {
    const fields = { title: field.text({ label: "Título", maxLength: 3 }), items: numeros.fields.items };
    setup(fields, { title: { en: "long" }, items: [{ value: "1", label: { "pt-BR": "a" } }, { value: "2" }] }, {
      errors: [
        { path: "title.en", message: "Título: até 3 caracteres" },
        { path: "items.1.label", message: "Rótulo: obrigatório" },
      ],
    });
    expect(screen.getByText("Título: até 3 caracteres")).toBeTruthy();
    // O item com erro abre sozinho.
    expect(screen.getByText("Rótulo: obrigatório")).toBeTruthy();
    expect(screen.getByLabelText("Título").getAttribute("aria-invalid")).toBe("true");
  });

  it("botão traduzir: só com o plugin; backend sem a action vira aviso", async () => {
    setup({ t: field.text({ label: "T" }) }, { t: { "pt-BR": "Olá" } });
    fireEvent.click(screen.getByRole("button", { name: /^en/ }));
    expect(screen.queryByRole("button", { name: /Traduzir/ })).toBeNull();
    cleanup();

    const missing = fakeBackend(async () => {
      throw new Error("Could not find public function for 'rubrica/translation:translate'");
    });
    setup({ t: field.text({ label: "T" }) }, { t: { "pt-BR": "Olá" } }, { translation: true, backend: missing });
    fireEvent.click(screen.getByRole("button", { name: /^en/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Traduzir de pt-BR/ }));
    });
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/ainda não está disponível/));
    cleanup();

    const works = fakeBackend(async (args) => `EN:${(args as { text: string }).text}`);
    const { latest } = setup({ t: field.text({ label: "T" }) }, { t: { "pt-BR": "Olá" } }, { translation: true, backend: works });
    fireEvent.click(screen.getByRole("button", { name: /^en/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Traduzir de pt-BR/ }));
    });
    expect(latest()).toEqual({ t: { "pt-BR": "Olá", en: "EN:Olá" } });
  });
});
