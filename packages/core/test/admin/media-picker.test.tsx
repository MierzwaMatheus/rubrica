// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BackendContext, type Backend } from "../../src/admin/data/backend";
import { MediaPicker } from "../../src/admin/editor/MediaPicker";

vi.mock("../../src/admin/lib/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() }, Toaster: () => null }));
vi.mock("../../src/admin/lib/upload", () => ({ useUploadImage: () => upload }));

const upload = vi.fn(async () => ({ id: "m9", url: "https://x/nova.png", storageId: "s9" }));

afterEach(() => {
  cleanup();
  upload.mockClear();
});

const MEDIA = [
  { _id: "m1", name: "capa.png", folder: "/blog", storageId: "s1", url: "https://x/capa.png", createdAt: 1 },
  { _id: "m2", name: "toca.png", folder: "/portfolio/toca", storageId: "s2", url: "https://x/toca.png", createdAt: 2 },
  { _id: "m3", name: "solta.png", folder: "/", storageId: "s3", url: "https://x/solta.png", createdAt: 3 },
];

function fakeBackend(): Backend {
  return {
    mode: "demo",
    useQuery: (ref: unknown, args: { folder?: string }) => {
      const name = getFunctionName(ref as never);
      if (name === "rubrica/media:folders") return [{ path: "/", count: 1 }, { path: "/blog", count: 1 }, { path: "/portfolio/toca", count: 1 }];
      if (name === "rubrica/media:list") return MEDIA.filter((m) => !args.folder || m.folder === args.folder);
      return undefined;
    },
    useMutation: () => async () => null,
    useAction: () => async () => null,
    useQueryOnce: () => async () => null,
    useAuth: () => ({ isLoading: false, isAuthenticated: true, signIn: async () => {}, signOut: async () => {} }),
    upload: async () => "s",
  } as unknown as Backend;
}

function open(onPick = vi.fn()) {
  render(
    <BackendContext.Provider value={fakeBackend()}>
      <MediaPicker onPick={onPick} onClose={() => {}} />
    </BackendContext.Provider>,
  );
  return { onPick, nav: within(screen.getByRole("navigation", { name: "Pastas" })) };
}

/** Miniaturas na grade (o `alt` vazio as tira da árvore de acessibilidade). */
const images = () => document.querySelectorAll("ul img").length;

describe("modal de escolher imagem: pastas", () => {
  it("lista Todas, Sem pasta e cada pasta com a quantidade", () => {
    const { nav } = open();
    expect(nav.getByRole("button", { name: /Todas\s*3/ }).getAttribute("aria-current")).toBe("true");
    expect(nav.getByRole("button", { name: /Sem pasta\s*1/ })).toBeTruthy();
    expect(nav.getByRole("button", { name: /\/portfolio\/toca\s*1/ })).toBeTruthy();
    expect(images()).toBe(3);
  });

  it("filtra pela pasta escolhida e escolhe a imagem dela", () => {
    const { nav, onPick } = open();
    fireEvent.click(nav.getByRole("button", { name: /\/portfolio\/toca/ }));
    expect(nav.getByRole("button", { name: /\/portfolio\/toca/ }).getAttribute("aria-current")).toBe("true");
    expect(images()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "toca.png" }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ url: "https://x/toca.png", storageId: "s2" }));
  });

  it("pasta nova vazia avisa que não tem imagem", () => {
    const { nav } = open();
    fireEvent.change(nav.getByLabelText("Nova pasta"), { target: { value: "eventos" } });
    fireEvent.click(nav.getByRole("button", { name: "Criar pasta" }));
    expect(nav.getByRole("button", { name: /\/eventos\s*0/ }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByText("Nenhuma imagem nesta pasta.")).toBeTruthy();
  });

  it("envia a imagem para a pasta aberta", async () => {
    const { nav, onPick } = open();
    fireEvent.click(nav.getByRole("button", { name: /\/blog/ }));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "nova.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onPick).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledWith(file, "/blog");
  });
});
