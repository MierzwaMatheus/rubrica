/**
 * Botão "Publicar site" e o estado da publicação (publicado, publicando, mudanças pendentes).
 *
 * O "publicando" é decidido aqui, com o relógio do navegador (`describePublish`): a query
 * do Convex só roda de novo quando os dados mudam, e não quando a janela do build acaba.
 */
import { AlertTriangle, CheckCircle2, CircleDashed, Rocket } from "lucide-react";
import { can } from "../convex/lib/roles";
import { api } from "./data/api";
import { useAction, useQuery } from "./data/backend";
import { errorMessage } from "./editor/model";
import { describePublish } from "./lib/publish";
import { toast } from "./lib/toast";
import { cn } from "./lib/utils";
import { usePanel } from "./panel";
import { Button } from "./ui/button";
import { Spinner } from "./ui/form";
import { useEffect, useState } from "react";

/** De quanto em quanto tempo o painel confere de novo o relógio (fim do "publicando", "há N min"). */
export const PUBLISH_CLOCK_MS = 10_000;

/** A hora atual, atualizada a cada `intervalMs`. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const TONE = { ok: "text-success", wait: "text-muted-foreground", warn: "text-warning", off: "text-muted-foreground" } as const;

export function PublishBar({ compact = false }: { compact?: boolean }) {
  const panel = usePanel();
  const status = useQuery(api.publish.status, {});
  const trigger = useAction(api.publish.trigger);
  const [busy, setBusy] = useState(false);
  const now = useNow(PUBLISH_CLOCK_MS);
  if (!status) return null;
  const view = describePublish(status, now);
  const state = view.state;
  const allowed = can(panel.me.role, "publish");
  const publishing = state === "publishing" || busy;
  const Icon = state === "publishing" ? Spinner : state === "published" ? CheckCircle2 : state === "pending" || state === "failed" ? AlertTriangle : CircleDashed;

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
    <div className="flex items-center gap-3" data-publish-status={state}>
      <span className={cn("flex items-center gap-1.5 text-sm", TONE[view.tone])} title={view.detail} role="status">
        <Icon className="size-4" aria-hidden="true" />
        {!compact && view.label}
        {compact && <span className="sr-only">{view.label}</span>}
      </span>
      {allowed && (
        <Button size="sm" variant={state === "pending" ? "default" : "outline"} disabled={publishing || state === "unconfigured"} onClick={publish}>
          {publishing ? <Spinner /> : <Rocket />} Publicar site
        </Button>
      )}
    </div>
  );
}
