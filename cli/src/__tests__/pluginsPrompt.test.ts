import { describe, it, expect, vi, beforeEach } from "vitest";
import { select, multiselect, isCancel, cancel } from "@clack/prompts";
import { pluginsPrompt, pluginMultiselect } from "../prompts/pluginsPrompt.js";
import { PLUGINS, PLUGIN_PRESETS } from "../plugins.js";

vi.mock("@clack/prompts", () => ({
  select: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isCancel).mockReturnValue(false);
});

describe("pluginsPrompt", () => {
  it("oferece os pacotes prontos e a opção de escolher um por um, começando pelo recomendado", async () => {
    vi.mocked(select).mockResolvedValueOnce("recommended");
    await pluginsPrompt();
    const opts = vi.mocked(select).mock.calls[0][0] as { initialValue: string; options: Array<{ value: string; label: string; hint?: string }> };
    expect(opts.initialValue).toBe("recommended");
    expect(opts.options.map((o) => o.value)).toEqual([...PLUGIN_PRESETS.map((p) => p.id), "custom"]);
    expect(opts.options[0]).toMatchObject({ label: PLUGIN_PRESETS[0].label, hint: PLUGIN_PRESETS[0].hint });
  });

  it.each(PLUGIN_PRESETS.map((p) => [p.id, p.plugins] as const))(
    "pacote %s devolve os plugins dele sem abrir a lista",
    async (id, plugins) => {
      vi.mocked(select).mockResolvedValueOnce(id);
      expect(await pluginsPrompt()).toEqual(plugins);
      expect(multiselect).not.toHaveBeenCalled();
    }
  );

  it("'um por um' abre a lista com os recomendados já marcados", async () => {
    vi.mocked(select).mockResolvedValueOnce("custom");
    vi.mocked(multiselect).mockResolvedValueOnce(["blog"]);
    expect(await pluginsPrompt()).toEqual(["blog"]);
    expect(multiselect).toHaveBeenCalledWith(
      expect.objectContaining({ initialValues: PLUGINS.filter((p) => p.recommended).map((p) => p.id) })
    );
  });

  it("cancelar a escolha do pacote interrompe", async () => {
    vi.mocked(select).mockResolvedValueOnce("CANCEL");
    vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
    await expect(pluginsPrompt()).rejects.toThrow("cancelado");
    expect(cancel).toHaveBeenCalled();
  });
});

describe("pluginMultiselect", () => {
  it("lista todos os plugins com nome e descrição, marcando os iniciais", async () => {
    vi.mocked(multiselect).mockResolvedValueOnce(["about"]);
    expect(await pluginMultiselect(["about", "blog"])).toEqual(["about"]);
    const opts = vi.mocked(multiselect).mock.calls[0][0] as {
      initialValues: string[];
      required: boolean;
      options: Array<{ value: string; label: string }>;
    };
    expect(opts.initialValues).toEqual(["about", "blog"]);
    expect(opts.required).toBe(false);
    expect(opts.options.map((o) => o.value)).toEqual(PLUGINS.map((p) => p.id));
    expect(opts.options[0].label).toBe(`${PLUGINS[0].label} — ${PLUGINS[0].description}`);
  });

  it("cancelar a lista interrompe", async () => {
    vi.mocked(multiselect).mockResolvedValueOnce("CANCEL" as never);
    vi.mocked(isCancel).mockImplementation((v) => v === "CANCEL");
    await expect(pluginMultiselect([])).rejects.toThrow("cancelado");
  });
});
