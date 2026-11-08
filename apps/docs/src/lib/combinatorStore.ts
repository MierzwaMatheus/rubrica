/**
 * Escolhas atuais do combinador, para outras partes da página (a seção "Crie o seu").
 * Quem se inscreve recebe o estado atual na hora, mesmo que o combinador tenha
 * iniciado antes.
 */
export interface CombinatorChoice {
  layout: string;
  scheme: string;
  mode: "light" | "dark";
  toggle: boolean;
  texture: string;
  sans: string;
  mono: string;
}

type Listener = (choice: CombinatorChoice) => void;
let current: CombinatorChoice | null = null;
const listeners = new Set<Listener>();

export function publishChoice(choice: CombinatorChoice): void {
  current = choice;
  for (const l of listeners) l(choice);
}

export function onChoice(listener: Listener): void {
  listeners.add(listener);
  if (current) listener(current);
}
