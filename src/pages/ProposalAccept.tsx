import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, FileText, Scale, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";
import { ContractModal } from "@/components/ContractModal";
import { printContractPDF } from "@/utils/contractPDF";

function toLegacyProposal(p: any) {
  if (!p) return null;
  return {
    id: p._id,
    slug: p.slug,
    version: p.version,
    client_name: p.clientName,
    title: p.title,
    objective: p.objective,
    scope: p.scope,
    timeline: p.timeline,
    delivery_date: p.deliveryDate,
    investment_value: p.investmentValue,
    original_value: p.originalValue,
    scope_prices: p.scopePrices,
    gift_indexes: p.giftIndexes,
    payment_methods: p.paymentMethods,
    conditions: p.conditions,
    rescision_policy: p.rescissionPolicy,
    created_at: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    is_accepted: p.isAccepted,
  };
}

export default function ProposalAccept() {
  const { slug } = useParams();
  const slugStr = slug ?? "";
  const [, setLocation] = useLocation();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [clientDeclaration, setClientDeclaration] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [isRescisionOpen, setIsRescisionOpen] = useState(false);

  const [showContractModal, setShowContractModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const generateUploadUrl = useMutation(api.proposals.generateSignatureUploadUrl);
  const CONVEX_SITE_URL = (import.meta.env.VITE_CONVEX_URL as string)?.replace('.convex.cloud', '.convex.site');
  const contactInfo = useQuery(api.contactInfo.get);

  // Recover token from sessionStorage
  useEffect(() => {
    if (slugStr) {
      const stored = sessionStorage.getItem(`proposal_session_slug_${slugStr}`);
      if (stored) setSessionToken(stored);
    }
  }, [slugStr]);

  const queryResult = useQuery(
    api.proposals.getPublic,
    slugStr ? { slug: slugStr, token: sessionToken ?? undefined } : "skip" as any,
  );

  const isLoading = queryResult === undefined;
  const rawProposal: any = queryResult ?? null;
  const proposal: any = useMemo(() => toLegacyProposal(rawProposal), [rawProposal]);

  // If proposal requires password and we have no token, redirect back to view
  useEffect(() => {
    if (!isLoading && rawProposal && rawProposal.requiresPassword && !sessionToken) {
      toast.error("Acesso não autorizado. Por favor, acesse a proposta primeiro.");
      const t = setTimeout(() => {
        setLocation(`/proposta/${slugStr}`);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isLoading, rawProposal, sessionToken, slugStr, setLocation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDocument = (doc: string) => {
    const numbers = doc.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const handleDocumentChange = (value: string) => {
    setClientDocument(formatDocument(value));
  };

  const handleOpenContract = () => {
    if (!rawProposal) {
      toast.error("Proposta não disponível");
      return;
    }
    // For non-password-protected proposals there's no token; accept will fail. We require token.
    if (!sessionToken && rawProposal.requiresPassword) {
      toast.error("Sessão inválida");
      return;
    }

    if (!clientName.trim()) {
      toast.error("Preencha o nome completo");
      return;
    }
    if (!clientDocument.trim()) {
      toast.error("Preencha o CPF ou CNPJ");
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast.error("Preencha um e-mail válido");
      return;
    }
    if (!hasConsent) {
      toast.error("Você deve concordar com os termos para ler o contrato");
      return;
    }

    setShowContractModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
          <p>Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!rawProposal) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-foreground/65">A proposta solicitada não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  if (rawProposal.requiresPassword && !sessionToken) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-foreground/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acesso Não Autorizado</h1>
            <p className="text-foreground/65 mb-4">
              Você precisa acessar a proposta primeiro antes de aceitá-la.
            </p>
            <Button
              onClick={() => setLocation(`/proposta/${slugStr}`)}
              className="bg-neon-purple hover:bg-neon-purple/90"
            >
              Voltar para Proposta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground-strong font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-lime/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
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
                  <p className="text-foreground/90 leading-relaxed">
                    Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.
                  </p>
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
                  <Input
                    id="clientName"
                    className="bg-background border-input mt-1"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientDocument">CPF ou CNPJ *</Label>
                  <Input
                    id="clientDocument"
                    className="bg-background border-input mt-1"
                    value={clientDocument}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientEmail">E-mail *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    className="bg-background border-input mt-1"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="clientRole">Cargo/Função (Opcional, B2B)</Label>
                  <Input
                    id="clientRole"
                    className="bg-background border-input mt-1"
                    value={clientRole}
                    onChange={(e) => setClientRole(e.target.value)}
                    placeholder="Ex: Diretor, Gerente, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientDeclaration">Declaração de Poderes para Contratar (se Pessoa Jurídica)</Label>
                <Textarea
                  id="clientDeclaration"
                  className="bg-background border-input mt-1"
                  rows={3}
                  value={clientDeclaration}
                  onChange={(e) => setClientDeclaration(e.target.value)}
                  placeholder="Declare que possui poderes para representar a empresa e celebrar este contrato..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Resumo da Proposta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground/65">Cliente:</span>
                  <span className="ml-2 text-foreground-strong">{rawProposal.clientName}</span>
                </div>
                <div>
                  <span className="text-foreground/65">Valor Total:</span>
                  {rawProposal.originalValue > rawProposal.investmentValue && (
                    <s className="ml-2 text-foreground/50" aria-label={`Valor original: ${formatCurrency(rawProposal.originalValue)}`}>
                      {formatCurrency(rawProposal.originalValue)}
                    </s>
                  )}
                  <span className="ml-2 text-foreground-strong font-bold">{formatCurrency(rawProposal.investmentValue)}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-foreground/65">Objetivo:</span>
                  <p className="mt-1 text-foreground-strong">{rawProposal.objective}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
            <CardContent className="p-6">
              <Collapsible open={isRescisionOpen} onOpenChange={setIsRescisionOpen}>
                <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer outline-none">
                  <h2 className="text-xl font-bold">Política de Rescisão</h2>
                  <ChevronDown className={`w-5 h-5 text-foreground/65 transition-transform duration-200 shrink-0 ${isRescisionOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="prose dark:prose-invert prose-headings:text-foreground-strong prose-p:text-foreground/90 prose-strong:text-foreground-strong prose-ul:text-foreground/90 prose-li:text-foreground/90 prose-hr:border-foreground/10 max-w-none">
                    <ReactMarkdown>
                      {rawProposal.rescissionPolicy || DEFAULT_RESCISION_POLICY}
                    </ReactMarkdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-2">Foro</h2>
              <p className="text-foreground/90">
                Fica eleito o foro da comarca de Itapevi – SP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-foreground/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={hasConsent}
                  onCheckedChange={(checked) => setHasConsent(checked === true)}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-base cursor-pointer">
                  Li e concordo com todos os termos desta proposta, incluindo escopo, valores, prazos, condições gerais e política de rescisão.
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground px-12 py-6 text-lg"
              onClick={handleOpenContract}
              disabled={!hasConsent}
            >
              <FileText className="w-5 h-5 mr-2" />
              Ler Contrato
            </Button>
          </div>

          <div className="text-center text-sm text-foreground/42">
            <p>
              Ao clicar em "Ler Contrato", você poderá visualizar o contrato completo.
              A proposta só será aceita quando você assinar digitalmente no final do contrato.
            </p>
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
          sessionToken={sessionToken}
          onSign={(sig) => handleDigitalSignature(sig)}
          isSigning={isSigning}
        />
      )}
    </div>
  );

  async function handleDigitalSignature(signatureDataUrl: string) {
    if (!proposal || !rawProposal) return;
    if (!sessionToken) {
      toast.error("Sessão inválida. Recarregue a página.");
      return;
    }

    setIsSigning(true);

    try {
      const acceptedAtTs = Date.now();
      const userAgent = navigator.userAgent;

      // Upload signature to Convex storage (server validates session)
      let signatureStorageId: string | undefined;
      try {
        const uploadUrl = await generateUploadUrl({
          slug: slugStr,
          token: sessionToken ?? undefined,
        });
        const blob = await (await fetch(signatureDataUrl)).blob();
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
        const { storageId } = await uploadRes.json();
        signatureStorageId = storageId;
      } catch {
        // Non-fatal: proceed without stored signature
      }

      let serverContentHash: string | undefined;
      let serverIpAddress: string | undefined;
      try {
        const acceptRes = await fetch(`${CONVEX_SITE_URL}/api/proposal/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slugStr,
            token: sessionToken ?? undefined,
            clientName: clientName.trim(),
            clientDocument: clientDocument.replace(/\D/g, ''),
            clientEmail: clientEmail.trim(),
            clientRole: clientRole.trim() || undefined,
            clientDeclaration: clientDeclaration.trim() || undefined,
            userAgent: userAgent || "unknown",
            signatureStorageId: signatureStorageId ?? undefined,
          }),
        });
        if (!acceptRes.ok) {
          const data = await acceptRes.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? 'ERROR');
        }
        const acceptData = await acceptRes.json() as { contentHash?: string; ipAddress?: string };
        serverContentHash = acceptData.contentHash;
        serverIpAddress = acceptData.ipAddress;
      } catch (error: any) {
        const msg = String(error?.message ?? "");
        if (msg.includes('Already accepted') || msg.includes('já foi aceita')) {
          toast.error("Esta proposta já foi aceita anteriormente");
        } else if (msg.includes('Invalid or expired session') || msg.includes('Sessão inválida')) {
          sessionStorage.removeItem(`proposal_session_slug_${slugStr}`);
          setSessionToken(null);
          toast.error("Sessão expirada. Acesse a proposta novamente para continuar.");
          setTimeout(() => setLocation(`/proposta/${slugStr}`), 2500);
        } else {
          throw error;
        }
        setIsSigning(false);
        return;
      }

      const acceptanceData = {
        client_name: clientName.trim(),
        client_document: formatDocument(clientDocument),
        client_email: clientEmail.trim(),
        client_role: clientRole.trim() || undefined,
        client_declaration: clientDeclaration.trim() || undefined,
        accepted_at: new Date(acceptedAtTs).toISOString(),
        ip_address: serverIpAddress ?? null,
        user_agent: userAgent || null,
        content_hash: serverContentHash,
        proposal_version: String(rawProposal?.version ?? 1),
      };

      await printContractPDF(proposal, acceptanceData, signatureDataUrl, contactInfo ?? undefined);

      toast.success("Contrato assinado digitalmente e PDF gerado com sucesso!");

      setTimeout(() => {
        setShowContractModal(false);
        setLocation(`/proposta/${slugStr}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Erro ao assinar contrato");
    } finally {
      setIsSigning(false);
    }
  }
}
