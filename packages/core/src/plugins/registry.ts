/**
 * Plugins do núcleo. Vindos da v1 (menos o `playground`, decisão 32), mais os da
 * linha empresa. O `i18n` da v1 ("Tradução IA") virou `translation`: os idiomas são
 * do núcleo; o plugin só preenche traduções (decisão 32). O `migrar` faz essa troca.
 */
import { definePlugin, type PluginDefinition } from "./contract";

const both = ["pessoal", "empresa"] as const;
const ADMIN = ["root", "admin"];
const CONTENT = ["root", "admin", "content-editor"];
const SALES = ["root", "admin", "comercial"];

export const CORE_PLUGINS: PluginDefinition[] = [
  definePlugin({
    id: "contact-wizard",
    label: "Assistente de contato",
    description: "Formulário de contato em etapas, com os pedidos no painel e os avisos configurados.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    admin: [{ path: "/admin/contatos", label: "Contatos", icon: "inbox", roles: [...SALES] }],
  }),
  definePlugin({
    id: "proposals",
    label: "Propostas",
    description: "Propostas comerciais com versão, senha e aceite eletrônico.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    routes: [
      { path: "/proposta/:id", kind: "app" },
      { path: "/proposta/:slug/aceitar", kind: "app" },
    ],
    admin: [{ path: "/admin/propostas", label: "Propostas", icon: "file-signature", roles: [...SALES, "proposal-editor"] }],
    mcpTools: ["proposals_list", "proposals_get", "proposals_create", "proposals_update"],
  }),
  definePlugin({
    id: "contract-templates",
    label: "Modelos de contrato",
    description: "Modelos de contrato usados nas propostas.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    requires: ["proposals"],
    admin: [{ path: "/admin/contratos", label: "Contratos", icon: "scroll", roles: [...SALES] }],
  }),
  definePlugin({
    id: "payments",
    label: "Pagamentos",
    description: "Checkout com PIX, boleto e cartão pelo Asaas.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    routes: [
      { path: "/checkout/:uniqueLink", kind: "app" },
      { path: "/payment-success/:uniqueLink", kind: "app" },
    ],
    admin: [{ path: "/admin/pagamentos", label: "Pagamentos", icon: "credit-card", roles: [...SALES] }],
  }),
  definePlugin({
    id: "blog",
    label: "Blog",
    description: "Posts com SEO, tradução e RSS.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    collections: ["posts"],
    admin: [{ path: "/admin/blog", label: "Blog", icon: "newspaper", roles: [...CONTENT, "blog-editor"] }],
    mcpTools: ["posts_list", "posts_get", "posts_create", "posts_update", "posts_publish"],
  }),
  definePlugin({
    id: "portfolio",
    label: "Projetos e cases",
    description: "Projetos com página de case.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    collections: ["projects"],
    admin: [{ path: "/admin/projetos", label: "Projetos", icon: "briefcase", roles: [...CONTENT] }],
    mcpTools: ["projects_list", "projects_get", "projects_create", "projects_update", "projects_publish"],
  }),
  definePlugin({
    id: "resume",
    label: "Currículo",
    description: "Experiência, formação e competências, com PDF.",
    kinds: ["pessoal"],
    defaultEnabled: { pessoal: true },
    collections: ["resume"],
    admin: [{ path: "/admin/curriculo", label: "Currículo", icon: "graduation-cap", roles: [...CONTENT] }],
  }),
  definePlugin({
    id: "about",
    label: "Dia a dia",
    description: "Galeria do dia a dia na página sobre.",
    kinds: ["pessoal"],
    defaultEnabled: { pessoal: true },
    collections: ["routine"],
    admin: [{ path: "/admin/dia-a-dia", label: "Dia a dia", icon: "calendar-days", roles: [...CONTENT] }],
  }),
  definePlugin({
    id: "testimonials",
    label: "Depoimentos",
    description: "Depoimentos no site, cadastrados no painel.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    collections: ["testimonials"],
    admin: [{ path: "/admin/depoimentos", label: "Depoimentos", icon: "quote", roles: [...CONTENT] }],
  }),
  definePlugin({
    id: "testimonials-intake",
    label: "Envio de depoimentos",
    description: "Visitantes enviam depoimentos, que entram como pendentes para aprovação.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: false },
    requires: ["testimonials"],
  }),
  definePlugin({
    id: "pricing",
    label: "Preços e planos",
    description: "Planos com preço, itens e botão (checkout, contato ou link).",
    kinds: ["empresa"],
    defaultEnabled: { empresa: true },
    collections: ["plans"],
    admin: [{ path: "/admin/planos", label: "Planos", icon: "tags", roles: [...CONTENT, "comercial"] }],
    mcpTools: ["plans_list", "plans_get", "plans_create", "plans_update", "plans_publish"],
  }),
  definePlugin({
    id: "team",
    label: "Equipe",
    description: "Pessoas da empresa, com foto, cargo e redes.",
    kinds: ["empresa"],
    defaultEnabled: { empresa: true },
    collections: ["team"],
    admin: [{ path: "/admin/equipe", label: "Equipe", icon: "users", roles: [...CONTENT] }],
    mcpTools: ["team_list", "team_get", "team_create", "team_update", "team_publish"],
  }),
  definePlugin({
    id: "ai-resumes",
    label: "Currículo por vaga com IA",
    description: "Gera currículos ajustados a uma vaga (OpenRouter).",
    kinds: ["pessoal"],
    defaultEnabled: { pessoal: false },
    requires: ["resume"],
    admin: [{ path: "/admin/curriculos-ia", label: "Currículos com IA", icon: "sparkles", roles: ["root"] }],
  }),
  definePlugin({
    id: "translation",
    label: "Tradução com IA",
    description: "Botão \"traduzir\" nos campos traduzíveis (OpenRouter). Sem ele, as traduções são escritas à mão ou pelo agente.",
    kinds: [...both],
    defaultEnabled: { pessoal: false, empresa: false },
  }),
  definePlugin({
    id: "analytics",
    label: "Analytics (Umami)",
    description: "Script do Umami nas páginas do site, com o endereço e o id das configurações. Sem cookies.",
    kinds: [...both],
    defaultEnabled: { pessoal: false, empresa: false },
  }),
  definePlugin({
    id: "audit-log",
    label: "Registro de atividades",
    description: "Histórico das ações no painel.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    admin: [{ path: "/admin/logs", label: "Atividades", icon: "history", roles: ["root"] }],
  }),
  definePlugin({
    id: "media-manager",
    label: "Biblioteca de mídia",
    description: "Pastas e metadados das imagens.",
    kinds: [...both],
    defaultEnabled: { pessoal: true, empresa: true },
    admin: [{ path: "/admin/midia", label: "Mídia", icon: "image", roles: [...ADMIN, "content-editor", "blog-editor"] }],
  }),
];

/** Ids da v1 que mudaram (usado pelo `migrar`). `null` = removido. */
export const V1_PLUGIN_RENAMES: Record<string, string | null> = {
  i18n: "translation",
  playground: null,
};
