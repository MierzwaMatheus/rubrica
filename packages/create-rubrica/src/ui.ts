/**
 * Perguntas e mensagens (@clack/prompts). Cancelar (Ctrl+C) vira `Cancelled`, que o
 * roteador mostra como "Nada foi alterado". Sem terminal interativo (agente, CI), quem
 * chama usa os valores das opções ou o padrão em vez de perguntar.
 */
import * as clack from "@clack/prompts";

export class Cancelled extends Error {
  constructor(message = "Cancelado. Nada foi alterado.") {
    super(message);
  }
}

export const log = clack.log;
export const note = clack.note;
export const intro = clack.intro;
export const outro = clack.outro;
export const spinner = clack.spinner;

/** Dá para perguntar? (terminal interativo e sem `--yes`). */
export const canAsk = (yes = false) => !yes && process.stdin.isTTY === true && process.env.CI !== "true";

function unwrap<T>(value: T | symbol): T {
  if (clack.isCancel(value)) throw new Cancelled();
  return value as T;
}

export async function ask(message: string, options: { initial?: string; placeholder?: string; validate?: (v: string) => string | undefined } = {}): Promise<string> {
  return unwrap(
    await clack.text({
      message,
      ...(options.initial !== undefined && { initialValue: options.initial }),
      ...(options.placeholder && { placeholder: options.placeholder }),
      ...(options.validate && { validate: (v: string) => options.validate!(v ?? "") }),
    }),
  ).trim();
}

export async function askSecret(message: string, validate?: (v: string) => string | undefined): Promise<string> {
  return unwrap(await clack.password({ message, ...(validate && { validate: (v: string) => validate(v ?? "") }) }));
}

export async function choose<T extends string>(message: string, options: { value: T; label: string; hint?: string }[], initial?: T): Promise<T> {
  return unwrap(await clack.select({ message, options: options as never, ...(initial && { initialValue: initial }) })) as T;
}

export async function chooseMany<T extends string>(message: string, options: { value: T; label: string; hint?: string }[], initial: T[]): Promise<T[]> {
  return unwrap(await clack.multiselect({ message, options: options as never, initialValues: initial, required: false })) as T[];
}

export async function confirm(message: string, initial = true): Promise<boolean> {
  return unwrap(await clack.confirm({ message, initialValue: initial }));
}
