import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";

export interface PlaygroundProposal {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  objective: string;
  scope: string[];
  timeline: { step: string; period: string }[];
  deliveryDate: string;
  investmentValue: number;
  conditions: string[];
  rescissionPolicy: string;
  isAccepted: boolean;
  acceptedAt?: number;
  acceptance?: {
    clientName: string;
    clientDocument: string;
    clientEmail: string;
    clientRole?: string;
    clientDeclaration?: string;
    ipAddress?: string;
    userAgent?: string;
    contentHash?: string;
    signatureDataUrl: string;
    acceptedAt: string;
  };
  createdAt: number;
  expiresAt: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: PlaygroundProposal | null;
  existingSlugs: string[];
  onSave: (data: Omit<PlaygroundProposal, "id" | "isAccepted" | "acceptedAt" | "acceptance" | "createdAt" | "expiresAt">) => void;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-|-$/g, "");
}

const DEFAULT_CONDITIONS = [
  "Revisões: até 2 rodadas incluídas por etapa. Alterações fora do escopo serão orçadas.",
  "Garantia: correções de falhas por até 30 dias após entrega.",
  "Suporte: incluso durante o projeto. Após entrega, sob contratação extra.",
  "Prazos: contagem começa após pagamento e recebimento dos materiais.",
];

