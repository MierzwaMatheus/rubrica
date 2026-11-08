/**
 * Papéis do painel (RFC v2, "Papéis de agência e cliente" e decisão 18).
 *
 * Arquivo puro (sem Convex): o painel e o MCP importam daqui para esconder telas e
 * ferramentas; o backend usa os mesmos grupos em `requireRole`.
 */

export const ROLES = ["root", "admin", "content-editor", "blog-editor", "proposal-editor", "comercial"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  root: "Agência (root)",
  admin: "Administrador",
  "content-editor": "Editor de conteúdo",
  "blog-editor": "Editor do blog",
  "proposal-editor": "Editor de propostas",
  comercial: "Comercial",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Quem pode o quê. `root` é a agência (tudo, inclusive usuários e registros);
 * `admin` é o dono da empresa (todo o conteúdo e o comercial, sem gerenciar a
 * agência); `comercial` junta propostas, contratos, checkouts e contatos; o
 * `proposal-editor` continua só com propostas.
 */
export const PERMISSIONS = {
  /** Usuários e papéis. */
  users: ["root"],
  /** Registro de atividades. */
  audit: ["root"],
  /** Apagar de vez e restaurar o que foi para a lixeira. */
  purge: ["root"],
  /** Configurações do site (identidade, aparência, navegação, plugins). */
  settings: ["root", "admin"],
  /** Configuração técnica: tipo do site, URL, idiomas e tema. */
  technical: ["root"],
  /** Páginas e blocos. */
  pages: ["root", "admin", "content-editor"],
  /** Coleções em geral (projetos, serviços, depoimentos, FAQ, currículo, dia a dia, equipe). */
  content: ["root", "admin", "content-editor"],
  /** Posts do blog. */
  blog: ["root", "admin", "content-editor", "blog-editor"],
  /** Planos e preços: conteúdo, mas o comercial também mexe. */
  plans: ["root", "admin", "content-editor", "comercial"],
  /** Textos de interface. */
  texts: ["root", "admin", "content-editor"],
  /** Biblioteca de mídia. */
  media: ["root", "admin", "content-editor", "blog-editor"],
  /** Leitura das configurações e textos pelo painel (todo usuário com papel). */
  panel: ["root", "admin", "content-editor", "blog-editor", "proposal-editor", "comercial"],
  // Módulos da próxima etapa (contatos, propostas, contratos, checkouts).
  proposals: ["root", "admin", "comercial", "proposal-editor"],
  contracts: ["root", "admin", "comercial"],
  checkouts: ["root", "admin", "comercial"],
  contacts: ["root", "admin", "comercial"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
