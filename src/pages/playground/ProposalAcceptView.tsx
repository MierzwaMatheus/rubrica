import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, FileText, Scale, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";
import { ContractModal } from "@/components/ContractModal";
import { printContractPDF } from "@/utils/contractPDF";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import type { PlaygroundProposal } from "@/components/playground/PlaygroundProposalDialog";
import { Helmet } from "react-helmet-async";

function toLegacyProposal(p: PlaygroundProposal) {
  return {
    id: p.id,
    slug: p.slug,
    version: 1,
    client_name: p.clientName,
    title: p.title,
    objective: p.objective,
    scope: p.scope,
    timeline: p.timeline,
    delivery_date: p.deliveryDate,
    investment_value: p.investmentValue,
    payment_methods: [],
    conditions: p.conditions,
    rescision_policy: p.rescissionPolicy,
    created_at: new Date(p.createdAt).toISOString(),
    is_accepted: p.isAccepted,
  };
}

async function generateContentHash(contentSnapshot: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(contentSnapshot);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function formatDocument(doc: string) {
  const n = doc.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

export default function PlaygroundProposalAcceptView() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [proposals, setProposals] = usePlaygroundStorage<PlaygroundProposal[]>("pg_proposals", []);

  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [clientDeclaration, setClientDeclaration] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [isRescisionOpen, setIsRescisionOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const rawProposal = useMemo(() => proposals.find(p => p.slug === slug) ?? null, [proposals, slug]);
  const proposal = useMemo(() => rawProposal ? toLegacyProposal(rawProposal) : null, [rawProposal]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleOpenContract = () => {
    if (!rawProposal) return toast.error("Proposta não disponível");
    if (!clientName.trim()) return toast.error("Preencha o nome completo");
    if (!clientDocument.trim()) return toast.error("Preencha o CPF ou CNPJ");
    if (!clientEmail.trim() || !clientEmail.includes("@")) return toast.error("Preencha um e-mail válido");
    if (!hasConsent) return toast.error("Você deve concordar com os termos para ler o contrato");
    setShowContractModal(true);
  };

  if (!rawProposal) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
        <Button onClick={() => setLocation("/playground/proposal")}>Voltar</Button>
      </div>
    );
  }

  if (rawProposal.isAccepted) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center flex-col gap-4 p-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h1 className="text-2xl font-bold">Proposta já aceita</h1>
        <p className="text-foreground/65">Esta proposta já foi aceita eletronicamente.</p>
        <Button onClick={() => setLocation(`/playground/proposal/${slug}`)}>Ver Proposta</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Aceite — {rawProposal.title || rawProposal.clientName} — Playground</title></Helmet>
      <div className="min-h-screen bg-background text-foreground-strong font-sans">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs text-center py-2 font-medium">
          Modo Demonstração — Fluxo real de aceite rodando com dados do playground
        </div>

        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-lime/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setLocation(`/playground/proposal/${slug}`)}>
              <ArrowLeft className="w-4 h-4" />
              Voltar à proposta
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-neon-purple mb-4">
                <Scale className="w-6 h-6" />
                <h1 className="text-3xl font-bold">Aceite Eletrônico de Proposta</h1>
              </div>
              <p className="text-xl text-foreground/65">
                Proposta: <span className="text-foreground-strong font-semibold">{rawProposal.title || `Projeto para ${rawProposal.clientName}`}</span>
              </p>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-neon-purple/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-neon-purple mt-1 shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold mb-2">Cláusula de Aceite Eletrônico</h2>
                    <p className="text-foreground/90 leading-relaxed">Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-neon-purple" />
                  Dados para Aceite
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nome Completo *</Label>
                    <Input id="clientName" className="bg-background border-input mt-1" value={clientName} onChange={e => setClientName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="clientDocument">CPF ou CNPJ *</Label>
                    <Input id="clientDocument" className="bg-background border-input mt-1" value={clientDocument} onChange={e => setClientDocument(formatDocument(e.target.value))} placeholder="000.000.000-00 ou 00.000.000/0000-00" required />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">E-mail *</Label>
                    <Input id="clientEmail" type="email" className="bg-background border-input mt-1" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="clientRole">Cargo/Função (Opcional, B2B)</Label>
                    <Input id="clientRole" className="bg-background border-input mt-1" value={clientRole} onChange={e => setClientRole(e.target.value)} placeholder="Ex: Diretor, Gerente, etc." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientDeclaration">Declaração de Poderes para Contratar (se Pessoa Jurídica)</Label>
                  <Textarea id="clientDeclaration" className="bg-background border-input mt-1" rows={3} value={clientDeclaration} onChange={e => setClientDeclaration(e.target.value)} placeholder="Declare que possui poderes para representar a empresa e celebrar este contrato..." />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Resumo da Proposta</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-foreground/65">Cliente:</span><span className="ml-2 text-foreground-strong">{rawProposal.clientName}</span></div>
                  <div><span className="text-foreground/65">Valor Total:</span><span className="ml-2 text-foreground-strong font-bold">{formatCurrency(rawProposal.investmentValue)}</span></div>
                  <div className="md:col-span-2"><span className="text-foreground/65">Objetivo:</span><p className="mt-1 text-foreground-strong">{rawProposal.objective}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
              <CardContent className="p-6">
                <Collapsible open={isRescisionOpen} onOpenChange={setIsRescisionOpen}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer outline-none">
                    <h2 className="text-xl font-bold">Política de Rescisão</h2>
                    <ChevronDown className={`w-5 h-5 text-foreground/65 transition-transform duration-200 shrink-0 ${isRescisionOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="prose prose-invert prose-headings:text-foreground-strong prose-p:text-foreground/90 prose-strong:text-foreground-strong prose-ul:text-foreground/90 prose-li:text-foreground/90 prose-hr:border-foreground/10 max-w-none">
                      <ReactMarkdown>{rawProposal.rescissionPolicy || DEFAULT_RESCISION_POLICY}</ReactMarkdown>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-2">Foro</h2>
                <p className="text-foreground/90">Fica eleito o foro da comarca de Itapevi – SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="consent" checked={hasConsent} onCheckedChange={checked => setHasConsent(checked === true)} className="mt-1" />
                  <Label htmlFor="consent" className="text-base cursor-pointer">Li e concordo com todos os termos desta proposta, incluindo escopo, valores, prazos, condições gerais e política de rescisão.</Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button size="lg" className="bg-neon-purple hover:bg-neon-purple/90 text-white px-12 py-6 text-lg" onClick={handleOpenContract} disabled={!hasConsent}>
                <FileText className="w-5 h-5 mr-2" />
                Ler Contrato
              </Button>
            </div>

            <div className="text-center text-sm text-foreground/42">
              <p>Ao clicar em "Ler Contrato", você poderá visualizar o contrato completo. A proposta só será aceita quando você assinar digitalmente no final do contrato.</p>
            </div>
          </motion.div>
        </div>

        {proposal && clientName && clientDocument && clientEmail && (
          <ContractModal
            open={showContractModal}
            onOpenChange={setShowContractModal}
            proposal={proposal}
            clientData={{
              client_name: clientName.trim(),
              client_document: formatDocument(clientDocument),
              client_email: clientEmail.trim(),
              client_role: clientRole.trim() || null,
              client_declaration: clientDeclaration.trim() || null,
            }}
            sessionToken={null}
            onSign={sig => handleDigitalSignature(sig)}
            isSigning={isSigning}
          />
        )}
      </div>
    </>
  );

  async function handleDigitalSignature(signatureDataUrl: string) {
    if (!proposal || !rawProposal) return;
    setIsSigning(true);
    try {
      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then(r => r.json()).then(d => d.ip).catch(() => null);
      const userAgent = navigator.userAgent;
      const acceptedAtTs = Date.now();

      const contentSnapshot = JSON.stringify({
        proposal: {
          id: proposal.id, title: proposal.title, objective: proposal.objective,
          investment_value: proposal.investment_value, scope: proposal.scope,
          timeline: proposal.timeline, conditions: proposal.conditions,
          rescision_policy: proposal.rescision_policy,
        },
        acceptance: {
          client_name: clientName.trim(), client_document: clientDocument.replace(/\D/g, ""),
          client_email: clientEmail.trim(), client_role: clientRole.trim() || null,
          client_declaration: clientDeclaration.trim() || null,
          accepted_at: new Date(acceptedAtTs).toISOString(),
          ip_address: ipAddress || null, user_agent: userAgent || null,
        },
      });
      const contentHash = await generateContentHash(contentSnapshot);

      const acceptanceData = {
        client_name: clientName.trim(),
        client_document: formatDocument(clientDocument),
        client_email: clientEmail.trim(),
        client_role: clientRole.trim() || undefined,
        client_declaration: clientDeclaration.trim() || undefined,
        accepted_at: new Date(acceptedAtTs).toISOString(),
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        content_hash: contentHash,
        proposal_version: "1",
      };

      // Save acceptance to localStorage
      setProposals(prev => prev.map(p =>
        p.slug === slug ? {
          ...p,
          isAccepted: true,
          acceptedAt: acceptedAtTs,
          acceptance: {
            clientName: clientName.trim(),
            clientDocument: formatDocument(clientDocument),
            clientEmail: clientEmail.trim(),
            clientRole: clientRole.trim() || undefined,
            clientDeclaration: clientDeclaration.trim() || undefined,
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            contentHash,
            signatureDataUrl,
            acceptedAt: new Date(acceptedAtTs).toISOString(),
          },
        } : p
      ));

      await printContractPDF(proposal, acceptanceData, signatureDataUrl, undefined);
      toast.success("Contrato assinado digitalmente e PDF gerado com sucesso!");

      setTimeout(() => {
        setShowContractModal(false);
        setLocation(`/playground/proposal/${slug}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Erro ao assinar contrato");
    } finally {
      setIsSigning(false);
    }
  }
}
