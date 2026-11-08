export type PackageManager = "pnpm" | "npm";

/**
 * Gerenciador usado para rodar o create: `pnpm create rubrica` instala com pnpm,
 * o resto (npx, yarn, bun, desconhecido) com npm, que sempre vem com o Node.
 */
export function packageManagerFromUserAgent(userAgent: string | undefined): PackageManager {
  return userAgent?.startsWith("pnpm/") ? "pnpm" : "npm";
}
