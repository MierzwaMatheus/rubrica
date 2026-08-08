import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AdminSiteConfig() {
  const entries = useQuery(api.siteConfig.getAll) ?? [];
  const setConfig = useMutation(api.siteConfig.set);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");

  function startEdit(key: string, current: unknown) {
    setEditingKey(key);
    setDraft(typeof current === "string" ? current : JSON.stringify(current));
  }

  async function save(key: string) {
    try {
      await setConfig({ key, value: draft });
      toast.success(`'${key}' atualizado.`);
      setEditingKey(null);
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  return (
    <AdminLayout title="Configurações do Site">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Chave</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                <TableCell>
                  {editingKey === entry.key ? (
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono text-sm">
                      {typeof entry.value === "string"
                        ? entry.value
                        : JSON.stringify(entry.value)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingKey === entry.key ? (
                    <Button size="sm" onClick={() => save(entry.key)}>
                      <Save className="mr-1 h-3 w-3" />
                      Salvar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(entry.key, entry.value)}
                    >
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  Nenhuma configuração encontrada. Rode <code>pnpm rubrica setup</code> para popular.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}