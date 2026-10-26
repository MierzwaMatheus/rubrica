import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, X, Upload, Copy, Check, Search, RotateCcw, ShieldAlert } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CASE_STUDY_AI_PROMPT } from "@/constants/caseStudyPrompt";
import { metricFieldsToTranslate, buildTranslatedMetrics, type MetricText } from "@/utils/caseStudyMetrics";
import { testimonialFieldsToTranslate, buildTranslatedTestimonial, testimonialTargetLocale, type TestimonialLocale, type TestimonialText } from "@/utils/caseStudyTestimonial";

const ICON_SUGGESTIONS = [
  "Zap","Users","TrendingUp","Clock","BarChart2","Star","Globe","Code2",
  "Rocket","Shield","Database","Server","Cpu","Layers","GitBranch","CheckCircle",
  "Award","Target","Activity","Timer","Package","Lock","Smile","ThumbsUp",
];

function IconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const allIcons = search
    ? Object.keys(LucideIcons).filter(k => k.toLowerCase().includes(search.toLowerCase()) && typeof (LucideIcons as any)[k] === 'function').slice(0, 48)
    : ICON_SUGGESTIONS;

  const SelectedIcon = value ? (LucideIcons as any)[value] : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 text-foreground-strong rounded-md px-3 h-9 text-sm hover:bg-foreground/10 transition-colors min-w-[90px]"
      >
        {SelectedIcon ? <SelectedIcon className="w-4 h-4 text-neon-purple shrink-0" /> : <span className="text-foreground/42">Ícone</span>}
        {value && <span className="text-xs text-foreground/65 truncate max-w-[60px]">{value}</span>}
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-muted border border-foreground/10 rounded-xl shadow-2xl p-3 w-72">
          <div className="flex items-center gap-2 mb-3 bg-foreground/5 border border-foreground/10 rounded-lg px-2">
            <Search className="w-3 h-3 text-foreground/42 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ícone..."
              className="bg-transparent text-foreground-strong text-sm py-1.5 outline-none w-full placeholder-gray-500"
            />
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {allIcons.map(name => {
              const Icon = (LucideIcons as any)[name];
              if (!Icon) return null;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); setSearch(''); }}
                  className={`p-2 rounded-lg hover:bg-neon-purple/20 transition-colors flex items-center justify-center ${value === name ? 'bg-neon-purple/30 border border-neon-purple/50' : ''}`}
                >
                  <Icon className="w-4 h-4 text-foreground/90" />
                </button>
              );
            })}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="mt-2 w-full text-xs text-foreground/42 hover:text-red-400 transition-colors text-center"
            >
              Remover ícone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
import { ImagePicker } from "@/components/admin/ImagePicker";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ProjectTagsInput } from "@/components/admin/ProjectTagsInput";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";
import { useIsRoot } from "@/hooks/useIsRoot";

interface ProjectImage {
  _id: Id<"imageMetadata">;
  url: string | null;
  displayName?: string;
}

interface CaseStudyMetric {
  label: string;
  value: string;
  icon?: string;
}

interface Project {
  _id: Id<"projects">;
  title: string;
  titleTranslations?: { ptBR: string; enUS?: string };
  description: string;
  descriptionTranslations?: { ptBR: string; enUS?: string };
  longDescription?: string;
  longDescriptionTranslations?: { ptBR: string; enUS?: string };
  tags: string[];
  imageIds: Id<"imageMetadata">[];
  images: ProjectImage[];
  demoLink?: string;
  githubLink?: string;
  slug?: string;
  caseStudy?: {
    problem: string;
    solution: string;
    results: string;
    role?: string;
    context?: string;
    decisions?: string;
    learnings?: string;
    metrics: CaseStudyMetric[];
    testimonial?: { text: string; author: string; role?: string; lang?: TestimonialLocale };
  };
  caseStudyTranslations?: {
    ptBR?: CaseStudyTextFields;
    enUS?: CaseStudyTextFields;
  };
  category?: string;
  categoryTranslations?: { ptBR: string; enUS?: string };
  orderIndex: number;
}

