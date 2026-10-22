import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ProjectTagsInput } from "@/components/admin/ProjectTagsInput";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { toast } from "sonner";
import { X } from "lucide-react";

interface ProjectImage {
    _id: Id<"imageMetadata">;
    url: string | null;
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
    orderIndex: number;
}

interface ProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project?: Project | null;
    onSave: () => void;
}

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
    const allProjects = useQuery(api.projects.list, {}) as Project[] | undefined;
    const createProject = useMutation(api.projects.create);
    const updateProject = useMutation(api.projects.update);

    const [projectImages, setProjectImages] = useState<{ id: Id<"imageMetadata">; url: string | null }[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            if (project) {
                setProjectImages(
                    (project.images || []).map((img) => ({ id: img._id, url: img.url }))
                );
                setSelectedTags(project.tags || []);
            } else {
                setProjectImages([]);
                setSelectedTags([]);
            }
        }
    }, [open, project]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const titlePT = formData.get('title') as string;
        const descriptionPT = formData.get('description') as string;
        const longDescriptionPT = formData.get('long_description') as string || '';

        try {
            const imageIds = projectImages.map((i) => i.id);
            const baseData = {
                title: titlePT,
                titleTranslations: { ptBR: titlePT, enUS: titlePT },
                description: descriptionPT,
                descriptionTranslations: { ptBR: descriptionPT, enUS: descriptionPT },
                longDescription: longDescriptionPT || undefined,
                longDescriptionTranslations: longDescriptionPT
                    ? { ptBR: longDescriptionPT, enUS: longDescriptionPT }
                    : undefined,
                tags: selectedTags,
                imageIds,
                demoLink: (formData.get('demo') as string) || undefined,
                githubLink: (formData.get('github') as string) || undefined,
            };

            if (project) {
                await updateProject({
                    id: project._id,
                    ...baseData,
                    orderIndex: project.orderIndex,
                });
            } else {
                const list = allProjects ?? [];
                const maxOrder = list.length > 0
                    ? Math.max(...list.map((p) => p.orderIndex ?? 0))
                    : -1;
                await createProject({
                    ...baseData,
                    orderIndex: maxOrder + 1,
                });
            }

            toast.success(project ? 'Projeto atualizado com sucesso' : 'Projeto criado com sucesso');
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving project:', error);
            toast.error(error?.message || 'Erro ao salvar projeto');
        }
    };

    const addImage = (url: string | string[]) => {
        const incoming = Array.isArray(url) ? url : [url];
        const additions = incoming.map((id) => ({ id: id as Id<"imageMetadata">, url: null }));
        setProjectImages([...projectImages, ...additions]);
    };

    const removeImage = (index: number) => {
        setProjectImages(projectImages.filter((_, i) => i !== index));
    };

    const getField = (field: "title" | "description" | "longDescription"): string => {
        if (!project) return '';
        const t = (project as any)[`${field}Translations`];
        if (t?.ptBR) return t.ptBR;
        return ((project as any)[field] as string) || '';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-background border-foreground/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground-strong">
                        {project ? "Editar Projeto" : "Adicionar Novo Projeto"}
                    </DialogTitle>
                    <VisuallyHidden>
                        <h2>Formulário de projeto</h2>
                    </VisuallyHidden>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground-strong">Título</Label>
                        <Input
                            name="title"
                            id="title"
                            defaultValue={getField('title')}
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-foreground-strong">Descrição Curta</Label>
                        <Textarea
                            name="description"
                            id="description"
                            defaultValue={getField('description')}
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="long_description" className="text-foreground-strong">Descrição Longa</Label>
                        <Textarea
                            name="long_description"
                            id="long_description"
                            defaultValue={getField('longDescription')}
                            className="bg-foreground/5 border-foreground/10 text-foreground-strong h-32"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground-strong">Galeria de Imagens</Label>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {projectImages.map((img, index) => (
                                <div key={`${img.id}-${index}`} className="relative group aspect-video rounded-md overflow-hidden border border-foreground/10">
                                    {img.url ? (
                                        <img src={img.url} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-foreground/5" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-background/60 text-foreground-strong text-xs py-1 text-center">
                                            Capa
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="aspect-video flex items-center justify-center border border-dashed border-foreground/20 rounded-md bg-foreground/5">
                                <ImagePicker onSelect={addImage} multiple />
                            </div>
                        </div>
                        <p className="text-xs text-foreground/42">A primeira imagem será usada como capa do projeto.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground-strong">Tags</Label>
                        <ProjectTagsInput selectedTags={selectedTags} onChange={setSelectedTags} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="demo" className="text-foreground-strong">Link Demo</Label>
                            <Input name="demo" id="demo" defaultValue={project?.demoLink} placeholder="https://" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="github" className="text-foreground-strong">Link GitHub</Label>
                            <Input name="github" id="github" defaultValue={project?.githubLink} placeholder="https://" className="bg-foreground/5 border-foreground/10 text-foreground-strong" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-foreground/65">Cancelar</Button>
                        <Button type="submit" className="bg-neon-purple hover:bg-neon-purple/90 text-white">Salvar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
