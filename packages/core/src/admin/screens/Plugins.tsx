/** Plugins: ligar e desligar, respeitando as dependências (decisão 19). */
import { useState } from "react";
import { api, type PluginRow } from "../data/api";
import { useMutation } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { Badge } from "../ui/form";
import { Switch } from "../ui/tabs";

/** O que mais precisa ligar junto (dependências que estão desligadas, em cascata). */
export function toEnable(id: string, rows: PluginRow[]): string[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: string[] = [];
  const visit = (pid: string) => {
    for (const dep of byId.get(pid)?.requires ?? []) {
      if (!byId.get(dep)?.enabled && !out.includes(dep)) {
        visit(dep);
        out.push(dep);
      }
    }
  };
  visit(id);
  return out;
}

/** Quem deixa de funcionar ao desligar (dependentes ligados, em cascata). */
export function dependents(id: string, rows: PluginRow[]): string[] {
  const out: string[] = [];
  const visit = (pid: string) => {
    for (const r of rows) {
      if (r.enabled && r.requires.includes(pid) && !out.includes(r.id)) {
        out.push(r.id);
        visit(r.id);
      }
    }
  };
  visit(id);
  return out;
}

export default function Plugins() {
  const panel = usePanel();
  const setPlugin = useMutation(api.settings.setPlugin);
  const [busy, setBusy] = useState<string>();
  const rows = panel.pluginRows;
  const label = (id: string) => rows.find((r) => r.id === id)?.label ?? id;

  async function toggle(row: PluginRow, on: boolean) {
    if (on) {
      const deps = toEnable(row.id, rows);
      if (deps.length && !window.confirm(`“${row.label}” precisa de: ${deps.map(label).join(", ")}. Ligar também?`)) return;
      setBusy(row.id);
      try {
        for (const d of deps) await setPlugin({ id: d, enabled: true });
        await setPlugin({ id: row.id, enabled: true });
        toast.success(`${row.label} ligado.`);
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusy(undefined);
      }
    } else {
      const deps = dependents(row.id, rows);
      if (deps.length && !window.confirm(`Desligar “${row.label}” também desliga: ${deps.map(label).join(", ")}. Continuar?`)) return;
      setBusy(row.id);
      try {
        await setPlugin({ id: row.id, enabled: false });
        toast.success(`${row.label} desligado. Blocos e telas dele somem do site e do painel.`);
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusy(undefined);
      }
    }
  }

  return (
    <>
      <PageHeader title="Plugins" description={`Recursos opcionais disponíveis em sites do tipo ${panel.kind}. Desligar não apaga dados: só tira blocos, telas e coleções do ar.`} />
      <ul className="m-6 max-w-3xl divide-y rounded-lg border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-4 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor={`plugin-${row.id}`} className="font-medium">
                {row.label}
              </label>
              <p className="text-sm text-muted-foreground">{row.description}</p>
              {row.requires.length > 0 && <p className="text-xs text-muted-foreground">Precisa de: {row.requires.map(label).join(", ")}</p>}
            </div>
            <Badge variant={row.enabled ? "success" : "secondary"}>{row.enabled ? "ligado" : "desligado"}</Badge>
            <Switch id={`plugin-${row.id}`} checked={row.enabled} disabled={busy !== undefined} onCheckedChange={(on) => toggle(row, on)} />
          </li>
        ))}
      </ul>
    </>
  );
}
