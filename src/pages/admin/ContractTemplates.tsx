import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateEditor } from "@/components/admin/TemplateEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";

type Template = {
  _id: Id<"contractTemplates">;
  name: string;
  description?: string;
  content: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

type FormState = {
  name: string;
  description: string;
  content: string;
};

const TEMPLATE_VARIABLES = [
  { key: "client_name", label: "Nome do cliente" },
  { key: "client_document", label: "Documento" },
  { key: "client_email", label: "E-mail" },
  { key: "client_role", label: "Cargo/função" },
  { key: "objective", label: "Objetivo" },
  { key: "scope", label: "Escopo" },
  { key: "timeline", label: "Cronograma" },
  { key: "delivery_date", label: "Data de entrega" },
  { key: "investment_value", label: "Valor" },
  { key: "payment_methods", label: "Pagamento" },
  { key: "conditions", label: "Condições" },
  { key: "rescission_policy", label: "Rescisão" },
  { key: "accepted_at", label: "Data de aceite" },
];

export default function ContractTemplates() {
  const templates = useQuery(api.contractTemplates.list);
  const createTemplate = useMutation(api.contractTemplates.create);
  const updateTemplate = useMutation(api.contractTemplates.update);
  const removeTemplate = useMutation(api.contractTemplates.remove);
  const setDefault = useMutation(api.contractTemplates.setDefault);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", description: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const isLoading = templates === undefined;
  const isEditing = editingTemplate !== null;

  function openCreate() {
    setEditingTemplate(null);
    setForm({ name: "", description: "", content: "" });
    setModalOpen(true);
  }

  function openEdit(template: Template) {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      description: template.description ?? "",
      content: template.content,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTemplate(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("O nome do template é obrigatório.");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateTemplate({
          id: editingTemplate._id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          content: form.content,
        });
        toast.success("Template atualizado com sucesso.");
      } else {
        await createTemplate({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          content: form.content,
          isDefault: false,
        });
        toast.success("Template criado com sucesso.");
      }
      closeModal();
    } catch (err) {
      toast.error("Erro ao salvar template.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault(template: Template) {
    try {
      await setDefault({ id: template._id });
      toast.success(`"${template.name}" definido como template padrão.`);
    } catch {
      toast.error("Erro ao definir template padrão.");
    }
  }

  async function handleDelete(id: Id<"contractTemplates">) {
    await removeTemplate({ id });
  }

  return (
    <AdminLayout>
      <div className="pt-20 md:pt-8 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Templates de Contrato</h1>
            <p className="text-gray-400 text-sm mt-1">
              Gerencie os templates usados na geração de contratos PDF
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-4">Nenhum template cadastrado.</p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro template
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-300">Nome</TableHead>
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300 w-28">Status</TableHead>
                  <TableHead className="text-gray-300 text-right w-48">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow
                    key={template._id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="font-medium text-white">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-gray-400 max-w-xs truncate">
                      {template.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      {template.isDefault && (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded px-2 py-0.5 text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Padrão
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => handleSetDefault(template)}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Definir padrão
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                          onClick={() => openEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={() => setDeleteTarget(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal de criar/editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="bg-card border-white/10 max-w-[92vw] xl:max-w-6xl w-full h-[90vh] flex flex-col text-white p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
            <DialogTitle className="text-xl font-bold">
              {isEditing ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <VisuallyHidden>
              <p>{isEditing ? "Editar template de contrato" : "Criar novo template de contrato"}</p>
            </VisuallyHidden>
          </DialogHeader>

          <div className="space-y-4 py-4 px-6 shrink-0">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-gray-300">
                Nome <span className="text-red-400">*</span>
              </Label>
              <Input
                id="template-name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Contrato Padrão de Prestação de Serviços"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-gray-300">
                Descrição <span className="text-gray-500 font-normal text-xs">(opcional)</span>
              </Label>
              <Input
                id="template-description"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descrição do uso deste template"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-2">
            <TemplateEditor
              content={form.content}
              onChange={(value) => setForm(f => ({ ...f, content: value }))}
              variables={TEMPLATE_VARIABLES}
            />
          </div>

          <div className="border-t border-white/10 px-6 py-4 mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 bg-card">
            <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? "Salvar alterações" : "Criar template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de remoção */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await handleDelete(deleteTarget._id);
            toast.success(`Template "${deleteTarget.name}" removido.`);
            setDeleteTarget(null);
          }}
          itemName={deleteTarget.name}
        />
      )}
    </AdminLayout>
  );
}
