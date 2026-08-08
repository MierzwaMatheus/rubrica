import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";

interface ProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proposal?: any | null;
    onSave: () => void;
}

export function ProposalDialog({ open, onOpenChange, proposal, onSave }: ProposalDialogProps) {
    const proposalsData = useQuery(api.proposals.listAdmin, { filter: "all" });
    const proposals = proposalsData ?? [];
    const templates: any[] = useQuery(api.contractTemplates.list) ?? [];

    const createProposal = useMutation(api.proposals.create);
    const updateProposal = useMutation(api.proposals.update);

    // Form State
    const [title, setTitle] = useState("");
    const [clientName, setClientName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugError, setSlugError] = useState("");
    const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
    const [objective, setObjective] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [investmentValue, setInvestmentValue] = useState("");

    const [templateId, setTemplateId] = useState<Id<"contractTemplates"> | undefined>(undefined);

    // Scope & Timeline
    const [scopeItems, setScopeItems] = useState<string[]>([]);
    const [newScopeItem, setNewScopeItem] = useState("");
    const [timelineItems, setTimelineItems] = useState<{ step: string, period: string }[]>([]);
    const [newTimelineStep, setNewTimelineStep] = useState("");
    const [newTimelinePeriod, setNewTimelinePeriod] = useState("");

    // Payment & Conditions
    const [conditions, setConditions] = useState<Array<{ text: string; checked: boolean }>>([
        { text: "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.", checked: true },
        { text: "Garantia: correções de falhas por até 30 dias após entrega.", checked: true },
        { text: "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.", checked: true },
        { text: "Prazos: contagem começa após pagamento e recebimento dos materiais.", checked: true }
    ]);

    useEffect(() => {
        if (open) {
            if (proposal) {
                setTitle(proposal.title || "");
                setClientName(proposal.clientName || "");
                setSlug(proposal.slug || "");
                setCreatedAt(new Date(proposal.createdAt).toISOString().split('T')[0]);
                setObjective(proposal.objective || "");
                setDeliveryDate(proposal.deliveryDate || "");
                setInvestmentValue(proposal.investmentValue?.toString().replace('.', ',') || "");
                setScopeItems(Array.isArray(proposal.scope) ? proposal.scope : []);
                setTimelineItems(Array.isArray(proposal.timeline) ? proposal.timeline : []);
                setTemplateId(proposal.templateId ?? undefined);

                const savedConditions: string[] = proposal.conditions || [];
                const defaultConditions = [
                    "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.",
                    "Garantia: correções de falhas por até 30 dias após entrega.",
                    "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.",
                    "Prazos: contagem começa após pagamento e recebimento dos materiais."
                ];

                setConditions(defaultConditions.map(defaultText => ({
                    text: defaultText,
                    checked: savedConditions.includes(defaultText)
                })).concat(
                    savedConditions
                        .filter((sc) => !defaultConditions.includes(sc))
                        .map((customText) => ({ text: customText, checked: true }))
                ));
            } else {
                resetForm();
                const defaultTemplate = templates.find((t: any) => t.isDefault);
                if (defaultTemplate) setTemplateId(defaultTemplate._id);
            }
        }
    }, [open, proposal]);

    const resetForm = () => {
        setTitle("");
        setClientName("");
        setSlug("");
        setSlugError("");
        setCreatedAt(new Date().toISOString().split('T')[0]);
        setObjective("");
        setScopeItems([]);
        setTimelineItems([]);
        setDeliveryDate("");
        setInvestmentValue("");
        setConditions([
            { text: "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.", checked: true },
            { text: "Garantia: correções de falhas por até 30 dias após entrega.", checked: true },
            { text: "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.", checked: true },
            { text: "Prazos: contagem começa após pagamento e recebimento dos materiais.", checked: true }
        ]);
    };

    const checkSlugAvailability = (slugToCheck: string) => {
        if (!slugToCheck) return;
        const existing = proposals.find((p: any) =>
            p.slug === slugToCheck && (!proposal || p._id !== proposal._id)
        );
        setSlugError(existing ? "Este slug já está em uso." : "");
    };

    const handleCreateProposal = async () => {
        if (slugError) return alert("Corrija o erro do slug antes de continuar.");
        if (!clientName || !slug) return alert("Preencha os campos obrigatórios.");

        const selectedConditions = conditions.filter(c => c.checked).map(c => c.text);
        const investment = parseFloat(investmentValue.replace(',', '.')) || 0;

        try {
            if (proposal) {
                await updateProposal({
                    id: proposal._id as Id<"proposals">,
                    clientName,
                    title: title || "",
                    objective,
                    scope: scopeItems,
                    timeline: timelineItems,
                    deliveryDate: deliveryDate || "",
                    investmentValue: investment,
                    paymentMethods: proposal.paymentMethods ?? [],
                    conditions: selectedConditions,
                    templateId,
                });
                toast.success("Proposta atualizada com sucesso!");
                onSave();
                onOpenChange(false);
            } else {
                await createProposal({
                    clientName,
                    slug,
                    title: title || "",
                    objective,
                    scope: scopeItems,
                    timeline: timelineItems,
                    deliveryDate: deliveryDate || "",
                    investmentValue: investment,
                    paymentMethods: [],
                    conditions: selectedConditions,
                    rescissionPolicy: DEFAULT_RESCISION_POLICY,
                    templateId,
                });
                toast.success("Proposta criada com sucesso!");
                onSave();
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error("Error saving proposal:", error);
            toast.error(error?.message || "Erro ao salvar proposta.");
        }
    };

    const calculateValidUntil = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        date.setDate(date.getDate() + 10);
        return date.toLocaleDateString('pt-BR');
    };

    const handleAddScopeItem = () => {
        if (newScopeItem.trim()) {
            setScopeItems([...scopeItems, newScopeItem]);
            setNewScopeItem("");
        }
    };

    const handleRemoveScopeItem = (index: number) => {
        setScopeItems(scopeItems.filter((_, i) => i !== index));
    };

    const handleAddTimelineItem = () => {
        if (newTimelineStep.trim() && newTimelinePeriod.trim()) {
            setTimelineItems([...timelineItems, { step: newTimelineStep, period: newTimelinePeriod }]);
            setNewTimelineStep("");
            setNewTimelinePeriod("");
        }
    };

    const handleRemoveTimelineItem = (index: number) => {
        setTimelineItems(timelineItems.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-white/10 max-w-2xl w-full max-h-[85vh] overflow-y-scroll text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {proposal ? "Editar Proposta" : "Nova Proposta"}
                    </DialogTitle>
                    <VisuallyHidden>
                        <h2>Formulário de {proposal ? "edição" : "criação"} de proposta</h2>
                    </VisuallyHidden>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div>
                        <Label className="block text-sm mb-1">Título da Proposta</Label>
                        <Input
                            className="bg-background border-input"
                            placeholder="Ex: Projeto para [Nome do Cliente]"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm mb-1">Nome do Cliente</Label>
                            <Input
                                className="bg-background border-input"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="block text-sm mb-1">Slug</Label>
                            <Input
                                className={`bg-background border-input ${slugError ? "border-red-500" : ""}`}
                                value={slug}
                                onChange={(e) => {
                                    setSlug(e.target.value);
                                    setSlugError("");
                                }}
                                onBlur={(e) => checkSlugAvailability(e.target.value)}
                            />
                            {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block text-sm mb-1">Data de Criação</Label>
                            <Input
                                type="date"
                                className="bg-background border-input"
                                value={createdAt}
                                onChange={(e) => setCreatedAt(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="block text-sm mb-1">Validade</Label>
                            <Input
                                className="bg-background border-input"
                                disabled
                                value={calculateValidUntil(createdAt)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="block text-sm mb-1">Objetivo do Projeto</Label>
                        <Textarea
                            className="bg-background border-input min-h-[80px]"
                            rows={3}
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label className="block text-sm mb-1">Escopo dos Serviços</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Adicionar item..."
                                className="bg-background border-input"
                                value={newScopeItem}
                                onChange={(e) => setNewScopeItem(e.target.value)}
                            />
                            <Button onClick={handleAddScopeItem} className="bg-primary text-primary-foreground hover:bg-primary/90">Adicionar</Button>
                        </div>
                        <ul className="space-y-1">
                            {scopeItems.map((item, index) => (
                                <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                                    <span>{item}</span>
                                    <button onClick={() => handleRemoveScopeItem(index)} className="text-red-400 hover:text-red-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <Label className="block text-sm mb-1">Cronograma</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Etapa"
                                className="bg-background border-input"
                                value={newTimelineStep}
                                onChange={(e) => setNewTimelineStep(e.target.value)}
                            />
                            <Input
                                placeholder="Período estimado"
                                className="bg-background border-input"
                                value={newTimelinePeriod}
                                onChange={(e) => setNewTimelinePeriod(e.target.value)}
                            />
                            <Button onClick={handleAddTimelineItem} className="bg-primary text-primary-foreground hover:bg-primary/90">Adicionar</Button>
                        </div>
                        <ul className="space-y-1">
                            {timelineItems.map((item, index) => (
                                <li key={index} className="flex items-center justify-between bg-white/5 p-2 rounded text-sm">
                                    <span>{item.step} - {item.period}</span>
                                    <button onClick={() => handleRemoveTimelineItem(index)} className="text-red-400 hover:text-red-300">
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-2">
                            <Label className="block text-sm mb-1">Data Prevista para Entrega</Label>
                            <Input
                                type="date"
                                className="bg-background border-input"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="block text-sm mb-1">Valor do Projeto</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">R$</span>
                            <Input
                                className="bg-background border-input pl-8"
                                placeholder="0,00"
                                value={investmentValue}
                                onChange={(e) => setInvestmentValue(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="block text-sm mb-1">Condições Gerais</Label>
                        <div className="flex flex-col gap-2">
                            {conditions.map((condition, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={condition.checked}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[i].checked = e.target.checked;
                                            setConditions(newConditions);
                                        }}
                                        className="mt-1 rounded border-gray-300"
                                    />
                                    <Textarea
                                        value={condition.text}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[i].text = e.target.value;
                                            setConditions(newConditions);
                                        }}
                                        className="bg-background border-input min-h-[60px] text-sm"
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {templates.length > 0 && (
                        <div>
                            <Label className="block text-sm mb-1">Template de Contrato</Label>
                            <Select
                                value={templateId ?? ""}
                                onValueChange={(v) => setTemplateId(v as Id<"contractTemplates">)}
                            >
                                <SelectTrigger className="bg-background border-input w-full">
                                    <SelectValue placeholder="Selecionar template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t: any) => (
                                        <SelectItem key={t._id} value={t._id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        <Button variant="ghost" onClick={() => {
                            onOpenChange(false);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleCreateProposal}
                        >
                            {proposal ? "Salvar" : "Criar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
