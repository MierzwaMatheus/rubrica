export type PluginId =
  | 'contact-wizard'
  | 'proposals'
  | 'payments'
  | 'blog'
  | 'portfolio'
  | 'resume'
  | 'about'
  | 'ai-resumes'
  | 'audit-log'
  | 'media-manager'
  | 'i18n'
  | 'playground'
  | 'testimonials'
  | 'testimonials-intake'
  | 'contract-templates';

export interface PluginDefinition {
  id: PluginId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  tables: string[];
  adminRoutes: string[];
  publicRoutes?: string[];
  minRole: 'root' | 'admin';
  parentId?: PluginId;
}

export const PLUGIN_REGISTRY: PluginDefinition[] = [
  {
    id: 'contact-wizard',
    label: 'Contact Wizard',
    description: 'Formulário de contato multi-etapas para visitantes',
    defaultEnabled: true,
    tables: ['contactRequests'],
    adminRoutes: ['/admin/contatos', '/admin/contact'],
    minRole: 'admin',
  },
  {
    id: 'proposals',
    label: 'Propostas',
    description: 'Gerenciamento de propostas comerciais com assinatura eletrônica',
    defaultEnabled: true,
    tables: ['proposals', 'proposalVersions', 'proposalSessions', 'proposalAcceptances'],
    adminRoutes: ['/admin/proposals'],
    publicRoutes: ['/proposta/:id', '/proposta/:slug/aceitar'],
    minRole: 'admin',
  },
  {
    id: 'payments',
    label: 'Pagamentos',
    description: 'Links de pagamento via Asaas e Stripe',
    defaultEnabled: true,
    tables: ['checkouts'],
    adminRoutes: ['/admin/payment-links'],
    publicRoutes: ['/checkout/:uniqueLink', '/payment-success/:uniqueLink'],
    minRole: 'admin',
  },
  {
    id: 'blog',
    label: 'Blog',
    description: 'Posts e artigos com publicação e busca',
    defaultEnabled: true,
    tables: ['posts'],
    adminRoutes: ['/admin/blog'],
    publicRoutes: ['/blog', '/blog/:slug'],
    minRole: 'admin',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Vitrine de projetos com case studies',
    defaultEnabled: true,
    tables: ['projects'],
    adminRoutes: ['/admin/projects'],
    publicRoutes: ['/portfolio', '/portfolio/:slug'],
    minRole: 'admin',
  },
  {
    id: 'resume',
    label: 'Currículo',
    description: 'Itens de currículo: habilidades, experiências, formação',
    defaultEnabled: true,
    tables: ['resumeItems'],
    adminRoutes: ['/admin/resume'],
    publicRoutes: ['/curriculo'],
    minRole: 'admin',
  },
  {
    id: 'about',
    label: 'Sobre',
    description: 'Rotina diária e FAQ da página sobre',
    defaultEnabled: true,
    tables: ['aboutDailyRoutine', 'aboutFaq'],
    adminRoutes: ['/admin/about'],
    publicRoutes: ['/sobre'],
    minRole: 'admin',
  },
  {
    id: 'ai-resumes',
    label: 'CV com IA',
    description: 'Geração de currículos personalizados com inteligência artificial',
    defaultEnabled: true,
    tables: ['aiGeneratedResumes'],
    adminRoutes: ['/admin/ai-resumes'],
    minRole: 'root',
  },
  {
    id: 'audit-log',
    label: 'Log de Auditoria',
    description: 'Registro de atividades administrativas',
    defaultEnabled: true,
    tables: ['auditLog'],
    adminRoutes: ['/admin/logs'],
    minRole: 'root',
  },
  {
    id: 'media-manager',
    label: 'Gerenciador de Mídia',
    description: 'Pastas e metadados de imagens',
    defaultEnabled: true,
    tables: ['imageFolders', 'imageMetadata'],
    adminRoutes: [],
    minRole: 'root',
  },
  {
    id: 'i18n',
    label: 'Tradução IA',
    description: 'Tradução automática de conteúdo com IA',
    defaultEnabled: true,
    tables: [],
    adminRoutes: [],
    minRole: 'root',
  },
  {
    id: 'playground',
    label: 'Playground',
    description: 'Área pública de demonstração das funcionalidades do admin',
    defaultEnabled: true,
    tables: ['playgroundAuditLog'],
    adminRoutes: [],
    publicRoutes: ['/playground'],
    minRole: 'root',
  },
  {
    id: 'testimonials',
    label: 'Depoimentos',
    description: 'Exibição pública de depoimentos e inserção manual pelo admin',
    defaultEnabled: true,
    tables: ['testimonials'],
    adminRoutes: ['/admin/depoimentos'],
    publicRoutes: ['/depoimentos'],
    minRole: 'admin',
  },
  {
    id: 'testimonials-intake',
    label: 'Envio Público de Depoimentos',
    description: 'Permite que visitantes enviem depoimentos via formulário (texto ou vídeo) para moderação',
    defaultEnabled: true,
    tables: ['testimonialSubmissions'],
    adminRoutes: [],
    publicRoutes: [],
    minRole: 'admin',
    parentId: 'testimonials',
  },
  {
    id: 'contract-templates',
    label: 'Templates de Contrato',
    description: 'Templates editáveis para geração de contratos PDF',
    defaultEnabled: false,
    tables: ['contractTemplates'],
    adminRoutes: ['/admin/contracts'],
    minRole: 'admin',
  },
];

export function getPlugin(id: PluginId): PluginDefinition {
  const plugin = PLUGIN_REGISTRY.find(p => p.id === id);
  if (!plugin) throw new Error(`Unknown plugin: ${id}`);
  return plugin;
}

export function pluginKey(id: PluginId): string {
  return `plugin:${id}:enabled`;
}
