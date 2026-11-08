/** Atividades (só a agência): registro de auditoria das ações no painel. */
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../data/api";
import { useQuery } from "../data/backend";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { auditTargetOptions, describeAudit } from "../lib/audit";
import { formatDateTime, timeAgo } from "../lib/format";
import { Input, NativeSelect } from "../ui/form";
import { usePanel } from "../panel";

export default function Activity() {
  const { kind } = usePanel();
  const [target, setTarget] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);
  const entries = useQuery(api.audit.recent, { limit, ...(target ? { targetType: target } : {}) });
  const shown = (entries ?? []).filter((e) => !search || `${e.eventType} ${describeAudit(e)} ${e.actorEmail ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const targets = auditTargetOptions(kind);
  return (
    <>
      <PageHeader title="Atividades" description="O que foi feito no painel, por quem e quando. Os registros vencem com o tempo." />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="Buscar atividades" placeholder="Buscar por pessoa ou ação" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          <NativeSelect aria-label="Filtrar por tipo" className="w-52" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Todos os tipos</option>
            {targets.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label[0]!.toUpperCase() + t.label.slice(1)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {entries === undefined ? (
          <Loading />
        ) : shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>
        ) : (
          <ol className="divide-y rounded-lg border bg-card" aria-label="Atividades">
            {shown.map((e) => (
              <li key={e._id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                {e.success ? <CheckCircle2 className="size-4 text-success" aria-label="deu certo" /> : <AlertCircle className="size-4 text-destructive" aria-label="falhou" />}
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{e.actorEmail ?? (e.actorType === "system" ? "Sistema" : e.actorType === "external" ? "Visitante" : "—")}</span> {describeAudit(e)}
                </span>
                <span className="text-xs text-muted-foreground" title={formatDateTime(e.createdAt)}>
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        )}
        {entries && entries.length >= limit && (
          <button type="button" className="cursor-pointer text-sm underline" onClick={() => setLimit(limit + 100)}>
            Ver mais
          </button>
        )}
      </div>
    </>
  );
}
