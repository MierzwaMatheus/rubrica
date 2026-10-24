import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, RefreshCw, Link as LinkIcon, X, Copy, KeyRound, Upload, Download, RotateCcw, ShieldAlert } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import { toast } from "sonner";
import { printContractPDF } from "@/utils/contractPDF";
import { useIsRoot } from "@/hooks/useIsRoot";
import { buildProposalPrompt } from "@/utils/proposalPrompt";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

function DownloadContractButton({ proposal }: { proposal: any }) {
  const [loading, setLoading] = useState(false);
  const acceptanceRaw = useQuery(api.proposals.getAcceptance, { slug: proposal.slug });
  const contactInfo = useQuery(api.contactInfo.get);

  const handleDownload = async () => {
    if (!acceptanceRaw) { toast.error("Dados do aceite não encontrados"); return; }
    setLoading(true);
    try {
      const legacyProposal = {
        id: proposal._id, slug: proposal.slug, version: proposal.version,
        client_name: proposal.clientName, title: proposal.title,
        objective: proposal.objective, scope: proposal.scope,
        timeline: proposal.timeline, delivery_date: proposal.deliveryDate,
        investment_value: proposal.investmentValue, payment_methods: proposal.paymentMethods,
        conditions: proposal.conditions, rescision_policy: proposal.rescissionPolicy,
      };
      const legacyAcceptance = {
        client_name: acceptanceRaw.clientName,
        client_document: acceptanceRaw.clientDocument,
        client_email: acceptanceRaw.clientEmail,
        client_role: acceptanceRaw.clientRole ?? undefined,
        client_declaration: acceptanceRaw.clientDeclaration ?? undefined,
        accepted_at: new Date(acceptanceRaw.acceptedAt).toISOString(),
        ip_address: acceptanceRaw.ipAddress ?? null,
        user_agent: acceptanceRaw.userAgent ?? null,
        content_hash: acceptanceRaw.contentHash ?? undefined,
        proposal_version: String(acceptanceRaw.proposalVersion ?? 1),
      };
      const signatureUrl = (acceptanceRaw as any).signatureUrl ?? "";
      await printContractPDF(legacyProposal, legacyAcceptance, signatureUrl, contactInfo ?? undefined);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
      onClick={handleDownload}
      disabled={loading || !acceptanceRaw}
      title="Baixar contrato"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}

export default function AdminProposals() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const proposalsData = useQuery(api.proposals.listAdmin, { filter: "all", includeDeleted: isRoot && includeDeleted });
  const contactInfo = useQuery(api.contactInfo.get);
  const proposals = proposalsData ?? [];
  const isLoading = proposalsData === undefined;

  const createProposal = useMutation(api.proposals.create);
  const updateProposal = useMutation(api.proposals.update);
  const removeProposal = useMutation(api.proposals.remove);
  const permanentDeleteProposal = useMutation(api.proposals.permanentDelete);
  const restoreProposal = useMutation(api.proposals.restore);

  const search = useSearch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Atalhos "Novo ..." do painel/command palette chegam com ?create=true (issue #56)
  useEffect(() => {
    if (search.includes("create=true")) {
      setIsModalOpen(true);
    }
  }, [search]);
  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [jsonPasteContent, setJsonPasteContent] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [objective, setObjective] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [investmentValue, setInvestmentValue] = useState("");

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

  // Legal fields
  const [password, setPassword] = useState("");
  const [rescisionPolicy, setRescisionPolicy] = useState(DEFAULT_RESCISION_POLICY);

  const checkSlugAvailability = (slugToCheck: string) => {
    if (!slugToCheck) return;
    const existing = proposals.find((p: any) =>
      p.slug === slugToCheck && (!editingProposal || p._id !== editingProposal._id)
    );
    setSlugError(existing ? "Este slug já está em uso." : "");
  };

  const handleCreateProposal = async () => {
    if (slugError) return alert("Corrija o erro do slug antes de continuar.");
    if (!clientName || !slug) return alert("Preencha os campos obrigatórios.");

    if (editingProposal?.isAccepted) {
      return alert("Esta proposta já foi aceita e não pode ser editada. Crie uma nova proposta.");
    }

    const selectedConditions = conditions.filter(c => c.checked).map(c => c.text);
    const investment = parseFloat(investmentValue.replace(',', '.')) || 0;

    try {
      if (editingProposal) {
        await updateProposal({
          id: editingProposal._id as Id<"proposals">,
          clientName,
          title: title || "",
          objective,
          scope: scopeItems,
          timeline: timelineItems,
          deliveryDate: deliveryDate || "",
          investmentValue: investment,
          paymentMethods: editingProposal.paymentMethods ?? [],
          conditions: selectedConditions,
          password: password || undefined,
          rescissionPolicy: rescisionPolicy || DEFAULT_RESCISION_POLICY,
        });
        toast.success("Proposta atualizada com sucesso! Uma nova versão foi criada.");
        setIsModalOpen(false);
        setEditingProposal(null);
        resetForm();
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
          password: password || undefined,
          rescissionPolicy: rescisionPolicy || DEFAULT_RESCISION_POLICY,
        });
        toast.success("Proposta criada com sucesso!");
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error: any) {
      console.error("Error saving proposal:", error);
      toast.error(error?.message || "Erro ao salvar proposta.");
    }
  };

  const resetForm = () => {
    setEditingProposal(null);
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
    setPassword("");
    setRescisionPolicy(DEFAULT_RESCISION_POLICY);
  };

  const calculateValidUntil = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTimestampDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('pt-BR');

  const calculateValidUntilTs = (timestamp: number) => {
    const d = new Date(timestamp);
    d.setDate(d.getDate() + 10);
    return d.toLocaleDateString('pt-BR');
  };

  const getStatus = (createdAtTs: number) => {
    const validUntil = createdAtTs + TEN_DAYS_MS;
    return Date.now() > validUntil ? "Inativo" : "Ativo";
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

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/proposta/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleDelete = (id: string, name?: string) => {
    setDeleteTarget({ id, name });
  };

  const handleRestore = async (id: string) => {
    try { await restoreProposal({ id: id as Id<"proposals"> }); toast.success('Proposta restaurada'); } catch (e: any) { toast.error(e?.message || 'Erro'); }
  };

  const handleEdit = (proposal: any) => {
    setEditingProposal(proposal);
    setTitle(proposal.title || "");
    setClientName(proposal.clientName || "");
    setSlug(proposal.slug || "");
    setCreatedAt(new Date(proposal.createdAt).toISOString().split('T')[0]);
    setObjective(proposal.objective || "");
    setDeliveryDate(proposal.deliveryDate || "");
    setInvestmentValue(proposal.investmentValue?.toString().replace('.', ',') || "");
    setScopeItems(Array.isArray(proposal.scope) ? proposal.scope : []);
    setTimelineItems(Array.isArray(proposal.timeline) ? proposal.timeline : []);

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

    setPassword("");
    setRescisionPolicy(proposal.rescissionPolicy || DEFAULT_RESCISION_POLICY);
    setIsModalOpen(true);
  };

  const handleReload = async (proposal: any) => {
    try {
      // Refresh validity by extending expiresAt
      await updateProposal({
        id: proposal._id as Id<"proposals">,
        expiresAt: Date.now() + TEN_DAYS_MS,
      });
      toast.success("Validade da proposta atualizada!");
    } catch (error: any) {
      console.error("Error updating proposal date:", error);
      toast.error(error?.message || "Erro ao atualizar data da proposta.");
    }
  };

  const processJsonData = async (jsonData: any): Promise<boolean> => {
    if (!jsonData.client_name || !jsonData.slug) {
      toast.error("Erro: O JSON deve conter 'client_name' e 'slug' como campos obrigatórios.");
      return false;
    }

    const existing = proposals.find((p: any) => p.slug === jsonData.slug);
    if (existing) {
      toast.error(`Erro: O slug "${jsonData.slug}" já está em uso.`);
      return false;
    }

    let timeline: { step: string; period: string }[] = [];
    if (Array.isArray(jsonData.timeline)) {
      timeline = jsonData.timeline
        .map((item: any) =>
          typeof item === 'object' && item.step && item.period
            ? { step: String(item.step), period: String(item.period) }
            : null
        )
        .filter((item: any) => item !== null);
    }

    const scope: string[] = Array.isArray(jsonData.scope) ? jsonData.scope.map((i: any) => String(i)) : [];
    const conditionsArr: string[] = Array.isArray(jsonData.conditions) ? jsonData.conditions.map((i: any) => String(i)) : [];
    const rescissionPolicyVal = jsonData.rescision_policy?.trim() ? String(jsonData.rescision_policy) : DEFAULT_RESCISION_POLICY;

    try {
      await createProposal({
        clientName: String(jsonData.client_name),
        slug: String(jsonData.slug),
        title: jsonData.title?.trim() || "",
        objective: jsonData.objective?.trim() || '',
        scope,
        timeline,
        deliveryDate: jsonData.delivery_date?.trim() || "",
        investmentValue: typeof jsonData.investment_value === 'number'
          ? jsonData.investment_value
          : parseFloat(String(jsonData.investment_value || 0).replace(',', '.')) || 0,
        paymentMethods: [],
        conditions: conditionsArr,
        password: jsonData.password?.trim() || undefined,
        rescissionPolicy: rescissionPolicyVal,
      });
      toast.success("Proposta criada com sucesso a partir do JSON!");
      setIsJsonImportModalOpen(false);
      setJsonPasteContent("");
      return true;
    } catch (error: any) {
      console.error("Error creating proposal from JSON:", error);
      toast.error(`Erro ao criar proposta: ${error?.message ?? 'desconhecido'}`);
      return false;
    }
  };

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await processJsonData(jsonData);
    } catch (error) {
      console.error("Error processing JSON file:", error);
      if (error instanceof SyntaxError) {
        toast.error("Erro: O arquivo JSON está mal formatado. Verifique a sintaxe.");
      } else {
        toast.error(`Erro ao processar arquivo JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  const handleJsonPaste = async () => {
    if (!jsonPasteContent.trim()) {
      toast.error("Por favor, cole o conteúdo JSON antes de importar.");
      return;
    }
    try {
      const jsonData = JSON.parse(jsonPasteContent);
      await processJsonData(jsonData);
    } catch (error) {
      console.error("Error processing pasted JSON:", error);
      if (error instanceof SyntaxError) {
        toast.error("Erro: O JSON colado está mal formatado. Verifique a sintaxe.");
      } else {
        toast.error(`Erro ao processar JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground-strong flex items-center gap-2">
            <span className="text-neon-purple">📄</span> Propostas Comerciais
          </h1>
          <div className="flex flex-wrap gap-2">
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
            <Dialog open={isJsonImportModalOpen} onOpenChange={setIsJsonImportModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-background hover:bg-background/90 text-foreground-strong border-foreground/20 text-xs sm:text-sm"
                >
                  <Upload className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Importar JSON</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-foreground/10 max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[85vh] overflow-y-scroll text-foreground-strong">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Importar Proposta via JSON
                  </DialogTitle>
                  <VisuallyHidden>
                    <h2>Dialog para importação de proposta via JSON</h2>
                  </VisuallyHidden>
                </DialogHeader>

                <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4 space-y-2">
                  <p className="text-sm text-foreground/90">
                    Use o prompt abaixo com qualquer LLM (ChatGPT, Claude, Gemini) para gerar o JSON da proposta automaticamente.
                    Preencha as informações do cliente no topo do prompt antes de enviar.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10 gap-2"
                    onClick={() => {
                      const prompt = buildProposalPrompt(contactInfo?.proposalAiContext ?? "");
                      navigator.clipboard.writeText(prompt).then(() => toast.success("Prompt copiado!"));
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Prompt para IA
                  </Button>
                </div>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
                    <TabsTrigger value="paste">Colar JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div>
                      <Label className="block text-sm mb-2">Selecione um arquivo JSON</Label>
                      <input
                        id="json-upload"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleJsonUpload}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-background hover:bg-background/90 text-foreground-strong border-foreground/20"
                        onClick={() => document.getElementById('json-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" /> Escolher Arquivo JSON
                      </Button>
                      <p className="text-xs text-foreground/42 mt-2">
                        Selecione um arquivo JSON válido com a estrutura da proposta
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4 mt-4">
                    <div>
                      <Label className="block text-sm mb-2">Cole o conteúdo JSON aqui</Label>
                      <Textarea
                        className="bg-background border-input min-h-[400px] font-mono text-sm"
                        placeholder='Cole o JSON aqui, por exemplo:&#10;{&#10;  "client_name": "Nome do Cliente",&#10;  "slug": "slug-da-proposta"&#10;  ...&#10;}'
                        value={jsonPasteContent}
                        onChange={(e) => setJsonPasteContent(e.target.value)}
                      />
                      <p className="text-xs text-foreground/42 mt-2">
                        Cole o conteúdo completo do JSON no campo acima
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsJsonImportModalOpen(false);
                          setJsonPasteContent("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleJsonPaste}
                      >
                        Importar JSON
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white text-xs sm:text-sm">
                  <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Proposta</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-foreground/10 max-w-2xl w-full max-h-[85vh] flex flex-col text-foreground-strong p-0 min-h-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-bold">
                    {editingProposal ? "Editar Proposta" : "Nova Proposta"}
                  </DialogTitle>
                  <VisuallyHidden>
                    <h2>Formulário de {editingProposal ? "edição" : "criação"} de proposta</h2>
                  </VisuallyHidden>
                </DialogHeader>

                <div className="space-y-6 py-2 px-6 overflow-y-auto flex-1 min-h-0">
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
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <Input
                        placeholder="Adicionar item..."
                        className="bg-background border-input flex-1"
                        value={newScopeItem}
                        onChange={(e) => setNewScopeItem(e.target.value)}
                      />
                      <Button onClick={handleAddScopeItem} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">Adicionar</Button>
                    </div>
                    <ul className="space-y-1">
                      {scopeItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between bg-foreground/5 p-2 rounded text-sm gap-2">
                          <span className="flex-1 wrap-break-word min-w-0">{item}</span>
                          <button onClick={() => handleRemoveScopeItem(index)} className="text-red-400 hover:text-red-300 shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Label className="block text-sm mb-1">Cronograma</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <Input
                        placeholder="Etapa"
                        className="bg-background border-input flex-1"
                        value={newTimelineStep}
                        onChange={(e) => setNewTimelineStep(e.target.value)}
                      />
                      <Input
                        placeholder="Período estimado"
                        className="bg-background border-input flex-1"
                        value={newTimelinePeriod}
                        onChange={(e) => setNewTimelinePeriod(e.target.value)}
                      />
                      <Button onClick={handleAddTimelineItem} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">Adicionar</Button>
                    </div>
                    <ul className="space-y-1">
                      {timelineItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between bg-foreground/5 p-2 rounded text-sm gap-2">
                          <span className="flex-1 wrap-break-word min-w-0">{item.step} - {item.period}</span>
                          <button onClick={() => handleRemoveTimelineItem(index)} className="text-red-400 hover:text-red-300 shrink-0">
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
                      <span className="absolute left-3 top-2.5 text-foreground/65 text-sm">R$</span>
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
                            className="mt-1 rounded border-foreground/80 shrink-0"
                          />
                          <Textarea
                            value={condition.text}
                            onChange={(e) => {
                              const newConditions = [...conditions];
                              newConditions[i].text = e.target.value;
                              setConditions(newConditions);
                            }}
                            className="bg-background border-input min-h-[60px] text-sm flex-1 min-w-0"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm mb-1">Senha de Acesso (Opcional)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        className="bg-background border-input flex-1"
                        placeholder="Deixe em branco para manter ou remover proteção"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className="flex gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            const arr = new Uint8Array(10);
                            crypto.getRandomValues(arr);
                            const randomPassword = Array.from(arr, (b) => chars[b % chars.length]).join('');
                            setPassword(randomPassword);
                            toast.success("Senha gerada com sucesso!");
                          }}
                          title="Gerar senha aleatória"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {password && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(password);
                              toast.success("Senha copiada para a área de transferência!");
                            }}
                            title="Copiar senha"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/42 mt-1">
                      Se definida, o cliente precisará informar esta senha para acessar a proposta.
                    </p>
                  </div>

                  <div>
                    <Label className="block text-sm mb-1">Política de Rescisão</Label>
                    <Textarea
                      className="bg-background border-input min-h-[120px]"
                      rows={5}
                      placeholder="Descreva as hipóteses de rescisão, multas ou proporcionalidades, procedimentos e prazos..."
                      value={rescisionPolicy}
                      onChange={(e) => setRescisionPolicy(e.target.value)}
                    />
                    <p className="text-xs text-foreground/42 mt-1">
                      Esta política será exibida na proposta e deve incluir hipóteses de rescisão, multas ou proporcionalidades, procedimentos e prazos.
                    </p>
                  </div>
                </div>

                <div className="border-t border-foreground/10 px-6 py-4 mt-auto flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 bg-card">
                  <Button variant="ghost" onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}>Cancelar</Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleCreateProposal}
                  >
                    {editingProposal ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="accepted">Aceitas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="rounded-md border border-foreground/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-foreground/5">
                  <TableRow className="border-foreground/10 hover:bg-foreground/5">
                    <TableHead className="text-foreground/90">Cliente</TableHead>
                    <TableHead className="text-foreground/90">Data de Criação</TableHead>
                    <TableHead className="text-foreground/90">Validade</TableHead>
                    <TableHead className="text-foreground/90">Status</TableHead>
                    <TableHead className="text-foreground/90 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-foreground/65 py-8">Carregando...</TableCell></TableRow>
                  ) : proposals.filter((p: any) => !p.isAccepted).map((proposal: any) => (
                    <TableRow key={proposal._id} className={`border-foreground/10 hover:bg-foreground/5 ${proposal.deletedAt ? 'opacity-60' : ''}`}>
                      <TableCell className="font-medium text-foreground-strong">
                        <div className="flex items-center gap-2 flex-wrap">
                          {proposal.clientName}
                          {proposal.deletedAt && (
                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
                              <ShieldAlert className="w-3 h-3" />
                              Deletado
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground/65">{formatTimestampDate(proposal.createdAt)}</TableCell>
                      <TableCell className="text-foreground/65">{calculateValidUntilTs(proposal.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {!proposal.deletedAt && (
                            <Badge
                              variant="outline"
                              className={`${getStatus(proposal.createdAt) === "Ativo"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : "bg-gray-500/10 text-foreground/42 border-foreground/8"
                                }`}
                            >
                              {getStatus(proposal.createdAt)}
                            </Badge>
                          )}
                          {proposal.version > 1 && (
                            <span className="text-xs text-foreground/42">v{proposal.version}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {proposal.deletedAt ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              onClick={() => handleRestore(proposal._id)}
                              title="Restaurar"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
                            onClick={() => handleEdit(proposal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDelete(proposal._id, proposal.title || proposal.clientName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
                            onClick={() => handleReload(proposal)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
                            onClick={() => handleCopyLink(proposal.slug)}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            <div className="rounded-md border border-foreground/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-foreground/5">
                  <TableRow className="border-foreground/10 hover:bg-foreground/5">
                    <TableHead className="text-foreground/90">Cliente</TableHead>
                    <TableHead className="text-foreground/90">Data de Criação</TableHead>
                    <TableHead className="text-foreground/90">Data de Aceite</TableHead>
                    <TableHead className="text-foreground/90">Senha de Acesso</TableHead>
                    <TableHead className="text-foreground/90">Status</TableHead>
                    <TableHead className="text-foreground/90 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.filter((p: any) => p.isAccepted).map((proposal: any) => (
                    <TableRow key={proposal._id} className="border-foreground/10 hover:bg-foreground/5">
                      <TableCell className="font-medium text-foreground-strong">
                        {proposal.clientName}
                        <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                          Aceita
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground/65">{formatTimestampDate(proposal.createdAt)}</TableCell>
                      <TableCell className="text-foreground/65">
                        {proposal.acceptedAt ? formatTimestampDate(proposal.acceptedAt) : '-'}
                      </TableCell>
                      <TableCell className="text-foreground/65">
                        {proposal.password ? (
                          <span className="text-yellow-400 text-sm font-medium">Protegida</span>
                        ) : (
                          <span className="text-foreground/42 text-sm">Pública</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            Aceita
                          </Badge>
                          {proposal.version > 1 && (
                            <span className="text-xs text-foreground/42">v{proposal.version}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
                            onClick={() => handleReload(proposal)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground/65 hover:text-foreground-strong hover:bg-foreground/10"
                            onClick={() => handleCopyLink(proposal.slug)}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <DownloadContractButton proposal={proposal} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          await removeProposal({ id: deleteTarget!.id as Id<"proposals"> });
          toast.success('Proposta excluída');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDeleteProposal({ id: deleteTarget!.id as Id<"proposals"> });
          toast.success('Proposta excluída permanentemente');
        } : undefined}
      />
      </div>
    </AdminLayout>
  );
}
