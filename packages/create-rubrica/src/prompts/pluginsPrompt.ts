import { select, multiselect, isCancel, cancel } from "@clack/prompts";
import { PLUGINS, PLUGIN_PRESETS } from "../plugins.js";

function assertNotCancelled<T>(value: T | symbol): asserts value is T {
  if (isCancel(value)) {
    cancel("Operação cancelada.");
    throw new Error("Prompt cancelado pelo usuário.");
  }
}

/** Opções do multiselect: nome e descrição em vez do id técnico. */
export function pluginOptions(): Array<{ value: string; label: string }> {
  return PLUGINS.map((p) => ({ value: p.id, label: `${p.label} — ${p.description}` }));
}

/** Lista completa de plugins para marcar um por um. */
export async function pluginMultiselect(initialValues: string[]): Promise<string[]> {
  const chosen = await multiselect({
    message: "O que o site vai ter? (espaço marca/desmarca, Enter confirma)",
    initialValues,
    required: false,
    options: pluginOptions(),
  });
  assertNotCancelled(chosen);
  return chosen as string[];
}

/** Pacote pronto (padrão: o recomendado) ou a lista completa. */
export async function pluginsPrompt(): Promise<string[]> {
  const choice = await select({
    message: "O que o site vai ter?",
    initialValue: PLUGIN_PRESETS[0].id,
    options: [
      ...PLUGIN_PRESETS.map((p) => ({ value: p.id, label: p.label, hint: p.hint })),
      { value: "custom", label: "Escolher um por um" },
    ],
  });
  assertNotCancelled(choice);
  const preset = PLUGIN_PRESETS.find((p) => p.id === choice);
  if (preset) return preset.plugins;
  return pluginMultiselect(PLUGINS.filter((p) => p.recommended).map((p) => p.id));
}