export function PlaygroundProposalDialog({ open, onOpenChange, proposal, existingSlugs, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [objective, setObjective] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [investmentValue, setInvestmentValue] = useState("");
  const [scopeItems, setScopeItems] = useState<string[]>([]);
  const [newScopeItem, setNewScopeItem] = useState("");
  const [timelineItems, setTimelineItems] = useState<{ step: string; period: string }[]>([]);
  const [newTimelineStep, setNewTimelineStep] = useState("");
  const [newTimelinePeriod, setNewTimelinePeriod] = useState("");
  const [conditions, setConditions] = useState<{ text: string; checked: boolean }[]>(
    DEFAULT_CONDITIONS.map(t => ({ text: t, checked: true }))
  );

  useEffect(() => {
    if (!open) return;
    if (proposal) {
      setTitle(proposal.title);
      setClientName(proposal.clientName);
      setSlug(proposal.slug);
      setObjective(proposal.objective);
      setDeliveryDate(proposal.deliveryDate);
      setInvestmentValue(proposal.investmentValue ? proposal.investmentValue.toString().replace(".", ",") : "");
      setScopeItems(proposal.scope);
      setTimelineItems(proposal.timeline);
      setConditions(DEFAULT_CONDITIONS.map(t => ({ text: t, checked: proposal.conditions.includes(t) })).concat(
        proposal.conditions.filter(c => !DEFAULT_CONDITIONS.includes(c)).map(t => ({ text: t, checked: true }))
      ));
    } else {
      resetForm();
    }
  }, [open, proposal]);

  // Auto-slug from title when creating new
  useEffect(() => {
    if (!proposal && title) {
      setSlug(slugify(title));
    }
  }, [title, proposal]);

  const resetForm = () => {
    setTitle(""); setClientName(""); setSlug(""); setSlugError("");
    setObjective(""); setDeliveryDate(""); setInvestmentValue("");
    setScopeItems([]); setTimelineItems([]);
    setNewScopeItem(""); setNewTimelineStep(""); setNewTimelinePeriod("");
    setConditions(DEFAULT_CONDITIONS.map(t => ({ text: t, checked: true })));
  };

  const checkSlug = (val: string) => {
    const others = existingSlugs.filter(s => s !== proposal?.slug);
    setSlugError(others.includes(val) ? "Este slug já está em uso." : "");
  };

  const handleSave = () => {
    if (slugError) return alert("Corrija o erro do slug.");
    if (!clientName || !slug) return alert("Preencha os campos obrigatórios.");
    onSave({
      slug,
      title,
      clientName,
      objective,
      scope: scopeItems,
      timeline: timelineItems,
      deliveryDate,
      investmentValue: parseFloat(investmentValue.replace(",", ".")) || 0,
      conditions: conditions.filter(c => c.checked).map(c => c.text),
      rescissionPolicy: DEFAULT_RESCISION_POLICY,
    });
    onOpenChange(false);
    resetForm();
  };

  const calculateValidUntil = () => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-foreground/10 max-w-2xl w-full max-h-[85vh] overflow-y-scroll text-foreground-strong">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{proposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
          <VisuallyHidden><h2>Formulário de {proposal ? "edição" : "criação"} de proposta</h2></VisuallyHidden>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <Label className="block text-sm mb-1">Título da Proposta</Label>
            <Input className="bg-background border-input" placeholder="Ex: Projeto para [Nome do Cliente]" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm mb-1">Nome do Cliente *</Label>
              <Input className="bg-background border-input" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div>
              <Label className="block text-sm mb-1">Slug *</Label>
              <Input
                className={`bg-background border-input ${slugError ? "border-red-500" : ""}`}
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugError(""); }}
                onBlur={e => checkSlug(e.target.value)}
              />
              {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm mb-1">Data de Criação</Label>
              <Input className="bg-background border-input" value={new Date().toISOString().split("T")[0]} disabled />
            </div>
            <div>
              <Label className="block text-sm mb-1">Válido até</Label>
              <Input className="bg-background border-input" value={calculateValidUntil()} disabled />
            </div>
          </div>

          <div>
            <Label className="block text-sm mb-1">Objetivo do Projeto</Label>
            <Textarea className="bg-background border-input min-h-[80px]" rows={3} value={objective} onChange={e => setObjective(e.target.value)} />
          </div>

          <div>
            <Label className="block text-sm mb-1">Escopo dos Serviços</Label>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Adicionar item..." className="bg-background border-input" value={newScopeItem} onChange={e => setNewScopeItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newScopeItem.trim()) { setScopeItems(p => [...p, newScopeItem.trim()]); setNewScopeItem(""); } } }} />
              <Button type="button" onClick={() => { if (newScopeItem.trim()) { setScopeItems(p => [...p, newScopeItem.trim()]); setNewScopeItem(""); } }}>Adicionar</Button>
            </div>
            <ul className="space-y-1">
              {scopeItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between bg-foreground/5 p-2 rounded text-sm">
                  <span>{item}</span>
                  <button type="button" onClick={() => setScopeItems(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label className="block text-sm mb-1">Cronograma</Label>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Etapa" className="bg-background border-input" value={newTimelineStep} onChange={e => setNewTimelineStep(e.target.value)} />
              <Input placeholder="Período estimado" className="bg-background border-input" value={newTimelinePeriod} onChange={e => setNewTimelinePeriod(e.target.value)} />
              <Button type="button" onClick={() => { if (newTimelineStep.trim() && newTimelinePeriod.trim()) { setTimelineItems(p => [...p, { step: newTimelineStep.trim(), period: newTimelinePeriod.trim() }]); setNewTimelineStep(""); setNewTimelinePeriod(""); } }}>Adicionar</Button>
            </div>
            <ul className="space-y-1">
              {timelineItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between bg-foreground/5 p-2 rounded text-sm">
                  <span>{item.step} — {item.period}</span>
                  <button type="button" onClick={() => setTimelineItems(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <Label className="block text-sm mb-1">Data Prevista para Entrega</Label>
              <Input type="date" className="bg-background border-input" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="block text-sm mb-1">Valor do Projeto</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-foreground/65 text-sm">R$</span>
              <Input className="bg-background border-input pl-8" placeholder="0,00" value={investmentValue} onChange={e => setInvestmentValue(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="block text-sm mb-1">Condições Gerais</Label>
            <div className="flex flex-col gap-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input type="checkbox" checked={c.checked} onChange={e => { const next = [...conditions]; next[i].checked = e.target.checked; setConditions(next); }} className="mt-1 rounded border-foreground/80" />
                  <Textarea value={c.text} onChange={e => { const next = [...conditions]; next[i].text = e.target.value; setConditions(next); }} className="bg-background border-input min-h-[60px] text-sm" rows={2} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <Button variant="ghost" onClick={() => { onOpenChange(false); resetForm(); }}>Cancelar</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>{proposal ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
