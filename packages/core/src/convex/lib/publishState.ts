/**
 * Estado da publicação num instante. Arquivo puro (sem Convex): o backend usa no `status`
 * para quem lê uma vez só (MCP) e o painel usa com o próprio relógio, porque a query não
 * roda de novo quando o tempo passa, só quando os dados mudam.
 */
export type PublishState = "unconfigured" | "publishing" | "pending" | "published" | "failed";
export type SettledPublishState = Exclude<PublishState, "publishing">;

/** Os campos do `status` de que o cálculo depende. */
export interface PublishTiming {
  /** O estado depois do build (ou sem build em andamento). */
  settledStatus: SettledPublishState;
  /** Até quando presumir o build rodando (`null`: nenhum em andamento). */
  publishingUntil: number | null;
}

/** "Publicando" até `publishingUntil`, depois o `settledStatus`. */
export function currentPublishState(s: PublishTiming, now: number): PublishState {
  if (s.settledStatus === "unconfigured") return "unconfigured";
  return s.publishingUntil !== null && now < s.publishingUntil ? "publishing" : s.settledStatus;
}
