import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function PublishStatus() {
  const status = useQuery(api.publishStatus.get);
  const triggerDeploy = useAction(api.deploy.trigger);
  const [isPending, setIsPending] = useState(false);

  const handleTrigger = async () => {
    setIsPending(true);
    try {
      const result = await triggerDeploy({});
      if (result?.skipped) {
        toast.info(result.message ?? "Deploy ignorado");
      } else if (!result?.ok) {
        toast.error(result?.message ?? "Não deu para publicar. Tente de novo em alguns minutos.");
      } else {
        toast.success("Publicação iniciada! O site atualiza em alguns minutos.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao iniciar deploy: ${message}`);
    } finally {
      setIsPending(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    const intervals = [
      { label: "ano", seconds: 31536000 },
      { label: "mês", seconds: 2592000 },
      { label: "dia", seconds: 86400 },
      { label: "hora", seconds: 3600 },
      { label: "minuto", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `há ${count} ${interval.label}${count > 1 ? "s" : ""}`;
      }
    }

    return "agora mesmo";
  };

  if (status === undefined) return <Badge variant="secondary">Carregando...</Badge>;

  if (status?.pendingChanges) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          Alterações Não Publicadas
        </Badge>
        <Button size="sm" onClick={handleTrigger} disabled={isPending}>
          <RefreshCw
            className={`w-3 h-3 mr-1 ${isPending ? "animate-spin" : ""}`}
          />
          {isPending ? "Publicando..." : "Publicar Agora"}
        </Button>
      </div>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <CheckCircle className="w-3 h-3" />
      Publicado{" "}
      {status?.lastPublishedAt
        ? formatTimeAgo(status.lastPublishedAt)
        : "recentemente"}
    </Badge>
  );
}
