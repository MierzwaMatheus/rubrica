// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { BackendContext, type Backend } from "../../src/admin/data/backend";
import { RouterProvider } from "../../src/admin/lib/router";
import { CollectionList } from "../../src/admin/collections/CollectionList";
import { COLLECTION_CONFIGS } from "../../src/admin/collections/config";

vi.mock("../../src/admin/lib/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() }, Toaster: () => null }));
vi.mock("../../src/admin/panel", () => ({
  usePanel: () => ({ me: { role: "admin" }, locales: { locales: ["pt-BR"], default: "pt-BR" }, enabled: new Set() }),
  localeName: (l: string) => l,
}));
vi.mock("../../src/admin/Layout", () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));
vi.mock("../../src/admin/App", () => ({ Loading: () => <p>Carregando…</p> }));

const t = (s: string) => ({ "pt-BR": s });
const DOCS = [
  { _id: "e1", kind: "experience", title: t("Dev sênior"), published: true },
  { _id: "s1", kind: "skill", title: t("React"), group: t("Front-end"), published: true },
  { _id: "e2", kind: "experience", title: t("Dev pleno"), published: true },
  { _id: "s2", kind: "skill", title: t("LLMs"), group: t("IA"), published: true },
  { _id: "s3", kind: "skill", title: t("CSS"), group: t("Front-end"), published: true },
  { _id: "l1", kind: "language", title: t("Inglês"), published: true },
  { _id: "e3", kind: "experience", title: t("Estágio"), published: true, deletedAt: 1 },
];

let reorder: ReturnType<typeof vi.fn>;

function renderList(path: string) {
  window.history.replaceState(null, "", path);
  reorder = vi.fn(async () => null);
  const backend = {
    mode: "demo",
    useQuery: () => DOCS,
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => (getFunctionName(ref).endsWith(":reorder") ? reorder : async () => null),
    useAction: () => async () => "",
    useQueryOnce: () => async () => null,
    useAuth: () => ({}),
    upload: async () => "",
  } as unknown as Backend;
  return render(
    <BackendContext.Provider value={backend}>
      <RouterProvider>
        <CollectionList config={COLLECTION_CONFIGS.resume} />
      </RouterProvider>
    </BackendContext.Provider>,
  );
}

const titles = () => screen.getAllByRole("listitem").map((li) => li.querySelector("a")?.textContent);

beforeEach(() => {
  window.scrollTo = () => undefined;
});
afterEach(cleanup);

describe("currículo em abas", () => {
  it("mostra uma aba por tipo, com a contagem, e lista só o tipo da aba", () => {
    renderList("/admin/curriculo");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Experiência2", "Formação0", "Competências3", "Comportamentais0", "Certificações0", "Idiomas1", "Voluntariado0"]);
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    expect(titles()).toEqual(["Dev sênior", "Dev pleno"]);
  });

  it("guarda a aba no endereço e abre nela ao recarregar", () => {
    renderList("/admin/curriculo");
    act(() => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: /Idiomas/ }), { button: 0 });
    });
    expect(window.location.search).toBe("?aba=language");
    expect(titles()).toEqual(["Inglês"]);
    cleanup();
    renderList("/admin/curriculo?aba=language");
    expect(screen.getByRole("tab", { name: /Idiomas/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("o item novo leva o tipo da aba", () => {
    renderList("/admin/curriculo?aba=skill");
    expect(screen.getByRole("link", { name: /Novo item/ }).getAttribute("href")).toBe("/admin/curriculo?novo=1&aba=skill");
  });

  it("agrupa as competências pelo grupo, com subtítulos", () => {
    renderList("/admin/curriculo?aba=skill");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["Front-end", "IA"]);
    expect(within(screen.getByRole("list", { name: "Front-end" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("ordena só dentro do tipo e mantém os outros itens no lugar", async () => {
    renderList("/admin/curriculo");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Subir Dev pleno" }));
    });
    expect(reorder).toHaveBeenCalledWith({ ids: ["e2", "s1", "e1", "s2", "s3", "l1"] });
  });

  it("dentro do grupo, a competência troca com a vizinha do mesmo grupo", async () => {
    renderList("/admin/curriculo?aba=skill");
    expect((screen.getByRole("button", { name: "Subir React" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Descer React" }));
    });
    expect(reorder).toHaveBeenCalledWith({ ids: ["e1", "s3", "e2", "s2", "s1", "l1"] });
  });
});
