/**
 * Escolhas atuais do combinador, para outras partes da página (a seção "Crie o seu").
 * Quem se inscreve recebe o estado atual na hora, mesmo que o combinador tenha
 * iniciado antes. O tipo de site também se escolhe em "Crie o seu": o pedido de troca
 * passa pelo combinador, que troca o preview e publica a escolha nova para todos.
 */
import type { SiteKind } from "./previews";

export interface CombinatorChoice {
  kind: SiteKind;
  layout: string;
  scheme: string;
  mode: "light" | "dark";
  sans: string;
  mono: string;
}

type Listener = (choice: CombinatorChoice) => void;
type Patch = Partial<Pick<CombinatorChoice, "kind">>;
let current: CombinatorChoice | null = null;
const listeners = new Set<Listener>();
let handler: ((patch: Patch) => void) | null = null;

export function publishChoice(choice: CombinatorChoice): void {
  current = choice;
  for (const l of listeners) l(choice);
}

export function onChoice(listener: Listener): void {
  listeners.add(listener);
  if (current) listener(current);
}

/** O combinador atende os pedidos de troca vindos de outras seções. */
export function onRequest(fn: (patch: Patch) => void): void {
  handler = fn;
}

/** Pede uma troca ao combinador; sem combinador na página, só avisa quem escuta. */
export function requestChoice(patch: Patch): void {
  if (handler) handler(patch);
  else if (current) publishChoice({ ...current, ...patch });
}
