import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar, DollarSign, Download, AlertTriangle, FileCheck, Lock, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";
import { ContractModal } from "@/components/ContractModal";
import { generatePaymentMethods } from "@/utils/contractGenerator";
import { printContractPDF } from "@/utils/contractPDF";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { summarizeDiscount } from "../../convex/lib/proposalDiscount";

// Build a snake_case adapter so existing utils (contractGenerator, ContractModal) still work
function toLegacyProposal(p: any) {
  if (!p) return null;
  return {
    id: p._id,
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

export default function Proposal() {
  const { id } = useParams(); // This is the slug
  const slug = id ?? "";
  const [, setLocation] = useLocation();
  const siteConfig = useSiteConfig();
  const authorName = siteConfig.author_name;
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isRescisionOpen, setIsRescisionOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const CONVEX_SITE_URL = (import.meta.env.VITE_CONVEX_URL as string)?.replace('.convex.cloud', '.convex.site');

  // Try recover token from sessionStorage on slug change
  useEffect(() => {
    setIsVisible(true);
    if (slug) {
      const stored = sessionStorage.getItem(`proposal_session_slug_${slug}`);
      if (stored) setSessionToken(stored);
    }
  }, [slug]);

  // Live query
  const queryResult = useQuery(
    api.proposals.getPublic,
    slug ? { slug, token: sessionToken ?? undefined } : "skip" as any
  );

  const isLoading = queryResult === undefined;
  const rawProposal: any = queryResult ?? null;

  // requiresPassword and gating
  const requiresPassword = !!rawProposal?.requiresPassword;
  const hasValidSession = !!rawProposal?.hasValidSession;
  const showPasswordForm = requiresPassword && !hasValidSession && !sessionToken;

  // Adapt to legacy snake_case for utils
  const proposal: any = useMemo(() => toLegacyProposal(rawProposal), [rawProposal]);
  const discount = useMemo(
    () => summarizeDiscount({
      investmentValue: rawProposal?.investmentValue ?? 0,
      originalValue: rawProposal?.originalValue,
      scopePrices: rawProposal?.scopePrices,
      giftIndexes: rawProposal?.giftIndexes,
    }),
    [rawProposal],
  );

  const acceptanceDataRaw: any = useQuery(
    api.proposals.getAcceptanceByToken,
    rawProposal?.isAccepted && slug && sessionToken ? { slug, token: sessionToken } : "skip" as any
  ) ?? null;
  const contactInfo = useQuery(api.contactInfo.get);

  const acceptanceData: any = useMemo(() => {
    if (!acceptanceDataRaw) return null;
    return {
      client_name: acceptanceDataRaw.clientName,
      client_document: acceptanceDataRaw.clientDocument,
      client_email: acceptanceDataRaw.clientEmail,
      client_role: acceptanceDataRaw.clientRole ?? null,
      client_declaration: acceptanceDataRaw.clientDeclaration ?? null,
      accepted_at: new Date(acceptanceDataRaw.acceptedAt).toISOString(),
      ip_address: acceptanceDataRaw.ipAddress ?? null,
      user_agent: acceptanceDataRaw.userAgent ?? null,
      content_hash: acceptanceDataRaw.contentHash ?? null,
      proposal_version: String(acceptanceDataRaw.proposalVersion ?? 1),
    };
  }, [acceptanceDataRaw]);

  const isExpired = !!rawProposal?.isExpired;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/proposal/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'ERROR');
      }
      const result = await res.json();
      const token: string | undefined = result?.token;
      if (token) {
        setSessionToken(token);
        sessionStorage.setItem(`proposal_session_slug_${slug}`, token);
        toast.success("Acesso autorizado");
      } else {
        toast.error("Erro ao criar sessão");
      }
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      if (msg.toLowerCase().includes("invalid password") || msg.includes("incorreta")) {
        toast.error("Senha incorreta");
      } else {
        console.error("Error creating session:", error);
        toast.error(msg || "Erro ao criar sessão");
      }
    }
  };

  const calculateValidUntil = (createdAt: string | number | undefined) => {
    if (!createdAt) return "";
    const date = typeof createdAt === "number" ? new Date(createdAt) : new Date(createdAt);
    date.setDate(date.getDate() + 10);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDownloadPDF = async () => {
    if (!proposal || !acceptanceData) return;
    try {
      const signatureUrl = acceptanceDataRaw?.signatureUrl ?? "";
      await printContractPDF(proposal, acceptanceData, signatureUrl, contactInfo ?? undefined);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 50 }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center">Carregando proposta...</div>;
  }

  if (!rawProposal) {
    return <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center">Proposta não encontrada.</div>;
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-foreground/10 max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-neon-purple mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Acesso Protegido</h1>
              <p className="text-foreground/65">Esta proposta está protegida por senha. Informe a senha para continuar.</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-background border-input mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90">
                Acessar Proposta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground-strong font-sans selection:bg-neon-purple selection:text-primary-foreground overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none no-print">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-lime/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-accent-2/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        {rawProposal.isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-4 rounded-lg mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Esta proposta foi aceita eletronicamente</p>
                  {acceptanceData ? (
                    <p className="text-sm text-green-700/80 dark:text-green-300/80">
                      Aceita em {new Date(acceptanceData.accepted_at).toLocaleString('pt-BR')} por {acceptanceData.client_name}
                    </p>
                  ) : (
                    <p className="text-sm text-green-700/80 dark:text-green-300/80">Carregando informações do aceite...</p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleDownloadPDF}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                disabled={!acceptanceData}
              >
                <FileText className="w-4 h-4 mr-2" />
                Baixar PDF do Contrato
              </Button>
            </div>
          </motion.div>
        )}
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-8 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">Atenção: Esta proposta expirou em {calculateValidUntil(rawProposal.createdAt)}.</p>
          </motion.div>
        )}

        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={containerVariants}
          className="space-y-16"
        >
          <motion.header variants={itemVariants} className="text-center space-y-6">
            <Badge variant="outline" className="border-neon-purple text-neon-purple px-4 py-1 text-sm uppercase tracking-widest">
              Proposta Comercial
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground-strong via-foreground-strong/90 to-foreground/65">
              {rawProposal.title || `Projeto para ${rawProposal.clientName}`}
            </h1>
            <p className="text-xl text-foreground/65 max-w-2xl mx-auto">
              Preparado especialmente para <span className="text-foreground-strong font-semibold">{rawProposal.clientName}</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-foreground/42 mt-4">
              <div className="flex items-center gap-2 bg-foreground/5 px-4 py-2 rounded-full border border-foreground/10">
                <Calendar className="w-4 h-4 text-neon-purple" />
                <span>Criado em: {new Date(rawProposal.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 bg-foreground/5 px-4 py-2 rounded-full border border-foreground/10">
                <Clock className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-neon-lime"}`} />
                <span className={isExpired ? "text-red-600 dark:text-red-400" : ""}>Válido até: {calculateValidUntil(rawProposal.createdAt)}</span>
              </div>
            </div>
          </motion.header>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground-strong flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Apresentação
                </h2>
                <div className="text-lg text-foreground/90 leading-relaxed space-y-4 whitespace-pre-line">
                  {contactInfo?.proposalIntro || (
                    <>
                      <p>Olá, tudo bem?</p>
                      <p>
                      Antes de tudo, agradeço o interesse!{authorName && ` Sou ${authorName}.`}
                      </p>
                      <p>
                      Meu objetivo é simples: transformar sua visão em uma solução que seja simultaneamente elegante, escalável e inteligente. Vamos conversar sobre como isso pode funcionar no seu projeto?
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 md:p-10 space-y-4">
                <h2 className="text-2xl font-bold text-foreground-strong flex items-center gap-3">
                  <span className="w-1 h-8 bg-neon-purple rounded-full" />
                  Objetivo do Projeto
                </h2>
                <p className="text-lg text-foreground/90 leading-relaxed">
                  {rawProposal.objective}
                </p>
              </CardContent>
            </Card>
          </motion.section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-foreground/10 hover:border-neon-purple/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-foreground-strong flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-neon-purple" />
                    Escopo dos Serviços
                  </h2>
                  <ul className="space-y-4">
                    {rawProposal.scope?.map((item: string, index: number) => {
                      const price = discount.priceOf(index);
                      const isGift = discount.isGift(index);
                      return (
                        <li key={index} className="flex items-start gap-3 text-foreground/90 group">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple group-hover:scale-150 transition-transform" />
                          <span className="group-hover:text-foreground-strong transition-colors w-[95%]">
                            {item}
                            {price !== undefined && (
                              <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                                {isGift ? (
                                  <>
                                    <Badge className="bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 border-neon-lime/20">
                                      Brinde
                                    </Badge>
                                    <span className="sr-only">Valor original:</span>
                                    <s className="text-foreground/50">{formatCurrency(price)}</s>
                                    <span className="sr-only">Valor com desconto:</span>
                                    <span className="font-semibold text-neon-lime">{formatCurrency(0)}</span>
                                  </>
                                ) : (
                                  <span className="text-foreground/65">{formatCurrency(price)}</span>
                                )}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-foreground/10 hover:border-neon-lime/30 transition-colors duration-300">
                <CardContent className="p-8 space-y-6">
                  <h2 className="text-2xl font-bold text-foreground-strong flex items-center gap-3">
                    <Clock className="w-6 h-6 text-neon-lime" />
                    Cronograma Estimado
                  </h2>
                  <div className="relative pl-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neon-lime" />
                    <div className="space-y-8">
                      {rawProposal.timeline?.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isVisible ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: index * 0.1 }}
                          className="group relative"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <div className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full bg-border border border-neon-lime/40 group-hover:border-neon-lime transition-all duration-300 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-lime/50 group-hover:bg-neon-lime group-hover:scale-125 transition-all duration-300" />
                              </div>
                            </div>
                            <div className="flex-1 pt-0.5 space-y-1">
                              <h4 className="text-foreground-strong font-semibold text-base group-hover:text-neon-lime transition-colors duration-300">
                                {item.step}
                              </h4>
                              <p className="text-sm text-foreground/65 font-light">{item.period}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {rawProposal.deliveryDate && (
                    <div className="mt-4 pt-4 border-t border-foreground/10">
                      <p className="text-sm text-foreground/65">Entrega prevista: <span className="text-foreground-strong">{new Date(rawProposal.deliveryDate).toLocaleDateString('pt-BR')}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          </div>

          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-card to-background border-foreground/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-foreground-strong">Investimento Total</h2>
                    <p className="text-foreground/65 max-w-md">
                      Um investimento estratégico para elevar o nível do seu negócio e alcançar novos resultados.
                    </p>
                  </div>
                  <div className="text-center">
                    {discount.hasDiscount && (
                      <div className="flex items-center justify-center gap-3 mb-1">
                        <span className="sr-only">Valor original:</span>
                        <s className="text-xl md:text-2xl text-foreground/50">{formatCurrency(discount.originalValue)}</s>
                        <Badge className="bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border-neon-purple/20">
                          −{discount.discountPercent}%
                        </Badge>
                      </div>
                    )}
                    {discount.hasDiscount && <span className="sr-only">Valor com desconto:</span>}
                    <div className="text-5xl md:text-6xl font-bold text-foreground-strong tracking-tighter mb-2">
                      {formatCurrency(rawProposal.investmentValue)}
                    </div>
                    {discount.hasDiscount && (
                      <p className="text-sm text-foreground/65 mb-3">
                        Desconto de {formatCurrency(discount.discountAmount)}
                        {discount.giftCount > 0 &&
                          ` · ${discount.giftCount === 1 ? "1 item de brinde" : `${discount.giftCount} itens de brinde`}`}
                      </p>
                    )}
                    <Badge className="bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 border-neon-lime/20">
                      Pagamento Facilitado
                    </Badge>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-foreground/10 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground-strong mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-neon-purple" />
                      Formas de Pagamento
                    </h3>
                    <ul className="space-y-2">
                      {generatePaymentMethods(rawProposal.investmentValue).map((method: string, idx: number) => (
                        <li key={idx} className="text-foreground/65 flex items-center gap-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground-strong mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-neon-purple" />
                      Condições Gerais
                    </h3>
                    <ul className="space-y-2">
                      {rawProposal.conditions?.map((condition: string, idx: number) => (
                        <li key={idx} className="text-foreground/65 flex items-center gap-2">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-foreground/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardContent className="p-8 md:p-10 relative z-10">
                <Collapsible open={isRescisionOpen} onOpenChange={setIsRescisionOpen}>
                  <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer outline-none relative z-10">
                    <h2 className="text-2xl font-bold text-foreground-strong flex items-center gap-3">
                      <span className="w-1 h-8 bg-neon-purple rounded-full" />
                      Política de Rescisão
                    </h2>
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
          </motion.section>

          {!rawProposal.isAccepted && (
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
              <Button
                size="lg"
                className="bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground h-14 px-8 w-full sm:w-auto"
                onClick={() => {
                  if (sessionToken) {
                    sessionStorage.setItem(`proposal_session_slug_${slug}`, sessionToken);
                  }
                  setLocation(`/proposta/${id}/aceitar`);
                }}
              >
                <FileCheck className="mr-2 w-5 h-5" />
                Aceitar Proposta Eletronicamente
              </Button>
            </motion.div>
          )}

          {rawProposal.isAccepted && acceptanceData && (
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
              <Button
                size="lg"
                className="bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground h-14 px-8 w-full sm:w-auto"
                onClick={() => setShowContractModal(true)}
              >
                <FileText className="mr-2 w-5 h-5" />
                Ler Contrato
              </Button>
            </motion.div>
          )}

          <motion.footer variants={itemVariants} className="text-center border-t border-foreground/10 pt-8 pb-4">
            <p className="text-foreground/42 text-sm">
              © {new Date().getFullYear()} {authorName || siteConfig.site_name}. Todos os direitos reservados.
            </p>
            <p className="text-foreground/25 text-xs mt-2">
              Esta proposta é confidencial e destinada apenas ao cliente especificado.
            </p>
          </motion.footer>
        </motion.div>
      </div>

      {rawProposal.isAccepted && acceptanceData && (
        <ContractModal
          open={showContractModal}
          onOpenChange={setShowContractModal}
          proposal={proposal}
          clientData={{
            client_name: acceptanceData.client_name,
            client_document: acceptanceData.client_document,
            client_email: acceptanceData.client_email,
            client_role: acceptanceData.client_role || null,
            client_declaration: acceptanceData.client_declaration || null,
          }}
          sessionToken={null}
          onSign={handleDigitalSignature}
          isSigning={false}
        />
      )}
    </div>
  );

  async function handleDigitalSignature(signatureDataUrl: string) {
    if (!proposal || !acceptanceData) return;
    try {
      await printContractPDF(proposal, acceptanceData, signatureDataUrl, contactInfo ?? undefined);
      toast.success("PDF do contrato gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Erro ao gerar PDF");
    }
  }
}
