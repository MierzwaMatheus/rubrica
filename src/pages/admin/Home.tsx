

import { useState, useEffect } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Briefcase, RotateCcw, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";
import { useIsRoot } from "@/hooks/useIsRoot";
import { WorkPrinciplesEditor } from "@/components/admin/WorkPrinciplesEditor";
import { HomeMetricsEditor } from "@/components/admin/HomeMetricsEditor";

export default function AdminHome() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const homeContentList = useQuery(api.homeContent.getAll);
  const services = useQuery(api.services.list, { includeDeleted: isRoot && includeDeleted }) ?? [];

  const setHomeContent = useMutation(api.homeContent.set);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);
  const permanentDeleteService = useMutation(api.services.permanentDelete);
  const restoreService = useMutation(api.services.restore);

  const { translateFields, isTranslating } = useTranslateContent();
  const [aboutText, setAboutText] = useState("");
  const [availabilityEnabled, setAvailabilityEnabled] = useState(false);
  const [availabilityLabelPT, setAvailabilityLabelPT] = useState("");
  const [availabilityLabelEN, setAvailabilityLabelEN] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name?: string } | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (homeContentList) {
      const aboutEntry = homeContentList.find((c: any) => c.key === "about_text");
      if (aboutEntry) {
        const value = aboutEntry.value;
        if (typeof value === "object" && value !== null && "ptBR" in value) {
          setAboutText(value.ptBR || "");
        } else {
          setAboutText(typeof value === "string" ? value : "");
        }
      }

      const availabilityEntry = homeContentList.find((c: any) => c.key === "availability_status");
      if (availabilityEntry) {
        const v = availabilityEntry.value ?? {};
        setAvailabilityEnabled(Boolean(v.available));
        setAvailabilityLabelPT(v.label?.ptBR ?? "");
        setAvailabilityLabelEN(v.label?.enUS ?? "");
      }
    }
  }, [homeContentList]);

  const handleOpenModal = (type: string, item: any = null) => {
    setActiveModal(type);
    setEditingItem(item);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      if (activeModal === "service") {
        const titlePT = formData.get("title") as string;
        const descriptionPT = formData.get("description") as string;

        const serviceFields = { title: titlePT, description: descriptionPT };
        const changedService = editingItem
          ? getChangedTranslatableFields(serviceFields, { title: editingItem.titleTranslations, description: editingItem.descriptionTranslations })
          : serviceFields;

        let partialService: Record<string, string> = {};
        if (Object.keys(changedService).length > 0) {
          const toastId = toast.loading('Traduzindo conteúdo...');
          partialService = await translateFields(changedService);
          toast.dismiss(toastId);
        }
        const translated = {
          title: partialService.title ?? editingItem?.titleTranslations?.enUS ?? titlePT,
          description: partialService.description ?? editingItem?.descriptionTranslations?.enUS ?? descriptionPT,
        };

        const payload = {
          title: titlePT,
          description: descriptionPT,
          titleTranslations: { ptBR: titlePT, enUS: translated.title },
          descriptionTranslations: { ptBR: descriptionPT, enUS: translated.description },
        };

        if (editingItem) {
          await updateService({ id: editingItem._id as Id<"services">, ...payload });
        } else {
          await createService(payload);
        }
      }

      handleCloseModal();
      toast.success("Salvo com sucesso!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar. Verifique o console.");
    }
  };

  const handleSaveAbout = async () => {
    try {
      const aboutEntry = homeContentList?.find((c: any) => c.key === "about_text");
      const savedPT = typeof aboutEntry?.value === "object" && aboutEntry?.value !== null
        ? (aboutEntry.value as any).ptBR ?? ""
        : (typeof aboutEntry?.value === "string" ? aboutEntry.value : "");
      const savedEN = typeof aboutEntry?.value === "object" && aboutEntry?.value !== null
        ? (aboutEntry.value as any).enUS ?? ""
        : "";

      let enUS: string;
      if (aboutText.trim() !== savedPT.trim()) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        const translated = await translateFields({ aboutText });
        toast.dismiss(toastId);
        enUS = translated.aboutText;
      } else {
        enUS = savedEN || aboutText;
      }

      await setHomeContent({
        key: "about_text",
        value: { ptBR: aboutText, enUS },
      });
      toast.success("Sobre mim salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving about:", error);
      toast.error("Erro ao salvar 'Sobre Mim'.");
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await setHomeContent({
        key: "availability_status",
        value: {
          available: availabilityEnabled,
          label: {
            ptBR: availabilityLabelPT || "disponível para novos projetos",
            enUS: availabilityLabelEN || "available for new projects",
          },
        },
      });
      toast.success("Disponibilidade salva com sucesso!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Erro ao salvar disponibilidade.");
    }
  };

  const handleDelete = (type: string, id: string, name?: string) => {
    setDeleteTarget({ type, id, name });
  };

  const handleRestore = async (type: string, id: string) => {
    if (type === "service") {
      try {
        await restoreService({ id: id as Id<"services"> });
        toast.success('Item restaurado com sucesso');
      } catch (error) {
        toast.error('Erro ao restaurar item');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground-strong">Edição da Página Inicial</h1>
        </div>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="bg-foreground/5 border border-foreground/10 w-full grid grid-cols-3">
            <TabsTrigger value="about">Sobre Mim</TabsTrigger>
            <TabsTrigger value="metrics">Números</TabsTrigger>
            <TabsTrigger value="principles">Princípios</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-8 mt-6">
            <Card className="bg-card border-foreground/10">
              <CardHeader>
                <CardTitle className="text-foreground-strong">Sobre Mim</CardTitle>
                <p className="text-foreground/65 text-sm">Edite o texto de apresentação principal</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong min-h-[150px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveAbout} disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                    {isTranslating ? 'Traduzindo...' : 'Salvar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground-strong">O que eu faço</h2>
                <div className="flex gap-2 items-center">
                  {isRoot && (
                    <button
                      onClick={() => setIncludeDeleted(!includeDeleted)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        includeDeleted
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : 'border-foreground/10 bg-foreground/5 text-foreground/65 hover:text-foreground-strong'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {includeDeleted ? 'Ocultar deletados' : 'Ver deletados'}
                    </button>
                  )}
                  <Button onClick={() => handleOpenModal("service")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(services as any[]).map(item => {
                  const isDeleted = !!item.deletedAt;
                  return (
                    <Card key={item._id} className={`bg-card group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
                      <CardContent className="pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground-strong">
                          {item.titleTranslations?.ptBR || item.title}
                        </h3>
                        {isDeleted && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit">
                            <ShieldAlert className="w-3 h-3" />
                            Deletado
                          </div>
                        )}
                        <p className="text-foreground/65 text-sm leading-relaxed">
                          {item.descriptionTranslations?.ptBR || item.description}
                        </p>
                        <div className="flex justify-end gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isDeleted && (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal("service", item)} className="text-foreground-strong hover:text-neon-purple">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </Button>
                          )}
                          {isDeleted ? (
                            <Button variant="ghost" size="sm" onClick={() => handleRestore("service", item._id)} className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
                              <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("service", item._id, item.titleTranslations?.ptBR || item.title)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            <HomeMetricsEditor
              savedValue={homeContentList?.find((c: any) => c.key === "home_metrics")?.value}
            />
          </TabsContent>

          <TabsContent value="principles" className="space-y-6 mt-6">
            <WorkPrinciplesEditor
              savedValue={homeContentList?.find((c: any) => c.key === "work_principles")?.value}
            />
          </TabsContent>

          <TabsContent value="availability" className="space-y-6 mt-6">
            <Card className="bg-card border-foreground/10">
              <CardHeader>
                <CardTitle className="text-foreground-strong flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-neon-lime" />
                  Badge de Disponibilidade
                </CardTitle>
                <p className="text-foreground/65 text-sm">
                  Controla o badge exibido na home indicando disponibilidade para novos projetos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-foreground/5 rounded-lg border border-foreground/10">
                  <div>
                    <p className="text-foreground-strong font-medium">Status de disponibilidade</p>
                    <p className="text-foreground/65 text-sm mt-1">
                      {availabilityEnabled
                        ? "Badge visível na home (disponível)"
                        : "Badge oculto na home (indisponível)"}
                    </p>
                  </div>
                  <Switch
                    checked={availabilityEnabled}
                    onCheckedChange={setAvailabilityEnabled}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground-strong">Mensagem (Português)</Label>
                    <Input
                      value={availabilityLabelPT}
                      onChange={(e) => setAvailabilityLabelPT(e.target.value)}
                      placeholder="disponível para novos projetos"
                      className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground-strong">Mensagem (English)</Label>
                    <Input
                      value={availabilityLabelEN}
                      onChange={(e) => setAvailabilityLabelEN(e.target.value)}
                      placeholder="available for new projects"
                      className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                    />
                  </div>
                </div>

                {availabilityEnabled && (
                  <div className="p-4 bg-neon-lime/5 border border-neon-lime/20 rounded-lg">
                    <p className="text-neon-lime text-xs font-mono mb-2">Preview:</p>
                    <div className="inline-flex items-center px-4 py-1.5 bg-neon-lime/10 border border-neon-lime/30 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-neon-lime mr-2" />
                      <span className="text-neon-lime text-sm font-mono">
                        {availabilityLabelPT || "disponível para novos projetos"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAvailability}
                    className="bg-neon-purple hover:bg-neon-purple/90 text-white"
                  >
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-background border-foreground/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground-strong">
                {editingItem ? "Editar" : "Adicionar"} Serviço
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de edição</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground-strong">Título</Label>
                <Input
                  name="title"
                  defaultValue={editingItem?.titleTranslations?.ptBR || editingItem?.title}
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground-strong">Descrição</Label>
                <Textarea
                  name="description"
                  defaultValue={editingItem?.descriptionTranslations?.ptBR || editingItem?.description}
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-foreground/65">Cancelar</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          if (deleteTarget?.type === "service") {
            await removeService({ id: deleteTarget.id as Id<"services"> });
            toast.success('Item excluído');
          }
        }}
        onPermanentDelete={isRoot ? async () => {
          if (deleteTarget?.type === "service") {
            await permanentDeleteService({ id: deleteTarget.id as Id<"services"> });
            toast.success('Item excluído permanentemente');
          }
        } : undefined}
      />
      </div>
    </AdminLayout>
  );
}
