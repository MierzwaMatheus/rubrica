/**
 * Plugins que o CLI oferece e os pacotes prontos do modo rápido. É a única lista de plugins
 * do CLI: create, config e os testes leem daqui. Os ids precisam existir em
 * convex/pluginRegistry.ts (um teste confere). Como adicionar um plugin: docs/cli/manutencao.md.
 */

export interface PluginOption {
  id: string;
  label: string;
  description: string;
  /** Entra no pacote recomendado. */
  recommended: boolean;
  /** Só funciona com a chave de um serviço externo (setup pede). Fica fora dos pacotes. */
  needsKey: boolean;
}

export const PLUGINS: PluginOption[] = [
  { id: "contact-wizard", label: "Contato", description: "formulário para pedirem orçamento", recommended: true, needsKey: false },
  { id: "proposals", label: "Propostas", description: "propostas comerciais com aceite online", recommended: true, needsKey: false },
  { id: "payments", label: "Pagamentos", description: "cobrança por PIX, boleto e cartão (conta no Asaas)", recommended: false, needsKey: true },
  { id: "blog", label: "Blog", description: "posts e artigos", recommended: true, needsKey: false },
  { id: "portfolio", label: "Portfólio", description: "galeria de projetos e cases", recommended: true, needsKey: false },
  { id: "resume", label: "Currículo", description: "currículo com download em PDF", recommended: true, needsKey: false },
  { id: "about", label: "Sobre", description: "página sobre você", recommended: true, needsKey: false },
  { id: "ai-resumes", label: "Currículo com IA", description: "gera versões do currículo por vaga (chave do OpenRouter)", recommended: false, needsKey: true },
  { id: "audit-log", label: "Histórico do painel", description: "registra quem mudou o quê no painel", recommended: true, needsKey: false },
  { id: "media-manager", label: "Biblioteca de imagens", description: "gerenciador de arquivos e imagens", recommended: false, needsKey: false },
  { id: "i18n", label: "Tradução com IA", description: "traduz o conteúdo do site (chave do OpenRouter)", recommended: false, needsKey: true },
  { id: "playground", label: "Playground", description: "área para testar prompts de IA (chave do OpenRouter)", recommended: false, needsKey: true },
  { id: "testimonials", label: "Depoimentos", description: "depoimentos de clientes no site", recommended: true, needsKey: false },
  { id: "testimonials-intake", label: "Coleta de depoimentos", description: "link para clientes enviarem depoimentos", recommended: true, needsKey: false },
];

export const ALL_PLUGINS: string[] = PLUGINS.map((p) => p.id);

/** Plugins do backend que o CLI não oferece de propósito (ligam pelo painel admin). */
export const UNLISTED_PLUGINS = ["contract-templates"];

export interface PluginPreset {
  id: string;
  label: string;
  hint: string;
  plugins: string[];
}

export const PLUGIN_PRESETS: PluginPreset[] = [
  {
    id: "recommended",
    label: "Completo",
    hint: "portfólio, currículo, blog, contato, propostas e depoimentos",
    plugins: PLUGINS.filter((p) => p.recommended).map((p) => p.id),
  },
  {
    id: "freelancer",
    label: "Para vender serviços",
    hint: "portfólio, contato, propostas e depoimentos",
    plugins: ["contact-wizard", "proposals", "portfolio", "about", "testimonials", "testimonials-intake"],
  },
  {
    id: "simple",
    label: "Só o portfólio",
    hint: "portfólio, currículo, sobre e contato",
    plugins: ["contact-wizard", "portfolio", "resume", "about"],
  },
];

/** `{ id: ligado? }` com todos os plugins do CLI, na ordem de PLUGINS. */
export function pluginsRecord(selected: string[]): Record<string, boolean> {
  return Object.fromEntries(ALL_PLUGINS.map((id) => [id, selected.includes(id)]));
}
