import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";

export default function AdminContractTemplates() {
  const templates = useQuery(api.contractTemplates.list) ?? [];
  const createTemplate = useMutation(api.contractTemplates.create);
  const setDefault = useMutation(api.contractTemplates.setDefault);
  const removeTemplate = useMutation(api.contractTemplates.remove);
  const [name, setName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createTemplate({
        name,
        content: `# ${name}\n\nEscreva o conteúdo do contrato aqui.`,
        isDefault: templates.length === 0,
      });
      setName("");
      toast.success(`Template '${name}' criado.`);
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  async function handleSetDefault(id: typeof templates[number]["_id"]) {
    try {
      await setDefault({ id });
      toast.success("Template padrão atualizado.");
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  async function handleRemove(id: typeof templates[number]["_id"]) {
    if (!confirm("Remover este template?")) return;
    try {
      await removeTemplate({ id });
      toast.success("Template removido.");
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  }

  return (
    <AdminLayout title="Templates de Contrato">
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Nome do novo template..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={!name.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Criar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Padrão</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t._id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  {t.isDefault ? (
                    <Badge variant="default">
                      <Star className="mr-1 h-3 w-3" />
                      Padrão
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetDefault(t._id)}
                    >
                      Tornar padrão
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(t._id)}
                    disabled={t.isDefault}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  Nenhum template. Crie um acima.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}