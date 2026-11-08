/** `migrar`: leva um projeto da v1 para a v2. */
import { Cancelled } from "../ui.js";

export async function runMigrate(argv: string[], deps: { cwd: string }): Promise<void> {
  void argv;
  void deps;
  throw new Cancelled("O migrar ainda não está pronto nesta versão do CLI.");
}
