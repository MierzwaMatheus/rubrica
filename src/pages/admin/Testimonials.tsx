import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, FileText, Check, X, RotateCcw, Globe, Loader2, Home, EyeOff, Plus, ChevronDown, ChevronUp, Pencil, Trash2, ImageIcon, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsRoot } from "@/hooks/useIsRoot";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";

type SubmissionStatus = "pending" | "approved" | "rejected" | "published";
type ActiveTab = SubmissionStatus | "all" | "diretos";

const TABS: { value: ActiveTab; label: string }[] = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
  { value: "published", label: "Publicados" },
  { value: "diretos", label: "Diretos" },
];

function VideoUsageBar() {
  const usage = useQuery(api.testimonialSubmissions.getDailyVideoUsage);

  if (!usage) return null;

  const percent = Math.min(100, (usage.usedMB / usage.limitMB) * 100);
  const color =
    percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-yellow-500" : "bg-neon-lime";

  return (
    <div className="flex items-center gap-3 text-sm text-foreground/65">
      <span className="flex-shrink-0">
        Vídeos hoje: {usage.usedMB} MB / {usage.limitMB} MB
      </span>
      <div className="flex-1 max-w-48 bg-foreground/10 rounded-full h-1.5">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface Submission {
  _id: Id<"testimonialSubmissions">;
  name: string;
  role: string;
  company?: string;
  email: string;
  type: "text" | "video";
  text?: string;
  videoUrl?: string | null;
  videoFileSize?: number;
  avatarUrl?: string | null;
  imageUrl?: string;
  status: SubmissionStatus;
  testimonialId?: Id<"testimonials">;
  createdAt: number;
}

function SubmissionCard({ item }: { item: Submission }) {
  const approveMutation = useMutation(api.testimonialSubmissions.approve);
  const rejectMutation = useMutation(api.testimonialSubmissions.reject);
  const restoreMutation = useMutation(api.testimonialSubmissions.restore);
  const publishAction = useAction(api.testimonialSubmissions.publishAndTranslate);
  const approveAndPublishAction = useAction(api.testimonialSubmissions.approveAndPublishAndTranslate);
  const unpublishMutation = useMutation(api.testimonials.unpublish);
  const toggleShowOnHomeMutation = useMutation(api.testimonials.toggleShowOnHome);

  const testimonialDoc = useQuery(
    api.testimonials.getById,
    item.testimonialId ? { id: item.testimonialId } : "skip",
  );

  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<unknown>) {
    setLoading(action);
    try {
      await fn();
      toast.success(
        action === "approve" ? "Aprovado com sucesso" :
        action === "reject" ? "Rejeitado" :
        action === "publish" ? "Publicado e traduzido!" :
        action === "approveAndPublish" ? "Aprovado, publicado e traduzido!" :
        action === "unpublish" ? "Despublicado — voltou para aprovados" :
        action === "toggleHome" ? (testimonialDoc?.showOnHome ? "Removido da home" : "Exibindo na home!") :
        "Restaurado para pendente",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  const initials = item.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const createdAt = new Date(item.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-muted border border-foreground/5 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {(item.avatarUrl || item.imageUrl) ? (
            <img
              src={item.avatarUrl ?? item.imageUrl}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover border border-foreground/10 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground-strong text-sm">{item.name}</p>
            <p className="text-xs text-foreground/65">
              {item.role}
              {item.company ? ` · ${item.company}` : ""}
            </p>
            <p className="text-xs text-foreground/25">{item.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            className={cn(
              "text-xs border",
              item.type === "video"
                ? "bg-neon-purple/20 text-neon-purple border-neon-purple/30"
                : "bg-blue-900/30 text-blue-400 border-blue-800/50",
            )}
          >
            {item.type === "video" ? (
              <><Video className="w-3 h-3 mr-1 inline" />Vídeo</>
            ) : (
              <><FileText className="w-3 h-3 mr-1 inline" />Texto</>
            )}
          </Badge>
          <span className="text-xs text-foreground/25">{createdAt}</span>
        </div>
      </div>

      {item.type === "text" && item.text && (
        <p className="text-sm text-foreground/90 italic leading-relaxed border-l-2 border-foreground/10 pl-3">
          "{item.text}"
        </p>
      )}

      {item.type === "video" && item.videoUrl && (
        <video
          src={item.videoUrl}
          controls
          className="w-full rounded-lg max-h-48 bg-black"
        />
      )}

      {item.type === "video" && !item.videoUrl && item.status === "rejected" && (
        <p className="text-xs text-foreground/25 italic">Vídeo removido do storage</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {item.status === "pending" && (
          <>
            {item.type === "text" && (
              <Button
                size="sm"
                onClick={() => run("approveAndPublish", () => approveAndPublishAction({ id: item._id }))}
                disabled={loading !== null}
                className="bg-neon-lime text-black hover:bg-neon-lime/90 text-xs font-semibold"
              >
                {loading === "approveAndPublish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Globe className="w-3 h-3 mr-1" />Aprovar e Publicar</>}

              </Button>
            )}
            <Button
              size="sm"
              onClick={() => run("approve", () => approveMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-green-700 text-green-400 hover:bg-green-900/20 text-xs"
            >
              {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Só Aprovar</>}
            </Button>
            <Button
              size="sm"
              onClick={() => run("reject", () => rejectMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Rejeitar</>}
            </Button>
          </>
        )}

        {item.status === "approved" && (
          <>
            {item.type === "text" && (
              <Button
                size="sm"
                onClick={() => run("publish", () => publishAction({ id: item._id }))}
                disabled={loading !== null}
                className="bg-neon-lime text-black hover:bg-neon-lime/90 text-xs font-semibold"
              >
                {loading === "publish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Globe className="w-3 h-3 mr-1" />Publicar</>}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => run("reject", () => rejectMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Rejeitar</>}
            </Button>
          </>
        )}

        {item.status === "rejected" && (
          <Button
            size="sm"
            onClick={() => run("restore", () => restoreMutation({ id: item._id }))}
            disabled={loading !== null}
            variant="outline"
            className="border-foreground/15 text-foreground/65 hover:bg-gray-900/20 text-xs"
          >
            {loading === "restore" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" />Restaurar</>}
          </Button>
        )}

        {item.status === "published" && (
          <>
            {item.testimonialId && (
              <Button
                size="sm"
                onClick={() => run("toggleHome", () => toggleShowOnHomeMutation({ id: item.testimonialId! }))}
                disabled={loading !== null}
                variant="outline"
                className={cn(
                  "text-xs",
                  testimonialDoc?.showOnHome
                    ? "border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10"
                    : "border-foreground/15 text-foreground/65 hover:bg-gray-900/20",
                )}
              >
                {loading === "toggleHome" ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                  testimonialDoc?.showOnHome
                    ? <><EyeOff className="w-3 h-3 mr-1" />Remover da home</>
                    : <><Home className="w-3 h-3 mr-1" />Exibir na home</>
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => run("unpublish", () => unpublishMutation({ submissionId: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20 text-xs"
            >
              {loading === "unpublish" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" />Despublicar</>}
            </Button>
            <Button
              size="sm"
              onClick={() => run("reject", () => rejectMutation({ id: item._id }))}
              disabled={loading !== null}
              variant="outline"
              className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs"
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Rejeitar</>}
            </Button>
            <Badge className="bg-neon-lime/20 text-neon-lime border border-neon-lime/30 text-xs">
              <Globe className="w-3 h-3 mr-1 inline" />Publicado
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}

const MAX_AVATAR_MB = 1;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

function AdminCreateForm() {
  const createMutation = useMutation(api.testimonials.createWithAvatar);
  const generateAvatarUrl = useMutation(api.testimonialSubmissions.generateAvatarUploadUrl);
  const { translateFields } = useTranslateContent();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(`A foto deve ter no máximo ${MAX_AVATAR_MB} MB`);
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function reset() {
    setName(""); setRole(""); setText(""); setCategory("");
    setAvatarFile(null); setAvatarPreview(null);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !text.trim()) return;
    setSaving(true);
    try {
      let avatarStorageId: string | undefined;
      let avatarFileSize: number | undefined;
      if (avatarFile) {
        const uploadUrl = await generateAvatarUrl({ fileSizeBytes: avatarFile.size });
        const res = await fetch(uploadUrl, { method: "POST", body: avatarFile });
        const { storageId } = await res.json();
        avatarStorageId = storageId;
        avatarFileSize = avatarFile.size;
      }
      const toastId = toast.loading("Traduzindo conteúdo...");
      const translated = await translateFields({ role: role.trim(), text: text.trim() });
      toast.dismiss(toastId);

      await createMutation({
        name: name.trim(),
        role: role.trim(),
        text: text.trim(),
        roleTranslations: { ptBR: role.trim(), enUS: translated.role ?? role.trim() },
        textTranslations: { ptBR: text.trim(), enUS: translated.text ?? text.trim() },
        avatarStorageId: avatarStorageId as any,
        avatarFileSize,
        category: category.trim() || undefined,
      });
      toast.success("Depoimento cadastrado!");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-muted border border-foreground/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground-strong hover:bg-foreground/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-neon-purple" />
          Cadastrar depoimento manualmente
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-foreground/65" /> : <ChevronDown className="w-4 h-4 text-foreground/65" />}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 border-t border-foreground/5 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/65">Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-9" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/65">Cargo / Empresa *</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: CTO na Acme" className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-9" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground/65">Categoria (opcional)</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Tecnologia, Marca e design" className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground/65">Depoimento *</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Texto do depoimento..." className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm min-h-[80px] resize-none" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground/65">Foto (opcional, máx. {MAX_AVATAR_MB} MB)</Label>
            <div className="flex items-center gap-3">
              {avatarPreview ? (
                <img src={avatarPreview} alt="preview" className="w-10 h-10 rounded-full object-cover border border-foreground/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-foreground/25" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-foreground/10 bg-foreground/5 text-xs text-foreground/90 hover:bg-foreground/10 transition-colors">
                  <ImageIcon className="w-3 h-3" />
                  {avatarPreview ? "Trocar foto" : "Adicionar foto"}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              {avatarPreview && (
                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="text-xs text-foreground/42 hover:text-foreground/90">
                  Remover
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-foreground/25">
            Criado diretamente como publicado. Use "Exibir na home" para mostrá-lo na seção da home.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="text-foreground/65 text-xs">Cancelar</Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-neon-purple hover:bg-neon-purple/90 text-white text-xs">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cadastrar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function DirectTestimonialsTab() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const testimonials = useQuery(api.testimonials.list, { includeDeleted: isRoot && includeDeleted });
  const toggleMutation = useMutation(api.testimonials.toggleShowOnHome);
  const removeMutation = useMutation(api.testimonials.remove);
  const permanentDeleteMutation = useMutation(api.testimonials.permanentDelete);
  const restoreMutation = useMutation(api.testimonials.restore);
  const updateMutation = useMutation(api.testimonials.update);
  const { translateFields } = useTranslateContent();

  const [editing, setEditing] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ roleTranslations?: any; textTranslations?: any } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(item: { _id: string; name: string; role: string; roleTranslations?: any; text: string; textTranslations?: any; category?: string }) {
    setEditCategory(item.category ?? "");
    setEditing(item._id);
    setEditingItem(item);
    setEditName(item.name);
    setEditRole(item.roleTranslations?.ptBR ?? item.role);
    setEditText(item.textTranslations?.ptBR ?? item.text);
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const changed = getChangedTranslatableFields(
        { role: editRole, text: editText },
        { role: editingItem?.roleTranslations, text: editingItem?.textTranslations },
      );

      let roleTranslations = editingItem?.roleTranslations;
      let textTranslations = editingItem?.textTranslations;

      if (Object.keys(changed).length > 0) {
        const toastId = toast.loading("Traduzindo conteúdo...");
        const translated = await translateFields(changed);
        toast.dismiss(toastId);
        if (changed.role !== undefined) {
          roleTranslations = { ptBR: editRole, enUS: translated.role ?? editingItem?.roleTranslations?.enUS ?? editRole };
        }
        if (changed.text !== undefined) {
          textTranslations = { ptBR: editText, enUS: translated.text ?? editingItem?.textTranslations?.enUS ?? editText };
        }
      }

      await updateMutation({
        id: id as any,
        name: editName,
        role: editRole,
        text: editText,
        roleTranslations,
        textTranslations,
        category: editCategory.trim(),
      });
      toast.success("Salvo!");
      setEditing(null);
      setEditingItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleMutation({ id: id as any });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  function handleDelete(id: string, name?: string) {
    setDeleteTarget({ id, name });
  }

  async function handleRestore(id: string) {
    try {
      await restoreMutation({ id: id as any });
      toast.success('Depoimento restaurado com sucesso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  }

  if (testimonials === undefined) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-foreground/42" /></div>;
  }

  if (testimonials.length === 0) {
    return <div className="text-center py-16 text-foreground/42 text-sm">Nenhum depoimento publicado ainda.</div>;
  }

  return (
    <>
    <div className="space-y-4">
      {isRoot && (
        <div className="flex justify-end">
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
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
      {testimonials.map((item) => {
        const initials = item.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
        const isEditing = editing === item._id;
        const isDeleted = !!(item as any).deletedAt;

        return (
          <div key={item._id} className={`bg-muted border rounded-xl p-5 space-y-3 ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/5'}`}>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/65">Nome</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/65">Cargo</Label>
                    <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/65">Categoria</Label>
                  <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Ex: Tecnologia, Marca e design" className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/65">Texto</Label>
                  <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-foreground/5 border-foreground/10 text-foreground-strong text-sm min-h-[72px] resize-none" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setEditingItem(null); }} className="text-foreground/65 text-xs">Cancelar</Button>
                  <Button size="sm" disabled={saving} onClick={() => handleSave(item._id)} className="bg-neon-purple hover:bg-neon-purple/90 text-white text-xs">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-foreground/10 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground-strong text-sm">{item.name}</p>
                      <p className="text-xs text-foreground/65">{(item as any).roleTranslations?.ptBR ?? item.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isDeleted && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
                        <ShieldAlert className="w-3 h-3" />Deletado
                      </div>
                    )}
                    {item.showOnHome && !isDeleted && (
                      <Badge className="bg-neon-lime/20 text-neon-lime border border-neon-lime/30 text-xs">
                        <Home className="w-3 h-3 mr-1 inline" />Na home
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 italic border-l-2 border-foreground/10 pl-3 leading-relaxed">
                  "{(item as any).textTranslations?.ptBR ?? item.text}"
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isDeleted && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleToggle(item._id)}
                        className={cn("text-xs", item.showOnHome ? "border-neon-lime/50 text-neon-lime hover:bg-neon-lime/10" : "border-foreground/15 text-foreground/65 hover:bg-gray-900/20")}>
                        {item.showOnHome ? <><EyeOff className="w-3 h-3 mr-1" />Remover da home</> : <><Home className="w-3 h-3 mr-1" />Exibir na home</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="border-foreground/15 text-foreground/65 hover:bg-gray-900/20 text-xs">
                        <Pencil className="w-3 h-3 mr-1" />Editar
                      </Button>
                    </>
                  )}
                  {isDeleted ? (
                    <Button size="sm" variant="outline" onClick={() => handleRestore(item._id)} className="border-green-700 text-green-400 hover:bg-green-900/20 text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" />Restaurar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleDelete(item._id, item.name)} className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />Excluir
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      </div>
    </div>

    <DeleteConfirmDialog
      open={deleteTarget !== null}
      onClose={() => setDeleteTarget(null)}
      itemName={deleteTarget?.name}
      onConfirm={async () => {
        await removeMutation({ id: deleteTarget!.id as any });
        toast.success('Depoimento excluído');
      }}
      onPermanentDelete={isRoot ? async () => {
        await permanentDeleteMutation({ id: deleteTarget!.id as any });
        toast.success('Depoimento excluído permanentemente');
      } : undefined}
    />
    </>
  );
}

export default function AdminTestimonials() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  const submissions = useQuery(
    api.testimonialSubmissions.list,
    activeTab === "all" || activeTab === "diretos" ? {} : { status: activeTab as SubmissionStatus },
  ) as Submission[] | undefined;

  const pendingSubmissions = useQuery(api.testimonialSubmissions.list, { status: "pending" });
  const pendingCount = pendingSubmissions?.length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground-strong">Depoimentos</h1>
            <p className="text-foreground/65 text-sm mt-1">
              Modere e publique depoimentos enviados por visitantes
            </p>
          </div>
          <VideoUsageBar />
        </div>

        <AdminCreateForm />

        <div className="flex gap-1 bg-foreground/5 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === tab.value
                  ? "bg-foreground/10 text-foreground-strong"
                  : "text-foreground/65 hover:text-foreground/90",
              )}
            >
              {tab.label}
              {tab.value === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 bg-neon-purple/40 text-neon-purple text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "diretos" ? (
          <DirectTestimonialsTab />
        ) : submissions === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/42" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-foreground/42">
            <p>Nenhum depoimento {activeTab === "pending" ? "pendente" : activeTab === "approved" ? "aprovado" : activeTab === "rejected" ? "rejeitado" : "publicado"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((item) => (
              <SubmissionCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
