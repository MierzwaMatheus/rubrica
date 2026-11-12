import { describe, expect, it } from "vitest";
import { describePublish } from "../../src/admin/lib/publish";
import type { PublishStatus } from "../../src/admin/data/api";

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 11, 12, 0, 0);

function status(over: Partial<PublishStatus> = {}): PublishStatus {
  return {
    status: "published",
    settledStatus: "published",
    publishingUntil: null,
    configured: true,
    pendingChanges: 0,
    lastTriggeredAt: null,
    lastPublishedAt: null,
    lastError: null,
    nextAllowedAt: T0,
    ...over,
  };
}

describe("estado da publicação no painel", () => {
  it("publicando até o fim da janela, mesmo com a query parada, e publicado depois", () => {
    // O resultado da query não muda (nenhum dado novo): só o relógio do painel anda.
    const s = status({ status: "publishing", settledStatus: "published", publishingUntil: T0 + 5 * MIN, lastTriggeredAt: T0 });
    expect(describePublish(s, T0 + MIN)).toMatchObject({ state: "publishing", label: "Publicando…", tone: "wait" });
    expect(describePublish(s, T0 + 5 * MIN - 1).state).toBe("publishing");
    expect(describePublish(s, T0 + 5 * MIN)).toMatchObject({ state: "published", label: "Site publicado", tone: "ok", detail: "Desde há 5 min." });
  });

  it("depois da janela, mudanças feitas durante o build aparecem como pendentes", () => {
    const s = status({ status: "publishing", settledStatus: "pending", pendingChanges: 2, publishingUntil: T0 + 5 * MIN, lastTriggeredAt: T0 });
    expect(describePublish(s, T0 + 6 * MIN)).toMatchObject({ state: "pending", label: "2 mudanças pendentes", tone: "warn", detail: "Última publicação há 6 min." });
  });

  it("o aviso de fim de build encerra na hora (publishingUntil some)", () => {
    const s = status({ lastTriggeredAt: T0, lastPublishedAt: T0 + 40_000 });
    expect(describePublish(s, T0 + 41_000)).toMatchObject({ state: "published", detail: "Desde agora." });
  });

  it("falha, sem configuração e contagem de pendências", () => {
    expect(describePublish(status({ status: "failed", settledStatus: "failed", lastError: "HTTP 500" }), T0)).toMatchObject({ state: "failed", label: "A publicação falhou", detail: "HTTP 500" });
    expect(describePublish(status({ status: "unconfigured", settledStatus: "unconfigured", configured: false }), T0)).toMatchObject({ state: "unconfigured", tone: "off" });
    expect(describePublish(status({ status: "pending", settledStatus: "pending", pendingChanges: 1 }), T0)).toMatchObject({ label: "1 mudança pendente", detail: undefined });
    expect(describePublish(status({ status: "pending", settledStatus: "pending", pendingChanges: 100 }), T0).label).toBe("100+ mudanças pendentes");
  });
});
