import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { moveItem } from "@/utils/aboutContent";
import { MAX_HOME_METRICS, parseHomeMetrics, type HomeMetric } from "@/utils/homeMetrics";

type Row = { value: string; labelPT: string; labelEN: string };

/** Monta o valor salvo em `home_metrics`, descartando linhas sem número ou sem rótulo. */
export function buildHomeMetricsValue(rows: Row[]): HomeMetric[] {
  return rows
    .map(r => ({ value: r.value.trim(), labelPT: r.labelPT.trim(), labelEN: r.labelEN.trim() }))
    .filter(r => r.value && r.labelPT)
    .slice(0, MAX_HOME_METRICS)
    .map(r => ({
      value: r.value,
      label: r.labelPT,
      labelTranslations: { ptBR: r.labelPT, ...(r.labelEN ? { enUS: r.labelEN } : {}) },
    }));
}

/** Edita os números de prova do topo da home e do currículo (homeContent `home_metrics`). */
export function HomeMetricsEditor({ savedValue }: { savedValue: unknown }) {
  const setHomeContent = useMutation(api.homeContent.set);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(
      parseHomeMetrics(savedValue).map(m => ({
        value: m.value,
        labelPT: m.labelTranslations?.ptBR ?? m.label,
        labelEN: m.labelTranslations?.enUS ?? "",
      })),
    );
  }, [savedValue]);

  const update = (index: number, field: keyof Row, value: string) =>
    setRows(list => list.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setHomeContent({ key: "home_metrics", value: buildHomeMetricsValue(rows) });
      toast.success("Números salvos!");
    } catch (error) {
      console.error("Error saving home metrics:", error);
      toast.error("Erro ao salvar os números.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-foreground/10">
      <CardHeader>
        <CardTitle className="text-foreground-strong">Números de destaque</CardTitle>
        <p className="text-sm text-foreground/65">
          Até {MAX_HOME_METRICS} números de resultado. Aparecem logo abaixo do topo da home e no começo do currículo.
          Prefira resultados ("1.200 agendamentos/mês") a quantidades ("300 commits").
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 && <p className="text-sm text-foreground/42">Nenhum número cadastrado. Sem números, a faixa não aparece.</p>}
        {rows.map((row, index) => (
          <div key={index} className="grid md:grid-cols-[140px_1fr_1fr_auto] gap-3 items-end rounded-lg border border-foreground/10 p-4">
            <div className="space-y-2">
              <Label className="text-foreground-strong">Número</Label>
              <Input value={row.value} placeholder="8+" onChange={e => update(index, "value", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground-strong">Rótulo (PT)</Label>
              <Input value={row.labelPT} placeholder="anos de experiência" onChange={e => update(index, "labelPT", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground-strong">Label (EN)</Label>
              <Input value={row.labelEN} placeholder="years of experience" onChange={e => update(index, "labelEN", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="Mover para cima" disabled={index === 0} onClick={() => setRows(l => moveItem(l, index, -1))}>
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Mover para baixo" disabled={index === rows.length - 1} onClick={() => setRows(l => moveItem(l, index, 1))}>
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Remover" onClick={() => setRows(l => l.filter((_, i) => i !== index))}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={rows.length >= MAX_HOME_METRICS} onClick={() => setRows(l => [...l, { value: "", labelPT: "", labelEN: "" }])} className="border-foreground/10 text-foreground-strong">
            <Plus className="w-4 h-4 mr-2" /> Adicionar número
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
            {saving ? "Salvando..." : "Salvar números"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
