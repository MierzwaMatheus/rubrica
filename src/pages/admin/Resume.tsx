import React, { useState } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Pencil, Loader2, Check, X, RotateCcw, ShieldAlert } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";
import { useIsRoot } from "@/hooks/useIsRoot";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type ResumeType = "soft_skill" | "experience" | "education" | "skill" | "language" | "course" | "volunteer";

interface ResumeItem {
  _id: Id<"resumeItems">;
  type: ResumeType;
  content: any;
  contentTranslations?: { enUS?: any; ptBR?: any };
  orderIndex: number;
}

// Sortable Item Component for Simple Lists
function SortableSimpleItem({
  id,
  text,
  isEditing,
  editingText,
  onEdit,
  onSave,
  onCancel,
  onTextChange,
  onDelete,
  onRestore,
  isDeleted
}: {
  id: Id<"resumeItems">,
  text: string,
  isEditing: boolean,
  editingText: string,
  onEdit: (id: Id<"resumeItems">) => void,
  onSave: (id: Id<"resumeItems">) => void,
  onCancel: () => void,
  onTextChange: (text: string) => void,
  onDelete: (id: Id<"resumeItems">) => void,
  onRestore: (id: Id<"resumeItems">) => void,
  isDeleted?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card border border-foreground/10 p-3 rounded-md">
        <Input
          value={editingText}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(id);
            else if (e.key === 'Escape') onCancel();
          }}
          className="flex-1 bg-foreground/5 border-foreground/10 text-foreground-strong"
          autoFocus
        />
        <Button variant="ghost" size="icon" onClick={() => onSave(id)} className="text-green-400 hover:text-green-300 hover:bg-green-400/10">
          <Check className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-foreground/65 hover:text-foreground/90 hover:bg-gray-400/10">
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-card border p-3 rounded-md group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
      {!isDeleted && (
        <div {...attributes} {...listeners} className="cursor-move text-foreground/42 hover:text-foreground-strong">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <span className="flex-1 text-foreground-strong">{text}</span>
      {isDeleted && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
          <ShieldAlert className="w-3 h-3" />Deletado
        </div>
      )}
      {!isDeleted && (
        <Button variant="ghost" size="icon" onClick={() => onEdit(id)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      {isDeleted ? (
        <button onClick={() => onRestore(id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors opacity-0 group-hover:opacity-100" title="Restaurar">
          <RotateCcw className="w-4 h-4" />
        </button>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function SortableExperienceCard({ item, onEdit, onDelete, onRestore }: { item: ResumeItem, onEdit: (item: ResumeItem) => void, onDelete: (id: Id<"resumeItems">) => void, onRestore: (id: Id<"resumeItems">) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isDeleted = !!(item as any).deletedAt;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-foreground-strong flex items-center gap-2">
            {!isDeleted && <div {...attributes} {...listeners} className="cursor-move"><GripVertical className="w-4 h-4 text-foreground/42 hover:text-foreground-strong" /></div>}
            <div className="flex flex-col gap-1">
              {item.content.role}
              {isDeleted && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit">
                  <ShieldAlert className="w-3 h-3" />Deletado
                </div>
              )}
            </div>
          </CardTitle>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDeleted && <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="w-4 h-4 text-blue-400" /></Button>}
            {isDeleted ? (
              <button onClick={() => onRestore(item._id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Restaurar"><RotateCcw className="w-4 h-4" /></button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-neon-lime text-sm mb-2">{item.content.company} | {item.content.period}</p>
          <p className="text-foreground/65 text-sm line-clamp-2">{item.content.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableEducationCard({ item, onEdit, onDelete, onRestore }: { item: ResumeItem, onEdit: (item: ResumeItem) => void, onDelete: (id: Id<"resumeItems">) => void, onRestore: (id: Id<"resumeItems">) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isDeleted = !!(item as any).deletedAt;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-foreground-strong flex items-center gap-2">
            {!isDeleted && <div {...attributes} {...listeners} className="cursor-move"><GripVertical className="w-4 h-4 text-foreground/42 hover:text-foreground-strong" /></div>}
            <div className="flex flex-col gap-1">
              {item.content.degree}
              {isDeleted && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit">
                  <ShieldAlert className="w-3 h-3" />Deletado
                </div>
              )}
            </div>
          </CardTitle>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDeleted && <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="w-4 h-4 text-blue-400" /></Button>}
            {isDeleted ? (
              <button onClick={() => onRestore(item._id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Restaurar"><RotateCcw className="w-4 h-4" /></button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-neon-lime text-sm mb-2">{item.content.institution} | {item.content.period}</p>
          <p className="text-foreground/65 text-sm line-clamp-2">{item.content.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableSkillCard({ item, onEdit, onDelete, onRestore }: { item: ResumeItem, onEdit: (item: ResumeItem) => void, onDelete: (id: Id<"resumeItems">) => void, onRestore: (id: Id<"resumeItems">) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isDeleted = !!(item as any).deletedAt;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isDeleted && <div {...attributes} {...listeners} className="cursor-move"><GripVertical className="w-4 h-4 text-foreground/42 hover:text-foreground-strong" /></div>}
            <div>
              <h4 className="text-foreground-strong font-medium">
                {item.content.name}
                {item.content.group && (
                  <span className="ml-2 text-xs font-normal text-foreground/42">· {item.content.group}</span>
                )}
              </h4>
              {isDeleted && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit mt-1">
                  <ShieldAlert className="w-3 h-3" />Deletado
                </div>
              )}
              {!isDeleted && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-32 h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-lime" style={{ width: `${item.content.level}%` }} />
                  </div>
                  <span className="text-neon-lime text-sm font-medium">{item.content.level}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDeleted && <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="w-4 h-4 text-blue-400" /></Button>}
            {isDeleted ? (
              <button onClick={() => onRestore(item._id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Restaurar"><RotateCcw className="w-4 h-4" /></button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableLanguageCard({ item, onEdit, onDelete, onRestore }: { item: ResumeItem, onEdit: (item: ResumeItem) => void, onDelete: (id: Id<"resumeItems">) => void, onRestore: (id: Id<"resumeItems">) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isDeleted = !!(item as any).deletedAt;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isDeleted && <div {...attributes} {...listeners} className="cursor-move"><GripVertical className="w-4 h-4 text-foreground/42 hover:text-foreground-strong" /></div>}
            <div>
              <h4 className="text-foreground-strong font-medium">{item.content.name}</h4>
              <p className="text-neon-lime text-sm">{item.content.level}</p>
              {isDeleted && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit mt-1">
                  <ShieldAlert className="w-3 h-3" />Deletado
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDeleted && <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="w-4 h-4 text-blue-400" /></Button>}
            {isDeleted ? (
              <button onClick={() => onRestore(item._id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors" title="Restaurar"><RotateCcw className="w-4 h-4" /></button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminResume() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const itemsData = useQuery(api.resumeItems.listAll, { includeDeleted: isRoot && includeDeleted }) as ResumeItem[] | undefined;
  const createItem = useMutation(api.resumeItems.create);
  const updateItem = useMutation(api.resumeItems.update);
  const removeItem = useMutation(api.resumeItems.remove);
  const permanentDeleteItem = useMutation(api.resumeItems.permanentDelete);
  const restoreItem = useMutation(api.resumeItems.restore);
  const reorderItems = useMutation(api.resumeItems.reorder);

  const { translateFields, isTranslating } = useTranslateContent();
  const items = itemsData ?? [];
  const isLoading = itemsData === undefined;

  // Simple inputs state
  const [newCourse, setNewCourse] = useState("");
  const [newVolunteer, setNewVolunteer] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");

  // Simple item editing state
  const [editingSimpleItemId, setEditingSimpleItemId] = useState<Id<"resumeItems"> | null>(null);
  const [editingSimpleText, setEditingSimpleText] = useState("");
  const [editingSimpleType, setEditingSimpleType] = useState<ResumeType | null>(null);

  const [activeModal, setActiveModal] = useState<ResumeType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"resumeItems"> | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeItem | null>(null);
  const [skillLevel, setSkillLevel] = useState<number[]>([50]);
  const [languageLevel, setLanguageLevel] = useState<string>("");
  const [experienceDescription, setExperienceDescription] = useState<string>("");
  const [educationDescription, setEducationDescription] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenModal = (type: ResumeType, item: ResumeItem | null = null) => {
    setActiveModal(type);
    setEditingItem(item);
    if (type === "skill" && item?.content.level) {
      setSkillLevel([Number(item.content.level)]);
    } else if (type === "skill") {
      setSkillLevel([50]);
    }
    if (type === "language" && item?.content.level) {
      setLanguageLevel(item.content.level);
    } else if (type === "language") {
      setLanguageLevel("");
    }
    if (type === "experience") {
      setExperienceDescription(item?.content.description || "");
    }
    if (type === "education") {
      setEducationDescription(item?.content.description || "");
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setSkillLevel([50]);
    setLanguageLevel("");
    setExperienceDescription("");
    setEducationDescription("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const content: any = {};

    formData.forEach((value, key) => {
      content[key] = value;
    });

    if (activeModal === "skill") {
      content.level = skillLevel[0].toString();
      // grupo vazio não é salvo: a habilidade cai no grupo padrão "Stack"
      if (typeof content.group === "string") content.group = content.group.trim();
      if (!content.group) delete content.group;
    }
    if (activeModal === "language" && languageLevel) {
      content.level = languageLevel;
    }
    if (activeModal === "experience") {
      content.description = experienceDescription;
    }
    if (activeModal === "education") {
      content.description = educationDescription;
    }

    try {
      let contentEN = { ...content };

      const existingPT = editingItem?.contentTranslations?.ptBR ?? {};
      const existingEN = editingItem?.contentTranslations?.enUS ?? {};

      const makeExistingMap = (keys: string[]) =>
        Object.fromEntries(keys.map(k => [k, existingPT[k] != null ? { ptBR: existingPT[k], enUS: existingEN[k] } : undefined]));

      if (activeModal === 'experience') {
        const fields: Record<string, string> = {};
        if (content.role) fields.role = content.role;
        if (content.description) fields.description = content.description;
        const changed = editingItem ? getChangedTranslatableFields(fields, makeExistingMap(['role', 'description'])) : fields;
        if (Object.keys(changed).length > 0) {
          const toastId = toast.loading('Traduzindo conteúdo...');
          const translated = await translateFields(changed);
          toast.dismiss(toastId);
          contentEN = { ...content, role: translated.role ?? existingEN.role ?? content.role, description: translated.description ?? existingEN.description ?? content.description };
        } else {
          contentEN = { ...content, role: existingEN.role ?? content.role, description: existingEN.description ?? content.description };
        }
      } else if (activeModal === 'education') {
        const fields: Record<string, string> = {};
        if (content.degree) fields.degree = content.degree;
        if (content.description) fields.description = content.description;
        const changed = editingItem ? getChangedTranslatableFields(fields, makeExistingMap(['degree', 'description'])) : fields;
        if (Object.keys(changed).length > 0) {
          const toastId = toast.loading('Traduzindo conteúdo...');
          const translated = await translateFields(changed);
          toast.dismiss(toastId);
          contentEN = { ...content, degree: translated.degree ?? existingEN.degree ?? content.degree, description: translated.description ?? existingEN.description ?? content.description };
        } else {
          contentEN = { ...content, degree: existingEN.degree ?? content.degree, description: existingEN.description ?? content.description };
        }
      } else if (activeModal === 'skill') {
        const fields: Record<string, string> = {};
        if (content.name) fields.name = content.name;
        const changed = editingItem ? getChangedTranslatableFields(fields, makeExistingMap(['name'])) : fields;
        if (Object.keys(changed).length > 0) {
          const toastId = toast.loading('Traduzindo conteúdo...');
          const translated = await translateFields(changed);
          toast.dismiss(toastId);
          contentEN = { ...content, name: translated.name ?? existingEN.name ?? content.name };
        } else {
          contentEN = { ...content, name: existingEN.name ?? content.name };
        }
      }
      // language: name é substantivo próprio, level é enum — não traduzir
      const contentTranslations = { ptBR: content, enUS: contentEN };

      if (editingItem) {
        await updateItem({
          id: editingItem._id,
          content,
          contentTranslations,
          orderIndex: editingItem.orderIndex,
        });
        toast.success("Item atualizado com sucesso");
      } else {
        const orderIndex = items.filter(i => i.type === activeModal).length;
        await createItem({
          type: activeModal,
          content,
          contentTranslations,
          orderIndex,
        });
        toast.success("Item criado com sucesso");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Erro ao salvar item");
    }
  };

  const handleDelete = (id: Id<"resumeItems">) => {
    setDeleteTarget(id);
  };

  const handleRestore = async (id: Id<"resumeItems">) => {
    try {
      await restoreItem({ id });
      toast.success('Item restaurado com sucesso');
    } catch (error) {
      toast.error('Erro ao restaurar item');
    }
  };

  const handleAddSimpleItem = async (type: ResumeType) => {
    let text = "";
    if (type === 'course') {
      text = newCourse;
      setNewCourse("");
    } else if (type === 'volunteer') {
      text = newVolunteer;
      setNewVolunteer("");
    } else if (type === 'soft_skill') {
      text = newSoftSkill;
      setNewSoftSkill("");
    }

    if (!text.trim()) return;

    try {
      const toastId = toast.loading('Traduzindo conteúdo...');
      const translated = await translateFields({ text });
      toast.dismiss(toastId);
      const content = { text };
      const contentTranslations = { ptBR: text, enUS: translated.text };
      const orderIndex = items.filter(i => i.type === type).length;
      await createItem({
        type,
        content,
        contentTranslations,
        orderIndex,
      });
      toast.success("Item adicionado com sucesso");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Erro ao adicionar item");
    }
  };

  const handleEditSimpleItem = (id: Id<"resumeItems">, type: ResumeType, currentText: string) => {
    setEditingSimpleItemId(id);
    setEditingSimpleText(currentText);
    setEditingSimpleType(type);
  };

  const handleCancelSimpleEdit = () => {
    setEditingSimpleItemId(null);
    setEditingSimpleText("");
    setEditingSimpleType(null);
  };

  const handleSaveSimpleItem = async (id: Id<"resumeItems">) => {
    if (!editingSimpleType || !editingSimpleText.trim()) {
      handleCancelSimpleEdit();
      return;
    }

    try {
      const target = items.find(i => i._id === id);
      const savedText = (typeof target?.contentTranslations?.ptBR === 'string'
        ? target.contentTranslations.ptBR
        : target?.content?.text) ?? '';
      const savedEN = (typeof target?.contentTranslations?.enUS === 'string'
        ? target.contentTranslations.enUS
        : '') ?? '';
      const newText = editingSimpleText.trim();

      let translatedText: string;
      if (newText !== savedText.trim()) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        const translated = await translateFields({ text: newText });
        toast.dismiss(toastId);
        translatedText = translated.text;
      } else {
        translatedText = savedEN || newText;
      }

      const content = { text: newText };
      const contentTranslations = { ptBR: newText, enUS: translatedText };
      await updateItem({
        id,
        content,
        contentTranslations,
        orderIndex: target?.orderIndex ?? 0,
      });
      toast.success("Item atualizado com sucesso");
      handleCancelSimpleEdit();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Erro ao atualizar item");
    }
  };

  const handleDragEnd = async (event: DragEndEvent, type: ResumeType) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const typeItems = items.filter(i => i.type === type).sort((a, b) => a.orderIndex - b.orderIndex);
      const oldIndex = typeItems.findIndex((item) => item._id === active.id);
      const newIndex = typeItems.findIndex((item) => item._id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(typeItems, oldIndex, newIndex);
      const reorderPayload = newOrder.map((item, index) => ({ id: item._id, orderIndex: index }));

      try {
        await reorderItems({ items: reorderPayload });
        toast.success("Ordem atualizada com sucesso");
      } catch (error) {
        console.error("Error reordering items:", error);
        toast.error("Erro ao reordenar itens");
      }
    }
  };

  const getItemsByType = (type: ResumeType) => items.filter(i => i.type === type).sort((a, b) => a.orderIndex - b.orderIndex);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground-strong">Currículo</h1>
            <p className="text-foreground/65">Gerencie suas experiências, formação e habilidades</p>
          </div>
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
        </div>

        <Tabs defaultValue="experience" className="w-full">
          <TabsList className="bg-foreground/5 border border-foreground/10 w-full justify-start overflow-x-auto">
            <TabsTrigger value="experience">Experiência</TabsTrigger>
            <TabsTrigger value="education">Formação</TabsTrigger>
            <TabsTrigger value="skill">Habilidades</TabsTrigger>
            <TabsTrigger value="soft_skill">Soft Skills</TabsTrigger>
            <TabsTrigger value="course">Cursos</TabsTrigger>
            <TabsTrigger value="language">Idiomas</TabsTrigger>
            <TabsTrigger value="volunteer">Voluntariado</TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("experience")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Experiência
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'experience')}>
              <SortableContext items={getItemsByType("experience").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {getItemsByType("experience").map(item => (
                    <SortableExperienceCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("experience", item)}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="education" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("education")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Formação
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'education')}>
              <SortableContext items={getItemsByType("education").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {getItemsByType("education").map(item => (
                    <SortableEducationCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("education", item)}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="skill" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("skill")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Habilidade
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'skill')}>
              <SortableContext items={getItemsByType("skill").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getItemsByType("skill").map(item => (
                    <SortableSkillCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("skill", item)}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="soft_skill" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma soft skill..."
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('soft_skill')}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
              <Button onClick={() => handleAddSimpleItem('soft_skill')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'soft_skill')}>
              <SortableContext items={getItemsByType("soft_skill").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("soft_skill").map((item) => (
                    <SortableSimpleItem
                      key={item._id}
                      id={item._id}
                      text={item.content.text}
                      isEditing={editingSimpleItemId === item._id}
                      editingText={editingSimpleText}
                      onEdit={(id) => handleEditSimpleItem(id, "soft_skill", item.content.text)}
                      onSave={handleSaveSimpleItem}
                      onCancel={handleCancelSimpleEdit}
                      onTextChange={setEditingSimpleText}
                      onDelete={(id) => handleDelete(id)}
                      onRestore={handleRestore}
                      isDeleted={!!(item as any).deletedAt}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="course" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome do curso e instituição..."
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('course')}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
              <Button onClick={() => handleAddSimpleItem('course')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'course')}>
              <SortableContext items={getItemsByType("course").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("course").map((item) => (
                    <SortableSimpleItem
                      key={item._id}
                      id={item._id}
                      text={item.content.text}
                      isEditing={editingSimpleItemId === item._id}
                      editingText={editingSimpleText}
                      onEdit={(id) => handleEditSimpleItem(id, "course", item.content.text)}
                      onSave={handleSaveSimpleItem}
                      onCancel={handleCancelSimpleEdit}
                      onTextChange={setEditingSimpleText}
                      onDelete={(id) => handleDelete(id)}
                      onRestore={handleRestore}
                      isDeleted={!!(item as any).deletedAt}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="language" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenModal("language")} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Idioma
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'language')}>
              <SortableContext items={getItemsByType("language").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getItemsByType("language").map(item => (
                    <SortableLanguageCard
                      key={item._id}
                      item={item}
                      onEdit={(item) => handleOpenModal("language", item)}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="volunteer" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o cargo, organização e período..."
                value={newVolunteer}
                onChange={(e) => setNewVolunteer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimpleItem('volunteer')}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
              <Button onClick={() => handleAddSimpleItem('volunteer')} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'volunteer')}>
              <SortableContext items={getItemsByType("volunteer").map(i => i._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {getItemsByType("volunteer").map((item) => (
                    <SortableSimpleItem
                      key={item._id}
                      id={item._id}
                      text={item.content.text}
                      isEditing={editingSimpleItemId === item._id}
                      editingText={editingSimpleText}
                      onEdit={(id) => handleEditSimpleItem(id, "volunteer", item.content.text)}
                      onSave={handleSaveSimpleItem}
                      onCancel={handleCancelSimpleEdit}
                      onTextChange={setEditingSimpleText}
                      onDelete={(id) => handleDelete(id)}
                      onRestore={handleRestore}
                      isDeleted={!!(item as any).deletedAt}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

        </Tabs>

        <Dialog open={!!activeModal} onOpenChange={() => handleCloseModal()}>
          <DialogContent className="bg-background border-foreground/10 max-w-2xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
              <DialogTitle className="text-foreground-strong">
                {editingItem ? "Editar" : "Adicionar"} {
                  activeModal === "experience" ? "Experiência" :
                    activeModal === "education" ? "Formação" :
                      activeModal === "skill" ? "Habilidade" :
                        activeModal === "language" ? "Idioma" : "Item"
                }
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de currículo</h2>
              </VisuallyHidden>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 px-6">
              <form onSubmit={handleSave} className="space-y-4 pb-4" id="resume-form">
                {activeModal === "experience" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground-strong">Cargo</Label>
                        <Input name="role" defaultValue={editingItem?.content.role} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground-strong">Empresa</Label>
                        <Input name="company" defaultValue={editingItem?.content.company} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Período</Label>
                      <Input name="period" defaultValue={editingItem?.content.period} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Descrição</Label>
                      <RichTextEditor
                        content={experienceDescription}
                        onChange={setExperienceDescription}
                      />
                    </div>
                  </>
                )}

                {activeModal === "education" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground-strong">Curso/Grau</Label>
                        <Input name="degree" defaultValue={editingItem?.content.degree} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground-strong">Instituição</Label>
                        <Input name="institution" defaultValue={editingItem?.content.institution} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Período</Label>
                      <Input name="period" defaultValue={editingItem?.content.period} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Descrição</Label>
                      <RichTextEditor
                        content={educationDescription}
                        onChange={setEducationDescription}
                      />
                    </div>
                  </>
                )}

                {activeModal === "skill" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Nome da Habilidade</Label>
                      <Input name="name" defaultValue={editingItem?.content.name} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Grupo</Label>
                      <Input
                        name="group"
                        defaultValue={editingItem?.content.group}
                        placeholder="Ex.: IA, Front-end, Infra"
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                      />
                      <p className="text-xs text-foreground/42">
                        Agrupa a stack no currículo. Sem grupo, a habilidade aparece em "Stack".
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-foreground-strong">Nível de Domínio</Label>
                        <span className="text-neon-lime text-sm font-medium">{skillLevel[0]}%</span>
                      </div>
                      <Slider
                        value={skillLevel}
                        onValueChange={setSkillLevel}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {activeModal === "language" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Idioma</Label>
                      <Input name="name" defaultValue={editingItem?.content.name} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Nível</Label>
                      <Select value={languageLevel} onValueChange={setLanguageLevel} required>
                        <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground-strong w-full">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-foreground/10">
                          <SelectItem value="Básico" className="text-foreground-strong focus:bg-foreground/10">Básico</SelectItem>
                          <SelectItem value="Intermediário" className="text-foreground-strong focus:bg-foreground/10">Intermediário</SelectItem>
                          <SelectItem value="Avançado" className="text-foreground-strong focus:bg-foreground/10">Avançado</SelectItem>
                          <SelectItem value="Fluente" className="text-foreground-strong focus:bg-foreground/10">Fluente</SelectItem>
                          <SelectItem value="Nativo" className="text-foreground-strong focus:bg-foreground/10">Nativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

              </form>
            </div>
            <div className="flex justify-end gap-2 pt-4 pb-6 px-6 border-t border-foreground/10 shrink-0">
              <Button type="button" variant="ghost" onClick={handleCloseModal} className="text-foreground/65">Cancelar</Button>
              <Button type="submit" form="resume-form" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await removeItem({ id: deleteTarget! });
          toast.success('Item excluído');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDeleteItem({ id: deleteTarget! });
          toast.success('Item excluído permanentemente');
        } : undefined}
      />
      </div>
    </AdminLayout>
  );
}
