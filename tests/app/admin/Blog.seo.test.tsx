import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { mutations, postsRef } = vi.hoisted(() => ({
  mutations: {} as Record<string, ReturnType<typeof vi.fn>>,
  postsRef: { current: [] as unknown[] },
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn((name: string) => (name === "posts:listAdmin" ? postsRef.current : undefined)),
  useMutation: vi.fn((name: string) => {
    mutations[name] ??= vi.fn(async () => "new-id");
    return mutations[name];
  }),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    posts: {
      listAdmin: "posts:listAdmin",
      create: "posts:create",
      update: "posts:update",
      publish: "posts:publish",
      unpublish: "posts:unpublish",
      remove: "posts:remove",
      permanentDelete: "posts:permanentDelete",
      restore: "posts:restore",
    },
    images: { getById: "images:getById" },
  },
}));

vi.mock("@/pages/admin/Dashboard", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/admin/ImagePicker", () => ({
  ImagePicker: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button type="button" onClick={() => onSelect("img-1")}>Escolher imagem</button>
  ),
}));
vi.mock("@/components/admin/RichTextEditor", () => ({
  RichTextEditor: () => <div data-testid="editor" />,
}));
vi.mock("@/hooks/useIsRoot", () => ({ useIsRoot: () => false }));
vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: () => ({ site_url: "https://exemplo.com", site_title: "Site" }),
}));
vi.mock("@/i18n/hooks/useTranslateContent", () => ({
  useTranslateContent: () => ({
    isTranslating: false,
    translateFields: async (fields: Record<string, string>) =>
      Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, `EN ${v}`])),
  }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() } }));

import AdminBlog from "@/pages/admin/Blog";
import { toast } from "sonner";

const published = {
  _id: "p1",
  title: "Título antigo",
  titleTranslations: { ptBR: "Título antigo", enUS: "Old title" },
  slug: "titulo-antigo",
  content: "<p>x</p>",
  tags: [],
  featured: false,
  status: "published",
  createdAt: 1,
  ogImageUrl: "https://i.com/og.png",
};

function openNew() {
  render(<AdminBlog />);
  fireEvent.click(screen.getByRole("button", { name: /Novo Artigo/ }));
}

function openEdit() {
  postsRef.current = [published];
  const { container } = render(<AdminBlog />);
  const pencil = container.querySelector("svg.lucide-pencil")?.closest("button");
  fireEvent.click(pencil!);
}

const save = () => fireEvent.click(screen.getByRole("button", { name: /Salvar Artigo/ }));

describe("Admin Blog — SEO e slug", () => {
  beforeEach(() => {
    for (const key of Object.keys(mutations)) delete mutations[key];
    postsRef.current = [];
    vi.mocked(toast.error).mockClear();
  });

  it("post novo: o slug acompanha o título até ser editado à mão", () => {
    openNew();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Olá Mundo SEO" } });
    expect(screen.getByLabelText("Endereço (slug)")).toHaveValue("ola-mundo-seo");

    fireEvent.change(screen.getByLabelText("Endereço (slug)"), { target: { value: "meu-slug" } });
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Outro título" } });
    expect(screen.getByLabelText("Endereço (slug)")).toHaveValue("meu-slug");
  });

  it("post novo: salva slug, SEO traduzido e campos vazios como texto vazio", async () => {
    openNew();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Meu post" } });
    fireEvent.change(screen.getByLabelText("Título para o Google"), { target: { value: "Título Google" } });
    save();
    await waitFor(() => expect(mutations["posts:create"]).toHaveBeenCalled());
    const args = mutations["posts:create"].mock.calls[0][0];
    expect(args.slug).toBe("meu-post");
    expect(args.seoTitle).toBe("Título Google");
    expect(args.seoTitleTranslations).toEqual({ ptBR: "Título Google", enUS: "EN Título Google" });
    expect(args.seoDescription).toBe("");
    expect(args).not.toHaveProperty("clearOgImage");
  });

  it("editar o título de um post publicado não muda o slug", async () => {
    openEdit();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Título novo" } });
    expect(screen.getByLabelText("Endereço (slug)")).toHaveValue("titulo-antigo");
    save();
    await waitFor(() => expect(mutations["posts:update"]).toHaveBeenCalled());
    expect(mutations["posts:update"].mock.calls[0][0].slug).toBe("titulo-antigo");
  });

  it("avisa quando o slug de um post publicado muda", () => {
    openEdit();
    expect(screen.queryByText(/quebra links compartilhados/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Endereço (slug)"), { target: { value: "novo-endereco" } });
    expect(screen.getByText(/quebra links compartilhados/)).toBeInTheDocument();
  });

  it("slug inválido não salva", async () => {
    openNew();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Post" } });
    fireEvent.change(screen.getByLabelText("Endereço (slug)"), { target: { value: "Com Espaço" } });
    save();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mutations["posts:create"]).not.toHaveBeenCalled();
  });

  it("'Usar a capa' remove a imagem de compartilhamento ao salvar", async () => {
    openEdit();
    fireEvent.click(screen.getByRole("button", { name: /Usar a capa/ }));
    save();
    await waitFor(() => expect(mutations["posts:update"]).toHaveBeenCalled());
    const args = mutations["posts:update"].mock.calls[0][0];
    expect(args.clearOgImage).toBe(true);
    expect(args.ogImageId).toBeUndefined();
  });

  it("a prévia do Google usa o título e o slug atuais", () => {
    openNew();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Post de teste" } });
    const preview = screen.getByTestId("google-preview");
    expect(preview).toHaveTextContent("exemplo.com › blog › post-de-teste");
    expect(preview).toHaveTextContent("Post de teste | Site");
  });
});
