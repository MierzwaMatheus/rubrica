import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWorkPrinciplesValue, moveItem, parseWorkPrinciples } from "@/utils/aboutContent";

type Row = { titlePT: string; descriptionPT: string; titleEN: string; descriptionEN: string };
const emptyRow = (): Row => ({ titlePT: "", descriptionPT: "", titleEN: "", descriptionEN: "" });

/** Edita os princípios de trabalho exibidos em "Sobre" (homeContent `work_principles`). */
export function WorkPrinciplesEditor({ savedValue }: { savedValue: unknown }) {
  const setHomeContent = useMutation(api.homeContent.set);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(
      parseWorkPrinciples(savedValue).map(p => ({
        titlePT: p.titleTranslations?.ptBR ?? p.title,
        descriptionPT: p.descriptionTranslations?.ptBR ?? p.description,
        titleEN: p.titleTranslations?.enUS ?? "",
        descriptionEN: p.descriptionTranslations?.enUS ?? "",
      })),
    );
  }, [savedValue]);

  const update = (index: number, field: keyof Row, value: string) =>
    setRows(list => list.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setHomeContent({ key: "work_principles", value: buildWorkPrinciplesValue(rows) });
      toast.success("Princípios de trabalho salvos!");
    } catch (error) {
      console.error("Error saving work principles:", error);
      toast.error("Erro ao salvar os princípios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-foreground/10">
      <CardHeader>
        <CardTitle className="text-foreground-strong">Princípios de trabalho</CardTitle>
        <p className="text-sm text-foreground/65">
          Aparecem em "Sobre", na seção "Como eu trabalho". Itens sem título em português não são salvos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 && <p className="text-sm text-foreground/42">Nenhum princípio cadastrado.</p>}
        {rows.map((row, index) => (
          <div key={index} className="rounded-lg border border-foreground/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-foreground/42">#{index + 1}</span>
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
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground-strong">Título (PT)</Label>
                <Input value={row.titlePT} onChange={e => update(index, "titlePT", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                <Label className="text-foreground-strong">Descrição (PT)</Label>
                <Textarea value={row.descriptionPT} onChange={e => update(index, "descriptionPT", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground-strong">Title (EN)</Label>
                <Input value={row.titleEN} onChange={e => update(index, "titleEN", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                <Label className="text-foreground-strong">Description (EN)</Label>
                <Textarea value={row.descriptionEN} onChange={e => update(index, "descriptionEN", e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong" rows={3} />
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setRows(l => [...l, emptyRow()])} className="border-foreground/10 text-foreground-strong">
            <Plus className="w-4 h-4 mr-2" /> Adicionar princípio
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
            {saving ? "Salvando..." : "Salvar princípios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
