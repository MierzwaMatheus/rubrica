/**
 * Frase do estado da publicação no painel. Sem React: testável. O estado vem de
 * `currentPublishState` com o relógio de quem chama, e não do `status` da query, que
 * fica parado enquanto os dados não mudam.
 */
import { currentPublishState, type PublishState } from "../../convex/lib/publishState";
import type { PublishStatus } from "../data/api";
import { timeAgo } from "./format";

/** Última publicação conhecida: o aviso do build ou, sem ele, a chamada ao hook. */
function lastPublication(status: PublishStatus): number | undefined {
  return Math.max(status.lastPublishedAt ?? 0, status.lastTriggeredAt ?? 0) || undefined;
}

export function describePublish(
  status: PublishStatus,
  now = Date.now(),
): { state: PublishState; label: string; tone: "ok" | "wait" | "warn" | "off"; detail?: string } {
  const state = currentPublishState(status, now);
  const last = lastPublication(status);
  return { state, ...describeState(state, status, last, now) };
}

function describeState(state: PublishState, status: PublishStatus, last: number | undefined, now: number): { label: string; tone: "ok" | "wait" | "warn" | "off"; detail?: string } {
  switch (state) {
    case "publishing":
      return { label: "Publicando…", tone: "wait", detail: "O site novo fica no ar em alguns minutos." };
    case "pending":
      return {
        label: status.pendingChanges === 1 ? "1 mudança pendente" : `${status.pendingChanges >= 100 ? "100+" : status.pendingChanges} mudanças pendentes`,
        tone: "warn",
        detail: last ? `Última publicação ${timeAgo(last, now)}.` : undefined,
      };
    case "failed":
      return { label: "A publicação falhou", tone: "warn", detail: status.lastError ?? undefined };
    case "unconfigured":
      return { label: "Publicação não configurada", tone: "off", detail: "Falta o endereço do deploy hook (RUBRICA_DEPLOY_HOOK_URL) no Convex." };
    default:
      return { label: "Site publicado", tone: "ok", detail: last ? `Desde ${timeAgo(last, now)}.` : undefined };
  }
}