type CaseStudyTextFields = {
  problem: string;
  solution: string;
  results: string;
  role?: string;
  context?: string;
  decisions?: string;
  learnings?: string;
  metrics?: MetricText[];
  testimonial?: TestimonialText;
};

// Sortable Project Card Component
function SortableProjectCard({
  project,
  onEdit,
  onDelete,
  onRestore
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: Id<"projects">, name: string) => void;
  onRestore: (id: Id<"projects">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const coverUrl = project.images?.[0]?.url || null;
  const isDeleted = !!(project as any).deletedAt;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`bg-card overflow-hidden group ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
        <div className="relative h-48">
          {coverUrl ? (
            <img src={coverUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-foreground/42">Sem imagem</div>
          )}
          <div className="absolute top-2 right-2 bg-background/60 px-2 py-1 rounded text-xs text-foreground-strong">
            {project.images?.length || 0} imagens
          </div>
          {!isDeleted && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => onEdit(project)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => onDelete(project._id, project.title)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          {isDeleted && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => onRestore(project._id)} className="text-green-400 hover:bg-green-400/10">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-foreground-strong flex justify-between items-start">
            <div className="flex flex-col gap-1">
              {project.title}
              {isDeleted && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit">
                  <ShieldAlert className="w-3 h-3" />
                  Deletado
                </div>
              )}
            </div>
            {!isDeleted && (
              <div {...attributes} {...listeners} className="cursor-move">
                <GripVertical className="w-5 h-5 text-foreground/42 hover:text-foreground-strong transition-colors" />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/65 text-sm line-clamp-2 mb-4">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-foreground/5 text-foreground/90 border-foreground/10">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Image Item Component
function SortableImageItem({
  img,
  index,
  onRemove
}: {
  img: { id: Id<"imageMetadata">; url: string | null };
  index: number;
  onRemove: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group aspect-video rounded-md overflow-hidden border border-foreground/10">
      {img.url ? (
        <img src={img.url} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-foreground/5" />
      )}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-background/60 text-foreground-strong p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      {index === 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/60 text-foreground-strong text-xs py-1 text-center">
          Capa
        </div>
      )}
    </div>
  );
}

export default function AdminProjects() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const projectsData = useQuery(api.projects.list, { includeDeleted: isRoot && includeDeleted }) as Project[] | undefined;
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);
  const permanentDeleteProject = useMutation(api.projects.permanentDelete);
  const restoreProject = useMutation(api.projects.restore);
  const reorderProjects = useMutation(api.projects.reorder);

  const search = useSearch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Atalhos "Novo ..." do painel/command palette chegam com ?create=true (issue #56)
  useEffect(() => {
    if (search.includes("create=true")) {
      setIsDialogOpen(true);
    }
  }, [search]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"projects">; name: string } | null>(null);
  // Track image picker selections as { id, url } pairs to render thumbnails locally
  const [projectImages, setProjectImages] = useState<{ id: Id<"imageMetadata">; url: string | null }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Case study state
  const [slug, setSlug] = useState('');
  const [caseStudyProblem, setCaseStudyProblem] = useState('');
  const [caseStudySolution, setCaseStudySolution] = useState('');
  const [caseStudyResults, setCaseStudyResults] = useState('');
  // Campos novos do case (opcionais) e categoria do projeto
  const [caseStudyRole, setCaseStudyRole] = useState('');
  const [caseStudyContext, setCaseStudyContext] = useState('');
  const [caseStudyDecisions, setCaseStudyDecisions] = useState('');
  const [caseStudyLearnings, setCaseStudyLearnings] = useState('');
  const [category, setCategory] = useState('');
  const [metrics, setMetrics] = useState<CaseStudyMetric[]>([]);
  const [testimonialEnabled, setTestimonialEnabled] = useState(false);
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialLang, setTestimonialLang] = useState<TestimonialLocale>('pt-BR');

  // JSON import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { translateFields, isTranslating } = useTranslateContent();
  const projects = projectsData ?? [];
  const isLoading = projectsData === undefined;

  const getProjectField = (project: Project, field: "title" | "description" | "longDescription"): string => {
    const translationsKey = `${field}Translations` as const;
    const translations = (project as any)[translationsKey];
    if (translations?.ptBR) return translations.ptBR;
    return ((project as any)[field] as string) || '';
  };

  const handleOpenDialog = (project: Project | null = null) => {
    setEditingProject(project);
    if (project) {
      const imgs = project.images
        .filter((img) => !!img)
        .map((img) => ({ id: img._id, url: img.url }));
      setProjectImages(imgs);
      setSelectedTags(project.tags || []);
      setSlug(project.slug || '');
      const cs = project.caseStudy;
      const csT = project.caseStudyTranslations?.ptBR;
      setCaseStudyProblem(csT?.problem ?? cs?.problem ?? '');
      setCaseStudySolution(csT?.solution ?? cs?.solution ?? '');
      setCaseStudyResults(csT?.results ?? cs?.results ?? '');
      setCaseStudyRole(csT?.role ?? cs?.role ?? '');
      setCaseStudyContext(csT?.context ?? cs?.context ?? '');
      setCaseStudyDecisions(csT?.decisions ?? cs?.decisions ?? '');
      setCaseStudyLearnings(csT?.learnings ?? cs?.learnings ?? '');
      setCategory(project.categoryTranslations?.ptBR ?? project.category ?? '');
      setMetrics(cs?.metrics ?? []);
      setTestimonialEnabled(!!cs?.testimonial);
      setTestimonialText(cs?.testimonial?.text ?? '');
      setTestimonialAuthor(cs?.testimonial?.author ?? '');
      setTestimonialRole(cs?.testimonial?.role ?? '');
      setTestimonialLang(cs?.testimonial?.lang ?? 'pt-BR');
    } else {
      setProjectImages([]);
      setSelectedTags([]);
      setSlug('');
      setCaseStudyProblem('');
      setCaseStudySolution('');
      setCaseStudyResults('');
      setCaseStudyRole('');
      setCaseStudyContext('');
      setCaseStudyDecisions('');
      setCaseStudyLearnings('');
      setCategory('');
      setMetrics([]);
      setTestimonialEnabled(false);
      setTestimonialText('');
      setTestimonialAuthor('');
      setTestimonialRole('');
      setTestimonialLang('pt-BR');
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const titlePT = formData.get('title') as string;
    const descriptionPT = formData.get('description') as string;
    const longDescriptionPT = formData.get('long_description') as string || '';

    try {
      const allFields: Record<string, string> = { title: titlePT, description: descriptionPT };
      if (longDescriptionPT) allFields.longDescription = longDescriptionPT;
      if (caseStudyProblem) allFields.caseStudyProblem = caseStudyProblem;
      if (caseStudySolution) allFields.caseStudySolution = caseStudySolution;
      if (caseStudyResults) allFields.caseStudyResults = caseStudyResults;
      if (caseStudyRole) allFields.caseStudyRole = caseStudyRole;
      if (caseStudyContext) allFields.caseStudyContext = caseStudyContext;
      if (caseStudyDecisions) allFields.caseStudyDecisions = caseStudyDecisions;
      if (caseStudyLearnings) allFields.caseStudyLearnings = caseStudyLearnings;
      if (category) allFields.category = category;

      const existingTranslations = {
        title: editingProject?.titleTranslations,
        description: editingProject?.descriptionTranslations,
        longDescription: editingProject?.longDescriptionTranslations,
      };

      const previousMetrics = editingProject?.caseStudy?.metrics;
      const previousEnMetrics = editingProject?.caseStudyTranslations?.enUS?.metrics;
      const changedFields = {
        ...(editingProject
          ? getChangedTranslatableFields(allFields, existingTranslations)
          : allFields),
        ...metricFieldsToTranslate(metrics, previousMetrics, previousEnMetrics),
      };

      let partialTranslated: Record<string, string> = {};
      if (Object.keys(changedFields).length > 0) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        partialTranslated = await translateFields(changedFields);
        toast.dismiss(toastId);
      }

      // Depoimento: traduzido do idioma em que foi escrito para o outro
      const testimonial = testimonialEnabled && testimonialText && testimonialAuthor
        ? { text: testimonialText, author: testimonialAuthor, role: testimonialRole || undefined, lang: testimonialLang }
        : undefined;
      const testimonialTarget = testimonialTargetLocale(testimonialLang);
      const targetKey = testimonialTarget === 'en-US' ? 'enUS' : 'ptBR';
      const previousTestimonial = editingProject?.caseStudy?.testimonial;
      const previousTestimonialT = editingProject?.caseStudyTranslations?.[targetKey]?.testimonial;
      let translatedTestimonial: TestimonialText | undefined;
      if (testimonial) {
        const fields = testimonialFieldsToTranslate(testimonial, previousTestimonial, previousTestimonialT);
        const fresh = Object.keys(fields).length > 0
          ? await translateFields(fields, testimonialTarget, testimonialLang)
          : {};
        translatedTestimonial = buildTranslatedTestimonial(testimonial, fresh, previousTestimonial, previousTestimonialT);
      }

      const translated = {
        title: partialTranslated.title ?? editingProject?.titleTranslations?.enUS ?? titlePT,
        description: partialTranslated.description ?? editingProject?.descriptionTranslations?.enUS ?? descriptionPT,
        longDescription: partialTranslated.longDescription ?? editingProject?.longDescriptionTranslations?.enUS ?? longDescriptionPT,
        caseStudyProblem: partialTranslated.caseStudyProblem ?? editingProject?.caseStudyTranslations?.enUS?.problem ?? caseStudyProblem,
        caseStudySolution: partialTranslated.caseStudySolution ?? editingProject?.caseStudyTranslations?.enUS?.solution ?? caseStudySolution,
        caseStudyResults: partialTranslated.caseStudyResults ?? editingProject?.caseStudyTranslations?.enUS?.results ?? caseStudyResults,
        caseStudyRole: partialTranslated.caseStudyRole ?? editingProject?.caseStudyTranslations?.enUS?.role ?? caseStudyRole,
        caseStudyContext: partialTranslated.caseStudyContext ?? editingProject?.caseStudyTranslations?.enUS?.context ?? caseStudyContext,
        caseStudyDecisions: partialTranslated.caseStudyDecisions ?? editingProject?.caseStudyTranslations?.enUS?.decisions ?? caseStudyDecisions,
        caseStudyLearnings: partialTranslated.caseStudyLearnings ?? editingProject?.caseStudyTranslations?.enUS?.learnings ?? caseStudyLearnings,
        category: partialTranslated.category ?? editingProject?.categoryTranslations?.enUS ?? category,
      };
      // Campo vazio vira undefined para não gravar string vazia
      const opt = (value: string) => (value.trim() ? value : undefined);

      const hasCaseStudy = !!(caseStudyProblem || caseStudySolution || caseStudyResults);
      const caseStudyData = hasCaseStudy ? {
        problem: caseStudyProblem,
        solution: caseStudySolution,
        results: caseStudyResults,
        role: opt(caseStudyRole),
        context: opt(caseStudyContext),
        decisions: opt(caseStudyDecisions),
        learnings: opt(caseStudyLearnings),
        metrics,
        testimonial,
      } : undefined;

      const imageIds = projectImages.map((i) => i.id);
      const baseData = {
        title: titlePT,
        titleTranslations: { ptBR: titlePT, enUS: translated.title },
        description: descriptionPT,
        descriptionTranslations: { ptBR: descriptionPT, enUS: translated.description },
        longDescription: longDescriptionPT || undefined,
        longDescriptionTranslations: longDescriptionPT
          ? { ptBR: longDescriptionPT, enUS: translated.longDescription ?? longDescriptionPT }
          : undefined,
        tags: selectedTags,
        imageIds,
        demoLink: (formData.get('demo') as string) || undefined,
        githubLink: (formData.get('github') as string) || undefined,
        slug: slug || undefined,
        caseStudy: caseStudyData,
        caseStudyTranslations: hasCaseStudy ? {
          ptBR: {
            problem: caseStudyProblem, solution: caseStudySolution, results: caseStudyResults,
            role: opt(caseStudyRole), context: opt(caseStudyContext),
            decisions: opt(caseStudyDecisions), learnings: opt(caseStudyLearnings),
            testimonial: targetKey === 'ptBR' ? translatedTestimonial : undefined,
          },
          enUS: {
            problem: translated.caseStudyProblem, solution: translated.caseStudySolution, results: translated.caseStudyResults,
            role: caseStudyRole.trim() ? translated.caseStudyRole : undefined,
            context: caseStudyContext.trim() ? translated.caseStudyContext : undefined,
            decisions: caseStudyDecisions.trim() ? translated.caseStudyDecisions : undefined,
            learnings: caseStudyLearnings.trim() ? translated.caseStudyLearnings : undefined,
            metrics: buildTranslatedMetrics(metrics, partialTranslated, previousMetrics, previousEnMetrics),
            testimonial: targetKey === 'enUS' ? translatedTestimonial : undefined,
          },
        } : undefined,
        category: opt(category),
        categoryTranslations: category.trim() ? { ptBR: category, enUS: translated.category } : undefined,
      };

      if (editingProject) {
        await updateProject({
          id: editingProject._id,
          ...baseData,
          orderIndex: editingProject.orderIndex,
        });
      } else {
        const maxOrder = projects.length > 0
          ? Math.max(...projects.map(p => p.orderIndex ?? 0))
          : -1;
        await createProject({
          ...baseData,
          orderIndex: maxOrder + 1,
        });
      }

      setIsDialogOpen(false);
      setEditingProject(null);
      setProjectImages([]);
      setSelectedTags([]);
      toast.success(editingProject ? 'Projeto atualizado com sucesso' : 'Projeto criado com sucesso');
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error?.message || 'Erro ao salvar projeto');
    }
  };

  const handleDelete = (id: Id<"projects">, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleRestore = async (id: Id<"projects">) => {
    try {
      await restoreProject({ id });
      toast.success('Projeto restaurado com sucesso');
    } catch (error) {
      toast.error('Erro ao restaurar projeto');
    }
  };

  const addImage = (url: string | string[]) => {
    // ImagePicker passes Convex image IDs (as strings) per migration plan.
    const incoming = Array.isArray(url) ? url : [url];
    const additions = incoming.map((id) => ({ id: id as Id<"imageMetadata">, url: null }));
    setProjectImages([...projectImages, ...additions]);
  };

  const removeImage = (index: number) => {
    setProjectImages(projectImages.filter((_, i) => i !== index));
  };

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      setProjectImages(arrayMove(projectImages, oldIndex, newIndex));
    }
  };

  const imageSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((project) => project._id === active.id);
      const newIndex = projects.findIndex((project) => project._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(projects, oldIndex, newIndex);
      const items = newOrder.map((project, index) => ({ id: project._id, orderIndex: index }));

      try {
        await reorderProjects({ items });
        toast.success("Ordem atualizada com sucesso");
      } catch (error) {
        console.error("Error reordering projects:", error);
        toast.error("Erro ao reordenar projetos");
      }
    }
  };

  const processJsonImport = async (jsonStr: string) => {
    setImportError('');
    let data: any;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      setImportError('JSON inválido. Verifique a formatação.');
      return;
    }

    if (!data.title) { setImportError('Campo obrigatório ausente: title'); return; }
    if (!data.slug) { setImportError('Campo obrigatório ausente: slug'); return; }
    const existingSlug = projects.find(p => (p as any).slug === data.slug);
    if (existingSlug) { setImportError(`Slug "${data.slug}" já está em uso pelo projeto "${existingSlug.title}".`); return; }

    try {
      const maxOrder = projects.length > 0 ? Math.max(...projects.map(p => p.orderIndex ?? 0)) : -1;
      await createProject({
        title: data.title,
        titleTranslations: data.titleTranslations ? { ptBR: data.titleTranslations.ptBR ?? data.title, enUS: data.titleTranslations.enUS } : undefined,
        description: data.description ?? '',
        descriptionTranslations: data.descriptionTranslations ? { ptBR: data.descriptionTranslations.ptBR ?? data.description ?? '', enUS: data.descriptionTranslations.enUS } : undefined,
        longDescription: data.longDescription,
        longDescriptionTranslations: data.longDescriptionTranslations ? { ptBR: data.longDescriptionTranslations.ptBR ?? data.longDescription ?? '', enUS: data.longDescriptionTranslations.enUS } : undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        imageIds: [],
        externalImageUrls: Array.isArray(data.externalImageUrls) ? data.externalImageUrls : [],
        demoLink: data.demoLink || undefined,
        githubLink: data.githubLink || undefined,
        slug: data.slug,
        caseStudy: data.caseStudy && (data.caseStudy.problem || data.caseStudy.solution || data.caseStudy.results)
          ? {
              problem: data.caseStudy.problem ?? '', solution: data.caseStudy.solution ?? '', results: data.caseStudy.results ?? '',
              role: data.caseStudy.role || undefined, context: data.caseStudy.context || undefined,
              decisions: data.caseStudy.decisions || undefined, learnings: data.caseStudy.learnings || undefined,
              metrics: Array.isArray(data.caseStudy.metrics) ? data.caseStudy.metrics : [], testimonial: data.caseStudy.testimonial ?? undefined,
            }
          : undefined,
        caseStudyTranslations: data.caseStudyTranslations ?? undefined,
        category: data.category || undefined,
        categoryTranslations: data.categoryTranslations ?? undefined,
        orderIndex: maxOrder + 1,
      });
      toast.success(`Projeto "${data.title}" importado com sucesso!`);
      setIsImportOpen(false);
      setImportJson('');
    } catch (err: any) {
      setImportError(err?.message || 'Erro ao importar projeto.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportJson(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(CASE_STUDY_AI_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground-strong">Projetos</h1>
            <p className="text-foreground/65">Gerencie os projetos exibidos no seu portfólio</p>
          </div>
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
            <Button variant="outline" className="border-foreground/10 text-foreground-strong hover:bg-foreground/5" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar JSON
            </Button>
            <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-background border-foreground/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground-strong">
                {editingProject ? "Editar Projeto" : "Adicionar Novo Projeto"}
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de projeto</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground-strong">Título</Label>
                <Input name="title" id="title" defaultValue={editingProject ? getProjectField(editingProject, 'title') : ''} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-foreground-strong">Slug (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="meu-projeto"
                    className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-foreground/10 text-foreground/65 hover:text-foreground-strong whitespace-nowrap"
                    onClick={() => {
                      const titleEl = document.getElementById('title') as HTMLInputElement;
                      if (titleEl?.value) setSlug(generateSlug(titleEl.value));
                    }}
                  >
                    Gerar do título
                  </Button>
                </div>
                {slug && (
                  <p className="text-xs text-foreground/42">/portfolio/{slug}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground-strong">Descrição Curta</Label>
                <Textarea name="description" id="description" defaultValue={editingProject ? getProjectField(editingProject, 'description') : ''} className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description" className="text-foreground-strong">Descrição Longa</Label>
                <Textarea name="long_description" id="long_description" defaultValue={editingProject ? getProjectField(editingProject, 'longDescription') : ''} className="bg-foreground/5 border-foreground/10 text-foreground-strong h-32" />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground-strong">Galeria de Imagens</Label>
                <DndContext
                  sensors={imageSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleImageDragEnd}
                >
                  <SortableContext
                    items={projectImages.map((_, index) => index)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {projectImages.map((img, index) => (
                        <SortableImageItem
                          key={`${img.id}-${index}`}
                          img={img}
                          index={index}
                          onRemove={removeImage}
                        />
                      ))}
                      <div className="aspect-video flex items-center justify-center border border-dashed border-foreground/20 rounded-md bg-foreground/5">
                        <ImagePicker onSelect={addImage} multiple />
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>
                <p className="text-xs text-foreground/42">A primeira imagem será usada como capa do projeto. Arraste as imagens para reordená-las.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground-strong">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex.: IA aplicada, Plataformas, Marca e design"
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                />
                <p className="text-xs text-foreground/42">Usada nos filtros do portfólio. Projetos com o mesmo texto ficam no mesmo filtro.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground-strong">Tags</Label>
                <ProjectTagsInput selectedTags={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo" className="text-foreground-strong">Link Demo</Label>
                  <Input name="demo" id="demo" defaultValue={editingProject?.demoLink} placeholder="https://" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-foreground-strong">Link GitHub</Label>
                  <Input name="github" id="github" defaultValue={editingProject?.githubLink} placeholder="https://" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="case-study" className="border-foreground/10">
                  <AccordionTrigger className="text-foreground-strong hover:text-neon-purple">
                    Case Study (opcional)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Meu papel (opcional)</Label>
                      <Textarea
                        value={caseStudyRole}
                        onChange={e => setCaseStudyRole(e.target.value)}
                        placeholder="Cargo, tamanho do time e o que ficou sob sua responsabilidade..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Antes (opcional)</Label>
                      <Textarea
                        value={caseStudyContext}
                        onChange={e => setCaseStudyContext(e.target.value)}
                        placeholder="Como era antes: o estado inicial, com números se tiver..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">O Problema</Label>
                      <Textarea
                        value={caseStudyProblem}
                        onChange={e => setCaseStudyProblem(e.target.value)}
                        placeholder="Descreva o contexto e o desafio que motivou o projeto..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">A Solução</Label>
                      <Textarea
                        value={caseStudySolution}
                        onChange={e => setCaseStudySolution(e.target.value)}
                        placeholder="Como o problema foi resolvido, arquitetura e decisões técnicas..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Decisões e trade-offs (opcional)</Label>
                      <Textarea
                        value={caseStudyDecisions}
                        onChange={e => setCaseStudyDecisions(e.target.value)}
                        placeholder="O que você escolheu, o que descartou e por quê..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Os Resultados</Label>
                      <Textarea
                        value={caseStudyResults}
                        onChange={e => setCaseStudyResults(e.target.value)}
                        placeholder="Impacto, métricas, feedback obtido..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground-strong">Aprendizados (opcional)</Label>
                      <Textarea
                        value={caseStudyLearnings}
                        onChange={e => setCaseStudyLearnings(e.target.value)}
                        placeholder="O que você levaria para o próximo projeto..."
                        className="bg-foreground/5 border-foreground/10 text-foreground-strong h-20"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-foreground-strong">Métricas</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-foreground/10 text-foreground/65 hover:text-foreground-strong"
                          onClick={() => setMetrics([...metrics, { label: '', value: '', icon: '' }])}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      {metrics.map((m, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <IconPicker
                            value={m.icon}
                            onChange={icon => setMetrics(metrics.map((x, idx) => idx === i ? { ...x, icon } : x))}
                          />
                          <Input
                            value={m.value}
                            onChange={e => setMetrics(metrics.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                            placeholder="Ex: 70%"
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong w-24"
                          />
                          <Input
                            value={m.label}
                            onChange={e => setMetrics(metrics.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                            placeholder="Rótulo"
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setMetrics(metrics.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="testimonial-enabled"
                          checked={testimonialEnabled}
                          onChange={e => setTestimonialEnabled(e.target.checked)}
                          className="rounded border-foreground/20"
                        />
                        <Label htmlFor="testimonial-enabled" className="text-foreground-strong cursor-pointer">Incluir depoimento</Label>
                      </div>
                      {testimonialEnabled && (
                        <div className="space-y-2 pl-6 border-l border-foreground/10">
                          <Textarea
                            value={testimonialText}
                            onChange={e => setTestimonialText(e.target.value)}
                            placeholder="Texto do depoimento..."
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong h-20"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={testimonialAuthor} onChange={e => setTestimonialAuthor(e.target.value)} placeholder="Nome do autor" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                            <Input value={testimonialRole} onChange={e => setTestimonialRole(e.target.value)} placeholder="Cargo / empresa" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Label htmlFor="testimonial-lang" className="text-foreground/70">Idioma original</Label>
                            <select
                              id="testimonial-lang"
                              value={testimonialLang}
                              onChange={e => setTestimonialLang(e.target.value as TestimonialLocale)}
                              className="rounded-md bg-foreground/5 border border-foreground/10 text-foreground-strong px-2 py-1"
                            >
                              <option value="pt-BR">Português</option>
                              <option value="en-US">Inglês</option>
                            </select>
                            <span className="text-foreground/50 text-xs">No outro idioma, o site mostra uma tradução com aviso e botão para ver o original.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-foreground/65">Cancelar</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-foreground-strong">Carregando projetos...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map(p => p._id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <SortableProjectCard
                    key={project._id}
                    project={project}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* JSON Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-background border-foreground/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground-strong">Importar Projeto via JSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-foreground/10 text-foreground/65 hover:text-foreground-strong"
                onClick={copyPrompt}
              >
                {promptCopied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
                {promptCopied ? 'Copiado!' : 'Copiar Prompt para IA'}
              </Button>
              <p className="text-xs text-foreground/42 self-center">Gere o JSON com ChatGPT, Claude ou Gemini</p>
            </div>

            <Tabs defaultValue="paste">
              <TabsList className="bg-foreground/5 border border-foreground/10">
                <TabsTrigger value="paste" className="text-foreground/65 data-[state=active]:text-foreground-strong">Colar JSON</TabsTrigger>
                <TabsTrigger value="upload" className="text-foreground/65 data-[state=active]:text-foreground-strong">Upload de Arquivo</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="mt-3">
                <Textarea
                  value={importJson}
                  onChange={e => { setImportJson(e.target.value); setImportError(''); }}
                  placeholder='{ "title": "Meu Projeto", "slug": "meu-projeto", ... }'
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong font-mono text-xs h-48"
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-3">
                <div
                  className="border-2 border-dashed border-foreground/20 rounded-lg p-8 text-center cursor-pointer hover:border-neon-purple/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-foreground/42 mx-auto mb-2" />
                  <p className="text-foreground/65 text-sm">Clique para selecionar um arquivo .json</p>
                  {importJson && <p className="text-green-400 text-xs mt-2">Arquivo carregado ✓</p>}
                </div>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              </TabsContent>
            </Tabs>

            {importError && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded p-3">{importError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setIsImportOpen(false); setImportJson(''); setImportError(''); }} className="text-foreground/65">Cancelar</Button>
              <Button
                type="button"
                onClick={() => processJsonImport(importJson)}
                disabled={!importJson.trim()}
                className="bg-neon-purple hover:bg-neon-purple/90 text-white"
              >
                Importar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          await removeProject({ id: deleteTarget!.id });
          toast.success('Projeto excluído');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDeleteProject({ id: deleteTarget!.id });
          toast.success('Projeto excluído permanentemente');
        } : undefined}
      />
    </AdminLayout>
  );
}
