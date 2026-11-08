/** Botão "Publicar site" e o estado da publicação (publicado, publicando, mudanças pendentes). */
import { AlertTriangle, CheckCircle2, CircleDashed, Rocket } from "lucide-react";
import { can } from "../convex/lib/roles";
import { api, type PublishStatus } from "./data/api";
import { useAction, useQuery } from "./data/backend";
import { errorMessage } from "./editor/model";
import { timeAgo } from "./lib/format";
import { toast } from "./lib/toast";
import { cn } from "./lib/utils";
import { usePanel } from "./panel";
import { Button } from "./ui/button";
import { Spinner } from "./ui/form";
import { useState } from "react";

export function describePublish(status: PublishStatus, now = Date.now()): { label: string; tone: "ok" | "wait" | "warn" | "off"; detail?: string } {
  switch (status.status) {
    case "publishing":
      return { label: "Publicando…", tone: "wait", detail: "O site novo fica no ar em alguns minutos." };
    case "pending":
      return {
        label: status.pendingChanges === 1 ? "1 mudança pendente" : `${status.pendingChanges >= 100 ? "100+" : status.pendingChanges} mudanças pendentes`,
        tone: "warn",
        detail: status.lastPublishedAt ? `Última publicação ${timeAgo(status.lastPublishedAt, now)}.` : undefined,
      };
    case "failed":
      return { label: "A publicação falhou", tone: "warn", detail: status.lastError ?? undefined };
    case "unconfigured":
      return { label: "Publicação não configurada", tone: "off", detail: "Falta o endereço do deploy hook (RUBRICA_DEPLOY_HOOK_URL) no Convex." };
    default:
      return { label: "Site publicado", tone: "ok", detail: status.lastPublishedAt ? `Desde ${timeAgo(status.lastPublishedAt, now)}.` : undefined };
  }
}

const TONE = { ok: "text-success", wait: "text-muted-foreground", warn: "text-warning", off: "text-muted-foreground" } as const;

export function PublishBar({ compact = false }: { compact?: boolean }) {
  const panel = usePanel();
  const status = useQuery(api.publish.status, {});
  const trigger = useAction(api.publish.trigger);
  const [busy, setBusy] = useState(false);
  if (!status) return null;
  const view = describePublish(status);
  const allowed = can(panel.me.role, "publish");
  const publishing = status.status === "publishing" || busy;
  const Icon = status.status === "publishing" ? Spinner : status.status === "published" ? CheckCircle2 : status.status === "pending" || status.status === "failed" ? AlertTriangle : CircleDashed;

  async function publish() {
    setBusy(true);
    try {
      const res = await trigger({});
      if (!res.ok) toast.error(res.message ?? "Não foi possível publicar.");
      else if (res.skipped) toast.info(res.message ?? "Nada novo para publicar.");
      else toast.success("Publicação iniciada. O site novo fica no ar em alguns minutos.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3" data-publish-status={status.status}>
      <span className={cn("flex items-center gap-1.5 text-sm", TONE[view.tone])} title={view.detail} role="status">
        <Icon className="size-4" aria-hidden="true" />
        {!compact && view.label}
        {compact && <span className="sr-only">{view.label}</span>}
      </span>
      {allowed && (
        <Button size="sm" variant={status.status === "pending" ? "default" : "outline"} disabled={publishing || status.status === "unconfigured"} onClick={publish}>
          {publishing ? <Spinner /> : <Rocket />} Publicar site
        </Button>
      )}
    </div>
  );
}
