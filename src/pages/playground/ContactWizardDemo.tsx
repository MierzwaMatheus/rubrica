import { useState } from "react";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ContactWizard } from "@/components/ContactWizard";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FlowType = "project" | "job" | "networking" | "feedback";

interface StoredSubmission {
  id: string;
  type: FlowType;
  contactInfo: { name: string; email: string; mobilePhone?: string };
  answers: Record<string, string>;
  submittedAt: number;
}

const TYPE_LABELS: Record<FlowType, string> = {
  project: "💼 Projeto",
  job: "🧑‍💼 Emprego",
  networking: "🤝 Networking",
  feedback: "💬 Feedback",
};

const ANSWER_KEYS: Record<FlowType, Record<string, string>> = {
  project: { projectType: "Tipo de projeto", timeline: "Prazo estimado", budget: "Orçamento estimado", description: "Descrição" },
  job: { contractType: "Tipo de contrato", modality: "Modalidade", area: "Área", jobCompany: "Empresa", jobRole: "Cargo" },
  networking: { howFound: "Como encontrou", topic: "Assunto" },
  feedback: { about: "Sobre", message: "Mensagem" },
};

const ANSWER_VALUES: Record<string, string> = {
  webapp: "Web App / SaaS", mobile: "Mobile", landing: "Landing Page",
  system: "Sistema Interno", consulting: "Consultoria Técnica", other: "Outro",
  urgent: "Urgente (< 1 mês)", short: "Curto (1–3 meses)", medium: "Médio (3–6 meses)", flexible: "Sem pressa",
  clt: "CLT", pj: "PJ / Contrato", freelance: "Freelance",
  remote: "Remoto", hybrid: "Híbrido", onsite: "Presencial",
  frontend: "Frontend", fullstack: "Full Stack", techlead: "Tech Lead / Arquitetura",
  blog: "Blog / Artigos", linkedin: "LinkedIn", referral: "Indicação", portfolio: "Portfólio",
  post: "Post do blog", project: "Projeto específico", general: "Portfolio em geral",
  small: "Até R$ 5.000", medium2: "R$ 5.000 – R$ 15.000", large: "R$ 15.000 – R$ 30.000",
  enterprise: "Acima de R$ 30.000", unknown: "Ainda não sei",
};

const BUDGET_VALUES: Record<string, string> = {
  small: "Até R$ 5.000", medium: "R$ 5.000 – R$ 15.000", large: "R$ 15.000 – R$ 30.000",
  enterprise: "Acima de R$ 30.000", unknown: "Ainda não sei",
};

function resolveValue(key: string, value: string): string {
  if (key === "budget") return BUDGET_VALUES[value] ?? value;
  return ANSWER_VALUES[value] ?? value;
}

export default function ContactWizardDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [submissions, setSubmissions, clearSubmissions] = usePlaygroundStorage<StoredSubmission[]>("pg_contact_submissions", []);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? submissions.find(s => s.id === selectedId) ?? null : null;

  const handleSimulateSubmit = async (data: { type: string; answers: Record<string, string>; contactInfo: { name: string; email: string; mobilePhone?: string } }) => {
    const entry: StoredSubmission = {
      id: crypto.randomUUID(),
      type: data.type as FlowType,
      contactInfo: data.contactInfo,
      answers: data.answers,
      submittedAt: Date.now(),
    };
    setSubmissions((prev) => [entry, ...prev]);
    setShowWizard(false);

    try {
      await logEvent({
        sessionId,
        eventType: "playground.contact_submitted",
        metadata: { type: data.type, answersCount: Object.keys(data.answers).length },
        userAgent: navigator.userAgent,
      });
    } catch { /* non-fatal */ }

    toast.success("Simulação enviada!", { description: "Nenhum dado real foi cadastrado." });
  };

  const handleDelete = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    toast.success("Removido");
  };

  return (
    <>
      <Helmet><title>Wizard de Contato — Playground</title></Helmet>
      <PlaygroundLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Wizard de Contato</h1>
            <Button onClick={() => setShowWizard(true)} className="gap-2">
              <Plus className="h-4 w-4" />Simular envio
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma submissão ainda. Clique em "Simular envio" para testar o wizard.
                    </TableCell>
                  </TableRow>
                ) : submissions.map(s => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-foreground/5" onClick={() => setSelectedId(s.id)}>
                    <TableCell className="font-medium">{s.contactInfo.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.contactInfo.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{Object.keys(s.answers).length} campos</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(s.submittedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detail Sheet */}
        <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Detalhes da submissão</SheetTitle>
            </SheetHeader>
            {selected && (
              <div className="mt-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{selected.contactInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.contactInfo.email}</p>
                  {selected.contactInfo.mobilePhone && <p className="text-sm text-muted-foreground">{selected.contactInfo.mobilePhone}</p>}
                  <Badge variant="outline" className="mt-1">{TYPE_LABELS[selected.type] ?? selected.type}</Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Respostas</p>
                  {Object.entries(selected.answers).map(([key, value]) => {
                    const label = ANSWER_KEYS[selected.type]?.[key] ?? key;
                    return (
                      <div key={key} className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm">{resolveValue(key, value)}</p>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Enviado em {format(new Date(selected.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Wizard Dialog */}
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="p-0 max-w-lg bg-transparent border-none shadow-none">
            <ContactWizard
              onClose={() => setShowWizard(false)}
              onSubmitOverride={handleSimulateSubmit}
            />
          </DialogContent>
        </Dialog>
      </PlaygroundLayout>
    </>
  );
}
