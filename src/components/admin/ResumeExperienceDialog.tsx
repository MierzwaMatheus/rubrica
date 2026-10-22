import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

interface ResumeExperienceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void;
}

export function ResumeExperienceDialog({ open, onOpenChange, onSave }: ResumeExperienceDialogProps) {
    const [description, setDescription] = useState("");
    const allItems = useQuery(api.resumeItems.listAll, {}) as Array<{ type: string }> | undefined;
    const createItem = useMutation(api.resumeItems.create);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const content: any = {};

        formData.forEach((value, key) => {
            content[key] = value;
        });
        content.description = description;

        try {
            const orderIndex = (allItems ?? []).filter((i) => i.type === 'experience').length;
            await createItem({
                type: 'experience',
                content,
                contentTranslations: { ptBR: content, enUS: content },
                orderIndex,
            });
            toast.success("Experiência adicionada com sucesso");
            onSave();
            onOpenChange(false);
            setDescription("");
        } catch (error) {
            console.error("Error saving experience:", error);
            toast.error("Erro ao salvar experiência");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-background border-foreground/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground-strong">Adicionar Experiência</DialogTitle>
                    <VisuallyHidden>
                        <h2>Formulário de experiência</h2>
                    </VisuallyHidden>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-foreground-strong">Cargo</Label>
                            <Input name="role" className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground-strong">Empresa</Label>
                            <Input name="company" className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground-strong">Período</Label>
                        <Input name="period" className="bg-foreground/5 border-foreground/10 text-foreground-strong" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground-strong">Descrição</Label>
                        <RichTextEditor
                            content={description}
                            onChange={setDescription}
                        />
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
