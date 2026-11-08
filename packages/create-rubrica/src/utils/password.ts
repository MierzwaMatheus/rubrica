/**
 * Regras de senha do painel admin. As mesmas do `changePassword` em convex/users.ts:
 * o setup e o `senha` não podem aceitar uma senha que o painel recusaria depois.
 */
export function validatePassword(password: string): string | undefined {
  if (password.length < 12) return "A senha precisa ter pelo menos 12 caracteres";
  if (!/[A-Z]/.test(password)) return "Inclua ao menos uma letra maiúscula";
  if (!/[a-z]/.test(password)) return "Inclua ao menos uma letra minúscula";
  if (!/[0-9]/.test(password)) return "Inclua ao menos um número";
  return undefined;
}
